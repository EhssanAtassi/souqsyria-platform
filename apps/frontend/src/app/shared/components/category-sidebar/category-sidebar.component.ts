import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService } from '../../services/category.service';

/**
 * Category Sidebar Component for SouqSyria Syrian Marketplace
 *
 * Displays hierarchical category navigation with expand/collapse functionality
 * Supports both LTR (English - left sidebar) and RTL (Arabic - right sidebar) layouts
 * Includes featured products section and promotional banners
 *
 * Features:
 * - Hierarchical category display with subcategories
 * - Active category highlighting with Golden Wheat colors
 * - Sticky positioning on desktop, collapsible drawer on mobile
 * - Syrian cultural branding and bilingual support
 * - Featured products section with UNESCO badges
 * - Responsive design with mobile-friendly layout
 *
 * @swagger
 * components:
 *   schemas:
 *     CategorySidebarComponent:
 *       type: object
 *       description: Sidebar navigation component for category browsing
 *       properties:
 *         showFeaturedProducts:
 *           type: boolean
 *           description: Whether to display featured products section
 *         showPromotionalBanner:
 *           type: boolean
 *           description: Whether to display promotional banner
 *         maxCategories:
 *           type: number
 *           description: Maximum number of categories to display
 *         featuredProductsCount:
 *           type: number
 *           description: Number of featured products to show
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language for sidebar content
 *
 * @example
 * <app-category-sidebar
 *   [showFeaturedProducts]="true"
 *   [showPromotionalBanner]="true"
 *   [featuredProductsCount]="3"
 *   [language]="'en'">
 * </app-category-sidebar>
 */
@Component({
  selector: 'app-category-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './category-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './category-sidebar.component.scss'
})
export class CategorySidebarComponent implements OnInit {
  /**
   * Input: Whether to show featured products section
   * Default: true
   */
  readonly showFeaturedProducts = input<boolean>(true);

  /**
   * Input: Whether to show promotional banner at bottom
   * Default: true
   */
  readonly showPromotionalBanner = input<boolean>(true);

  /**
   * Input: Maximum number of categories to display
   * Default: undefined (show all)
   */
  readonly maxCategories = input<number | undefined>(undefined);

  /**
   * Input: Number of featured products to display
   * Default: 3
   */
  readonly featuredProductsCount = input<number>(3);

  /**
   * Input: Display language (en = LTR left sidebar, ar = RTL right sidebar)
   * Default: 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Output: Emits when a category is clicked
   */
  readonly categoryClick = output<any>();

  /**
   * Service: Category service for loading Syrian marketplace categories
   */
  private categoryService = inject(CategoryService);

  /**
   * State: All available categories
   */
  categories = signal<any[]>([]);

  /**
   * State: Loading indicator for categories
   */
  isLoading = signal<boolean>(false);

  /**
   * State: Currently expanded category ID
   */
  expandedCategoryId = signal<string | null>(null);

  /**
   * State: Featured products for sidebar display
   */
  featuredProducts = signal<any[]>([]);

  /**
   * Computed: Filtered categories based on maxCategories input
   */
  displayCategories = computed(() => {
    const max = this.maxCategories();
    const cats = this.categories();
    return max !== undefined ? cats.slice(0, max) : cats;
  });

  /**
   * Computed: Direction attribute for RTL support
   */
  direction = computed(() => this.language() === 'ar' ? 'rtl' : 'ltr');

  /**
   * Computed: Sidebar title based on language
   */
  sidebarTitle = computed(() =>
    this.language() === 'ar' ? 'الفئات' : 'Categories'
  );

  /**
   * Computed: Featured products title based on language
   */
  featuredTitle = computed(() =>
    this.language() === 'ar' ? 'منتجات مميزة' : 'Featured Products'
  );

  /**
   * Component initialization
   * Loads categories from CategoryService
   */
  ngOnInit(): void {
    this.loadCategories();
    if (this.showFeaturedProducts()) {
      this.loadFeaturedProducts();
    }
  }

  /**
   * Loads categories from CategoryService
   * Sets loading state and handles errors
   */
  private loadCategories(): void {
    this.isLoading.set(true);

    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load categories for sidebar:', error);
        this.isLoading.set(false);
        this.categories.set([]);
      }
    });
  }

  /**
   * Loads featured products for sidebar display
   * Uses mock data for Phase 2 implementation
   */
  private loadFeaturedProducts(): void {
    // Mock featured products for Phase 2
    // In Phase 5, this will be replaced with ProductService call
    this.featuredProducts.set([
      {
        id: 'damascus-steel-knife-001',
        name: 'Damascus Steel Chef Knife',
        nameAr: 'سكين دمشقي',
        slug: 'damascus-steel-chef-knife',
        price: 185,
        currency: 'USD',
        image: '/assets/products/damascus-knife-main.jpg',
        rating: 4.9,
        reviews: 127,
        unesco: true
      },
      {
        id: 'aleppo-soap-premium-002',
        name: 'Premium Aleppo Soap',
        nameAr: 'صابون حلب الفاخر',
        slug: 'premium-aleppo-laurel-soap',
        price: 12,
        currency: 'USD',
        image: '/assets/products/aleppo-soap-main.jpg',
        rating: 4.8,
        reviews: 89,
        unesco: false
      },
      {
        id: 'syrian-brocade-fabric-003',
        name: 'Syrian Brocade Fabric',
        nameAr: 'قماش البروكار السوري',
        slug: 'syrian-brocade-fabric-gold',
        price: 145,
        currency: 'USD',
        image: '/assets/products/brocade-fabric-main.jpg',
        rating: 5.0,
        reviews: 56,
        unesco: true
      }
    ]);
  }

  /**
   * Toggles category expansion state
   * @param categoryId - ID of category to toggle
   */
  toggleCategory(categoryId: string): void {
    const current = this.expandedCategoryId();
    this.expandedCategoryId.set(current === categoryId ? null : categoryId);
  }

  /**
   * Checks if category is currently expanded
   * @param categoryId - ID of category to check
   * @returns true if category is expanded
   */
  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategoryId() === categoryId;
  }

  /**
   * Handles category click event
   * Emits categoryClick output event
   * @param category - Category that was clicked
   */
  onCategoryClick(category: any): void {
    this.categoryClick.emit(category);
  }

  /**
   * TrackBy function for category list optimization
   * @param index - Index in array
   * @param category - Category item
   * @returns Unique identifier for category
   */
  trackCategory(index: number, category: any): string {
    return category.id;
  }

  /**
   * TrackBy function for featured products list optimization
   * @param index - Index in array
   * @param product - Product item
   * @returns Unique identifier for product
   */
  trackProduct(index: number, product: any): string {
    return product.id;
  }

  /**
   * Gets category name based on current language
   * @param category - Category object
   * @returns Category name in current language
   */
  getCategoryName(category: any): string {
    return this.language() === 'ar' && category.nameArabic
      ? category.nameArabic
      : category.name;
  }

  /**
   * Gets product name based on current language
   * @param product - Product object
   * @returns Product name in current language
   */
  getProductName(product: any): string {
    return this.language() === 'ar' && product.nameAr
      ? product.nameAr
      : product.name;
  }
}
