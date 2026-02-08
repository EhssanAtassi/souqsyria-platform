import { Component, Input, Output, EventEmitter, OnInit, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material imports (kept for mobile menu and badge)
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

// Local imports
import {
  Category,
  Subcategory,
  UserInfo,
  CartInfo,
  Location,
  NavigationConfig,
  SearchFilters
} from '../../interfaces/navigation.interface';

// Category Navigation Components
import {
  CategoryNavigationComponent,
  MobileCategoryMenuComponent
} from '../category-navigation/index';

// Header Sub-Components
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { QuickAccessRowComponent } from './components/quick-access-row/quick-access-row.component';
import { LogoComponent } from './components/logo/logo.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { LocationSelectorComponent } from './components/location-selector/location-selector.component';
import { AccountMenuComponent } from './components/account-menu/account-menu.component';
import { CartButtonComponent } from './components/cart-button/cart-button.component';
import { FavoritesButtonComponent } from './components/favorites-button/favorites-button.component';

// Sample data
import { SYRIAN_CATEGORIES, HEADER_NAV_CATEGORIES } from '../../data/syrian-categories.data';

// Category Integration (S1 Categories Sprint)
import { MegaMenuComponent } from '../../../features/category/components/mega-menu/mega-menu.component';
import { CategoryApiService } from '../../../features/category/services/category-api.service';
import { CategoryTreeNode } from '../../../features/category/models/category-tree.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core';

/**
 * SouqSyria Header Navigation Component
 * 
 * @description
 * A comprehensive header navigation component for the SouqSyria e-commerce platform.
 * Features include:
 * - Responsive design with mobile-first approach
 * - Arabic language support with RTL layout
 * - Search functionality with category filtering
 * - User authentication area
 * - Shopping cart integration
 * - Location-based delivery selection
 * - Mega menu for categories
 * - Accessibility compliance (WCAG 2.1)
 * 
 * @swagger
 * components:
 *   schemas:
 *     HeaderComponent:
 *       type: object
 *       properties:
 *         config:
 *           $ref: '#/components/schemas/NavigationConfig'
 *         user:
 *           $ref: '#/components/schemas/UserInfo'
 *         cart:
 *           $ref: '#/components/schemas/CartInfo'
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         locations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Location'
 * 
 * @example
 * ```html
 * <app-header
 *   [config]="navigationConfig"
 *   [user]="currentUser"
 *   [cart]="cartData"
 *   [categories]="productCategories"
 *   [locations]="syrianLocations"
 *   (searchSubmit)="onSearch($event)"
 *   (loginClick)="onLoginClick()"
 *   (cartClick)="onCartClick()"
 *   (locationChange)="onLocationChange($event)">
 * </app-header>
 * ```
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    CategoryNavigationComponent,
    MobileCategoryMenuComponent,
    MegaMenuComponent,
    TopBarComponent,
    QuickAccessRowComponent,
    LogoComponent,
    SearchBarComponent,
    LocationSelectorComponent,
    AccountMenuComponent,
    CartButtonComponent,
    FavoritesButtonComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  
  /** No-op constructor - sub-components handle their own form logic */
  constructor() {}
  
  //#region Input Properties
  
  /**
   * Navigation configuration options
   * @description Controls language, RTL layout, and feature toggles
   */
  @Input() config: NavigationConfig = {
    showArabic: true,
    language: 'en',
    rtl: false,
    locations: [],
    featuredCategories: []
  };
  
  /**
   * Current user information
   * @description Contains user authentication state and profile data
   */
  @Input() user: UserInfo = { isLoggedIn: false };
  
  /**
   * Shopping cart information
   * @description Contains cart item count and total value
   */
  @Input() cart: CartInfo = { 
    itemCount: 0, 
    totalAmount: 0, 
    currency: 'SYP' 
  };
  
  /**
   * Product categories for navigation
   * @description Array of categories with subcategories for mega menu
   */
  @Input() categories: Category[] = [];
  
  /**
   * Available delivery locations
   * @description Syrian cities and regions for location-based services
   */
  @Input() locations: Location[] = [];

  /**
   * Wishlist/Favorites item count
   * @description Number of items in user's wishlist for badge display.
   * Defaults to 5 for demo/prototype display.
   */
  @Input() wishlistCount: number = 5;

  //#endregion
  
  //#region Output Events
  
  /**
   * Event emitted when search form is submitted
   * @description Provides search filters and query to parent component
   */
  @Output() searchSubmit = new EventEmitter<SearchFilters>();
  
  /**
   * Event emitted when user clicks login/register button
   * @description Triggers authentication flow
   */
  @Output() loginClick = new EventEmitter<void>();
  
  /**
   * Event emitted when user clicks logout button
   * @description Triggers logout process
   */
  @Output() logoutClick = new EventEmitter<void>();
  
  /**
   * Event emitted when user clicks shopping cart
   * @description Opens cart sidebar or navigates to cart page
   */
  @Output() cartClick = new EventEmitter<void>();
  
  /**
   * Event emitted when user changes delivery location
   * @description Provides selected location to parent component
   */
  @Output() locationChange = new EventEmitter<Location>();
  
  /**
   * Event emitted when user clicks on a category
   * @description Provides category data for navigation
   */
  @Output() categoryClick = new EventEmitter<Category>();
  
  /**
   * Event emitted when mobile menu is toggled
   * @description Indicates mobile menu state change
   */
  @Output() mobileMenuToggle = new EventEmitter<boolean>();
  
  /**
   * Event emitted when language changes
   * @description Provides selected language to parent component
   */
  @Output() languageChange = new EventEmitter<string>();

  /**
   * Event emitted when user clicks on wishlist/favorites
   * @description Opens wishlist page or modal
   */
  @Output() wishlistClick = new EventEmitter<void>();

  /**
   * Event emitted when a top bar link is clicked
   * @description Provides link ID for analytics/routing
   */
  @Output() topBarLinkClick = new EventEmitter<string>();

  /**
   * Event emitted when a quick access item is clicked
   * @description Provides item ID for analytics/routing
   */
  @Output() quickAccessClick = new EventEmitter<string>();

  //#endregion
  
  //#region Public Properties

  /** Currently selected location */
  selectedLocation: Location | null = null;

  /** Mobile menu open state */
  mobileMenuOpen = false;

  /** Currently active mega menu category */
  activeMegaMenu: string | null = null;

  /** Filtered locations for display */
  filteredLocations: Location[] = [];

  //#endregion

  //#region Private Properties

  /** Subject for handling component destruction */
  private destroyRef = inject(DestroyRef);

  /** Category API service for fetching category tree (S1 Categories Sprint) */
  private categoryApiService = inject(CategoryApiService);

  //#endregion

  //#region Category Integration (S1 Categories Sprint)

  /** Category tree data for mega menu navigation */
  categoryTree = signal<CategoryTreeNode[]>([]);

  /** Mega menu open state */
  megaMenuOpen = signal<boolean>(false);

  /** Category tree loading state */
  categoryTreeLoading = signal<boolean>(false);

  /** Cache flag to load category tree only once */
  private categoryTreeLoaded = false;

  /** Default Syrian locations */
  private readonly defaultLocations: Location[] = [
    {
      id: 'damascus',
      name: 'Damascus',
      nameAr: 'دمشق',
      type: 'city',
      deliveryAvailable: true
    },
    {
      id: 'aleppo',
      name: 'Aleppo',
      nameAr: 'حلب',
      type: 'city',
      deliveryAvailable: true
    },
    {
      id: 'homs',
      name: 'Homs',
      nameAr: 'حمص',
      type: 'city',
      deliveryAvailable: true
    },
    {
      id: 'lattakia',
      name: 'Lattakia',
      nameAr: 'اللاذقية',
      type: 'city',
      deliveryAvailable: true
    }
  ];
  
  //#endregion
  
  //#region Lifecycle Methods
  
  /**
   * Component initialization
   * @description Sets up default location and category data
   */
  ngOnInit(): void {
    this.initializeDefaultLocation();
    this.initializeCategoryData();
  }

  /**
   * Load category tree for mega menu (lazy loading on first hover)
   * @description Fetches category tree from backend API and caches result
   * @private
   */
  private loadCategoryTree(): void {
    if (this.categoryTreeLoaded || this.categoryTreeLoading()) {
      return; // Already loaded or loading
    }

    this.categoryTreeLoading.set(true);
    this.categoryApiService.getTree()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categoryTree.set(response.data);
          this.categoryTreeLoaded = true;
          this.categoryTreeLoading.set(false);
          console.log('✅ Category tree loaded for mega menu:', response.data.length, 'categories');
        },
        error: (error) => {
          console.error('❌ Failed to load category tree:', error);
          this.categoryTreeLoading.set(false);
        }
      });
  }

  /**
   * Handle category button hover (desktop)
   * @description Opens mega menu and loads category tree on first hover
   */
  onCategoriesHover(): void {
    if (!this.categoryTreeLoaded) {
      this.loadCategoryTree();
    }
    this.megaMenuOpen.set(true);
  }

  /**
   * Handle category button click (mobile)
   * @description Opens mega menu and loads category tree on first click
   */
  onCategoriesClick(): void {
    if (!this.categoryTreeLoaded) {
      this.loadCategoryTree();
    }
    this.megaMenuOpen.set(!this.megaMenuOpen());
  }

  /**
   * Handle mega menu category selection
   * @description Closes mega menu when category is selected
   * @param slug - Selected category slug
   */
  onMegaMenuCategorySelected(slug: string): void {
    this.megaMenuOpen.set(false);
    console.log('Mega menu category selected:', slug);
  }

  /**
   * Handle mega menu close event
   * @description Closes mega menu
   */
  onMegaMenuClosed(): void {
    this.megaMenuOpen.set(false);
  }
  
  
  //#endregion
  
  //#region Public Methods
  
  /**
   * Handles search submission from SearchBarComponent
   * @description Receives query string from child and emits as SearchFilters
   * @param query - Search query string from search bar component
   */
  onSearchSubmit(query: string): void {
    const searchFilters: SearchFilters = {
      query: query?.trim(),
      category: 'all',
      location: this.selectedLocation?.id
    };

    if (searchFilters.query) {
      this.searchSubmit.emit(searchFilters);
    }
  }
  
  /**
   * Handles user login button click
   * @description Emits login event to parent component
   */
  onLoginClick(): void {
    this.loginClick.emit();
  }
  
  /**
   * Handles user logout button click
   * @description Emits logout event to parent component
   */
  onLogoutClick(): void {
    this.logoutClick.emit();
  }
  
  /**
   * Handles shopping cart click
   * @description Emits cart click event to parent component
   */
  onCartClick(): void {
    this.cartClick.emit();
  }

  /**
   * Handles wishlist/favorites click
   * @description Emits wishlist click event to parent component
   */
  onWishlistClick(): void {
    this.wishlistClick.emit();
  }

  /**
   * Handles top bar link clicks
   * @description Emits link click event for analytics/tracking
   * @param linkId - ID of clicked link
   */
  onTopBarLinkClick(linkId: string): void {
    this.topBarLinkClick.emit(linkId);
  }

  /**
   * Handles quick access item clicks
   * @description Emits item click event for analytics/tracking
   * @param itemId - ID of clicked item
   */
  onQuickAccessItemClick(itemId: string): void {
    this.quickAccessClick.emit(itemId);
  }
  
  /**
   * Handles location selection change
   * @description Updates selected location and emits change event
   * @param location - Selected location object
   */
  onLocationSelect(location: Location): void {
    this.selectedLocation = location;
    this.locationChange.emit(location);
  }
  
  /**
   * Handles category click in navigation
   * @description Emits category click event and closes mobile menu
   * @param category - Clicked category object
   */
  onCategoryClick(category: Category): void {
    this.categoryClick.emit(category);
    this.closeMobileMenu();
  }

  /**
   * Handles subcategory selection from navigation
   * @description Processes subcategory click and converts to category format if needed
   * @param subcategory Selected subcategory
   */
  onSubcategoryClick(subcategory: Subcategory): void {
    // Convert subcategory to category-like format for navigation
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
    this.closeMobileMenu();
  }
  
  /**
   * Toggles mobile navigation menu
   * @description Opens/closes mobile menu and emits state change
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.mobileMenuToggle.emit(this.mobileMenuOpen);
  }
  
  /**
   * Closes mobile navigation menu
   * @description Closes mobile menu and emits state change
   */
  closeMobileMenu(): void {
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      this.mobileMenuToggle.emit(false);
    }
  }
  
  /**
   * Shows mega menu for category
   * @description Sets active mega menu category
   * @param categoryId - ID of category to show mega menu for
   */
  showMegaMenu(categoryId: string): void {
    this.activeMegaMenu = categoryId;
  }
  
  /**
   * Hides mega menu
   * @description Clears active mega menu
   */
  hideMegaMenu(): void {
    this.activeMegaMenu = null;
  }
  
  /**
   * Gets display text for current location
   * @description Returns localized location name
   * @returns Formatted location display text
   */
  getCurrentLocationText(): string {
    if (!this.selectedLocation) {
      return this.config.language === 'ar' ? 'اختر الموقع' : 'Select Location';
    }
    
    return this.config.language === 'ar' 
      ? this.selectedLocation.nameAr 
      : this.selectedLocation.name;
  }
  
  /**
   * Gets display text for category
   * @description Returns localized category name
   * @param category - Category object
   * @returns Localized category name
   */
  getCategoryText(category: Category): string {
    return this.config.language === 'ar' ? category.nameAr : category.name;
  }
  
  /**
   * Tracks categories in ngFor for performance
   * @description TrackBy function for category lists
   * @param index - Array index
   * @param category - Category object
   * @returns Unique identifier for tracking
   */
  trackByCategory(index: number, category: Category): string {
    return category.id;
  }
  
  /**
   * Tracks locations in ngFor for performance
   * @description TrackBy function for location lists
   * @param index - Array index
   * @param location - Location object
   * @returns Unique identifier for tracking
   */
  trackByLocation(index: number, location: Location): string {
    return location.id;
  }
  
  /**
   * Handles language change
   * @description Updates configuration language and emits change
   * @param language - Selected language code
   */
  onLanguageChange(language: string): void {
    // Prevent unnecessary updates if same language
    if (this.config.language === language) {
      return;
    }
    
    this.config = {
      ...this.config,
      language: language as 'en' | 'ar',
      rtl: language === 'ar'
    };
    
    // Update document direction
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
    
    // Emit language change event for parent components
    this.languageChange.emit(language);
  }
  
  /**
   * Handles promotional link clicks
   * @description Routes to promotional pages
   * @param linkId - Promotional link identifier
   */
  onPromotionalLinkClick(linkId: string): void {
    // Handle promotional link navigation
    console.log('Promotional link clicked:', linkId);
  }

  
  //#endregion
  
  //#region Private Methods
  
  /**
   * Initializes default location selection
   * @description Sets Damascus as default location if available
   * @private
   */
  private initializeDefaultLocation(): void {
    const availableLocations = this.locations.length > 0 ? this.locations : this.defaultLocations;
    this.filteredLocations = availableLocations;

    // Set Damascus as default location
    const defaultLocation = availableLocations.find(loc => loc.id === 'damascus');
    if (defaultLocation) {
      this.selectedLocation = defaultLocation;
    }
  }
  
  /**
   * Initializes category data
   * @description Sets up categories and featured categories from data
   * @private
   */
  private initializeCategoryData(): void {
    // Set categories from sample data if not provided.
    // Merge Syrian heritage categories with header nav categories for full mega menu support.
    if (this.categories.length === 0) {
      const existingIds = new Set(SYRIAN_CATEGORIES.map(c => c.id));
      const newNavCategories = HEADER_NAV_CATEGORIES.filter(c => !existingIds.has(c.id));
      this.categories = [...SYRIAN_CATEGORIES, ...newNavCategories];
    }
    
    // Set featured categories in config using header nav categories
    if (this.config.featuredCategories.length === 0) {
      this.config.featuredCategories = HEADER_NAV_CATEGORIES;
    }
  }
  
  //#endregion
}