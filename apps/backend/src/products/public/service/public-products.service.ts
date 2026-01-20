/**
 * @file public-products.service.ts
 * @description Handles customer-facing product queries (catalog feed).
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GetPublicProductsDto } from '../dto/get-public-products.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../../entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PublicProductsService {
  private readonly logger = new Logger(PublicProductsService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  /**
   * SEARCH PRODUCTS
   *
   * Advanced product search with full-text search, filters, and pagination
   *
   * @param searchQuery - Search query string
   * @param filters - Additional filters and pagination
   * @returns Paginated search results
   */
  async searchProducts(searchQuery: string, filters: GetPublicProductsDto) {
    this.logger.log(`🔍 Searching products for query: "${searchQuery}"`);

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.descriptions', 'descriptions')
      .leftJoinAndSelect('product.manufacturer', 'manufacturer')
      .where(
        'product.isActive = true AND product.isPublished = true AND product.is_deleted = false',
      )
      .andWhere('pricing.isActive = true');

    // Full-text search across multiple fields
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      query.andWhere(
        '(product.nameEn LIKE :search OR product.nameAr LIKE :search OR descriptions.shortDescription LIKE :search OR descriptions.fullDescription LIKE :search OR category.nameEn LIKE :search OR category.nameAr LIKE :search OR manufacturer.name LIKE :search)',
        { search: searchTerm },
      );
    }

    // Apply additional filters
    if (filters.categoryId) {
      query.andWhere('product.category_id = :cid', { cid: filters.categoryId });
    }

    if (filters.manufacturerId) {
      query.andWhere('product.manufacturer_id = :mid', {
        mid: filters.manufacturerId,
      });
    }

    if (filters.minPrice) {
      query.andWhere(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice >= :min) OR (pricing.discountPrice IS NULL AND pricing.basePrice >= :min)',
        { min: filters.minPrice },
      );
    }

    if (filters.maxPrice) {
      query.andWhere(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice <= :max) OR (pricing.discountPrice IS NULL AND pricing.basePrice <= :max)',
        { max: filters.maxPrice },
      );
    }

    // Sort by relevance (products with name matches first, then description matches)
    if (searchQuery && searchQuery.trim()) {
      query.orderBy(
        `CASE 
          WHEN product.nameEn LIKE :nameSearch OR product.nameAr LIKE :nameSearch THEN 1
          WHEN category.nameEn LIKE :nameSearch OR category.nameAr LIKE :nameSearch THEN 2  
          WHEN manufacturer.name LIKE :nameSearch THEN 3
          ELSE 4 
        END`,
        'ASC',
      );
      query.setParameter('nameSearch', `%${searchQuery.trim()}%`);
    } else {
      query.orderBy('product.createdAt', 'DESC');
    }

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((product) => ({
        id: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        shortDescription: product.descriptions?.[0]?.description || '',
        mainImage: product.images?.[0]?.imageUrl ?? null,
        finalPrice:
          product.pricing?.discountPrice ?? product.pricing?.basePrice,
        currency: product.pricing?.currency ?? 'SYP',
        category: product.category
          ? {
              id: product.category.id,
              nameEn: product.category.nameEn,
              nameAr: product.category.nameAr,
              slug: product.category.slug,
            }
          : null,
        manufacturer: product.manufacturer
          ? {
              id: product.manufacturer.id,
              name: product.manufacturer.name,
            }
          : null,
      })),
      meta: {
        total,
        page,
        limit,
        searchQuery: searchQuery || '',
        hasResults: total > 0,
      },
    };
  }

  /**
   * Fetches a public product list with filters and pagination
   */
  async getPublicFeed(filters: GetPublicProductsDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .where(
        'product.isActive = true AND product.isPublished = true AND product.is_deleted = false',
      )
      .andWhere('pricing.isActive = true');

    if (filters.search) {
      query.andWhere('product.nameEn LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.categoryId) {
      query.andWhere('product.category_id = :cid', { cid: filters.categoryId });
    }

    if (filters.manufacturerId) {
      query.andWhere('product.manufacturer_id = :mid', {
        mid: filters.manufacturerId,
      });
    }

    if (filters.minPrice) {
      query.andWhere(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice >= :min) OR (pricing.discountPrice IS NULL AND pricing.basePrice >= :min)',
        { min: filters.minPrice },
      );
    }

    if (filters.maxPrice) {
      query.andWhere(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice <= :max) OR (pricing.discountPrice IS NULL AND pricing.basePrice <= :max)',
        { max: filters.maxPrice },
      );
    }

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((product) => ({
        id: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        mainImage: product.images?.[0]?.imageUrl ?? null,
        finalPrice:
          product.pricing?.discountPrice ?? product.pricing?.basePrice,
        currency: product.pricing?.currency ?? 'SYP',
      })),
      meta: { total, page, limit },
    };
  }

  /**
   * GET INDIVIDUAL PRODUCT DETAILS
   *
   * Retrieves complete product information by slug for product detail page
   *
   * @param slug - Product slug identifier
   * @returns Promise<ProductEntity> - Complete product details
   */
  async getProductBySlug(slug: string): Promise<ProductEntity> {
    this.logger.log(`🔍 Getting product details for slug: ${slug}`);

    const product = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.descriptions', 'descriptions')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.pricing', 'variantPricing')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.manufacturer', 'manufacturer')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .where('product.slug = :slug', { slug })
      .andWhere(
        'product.isActive = true AND product.isPublished = true AND product.is_deleted = false',
      )
      .andWhere('pricing.isActive = true')
      .getOne();

    if (!product) {
      throw new NotFoundException(
        `Product with slug "${slug}" not found or not available`,
      );
    }

    return product;
  }

  /**
   * GET FEATURED PRODUCTS
   *
   * Retrieves featured products for homepage and promotional displays
   * Filters by is_featured flag with priority sorting and date validation
   *
   * @param limit - Maximum number of featured products to return (default: 3)
   * @param categoryId - Optional category ID to filter by
   * @param parentCategoryId - Optional parent category ID to filter by
   * @param sort - Sort order: 'featured' | 'new_arrivals' | 'best_seller'
   * @returns Promise<{data: ProductEntity[], meta: {total: number, limit: number}}> - Featured products with metadata
   */
  async getFeaturedProducts(
    limit: number = 3,
    categoryId?: number,
    parentCategoryId?: number,
    sort: 'featured' | 'new_arrivals' | 'best_seller' = 'featured',
  ) {
    this.logger.log(
      `⭐ Getting featured products (limit: ${limit}, category: ${categoryId || 'all'}, parent: ${parentCategoryId || 'all'}, sort: ${sort})`,
    );

    // Sanitize and validate limit
    const sanitizedLimit = Math.min(Math.max(1, limit || 3), 20);

    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('product.descriptions', 'descriptions')
      .where('product.isFeatured = :featured', { featured: true })
      .andWhere('product.isActive = :active', { active: true })
      .andWhere('product.isPublished = :published', { published: true })
      .andWhere('product.status = :status', { status: 'published' })
      .andWhere('product.approvalStatus = :approval', { approval: 'approved' })
      .andWhere('product.is_deleted = :deleted', { deleted: false })
      .andWhere('pricing.isActive = true');

    // Filter by category if provided
    if (categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId });
    }

    // Filter by parent category if provided
    // Include products in the parent category itself OR in its children
    if (parentCategoryId) {
      query.andWhere(
        '(product.category_id = :parentCategoryId OR category.parent_id = :parentCategoryId)',
        { parentCategoryId },
      );
    }

    // Apply date filtering for featured campaigns (if dates are set)
    // If featured_start_date is set, only show products where start date has passed
    // If featured_end_date is set, only show products where end date hasn't passed
    const now = new Date();
    query.andWhere(
      '(product.featuredStartDate IS NULL OR product.featuredStartDate <= :now)',
      { now },
    );
    query.andWhere(
      '(product.featuredEndDate IS NULL OR product.featuredEndDate >= :now)',
      { now },
    );

    // Apply sorting based on sort parameter
    if (sort === 'new_arrivals') {
      query.orderBy('product.createdAt', 'DESC');
    } else if (sort === 'best_seller') {
      // Sort by sales count (best sellers first), then by featured priority
      query.orderBy('product.salesCount', 'DESC');
      query.addOrderBy('product.featuredPriority', 'DESC');
      query.addOrderBy('product.createdAt', 'DESC');
    } else {
      // Default: featured priority
      query.orderBy('product.featuredPriority', 'DESC');
      query.addOrderBy('product.createdAt', 'DESC');
    }

    // Apply limit
    query.limit(sanitizedLimit);

    const products = await query.getMany();

    this.logger.log(`✅ Found ${products.length} featured products`);

    // Transform response to match specification format (snake_case fields)
    // Include images, pricing, and category information for Figma design
    return {
      data: products.map((product) => {
        const basePrice = product.pricing?.basePrice || 0;
        const discountPrice = product.pricing?.discountPrice || basePrice;
        const discountPercentage =
          basePrice > 0
            ? Math.round(((basePrice - discountPrice) / basePrice) * 100)
            : 0;

        return {
          id: product.id,
          name_en: product.nameEn,
          name_ar: product.nameAr,
          slug: product.slug,
          sku: product.sku,
          currency: product.currency,

          // Pricing information
          base_price: basePrice,
          discount_price: discountPrice,
          discount_percentage: discountPercentage,

          // Main product image
          image_url: product.images?.[0]?.imageUrl || null,

          // Featured fields
          is_featured: product.isFeatured,
          featured_priority: product.featuredPriority,
          featured_badge: product.featuredBadge,
          featured_start_date: product.featuredStartDate,
          featured_end_date: product.featuredEndDate,

          // Best Seller fields
          is_best_seller: product.isBestSeller,
          sales_count: product.salesCount,

          // Category information
          category: product.category
            ? {
                id: product.category.id,
                name_en: product.category.nameEn,
                name_ar: product.category.nameAr,
                slug: product.category.slug,
                parent_id: product.category.parent?.id || null,
              }
            : null,

          // Product status
          status: product.status,
          approval_status: product.approvalStatus,
          is_active: product.isActive,
          is_published: product.isPublished,
          created_at: product.createdAt,

          // Short description for promotional text
          promotional_text: product.descriptions?.[0]?.description || '',
        };
      }),
      meta: {
        total: products.length,
        limit: sanitizedLimit,
      },
    };
  }
}
