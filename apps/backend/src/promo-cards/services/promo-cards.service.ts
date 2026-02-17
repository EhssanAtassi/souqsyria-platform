/**
 * @file promo-cards.service.ts
 * @description Service for managing promotional cards with Redis caching
 *
 * FEATURES:
 * - Complete CRUD operations with validation
 * - Redis caching with 5-minute TTL for active cards
 * - Campaign scheduling validation
 * - Real-time analytics tracking (impressions, clicks)
 * - Approval workflow management
 * - Position constraint validation (max 2 cards, positions 1 and 2)
 * - Performance scoring
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
  In,
} from 'typeorm';
import { PromoCard } from '../entities/promo-card.entity';
import {
  CreatePromoCardDto,
  UpdatePromoCardDto,
  TrackImpressionDto,
  TrackClickDto,
  QueryPromoCardsDto,
  PaginatedPromoCardsResponseDto,
  PaginationMetaDto,
  PromoCardPublicResponseDto,
  PromoCardAdminResponseDto,
  PromoCardAnalyticsDto,
} from '../dto';

/**
 * PromoCards Service
 *
 * Manages promotional cards for hero banner 70/30 layout with:
 * - Redis caching for performance
 * - Position constraint validation
 * - Analytics tracking
 * - Approval workflow
 */
@Injectable()
export class PromoCardsService {
  private readonly logger = new Logger(PromoCardsService.name);

  /** In-memory cache (replaces Redis) */
  private readonly _cache = new Map<
    string,
    { value: string; expiresAt: number }
  >();

  private _cacheGet(key: string): string | null {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return null;
    }
    return entry.value;
  }

  private _cacheSet(key: string, value: string, ttlSeconds: number): void {
    this._cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  private _cacheDel(key: string): boolean {
    return this._cache.delete(key);
  }

  private _cacheIncr(key: string, ttlSeconds: number = 3600): number {
    const entry = this._cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this._cache.set(key, {
        value: '1',
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return 1;
    }
    const newVal = parseInt(entry.value, 10) + 1;
    entry.value = String(newVal);
    return newVal;
  }
  private readonly CACHE_KEY_PREFIX = 'promo-cards';
  private readonly CACHE_TTL = 300; // 5 minutes in seconds
  private readonly MAX_CARDS_PER_POSITION = 2; // Maximum 2 cards total (1 per position)

  constructor(
    @InjectRepository(PromoCard)
    private readonly promoCardRepository: Repository<PromoCard>,
  ) {}

  // ================================
  // CRUD OPERATIONS
  // ================================

  /**
   * Create a new promotional card
   *
   * @param createDto Card creation data
   * @param userId User ID creating the card
   * @returns Created card entity
   * @throws ConflictException if position is already occupied by an active card
   */
  async create(
    createDto: CreatePromoCardDto,
    userId?: string,
  ): Promise<PromoCard> {
    this.logger.log(
      `Creating new promo card: ${createDto.titleEn} at position ${createDto.position}`,
    );

    // Validate schedule dates if provided
    if (createDto.startDate && createDto.endDate) {
      this.validateScheduleDates(createDto.startDate, createDto.endDate);
    }

    // Validate position availability
    await this.validatePositionAvailability(createDto.position);

    // Create card entity
    const card = this.promoCardRepository.create({
      ...createDto,
      createdBy: userId,
      approvalStatus: 'draft',
      isActive: false,
      impressions: 0,
      clicks: 0,
    });

    try {
      const savedCard = await this.promoCardRepository.save(card);
      this.logger.log(`Promo card created successfully: ${savedCard.id}`);

      // Clear cache
      await this.clearCache();

      return savedCard;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create promo card: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Failed to create promo card');
    }
  }

  /**
   * Find all promo cards with optional filtering, sorting, and pagination
   *
   * @param queryDto Query parameters
   * @returns Paginated cards with metadata
   */
  async findAll(
    queryDto: QueryPromoCardsDto,
  ): Promise<PaginatedPromoCardsResponseDto<PromoCard>> {
    this.logger.log('Fetching promo cards with filters');

    const {
      isActive,
      approvalStatus,
      position,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    // Build query
    const queryBuilder = this.promoCardRepository.createQueryBuilder('card');

    // Apply filters
    if (isActive !== undefined) {
      queryBuilder.andWhere('card.isActive = :isActive', { isActive });
    }

    if (approvalStatus) {
      queryBuilder.andWhere('card.approvalStatus = :approvalStatus', {
        approvalStatus,
      });
    }

    if (position) {
      queryBuilder.andWhere('card.position = :position', { position });
    }

    // Exclude soft-deleted
    queryBuilder.andWhere('card.deletedAt IS NULL');

    // Apply sorting
    const sortField = `card.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [cards, totalItems] = await queryBuilder.getManyAndCount();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    const meta: PaginationMetaDto = {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    this.logger.log(
      `Fetched ${cards.length} promo cards (total: ${totalItems})`,
    );

    return {
      data: cards,
      meta,
    };
  }

  /**
   * Get active promo cards for public display (with Redis caching)
   *
   * Returns only approved, active cards within schedule
   * Cached for 5 minutes for optimal performance
   *
   * @returns Active cards sorted by position
   */
  async getActiveCards(): Promise<PromoCard[]> {
    this.logger.log('Fetching active promo cards for public display');

    // Try to get from cache
    const cacheKey = `${this.CACHE_KEY_PREFIX}:active`;
    const cachedData = this._cacheGet(cacheKey);

    if (cachedData) {
      this.logger.log('Returning cached active promo cards');
      return JSON.parse(cachedData);
    }

    // Fetch from database
    const now = new Date();

    const cards = await this.promoCardRepository.find({
      where: {
        isActive: true,
        approvalStatus: 'approved',
        deletedAt: IsNull(),
      },
      order: {
        position: 'ASC',
        createdAt: 'DESC',
      },
    });

    // Filter by schedule
    const activeCards = cards.filter((card) => {
      const withinSchedule =
        (!card.startDate || now >= card.startDate) &&
        (!card.endDate || now <= card.endDate);
      return withinSchedule;
    });

    // Cache the results
    this._cacheSet(cacheKey, JSON.stringify(activeCards), this.CACHE_TTL);

    this.logger.log(`Found ${activeCards.length} active promo cards`);
    return activeCards;
  }

  /**
   * Find a single promo card by ID
   *
   * @param id Card UUID
   * @returns Card entity
   * @throws NotFoundException if card not found
   */
  async findOne(id: string): Promise<PromoCard> {
    this.logger.log(`Fetching promo card: ${id}`);

    const card = await this.promoCardRepository.findOne({
      where: { id },
    });

    if (!card) {
      throw new NotFoundException(`Promo card with ID ${id} not found`);
    }

    return card;
  }

  /**
   * Update a promo card
   *
   * @param id Card UUID
   * @param updateDto Update data
   * @param userId User ID performing the update
   * @returns Updated card entity
   * @throws NotFoundException if card not found
   * @throws ConflictException if position change conflicts with existing card
   */
  async update(
    id: string,
    updateDto: UpdatePromoCardDto,
    userId?: string,
  ): Promise<PromoCard> {
    this.logger.log(`Updating promo card: ${id}`);

    const card = await this.findOne(id);

    // Validate schedule dates if provided
    if (updateDto.startDate || updateDto.endDate) {
      const startDate = updateDto.startDate || card.startDate;
      const endDate = updateDto.endDate || card.endDate;
      if (startDate && endDate) {
        this.validateScheduleDates(startDate, endDate);
      }
    }

    // Validate position change if provided
    if (updateDto.position && updateDto.position !== card.position) {
      await this.validatePositionAvailability(updateDto.position, id);
    }

    // Update fields
    Object.assign(card, updateDto);
    card.updatedBy = userId;

    try {
      const updatedCard = await this.promoCardRepository.save(card);
      this.logger.log(`Promo card updated successfully: ${id}`);

      // Clear cache
      await this.clearCache();

      return updatedCard;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update promo card: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Failed to update promo card');
    }
  }

  /**
   * Soft delete a promo card
   *
   * @param id Card UUID
   * @returns Deleted card entity
   * @throws NotFoundException if card not found
   */
  async remove(id: string): Promise<PromoCard> {
    this.logger.log(`Soft deleting promo card: ${id}`);

    const card = await this.findOne(id);

    try {
      await this.promoCardRepository.softDelete(id);
      card.deletedAt = new Date();
      this.logger.log(`Promo card soft deleted successfully: ${id}`);

      // Clear cache
      await this.clearCache();

      return card;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to delete promo card: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Failed to delete promo card');
    }
  }

  /**
   * Restore a soft-deleted promo card
   *
   * @param id Card UUID
   * @returns Restored card entity
   * @throws NotFoundException if card not found
   * @throws BadRequestException if card is not deleted
   */
  async restore(id: string): Promise<PromoCard> {
    this.logger.log(`Restoring soft-deleted promo card: ${id}`);

    const card = await this.promoCardRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!card) {
      throw new NotFoundException(`Promo card with ID ${id} not found`);
    }

    if (!card.deletedAt) {
      throw new BadRequestException(`Promo card ${id} is not deleted`);
    }

    try {
      await this.promoCardRepository.restore(id);
      card.deletedAt = null;
      this.logger.log(`Promo card restored successfully: ${id}`);

      // Clear cache
      await this.clearCache();

      return card;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to restore promo card: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Failed to restore promo card');
    }
  }

  // ================================
  // ANALYTICS TRACKING
  // ================================

  /**
   * Track card impression
   *
   * Records when a card is viewed
   *
   * @param trackDto Impression tracking data
   */
  async trackImpression(trackDto: TrackImpressionDto): Promise<void> {
    this.logger.log(`Tracking impression for card: ${trackDto.cardId}`);

    // Verify card exists
    await this.findOne(trackDto.cardId);

    // Atomic increment to prevent race conditions under concurrent requests
    await this.promoCardRepository.increment(
      { id: trackDto.cardId },
      'impressions',
      1,
    );

    // Clear cache to reflect updated analytics
    await this.clearCache();

    this.logger.log(
      `Impression tracked successfully for card: ${trackDto.cardId}`,
    );
  }

  /**
   * Track card click
   *
   * Records when a card is clicked
   *
   * @param trackDto Click tracking data
   */
  async trackClick(trackDto: TrackClickDto): Promise<void> {
    this.logger.log(`Tracking click for card: ${trackDto.cardId}`);

    // Verify card exists
    await this.findOne(trackDto.cardId);

    // Atomic increment to prevent race conditions under concurrent requests
    await this.promoCardRepository.increment(
      { id: trackDto.cardId },
      'clicks',
      1,
    );

    // Clear cache to reflect updated analytics
    await this.clearCache();

    this.logger.log(`Click tracked successfully for card: ${trackDto.cardId}`);
  }

  /**
   * Get analytics for a specific card
   *
   * @param id Card UUID
   * @returns Aggregated analytics data
   */
  async getAnalytics(id: string): Promise<PromoCardAnalyticsDto> {
    this.logger.log(`Fetching analytics for card: ${id}`);

    const card = await this.findOne(id);

    return {
      cardId: card.id,
      impressions: card.impressions,
      clicks: card.clicks,
      clickThroughRate: card.calculateClickThroughRate(),
      performanceScore: card.getPerformanceScore(),
      daysActive: card.getDaysActive(),
      lastUpdated: card.updatedAt,
    };
  }

  // ================================
  // APPROVAL WORKFLOW
  // ================================

  /**
   * Submit card for approval
   *
   * @param id Card UUID
   * @param userId User ID submitting for approval
   * @returns Updated card
   */
  async submitForApproval(id: string, userId?: string): Promise<PromoCard> {
    this.logger.log(`Submitting card for approval: ${id}`);

    const card = await this.findOne(id);

    if (card.approvalStatus !== 'draft' && card.approvalStatus !== 'rejected') {
      throw new BadRequestException(
        `Card cannot be submitted for approval in ${card.approvalStatus} status`,
      );
    }

    card.approvalStatus = 'pending';
    card.updatedBy = userId;

    const updatedCard = await this.promoCardRepository.save(card);

    // Clear cache
    await this.clearCache();

    return updatedCard;
  }

  /**
   * Approve a card
   *
   * @param id Card UUID
   * @param adminId Admin user ID approving the card
   * @returns Approved card
   */
  async approve(id: string, adminId: string): Promise<PromoCard> {
    this.logger.log(`Approving card: ${id} by admin: ${adminId}`);

    const card = await this.findOne(id);

    if (card.approvalStatus !== 'pending') {
      throw new BadRequestException(
        `Card cannot be approved in ${card.approvalStatus} status`,
      );
    }

    card.approvalStatus = 'approved';
    card.updatedBy = adminId;

    const updatedCard = await this.promoCardRepository.save(card);

    // Clear cache
    await this.clearCache();

    return updatedCard;
  }

  /**
   * Reject a card
   *
   * @param id Card UUID
   * @param adminId Admin user ID rejecting the card
   * @returns Rejected card
   */
  async reject(id: string, adminId: string): Promise<PromoCard> {
    this.logger.log(`Rejecting card: ${id} by admin: ${adminId}`);

    const card = await this.findOne(id);

    if (card.approvalStatus !== 'pending') {
      throw new BadRequestException(
        `Card cannot be rejected in ${card.approvalStatus} status`,
      );
    }

    card.approvalStatus = 'rejected';
    card.updatedBy = adminId;

    const updatedCard = await this.promoCardRepository.save(card);

    // Clear cache
    await this.clearCache();

    return updatedCard;
  }

  // ================================
  // BULK OPERATIONS
  // ================================

  /**
   * Bulk activate/deactivate cards
   *
   * @param ids Array of card UUIDs
   * @param isActive Active status to set
   * @returns Number of updated cards
   */
  async bulkUpdateActiveStatus(
    ids: string[],
    isActive: boolean,
  ): Promise<number> {
    this.logger.log(
      `Bulk updating active status for ${ids.length} cards to ${isActive}`,
    );

    const result = await this.promoCardRepository.update(
      { id: In(ids) },
      { isActive },
    );

    // Clear cache
    await this.clearCache();

    this.logger.log(`Bulk updated ${result.affected} cards`);
    return result.affected || 0;
  }

  /**
   * Bulk delete cards
   *
   * @param ids Array of card UUIDs
   * @returns Number of deleted cards
   */
  async bulkDelete(ids: string[]): Promise<number> {
    this.logger.log(`Bulk soft deleting ${ids.length} cards`);

    const result = await this.promoCardRepository.softDelete({ id: In(ids) });

    // Clear cache
    await this.clearCache();

    this.logger.log(`Bulk deleted ${result.affected} cards`);
    return result.affected || 0;
  }

  // ================================
  // PRIVATE HELPERS
  // ================================

  /**
   * Validate schedule dates
   *
   * @param startDate Schedule start date
   * @param endDate Schedule end date
   * @throws BadRequestException if dates are invalid
   */
  private validateScheduleDates(startDate: Date, endDate: Date): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate not too far in the future (2 years max)
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

    if (end > twoYearsFromNow) {
      throw new BadRequestException(
        'End date cannot be more than 2 years in the future',
      );
    }
  }

  /**
   * Validate position availability
   *
   * @param position Position to validate (1 or 2)
   * @param excludeCardId Optional card ID to exclude from check (for updates)
   * @throws ConflictException if position is already occupied
   */
  private async validatePositionAvailability(
    position: 1 | 2,
    excludeCardId?: string,
  ): Promise<void> {
    const queryBuilder = this.promoCardRepository
      .createQueryBuilder('card')
      .where('card.position = :position', { position })
      .andWhere('card.isActive = :isActive', { isActive: true })
      .andWhere('card.approvalStatus = :approvalStatus', {
        approvalStatus: 'approved',
      })
      .andWhere('card.deletedAt IS NULL');

    if (excludeCardId) {
      queryBuilder.andWhere('card.id != :excludeCardId', { excludeCardId });
    }

    const existingCard = await queryBuilder.getOne();

    if (existingCard) {
      throw new ConflictException(
        `Position ${position} is already occupied by an active approved card. Please deactivate the existing card first.`,
      );
    }
  }

  /**
   * Clear Redis cache for promo cards
   * Uses explicit key deletion instead of KEYS command for production safety
   */
  private async clearCache(): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:active`;
      const deleted = this._cacheDel(cacheKey);
      if (deleted) {
        this.logger.log(`Cleared promo cards cache key: ${cacheKey}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Failed to clear cache: ${(error as Error).message}`);
      // Don't throw error, cache clearing is not critical
    }
  }
}
