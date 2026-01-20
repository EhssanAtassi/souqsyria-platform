import { Component, ChangeDetectionStrategy, OnInit, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketplaceLayoutComponent } from '../../../../shared/layouts/marketplace-layout/marketplace-layout.component';
import { CategorySidebarComponent } from '../../../../shared/components/category-sidebar/category-sidebar.component';
import { SidebarFeaturedProductsComponent } from '../../../../shared/components/sidebar-featured-products/sidebar-featured-products.component';
import { PromotionalBannersComponent } from '../../../../shared/components/promotional-banners/promotional-banners.component';
import { ThemeProductComponent } from '../../../../shared/components/template-widgets/theme-product/theme-product.component';
import { ThemeProductTabSectionComponent } from '../../../../shared/components/template-widgets/theme-product-tab-section/theme-product-tab-section.component';
import { ProductsService } from '../../../../store/products/products.service';
import { ProductsQuery } from '../../../../store/products/products.query';
import { CategoryService } from '../../../../shared/services/category.service';
import { Product } from '../../../../shared/interfaces/product.interface';
import { Banner } from '../../../../shared/interfaces/banner.interface';

/**
 * Marketplace Section Component
 *
 * Orchestrates marketplace layout on homepage with sidebar and main content areas.
 * Uses MarketplaceLayoutComponent with all child components.
 *
 * @description
 * Main marketplace section combining:
 * - Category sidebar navigation
 * - Featured products sidebar
 * - Product tabs by category
 * - Promotional banners
 * - Category product sliders
 *
 * Supports RTL layout and bilingual content.
 *
 * @example
 * ```html
 * <app-marketplace-section
 *   [language]="'ar'"
 *   [showSidebar]="true">
 * </app-marketplace-section>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     MarketplaceSectionComponent:
 *       type: object
 *       description: Homepage marketplace section with sidebar and content
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *           default: en
 *         showSidebar:
 *           type: boolean
 *           description: Show sidebar with categories and featured products
 *           default: true
 *         featuredCategories:
 *           type: array
 *           items:
 *             type: string
 *           description: Category slugs to feature in tabs
 */
@Component({
  selector: 'app-marketplace-section',
  standalone: true,
  imports: [
    CommonModule,
    MarketplaceLayoutComponent,
    CategorySidebarComponent,
    SidebarFeaturedProductsComponent,
    PromotionalBannersComponent,
    ThemeProductComponent,
    ThemeProductTabSectionComponent
  ],
  templateUrl: './marketplace-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './marketplace-section.component.scss'
})
export class MarketplaceSectionComponent implements OnInit {
  /**
   * Display language for RTL/LTR support
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Show sidebar with categories and featured products
   * @default true
   */
  readonly showSidebar = input<boolean>(true);

  /**
   * Category slugs to feature in product tabs
   * @default ['damascus-steel', 'beauty-wellness', 'textiles-fabrics']
   */
  readonly featuredCategories = input<string[]>([
    'damascus-steel',
    'beauty-wellness',
    'textiles-fabrics'
  ]);

  // Services
  private productsService = inject(ProductsService);
  private productsQuery = inject(ProductsQuery);
  private categoryService = inject(CategoryService);

  // State signals
  featuredProducts = signal<Product[]>([]);
  promotionalBanners = signal<Banner[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  /**
   * Component initialization
   * Loads featured products and promotional banners
   */
  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Load featured products and promotional banners
   */
  private loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load products using Akita
    this.productsService.loadProducts();

    // Get featured products for sidebar (limit to 3)
    const products = this.productsQuery.getAll();
    // Get first 3 products as featured (Product interface doesn't have featured property)
    this.featuredProducts.set(products.slice(0, 3));
    this.isLoading.set(false);

    // Load promotional banners (mock data for now)
    this.loadPromotionalBanners();
  }

  /**
   * Load promotional banners
   * TODO: Replace with actual banner service when available
   */
  private loadPromotionalBanners(): void {
    const mockBanners: Banner[] = [
      {
        id: 'banner-damascus-1',
        title: 'Damascus Steel Masterpieces',
        titleAr: 'روائع الفولاذ الدمشقي',
        subtitle: 'Handforged by master craftsmen',
        subtitleAr: 'مصنوعة يدوياً من قبل حرفيين ماهرين',
        imageUrl: '/assets/images/products/exp1.png',
        linkUrl: '/category/damascus-steel',
        ctaText: 'Explore Collection',
        ctaTextAr: 'استكشف المجموعة',
        backgroundColor: '#002623',
        textColor: '#edebe0',
        position: 'left',
        isActive: true,
        displayOrder: 1
      },
      {
        id: 'banner-aleppo-soap-1',
        title: 'Authentic Aleppo Soap',
        titleAr: 'صابون حلب الأصيل',
        subtitle: '40% laurel oil, aged 2 years',
        subtitleAr: '40% زيت الغار، معتق سنتين',
        imageUrl: '/assets/images/products/1.png',
        linkUrl: '/category/beauty-wellness',
        ctaText: 'Shop Now',
        ctaTextAr: 'تسوق الآن',
        backgroundColor: '#b9a779',
        textColor: '#161616',
        position: 'right',
        isActive: true,
        displayOrder: 2
      }
    ];

    this.promotionalBanners.set(mockBanners);
  }

  /**
   * Handle featured product click
   * @param product - Clicked product
   */
  onFeaturedProductClick(product: Product): void {
    console.log('Featured product clicked:', product.slug);
    // Analytics tracking can be added here
  }

  /**
   * Handle promotional banner click
   * @param event - Banner click event
   */
  onPromotionalBannerClick(event: any): void {
    console.log('Promotional banner clicked:', event.banner.id);
    // Analytics tracking can be added here
  }
}
