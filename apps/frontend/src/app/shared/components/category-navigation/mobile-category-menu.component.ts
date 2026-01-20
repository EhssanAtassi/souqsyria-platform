/**
 * @fileoverview Mobile Category Menu Component for SouqSyria
 * @description Mobile-optimized side navigation menu for category browsing
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Angular Material imports
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// Local imports
import { Category, Subcategory, NavigationConfig, UserInfo, Location } from '../../interfaces/navigation.interface';
import { CategoryItemComponent } from './category-item.component';
import { CategoryIconComponent } from './category-icon.component';

/**
 * SouqSyria Mobile Category Menu Component
 * 
 * @description
 * Mobile-optimized side navigation menu specifically designed for Syrian e-commerce.
 * Features include:
 * - Slide-out side navigation drawer
 * - Collapsible category sections with subcategories
 * - User profile integration
 * - Quick links to promotions and special offers
 * - Language and location selection
 * - Touch-optimized interface
 * - RTL layout support
 * - Accessibility compliance
 * 
 * @swagger
 * components:
 *   schemas:
 *     MobileCategoryMenuComponent:
 *       type: object
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *           description: All available categories for mobile menu
 *         config:
 *           $ref: '#/components/schemas/NavigationConfig'
 *           description: Navigation configuration options
 *         user:
 *           $ref: '#/components/schemas/UserInfo'
 *           description: Current user information
 *         locations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Location'
 *           description: Available delivery locations
 *         isOpen:
 *           type: boolean
 *           description: Whether the mobile menu is open
 *         selectedLocation:
 *           $ref: '#/components/schemas/Location'
 *           description: Currently selected location
 * 
 * @example
 * ```html
 * <!-- Mobile category menu -->
 * <app-mobile-category-menu
 *   [categories]="allCategories"
 *   [config]="navigationConfig"
 *   [user]="currentUser"
 *   [locations]="syrianLocations"
 *   [isOpen]="mobileMenuOpen"
 *   [selectedLocation]="currentLocation"
 *   (categoryClick)="onCategorySelect($event)"
 *   (subcategoryClick)="onSubcategorySelect($event)"
 *   (menuClose)="onMobileMenuClose()"
 *   (locationChange)="onLocationChange($event)"
 *   (languageChange)="onLanguageChange($event)">
 * </app-mobile-category-menu>
 * ```
 * 
 * @usageNotes
 * - Designed for mobile and tablet viewports (below lg breakpoint)
 * - Automatically handles touch gestures and swipe navigation
 * - Integrates with main header component for seamless UX
 * - Supports both Arabic and English interfaces
 */
@Component({
  selector: 'app-mobile-category-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonToggleModule,
    CategoryItemComponent,
    CategoryIconComponent
  ],
  templateUrl: './mobile-category-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './mobile-category-menu.component.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ height: '*', opacity: 1 })
        )
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ height: '0', opacity: 0 })
        )
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('150ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ],
  host: {
    'class': 'sq-mobile-menu',
    '[class.sq-mobile-menu--rtl]': 'config.rtl',
    '[class.sq-mobile-menu--open]': 'isOpen'
  }
})
export class MobileCategoryMenuComponent implements OnInit {

  //#region Input Properties
  
  /**
   * All available categories for mobile menu
   * @description Complete array of categories with subcategories
   */
  @Input({ required: true }) categories: Category[] = [];
  
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
   * Current user information
   * @description Contains user authentication state and profile data
   */
  @Input() user: UserInfo = { isLoggedIn: false };
  
  /**
   * Available delivery locations
   * @description Syrian cities and regions for location-based services
   */
  @Input() locations: Location[] = [];
  
  /**
   * Mobile menu open state
   * @description Whether the mobile menu is currently visible
   */
  @Input() 
  set isOpen(value: boolean) {
    this._isOpen = value;
    // Force change detection when menu state changes
    if (value) {
      this.onMenuOpened();
    } else {
      this.onMenuClosed();
    }
  }
  get isOpen(): boolean {
    return this._isOpen;
  }
  private _isOpen: boolean = false;
  
  /**
   * Currently selected location
   * @description Active delivery location
   */
  @Input() selectedLocation: Location | null = null;
  
  //#endregion
  
  //#region Output Events
  
  /**
   * Event emitted when a category is clicked
   * @description Provides category data for navigation
   */
  @Output() categoryClick = new EventEmitter<Category>();
  
  /**
   * Event emitted when a subcategory is clicked
   * @description Provides subcategory data for navigation
   */
  @Output() subcategoryClick = new EventEmitter<Subcategory>();
  
  /**
   * Event emitted when mobile menu should close
   * @description Indicates menu should be hidden
   */
  @Output() menuClose = new EventEmitter<void>();
  
  /**
   * Event emitted when user clicks login/register
   * @description Triggers authentication flow
   */
  @Output() loginClick = new EventEmitter<void>();
  
  /**
   * Event emitted when user clicks logout
   * @description Triggers logout process
   */
  @Output() logoutClick = new EventEmitter<void>();
  
  /**
   * Event emitted when location changes
   * @description Provides selected location
   */
  @Output() locationChange = new EventEmitter<Location>();
  
  /**
   * Event emitted when language changes
   * @description Provides selected language
   */
  @Output() languageChange = new EventEmitter<string>();
  
  /**
   * Event emitted when promotional link is clicked
   * @description Navigation to promotional pages
   */
  @Output() promotionalLinkClick = new EventEmitter<string>();
  
  //#endregion
  
  //#region Public Properties
  
  /** Expanded category panels */
  public expandedCategories: Set<string> = new Set();
  
  /** Quick navigation links for mobile */
  public readonly quickLinks = [
    {
      id: 'special-offers',
      nameEn: 'Special Offers',
      nameAr: 'عروض خاصة',
      icon: 'local_offer',
      url: '/offers',
      color: 'text-orange-600'
    },
    {
      id: 'flash-sale',
      nameEn: 'Flash Sale',
      nameAr: 'تخفيضات',
      icon: 'flash_on',
      url: '/flash-sale',
      color: 'text-red-600'
    },
    {
      id: 'new-arrivals',
      nameEn: 'New Arrivals',
      nameAr: 'وصل حديثاً',
      icon: 'fiber_new',
      url: '/new-arrivals',
      color: 'text-blue-600'
    },
    {
      id: 'best-sellers',
      nameEn: 'Best Sellers',
      nameAr: 'الأكثر مبيعاً',
      icon: 'trending_up',
      url: '/best-sellers',
      color: 'text-green-600'
    }
  ];
  
  /** User menu options */
  public readonly userMenuOptions = [
    {
      id: 'profile',
      nameEn: 'My Profile',
      nameAr: 'الملف الشخصي',
      icon: 'person',
      url: '/profile'
    },
    {
      id: 'orders',
      nameEn: 'My Orders',
      nameAr: 'طلباتي',
      icon: 'shopping_bag',
      url: '/orders'
    },
    {
      id: 'wishlist',
      nameEn: 'Wishlist',
      nameAr: 'المفضلة',
      icon: 'favorite',
      url: '/wishlist'
    },
    {
      id: 'addresses',
      nameEn: 'Addresses',
      nameAr: 'العناوين',
      icon: 'location_on',
      url: '/addresses'
    },
    {
      id: 'support',
      nameEn: 'Help & Support',
      nameAr: 'المساعدة والدعم',
      icon: 'help',
      url: '/support'
    }
  ];
  
  //#endregion
  
  //#region Lifecycle Methods
  
  /**
   * Component initialization
   * @description Sets up default expanded categories
   */
  ngOnInit(): void {
    this.initializeExpandedCategories();
  }

  /**
   * Handles menu opening
   * @description Called when mobile menu is opened
   * @private
   */
  private onMenuOpened(): void {
    // Add any logic needed when menu opens
    console.log('Mobile menu opened');
  }

  /**
   * Handles menu closing
   * @description Called when mobile menu is closed
   * @private
   */
  private onMenuClosed(): void {
    // Add any logic needed when menu closes
    console.log('Mobile menu closed');
  }
  
  //#endregion
  
  //#region Public Methods
  
  /**
   * Handles category click
   * @description Toggles category expansion or navigates to category
   * @param category - Clicked category object
   */
  onCategoryClick(category: Category): void {
    if (category.subcategories && category.subcategories.length > 0) {
      this.toggleCategoryExpansion(category.id);
    } else {
      this.categoryClick.emit(category);
      this.closeMenu();
    }
  }
  
  /**
   * Handles subcategory click
   * @description Navigates to subcategory and closes menu
   * @param subcategory - Clicked subcategory object
   */
  onSubcategoryClick(subcategory: Subcategory): void {
    this.subcategoryClick.emit(subcategory);
    this.closeMenu();
  }
  
  /**
   * Closes the mobile menu
   * @description Emits menu close event
   */
  closeMenu(): void {
    this.menuClose.emit();
  }

  /**
   * Handles sidenav opened event
   * @description Called when mat-sidenav opens
   */
  onSidenavOpened(): void {
    // Ensure state is consistent
    console.log('Sidenav opened successfully');
  }
  
  /**
   * Handles login button click
   * @description Emits login event and closes menu
   */
  onLoginClick(): void {
    this.loginClick.emit();
    this.closeMenu();
  }
  
  /**
   * Handles logout button click
   * @description Emits logout event and closes menu
   */
  onLogoutClick(): void {
    this.logoutClick.emit();
    this.closeMenu();
  }
  
  /**
   * Handles location selection
   * @description Updates selected location and emits change event
   * @param location - Selected location object
   */
  onLocationSelect(location: Location): void {
    this.selectedLocation = location;
    this.locationChange.emit(location);
  }
  
  /**
   * Handles language change
   * @description Updates config and emits language change event
   * @param language - Selected language code
   */
  onLanguageChange(language: string): void {
    // Update local config immediately for UI responsiveness
    this.config = {
      ...this.config,
      language: language as 'en' | 'ar',
      rtl: language === 'ar'
    };
    
    // Emit to parent component
    this.languageChange.emit(language);
    
    console.log('Language changed to:', language, 'RTL:', this.config.rtl);
  }
  
  /**
   * Handles quick link click
   * @description Navigates to promotional page and closes menu
   * @param linkId - Quick link identifier
   */
  onQuickLinkClick(linkId: string): void {
    this.promotionalLinkClick.emit(linkId);
    this.closeMenu();
  }
  
  /**
   * Toggles category expansion
   * @description Shows/hides category subcategories
   * @param categoryId - Category ID to toggle
   */
  toggleCategoryExpansion(categoryId: string): void {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }
  }
  
  /**
   * Checks if category is expanded
   * @description Determines if category subcategories are visible
   * @param categoryId - Category ID to check
   * @returns True if category is expanded
   */
  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategories.has(categoryId);
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
   * Gets display text for subcategory
   * @description Returns localized subcategory name
   * @param subcategory - Subcategory object
   * @returns Localized subcategory name
   */
  getSubcategoryText(subcategory: Subcategory): string {
    return this.config.language === 'ar' ? subcategory.nameAr : subcategory.name;
  }
  
  /**
   * Gets display text for quick links
   * @description Returns localized quick link text
   * @param link - Quick link object
   * @returns Localized link text
   */
  getQuickLinkText(link: any): string {
    return this.config.language === 'ar' ? link.nameAr : link.nameEn;
  }
  
  /**
   * Gets display text for user menu options
   * @description Returns localized user menu option text
   * @param option - User menu option object
   * @returns Localized option text
   */
  getUserMenuText(option: any): string {
    return this.config.language === 'ar' ? option.nameAr : option.nameEn;
  }
  
  /**
   * Gets current location display text
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
  
  //#endregion
  
  //#region Private Methods
  
  /**
   * Initializes default expanded categories
   * @description Sets up featured categories as expanded by default
   * @private
   */
  private initializeExpandedCategories(): void {
    // Expand featured categories by default on first load
    this.categories
      .filter(category => category.featured && category.subcategories?.length)
      .slice(0, 2) // Limit to first 2 to avoid overwhelming mobile UI
      .forEach(category => {
        this.expandedCategories.add(category.id);
      });
  }
  
  //#endregion
}