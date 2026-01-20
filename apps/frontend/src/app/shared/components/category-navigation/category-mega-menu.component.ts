/**
 * @fileoverview Category Mega Menu Component for SouqSyria
 * @description Simplified mega menu displaying Syrian marketplace categories with golden wheat theme
 * @author SouqSyria Development Team
 * @version 2.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

// Local imports
import { Category, Subcategory, ChildSubcategory, NavigationConfig } from '../../interfaces/navigation.interface';
import { CategoryIconComponent } from './category-icon.component';
import { SYRIAN_CATEGORIES } from '../../data/syrian-categories.data';

/**
 * Featured product interface for mega menu display
 */
interface FeaturedProduct {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  price: number;
  currency: string;
  url: string;
}

/**
 * Mega menu layout options
 */
type MegaMenuLayout = 'grid' | 'columns' | 'featured' | 'mixed';

/**
 * Category column for organized display
 */
interface CategoryColumn {
  title: string;
  titleAr: string;
  categories: Category[];
}

/**
 * SouqSyria Category Mega Menu Component
 * 
 * @description
 * Advanced mega menu component that displays when hovering over categories.
 * Features include:
 * - Subcategories listing with icons
 * - Featured products showcase
 * - Promotional offers section
 * - Help and support links
 * - RTL layout support
 * - Smooth hover interactions
 * 
 * @swagger
 * components:
 *   schemas:
 *     CategoryMegaMenuComponent:
 *       type: object
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         config:
 *           $ref: '#/components/schemas/NavigationConfig'
 *         activeCategory:
 *           type: string
 *           description: ID of currently active category
 *         currentCategory:
 *           $ref: '#/components/schemas/Category'
 *           description: Currently displayed category object
 * 
 * @example
 * ```html
 * <app-category-mega-menu
 *   [categories]="allCategories"
 *   [config]="navigationConfig"
 *   [activeCategory]="activeCategoryId"
 *   [currentCategory]="displayedCategory"
 *   (categoryClick)="onCategorySelect($event)"
 *   (menuClose)="onMenuClose()">
 * </app-category-mega-menu>
 * ```
 */
@Component({
  selector: 'app-category-mega-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    CategoryIconComponent
  ],
  templateUrl: './category-mega-menu.component.html',
  styleUrl: './category-mega-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryMegaMenuComponent implements OnInit {

  //#region Input Properties

  /**
   * All available categories
   * @description Complete array of categories for mega menu
   */
  @Input() categories: Category[] = [];

  /**
   * Navigation configuration
   * @description Controls language, RTL layout, and display options
   */
  @Input() config: NavigationConfig = {
    showArabic: true,
    language: 'en',
    rtl: false,
    locations: [],
    featuredCategories: []
  };

  /**
   * Currently active category ID
   * @description ID of category whose mega menu is displayed
   */
  @Input() activeCategory: string | null = null;

  /**
   * Current category object
   * @description Full category object being displayed
   */
  @Input() currentCategory: Category | null = null;

  /**
   * Whether mega menu is visible
   * @description Controls visibility state of mega menu
   */
  @Input() isVisible: boolean = false;

  //#endregion
  
  //#region Output Events
  
  /**
   * Event emitted when a category is clicked
   * @description Navigation to category page
   */
  @Output() categoryClick = new EventEmitter<Category>();
  
  /**
   * Event emitted when menu should close
   * @description Indicates mega menu should be hidden
   */
  @Output() menuClose = new EventEmitter<void>();
  
  /**
   * Event emitted when mouse enters menu
   * @description Prevents menu from hiding
   */
  @Output() menuMouseEnter = new EventEmitter<void>();
  
  /**
   * Event emitted when mouse leaves menu
   * @description Triggers menu hiding
   */
  @Output() menuMouseLeave = new EventEmitter<void>();
  
  //#endregion
  
  //#region Public Properties

  /** Featured products for current category */
  public featuredProducts: FeaturedProduct[] = [];

  /** Mega menu layout type */
  public layout: MegaMenuLayout = 'mixed';

  /** Whether mega menu is transitioning */
  public isTransitioning: boolean = false;

  /** Organized categories for display */
  public organizedCategories: Category[][] = [];

  /** Featured categories from config */
  public featuredCategories: Category[] = [];

  /** Whether to show promotions section */
  public showPromotions: boolean = true;

  /** Reference to Syrian marketplace categories data */
  private readonly syrianCategories: Category[] = SYRIAN_CATEGORIES;

  //#endregion
  
  //#region Lifecycle Methods
  
  /**
   * Component initialization
   * @description Sets up featured products and mega menu data
   */
  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.initializeMegaMenu();
    this.organizedCategories = this.organizeCategories();
    this.featuredCategories = this.config.featuredCategories || [];
  }

  
  //#endregion
  
  //#region Public Methods
  
  /**
   * Handles category click
   * @description Emits category click event and closes menu
   * @param category - Clicked category object
   */
  onCategoryClick(category: Category): void {
    this.categoryClick.emit(category);
    this.menuClose.emit();
  }

  /**
   * Handles subcategory click
   * @description Converts subcategory to category format and emits event
   * @param subcategory - Clicked subcategory object
   */
  onSubcategoryClick(subcategory: Subcategory): void {
    // Convert subcategory to category format for consistent handling
    const categoryData: Category = {
      id: subcategory.id,
      name: subcategory.name,
      nameAr: subcategory.nameAr,
      icon: subcategory.icon || 'category',
      url: subcategory.url,
      featured: false,
      subcategories: []
    };

    this.categoryClick.emit(categoryData);
    this.menuClose.emit();
  }

  /**
   * Handles product click
   * @description Navigation to product page
   * @param product - Clicked product object
   */
  onProductClick(product: FeaturedProduct): void {
    // Navigate to product page
    console.log('Product clicked:', product);
    this.menuClose.emit();
  }

  /**
   * Handles special offer click
   * @description Navigation to special offers page
   */
  onSpecialOfferClick(): void {
    // Navigate to special offers
    console.log('Special offers clicked');
    this.menuClose.emit();
  }

  /**
   * Handles support click
   * @description Navigation to support page
   */
  onSupportClick(): void {
    // Navigate to support page
    console.log('Support clicked');
    this.menuClose.emit();
  }

  /**
   * Closes the mega menu
   * @description Emits close event to parent component
   */
  closeMegaMenu(): void {
    this.menuClose.emit();
  }
  
  /**
   * Handles menu mouse enter
   * @description Emits mouse enter event to parent
   */
  onMenuMouseEnter(): void {
    this.menuMouseEnter.emit();
  }
  
  /**
   * Handles menu mouse leave
   * @description Emits mouse leave event to parent
   */
  onMenuMouseLeave(): void {
    this.menuMouseLeave.emit();
  }
  
  /**
   * Gets display text for category
   * @description Returns localized category name
   * @param category - Category object or null
   * @returns Localized category name or empty string
   */
  getCategoryText(category: Category | null): string {
    if (!category) return '';
    return this.config.language === 'ar' ? category.nameAr : category.name;
  }
  
  /**
   * Gets display text for subcategory
   * @description Returns localized subcategory name
   * @param subcategory - Subcategory object
   * @returns Localized subcategory name
   */
  getSubcategoryText(subcategory: Subcategory): string {
    return this.config.language === 'ar' ? subcategory.nameAr : subcategory.name;
  }

  /**
   * Gets category-specific description
   * @description Returns localized category description
   * @returns Category description text
   */
  getCategoryDescription(): string {
    if (!this.currentCategory) return '';
    return this.config.language === 'ar' ?
      (this.currentCategory as any).descriptionAr || '' :
      (this.currentCategory as any).description || '';
  }

  /**
   * Gets category-specific subcategories
   * @description Returns subcategories for the current active category
   * @returns Array of subcategories
   */
  getCategorySubcategories(): any[] {
    if (!this.currentCategory || !this.currentCategory.subcategories) return [];

    // Filter to show only subcategories that are marked to show in mega menu
    return this.currentCategory.subcategories.filter(subcategory =>
      subcategory.showInMegaMenu !== false // Show by default if not explicitly set to false
    );
  }

  /**
   * Gets child subcategories for a specific subcategory
   * @description Returns filtered child subcategories for mega menu display
   * @param subcategory - Parent subcategory
   * @returns Array of child subcategories to show in mega menu
   */
  getChildSubcategories(subcategory: any): any[] {
    if (!subcategory.children) return [];

    // Filter to show only up to 5 children that are marked to show in mega menu
    return subcategory.children
      .filter((child: any) => child.showInMegaMenu === true)
      .slice(0, 5); // Limit to maximum 5 children as requested
  }

  /**
   * Checks if subcategory has children to display
   * @description Determines if subcategory has children that should be shown in mega menu
   * @param subcategory - Subcategory to check
   * @returns True if has children to show
   */
  hasChildrenToShow(subcategory: any): boolean {
    return this.getChildSubcategories(subcategory).length > 0;
  }

  /**
   * Gets category-specific aria label
   * @description Returns dynamic aria label based on current category
   * @returns Localized aria label
   */
  getCategorySpecificAriaLabel(): string {
    if (!this.currentCategory) {
      return this.config.language === 'ar' ? 'قائمة الفئات الرئيسية' : 'Main categories menu';
    }
    const categoryName = this.getCategoryText(this.currentCategory);
    return this.config.language === 'ar' ?
      `قائمة ${categoryName}` :
      `${categoryName} menu`;
  }

  /**
   * Gets category-specific promotion title
   * @description Returns localized promotion title based on category
   * @returns Promotion title text
   */
  getCategoryPromotionTitle(): string {
    if (!this.currentCategory) {
      return this.config.language === 'ar' ? 'العروض الخاصة' : 'Special Offers';
    }

    const categoryPromotions: { [key: string]: { en: string; ar: string } } = {
      'damascus-steel': {
        en: 'Damascus Steel Deals',
        ar: 'عروض الفولاذ الدمشقي'
      },
      'beauty-wellness': {
        en: 'Beauty & Wellness Offers',
        ar: 'عروض الجمال والعافية'
      },
      'textiles-fabrics': {
        en: 'Textile Promotions',
        ar: 'عروض المنسوجات'
      },
      'food-spices': {
        en: 'Gourmet Food Deals',
        ar: 'عروض الأطعمة الفاخرة'
      },
      'traditional-crafts': {
        en: 'Heritage Craft Offers',
        ar: 'عروض الحرف التراثية'
      },
      'jewelry-accessories': {
        en: 'Jewelry Collections',
        ar: 'مجموعات المجوهرات'
      }
    };

    const promotion = categoryPromotions[this.currentCategory.id];
    if (promotion) {
      return this.config.language === 'ar' ? promotion.ar : promotion.en;
    }

    return this.config.language === 'ar' ? 'عروض خاصة' : 'Special Offers';
  }

  /**
   * Gets category-specific promotion theme CSS classes
   * @description Returns CSS classes for category-specific styling
   * @returns CSS class string
   */
  getCategoryPromotionTheme(): string {
    if (!this.currentCategory) {
      return 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500';
    }

    const categoryThemes: { [key: string]: string } = {
      'damascus-steel': 'bg-gradient-to-br from-gray-700 via-gray-600 to-slate-700',
      'beauty-wellness': 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500',
      'textiles-fabrics': 'bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500',
      'food-spices': 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500',
      'traditional-crafts': 'bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600',
      'jewelry-accessories': 'bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400'
    };

    return categoryThemes[this.currentCategory.id] || 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500';
  }

  /**
   * Gets category-specific promotion text
   * @description Returns localized promotion text based on category
   * @returns Promotion text
   */
  getCategoryPromotionText(): string {
    if (!this.currentCategory) {
      return this.config.language === 'ar' ? 'العروض السورية المميزة' : 'Syrian Heritage Deals';
    }

    const categoryTexts: { [key: string]: { en: string; ar: string } } = {
      'damascus-steel': {
        en: 'Master-Crafted Damascus Steel',
        ar: 'الفولاذ الدمشقي المصنوع بإتقان'
      },
      'beauty-wellness': {
        en: 'Natural Syrian Beauty',
        ar: 'الجمال السوري الطبيعي'
      },
      'textiles-fabrics': {
        en: 'Luxury Syrian Textiles',
        ar: 'المنسوجات السورية الفاخرة'
      },
      'food-spices': {
        en: 'Authentic Syrian Flavors',
        ar: 'النكهات السورية الأصيلة'
      },
      'traditional-crafts': {
        en: 'Heritage Artisan Crafts',
        ar: 'الحرف التراثية اليدوية'
      },
      'jewelry-accessories': {
        en: 'Exquisite Syrian Jewelry',
        ar: 'المجوهرات السورية الراقية'
      }
    };

    const text = categoryTexts[this.currentCategory.id];
    if (text) {
      return this.config.language === 'ar' ? text.ar : text.en;
    }

    return this.config.language === 'ar' ? 'منتجات سورية مميزة' : 'Premium Syrian Products';
  }

  /**
   * Gets category-specific discount text
   * @description Returns localized discount text based on category
   * @returns Discount text
   */
  getCategoryDiscountText(): string {
    if (!this.currentCategory) {
      return this.config.language === 'ar' ? 'خصم 25%' : '25% OFF';
    }

    const categoryDiscounts: { [key: string]: { en: string; ar: string } } = {
      'damascus-steel': { en: '30% OFF', ar: 'خصم 30%' },
      'beauty-wellness': { en: '20% OFF', ar: 'خصم 20%' },
      'textiles-fabrics': { en: '25% OFF', ar: 'خصم 25%' },
      'food-spices': { en: '15% OFF', ar: 'خصم 15%' },
      'traditional-crafts': { en: '35% OFF', ar: 'خصم 35%' },
      'jewelry-accessories': { en: '40% OFF', ar: 'خصم 40%' }
    };

    const discount = categoryDiscounts[this.currentCategory.id];
    return discount ?
      (this.config.language === 'ar' ? discount.ar : discount.en) :
      (this.config.language === 'ar' ? 'خصم خاص' : 'Special Discount');
  }

  /**
   * Gets category-specific promotion description
   * @description Returns localized promotion description based on category
   * @returns Promotion description
   */
  getCategoryPromotionDescription(): string {
    if (!this.currentCategory) {
      return this.config.language === 'ar' ?
        'اكتشف أجود المنتجات السورية التراثية' :
        'Discover authentic Syrian heritage products';
    }

    const categoryDescriptions: { [key: string]: { en: string; ar: string } } = {
      'damascus-steel': {
        en: 'Legendary steel forged with ancient techniques',
        ar: 'فولاذ أسطوري مصنوع بتقنيات عريقة'
      },
      'beauty-wellness': {
        en: 'Natural ingredients from Syrian traditions',
        ar: 'مكونات طبيعية من التراث السوري'
      },
      'textiles-fabrics': {
        en: 'Hand-woven fabrics with Syrian patterns',
        ar: 'أقمشة منسوجة يدوياً بأنماط سورية'
      },
      'food-spices': {
        en: 'Authentic spices and gourmet delicacies',
        ar: 'بهارات أصيلة وأطعمة شهية فاخرة'
      },
      'traditional-crafts': {
        en: 'Artisan crafts preserving Syrian heritage',
        ar: 'حرف يدوية تحافظ على التراث السوري'
      },
      'jewelry-accessories': {
        en: 'Elegant jewelry with Syrian craftsmanship',
        ar: 'مجوهرات أنيقة بحرفية سورية'
      }
    };

    const description = categoryDescriptions[this.currentCategory.id];
    return description ?
      (this.config.language === 'ar' ? description.ar : description.en) :
      (this.config.language === 'ar' ? 'منتجات سورية أصيلة' : 'Authentic Syrian products');
  }

  /**
   * Gets category-specific featured products
   * @description Returns featured products for the current category
   * @returns Array of featured products
   */
  getCategoryFeaturedProducts(): FeaturedProduct[] {
    if (!this.currentCategory) return this.featuredProducts;

    // Mock category-specific products
    const categoryProducts: { [key: string]: FeaturedProduct[] } = {
      'damascus-steel': [
        {
          id: 'damascus-knife-1',
          name: 'Damascus Chef Knife',
          nameAr: 'سكين الطبخ الدمشقي',
          image: '/assets/damascus-knife.jpg',
          price: 299.99,
          currency: 'USD',
          url: '/product/damascus-chef-knife'
        },
        {
          id: 'damascus-sword-1',
          name: 'Decorative Damascus Sword',
          nameAr: 'السيف الدمشقي الزخرفي',
          image: '/assets/damascus-sword.jpg',
          price: 899.99,
          currency: 'USD',
          url: '/product/damascus-sword'
        }
      ],
      'beauty-wellness': [
        {
          id: 'aleppo-soap-1',
          name: 'Premium Aleppo Laurel Soap',
          nameAr: 'صابون الغار الحلبي الفاخر',
          image: '/assets/aleppo-soap.jpg',
          price: 24.99,
          currency: 'USD',
          url: '/product/aleppo-soap'
        },
        {
          id: 'rose-oil-1',
          name: 'Damascus Rose Oil',
          nameAr: 'زيت الورد الدمشقي',
          image: '/assets/rose-oil.jpg',
          price: 89.99,
          currency: 'USD',
          url: '/product/damascus-rose-oil'
        }
      ],
      'food-spices': [
        {
          id: 'seven-spice-1',
          name: 'Damascus Seven Spice Blend',
          nameAr: 'خلطة البهارات السبعة الدمشقية',
          image: '/assets/seven-spice.jpg',
          price: 12.99,
          currency: 'USD',
          url: '/product/seven-spice-blend'
        },
        {
          id: 'pistachios-1',
          name: 'Premium Aleppo Pistachios',
          nameAr: 'الفستق الحلبي الفاخر',
          image: '/assets/pistachios.jpg',
          price: 34.99,
          currency: 'USD',
          url: '/product/aleppo-pistachios'
        }
      ]
    };

    return categoryProducts[this.currentCategory.id] || [];
  }

  /**
   * Gets category-specific guide text
   * @description Returns localized guide text based on category
   * @returns Guide text
   */
  getCategoryGuideText(): string {
    if (!this.currentCategory) {
      return this.config.language === 'ar' ? 'دليل الفئة' : 'Category Guide';
    }

    const categoryGuides: { [key: string]: { en: string; ar: string } } = {
      'damascus-steel': {
        en: 'Damascus Steel Guide',
        ar: 'دليل الفولاذ الدمشقي'
      },
      'beauty-wellness': {
        en: 'Beauty Care Guide',
        ar: 'دليل العناية بالجمال'
      },
      'textiles-fabrics': {
        en: 'Textile Care Guide',
        ar: 'دليل العناية بالمنسوجات'
      },
      'food-spices': {
        en: 'Culinary Guide',
        ar: 'دليل الطهي'
      },
      'traditional-crafts': {
        en: 'Heritage Craft Guide',
        ar: 'دليل الحرف التراثية'
      },
      'jewelry-accessories': {
        en: 'Jewelry Care Guide',
        ar: 'دليل العناية بالمجوهرات'
      }
    };

    const guide = categoryGuides[this.currentCategory.id];
    return guide ?
      (this.config.language === 'ar' ? guide.ar : guide.en) :
      (this.config.language === 'ar' ? 'دليل الفئة' : 'Category Guide');
  }

  /**
   * Handles category-specific promotional click
   * @description Navigates to category-specific promotional page
   */
  onCategorySpecificClick(): void {
    if (this.currentCategory) {
      console.log('Category-specific promotion clicked:', this.currentCategory.id);
      // Navigate to category-specific promotional page
    }
  }

  /**
   * Handles view all category products click
   * @description Navigates to category products page
   */
  onViewAllCategoryProducts(): void {
    if (this.currentCategory) {
      console.log('View all products clicked for category:', this.currentCategory.id);
      // Navigate to category products page
    }
  }

  /**
   * Handles category guide click
   * @description Navigates to category guide page
   */
  onCategoryGuideClick(): void {
    if (this.currentCategory) {
      console.log('Category guide clicked:', this.currentCategory.id);
      // Navigate to category guide page
    }
  }


  //#endregion

  //#region Private Methods


  //#endregion
  
  /**
   * Formats price for display
   * @description Returns formatted price with currency
   * @param price - Price value
   * @returns Formatted price string
   */
  formatPrice(price: number): string {
    const currency = this.config.language === 'ar' ? 'ل.س' : 'SYP';
    return this.config.language === 'ar' 
      ? `${price.toLocaleString('ar')} ${currency}`
      : `${currency} ${price.toLocaleString('en')}`;
  }
  
  /**
   * Tracks categories in ngFor
   * @description TrackBy function for category lists
   * @param index - Array index
   * @param category - Category object
   * @returns Unique identifier for tracking
   */
  trackByCategory(index: number, category: Category): string {
    return category.id;
  }

  /**
   * Tracks subcategories in ngFor
   * @description TrackBy function for subcategory lists
   * @param index - Array index
   * @param subcategory - Subcategory object
   * @returns Unique identifier for tracking
   */
  trackBySubcategory(index: number, subcategory: Subcategory): string {
    return subcategory.id;
  }

  /**
   * Tracks child subcategories in ngFor for performance optimization
   * @description TrackBy function for child subcategory lists
   * @param index - Array index
   * @param child - Child subcategory object
   * @returns Unique identifier for tracking
   */
  trackByChild(index: number, child: any): string {
    return child.id;
  }

  /**
   * Handles child subcategory click
   * @description Processes child subcategory clicks and emits events
   * @param child - Clicked child subcategory object
   */
  onChildSubcategoryClick(child: any): void {
    // Convert child to category format for consistent handling
    const categoryData = {
      id: child.id,
      name: child.name,
      nameAr: child.nameAr,
      icon: child.icon || 'label',
      url: child.url,
      featured: false,
      subcategories: []
    };

    this.categoryClick.emit(categoryData);
    this.menuClose.emit();
  }

  /**
   * Tracks products in ngFor
   * @description TrackBy function for product lists
   * @param index - Array index
   * @param product - Product object
   * @returns Unique identifier for tracking
   */
  trackByProduct(index: number, product: FeaturedProduct): string {
    return product.id;
  }

  /**
   * Tracks category groups in ngFor
   * @description TrackBy function for category group lists
   * @param index - Array index
   * @param categoryGroup - Category group array
   * @returns Unique identifier for tracking
   */
  trackByCategoryGroup(index: number, categoryGroup: Category[]): string {
    return categoryGroup.map(cat => cat.id).join('-');
  }

  /**
   * Checks if category is active
   * @description Determines if category should be highlighted
   * @param categoryId - Category ID to check
   * @returns True if category is active
   */
  isCategoryActive(categoryId: string): boolean {
    return this.activeCategory === categoryId;
  }

  /**
   * Gets CSS classes for mega menu container
   * @description Returns appropriate CSS classes based on state
   * @returns CSS class string
   */
  getMegaMenuClasses(): string {
    const classes = [
      'sq-mega-menu',
      this.isVisible ? 'sq-mega-menu--visible' : 'sq-mega-menu--hidden',
      this.isTransitioning ? 'sq-mega-menu--transitioning' : '',
      this.config.rtl ? 'sq-mega-menu--rtl' : 'sq-mega-menu--ltr'
    ];

    return classes.filter(Boolean).join(' ');
  }
  
  //#endregion
  
  //#region Private Methods
  
  /**
   * Initializes mega menu configuration
   * @description Sets up mega menu layout and data
   * @private
   */
  private initializeMegaMenu(): void {
    this.layout = 'mixed';
    this.showPromotions = true;
    console.log('Category Mega Menu initialized');
  }

  /**
   * Organizes categories into columns for display
   * @description Groups categories for better visual layout
   * @returns Array of category groups
   * @private
   */
  private organizeCategories(): Category[][] {
    const categoriesToOrganize = this.categories.length > 0 ? this.categories : this.syrianCategories;
    const grouped: Category[][] = [];
    const itemsPerColumn = Math.ceil(categoriesToOrganize.length / 3);

    for (let i = 0; i < categoriesToOrganize.length; i += itemsPerColumn) {
      grouped.push(categoriesToOrganize.slice(i, i + itemsPerColumn));
    }

    return grouped;
  }

  /**
   * Loads featured products for current category
   * @description Sets up sample featured products for demo
   * @private
   */
  private loadFeaturedProducts(): void {
    // Sample featured products - in real app, this would come from API
    this.featuredProducts = [
      {
        id: 'damascus-knife',
        name: 'Damascus Steel Chef Knife',
        nameAr: 'سكين الطبخ الدمشقي',
        image: '/assets/images/products/damascus-knife-thumb.jpg',
        price: 350000,
        currency: 'SYP',
        url: '/product/damascus-steel-chef-knife'
      },
      {
        id: 'aleppo-soap',
        name: 'Premium Aleppo Laurel Soap',
        nameAr: 'صابون الغار الحلبي الفاخر',
        image: '/assets/images/products/aleppo-soap-thumb.jpg',
        price: 85000,
        currency: 'SYP',
        url: '/product/premium-aleppo-laurel-soap'
      },
      {
        id: 'syrian-fabric',
        name: 'Syrian Brocade Fabric',
        nameAr: 'قماش البروكار السوري',
        image: '/assets/images/products/syrian-fabric-thumb.jpg',
        price: 280000,
        currency: 'SYP',
        url: '/product/syrian-brocade-fabric-gold'
      },
      {
        id: 'damascus-spice',
        name: 'Damascus Seven Spice Mix',
        nameAr: 'بهارات السبع بهارات الدمشقية',
        image: '/assets/images/products/damascus-spice-thumb.jpg',
        price: 45000,
        currency: 'SYP',
        url: '/product/damascus-seven-spice-mix'
      }
    ];
  }
  
  //#endregion
}