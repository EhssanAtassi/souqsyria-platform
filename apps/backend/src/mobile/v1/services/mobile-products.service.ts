import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../../products/entities/product.entity';
import { ProductVariant } from '../../../products/variants/entities/product-variant.entity';
import {
  MobileImageOptimizationService,
  OptimizedImage,
} from './mobile-image-optimization.service';

/**
 * Mobile-optimized product response interface
 * Lightweight structure designed for mobile bandwidth constraints
 */
export interface MobileProductSummary {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  shortDescription?: string;
  images: OptimizedImage;
  pricing: {
    basePrice: number;
    discountPrice?: number;
    currency: string;
    discountPercentage?: number;
  };
  availability: {
    inStock: boolean;
    stockCount?: number;
    estimatedDelivery?: string;
  };
  vendor: {
    id: number;
    businessName: string;
    rating?: number;
  };
  category: {
    id: number;
    nameEn: string;
    nameAr: string;
    slug: string;
  };
  ratings: {
    average: number;
    count: number;
  };
  badges?: string[]; // e.g., ["bestseller", "featured", "new"]
}

/**
 * Detailed mobile product response
 */
export interface MobileProductDetails extends MobileProductSummary {
  fullDescription?: {
    en: string;
    ar: string;
  };
  specifications?: Record<string, any>;
  variants?: MobileProductVariant[];
  imageGallery: OptimizedImage[];
  manufacturer?: {
    id: number;
    name: string;
    country: string;
  };
  shipping: {
    freeShipping: boolean;
    estimatedDays: number;
    cost?: number;
  };
  warranty?: {
    duration: number;
    type: string;
    coverage: string;
  };
  tags?: string[];
  relatedProducts?: MobileProductSummary[];
}

/**
 * Mobile product variant
 */
export interface MobileProductVariant {
  id: number;
  sku: string;
  attributes: Record<string, string>; // e.g., {"color": "Black", "size": "M"}
  pricing: {
    basePrice: number;
    discountPrice?: number;
    currency: string;
  };
  availability: {
    inStock: boolean;
    stockCount?: number;
  };
  images?: OptimizedImage[];
}

/**
 * Mobile product feed filters
 */
export interface MobileProductFilters {
  page?: number;
  limit?: number;
  categoryId?: number;
  vendorId?: number;
  manufacturerId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  featured?: boolean;
  sortBy?: 'price' | 'rating' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
  language?: 'en' | 'ar';
}

/**
 * Mobile Products Service
 *
 * Provides optimized product data specifically for mobile applications
 * with compressed responses, optimized images, and mobile-specific features.
 */
@Injectable()
export class MobileProductsService {
  private readonly logger = new Logger(MobileProductsService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    private readonly imageOptimizationService: MobileImageOptimizationService,
  ) {}

  /**
   * Get mobile-optimized product feed
   * Returns lightweight product summaries perfect for listing screens
   */
  async getMobileProductFeed(filters: MobileProductFilters = {}) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      vendorId,
      manufacturerId,
      minPrice,
      maxPrice,
      inStockOnly = false,
      featured,
      sortBy = 'newest',
      sortOrder = 'desc',
      language = 'en',
    } = filters;

    try {
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect('product.vendor', 'vendor')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.manufacturer', 'manufacturer')
        .where('product.status = :status', { status: 'active' })
        .andWhere('product.isApproved = :isApproved', { isApproved: true });

      // Apply filters
      if (categoryId) {
        queryBuilder.andWhere('product.categoryId = :categoryId', {
          categoryId,
        });
      }

      if (vendorId) {
        queryBuilder.andWhere('product.vendorId = :vendorId', { vendorId });
      }

      if (manufacturerId) {
        queryBuilder.andWhere('product.manufacturerId = :manufacturerId', {
          manufacturerId,
        });
      }

      if (minPrice !== undefined) {
        queryBuilder.andWhere('pricing.basePrice >= :minPrice', { minPrice });
      }

      if (maxPrice !== undefined) {
        queryBuilder.andWhere('pricing.basePrice <= :maxPrice', { maxPrice });
      }

      if (inStockOnly) {
        queryBuilder.andWhere('product.stockQuantity > 0');
      }

      if (featured !== undefined) {
        queryBuilder.andWhere('product.isFeatured = :featured', { featured });
      }

      // Apply sorting
      switch (sortBy) {
        case 'price':
          queryBuilder.orderBy(
            'pricing.basePrice',
            sortOrder.toUpperCase() as 'ASC' | 'DESC',
          );
          break;
        case 'rating':
          queryBuilder.orderBy(
            'product.averageRating',
            sortOrder.toUpperCase() as 'ASC' | 'DESC',
          );
          break;
        case 'popular':
          queryBuilder.orderBy('product.viewCount', 'DESC');
          break;
        case 'newest':
        default:
          queryBuilder.orderBy(
            'product.createdAt',
            sortOrder.toUpperCase() as 'ASC' | 'DESC',
          );
          break;
      }

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Execute query
      const [products, total] = await queryBuilder.getManyAndCount();

      // Transform to mobile-optimized format
      const mobileProducts = await Promise.all(
        products.map((product) =>
          this.transformToMobileProductSummary(product, language),
        ),
      );

      return {
        data: mobileProducts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrevious: page > 1,
        },
        performance: {
          loadTime: Date.now(), // In real implementation, track actual load time
          cached: false, // Indicate if response was cached
          optimizedForMobile: true,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get mobile product feed', error);
      throw error;
    }
  }

  /**
   * Get detailed product information optimized for mobile
   */
  async getMobileProductDetails(
    slug: string,
    language: 'en' | 'ar' = 'en',
  ): Promise<MobileProductDetails> {
    try {
      const product = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.descriptions', 'descriptions')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect('product.vendor', 'vendor')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.manufacturer', 'manufacturer')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('variants.pricing', 'variantPricing')
        .where('product.slug = :slug', { slug })
        .andWhere('product.status = :status', { status: 'active' })
        .andWhere('product.isApproved = :isApproved', { isApproved: true })
        .getOne();

      if (!product) {
        throw new NotFoundException(
          `Product with slug "${slug}" not found or not available`,
        );
      }

      // Transform to mobile-optimized detailed format
      return await this.transformToMobileProductDetails(product, language);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get mobile product details for slug: ${slug}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Mobile product quick search with autocomplete
   */
  async quickSearch(
    query: string,
    limit: number = 10,
    language: 'en' | 'ar' = 'en',
  ) {
    try {
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .where('product.status = :status', { status: 'active' })
        .andWhere('product.isApproved = :isApproved', { isApproved: true });

      if (language === 'ar') {
        queryBuilder.andWhere('product.nameAr LIKE :query', {
          query: `%${query}%`,
        });
      } else {
        queryBuilder.andWhere('product.nameEn LIKE :query', {
          query: `%${query}%`,
        });
      }

      queryBuilder
        .orderBy('product.averageRating', 'DESC')
        .addOrderBy('product.viewCount', 'DESC')
        .limit(limit);

      const products = await queryBuilder.getMany();

      return {
        suggestions: products.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: language === 'ar' ? product.nameAr : product.nameEn,
          image: product.images?.[0]?.imageUrl,
          price: product.pricing?.basePrice,
          currency: 'SYP',
        })),
        query,
        count: products.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to perform quick search for query: ${query}`,
        error,
      );
      return {
        suggestions: [],
        query,
        count: 0,
      };
    }
  }

  /**
   * Transform product entity to mobile-optimized summary
   */
  private async transformToMobileProductSummary(
    product: any,
    language: 'en' | 'ar',
  ): Promise<MobileProductSummary> {
    const mainImage = product.images?.[0]?.imageUrl;
    const optimizedImage = mainImage
      ? await this.imageOptimizationService.optimizeImage(mainImage)
      : {
          original: '',
          thumbnail: '',
          medium: '',
          large: '',
        };

    const basePrice = product.pricing?.basePrice || 0;
    const discountPrice = product.pricing?.discountPrice;
    const discountPercentage =
      discountPrice && basePrice > discountPrice
        ? Math.round(((basePrice - discountPrice) / basePrice) * 100)
        : undefined;

    return {
      id: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      shortDescription:
        language === 'ar'
          ? product.shortDescriptionAr
          : product.shortDescriptionEn,
      images: optimizedImage,
      pricing: {
        basePrice,
        discountPrice,
        currency: 'SYP',
        discountPercentage,
      },
      availability: {
        inStock: (product.stockQuantity || 0) > 0,
        stockCount:
          product.stockQuantity > 10 ? undefined : product.stockQuantity,
        estimatedDelivery: this.calculateEstimatedDelivery(product),
      },
      vendor: {
        id: product.vendor?.id || 0,
        businessName: product.vendor?.businessName || 'Unknown Vendor',
        rating: product.vendor?.averageRating || 0,
      },
      category: {
        id: product.category?.id || 0,
        nameEn: product.category?.nameEn || 'Uncategorized',
        nameAr: product.category?.nameAr || 'غير مصنف',
        slug: product.category?.slug || 'uncategorized',
      },
      ratings: {
        average: product.averageRating || 0,
        count: product.ratingsCount || 0,
      },
      badges: this.generateProductBadges(product),
    };
  }

  /**
   * Transform product entity to mobile-optimized detailed format
   */
  private async transformToMobileProductDetails(
    product: any,
    language: 'en' | 'ar',
  ): Promise<MobileProductDetails> {
    // Get base summary
    const summary = await this.transformToMobileProductSummary(
      product,
      language,
    );

    // Optimize all images
    const imageUrls = product.images?.map((img) => img.imageUrl) || [];
    const optimizedImages =
      await this.imageOptimizationService.optimizeImages(imageUrls);

    // Transform variants
    const variants =
      product.variants?.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        attributes: variant.variantData || {},
        pricing: {
          basePrice:
            variant.pricing?.basePrice || product.pricing?.basePrice || 0,
          discountPrice: variant.pricing?.discountPrice,
          currency: 'SYP',
        },
        availability: {
          inStock: (variant.stockQuantity || 0) > 0,
          stockCount:
            variant.stockQuantity > 10 ? undefined : variant.stockQuantity,
        },
      })) || [];

    return {
      ...summary,
      fullDescription: {
        en:
          product.descriptions?.find((d) => d.language === 'en')
            ?.fullDescription || '',
        ar:
          product.descriptions?.find((d) => d.language === 'ar')
            ?.fullDescription || '',
      },
      specifications: product.specifications || {},
      variants,
      imageGallery: optimizedImages,
      manufacturer: product.manufacturer
        ? {
            id: product.manufacturer.id,
            name: product.manufacturer.name,
            country: product.manufacturer.country || 'Syria',
          }
        : undefined,
      shipping: {
        freeShipping: product.freeShipping || false,
        estimatedDays: this.calculateShippingDays(product),
        cost: product.freeShipping ? 0 : this.calculateShippingCost(product),
      },
      warranty: product.warranty
        ? {
            duration: product.warranty.duration || 12,
            type: product.warranty.type || 'manufacturer',
            coverage: product.warranty.coverage || 'parts and labor',
          }
        : undefined,
      tags: product.tags || [],
    };
  }

  /**
   * Calculate estimated delivery date
   */
  private calculateEstimatedDelivery(product: any): string {
    const days = this.calculateShippingDays(product);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Calculate shipping days based on product and location
   */
  private calculateShippingDays(product: any): number {
    // Default shipping estimation logic
    if (product.vendor?.governorate === 'Damascus') return 2;
    if (product.vendor?.governorate === 'Aleppo') return 3;
    return 5; // Default for other locations
  }

  /**
   * Calculate shipping cost
   */
  private calculateShippingCost(product: any): number {
    // Simple shipping cost calculation
    const baseShippingCost = 50000; // 50,000 SYP base cost
    const weight = product.weight || 1;
    return baseShippingCost + weight * 10000; // Add 10,000 SYP per kg
  }

  /**
   * Generate product badges based on product properties
   */
  private generateProductBadges(product: any): string[] {
    const badges: string[] = [];

    if (product.isFeatured) badges.push('featured');
    if (product.isNew) badges.push('new');
    if (product.isBestseller) badges.push('bestseller');
    if (
      product.pricing?.discountPrice &&
      product.pricing.basePrice > product.pricing.discountPrice
    ) {
      badges.push('on-sale');
    }
    if (product.freeShipping) badges.push('free-shipping');
    if (product.averageRating >= 4.5) badges.push('top-rated');

    return badges;
  }
}
