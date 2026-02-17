import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, map, switchMap } from 'rxjs';
import { ProductOffer } from '../interfaces/product-offer.interface';
import { ProductOffersAdapterService } from './product-offers-adapter.service';
import { environment } from '../../../environments/environment';

/**
 * Product Offers Service
 *
 * Provides product offer data for promotional sections.
 * Currently uses mock data, but designed for easy backend integration.
 *
 * Features:
 * - Mock data matching Figma design (3 different price formats)
 * - Observable-based API (ready for HTTP integration)
 * - Multiple offer collections (weekly, flash sale, etc.)
 * - Bilingual Arabic/English support
 *
 * Backend Integration Plan:
 * ```typescript
 * // Replace mock with HTTP calls
 * return this.http.get<ProductOffer[]>('/api/offers/featured');
 * ```
 *
 * @swagger
 * tags:
 *   - name: Product Offers
 *     description: Promotional offers management
 *
 * paths:
 *   /api/offers/featured:
 *     get:
 *       summary: Get featured product offers
 *       tags: [Product Offers]
 *       responses:
 *         200:
 *           description: Array of product offers
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductOffer'
 *
 *   /api/offers/flash-sale:
 *     get:
 *       summary: Get flash sale offers
 *       tags: [Product Offers]
 *       responses:
 *         200:
 *           description: Array of flash sale offers
 */
@Injectable({
  providedIn: 'root'
})
export class ProductOffersService {
  private readonly adapter = inject(ProductOffersAdapterService);
  private readonly useMockData = environment.enableMockData || false;

  /**
   * Get Featured Weekly Offers
   *
   * Returns 3 offers with different price display formats.
   * Uses backend API via adapter or falls back to mock data.
   *
   * @returns Observable of product offers array
   */
  getFeaturedOffers(): Observable<ProductOffer[]> {
    // Use backend API via adapter (unless mock data is enabled)
    if (!this.useMockData) {
      return this.adapter.getFeaturedOffers(3, 'featured').pipe(
        switchMap(offers => {
          // If adapter returned empty (API failed), use mock data
          if (offers.length === 0) {
            console.warn('⚠️ No featured offers from backend, using mock data');
            return this.getMockFeaturedOffers();
          }
          return of(offers);
        })
      );
    }

    // Mock data fallback (for offline development)
    return this.getMockFeaturedOffers();
  }

  /**
   * Get Mock Featured Offers
   * Fallback data for offline development
   */
  private getMockFeaturedOffers(): Observable<ProductOffer[]> {
    const offers: ProductOffer[] = [
      {
        id: 1,
        title: 'Damascus Steel Collection',
        titleAr: 'مجموعة الفولاذ الدمشقي',
        subtitle: 'Minimal Speaker',
        subtitleAr: 'سماعة صغيرة',
        image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
        priceDisplay: {
          type: 'discount',
          discountBadge: '40%\nOFF',
          badgeColor: '#FF6B35',
          originalPrice: 298.60,
          discountedPrice: 159.99,
          currency: 'USD'
        },
        ctaText: 'Shop Now',
        ctaTextAr: 'تسوق الآن',
        targetUrl: '/products',
        filterParams: {
          category: 'damascus-steel',
          sale: true
        },
        isActive: true
      },
      {
        id: 2,
        title: 'Wooden Minimalistic Chairs',
        titleAr: 'كراسي خشبية بسيطة',
        image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&h=400&fit=crop&q=80',
        priceDisplay: {
          type: 'sale',
          saleLabel: 'SALE UP TO',
          salePercentage: '40% Off',
          currency: 'USD'
        },
        ctaText: 'Shop Now',
        ctaTextAr: 'تسوق الآن',
        targetUrl: '/products',
        filterParams: {
          category: 'furniture',
          sale: true
        },
        isActive: true
      },
      {
        id: 3,
        title: 'IQOS 2.4 Holder & Charger',
        titleAr: 'حامل وشاحن IQOS 2.4',
        image: 'https://images.unsplash.com/photo-1519669556878-63bdad8a1a49?w=600&h=400&fit=crop&q=80',
        priceDisplay: {
          type: 'price',
          priceLabel: 'PRICE JUST',
          price: 105.50,
          currency: 'USD'
        },
        ctaText: 'Shop Now',
        ctaTextAr: 'تسوق الآن',
        targetUrl: '/products',
        filterParams: {
          category: 'electronics',
          featured: true
        },
        isActive: true
      }
    ];

    return of(offers).pipe(delay(100));
  }

  /**
   * Get Flash Sale Offers
   *
   * Returns time-limited flash sale offers.
   * Uses backend API via adapter or falls back to mock data.
   *
   * @returns Observable of product offers array
   */
  getFlashSaleOffers(): Observable<ProductOffer[]> {
    // Use backend API via adapter (best seller sorting for flash sales)
    if (!this.useMockData) {
      return this.adapter.getBestSellerOffers(3).pipe(
        switchMap(offers => {
          if (offers.length === 0) {
            console.warn('⚠️ No flash sale offers from backend, using mock data');
            return this.getMockFlashSaleOffers();
          }
          return of(offers);
        })
      );
    }

    // Mock data fallback
    return this.getMockFlashSaleOffers();
  }

  /**
   * Get Mock Flash Sale Offers
   * Fallback data for offline development
   */
  private getMockFlashSaleOffers(): Observable<ProductOffer[]> {
    const offers: ProductOffer[]= [
      {
        id: 101,
        title: 'Premium Aleppo Soap Bundle',
        titleAr: 'حزمة صابون حلب الفاخر',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop&q=80',
        priceDisplay: {
          type: 'discount',
          discountBadge: '50%\nOFF',
          badgeColor: '#DC2626',
          originalPrice: 80.00,
          discountedPrice: 40.00,
          currency: 'USD'
        },
        ctaText: 'Shop Now',
        ctaTextAr: 'تسوق الآن',
        targetUrl: '/products',
        filterParams: {
          category: 'beauty-wellness',
          flashSale: true
        },
        isActive: true
      },
      {
        id: 102,
        title: 'Syrian Brocade Fabric',
        titleAr: 'قماش البروكار السوري',
        image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop&q=80',
        priceDisplay: {
          type: 'sale',
          saleLabel: 'FLASH SALE',
          salePercentage: '60% Off',
          currency: 'USD'
        },
        ctaText: 'Shop Now',
        ctaTextAr: 'تسوق الآن',
        targetUrl: '/products',
        filterParams: {
          category: 'textiles-fabrics',
          flashSale: true
        },
        isActive: true
      },
      {
        id: 103,
        title: 'Damascus Seven Spice Mix',
        titleAr: 'بهارات سبع بهارات دمشقية',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80',
        priceDisplay: {
          type: 'price',
          priceLabel: 'ONLY',
          price: 15.99,
          currency: 'USD'
        },
        ctaText: 'Shop Now',
        ctaTextAr: 'تسوق الآن',
        targetUrl: '/products',
        filterParams: {
          category: 'food-spices',
          flashSale: true
        },
        isActive: true
      }
    ];

    return of(offers).pipe(delay(100));
  }

  /**
   * Get Offers by Category
   *
   * Returns offers filtered by specific category.
   * Currently returns all featured offers (backend filtering to be added).
   *
   * @param categorySlug - Category slug (e.g., 'damascus-steel')
   * @returns Observable of product offers array
   */
  getOffersByCategory(categorySlug: string): Observable<ProductOffer[]> {
    // Currently returns all featured offers (uses backend via adapter)
    // TODO: Add backend endpoint for category-specific offers
    return this.getFeaturedOffers().pipe(
      delay(100)
    );
  }

  /**
   * Get Single Offer by ID
   *
   * Finds a specific offer by ID.
   * Currently searches within featured offers (dedicated endpoint to be added).
   *
   * @param offerId - Offer ID
   * @returns Observable of product offer or null if not found
   */
  getOfferById(offerId: number): Observable<ProductOffer | null> {
    // Currently searches within featured offers (uses backend via adapter)
    // TODO: Add backend endpoint for single offer retrieval
    return this.getFeaturedOffers().pipe(
      map(offers => offers.find(offer => offer.id === offerId) || null),
      delay(100)
    );
  }
}
