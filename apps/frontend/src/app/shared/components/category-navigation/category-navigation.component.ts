/**
 * @fileoverview Category Navigation Component for SouqSyria
 * @description Main category navigation bar component for desktop layout
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, DestroyRef, inject, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

// Local imports
import { Category, NavigationConfig, Subcategory } from '../../interfaces/navigation.interface';
import { CategoryMegaMenuComponent } from './category-mega-menu.component';
import { CategoryItemComponent } from './category-item.component';
import { MegaMenuSidebarComponent } from './mega-menu-sidebar/mega-menu-sidebar.component';
import { MegaMenuFullwidthComponent } from './mega-menu-fullwidth/mega-menu-fullwidth.component';

/**
 * SouqSyria Category Navigation Component
 * 
 * @description
 * Displays the main category navigation bar for desktop users.
 * Features include:
 * - Horizontal category menu with featured categories
 * - All Categories dropdown trigger
 * - Special offers and promotions links
 * - Hover effects for mega menu
 * - RTL layout support
 * - Syrian e-commerce category structure
 * 
 * @swagger
 * components:
 *   schemas:
 *     CategoryNavigationComponent:
 *       type: object
 *       properties:
 *         config:
 *           $ref: '#/components/schemas/NavigationConfig'
 *           description: Navigation configuration options
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *           description: Array of all available categories
 *         featuredCategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *           description: Categories to display in main navigation
 *         activeMegaMenu:
 *           type: string
 *           nullable: true
 *           description: ID of currently active mega menu category
 * 
 * @example
 * ```html
 * <app-category-navigation
 *   [config]="navigationConfig"
 *   [categories]="allCategories"
 *   [featuredCategories]="topCategories"
 *   [activeMegaMenu]="currentMegaMenu"
 *   (categoryClick)="onCategoryNavigation($event)"
 *   (megaMenuShow)="onMegaMenuShow($event)"
 *   (megaMenuHide)="onMegaMenuHide()"
 *   (allCategoriesClick)="onAllCategoriesClick()">
 * </app-category-navigation>
 * ```
 * 
 * @usageNotes
 * - This component is designed for desktop screens (lg breakpoint and up)
 * - For mobile navigation, use MobileCategoryMenuComponent
 * - Integrates with CategoryMegaMenuComponent for dropdown functionality
 * - Supports both English and Arabic category names
 */
@Component({
  selector: 'app-category-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    CategoryMegaMenuComponent,
    CategoryItemComponent,
    MegaMenuSidebarComponent,
    MegaMenuFullwidthComponent
  ],
  templateUrl: './category-navigation.component.html',
  styleUrl: './category-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryNavigationComponent implements OnInit {

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
   * All available product categories
   * @description Complete array of categories for mega menu display
   */
  @Input() categories: Category[] = [];
  
  /**
   * Featured categories for main navigation
   * @description Categories to display prominently in horizontal navigation
   */
  @Input() featuredCategories: Category[] = [];
  
  /**
   * Currently active mega menu category
   * @description ID of category whose mega menu is currently displayed
   */
  @Input() activeMegaMenu: string | null = null;
  
  /**
   * Currently hovered category for dynamic content
   * @description Category object being hovered for dynamic mega menu
   */
  public currentHoveredCategory: Category | null = null;
  
  //#endregion
  
  //#region Output Events
  
  /**
   * Event emitted when a category is clicked
   * @description Provides category data for navigation
   */
  @Output() categoryClick = new EventEmitter<Category>();
  
  /**
   * Event emitted when mega menu should be shown
   * @description Provides category ID to show mega menu for
   */
  @Output() megaMenuShow = new EventEmitter<string>();
  
  /**
   * Event emitted when mega menu should be hidden
   * @description Indicates mega menu should be closed
   */
  @Output() megaMenuHide = new EventEmitter<void>();
  
  /**
   * Event emitted when "All Categories" button is clicked
   * @description Triggers display of complete category list
   */
  @Output() allCategoriesClick = new EventEmitter<void>();
  
  /**
   * Event emitted when special offers link is clicked
   * @description Navigation to special offers page
   */
  @Output() specialOffersClick = new EventEmitter<void>();
  
  /**
   * Event emitted when flash sale link is clicked
   * @description Navigation to flash sale page
   */
  @Output() flashSaleClick = new EventEmitter<void>();
  
  //#endregion
  
  //#region Public Properties
  
  /** All Categories menu open state */
  public isAllCategoriesOpen: boolean = false;
  
  /** Syrian e-commerce promotional links */
  public readonly promotionalLinks = [
    {
      id: 'special-offers',
      nameEn: 'Special Offers',
      nameAr: 'عروض خاصة',
      icon: 'local_offer',
      url: '/offers'
    },
    {
      id: 'flash-sale',
      nameEn: 'Flash Sale', 
      nameAr: 'تخفيضات',
      icon: 'flash_on',
      url: '/flash-sale'
    }
  ];
  
  //#endregion
  
  //#region Lifecycle Methods
  
  private destroyRef = inject(DestroyRef);

  /**
   * Component initialization
   * @description Sets up default featured categories if not provided
   */
  ngOnInit(): void {
    this.initializeFeaturedCategories();

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      if (this.showTimeout) {
        clearTimeout(this.showTimeout);
        this.showTimeout = null;
      }
    });
  }
  
  //#endregion
  
  //#region Public Methods
  
  /**
   * Handles category click navigation
   * @description Emits category click event and manages mega menu state
   * @param category - Clicked category object
   */
  onCategoryClick(category: Category): void {
    this.categoryClick.emit(category);
    this.hideMegaMenu();
  }

  /**
   * Handles subcategory click navigation
   * @description Emits category click event for subcategory and manages mega menu state
   * @param subcategory - Clicked subcategory object
   */
  onSubcategoryClick(subcategory: any): void {
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
    this.hideMegaMenu();
  }
  
  /**
   * Shows mega menu for specific category with smooth transitions
   * @description Implements robust hover management with proper delays
   * @param categoryId - ID of category to show mega menu for
   */
  onShowMegaMenu(categoryId: string): void {
    // Set navigation hover state
    this.isMouseOverNavigation = true;
    this.hoverIntentCategoryId = categoryId;

    // Cancel any pending hiding
    this.cancelHiding();

    // Cancel any pending showing for different category
    this.cancelShowing();

    // If same category is already active, show immediately
    if (this.activeMegaMenu === categoryId) {
      return;
    }

    // Show with slight delay for better UX (prevents accidental triggers)
    this.showTimeout = setTimeout(() => {
      if (this.hoverIntentCategoryId === categoryId &&
          (this.isMouseOverNavigation || this.isMouseOverMegaMenu)) {

        // Find the category object by ID
        const category = this.categories.find(cat => cat.id === categoryId) || null;
        this.currentHoveredCategory = category;
        this.megaMenuShow.emit(categoryId);
      }
      this.showTimeout = null;
    }, 150); // 150ms delay as recommended by UX research
  }
  
  /**
   * Handles navigation item mouse leave
   * @description Sets navigation hover state and manages hiding logic
   */
  onHideMegaMenu(): void {
    this.isMouseOverNavigation = false;
    this.hoverIntentCategoryId = null;
    this.hideMegaMenuWithDelay();
  }

  /**
   * Handles mega menu mouse enter
   * @description Prevents menu from hiding when mouse moves to mega menu
   */
  onMegaMenuMouseEnter(): void {
    this.isMouseOverMegaMenu = true;
    this.cancelHiding();
  }

  /**
   * Handles mega menu mouse leave
   * @description Triggers hiding when mouse leaves mega menu area
   */
  onMegaMenuMouseLeave(): void {
    this.isMouseOverMegaMenu = false;
    this.hoverIntentCategoryId = null;
    this.hideMegaMenuWithDelay();
  }
  
  /**
   * Handles All Categories menu opened
   * @description Sets menu open state and emits event
   */
  onAllCategoriesMenuOpened(): void {
    this.isAllCategoriesOpen = true;
    this.allCategoriesClick.emit();
    this.hideMegaMenu(); // Hide any active mega menu when all categories is opened
  }

  /**
   * Handles All Categories menu closed
   * @description Resets menu open state
   */
  onAllCategoriesMenuClosed(): void {
    this.isAllCategoriesOpen = false;
  }

  /**
   * Handles "All Categories" button click (legacy method for compatibility)
   * @description Emits event to show complete category menu
   */
  onAllCategoriesClick(): void {
    this.allCategoriesClick.emit();
    this.hideMegaMenu(); // Hide any active mega menu when all categories is clicked
  }
  
  /**
   * Handles promotional link clicks
   * @description Routes to promotional pages and emits appropriate events
   * @param linkId - Identifier for the promotional link
   */
  onPromotionalLinkClick(linkId: string): void {
    switch (linkId) {
      case 'special-offers':
        this.specialOffersClick.emit();
        break;
      case 'flash-sale':
        this.flashSaleClick.emit();
        break;
    }
  }
  
  /**
   * Gets display text for category based on language
   * @description Returns localized category name
   * @param category - Category object
   * @returns Localized category name
   */
  getCategoryText(category: Category): string {
    return this.config.language === 'ar' ? category.nameAr : category.name;
  }
  
  /**
   * Gets display text for promotional links
   * @description Returns localized promotional link text
   * @param link - Promotional link object
   * @returns Localized link text
   */
  getPromotionalText(link: any): string {
    return this.config.language === 'ar' ? link.nameAr : link.nameEn;
  }
  
  /**
   * Tracks categories in ngFor for performance optimization
   * @description TrackBy function for category lists
   * @param index - Array index
   * @param category - Category object
   * @returns Unique identifier for tracking
   */
  trackByCategory(index: number, category: Category): string {
    return category.id;
  }

  /**
   * Tracks subcategories in ngFor for performance optimization
   * @description TrackBy function for subcategory lists
   * @param index - Array index
   * @param subcategory - Subcategory object
   * @returns Unique identifier for tracking
   */
  trackBySubcategory(index: number, subcategory: any): string {
    return subcategory.id;
  }

  /**
   * Gets display text for subcategory
   * @description Returns localized subcategory name
   * @param subcategory - Subcategory object
   * @returns Localized subcategory name
   */
  getSubcategoryText(subcategory: any): string {
    return this.config.language === 'ar' ? subcategory.nameAr : subcategory.name;
  }
  
  /**
   * Checks if a category has an active mega menu
   * @description Determines if mega menu should be displayed for category
   * @param categoryId - Category ID to check
   * @returns True if mega menu is active for this category
   */
  isMegaMenuActive(categoryId: string): boolean {
    return this.activeMegaMenu === categoryId;
  }

  /**
   * Gets the mega menu type for a given category
   * @description Determines which mega menu component to render
   * @param categoryId - Category ID to check
   * @returns The mega menu type ('sidebar', 'fullwidth', or 'none')
   */
  getMegaMenuType(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.megaMenuType || 'sidebar';
  }

  /**
   * Handles subcategory click from mega menu components
   * @description Converts subcategory to category format and emits click event
   * @param subcategory - Clicked subcategory
   */
  onMegaMenuSubcategoryClick(subcategory: Subcategory): void {
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
    this.hideMegaMenu();
  }

  /**
   * Handles "View All" click from mega menu components
   * @description Emits category click event for the parent category
   * @param category - Parent category
   */
  onMegaMenuViewAllClick(category: Category): void {
    this.categoryClick.emit(category);
    this.hideMegaMenu();
  }
  
  //#endregion
  
  //#region Private Methods
  
  /**
   * Initializes featured categories from main categories list
   * @description Sets up featured categories if not explicitly provided
   * @private
   */
  private initializeFeaturedCategories(): void {
    if (this.featuredCategories.length === 0 && this.categories.length > 0) {
      this.featuredCategories = this.categories
        .filter(category => category.featured)
        .slice(0, 8); // Limit to 8 featured categories for optimal display
    }
  }
  
  /**
   * Timeout reference for mega menu hiding
   * @private
   */
  private hideTimeout: any = null;

  /**
   * Timeout reference for mega menu showing
   * @private
   */
  private showTimeout: any = null;

  /**
   * Flag to track if mouse is over navigation area
   * @private
   */
  private isMouseOverNavigation: boolean = false;

  /**
   * Flag to track if mouse is over mega menu area
   * @private
   */
  private isMouseOverMegaMenu: boolean = false;

  /**
   * Current hover intent category ID
   * @private
   */
  private hoverIntentCategoryId: string | null = null;

  /**
   * Hides mega menu immediately without delay
   * @description For direct hide actions (clicks, navigation)
   * @private
   */
  private hideMegaMenu(): void {
    this.cancelShowing();
    this.cancelHiding();

    this.isMouseOverNavigation = false;
    this.isMouseOverMegaMenu = false;
    this.hoverIntentCategoryId = null;
    this.currentHoveredCategory = null;
    this.megaMenuHide.emit();
  }

  /**
   * Hides mega menu after delay with proper hover state management
   * @description Provides delay for smooth UX when mouse leaves hover areas
   * @private
   */
  private hideMegaMenuWithDelay(): void {
    // Cancel any pending showing
    this.cancelShowing();

    // Clear any existing hiding timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Only hide if mouse is not over either navigation or mega menu
    this.hideTimeout = setTimeout(() => {
      if (!this.isMouseOverNavigation && !this.isMouseOverMegaMenu) {
        this.currentHoveredCategory = null;
        this.megaMenuHide.emit();
      }
      this.hideTimeout = null;
    }, 300); // 300ms delay as recommended by Baymard Institute
  }

  /**
   * Cancels mega menu hiding
   * @description Prevents mega menu from hiding when user moves between elements
   */
  public cancelHiding(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Cancels mega menu showing
   * @description Prevents rapid mega menu showing when moving between categories
   */
  public cancelShowing(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  /**
   * Handles global mouse movements for enhanced hover detection
   * @description Provides additional hover state management for edge cases
   */
  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    // This helps with edge cases where rapid mouse movements might miss hover events
    if (this.activeMegaMenu) {
      const target = event.target as Element;
      const isOverNavigation = target?.closest('.sq-category-nav') !== null;
      const isOverMegaMenu = target?.closest('.sq-mega-menu-container') !== null;

      // Update hover states based on actual DOM position
      this.isMouseOverNavigation = isOverNavigation;
      this.isMouseOverMegaMenu = isOverMegaMenu;

      // If mouse is outside both areas, trigger hide with delay
      if (!isOverNavigation && !isOverMegaMenu && this.activeMegaMenu) {
        this.hoverIntentCategoryId = null;
        this.hideMegaMenuWithDelay();
      }
    }
  }

  //#endregion
}