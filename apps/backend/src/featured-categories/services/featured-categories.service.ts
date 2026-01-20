/**
 * @file featured-categories.service.ts
 * @description Service for managing featured categories on homepage
 *
 * FEATURES:
 * - CRUD operations for featured categories
 * - Active category filtering with date validation
 * - Sorting by display order
 * - Category existence validation
 * - Business rule enforcement
 * - Syrian market support (bilingual content, scheduling)
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { FeaturedCategory } from '../entities/featured-category.entity';
import { Category } from '../../categories/entities/category.entity';
import { CreateFeaturedCategoryDto } from '../dto/create-featured-category.dto';
import { UpdateFeaturedCategoryDto } from '../dto/update-featured-category.dto';

/**
 * Service for Featured Categories Management
 *
 * Handles all business logic for creating, updating, and retrieving
 * featured categories with validation and scheduling support.
 */
@Injectable()
export class FeaturedCategoriesService {
  constructor(
    @InjectRepository(FeaturedCategory)
    private readonly featuredCategoryRepository: Repository<FeaturedCategory>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Create a new featured category
   *
   * @param createDto - DTO with featured category data
   * @returns Created featured category with category relation
   * @throws NotFoundException if category doesn't exist
   * @throws BadRequestException if validation fails
   */
  async create(createDto: CreateFeaturedCategoryDto): Promise<FeaturedCategory> {
    // Validate that category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createDto.categoryId} not found`);
    }

    // Validate that category is active and approved
    if (!category.isActive || category.approvalStatus !== 'approved') {
      throw new BadRequestException(
        `Category must be active and approved to be featured`,
      );
    }

    // Create entity
    const featuredCategory = this.featuredCategoryRepository.create({
      ...createDto,
      startDate: createDto.startDate ? new Date(createDto.startDate) : null,
      endDate: createDto.endDate ? new Date(createDto.endDate) : null,
    });

    // Validate business rules
    const validationErrors = featuredCategory.validate();
    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors.join(', '));
    }

    // Check maximum active featured categories (12)
    const activeCount = await this.getActiveCount();
    if (activeCount >= 12 && featuredCategory.isCurrentlyActive()) {
      throw new ConflictException(
        'Maximum of 12 active featured categories reached. Please deactivate existing ones.',
      );
    }

    // Save and return with relations
    const saved = await this.featuredCategoryRepository.save(featuredCategory);
    return this.findOne(saved.id);
  }

  /**
   * Get all featured categories with optional filters
   *
   * @param limit - Maximum number of results (default: 20)
   * @param activeOnly - Filter only currently active categories
   * @returns Array of featured categories with category relations
   */
  async findAll(limit: number = 20, activeOnly: boolean = false): Promise<FeaturedCategory[]> {
    const queryBuilder = this.featuredCategoryRepository
      .createQueryBuilder('fc')
      .leftJoinAndSelect('fc.category', 'category')
      .orderBy('fc.displayOrder', 'ASC')
      .take(Math.min(limit, 20)); // Enforce maximum limit of 20

    if (activeOnly) {
      const now = new Date();
      queryBuilder
        .where('fc.isActive = :isActive', { isActive: true })
        .andWhere('(fc.startDate IS NULL OR fc.startDate <= :now)', { now })
        .andWhere('(fc.endDate IS NULL OR fc.endDate > :now)', { now });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get active featured categories for public homepage
   *
   * Filters categories that are:
   * - isActive = true
   * - startDate is null or in the past
   * - endDate is null or in the future
   * - Category is active and approved
   *
   * @param limit - Maximum number of results (default: 12, max: 20)
   * @returns Array of active featured categories sorted by displayOrder
   */
  async findActive(limit: number = 12): Promise<FeaturedCategory[]> {
    const now = new Date();
    const maxLimit = Math.min(limit, 20);

    return this.featuredCategoryRepository
      .createQueryBuilder('fc')
      .leftJoinAndSelect('fc.category', 'category')
      .where('fc.isActive = :isActive', { isActive: true })
      .andWhere('(fc.startDate IS NULL OR fc.startDate <= :now)', { now })
      .andWhere('(fc.endDate IS NULL OR fc.endDate > :now)', { now })
      .andWhere('category.isActive = :categoryActive', { categoryActive: true })
      .andWhere('category.approvalStatus = :approvalStatus', { approvalStatus: 'approved' })
      .orderBy('fc.displayOrder', 'ASC')
      .take(maxLimit)
      .getMany();
  }

  /**
   * Get a single featured category by ID
   *
   * @param id - Featured category UUID
   * @returns Featured category with category relation
   * @throws NotFoundException if not found
   */
  async findOne(id: number): Promise<FeaturedCategory> {
    const featuredCategory = await this.featuredCategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!featuredCategory) {
      throw new NotFoundException(`Featured category with ID ${id} not found`);
    }

    return featuredCategory;
  }

  /**
   * Update an existing featured category
   *
   * @param id - Featured category UUID
   * @param updateDto - DTO with fields to update
   * @returns Updated featured category
   * @throws NotFoundException if not found
   * @throws BadRequestException if validation fails
   */
  async update(
    id: number,
    updateDto: UpdateFeaturedCategoryDto,
  ): Promise<FeaturedCategory> {
    const featuredCategory = await this.findOne(id);

    // If updating category, validate it exists
    if (updateDto.categoryId && updateDto.categoryId !== featuredCategory.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateDto.categoryId} not found`);
      }

      if (!category.isActive || category.approvalStatus !== 'approved') {
        throw new BadRequestException(
          `Category must be active and approved to be featured`,
        );
      }
    }

    // Merge updates
    Object.assign(featuredCategory, {
      ...updateDto,
      startDate: updateDto.startDate ? new Date(updateDto.startDate) : featuredCategory.startDate,
      endDate: updateDto.endDate ? new Date(updateDto.endDate) : featuredCategory.endDate,
    });

    // Validate business rules
    const validationErrors = featuredCategory.validate();
    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors.join(', '));
    }

    // Save and return
    await this.featuredCategoryRepository.save(featuredCategory);
    return this.findOne(id);
  }

  /**
   * Soft delete a featured category
   *
   * @param id - Featured category UUID
   * @returns void
   * @throws NotFoundException if not found
   */
  async remove(id: number): Promise<void> {
    const featuredCategory = await this.findOne(id);
    await this.featuredCategoryRepository.softDelete(id);
  }

  /**
   * Get count of currently active featured categories
   *
   * @returns Number of active featured categories
   */
  async getActiveCount(): Promise<number> {
    const now = new Date();

    return this.featuredCategoryRepository
      .createQueryBuilder('fc')
      .where('fc.isActive = :isActive', { isActive: true })
      .andWhere('(fc.startDate IS NULL OR fc.startDate <= :now)', { now })
      .andWhere('(fc.endDate IS NULL OR fc.endDate > :now)', { now })
      .getCount();
  }

  /**
   * Get featured categories that need admin attention
   *
   * @returns Array of featured categories requiring action
   */
  async getNeedingAttention(): Promise<FeaturedCategory[]> {
    const categories = await this.featuredCategoryRepository.find({
      relations: ['category'],
    });

    return categories.filter((fc) => fc.needsAdminAttention());
  }

  /**
   * Bulk update display orders
   *
   * @param updates - Array of { id, displayOrder } objects
   * @returns void
   */
  async bulkUpdateDisplayOrders(
    updates: Array<{ id: string; displayOrder: number }>,
  ): Promise<void> {
    await Promise.all(
      updates.map((update) =>
        this.featuredCategoryRepository.update(update.id, {
          displayOrder: update.displayOrder,
        }),
      ),
    );
  }
}
