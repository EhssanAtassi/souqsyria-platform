import { Injectable, signal, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
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
import { MockDataService } from '../../core/mock-data/mock-data.service';

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
  private mockDataService = inject(MockDataService);

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
   * Get similar products based on category and features
   */
  private getSimilarProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.mockDataService.getProducts().pipe(
      map(products => {
        let similar = products.filter(p => {
          // Exclude current product and specified IDs
          if (p.id === product.id) return false;
          if (config.excludeIds?.includes(p.id)) return false;

          // Same category
          if (p.category.slug !== product.category.slug) return false;

          // Apply rating filter
          if (config.minRating && p.reviews.averageRating < config.minRating) {
            return false;
          }

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
   * Get products from same category
   */
  private getCategoryProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.mockDataService.getProducts().pipe(
      map(products => {
        const filtered = products
          .filter(p => {
            if (p.id === product.id) return false;
            if (config.excludeIds?.includes(p.id)) return false;
            if (p.category.slug !== product.category.slug) return false;
            if (config.minRating && p.reviews.averageRating < config.minRating) return false;
            return true;
          })
          .sort((a, b) => b.reviews.averageRating - a.reviews.averageRating);

        return {
          products: filtered.slice(0, config.limit),
          strategy: 'category' as RecommendationStrategy,
          title: `More ${product.category.name}`,
          titleAr: `المزيد من ${product.category.nameArabic || product.category.name}`,
          limit: config.limit
        };
      })
    );
  }

  /**
   * Get products in similar price range
   */
  private getPriceRangeProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    const multiplier = config.priceRangeMultiplier || { min: 0.8, max: 1.2 };
    const minPrice = product.price.amount * multiplier.min;
    const maxPrice = product.price.amount * multiplier.max;

    return this.mockDataService.getProducts().pipe(
      map(products => {
        const filtered = products.filter(p => {
          if (p.id === product.id) return false;
          if (config.excludeIds?.includes(p.id)) return false;
          if (p.price.amount < minPrice || p.price.amount > maxPrice) return false;
          if (config.minRating && p.reviews.averageRating < config.minRating) return false;
          return true;
        });

        return {
          products: filtered.slice(0, config.limit),
          strategy: 'price-range' as RecommendationStrategy,
          title: 'Products in Similar Price Range',
          titleAr: 'منتجات بنطاق سعر مشابه',
          limit: config.limit
        };
      })
    );
  }

  /**
   * Get culturally connected Syrian products
   */
  private getCulturalProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.mockDataService.getProducts().pipe(
      map(products => {
        const cultural = products.filter(p => {
          if (p.id === product.id) return false;
          if (config.excludeIds?.includes(p.id)) return false;

          // Cultural filters
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
        });

        return {
          products: cultural.slice(0, config.limit),
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
   * Get popular products
   */
  private getPopularProducts(
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.mockDataService.getProducts().pipe(
      map(products => {
        const popular = products
          .filter(p => {
            if (config.excludeIds?.includes(p.id)) return false;
            if (config.categoryFilter && !config.categoryFilter.includes(p.category.slug)) return false;
            if (config.minRating && p.reviews.averageRating < config.minRating) return false;
            return true;
          })
          .sort((a, b) => {
            // Sort by review count and rating
            const scoreA = a.reviews.totalReviews * a.reviews.averageRating;
            const scoreB = b.reviews.totalReviews * b.reviews.averageRating;
            return scoreB - scoreA;
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
   * Get frequently bought together products
   */
  private getFrequentlyBoughtTogether(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.mockDataService.getProducts().pipe(
      map(products => {
        // In real app, this would use purchase history analytics
        // For now, use same category with different subcategories
        const together = products.filter(p => {
          if (p.id === product.id) return false;
          if (config.excludeIds?.includes(p.id)) return false;
          // Same parent category but different product
          return p.category.parent === product.category.parent && p.category.slug !== product.category.slug;
        });

        return {
          products: together.slice(0, config.limit),
          strategy: 'frequently-bought' as RecommendationStrategy,
          title: 'Frequently Bought Together',
          titleAr: 'يتم شراؤها معاً بشكل متكرر',
          limit: config.limit
        };
      })
    );
  }

  /**
   * Get complementary products
   */
  private getComplementaryProducts(
    product: Product,
    config: RecommendationConfig
  ): Observable<RecommendationResult> {
    return this.mockDataService.getProducts().pipe(
      map(products => {
        // Complementary logic based on product type
        const complementary = products.filter(p => {
          if (p.id === product.id) return false;
          if (config.excludeIds?.includes(p.id)) return false;

          // Example: Damascus steel knife -> cutting board, knife care products
          // This would be more sophisticated in production
          return p.category.slug !== product.category.slug;
        });

        return {
          products: complementary.slice(0, config.limit),
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
