/**
 * @file quick-access.service.ts
 * @description Service for managing Quick Access promotional cards
 *
 * Handles all business logic for promotional cards including:
 * - Public retrieval with caching
 * - Admin CRUD operations
 * - Display order management
 * - Soft delete and restore
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { QuickAccess } from '../entities/quick-access.entity';
import {
  CreateQuickAccessDto,
  UpdateQuickAccessDto,
  QuickAccessQueryDto,
  ReorderQuickAccessDto,
} from '../dto';

/**
 * QuickAccessService
 *
 * @description Service layer for Quick Access promotional cards.
 * Implements caching for public endpoints and comprehensive admin operations.
 */
@Injectable()
export class QuickAccessService {
  /** Logger instance for QuickAccessService */
  private readonly logger = new Logger(QuickAccessService.name);

  /** Cache key for public promotional cards */
  private readonly CACHE_KEY = 'quick_access:public';

  /** Cache TTL in seconds (5 minutes) */
  private readonly CACHE_TTL = 300;

  constructor(
    @InjectRepository(QuickAccess)
    private readonly quickAccessRepository: Repository<QuickAccess>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get all active promotional cards (public)
   *
   * @description Retrieves active promotional cards sorted by display order.
   * Results are cached for 5 minutes to reduce database load.
   *
   * @returns Array of active QuickAccess items
   *
   * @example
   * const cards = await quickAccessService.findAll();
   */
  async findAll(): Promise<QuickAccess[]> {
    // Try to get from cache first
    const cached = await this.cacheManager.get<QuickAccess[]>(this.CACHE_KEY);
    if (cached) {
      this.logger.debug('🎯 Returning cached quick access items');
      return cached;
    }

    // Fetch from database
    const items = await this.quickAccessRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    // Cache the results
    await this.cacheManager.set(this.CACHE_KEY, items, this.CACHE_TTL);
    this.logger.log(`📦 Cached ${items.length} quick access items`);

    return items;
  }

  /**
   * Get all promotional cards with filters (admin)
   *
   * @description Retrieves promotional cards with optional filters.
   * Can include inactive and soft-deleted items for admin management.
   *
   * @param queryDto - Filter and pagination options
   * @returns Object with items array and total count
   *
   * @example
   * const result = await quickAccessService.findAllAdmin({
   *   isActive: true,
   *   limit: 20,
   *   offset: 0
   * });
   */
  async findAllAdmin(queryDto: QuickAccessQueryDto): Promise<{
    items: QuickAccess[];
    total: number;
  }> {
    const { isActive, badgeClass, limit = 20, offset = 0, includeDeleted = false } = queryDto;

    const queryBuilder = this.quickAccessRepository.createQueryBuilder('qa');

    // Apply filters
    if (isActive !== undefined) {
      queryBuilder.andWhere('qa.isActive = :isActive', { isActive });
    }

    if (badgeClass) {
      queryBuilder.andWhere('qa.badgeClass = :badgeClass', { badgeClass });
    }

    // Include soft-deleted items if requested
    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    // Apply ordering
    queryBuilder.orderBy('qa.displayOrder', 'ASC').addOrderBy('qa.createdAt', 'DESC');

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const items = await queryBuilder.getMany();

    this.logger.log(`📋 Retrieved ${items.length} quick access items (total: ${total})`);

    return { items, total };
  }

  /**
   * Get a single promotional card by ID
   *
   * @param id - UUID of the promotional card
   * @param includeDeleted - Whether to include soft-deleted items
   * @returns QuickAccess entity
   * @throws NotFoundException if item not found
   *
   * @example
   * const card = await quickAccessService.findOne('550e8400-e29b-41d4-a716-446655440000');
   */
  async findOne(id: string, includeDeleted = false): Promise<QuickAccess> {
    const queryBuilder = this.quickAccessRepository.createQueryBuilder('qa')
      .where('qa.id = :id', { id });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    const item = await queryBuilder.getOne();

    if (!item) {
      throw new NotFoundException(`Quick access item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Create a new promotional card
   *
   * @param createDto - Card creation data
   * @returns Created QuickAccess entity
   *
   * @example
   * const card = await quickAccessService.create({
   *   categoryEn: 'Premium Deals',
   *   categoryAr: 'عروض مميزة',
   *   titleEn: 'Damascene Delights',
   *   titleAr: 'المأكولات الدمشقية',
   *   badgeClass: 'badge-gold',
   *   image: 'https://cdn.souqsyria.com/promos/damascene.jpg',
   *   url: '/category/damascene-sweets'
   * });
   */
  async create(createDto: CreateQuickAccessDto): Promise<QuickAccess> {
    // If no display order provided, get the next available order
    if (createDto.displayOrder === undefined) {
      const maxOrder = await this.quickAccessRepository
        .createQueryBuilder('qa')
        .select('MAX(qa.displayOrder)', 'max')
        .getRawOne();

      createDto.displayOrder = (maxOrder?.max || 0) + 1;
    }

    const item = this.quickAccessRepository.create(createDto);
    const saved = await this.quickAccessRepository.save(item);

    // Invalidate cache
    await this.invalidateCache();

    this.logger.log(`✅ Created new quick access item: ${saved.titleEn}`);
    return saved;
  }

  /**
   * Update an existing promotional card
   *
   * @param id - UUID of the card to update
   * @param updateDto - Update data
   * @returns Updated QuickAccess entity
   * @throws NotFoundException if item not found
   *
   * @example
   * const updated = await quickAccessService.update(
   *   '550e8400-e29b-41d4-a716-446655440000',
   *   { isActive: false }
   * );
   */
  async update(id: string, updateDto: UpdateQuickAccessDto): Promise<QuickAccess> {
    const item = await this.findOne(id);

    Object.assign(item, updateDto);
    const updated = await this.quickAccessRepository.save(item);

    // Invalidate cache
    await this.invalidateCache();

    this.logger.log(`📝 Updated quick access item: ${updated.titleEn}`);
    return updated;
  }

  /**
   * Soft delete a promotional card
   *
   * @param id - UUID of the card to delete
   * @returns Success message
   * @throws NotFoundException if item not found
   *
   * @example
   * await quickAccessService.remove('550e8400-e29b-41d4-a716-446655440000');
   */
  async remove(id: string): Promise<{ message: string }> {
    const item = await this.findOne(id);

    await this.quickAccessRepository.softDelete(id);

    // Invalidate cache
    await this.invalidateCache();

    this.logger.log(`🗑️ Soft deleted quick access item: ${item.titleEn}`);
    return { message: 'Quick access item deleted successfully' };
  }

  /**
   * Restore a soft-deleted promotional card
   *
   * @param id - UUID of the card to restore
   * @returns Restored QuickAccess entity
   * @throws NotFoundException if item not found
   * @throws ConflictException if item is not deleted
   *
   * @example
   * const restored = await quickAccessService.restore('550e8400-e29b-41d4-a716-446655440000');
   */
  async restore(id: string): Promise<QuickAccess> {
    const item = await this.findOne(id, true);

    if (!item.deletedAt) {
      throw new ConflictException('Quick access item is not deleted');
    }

    await this.quickAccessRepository.restore(id);

    // Reload the item
    const restored = await this.findOne(id);

    // Invalidate cache
    await this.invalidateCache();

    this.logger.log(`♻️ Restored quick access item: ${restored.titleEn}`);
    return restored;
  }

  /**
   * Update display order for multiple cards
   *
   * @description Batch updates display order in a single transaction.
   * Used for drag-and-drop reordering in admin interface.
   *
   * @param reorderDto - Array of items with new display orders
   * @returns Success message
   *
   * @example
   * await quickAccessService.reorder({
   *   items: [
   *     { id: 'uuid-1', displayOrder: 0 },
   *     { id: 'uuid-2', displayOrder: 1 },
   *     { id: 'uuid-3', displayOrder: 2 }
   *   ]
   * });
   */
  async reorder(reorderDto: ReorderQuickAccessDto): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update each item's display order
      for (const item of reorderDto.items) {
        await queryRunner.manager.update(
          QuickAccess,
          { id: item.id },
          { displayOrder: item.displayOrder }
        );
      }

      await queryRunner.commitTransaction();

      // Invalidate cache
      await this.invalidateCache();

      this.logger.log(`🔄 Reordered ${reorderDto.items.length} quick access items`);
      return { message: 'Display order updated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Invalidate the quick access cache
   *
   * @description Clears cached promotional cards to force fresh database fetch.
   * Called automatically after any modification operation.
   */
  private async invalidateCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
    this.logger.debug('🔄 Quick access cache invalidated');
  }
}