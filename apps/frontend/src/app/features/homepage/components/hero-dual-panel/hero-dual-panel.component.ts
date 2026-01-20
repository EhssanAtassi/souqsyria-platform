import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SliderImageSwiperComponent } from '../../../../components/slider-image-swiper/slider-image-swiper.component';
import { FeaturedProductShowcaseComponent } from '../featured-product-showcase/featured-product-showcase.component';

/**
 * Hero Dual Panel Component for Syrian Marketplace
 *
 * Implements a Turkish e-commerce inspired dual-panel layout:
 * - Left panel (70%): Pure image-based promotional banners slider
 * - Right panel (30%): Featured product showcase with Syrian styling
 *
 * Features:
 * - Responsive design (side-by-side on desktop, stacked on mobile)
 * - Auto-rotating offers slider using existing Swiper component
 * - Featured product display with Syrian golden wheat gradient
 * - Damascus geometric pattern overlay
 * - Bilingual support (Arabic/English)
 * - Click tracking and analytics integration
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroDualPanelComponent:
 *       type: object
 *       properties:
 *         offerBanners:
 *           type: array
 *           description: Image-based promotional banners for the left slider
 *           items:
 *             type: object
 *             properties:
 *               src:
 *                 type: string
 *                 description: Banner image URL
 *               alt:
 *                 type: string
 *                 description: Alternative text for accessibility
 *               link:
 *                 type: string
 *                 description: Navigation URL when banner is clicked
 *               titleAr:
 *                 type: string
 *                 description: Arabic title for the offer
 *               titleEn:
 *                 type: string
 *                 description: English title for the offer
 *         featuredProduct:
 *           type: object
 *           description: Today's featured product for right panel display
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *               description: Product name in English
 *             nameArabic:
 *               type: string
 *               description: Product name in Arabic
 *             price:
 *               type: object
 *               properties:
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 originalPrice:
 *                   type: number
 *             images:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   alt:
 *                     type: string
 *             reviews:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                 totalReviews:
 *                   type: number
 */
@Component({
  selector: 'app-hero-dual-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    SliderImageSwiperComponent,
    FeaturedProductShowcaseComponent
  ],
  templateUrl: './hero-dual-panel.component.html',
  styleUrl: './hero-dual-panel.component.scss'
})
export class HeroDualPanelComponent {

  /**
   * Offer banners for the left panel slider
   * @description Pure image-based promotional banners with Syrian marketplace themes
   */
  @Input() offerBanners: Array<{
    src: string;
    alt?: string;
    link?: string;
    titleAr?: string;
    titleEn?: string;
  }> = [];

  /**
   * Featured product for the right panel showcase
   * @description Today's featured product with Syrian styling
   */
  @Input() featuredProduct: any = null;

  /**
   * Auto-rotation interval for offers slider
   * @description Time in milliseconds between automatic slide transitions
   */
  @Input() autoRotateInterval: number = 4000;

  /**
   * Pause autoplay on hover
   * @description Whether to pause slider when user hovers over it
   */
  @Input() pauseOnHover: boolean = true;

  /**
   * Event emitted when an offer banner is clicked
   * @description Tracks user interaction with promotional banners
   */
  @Output() offerClick = new EventEmitter<{
    bannerId: string;
    link: string;
    source: 'hero-dual-panel';
  }>();

  /**
   * Event emitted when featured product is clicked
   * @description Tracks user interaction with featured product
   */
  @Output() featuredProductClick = new EventEmitter<{
    productId: string;
    productName: string;
    source: 'hero-dual-panel';
  }>();

  /**
   * Event emitted when featured product is added to cart
   * @description Tracks add to cart action from hero section
   */
  @Output() featuredProductAddToCart = new EventEmitter<{
    productId: string;
    productName: string;
    price: number;
    source: 'hero-dual-panel';
  }>();

  /**
   * Signal indicating if component has valid data to display
   * @description Computed signal that checks if component has required data
   */
  readonly hasValidData = computed(() => {
    return this.offerBanners.length > 0 || this.featuredProduct !== null;
  });

  /**
   * Signal for offer banners with fallback data
   * @description Provides default Syrian marketplace banners if none provided
   */
  readonly displayOfferBanners = computed(() => {
    if (this.offerBanners.length > 0) {
      return this.offerBanners;
    }

    // Fallback to default Syrian marketplace banners
    return this.getDefaultOfferBanners();
  });

  /**
   * Signal for featured product with fallback
   * @description Provides fallback product if none provided
   */
  readonly displayFeaturedProduct = computed(() => {
    return this.featuredProduct || this.getDefaultFeaturedProduct();
  });

  /**
   * Handles offer banner click events
   * @description Processes clicks on promotional banners and emits tracking events
   * @param banner - The clicked banner object
   * @param event - The click event
   */
  onOfferBannerClick(banner: any, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    console.log('Hero dual panel: Offer banner clicked', {
      title: banner.titleEn || 'Unknown Offer',
      titleAr: banner.titleAr || 'عرض غير معروف',
      link: banner.link
    });

    // Emit tracking event
    this.offerClick.emit({
      bannerId: this.generateBannerId(banner),
      link: banner.link || '/offers',
      source: 'hero-dual-panel'
    });

    // Track analytics
    this.trackAnalyticsEvent('offer_banner_click', {
      banner_title_en: banner.titleEn,
      banner_title_ar: banner.titleAr,
      banner_link: banner.link,
      source: 'hero_dual_panel',
      position: 'left_slider'
    });
  }

  /**
   * Handles featured product click events
   * @description Processes clicks on featured product and emits tracking events
   * @param product - The clicked product object
   */
  onFeaturedProductClick(product: any): void {
    console.log('Hero dual panel: Featured product clicked', {
      name: product.name,
      nameArabic: product.nameArabic,
      id: product.id
    });

    // Emit tracking event
    this.featuredProductClick.emit({
      productId: product.id,
      productName: product.name,
      source: 'hero-dual-panel'
    });

    // Track analytics
    this.trackAnalyticsEvent('featured_product_click', {
      product_id: product.id,
      product_name: product.name,
      product_name_ar: product.nameArabic,
      price: product.price?.amount,
      currency: product.price?.currency,
      source: 'hero_dual_panel',
      position: 'right_showcase'
    });
  }

  /**
   * Handles featured product add to cart events
   * @description Processes add to cart from featured product showcase
   * @param product - The product to add to cart
   */
  onFeaturedProductAddToCart(product: any): void {
    console.log('Hero dual panel: Featured product add to cart', {
      name: product.name,
      nameArabic: product.nameArabic,
      price: product.price?.amount
    });

    // Emit tracking event
    this.featuredProductAddToCart.emit({
      productId: product.id,
      productName: product.name,
      price: product.price?.amount,
      source: 'hero-dual-panel'
    });

    // Track analytics
    this.trackAnalyticsEvent('add_to_cart', {
      currency: product.price?.currency || 'USD',
      value: product.price?.amount || 0,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_name_ar: product.nameArabic,
        category: product.category?.name,
        price: product.price?.amount || 0,
        quantity: 1
      }],
      source: 'hero_dual_panel',
      position: 'right_showcase'
    });
  }

  /**
   * Generates a unique banner ID for tracking
   * @description Creates identifier from banner properties
   * @param banner - Banner object
   * @returns Unique banner identifier
   */
  private generateBannerId(banner: any): string {
    const title = banner.titleEn || banner.titleAr || 'unknown';
    return title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Provides default Syrian marketplace offer banners
   * @description Fallback banners with authentic Syrian marketplace themes
   * @returns Array of default banner objects
   */
  private getDefaultOfferBanners(): Array<any> {
    return [
      {
        src: 'assets/images/campaigns/damascus-steel-hero.svg',
        alt: 'Damascus Steel Heritage Collection',
        link: '/category/damascus-steel',
        titleAr: 'خصم 30% على الصناعات الدمشقية',
        titleEn: '30% OFF Damascus Crafts'
      },
      {
        src: 'assets/images/campaigns/aleppo-soap-hero.svg',
        alt: 'Authentic Aleppo Soap Collection',
        link: '/category/beauty-wellness',
        titleAr: 'منتجات حلب الأصيلة',
        titleEn: 'Authentic Aleppo Products'
      },
      {
        src: 'assets/images/campaigns/syrian-textiles-hero.svg',
        alt: 'Syrian Textiles & Fabrics',
        link: '/category/textiles-fabrics',
        titleAr: 'الأقمشة والمنسوجات السورية',
        titleEn: 'Syrian Textiles & Fabrics'
      },
      {
        src: 'assets/images/placeholder-image.svg',
        alt: 'Free Delivery Over $100',
        link: '/shipping-info',
        titleAr: 'توصيل مجاني للطلبات فوق 100$',
        titleEn: 'Free Delivery Over $100'
      },
      {
        src: 'assets/images/placeholder-image.svg',
        alt: 'Discover Syrian Heritage',
        link: '/heritage-collection',
        titleAr: 'اكتشف التراث السوري',
        titleEn: 'Discover Syrian Heritage'
      }
    ];
  }

  /**
   * Provides default featured product
   * @description Fallback featured product with Syrian marketplace styling
   * @returns Default featured product object
   */
  private getDefaultFeaturedProduct(): any {
    return {
      id: 'default-featured-damascus-knife',
      name: 'Damascus Steel Chef Knife',
      nameArabic: 'سكين الطبخ الدمشقي',
      slug: 'damascus-steel-chef-knife',
      description: 'Handcrafted Damascus steel chef knife with traditional Syrian forging techniques',
      descriptionArabic: 'سكين طبخ من الفولاذ الدمشقي المصنوع يدوياً بالتقنيات السورية التقليدية',
      price: {
        amount: 150,
        currency: 'USD',
        originalPrice: 200
      },
      images: [
        {
          id: 'damascus-knife-1',
          url: 'assets/images/campaigns/damascus-steel-hero.svg',
          alt: 'Damascus Steel Knife',
          isPrimary: true,
          order: 1
        }
      ],
      category: {
        id: 'damascus-steel',
        name: 'Damascus Steel',
        nameArabic: 'الفولاذ الدمشقي',
        slug: 'damascus-steel'
      },
      inventory: {
        inStock: true,
        quantity: 25,
        status: 'in_stock'
      },
      reviews: {
        averageRating: 4.8,
        totalReviews: 127
      },
      authenticity: {
        certified: true,
        heritage: 'traditional',
        unescoRecognition: true,
        badges: ['UNESCO Heritage', 'Handcrafted', 'Syrian Artisan']
      },
      tags: ['featured', 'today-pick', 'damascus', 'unesco-heritage']
    };
  }

  /**
   * Tracks analytics events with error handling
   * @description Centralized analytics tracking for hero dual panel interactions
   * @param eventName - Name of the analytics event
   * @param parameters - Event parameters
   */
  private trackAnalyticsEvent(eventName: string, parameters: any): void {
    try {
      console.log(`Hero Dual Panel Analytics: ${eventName}`, parameters);

      // Google Analytics 4 tracking (when available)
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', eventName, parameters);
      }

      // Additional analytics providers can be added here
      // Adobe Analytics, Mixpanel, etc.
    } catch (error) {
      console.error('Hero Dual Panel: Analytics tracking error:', error);
      // Analytics errors should not break the application
    }
  }
}