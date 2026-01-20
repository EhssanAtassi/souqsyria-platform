/**
 * Concrete Homepage Service Implementation
 *
 * @description Implements AbstractHomepageService with mock and real API methods
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of creating concrete
 * services that implement abstract interfaces with environment-based switching.
 *
 * @pattern Concrete Service Implementation
 * - Extends abstract service interface
 * - Implements both mock and real API methods
 * - Environment config determines which to use
 * - Mock methods use client-side filtering
 * - Real methods call HTTP endpoints
 *
 * @swagger
 * tags:
 *   - name: Homepage
 *     description: Homepage data operations
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { AbstractHomepageService } from './abstract-homepage.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { Campaign } from '../../../shared/interfaces/campaign.interface';
import { CategoryShowcaseSection } from '../../../shared/interfaces/category-showcase.interface';
import { ProductOffer } from '../../../shared/interfaces/product-offer.interface';
import { environment } from '../../../../environments/environment';

/**
 * Concrete Homepage Service
 *
 * @description Provides homepage data from mock or real APIs based on environment
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Public methods check environment.useMockData
 * - Delegate to mock or real implementation
 * - Mock data performs client-side operations
 * - Simulates network delay for realistic testing
 *
 * @example
 * ```typescript
 * // In component:
 * constructor(private homepageService: HomepageService) {}
 *
 * ngOnInit() {
 *   // Automatically uses mock or real based on environment
 *   this.homepageService.getFeaturedProducts().subscribe(products => {
 *     this.featuredProducts.set(products);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class HomepageService extends AbstractHomepageService {
  //#region Dependency Injection

  private readonly http = inject(HttpClient);

  //#endregion

  //#region Configuration

  /** API base URL from environment */
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3001/api';

  /** Simulate network delay for mock data (milliseconds) */
  private readonly mockDelay = 300;

  //#endregion

  //#region Product Operations

  /**
   * Get featured products
   * @description Delegates to mock or real implementation based on environment
   */
  getFeaturedProducts(): Observable<Product[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockFeaturedProducts()
      : this.http.get<Product[]>(`${this.apiUrl}/products/featured`);
  }

  /**
   * Get featured products from mock data
   * @description Returns Syrian products with high ratings and discounts
   */
  getMockFeaturedProducts(): Observable<Product[]> {
    return this.getMockAllProducts().pipe(
      map(products => {
        // Filter products with discounts or high ratings
        const featured = products.filter(p => {
          const hasDiscount = p.price.discount?.percentage && p.price.discount.percentage > 0;
          const highRating = p.reviews.averageRating >= 4.5;
          return hasDiscount || highRating;
        });
        return featured.slice(0, 8);
      }),
      delay(this.mockDelay)
    );
  }

  /**
   * Get new arrival products
   * @description Delegates to mock or real implementation based on environment
   */
  getNewArrivals(limit: number = 6): Observable<Product[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockNewArrivals(limit)
      : this.http.get<Product[]>(`${this.apiUrl}/products/new-arrivals`, {
          params: { limit: limit.toString() }
        });
  }

  /**
   * Get new arrivals from mock data
   * @description Sorts by creation date and returns most recent
   */
  getMockNewArrivals(limit: number = 6): Observable<Product[]> {
    return this.getMockAllProducts().pipe(
      map(products => {
        // Sort by creation date descending
        const sorted = [...products].sort((a, b) =>
          b.timestamps.created.getTime() - a.timestamps.created.getTime()
        );
        return sorted.slice(0, limit);
      }),
      delay(this.mockDelay)
    );
  }

  /**
   * Get top rated products
   * @description Delegates to mock or real implementation based on environment
   */
  getTopRatedProducts(limit: number = 6): Observable<Product[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockTopRatedProducts(limit)
      : this.http.get<Product[]>(`${this.apiUrl}/products/top-rated`, {
          params: { limit: limit.toString() }
        });
  }

  /**
   * Get top rated products from mock data
   * @description Sorts by rating and review count
   */
  getMockTopRatedProducts(limit: number = 6): Observable<Product[]> {
    return this.getMockAllProducts().pipe(
      map(products => {
        // Calculate score based on rating and review count
        const sorted = [...products].sort((a, b) => {
          const scoreA = a.reviews.averageRating * Math.log(a.reviews.totalReviews + 1);
          const scoreB = b.reviews.averageRating * Math.log(b.reviews.totalReviews + 1);
          return scoreB - scoreA;
        });
        return sorted.slice(0, limit);
      }),
      delay(this.mockDelay)
    );
  }

  /**
   * Get all products
   * @description Delegates to mock or real implementation based on environment
   */
  getAllProducts(): Observable<Product[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockAllProducts()
      : this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  /**
   * Get all products from mock data
   * @description Returns comprehensive Syrian marketplace product catalog
   */
  getMockAllProducts(): Observable<Product[]> {
    const mockSyrianProducts: Product[] = this.getMockSyrianProductsCatalog();
    return of(mockSyrianProducts).pipe(delay(this.mockDelay));
  }

  //#endregion

  //#region Campaign Operations

  /**
   * Get active campaigns
   * @description Delegates to mock or real implementation based on environment
   */
  getActiveCampaigns(): Observable<Campaign[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockActiveCampaigns()
      : this.http.get<Campaign[]>(`${this.apiUrl}/campaigns/active`);
  }

  /**
   * Get active campaigns from mock data
   * @description Returns Syrian cultural campaigns
   */
  getMockActiveCampaigns(): Observable<Campaign[]> {
    const mockCampaigns: Campaign[] = this.getMockSyrianCampaigns();
    return of(mockCampaigns).pipe(delay(this.mockDelay));
  }

  //#endregion

  //#region Category Showcase Operations

  /**
   * Get category showcase sections
   * @description Delegates to mock or real implementation based on environment
   */
  getCategoryShowcaseSections(): Observable<CategoryShowcaseSection[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockCategoryShowcaseSections()
      : this.http.get<CategoryShowcaseSection[]>(`${this.apiUrl}/homepage/showcase-sections`);
  }

  /**
   * Get category showcase sections from mock data
   * @description Returns empty array - sections managed by HomepageSectionsService
   */
  getMockCategoryShowcaseSections(): Observable<CategoryShowcaseSection[]> {
    // Category showcase sections are managed by HomepageSectionsService
    // Return empty array to avoid duplication
    return of([]).pipe(delay(this.mockDelay));
  }

  //#endregion

  //#region Product Offers Operations

  /**
   * Get featured offers
   * @description Delegates to mock or real implementation based on environment
   */
  getFeaturedOffers(): Observable<ProductOffer[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockFeaturedOffers()
      : this.http.get<ProductOffer[]>(`${this.apiUrl}/offers/featured`);
  }

  /**
   * Get featured offers from mock data
   * @description Returns empty array - offers managed by ProductOffersService
   */
  getMockFeaturedOffers(): Observable<ProductOffer[]> {
    // Product offers are managed by ProductOffersService
    // Return empty array to avoid duplication
    return of([]).pipe(delay(this.mockDelay));
  }

  /**
   * Get flash sale offers
   * @description Delegates to mock or real implementation based on environment
   */
  getFlashSaleOffers(): Observable<ProductOffer[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockFlashSaleOffers()
      : this.http.get<ProductOffer[]>(`${this.apiUrl}/offers/flash-sale`);
  }

  /**
   * Get flash sale offers from mock data
   * @description Returns empty array - offers managed by ProductOffersService
   */
  getMockFlashSaleOffers(): Observable<ProductOffer[]> {
    // Product offers are managed by ProductOffersService
    // Return empty array to avoid duplication
    return of([]).pipe(delay(this.mockDelay));
  }

  //#endregion

  //#region Analytics Operations

  /**
   * Track homepage view event
   */
  trackHomepageView(): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log('Analytics: Homepage viewed');
      return of(undefined).pipe(delay(100));
    }
    return this.http.post<void>(`${this.apiUrl}/analytics/homepage-view`, {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track category click event
   */
  trackCategoryClick(categoryId: string, categoryName: string, source: string): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log('Analytics: Category clicked', { categoryId, categoryName, source });
      return of(undefined).pipe(delay(100));
    }
    return this.http.post<void>(`${this.apiUrl}/analytics/category-click`, {
      categoryId,
      categoryName,
      source,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track product view event
   */
  trackProductView(productId: string, source: string): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log('Analytics: Product viewed', { productId, source });
      return of(undefined).pipe(delay(100));
    }
    return this.http.post<void>(`${this.apiUrl}/analytics/product-view`, {
      productId,
      source,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track campaign interaction event
   */
  trackCampaignInteraction(
    campaignId: string,
    interactionType: 'click' | 'view' | 'cta_click'
  ): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log('Analytics: Campaign interaction', { campaignId, interactionType });
      return of(undefined).pipe(delay(100));
    }
    return this.http.post<void>(`${this.apiUrl}/analytics/campaign-interaction`, {
      campaignId,
      interactionType,
      timestamp: new Date().toISOString()
    });
  }

  //#endregion

  //#region Mock Data Catalogs

  /**
   * Mock Syrian products catalog
   * @description Comprehensive product catalog extracted from component
   * @private
   */
  private getMockSyrianProductsCatalog(): Product[] {
    return [
      // Product data will be extracted from the component
      // For now, returning a smaller set - will expand in next iteration
      {
        id: 'damascus-steel-knife-001',
        name: 'Damascus Steel Chef Knife',
        nameArabic: 'سكين الطبخ الدمشقي',
        slug: 'damascus-steel-chef-knife',
        description: 'Handcrafted Damascus steel chef knife with traditional Syrian forging techniques',
        descriptionArabic: 'سكين طبخ من الفولاذ الدمشقي المصنوع يدوياً بالتقنيات السورية التقليدية',
        price: {
          amount: 150,
          currency: 'USD',
          originalPrice: 200,
          discount: {
            percentage: 25,
            type: 'percentage'
          }
        },
        images: [
          {
            id: 'damascus-knife-1',
            url: '/assets/images/products/exp1.png',
            alt: 'Damascus Steel Knife',
            isPrimary: true,
            order: 1
          }
        ],
        category: {
          id: 'damascus-steel',
          name: 'Damascus Steel',
          nameArabic: 'الفولاذ الدمشقي',
          slug: 'damascus-steel',
          breadcrumb: ['Home', 'Categories', 'Damascus Steel']
        },
        inventory: {
          inStock: true,
          quantity: 25,
          minOrderQuantity: 1,
          status: 'in_stock',
          lowStockThreshold: 5
        },
        reviews: {
          averageRating: 4.8,
          totalReviews: 127,
          ratingDistribution: { 1: 3, 2: 2, 3: 8, 4: 31, 5: 83 }
        },
        specifications: {
          dimensions: { length: 25, width: 5, height: 2, unit: 'cm' },
          weight: { value: 300, unit: 'g' },
          materials: ['Damascus Steel', 'Walnut Wood Handle'],
          manufacturing: {
            method: 'Hand Forged',
            origin: 'Damascus, Syria',
            craftsman: 'Master Ahmad Al-Dimashqi'
          }
        },
        seller: {
          id: 'damascus-steel-artisans',
          name: 'Damascus Steel Artisans',
          nameArabic: 'حرفيو الفولاذ الدمشقي',
          location: { city: 'Damascus', governorate: 'Damascus' },
          rating: 4.9,
          reviewCount: 245,
          yearsInBusiness: 15,
          verified: true,
          specializations: ['Damascus Steel', 'Traditional Forging']
        },
        shipping: {
          methods: [{
            id: 'express',
            name: 'Express International',
            cost: { amount: 25, currency: 'USD' },
            deliveryTime: { min: 7, max: 14, unit: 'days' },
            trackingAvailable: true,
            insured: true
          }],
          deliveryTimes: {
            'North America': { min: 10, max: 15, unit: 'days' },
            'Europe': { min: 7, max: 12, unit: 'days' },
            'Asia': { min: 5, max: 10, unit: 'days' }
          }
        },
        authenticity: {
          certified: true,
          heritage: 'traditional',
          culturalSignificance: 'UNESCO recognized Damascus steel craftsmanship',
          traditionalTechniques: ['Pattern Welding', 'Hand Forging'],
          unescoRecognition: true,
          badges: ['UNESCO Heritage', 'Handcrafted', 'Syrian Artisan']
        },
        timestamps: {
          created: new Date('2024-01-01'),
          updated: new Date('2024-01-15')
        },
        tags: ['featured', 'handcrafted', 'damascus', 'unesco-heritage']
      },
      {
        id: 'aleppo-soap-premium-002',
        name: 'Premium Aleppo Laurel Soap',
        nameArabic: 'صابون حلب الفاخر بالغار',
        slug: 'premium-aleppo-laurel-soap',
        description: 'Traditional Aleppo soap with 40% laurel oil, UNESCO recognized heritage craft',
        descriptionArabic: 'صابون حلب التقليدي بزيت الغار 40%، حرفة تراثية معترف بها من اليونسكو',
        price: {
          amount: 25,
          currency: 'USD',
          originalPrice: 35,
          discount: {
            percentage: 29,
            type: 'percentage'
          }
        },
        images: [
          {
            id: 'aleppo-soap-1',
            url: '/assets/images/products/1.png',
            alt: 'Aleppo Soap',
            isPrimary: true,
            order: 1
          }
        ],
        category: {
          id: 'beauty-wellness',
          name: 'Beauty & Wellness',
          nameArabic: 'الجمال والعافية',
          slug: 'beauty-wellness',
          breadcrumb: ['Home', 'Categories', 'Beauty & Wellness']
        },
        inventory: {
          inStock: true,
          quantity: 150,
          minOrderQuantity: 1,
          status: 'in_stock',
          lowStockThreshold: 10
        },
        reviews: {
          averageRating: 4.9,
          totalReviews: 89,
          ratingDistribution: { 1: 1, 2: 1, 3: 4, 4: 18, 5: 65 }
        },
        specifications: {
          dimensions: { length: 10, width: 6, height: 4, unit: 'cm' },
          weight: { value: 150, unit: 'g' },
          materials: ['Olive Oil', '40% Laurel Oil', 'Natural Soda'],
          manufacturing: {
            method: 'Traditional Cold Process',
            origin: 'Aleppo, Syria',
            craftsman: 'Master Khalil Al-Halabi'
          }
        },
        seller: {
          id: 'aleppo-soap-masters',
          name: 'Aleppo Soap Masters',
          nameArabic: 'أساتذة صابون حلب',
          location: { city: 'Aleppo', governorate: 'Aleppo' },
          rating: 4.8,
          reviewCount: 189,
          yearsInBusiness: 25,
          verified: true,
          specializations: ['Aleppo Soap', 'Natural Cosmetics']
        },
        shipping: {
          methods: [{
            id: 'standard',
            name: 'Standard International',
            cost: { amount: 15, currency: 'USD' },
            deliveryTime: { min: 10, max: 20, unit: 'days' },
            trackingAvailable: true,
            insured: false
          }],
          deliveryTimes: {
            'North America': { min: 12, max: 20, unit: 'days' },
            'Europe': { min: 8, max: 15, unit: 'days' },
            'Middle East': { min: 3, max: 7, unit: 'days' }
          }
        },
        authenticity: {
          certified: true,
          heritage: 'traditional',
          culturalSignificance: 'Traditional Aleppo soap making, UNESCO recognized',
          traditionalTechniques: ['Cold Process', 'Natural Aging'],
          unescoRecognition: true,
          badges: ['UNESCO Heritage', 'Natural', 'Traditional']
        },
        timestamps: {
          created: new Date('2024-01-02'),
          updated: new Date('2024-01-16')
        },
        tags: ['featured', 'unesco-heritage', 'natural', 'traditional']
      }
      // Additional products can be added here
    ];
  }

  /**
   * Mock Syrian campaigns catalog
   * @description Campaign data extracted from component
   * @private
   */
  private getMockSyrianCampaigns(): Campaign[] {
    return [
      {
        id: 'damascus-steel-heritage-campaign',
        name: 'Damascus Steel Heritage Collection',
        nameArabic: 'مجموعة تراث الفولاذ الدمشقي',
        type: 'product_spotlight',
        status: 'active',
        heroImage: {
          url: '/assets/images/products/exp1.png',
          alt: {
            english: 'Damascus Steel Heritage',
            arabic: 'تراث الفولاذ الدمشقي'
          },
          dimensions: { width: 1200, height: 600 },
          format: 'jpg',
          size: 245760
        },
        headline: {
          english: 'Authentic Damascus Steel Collection',
          arabic: 'مجموعة الفولاذ الدمشقي الأصيل'
        },
        subheadline: {
          english: 'Handcrafted by Syrian artisans using 1000-year-old techniques',
          arabic: 'صُنع يدوياً من قبل الحرفيين السوريين بتقنيات عمرها ألف عام'
        },
        cta: {
          text: {
            english: 'Shop Damascus Steel',
            arabic: 'تسوق الفولاذ الدمشقي'
          },
          variant: 'primary',
          size: 'large',
          color: 'syrian-red',
          icon: 'arrow_forward',
          iconPosition: 'right'
        },
        targetRoute: {
          type: 'category',
          target: '/category/damascus-steel',
          tracking: {
            source: 'hero-slider',
            medium: 'campaign',
            campaign: 'damascus-steel-heritage-campaign'
          }
        },
        schedule: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          timezone: 'Asia/Damascus'
        },
        analytics: {
          impressions: 15420,
          clicks: 892,
          clickThroughRate: 5.78,
          conversions: 127,
          conversionRate: 14.24,
          revenue: 19050,
          lastUpdated: new Date('2024-01-15')
        },
        syrianData: {
          region: 'damascus',
          specialties: ['Damascus Steel', 'Traditional Forging'],
          culturalContext: {
            english: 'Damascus steel represents centuries of Syrian metallurgical excellence',
            arabic: 'يمثل الفولاذ الدمشقي قروناً من التميز المعدني السوري'
          },
          unescoRecognition: true,
          artisan: {
            name: {
              english: 'Master Ahmad Al-Dimashqi',
              arabic: 'الأستاذ أحمد الدمشقي'
            },
            bio: {
              english: 'Third generation Damascus steel craftsman',
              arabic: 'حرفي فولاذ دمشقي من الجيل الثالث'
            },
            location: 'Damascus Old City',
            experience: 25,
            specialization: ['Blade Forging', 'Pattern Welding']
          }
        },
        metadata: {
          createdBy: 'admin@souqsyria.com',
          createdAt: new Date('2024-01-01'),
          updatedBy: 'admin@souqsyria.com',
          updatedAt: new Date('2024-01-15'),
          version: 1,
          tags: ['damascus-steel', 'heritage', 'artisan'],
          priority: 9
        }
      }
      // Additional campaigns can be added here
    ];
  }

  //#endregion
}
