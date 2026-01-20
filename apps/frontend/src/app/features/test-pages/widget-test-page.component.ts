import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeTitleComponent } from '../../shared/components/template-widgets/theme-title/theme-title.component';
import { ThemeBannerComponent, Banner as WidgetBanner } from '../../shared/components/template-widgets/theme-banner/theme-banner.component';
import { ThemeBrandComponent, Brand } from '../../shared/components/template-widgets/theme-brand/theme-brand.component';
import { ThemeProductComponent } from '../../shared/components/template-widgets/theme-product/theme-product.component';
import { ThemeProductTabSectionComponent, CategoryTab } from '../../shared/components/template-widgets/theme-product-tab-section/theme-product-tab-section.component';
import { CategorySidebarComponent } from '../../shared/components/category-sidebar/category-sidebar.component';
import { MarketplaceSectionComponent } from '../homepage/components/marketplace-section/marketplace-section.component';
import { SidebarFeaturedProductsComponent } from '../../shared/components/sidebar-featured-products/sidebar-featured-products.component';
import { PromotionalBannersComponent } from '../../shared/components/promotional-banners/promotional-banners.component';
import { Banner } from '../../shared/interfaces/banner.interface';
import { Product } from '../../shared/interfaces/product.interface';

/**
 * Widget Test Page Component
 *
 * Comprehensive test page for all SouqSyria template widgets
 * Demonstrates usage of all Phase 1 & Phase 2 widgets with Syrian marketplace data
 *
 * Features:
 * - Tests all 5 Phase 1 template widgets
 * - Tests Phase 2 category sidebar with RTL support
 * - Syrian marketplace test data
 * - Bilingual examples (English/Arabic)
 * - Multiple configuration examples per widget
 * - Golden Wheat design system showcase
 * - RTL layout demonstrations
 *
 * @swagger
 * components:
 *   schemas:
 *     WidgetTestPageComponent:
 *       type: object
 *       description: Test page for template widgets
 *
 * @example
 * Access at: http://localhost:4200/test-widgets
 */
@Component({
  selector: 'app-widget-test-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    ThemeTitleComponent,
    ThemeBannerComponent,
    ThemeBrandComponent,
    ThemeProductComponent,
    ThemeProductTabSectionComponent,
    CategorySidebarComponent,
    MarketplaceSectionComponent,
    SidebarFeaturedProductsComponent,
    PromotionalBannersComponent
  ],
  templateUrl: './widget-test-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./widget-test-page.component.scss']
})
export class WidgetTestPageComponent {
  /**
   * Current display language
   */
  language = signal<'en' | 'ar'>('en');

  /**
   * Test banners for banner widget
   */
  testBanners: WidgetBanner[] = [
    {
      id: 'banner-1',
      title: 'Damascus Steel Collection',
      titleAr: 'مجموعة الفولاذ الدمشقي',
      subtitle: 'Handcrafted by Master Artisans',
      subtitleAr: 'صنعة يدوية من حرفيين ماهرين',
      imageUrl: '/assets/images/products/exp1.png',
      link: '/category/damascus-steel',
      buttonText: 'Shop Now',
      buttonTextAr: 'تسوق الآن',
      backgroundClass: 'bg-navy'
    },
    {
      id: 'banner-2',
      title: 'Authentic Aleppo Soap',
      titleAr: 'صابون حلب الأصيل',
      subtitle: 'Natural Beauty from Syria',
      subtitleAr: 'جمال طبيعي من سوريا',
      imageUrl: '/assets/images/products/1.png',
      link: '/category/beauty-wellness',
      buttonText: 'Discover',
      buttonTextAr: 'اكتشف',
      backgroundClass: 'bg-green'
    },
    {
      id: 'banner-3',
      title: 'Syrian Textiles',
      titleAr: 'المنسوجات السورية',
      subtitle: 'Brocade & Traditional Fabrics',
      subtitleAr: 'بروكار وأقمشة تقليدية',
      imageUrl: '/assets/images/products/5.png',
      link: '/category/textiles-fabrics',
      buttonText: 'View Collection',
      buttonTextAr: 'عرض المجموعة',
      backgroundClass: 'bg-gold'
    }
  ];

  /**
   * Test brands for brand widget
   */
  testBrands: Brand[] = [
    {
      id: 'brand-1',
      name: 'Damascus Artisans Guild',
      nameAr: 'نقابة حرفيي دمشق',
      logoUrl: '/assets/images/products/exp1.png',
      location: 'Damascus, Syria',
      verified: true,
      link: '/seller/damascus-artisans'
    },
    {
      id: 'brand-2',
      name: 'Aleppo Soap House',
      nameAr: 'بيت صابون حلب',
      logoUrl: '/assets/images/products/1.png',
      location: 'Aleppo, Syria',
      verified: true,
      link: '/seller/aleppo-soap'
    },
    {
      id: 'brand-3',
      name: 'Traditional Crafts Co.',
      nameAr: 'شركة الحرف التقليدية',
      logoUrl: '/assets/images/products/31.png',
      location: 'Homs, Syria',
      verified: true,
      link: '/seller/traditional-crafts'
    },
    {
      id: 'brand-4',
      name: 'Syrian Spice Market',
      nameAr: 'سوق البهارات السورية',
      logoUrl: '/assets/images/products/8.png',
      location: 'Damascus, Syria',
      verified: true,
      link: '/seller/spice-market'
    },
    {
      id: 'brand-5',
      name: 'Heritage Textiles',
      nameAr: 'منسوجات التراث',
      logoUrl: '/assets/images/products/5.png',
      location: 'Damascus, Syria',
      verified: false
    },
    {
      id: 'brand-6',
      name: 'Artisan Ceramics',
      nameAr: 'خزف الحرفيين',
      logoUrl: '/assets/images/products/32.png',
      location: 'Hama, Syria',
      verified: true
    }
  ];

  /**
   * Product IDs for specific product display
   */
  featuredProductIds: string[] = [
    'damascus-steel-knife-001',
    'aleppo-soap-premium-002',
    'syrian-brocade-fabric-003',
    'damascus-seven-spice-004'
  ];

  /**
   * Category tabs for tab section widget
   */
  categoryTabs: CategoryTab[] = [
    {
      id: 'damascus-steel',
      label: 'Damascus Steel',
      labelAr: 'الفولاذ الدمشقي',
      categorySlug: 'damascus-steel',
      icon: '⚔️'
    },
    {
      id: 'beauty-wellness',
      label: 'Beauty & Wellness',
      labelAr: 'الجمال والعافية',
      categorySlug: 'beauty-wellness',
      icon: '🧼'
    },
    {
      id: 'textiles-fabrics',
      label: 'Textiles & Fabrics',
      labelAr: 'المنسوجات والأقمشة',
      categorySlug: 'textiles-fabrics',
      icon: '🧵'
    },
    {
      id: 'food-spices',
      label: 'Food & Spices',
      labelAr: 'الطعام والبهارات',
      categorySlug: 'food-spices',
      icon: '🌶️'
    }
  ];

  /**
   * Promotional banners for Phase 3 (promotional-banners component)
   */
  promotionalBanners: Banner[] = [
    {
      id: 'promo-1',
      title: 'Damascus Steel Sale',
      titleAr: 'تخفيضات الفولاذ الدمشقي',
      subtitle: 'Up to 30% off on selected items',
      subtitleAr: 'خصم يصل إلى 30% على قطع مختارة',
      imageUrl: '/assets/images/products/exp1.png',
      linkUrl: '/category/damascus-steel',
      ctaText: 'Shop Now',
      ctaTextAr: 'تسوق الآن',
      backgroundColor: '#002623',
      textColor: '#edebe0',
      position: 'left',
      isActive: true
    },
    {
      id: 'promo-2',
      title: 'Aleppo Soap Collection',
      titleAr: 'مجموعة صابون حلب',
      subtitle: 'Natural & Authentic',
      subtitleAr: 'طبيعي وأصيل',
      imageUrl: '/assets/images/products/1.png',
      linkUrl: '/category/beauty-wellness',
      ctaText: 'Discover',
      ctaTextAr: 'اكتشف',
      backgroundColor: '#b9a779',
      textColor: '#161616',
      position: 'right',
      isActive: true
    }
  ];

  /**
   * Mock featured products for Phase 3 (sidebar-featured-products component)
   */
  mockFeaturedProducts: Product[] = [
    {
      id: 'featured-1',
      name: 'Damascus Chef Knife',
      nameArabic: 'سكين دمشقي للطبخ',
      slug: 'damascus-chef-knife',
      price: {
        amount: 185,
        currency: 'USD'
      },
      images: [
        {
          id: 'img-1',
          url: '/assets/images/products/exp1.png',
          alt: 'Damascus Chef Knife',
          isPrimary: true,
          order: 1
        }
      ]
    } as Product,
    {
      id: 'featured-2',
      name: 'Premium Aleppo Soap',
      nameArabic: 'صابون حلب الفاخر',
      slug: 'premium-aleppo-soap',
      price: {
        amount: 28,
        currency: 'USD',
        originalPrice: 35,
        discount: {
          percentage: 20,
          type: 'seasonal'
        }
      },
      images: [
        {
          id: 'img-2',
          url: '/assets/images/products/1.png',
          alt: 'Aleppo Soap',
          isPrimary: true,
          order: 1
        }
      ]
    } as Product,
    {
      id: 'featured-3',
      name: 'Syrian Brocade Fabric',
      nameArabic: 'قماش بروكار سوري',
      slug: 'syrian-brocade-fabric',
      price: {
        amount: 95,
        currency: 'USD'
      },
      images: [
        {
          id: 'img-3',
          url: '/assets/images/products/5.png',
          alt: 'Brocade Fabric',
          isPrimary: true,
          order: 1
        }
      ]
    } as Product
  ];

  /**
   * Toggles language between English and Arabic
   */
  toggleLanguage(): void {
    this.language.set(this.language() === 'en' ? 'ar' : 'en');
  }

  /**
   * Scrolls to specific widget section
   */
  scrollToWidget(widgetId: string): void {
    const element = document.getElementById(widgetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Handles category click event from sidebar
   * @param category - Category that was clicked
   */
  onCategoryClick(category: any): void {
    console.log('Category clicked:', category);
    // In real implementation, this would navigate to category page
  }
}
