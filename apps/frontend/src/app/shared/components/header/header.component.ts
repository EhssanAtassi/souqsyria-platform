import { Component, Input, Output, EventEmitter, OnInit, DestroyRef, inject, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';

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

// Sample data
import { SYRIAN_CATEGORIES, FEATURED_CATEGORIES } from '../../data/syrian-categories.data';

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
    ReactiveFormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatListModule,
    MatSidenavModule,
    MatExpansionModule,
    CategoryNavigationComponent,
    MobileCategoryMenuComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  
  /**
   * FormBuilder dependency injection
   * @description Injects Angular FormBuilder for reactive form creation
   * @private
   */
  constructor(private fb: FormBuilder) {
    // Initialize search form
    this.searchForm = this.fb.group({
      query: [''],
      category: ['all']
    });
  }
  
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
  
  //#endregion
  
  //#region Public Properties
  
  /** Search form group for reactive forms */
  searchForm!: FormGroup;
  
  /** Currently selected location */
  selectedLocation: Location | null = null;
  
  /** Mobile menu open state */
  mobileMenuOpen = false;
  
  /** Currently active mega menu category */
  activeMegaMenu: string | null = null;
  
  /** Search suggestions for autocomplete */
  searchSuggestions: string[] = [];
  
  /** Filtered locations for location autocomplete */
  filteredLocations: Location[] = [];

  /** Currently selected suggestion index for keyboard navigation */
  selectedSuggestionIndex: number = -1;
  
  //#endregion
  
  //#region Private Properties
  
  /** Subject for handling component destruction */
  private destroyRef = inject(DestroyRef);
  
  /** Reference to search input element */
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  
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
   * @description Sets up forms, subscriptions, and default values
   */
  ngOnInit(): void {
    this.initializeSearchForm();
    this.setupSearchSubscriptions();
    this.initializeDefaultLocation();
    this.setupLocationFiltering();
    this.initializeCategoryData();
  }
  
  
  //#endregion
  
  //#region Public Methods
  
  /**
   * Handles search form submission
   * @description Processes search input and emits search event
   * @param event - Form submission event
   */
  onSearchSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    const formValue = this.searchForm.value;
    const searchFilters: SearchFilters = {
      query: formValue.query?.trim(),
      category: formValue.category,
      location: this.selectedLocation?.id
    };
    
    if (searchFilters.query || searchFilters.category) {
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

  /**
   * Handles search suggestion selection
   * @description Sets the selected suggestion as search query
   * @param suggestion - Selected suggestion text
   * @param index - Index of selected suggestion
   */
  selectSuggestion(suggestion: string, index: number): void {
    this.searchForm.patchValue({ query: suggestion });
    this.selectedSuggestionIndex = index;
    this.searchSuggestions = [];
    this.onSearchSubmit();
  }

  /**
   * Handles keyboard navigation in search suggestions
   * @description Manages arrow key navigation and enter selection
   * @param event - Keyboard event
   * @param suggestion - Current suggestion text
   * @param index - Index of current suggestion
   */
  handleSuggestionKeydown(event: KeyboardEvent, suggestion: string, index: number): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, this.searchSuggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        this.selectSuggestion(suggestion, index);
        break;
      case 'Escape':
        event.preventDefault();
        this.searchSuggestions = [];
        this.selectedSuggestionIndex = -1;
        break;
    }
  }

  /**
   * TrackBy function for search suggestions
   * @description Optimizes ngFor performance for suggestions
   * @param index - Array index
   * @param suggestion - Suggestion text
   * @returns Unique identifier for tracking
   */
  trackBySuggestion(index: number, suggestion: string): string {
    return `${index}-${suggestion}`;
  }
  
  //#endregion
  
  //#region Private Methods
  
  /**
   * Initializes the search reactive form
   * @description Sets up form controls and validation
   * @private
   */
  private initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      query: [''],
      category: ['all']
    });
  }
  
  /**
   * Sets up search form subscriptions
   * @description Handles search input debouncing and suggestions
   * @private
   */
  private setupSearchSubscriptions(): void {
    // Search input debouncing for suggestions
    this.searchForm.get('query')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => {
        if (query && query.length > 2) {
          this.generateSearchSuggestions(query);
        } else {
          this.searchSuggestions = [];
        }
      });
  }
  
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
   * Sets up location filtering for autocomplete
   * @description Filters locations based on user input
   * @private
   */
  private setupLocationFiltering(): void {
    // This would typically be connected to a search input for locations
    this.filteredLocations = this.locations.length > 0 ? this.locations : this.defaultLocations;
  }
  
  /**
   * Generates search suggestions based on query
   * @description Creates autocomplete suggestions for search
   * @param query - Current search query
   * @private
   */
  private generateSearchSuggestions(query: string): void {
    // In a real application, this would call a search API
    // For demo purposes, generating basic suggestions
    const suggestions = [
      `${query} in Electronics`,
      `${query} in Fashion`,
      `${query} in Home & Garden`,
      `${query} deals`,
      `best ${query}`
    ];
    
    this.searchSuggestions = suggestions.slice(0, 5);
  }
  
  /**
   * Initializes category data
   * @description Sets up categories and featured categories from data
   * @private
   */
  private initializeCategoryData(): void {
    // Set categories from sample data if not provided
    if (this.categories.length === 0) {
      this.categories = SYRIAN_CATEGORIES;
    }
    
    // Set featured categories in config if not provided
    if (this.config.featuredCategories.length === 0) {
      this.config.featuredCategories = FEATURED_CATEGORIES;
    }
  }
  
  //#endregion
}