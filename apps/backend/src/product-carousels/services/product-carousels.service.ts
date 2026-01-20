/**
 * @file product-carousels.service.ts
 * @description Service for managing product carousels with dynamic population logic
 *
 * FEATURES:
 * - CRUD operations for product carousels
 * - Dynamic product population based on carousel type
 * - Active carousel filtering
 * - Business rule enforcement
 * - Syrian market support (bilingual, mobile-first)
 *
 * POPULATION STRATEGIES:
 * - new_arrivals: Recent products (ORDER BY createdAt DESC)
 * - best_sellers: Top selling products (ORDER BY totalSales DESC)
 * - trending: High engagement products (views + cart additions in last 7 days)
 * - recommended: User-specific recommendations (basic mock for now)
 * - custom: Manually curated via junction table
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
import { Repository, MoreThan } from 'typeorm';
import { ProductCarousel, CarouselType } from '../entities/product-carousel.entity';
import { ProductCarouselItem } from '../entities/product-carousel-item.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { CreateProductCarouselDto } from '../dto/create-product-carousel.dto';
import { UpdateProductCarouselDto } from '../dto/update-product-carousel.dto';

/**
 * Product Carousels Service
 *
 * Manages product carousels with intelligent dynamic population
 * and Syrian market optimization.
 */
@Injectable()
export class ProductCarouselsService {
  constructor(
    @InjectRepository(ProductCarousel)
    private readonly carouselRepository: Repository<ProductCarousel>,

    @InjectRepository(ProductCarouselItem)
    private readonly carouselItemRepository: Repository<ProductCarouselItem>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  /**
   * Create a new product carousel
   *
   * @param createDto - DTO with carousel configuration
   * @returns Created carousel
   * @throws BadRequestException if validation fails
   */
  async create(createDto: CreateProductCarouselDto): Promise<ProductCarousel> {
    // Create entity
    const carousel = this.carouselRepository.create(createDto);

    // Validate business rules
    const validationErrors = carousel.validate();
    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors.join(', '));
    }

    // Save and return
    return this.carouselRepository.save(carousel);
  }

  /**
   * Get all carousels with optional filters
   *
   * @param filters - Query filters
   * @returns Array of carousels
   */
  async findAll(filters?: {
    types?: CarouselType[];
    limit?: number;
    activeOnly?: boolean;
  }): Promise<ProductCarousel[]> {
    const queryBuilder = this.carouselRepository
      .createQueryBuilder('carousel')
      .orderBy('carousel.displayOrder', 'ASC');

    // Filter by types
    if (filters?.types && filters.types.length > 0) {
      queryBuilder.andWhere('carousel.type IN (:...types)', { types: filters.types });
    }

    // Filter active only
    if (filters?.activeOnly) {
      queryBuilder.andWhere('carousel.isActive = :isActive', { isActive: true });
    }

    // Apply limit
    if (filters?.limit) {
      queryBuilder.take(filters.limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Get a single carousel by ID
   *
   * @param id - Carousel UUID
   * @returns Carousel
   * @throws NotFoundException if not found
   */
  async findOne(id: number): Promise<ProductCarousel> {
    const carousel = await this.carouselRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!carousel) {
      throw new NotFoundException(`Product carousel with ID ${id} not found`);
    }

    return carousel;
  }

  /**
   * Get populated carousel with products
   *
   * This is the main method used by the homepage to get carousels
   * with their associated products based on the carousel type.
   *
   * @param id - Carousel UUID
   * @returns Carousel with populated products array
   * @throws NotFoundException if not found
   */
  async getPopulatedCarousel(id: number): Promise<any> {
    const carousel = await this.findOne(id);

    // Get products based on carousel type
    let products: ProductEntity[] = [];

    if (carousel.isDynamic()) {
      products = await this.getDynamicProducts(carousel);
    } else {
      // Custom carousel - get manually assigned products
      products = carousel.items
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((item) => item.product);
    }

    // Return plain object with products
    const { items, ...carouselData } = carousel;
    return {
      ...carouselData,
      products,
    };
  }

  /**
   * Get all active carousels with populated products
   *
   * This is the primary method used by the homepage API.
   *
   * @param filters - Query filters
   * @returns Array of carousels with products
   */
  async findActiveWithProducts(filters?: {
    types?: CarouselType[];
    limit?: number;
  }): Promise<any[]> {
    const carousels = await this.findAll({
      ...filters,
      activeOnly: true,
    });

    // Populate products for each carousel
    return Promise.all(
      carousels.map(async (carousel) => {
        let products: ProductEntity[] = [];

        if (carousel.isDynamic()) {
          products = await this.getDynamicProducts(carousel);
        } else {
          // Load items for custom carousels
          const items = await this.carouselItemRepository.find({
            where: { carouselId: carousel.id },
            relations: ['product'],
            order: { displayOrder: 'ASC' },
          });
          products = items.map((item) => item.product);
        }

        // Return plain object
        return {
          id: carousel.id,
          type: carousel.type,
          titleEn: carousel.titleEn,
          titleAr: carousel.titleAr,
          descriptionEn: carousel.descriptionEn,
          descriptionAr: carousel.descriptionAr,
          maxProducts: carousel.maxProducts,
          refreshInterval: carousel.refreshInterval,
          displayOrder: carousel.displayOrder,
          isActive: carousel.isActive,
          createdAt: carousel.createdAt,
          updatedAt: carousel.updatedAt,
          products,
        };
      }),
    );
  }

  /**
   * Get dynamic products based on carousel type
   *
   * Implements intelligent product selection algorithms for each carousel type.
   *
   * @param carousel - Carousel configuration
   * @returns Array of products
   */
  private async getDynamicProducts(carousel: ProductCarousel): Promise<ProductEntity[]> {
    const baseQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.approvalStatus = :status', { status: 'approved' })
      .andWhere('product.status = :published', { published: 'published' });

    switch (carousel.type) {
      case CarouselType.NEW_ARRIVALS:
        // Get recently added products
        return baseQuery
          .orderBy('product.createdAt', 'DESC')
          .take(carousel.maxProducts)
          .getMany();

      case CarouselType.BEST_SELLERS:
        // Get top selling products using salesCount column
        // NULL values are automatically last in DESC order in MySQL
        return baseQuery
          .orderBy('product.salesCount', 'DESC')
          .take(carousel.maxProducts)
          .getMany();

      case CarouselType.TRENDING:
        // Get trending products based on recent sales and best seller flag
        // TODO: Add viewCount and cartAdditions columns for better trending logic
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return baseQuery
          .andWhere('product.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
          .orderBy('product.isBestSeller', 'DESC')
          .addOrderBy('product.salesCount', 'DESC')
          .addOrderBy('product.createdAt', 'DESC')
          .take(carousel.maxProducts)
          .getMany();

      case CarouselType.RECOMMENDED:
        // Basic recommendation algorithm based on best sellers and featured products
        // TODO: Implement personalized recommendations based on user behavior
        // TODO: Add rating column for better recommendation logic
        return baseQuery
          .andWhere('(product.isBestSeller = :isBestSeller OR product.isFeatured = :isFeatured)', {
            isBestSeller: true,
            isFeatured: true,
          })
          .orderBy('product.isBestSeller', 'DESC')
          .addOrderBy('product.isFeatured', 'DESC')
          .addOrderBy('product.salesCount', 'DESC')
          .take(carousel.maxProducts)
          .getMany();

      case CarouselType.DEALS_OF_DAY:
        // Daily deals - products with active promotions and high discount
        // Prioritize products with sale price and best deals
        return baseQuery
          .leftJoin('pricing.salePrice', 'salePrice')
          .andWhere('pricing.salePrice IS NOT NULL')
          .andWhere('pricing.salePrice < pricing.basePrice')
          .orderBy('(pricing.basePrice - pricing.salePrice)', 'DESC')
          .addOrderBy('product.createdAt', 'DESC')
          .take(carousel.maxProducts)
          .getMany();

      case CarouselType.CLEARANCE:
        // Clearance items - products on sale with highest discounts
        return baseQuery
          .leftJoin('pricing.salePrice', 'salePrice')
          .andWhere('pricing.salePrice IS NOT NULL')
          .andWhere('pricing.salePrice < pricing.basePrice')
          .orderBy('((pricing.basePrice - pricing.salePrice) / pricing.basePrice)', 'DESC')
          .take(carousel.maxProducts)
          .getMany();

      case CarouselType.LIMITED_STOCK:
        // Products with limited stock - creates urgency
        // TODO: Add stock quantity column for better filtering
        return baseQuery
          .andWhere('product.isFeatured = :isFeatured', { isFeatured: true })
          .orderBy('product.salesCount', 'DESC')
          .addOrderBy('product.createdAt', 'DESC')
          .take(carousel.maxProducts)
          .getMany();

      case CarouselType.FEATURED:
        // Featured/highlighted products
        return baseQuery
          .andWhere('product.isFeatured = :isFeatured', { isFeatured: true })
          .orderBy('product.salesCount', 'DESC')
          .addOrderBy('product.createdAt', 'DESC')
          .take(carousel.maxProducts)
          .getMany();

      default:
        return [];
    }
  }

  /**
   * Update an existing carousel
   *
   * @param id - Carousel UUID
   * @param updateDto - DTO with fields to update
   * @returns Updated carousel
   * @throws NotFoundException if not found
   * @throws BadRequestException if validation fails
   */
  async update(id: number, updateDto: UpdateProductCarouselDto): Promise<ProductCarousel> {
    const carousel = await this.findOne(id);

    // Merge updates
    Object.assign(carousel, updateDto);

    // Validate business rules
    const validationErrors = carousel.validate();
    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors.join(', '));
    }

    // Save and return
    return this.carouselRepository.save(carousel);
  }

  /**
   * Soft delete a carousel
   *
   * @param id - Carousel UUID
   * @returns void
   * @throws NotFoundException if not found
   */
  async remove(id: number): Promise<void> {
    const carousel = await this.findOne(id);
    await this.carouselRepository.softDelete(id);
  }

  /**
   * Add product to custom carousel
   *
   * Only works for custom carousel type.
   *
   * @param carouselId - Carousel UUID
   * @param productId - Product ID
   * @param displayOrder - Display position
   * @returns Created carousel item
   * @throws BadRequestException if carousel is not custom type
   */
  async addProductToCarousel(
    carouselId: number,
    productId: number,
    displayOrder: number = 0,
  ): Promise<ProductCarouselItem> {
    const carousel = await this.findOne(carouselId);

    if (carousel.type !== CarouselType.CUSTOM) {
      throw new BadRequestException('Can only add products to custom carousels');
    }

    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Create carousel item
    const item = this.carouselItemRepository.create({
      carouselId,
      productId,
      displayOrder,
    });

    return this.carouselItemRepository.save(item);
  }

  /**
   * Remove product from custom carousel
   *
   * @param carouselId - Carousel UUID
   * @param productId - Product ID
   * @returns void
   */
  async removeProductFromCarousel(carouselId: number, productId: number): Promise<void> {
    await this.carouselItemRepository.delete({
      carouselId,
      productId,
    });
  }

  /**
   * Bulk update display orders for carousel items
   *
   * @param carouselId - Carousel UUID
   * @param updates - Array of { productId, displayOrder }
   * @returns void
   */
  async bulkUpdateItemOrders(
    carouselId: number,
    updates: Array<{ productId: number; displayOrder: number }>,
  ): Promise<void> {
    await Promise.all(
      updates.map((update) =>
        this.carouselItemRepository.update(
          { carouselId, productId: update.productId },
          { displayOrder: update.displayOrder },
        ),
      ),
    );
  }

  /**
   * Get count of active carousels
   *
   * @returns Number of active carousels
   */
  async getActiveCount(): Promise<number> {
    return this.carouselRepository.count({
      where: { isActive: true },
    });
  }
}
