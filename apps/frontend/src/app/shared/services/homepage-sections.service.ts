import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  CategoryShowcaseSection,
  HomepageSectionConfig,
  FeaturedBanner,
  SubcategoryCard
} from '../interfaces/category-showcase.interface';
import {
  BackendHomepageResponse,
  BackendHomepageSection,
  BackendFeaturedProduct,
  BackendChildCategory,
  HomepageSectionsQueryParams
} from '../interfaces/backend-homepage-api.interface';
import { environment } from '../../../environments/environment';

/**
 * Homepage Sections Service
 *
 * Manages category showcase sections displayed on the homepage.
 * Integrates with NestJS backend API at /api/categories/homepage-sections.
 * Transforms backend data structure to frontend component format.
 *
 * @swagger
 * components:
 *   schemas:
 *     HomepageSectionsService:
 *       type: object
 *       description: Service for managing homepage category showcase sections with API integration
 */
@Injectable({
  providedIn: 'root'
})
export class HomepageSectionsService {
  private readonly http = inject(HttpClient);

  /**
   * Backend API base URL
   * Default: http://localhost:3001/api (development)
   */
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3001/api';

  /**
   * Fallback mock data for Syrian marketplace category showcase sections
   * Used when API is unavailable or for development/testing
   * Adapted from Figma design with 3 main sections
   */
  private readonly mockSections: CategoryShowcaseSection[] = [
    {
      id: 'damascus-steel-showcase',
      title: {
        en: 'Damascus Steel & Traditional Crafts',
        ar: 'الفولاذ الدمشقي والحرف التقليدية'
      },
      titleIcon: 'hardware',
      visible: true,
      order: 1,
      featuredBanner: {
        id: 'damascus-knife-promo',
        title: {
          en: 'EXPERIENCE AUTHENTIC DAMASCUS STEEL',
          ar: 'اكتشف الفولاذ الدمشقي الأصيل'
        },
        subtitle: {
          en: 'Handcrafted by Master Artisans',
          ar: 'صناعة يدوية من الحرفيين المهرة'
        },
        imageUrl: '/assets/images/products/exp1.png',
        originalPrice: 625.00,
        discountedPrice: 205.00,
        currency: 'USD',
        ctaText: { en: 'Shop Now', ar: 'تسوق الآن' },
        ctaLink: '/category/damascus-steel',
        badge: { text: { en: 'BEST SELLER', ar: 'الأكثر مبيعاً' }, color: '#C41E3A' }
      },
      subcategories: [
        // FEATURED Large Cards (First 2)
        { id: 'knives', name: { en: 'Damascus Knives', ar: 'السكاكين الدمشقية' }, imageUrl: '/assets/images/products/exp1.png', itemCount: 12, route: '/category/damascus-steel/knives', featured: true },
        { id: 'swords', name: { en: 'Swords & Blades', ar: 'السيوف والنصال' }, imageUrl: '/assets/images/products/1.png', itemCount: 8, route: '/category/damascus-steel/swords', featured: true },
        // REGULAR Small Cards (Next 5)
        { id: 'jewelry', name: { en: 'Metal Jewelry', ar: 'المجوهرات المعدنية' }, iconClass: 'local_jewelry', itemCount: 15, route: '/category/jewelry' },
        { id: 'decorative', name: { en: 'Decorative Items', ar: 'الأشياء الزخرفية' }, iconClass: 'castle', itemCount: 10, route: '/category/decorative' },
        { id: 'tools', name: { en: 'Artisan Tools', ar: 'أدوات الحرفيين' }, iconClass: 'handyman', itemCount: 6, route: '/category/tools' },
        { id: 'custom', name: { en: 'Custom Orders', ar: 'الطلبات المخصصة' }, iconClass: 'design_services', itemCount: 3, route: '/custom-orders' },
        { id: 'gifts', name: { en: 'Gift Sets', ar: 'مجموعات الهدايا' }, iconClass: 'card_giftcard', itemCount: 9, route: '/gifts' }
      ],
      navigationLinks: {
        newArrivals: '/category/damascus-steel/new-arrivals',
        bestSeller: '/category/damascus-steel/best-sellers'
      }
    },
    {
      id: 'beauty-textiles-showcase',
      title: {
        en: 'Beauty & Traditional Textiles',
        ar: 'الجمال والمنسوجات التقليدية'
      },
      titleIcon: 'spa',
      visible: true,
      order: 2,
      featuredBanner: {
        id: 'aleppo-soap-promo',
        title: {
          en: 'PREMIUM ALEPPO LAUREL SOAP',
          ar: 'صابون الغار الحلبي الفاخر'
        },
        subtitle: {
          en: 'UNESCO Heritage Craftsmanship',
          ar: 'حرفة تراث اليونسكو'
        },
        imageUrl: '/assets/images/products/1.png',
        originalPrice: 150.00,
        discountedPrice: 89.00,
        currency: 'USD',
        ctaText: { en: 'Shop Now', ar: 'تسوق الآن' },
        ctaLink: '/category/beauty-wellness',
        badge: { text: { en: 'UNESCO', ar: 'اليونسكو' }, color: '#D4AF37' }
      },
      subcategories: [
        // FEATURED Large Cards (First 2)
        { id: 'aleppo-soap', name: { en: 'Aleppo Soap', ar: 'صابون حلب' }, imageUrl: '/assets/images/products/5.png', itemCount: 18, route: '/category/beauty/aleppo-soap', featured: true },
        { id: 'brocade', name: { en: 'Syrian Brocade', ar: 'البروكار السوري' }, imageUrl: '/assets/images/products/8.png', itemCount: 7, route: '/category/textiles/brocade', featured: true },
        // REGULAR Small Cards (Next 5)
        { id: 'oils', name: { en: 'Natural Oils', ar: 'الزيوت الطبيعية' }, iconClass: 'water_drop', itemCount: 14, route: '/category/beauty/oils' },
        { id: 'fabrics', name: { en: 'Traditional Fabrics', ar: 'الأقمشة التقليدية' }, iconClass: 'checkroom', itemCount: 11, route: '/category/textiles' },
        { id: 'perfumes', name: { en: 'Oud Perfumes', ar: 'عطور العود' }, iconClass: 'local_florist', itemCount: 9, route: '/category/perfumes' },
        { id: 'skincare', name: { en: 'Natural Skincare', ar: 'العناية بالبشرة' }, iconClass: 'face', itemCount: 13, route: '/category/skincare' },
        { id: 'embroidery', name: { en: 'Hand Embroidery', ar: 'التطريز اليدوي' }, iconClass: 'palette', itemCount: 5, route: '/category/embroidery' }
      ],
      navigationLinks: {
        newArrivals: '/category/beauty-wellness/new-arrivals',
        bestSeller: '/category/beauty-wellness/best-sellers'
      }
    },
    {
      id: 'food-home-showcase',
      title: {
        en: 'Food, Spices & Home Décor',
        ar: 'الطعام والبهارات والديكور المنزلي'
      },
      titleIcon: 'restaurant',
      visible: true,
      order: 3,
      featuredBanner: {
        id: 'spices-promo',
        title: {
          en: 'AUTHENTIC DAMASCUS SEVEN SPICE MIX',
          ar: 'بهارات دمشق السبعة الأصيلة'
        },
        subtitle: {
          en: 'From Traditional Syrian Markets',
          ar: 'من الأسواق السورية التقليدية'
        },
        imageUrl: '/assets/images/products/8.png',
        originalPrice: 45.00,
        discountedPrice: 15.00,
        currency: 'USD',
        ctaText: { en: 'Shop Now', ar: 'تسوق الآن' },
        ctaLink: '/category/food-spices'
      },
      subcategories: [
        // FEATURED Large Cards (First 2)
        { id: 'spices', name: { en: 'Spice Blends', ar: 'خلطات البهارات' }, imageUrl: '/assets/images/products/digi1.png', itemCount: 22, route: '/category/spices', featured: true },
        { id: 'sweets', name: { en: 'Syrian Sweets', ar: 'الحلويات السورية' }, imageUrl: '/assets/images/products/2.png', itemCount: 16, route: '/category/sweets', featured: true },
        // REGULAR Small Cards (Next 5)
        { id: 'ceramics', name: { en: 'Hand Ceramics', ar: 'الخزف اليدوي' }, iconClass: 'breakfast_dining', itemCount: 8, route: '/category/ceramics' },
        { id: 'wood', name: { en: 'Woodwork', ar: 'الأعمال الخشبية' }, iconClass: 'chair', itemCount: 12, route: '/category/woodwork' },
        { id: 'brass', name: { en: 'Brass Décor', ar: 'الديكور النحاسي' }, iconClass: 'emoji_objects', itemCount: 10, route: '/category/brass' },
        { id: 'mosaics', name: { en: 'Mosaic Art', ar: 'فن الفسيفساء' }, iconClass: 'apps', itemCount: 6, route: '/category/mosaics' },
        { id: 'nuts', name: { en: 'Premium Nuts', ar: 'المكسرات الفاخرة' }, iconClass: 'eco', itemCount: 14, route: '/category/nuts' }
      ],
      navigationLinks: {
        newArrivals: '/category/food-spices/new-arrivals',
        bestSeller: '/category/food-spices/best-sellers'
      }
    }
  ];

  /**
   * Gets visible homepage sections from backend API
   * Falls back to mock data if API call fails
   *
   * @param limit Number of sections to fetch (default: 3, max: 10)
   * @param useMockData Force use of mock data (for development/testing)
   * @returns Observable containing array of transformed sections
   */
  getVisibleSections(
    limit: number = 3,
    useMockData: boolean = false
  ): Observable<CategoryShowcaseSection[]> {
    // Use mock data if explicitly requested
    if (useMockData) {
      return this.getMockSections(limit);
    }

    // Call backend API
    const params: HomepageSectionsQueryParams = { limit };
    return this.http.get<BackendHomepageResponse>(
      `${this.apiUrl}/categories/homepage-sections`,
      { params: params as any }
    ).pipe(
      map(response => this.transformBackendSections(response.data)),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to fetch homepage sections from API:', error);
        console.warn('⚠️  Falling back to mock data');
        return this.getMockSections(limit);
      }),
      tap(sections => {
        console.log(`✅ Loaded ${sections.length} homepage sections`);
      })
    );
  }

  /**
   * Gets complete homepage configuration with all sections
   * Used by admin panel to manage sections
   *
   * @returns Observable containing homepage configuration
   */
  getHomepageConfig(): Observable<HomepageSectionConfig> {
    return this.http.get<BackendHomepageResponse>(
      `${this.apiUrl}/categories/homepage-sections`,
      { params: { limit: 10 } }
    ).pipe(
      map(response => ({
        sections: this.transformBackendSections(response.data),
        lastUpdated: new Date(),
        updatedBy: 'api@souqsyria.com'
      })),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to fetch homepage config from API:', error);
        // Fallback to mock config
        const config: HomepageSectionConfig = {
          sections: this.mockSections,
          lastUpdated: new Date(),
          updatedBy: 'mock@souqsyria.com'
        };
        return of(config);
      })
    );
  }

  /**
   * Gets mock sections (fallback or testing)
   * @private
   */
  private getMockSections(limit: number): Observable<CategoryShowcaseSection[]> {
    const visibleSections = this.mockSections
      .filter(section => section.visible)
      .sort((a, b) => a.order - b.order)
      .slice(0, limit);

    return of(visibleSections);
  }

  /**
   * Transforms backend API data to frontend component format
   * Maps field names and structures to match CategoryShowcaseSection interface
   *
   * @param backendSections Array of sections from backend API
   * @returns Array of transformed sections for frontend components
   * @private
   */
  private transformBackendSections(
    backendSections: BackendHomepageSection[]
  ): CategoryShowcaseSection[] {
    return backendSections.map(section => this.transformSingleSection(section));
  }

  /**
   * Transforms a single backend section to frontend format
   * @private
   */
  private transformSingleSection(
    section: BackendHomepageSection
  ): CategoryShowcaseSection {
    return {
      id: String(section.section_id),
      title: {
        en: section.section_name_en,
        ar: section.section_name_ar
      },
      visible: true, // Backend only returns visible sections
      order: section.section_id,
      featuredBanner: this.transformFeaturedProduct(section.featured_product, section.section_slug),
      subcategories: this.transformChildCategories(section.child_categories),
      navigationLinks: {
        newArrivals: `/category/${section.section_slug}/new-arrivals`,
        bestSeller: `/category/${section.section_slug}/best-sellers`
      }
    };
  }

  /**
   * Transforms backend featured product to frontend banner format
   * @private
   */
  private transformFeaturedProduct(
    product: BackendFeaturedProduct,
    sectionSlug: string
  ): FeaturedBanner {
    // Determine badge configuration
    const badge = product.featured_badge ? {
      text: {
        en: product.featured_badge,
        ar: this.translateBadge(product.featured_badge)
      },
      color: product.is_best_seller ? '#C41E3A' : '#D4AF37'
    } : undefined;

    return {
      id: String(product.id),
      title: {
        en: product.name_en,
        ar: product.name_ar
      },
      subtitle: {
        en: product.promotional_text || `Explore ${product.name_en}`,
        ar: product.promotional_text || `اكتشف ${product.name_ar}`
      },
      imageUrl: product.image_url,
      originalPrice: parseFloat(product.base_price),
      discountedPrice: parseFloat(product.discount_price),
      currency: product.currency,
      ctaText: {
        en: 'Shop Now',
        ar: 'تسوق الآن'
      },
      ctaLink: `/product/${product.slug}`,
      badge
    };
  }

  /**
   * Transforms backend child categories to frontend subcategory cards
   * Handles both image URLs and icon names
   * @private
   */
  private transformChildCategories(
    categories: BackendChildCategory[]
  ): SubcategoryCard[] {
    return categories.slice(0, 7).map((category, index) => {
      // First 2 are featured (with images), rest use icons
      const isFeatured = index < 2;
      const isImageUrl = category.image_url.startsWith('http');

      return {
        id: String(category.id),
        name: {
          en: category.name_en,
          ar: category.name_ar
        },
        imageUrl: isImageUrl && isFeatured ? category.image_url : undefined,
        iconClass: !isImageUrl || !isFeatured ? this.mapToMaterialIcon(category.image_url) : undefined,
        iconColor: '#D4AF37', // Golden Wheat theme
        itemCount: category.product_count,
        route: `/category/${category.slug}`,
        featured: isFeatured
      };
    });
  }

  /**
   * Maps backend icon names to Material Design icon classes
   * @private
   */
  private mapToMaterialIcon(iconName: string): string {
    const iconMap: Record<string, string> = {
      'speaker': 'volume_up',
      'tv': 'tv',
      'washing_machine': 'local_laundry_service',
      'ac': 'ac_unit',
      'refrigerator': 'kitchen',
      'office': 'business_center',
      'car': 'directions_car',
      'womens': 'woman',
      'mens': 'man',
      'shoes': 'shoe',
      'bags': 'shopping_bag',
      'sunglasses': 'wb_sunny',
      'accessories': 'watch',
      'kids': 'child_care',
      'furniture': 'chair',
      'decoration': 'palette',
      'utensil': 'restaurant',
      'cookware': 'soup_kitchen',
      'tools': 'handyman',
      'garden': 'yard',
      'home': 'home_repair_service'
    };

    return iconMap[iconName] || 'category'; // Default icon
  }

  /**
   * Translates English badges to Arabic
   * @private
   */
  private translateBadge(englishBadge: string): string {
    const translations: Record<string, string> = {
      'Best Seller': 'الأكثر مبيعاً',
      'UNESCO': 'اليونسكو',
      'New Arrival': 'وصل حديثاً',
      'Featured': 'مميز',
      'Limited Edition': 'إصدار محدود',
      'Handmade': 'صناعة يدوية',
      'Traditional': 'تقليدي',
      'Premium': 'فاخر'
    };

    return translations[englishBadge] || englishBadge;
  }
}
