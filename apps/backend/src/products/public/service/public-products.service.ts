/**
 * @file public-products.service.ts
 * @description Handles customer-facing product queries (catalog feed).
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GetPublicProductsDto } from '../dto/get-public-products.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../../entities/product.entity';
import { Repository } from 'typeorm';

/**
 * Product detail response interface
 */
export interface ProductDetailResponse {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  category: {
    id: number;
    nameEn: string;
    nameAr: string;
    slug: string;
  } | null;
  manufacturer: {
    id: number;
    name: string;
  } | null;
  vendor: {
    id: number;
    storeName: string;
  } | null;
  pricing: {
    basePrice: number;
    discountPrice: number | null;
    currency: string;
  } | null;
  images: Array<{
    id: number;
    imageUrl: string;
    sortOrder: number;
  }>;
  descriptions: Array<{
    language: string;
    shortDescription: string;
    fullDescription: string;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    price: number;
    variantData: Record<string, any>;
    imageUrl: string | null;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    totalStock: number;
    isActive: boolean;
  }>;
  attributes: Array<{
    id: number;
    attributeNameEn: string;
    attributeNameAr: string;
    valueEn: string;
    valueAr: string;
    colorHex: string | null;
  }>;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  totalStock: number;
  relatedProducts: Array<{
    id: number;
    slug: string;
    nameEn: string;
    nameAr: string;
    mainImage: string | null;
    basePrice: number;
    discountPrice: number | null;
    currency: string;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  }>;
}

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
    // Use FULLTEXT index for product names (fast), fallback to LIKE for other fields
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      query.andWhere(
        '(MATCH(product.nameEn, product.nameAr) AGAINST(:ftSearch IN BOOLEAN MODE) OR descriptions.shortDescription LIKE :search OR descriptions.fullDescription LIKE :search OR category.nameEn LIKE :search OR category.nameAr LIKE :search OR manufacturer.name LIKE :search)',
        { ftSearch: searchQuery.trim(), search: searchTerm },
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

    // Apply brand filter (supports multiple brand IDs)
    if (filters.brandIds) {
      const brandIdArray = filters.brandIds
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
      if (brandIdArray.length > 0) {
        query.andWhere('product.brand_id IN (:...brandIds)', {
          brandIds: brandIdArray,
        });
      }
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

    // Sort by relevance using FULLTEXT relevance score
    // Products with FULLTEXT name matches ranked highest, then category/manufacturer matches
    if (searchQuery && searchQuery.trim()) {
      query.orderBy(
        `CASE
          WHEN MATCH(product.nameEn, product.nameAr) AGAINST(:ftSearch IN BOOLEAN MODE) THEN 1
          WHEN category.nameEn LIKE :nameSearch OR category.nameAr LIKE :nameSearch THEN 2
          WHEN manufacturer.name LIKE :nameSearch THEN 3
          ELSE 4
        END`,
        'ASC',
      );
      query.setParameter('ftSearch', searchQuery.trim());
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
   * GET PUBLIC PRODUCT FEED
   *
   * Fetches a public product list with comprehensive filters, pagination, and sorting.
   * This endpoint powers the main product catalog browsing experience.
   *
   * Features:
   * - Full pagination with totalPages calculation
   * - Stock status computation from variant-level stock
   * - Category information inclusion
   * - Price-based sorting (ascending/descending)
   * - Date-based sorting (newest first)
   * - Out-of-range page validation
   *
   * Stock Status Logic:
   * - in_stock: Total stock > 5 units
   * - low_stock: Total stock 1-5 units
   * - out_of_stock: Total stock = 0 units
   * - Default to in_stock if no variants exist
   *
   * @param filters - Pagination, search, category, price, and sorting filters
   * @returns Paginated product list with metadata
   * @throws NotFoundException when requested page exceeds available pages
   */
  async getPublicFeed(filters: GetPublicProductsDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Build base query with all necessary joins
    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.stocks', 'stocks')
      .where(
        'product.isActive = true AND product.isPublished = true AND product.is_deleted = false',
      )
      .andWhere('pricing.isActive = true');

    // Apply search filter using FULLTEXT index for product names
    // Keep LIKE as fallback for short queries that FULLTEXT might not match well
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query.andWhere(
        '(MATCH(product.nameEn, product.nameAr) AGAINST(:ftSearch IN BOOLEAN MODE) OR product.nameEn LIKE :search OR product.nameAr LIKE :search)',
        { ftSearch: filters.search, search: searchTerm },
      );
    }

    // Apply category filter
    if (filters.categoryId) {
      query.andWhere('product.category_id = :cid', { cid: filters.categoryId });
    }

    // Apply manufacturer filter
    if (filters.manufacturerId) {
      query.andWhere('product.manufacturer_id = :mid', {
        mid: filters.manufacturerId,
      });
    }

    // Apply brand filter (supports multiple brand IDs)
    if (filters.brandIds) {
      const brandIdArray = filters.brandIds
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
      if (brandIdArray.length > 0) {
        query.andWhere('product.brand_id IN (:...brandIds)', {
          brandIds: brandIdArray,
        });
      }
    }

    // Apply minimum price filter (considers discount price if available)
    if (filters.minPrice) {
      query.andWhere(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice >= :min) OR (pricing.discountPrice IS NULL AND pricing.basePrice >= :min)',
        { min: filters.minPrice },
      );
    }

    // Apply maximum price filter (considers discount price if available)
    if (filters.maxPrice) {
      query.andWhere(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice <= :max) OR (pricing.discountPrice IS NULL AND pricing.basePrice <= :max)',
        { max: filters.maxPrice },
      );
    }

    // Apply sorting based on sortBy parameter
    if (filters.sortBy === 'price_asc') {
      // Sort by final price ascending (discount price takes priority)
      query.orderBy('COALESCE(pricing.discountPrice, pricing.basePrice)', 'ASC');
    } else if (filters.sortBy === 'price_desc') {
      // Sort by final price descending (discount price takes priority)
      query.orderBy('COALESCE(pricing.discountPrice, pricing.basePrice)', 'DESC');
    } else if (filters.sortBy === 'rating') {
      // Placeholder: Sort by rating (currently same as newest)
      // TODO: Implement when review system is available
      query.orderBy('product.createdAt', 'DESC');
    } else if (filters.sortBy === 'popularity') {
      // Sort by sales count (best sellers first), then by creation date
      query.orderBy('product.salesCount', 'DESC');
      query.addOrderBy('product.createdAt', 'DESC');
    } else {
      // Default: Sort by newest (creation date descending)
      query.orderBy('product.createdAt', 'DESC');
    }

    // Execute query with pagination
    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Validate requested page is within bounds
    if (page > totalPages && total > 0) {
      throw new NotFoundException(
        `Requested page ${page} exceeds available pages (${totalPages}). Total products: ${total}.`,
      );
    }

    // Map products to response format with stock status computation
    return {
      data: data.map((product) => {
        // Compute total stock across all variants and their warehouses
        let totalStock = 0;
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant) => {
            if (variant.stocks && variant.stocks.length > 0) {
              variant.stocks.forEach((stock) => {
                totalStock += stock.quantity || 0;
              });
            }
          });
        }

        // Determine stock status based on total quantity
        let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
        if (totalStock === 0) {
          stockStatus = 'out_of_stock';
        } else if (totalStock > 0 && totalStock <= 5) {
          stockStatus = 'low_stock';
        } else {
          stockStatus = 'in_stock';
        }

        // Default to in_stock if no variants exist (virtual/service products)
        if (!product.variants || product.variants.length === 0) {
          stockStatus = 'in_stock';
        }

        return {
          id: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          mainImage: product.images?.[0]?.imageUrl ?? null,
          basePrice: product.pricing?.basePrice,
          discountPrice: product.pricing?.discountPrice ?? null,
          currency: product.pricing?.currency ?? 'SYP',
          categoryId: product.category?.id ?? null,
          categoryNameEn: product.category?.nameEn ?? null,
          categoryNameAr: product.category?.nameAr ?? null,
          stockStatus,
          rating: 0, // Placeholder for future review system
          reviewCount: 0, // Placeholder for future review system
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * GET INDIVIDUAL PRODUCT DETAILS
   *
   * Retrieves complete product information by slug for product detail page.
   * Includes structured response with attributes, variants with stock status,
   * and related products from the same category.
   *
   * @param slug - Product slug identifier
   * @returns Structured product details with related products
   */
  async getProductBySlug(slug: string): Promise<ProductDetailResponse> {
    this.logger.log(`🔍 Getting product details for slug: ${slug}`);

    const product = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.descriptions', 'descriptions')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.stocks', 'variantStocks')
      .leftJoinAndSelect('product.attributes', 'productAttributes')
      .leftJoinAndSelect('productAttributes.attribute', 'attributeDef')
      .leftJoinAndSelect('productAttributes.value', 'attributeValue')
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

    // Query related products (same category, exclude self, limit 5, active/published only)
    let relatedProducts: ProductEntity[] = [];

    if (product.category) {
      relatedProducts = await this.productRepo
        .createQueryBuilder('related')
        .leftJoinAndSelect('related.pricing', 'relatedPricing')
        .leftJoinAndSelect('related.images', 'relatedImages')
        .leftJoinAndSelect('related.category', 'relatedCategory')
        .leftJoinAndSelect('related.variants', 'relatedVariants')
        .leftJoinAndSelect('relatedVariants.stocks', 'relatedStocks')
        .where(
          'related.isActive = true AND related.isPublished = true AND related.is_deleted = false',
        )
        .andWhere('relatedPricing.isActive = true')
        .andWhere('related.category_id = :categoryId', {
          categoryId: product.category.id,
        })
        .andWhere('related.id != :productId', { productId: product.id })
        .orderBy('related.salesCount', 'DESC')
        .limit(5)
        .getMany();
    }

    // Compute stock status from variants
    let totalStock = 0;
    if (product.variants?.length) {
      product.variants.forEach((variant) => {
        variant.stocks?.forEach((stock) => {
          totalStock += stock.quantity || 0;
        });
      });
    }

    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    if (!product.variants?.length) stockStatus = 'in_stock';
    else if (totalStock === 0) stockStatus = 'out_of_stock';
    else if (totalStock <= 5) stockStatus = 'low_stock';
    else stockStatus = 'in_stock';

    return {
      id: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      sku: product.sku,
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
      vendor: product.vendor
        ? {
            id: product.vendor.id,
            storeName: product.vendor.storeName,
          }
        : null,
      pricing: product.pricing
        ? {
            basePrice: product.pricing.basePrice,
            discountPrice: product.pricing.discountPrice ?? null,
            currency: product.pricing.currency ?? 'SYP',
          }
        : null,
      images: (product.images || []).map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder ?? 0,
      })),
      descriptions: (product.descriptions || []).map((desc) => ({
        language: desc.language,
        shortDescription: desc.description ?? '',
        fullDescription: desc.description ?? '',
      })),
      variants: (product.variants || []).map((variant) => {
        let variantStock = 0;
        variant.stocks?.forEach((s) => {
          variantStock += s.quantity || 0;
        });
        let variantStockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
        if (variantStock === 0) variantStockStatus = 'out_of_stock';
        else if (variantStock <= 5) variantStockStatus = 'low_stock';
        else variantStockStatus = 'in_stock';

        return {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
          variantData: variant.variantData,
          imageUrl: variant.imageUrl ?? null,
          stockStatus: variantStockStatus,
          totalStock: variantStock,
          isActive: variant.isActive,
        };
      }),
      attributes: (product.attributes || []).map((attr) => ({
        id: attr.id,
        attributeNameEn: attr.attribute?.nameEn ?? '',
        attributeNameAr: attr.attribute?.nameAr ?? '',
        valueEn: attr.value?.valueEn ?? '',
        valueAr: attr.value?.valueAr ?? '',
        colorHex: attr.value?.colorHex ?? null,
      })),
      stockStatus,
      totalStock,
      relatedProducts: relatedProducts
        .filter((rp) => rp.pricing?.basePrice != null && rp.pricing.basePrice > 0) // Exclude products without valid pricing or $0
        .map((rp) => {
          let rpTotalStock = 0;
          rp.variants?.forEach((v) =>
            v.stocks?.forEach((s) => {
              rpTotalStock += s.quantity || 0;
            }),
          );
          let rpStockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
          if (!rp.variants?.length) rpStockStatus = 'in_stock';
          else if (rpTotalStock === 0) rpStockStatus = 'out_of_stock';
          else if (rpTotalStock <= 5) rpStockStatus = 'low_stock';
          else rpStockStatus = 'in_stock';

          return {
            id: rp.id,
            slug: rp.slug,
            nameEn: rp.nameEn,
            nameAr: rp.nameAr,
            mainImage: rp.images?.[0]?.imageUrl ?? null,
            basePrice: rp.pricing.basePrice, // Safe after filter
            discountPrice: rp.pricing?.discountPrice ?? null,
            currency: rp.pricing?.currency ?? 'SYP',
            stockStatus: rpStockStatus,
          };
        }),
    };
  }

  /**
   * GET SEARCH SUGGESTIONS
   *
   * Retrieves search suggestions for autocomplete dropdown.
   * Returns product names (limit 5) with thumbnails and prices, and category names (limit 3) that match the query.
   * Uses FULLTEXT index for high-performance product name search.
   *
   * @param query - Search query string (minimum 2 characters)
   * @returns Object containing suggestions array with text, textAr, type, slug, imageUrl, price, and currency
   */
  async getSearchSuggestions(query: string) {
    const searchTerm = `%${query}%`;

    // Search product names with pricing and images (limit 5)
    // Use FULLTEXT index for fast product name matching
    const products = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .select([
        'product.nameEn',
        'product.nameAr',
        'product.slug',
        'pricing.basePrice',
        'pricing.discountPrice',
        'pricing.currency',
        'images.imageUrl',
      ])
      .where(
        'product.isActive = true AND product.isPublished = true AND product.is_deleted = false',
      )
      .andWhere(
        '(MATCH(product.nameEn, product.nameAr) AGAINST(:ftSearch IN BOOLEAN MODE) OR product.nameEn LIKE :search OR product.nameAr LIKE :search)',
        { ftSearch: query, search: searchTerm },
      )
      .andWhere('pricing.isActive = true')
      .orderBy('product.salesCount', 'DESC')
      .limit(5)
      .getMany();

    // Search category names (limit 3) - use raw query to access categories table
    const categories = await this.productRepo.manager
      .createQueryBuilder()
      .select(['cat.name_en', 'cat.name_ar', 'cat.slug'])
      .from('categories', 'cat')
      .where('cat.name_en LIKE :search OR cat.name_ar LIKE :search', {
        search: searchTerm,
      })
      .limit(3)
      .getRawMany();

    const suggestions = [
      ...products.map((p) => ({
        text: p.nameEn,
        textAr: p.nameAr,
        type: 'product' as const,
        slug: p.slug,
        imageUrl: p.images?.[0]?.imageUrl ?? null,
        price: p.pricing?.discountPrice ?? p.pricing?.basePrice ?? null,
        currency: p.pricing?.currency ?? 'SYP',
      })),
      ...categories.map((c) => ({
        text: c.cat_name_en,
        textAr: c.cat_name_ar,
        type: 'category' as const,
        slug: c.cat_slug,
      })),
    ];

    return { suggestions };
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
