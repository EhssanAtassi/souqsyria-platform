import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';
import {
  RecommendationStrategy,
  RecommendationResult,
  RecommendationConfig,
  RecentlyViewedProduct,
  RecommendationContext,
  CulturalRecommendation
} from '../interfaces/recommendations.interface';
import { ProductService } from '../../features/products/services/product.service';
import { ProductListItem } from '../../features/products/models/product-list.interface';

/**
 * Product Recommendations Service
 *
 * Provides intelligent product recommendations using various strategies:
 * - Similar products (category, features)
 * - Price-based recommendations
 * - Cultural connections (Syrian heritage)
 * - Recently viewed products
 * - Popular products
 * - Frequently bought together
 * - Complementary products
 *
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Product recommendation operations
 *
 * @example
 * ```typescript
 * constructor(private recommendationsService: ProductRecommendationsService) {}
 *
 * ngOnInit() {
 *   // Get similar products
 *   this.recommendationsService.getRecommendations(currentProduct, {
 *     strategy: 'similar',
 *     limit: 6
 *   }).subscribe(result => {
 *     this.recommendations = result.products;
 *   });
 *
 *   // Track product view
 *   this.recommendationsService.trackProductView(product);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ProductRecommendationsService {
  private productService = inject(ProductService);

  private readonly RECENTLY_VIEWED_KEY = 'souq_recently_viewed';
  private readonly MAX_RECENTLY_VIEWED = 20;

  // Recently viewed products signal
  readonly recentlyViewed = signal<RecentlyViewedProduct[]>([]);

  constructor() {
    this.loadRecentlyViewed();
  }

  /**
   * Get product recommendations based on strategy
   *
   * @param product - Reference product (current product being viewed)
   * @param config - Recommendation configuration
   * @returns Observable of recommendation result
   *
   * @swagger
   * /api/recommendations:
   *   get:
   *     summary: Get product recommendations
   *     parameters:
   *       - name: productId
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *       - name: strategy
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *           enum: [similar, category, price-range, cultural, recent, popular]
   *     responses:
   *       200:
   *         description: Recommendation results
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RecommendationResult'
   */
  getRecommendations(
    product: Product | null,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    switch (config.strategy) {
      case 'similar':
        return this.getSimilarProducts(product!, config);

      case 'category':
        return this.getCategoryProducts(product!, config);

      case 'price-range':
        return this.getPriceRangeProducts(product!, config);

      case 'cultural':
        return this.getCulturalProducts(product!, config);

      case 'recent':
        return this.getRecentlyViewedRecommendations(config);

      case 'popular':
        return this.getPopularProducts(config);

      case 'frequently-bought':
        return this.getFrequentlyBoughtTogether(product!, config);

      case 'complementary':
        return this.getComplementaryProducts(product!, config);

      default:
        return of({
          products: [],
          strategy: config.strategy,
          title: 'Recommended Products',
          titleAr: 'منتجات موصى بها',
          limit: config.limit
        });
    }
  }

  /**
   * @description Maps ProductListItem from API to Product interface used by recommendations
   * @param item - Product list item from API response
   * @returns Product interface with mapped properties
   */
  private mapProductListItemToProduct(item: ProductListItem): Product {
    return {
      id: item.id.toString(),
      name: item.nameEn,
      nameArabic: item.nameAr,
      slug: item.slug,
      description: '',
      descriptionArabic: '',
      price: {
        amount: item.discountPrice ?? item.basePrice,
        currency: item.currency,
        originalPrice: item.discountPrice ? item.basePrice : undefined,
        discount: item.discountPrice ? {
          percentage: Math.round(((item.basePrice - item.discountPrice) / item.basePrice) * 100),
          type: 'percentage' as const
        } : undefined
      },
      category: {
        id: item.categoryId?.toString() ?? '',
        name: item.categoryNameEn ?? '',
        nameArabic: item.categoryNameAr ?? '',
        slug: item.categoryNameEn?.toLowerCase().replace(/\s+/g, '-') ?? '',
        breadcrumb: []
      },
      images: item.mainImage ? [{
        id: '1',
        url: item.mainImage,
        alt: item.nameEn,
        isPrimary: true,
        order: 1
      }] : [],
      specifications: {},
      seller: {
        id: '',
        name: '',
        location: { city: '', governorate: '' },
        rating: 0,
        reviewCount: 0,
        verified: false
      },
      shipping: {
        methods: [],
        deliveryTimes: {}
      },
      authenticity: {
        certified: false,
        heritage: 'modern',
        badges: []
      },
      inventory: {
        inStock: item.stockStatus === 'in_stock' || item.stockStatus === 'low_stock',
        quantity: item.stockStatus === 'in_stock' ? 10 : item.stockStatus === 'low_stock' ? 2 : 0,
        minOrderQuantity: 1,
        status: item.stockStatus,
        lowStockThreshold: 5
      },
      reviews: {
        averageRating: item.rating,
        totalReviews: item.reviewCount,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      timestamps: {
        created: new Date(),
        updated: new Date()
      }
    };
  }

  /**
   * @description Get similar products based on category and features
   * @param product - Reference product
   * @param config - Recommendation configuration
   * @returns Observable of recommendation result
   */
  private getSimilarProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.productService.getProducts({
      categoryId: product.category.id ? parseInt(product.category.id, 10) : undefined,
      limit: Math.min(config.limit * 3, 30),
      sortBy: 'popularity',
      minRating: config.minRating
    }).pipe(
      map(response => {
        let similar = response.data
          .map(item => this.mapProductListItemToProduct(item))
          .filter(p => {
            // Exclude current product and specified IDs
            if (p.id === product.id) return false;
            if (config.excludeIds?.includes(p.id)) return false;
            return true;
          });

        // Score and sort by similarity
        similar = similar
          .map(p => ({
            product: p,
            score: this.calculateSimilarityScore(product, p)
          }))
          .sort((a, b) => b.score - a.score)
          .map(item => item.product);

        return {
          products: similar.slice(0, config.limit),
          strategy: 'similar' as RecommendationStrategy,
          title: 'Similar Products',
          titleAr: 'منتجات مشابهة',
          limit: config.limit
        };
      })
    );
  }

  /**
   * @description Get products from same category
   * @param product - Reference product
   * @param config - Recommendation configuration
   * @returns Observable of recommendation result
   */
  private getCategoryProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.productService.getProducts({
      categoryId: product.category.id ? parseInt(product.category.id, 10) : undefined,
      limit: config.limit + 1,
      sortBy: 'rating',
      minRating: config.minRating
    }).pipe(
      map(response => {
        const filtered = response.data
          .map(item => this.mapProductListItemToProduct(item))
          .filter(p => {
            if (p.id === product.id) return false;
            if (config.excludeIds?.includes(p.id)) return false;
            return true;
          })
          .slice(0, config.limit);

        return {
          products: filtered,
          strategy: 'category' as RecommendationStrategy,
          title: `More ${product.category.name}`,
          titleAr: `المزيد من ${product.category.nameArabic || product.category.name}`,
          limit: config.limit
        };
      })
    );
  }

  /**
   * @description Get products in similar price range
   * @param product - Reference product
   * @param config - Recommendation configuration
   * @returns Observable of recommendation result
   */
  private getPriceRangeProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    const multiplier = config.priceRangeMultiplier || { min: 0.7, max: 1.3 };
    const basePrice = product.price.originalPrice || product.price.amount;
    const minPrice = Math.floor(basePrice * multiplier.min);
    const maxPrice = Math.ceil(basePrice * multiplier.max);

    return this.productService.getProducts({
      minPrice,
      maxPrice,
      limit: config.limit + 1,
      sortBy: 'popularity',
      minRating: config.minRating
    }).pipe(
      map(response => {
        const filtered = response.data
          .map(item => this.mapProductListItemToProduct(item))
          .filter(p => {
            if (p.id === product.id) return false;
            if (config.excludeIds?.includes(p.id)) return false;
            return true;
          })
          .slice(0, config.limit);

        return {
          products: filtered,
          strategy: 'price-range' as RecommendationStrategy,
          title: 'Products in Similar Price Range',
          titleAr: 'منتجات بنطاق سعر مشابه',
          limit: config.limit
        };
      })
    );
  }

  /**
   * @description Get culturally connected Syrian products
   * @param product - Reference product
   * @param config - Recommendation configuration
   * @returns Observable of recommendation result
   */
  private getCulturalProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    // Note: Cultural filtering requires backend support for heritage/UNESCO/region filters
    // For now, we fetch general products and filter client-side
    // TODO: Add heritage, UNESCO, and region query params to ProductService
    return this.productService.getProducts({
      limit: 50,
      sortBy: 'rating',
      minRating: config.minRating
    }).pipe(
      map(response => {
        const cultural = response.data
          .map(item => this.mapProductListItemToProduct(item))
          .filter(p => {
            if (p.id === product.id) return false;
            if (config.excludeIds?.includes(p.id)) return false;

            // Cultural filters (currently limited by lack of backend data)
            if (config.culturalFilter?.unescoOnly && !p.authenticity.unescoRecognition) {
              return false;
            }
            if (config.culturalFilter?.certifiedOnly && !p.authenticity.certified) {
              return false;
            }
            if (config.culturalFilter?.region && p.seller.location.governorate !== config.culturalFilter.region) {
              return false;
            }

            // Same region or heritage connection
            const sameRegion = p.seller.location.governorate === product.seller.location.governorate;
            const heritageMatch = p.authenticity.heritage === product.authenticity.heritage;
            const unescoMatch = p.authenticity.unescoRecognition && product.authenticity.unescoRecognition;

            return sameRegion || heritageMatch || unescoMatch;
          })
          .slice(0, config.limit);

        return {
          products: cultural,
          strategy: 'cultural' as RecommendationStrategy,
          title: 'Syrian Cultural Heritage',
          titleAr: 'التراث الثقافي السوري',
          limit: config.limit
        };
      })
    );
  }

  /**
   * Get recommendations based on recently viewed
   */
  private getRecentlyViewedRecommendations(
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    const recent = this.recentlyViewed()
      .filter(item => !config.excludeIds?.includes(item.product.id))
      .slice(0, config.limit)
      .map(item => item.product);

    return of({
      products: recent,
      strategy: 'recent' as RecommendationStrategy,
      title: 'Recently Viewed',
      titleAr: 'شاهدته مؤخراً',
      limit: config.limit
    });
  }

  /**
   * @description Get popular products
   * @param config - Recommendation configuration
   * @returns Observable of recommendation result
   */
  private getPopularProducts(
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.productService.getProducts({
      limit: config.limit + (config.excludeIds?.length || 0),
      sortBy: 'popularity',
      minRating: config.minRating
    }).pipe(
      map(response => {
        const popular = response.data
          .map(item => this.mapProductListItemToProduct(item))
          .filter(p => {
            if (config.excludeIds?.includes(p.id)) return false;
            if (config.categoryFilter && !config.categoryFilter.includes(p.category.slug)) return false;
            return true;
          })
          .slice(0, config.limit);

        return {
          products: popular,
          strategy: 'popular' as RecommendationStrategy,
          title: 'Popular Products',
          titleAr: 'المنتجات الشائعة',
          limit: config.limit
        };
      })
    );
  }

  /**
   * @description Get frequently bought together products
   * @param product - Reference product
   * @param config - Recommendation configuration
   * @returns Observable of recommendation result
   */
  private getFrequentlyBoughtTogether(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    // TODO: Implement backend analytics for purchase history
    // For now, use popular products as fallback
    return this.productService.getProducts({
      limit: config.limit + 1,
      sortBy: 'popularity',
      minRating: config.minRating
    }).pipe(
      map(response => {
        const together = response.data
          .map(item => this.mapProductListItemToProduct(item))
          .filter(p => {
            if (p.id === product.id) return false;
            if (config.excludeIds?.includes(p.id)) return false;
            return true;
          })
          .slice(0, config.limit);

        return {
          products: together,
          strategy: 'frequently-bought' as RecommendationStrategy,
          title: 'Frequently Bought Together',
          titleAr: 'يتم شراؤها معاً بشكل متكرر',
          limit: config.limit
        };
      })
    );
  }

  /**
   * @description Get complementary products
   * @param product - Reference product
   * @param config - Recommendation configuration
   * @returns Observable of recommendation result
   */
  private getComplementaryProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    // TODO: Implement backend complementary product associations
    // For now, use popular products from different categories as fallback
    return this.productService.getProducts({
      limit: config.limit + 5,
      sortBy: 'popularity',
      minRating: config.minRating
    }).pipe(
      map(response => {
        const complementary = response.data
          .map(item => this.mapProductListItemToProduct(item))
          .filter(p => {
            if (p.id === product.id) return false;
            if (config.excludeIds?.includes(p.id)) return false;
            // Different category for complementary products
            return p.category.id !== product.category.id;
          })
          .slice(0, config.limit);

        return {
          products: complementary,
          strategy: 'complementary' as RecommendationStrategy,
          title: 'You May Also Need',
          titleAr: 'قد تحتاج أيضاً',
          limit: config.limit
        };
      })
    );
  }

  /**
   * Track product view for recently viewed
   *
   * @param product - Product being viewed
   * @param duration - View duration in seconds
   */
  trackProductView(product: Product, duration?: number): void {
    const recent = this.recentlyViewed();

    // Find existing entry
    const existingIndex = recent.findIndex(item => item.product.id === product.id);

    let updated: RecentlyViewedProduct[];

    if (existingIndex >= 0) {
      // Update existing entry
      const existing = recent[existingIndex];
      updated = [
        {
          product,
          viewedAt: new Date(),
          viewCount: existing.viewCount + 1,
          duration
        },
        ...recent.filter((_, i) => i !== existingIndex)
      ];
    } else {
      // Add new entry
      updated = [
        {
          product,
          viewedAt: new Date(),
          viewCount: 1,
          duration
        },
        ...recent
      ];
    }

    // Keep only MAX_RECENTLY_VIEWED items
    this.recentlyViewed.set(updated.slice(0, this.MAX_RECENTLY_VIEWED));
    this.saveRecentlyViewed();
  }

  /**
   * Clear recently viewed history
   */
  clearRecentlyViewed(): void {
    this.recentlyViewed.set([]);
    localStorage.removeItem(this.RECENTLY_VIEWED_KEY);
  }

  /**
   * Remove product from recently viewed
   */
  removeFromRecentlyViewed(productId: string): void {
    const filtered = this.recentlyViewed().filter(
      item => item.product.id !== productId
    );
    this.recentlyViewed.set(filtered);
    this.saveRecentlyViewed();
  }

  /**
   * Calculate similarity score between two products
   */
  private calculateSimilarityScore(product1: Product, product2: Product): number {
    let score = 0;

    // Category match (highest weight)
    if (product1.category.slug === product2.category.slug) score += 50;

    // Price similarity (within 20%)
    const priceDiff = Math.abs(product1.price.amount - product2.price.amount);
    const priceAvg = (product1.price.amount + product2.price.amount) / 2;
    if (priceDiff / priceAvg <= 0.2) score += 30;

    // Material match
    const materials1 = new Set(product1.specifications.materials || []);
    const materials2 = new Set(product2.specifications.materials || []);
    const materialMatch = [...materials1].filter(m => materials2.has(m)).length;
    score += materialMatch * 10;

    // Heritage match
    if (product1.authenticity.heritage === product2.authenticity.heritage) score += 20;

    // UNESCO match
    if (product1.authenticity.unescoRecognition && product2.authenticity.unescoRecognition) {
      score += 15;
    }

    // Regional match
    if (product1.seller.location.governorate === product2.seller.location.governorate) {
      score += 10;
    }

    return score;
  }

  /**
   * Save recently viewed to localStorage
   */
  private saveRecentlyViewed(): void {
    try {
      localStorage.setItem(
        this.RECENTLY_VIEWED_KEY,
        JSON.stringify(this.recentlyViewed())
      );
    } catch (error) {
      console.error('Failed to save recently viewed:', error);
    }
  }

  /**
   * Load recently viewed from localStorage
   */
  private loadRecentlyViewed(): void {
    try {
      const stored = localStorage.getItem(this.RECENTLY_VIEWED_KEY);
      if (stored) {
        const items = JSON.parse(stored).map((item: any) => ({
          ...item,
          viewedAt: new Date(item.viewedAt)
        }));
        this.recentlyViewed.set(items);
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error);
    }
  }
}
