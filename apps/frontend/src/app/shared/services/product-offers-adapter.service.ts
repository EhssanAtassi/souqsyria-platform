import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ProductOffer } from '../interfaces/product-offer.interface';
import { environment } from '../../../environments/environment';

/**
 * Backend Product API Response Interface
 * Matches the structure returned by /api/products/featured
 */
interface BackendProduct {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  sku: string;
  currency: string;
  base_price: string;
  discount_price: string | null;
  discount_percentage: number | null;
  image_url: string;
  is_featured: boolean;
  featured_badge: string | null;
  promotional_text: string | null;
  category: {
    id: number;
    name_en: string;
    name_ar: string;
    slug: string;
  };
}

/**
 * Backend API Response Wrapper
 */
interface BackendResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit?: number;
  };
}

/**
 * Product Offers Adapter Service
 *
 * Transforms backend API responses into frontend ProductOffer format.
 * Handles data structure differences between backend and frontend models.
 *
 * Features:
 * - Fetches from backend /api/products/featured endpoint
 * - Transforms backend product format to ProductOffer interface
 * - Supports all 3 price display types (discount/sale/price)
 * - Adds default CTA text and filter params
 * - Handles errors gracefully with fallback data
 *
 * @swagger
 * tags:
 *   - name: Product Offers Adapter
 *     description: Backend API integration and data transformation
 */
@Injectable({
  providedIn: 'root'
})
export class ProductOffersAdapterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3001/api';

  /**
   * Get Featured Offers from Backend
   *
   * Fetches featured products and transforms them into ProductOffer format
   *
   * @param limit - Number of offers to return (default: 3)
   * @param sort - Sorting mode: featured, best_seller, new_arrivals
   * @returns Observable of ProductOffer array
   */
  getFeaturedOffers(limit: number = 3, sort: string = 'featured'): Observable<ProductOffer[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('sort', sort);

    return this.http.get<BackendResponse<BackendProduct>>(`${this.apiUrl}/products/featured`, { params })
      .pipe(
        map(response => this.transformToProductOffers(response.data)),
        catchError(error => {
          console.error('Failed to fetch featured offers from backend:', error);
          return of([]); // Return empty array on error
        })
      );
  }

  /**
   * Get Offers by Category
   *
   * @param categoryId - Category ID to filter by
   * @param limit - Number of offers to return
   * @returns Observable of ProductOffer array
   */
  getOffersByCategory(categoryId: number, limit: number = 3): Observable<ProductOffer[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('categoryId', categoryId.toString());

    return this.http.get<BackendResponse<BackendProduct>>(`${this.apiUrl}/products/featured`, { params })
      .pipe(
        map(response => this.transformToProductOffers(response.data)),
        catchError(error => {
          console.error(`Failed to fetch offers for category ${categoryId}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Get Best Seller Offers
   *
   * @param limit - Number of offers to return
   * @returns Observable of ProductOffer array
   */
  getBestSellerOffers(limit: number = 3): Observable<ProductOffer[]> {
    return this.getFeaturedOffers(limit, 'best_seller');
  }

  /**
   * Get New Arrival Offers
   *
   * @param limit - Number of offers to return
   * @returns Observable of ProductOffer array
   */
  getNewArrivalOffers(limit: number = 3): Observable<ProductOffer[]> {
    return this.getFeaturedOffers(limit, 'new_arrivals');
  }

  /**
   * Transform Backend Products to ProductOffers
   *
   * Converts backend product format to frontend ProductOffer format
   * Intelligently maps to appropriate price display type
   *
   * @param products - Array of backend products
   * @returns Array of ProductOffer
   */
  private transformToProductOffers(products: BackendProduct[]): ProductOffer[] {
    return products.map((product, index) => this.transformProduct(product, index));
  }

  /**
   * Transform Single Product
   *
   * Maps backend product to ProductOffer with intelligent price display selection
   *
   * @param product - Backend product
   * @param index - Index in array (used for alternating display types)
   * @returns ProductOffer
   */
  private transformProduct(product: BackendProduct, index: number): ProductOffer {
    // Determine price display type based on discount and index
    const priceDisplayType = this.determinePriceDisplayType(product, index);

    return {
      id: product.id,
      title: product.name_en,
      titleAr: product.name_ar,
      subtitle: this.extractEnglishText(product.promotional_text),
      subtitleAr: this.extractArabicText(product.promotional_text),
      image: product.image_url,
      priceDisplay: this.buildPriceDisplay(product, priceDisplayType),
      ctaText: 'Shop Now',
      ctaTextAr: 'تسوق الآن',
      targetUrl: `/products`,
      filterParams: {
        category: product.category.slug,
        featured: true
      },
      isActive: true
    };
  }

  /**
   * Determine Price Display Type
   *
   * Intelligently selects display type based on product data and position
   *
   * @param product - Backend product
   * @param index - Position in array
   * @returns Price display type
   */
  private determinePriceDisplayType(product: BackendProduct, index: number): 'discount' | 'sale' | 'price' {
    // If has discount, use discount type for first item, sale type for second
    if (product.discount_price && product.discount_percentage) {
      return index % 3 === 0 ? 'discount' : 'sale';
    }

    // Otherwise use simple price display
    return 'price';
  }

  /**
   * Build Price Display Object
   *
   * Creates the flexible priceDisplay object based on type
   *
   * @param product - Backend product
   * @param type - Display type
   * @returns PriceDisplay object
   */
  private buildPriceDisplay(product: BackendProduct, type: 'discount' | 'sale' | 'price') {
    const basePrice = parseFloat(product.base_price);
    const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
    const discountPercentage = product.discount_percentage;

    switch (type) {
      case 'discount':
        return {
          type: 'discount' as const,
          discountBadge: discountPercentage ? `${discountPercentage}%\nOFF` : '40%\nOFF',
          badgeColor: '#FF6B35',
          originalPrice: basePrice,
          discountedPrice: discountPrice || basePrice * 0.6,
          currency: product.currency
        };

      case 'sale':
        return {
          type: 'sale' as const,
          saleLabel: 'SALE UP TO',
          salePercentage: discountPercentage ? `${discountPercentage}% Off` : '40% Off',
          currency: product.currency
        };

      case 'price':
        return {
          type: 'price' as const,
          priceLabel: 'PRICE JUST',
          price: discountPrice || basePrice,
          currency: product.currency
        };
    }
  }

  /**
   * Extract English Text from Promotional Text
   * Assumes promotional text contains Arabic first, English second
   */
  private extractEnglishText(text: string | null): string | undefined {
    if (!text) return undefined;

    // Simple heuristic: English usually contains Latin characters
    const hasLatinChars = /[a-zA-Z]/.test(text);
    return hasLatinChars ? text : undefined;
  }

  /**
   * Extract Arabic Text from Promotional Text
   */
  private extractArabicText(text: string | null): string | undefined {
    if (!text) return undefined;

    // Simple heuristic: Arabic contains Arabic script
    const hasArabicChars = /[\u0600-\u06FF]/.test(text);
    return hasArabicChars ? text : undefined;
  }
}
