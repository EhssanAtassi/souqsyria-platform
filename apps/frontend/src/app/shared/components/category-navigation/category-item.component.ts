/**
 * @fileoverview Category Item Component for SouqSyria
 * @description Individual category item component for various display contexts
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';

// Local imports
import { Category, Subcategory, NavigationConfig } from '../../interfaces/navigation.interface';
import { CategoryIconComponent } from './category-icon.component';

/**
 * Display mode options for category item
 * @description Different visual presentations for various contexts
 */
export type CategoryDisplayMode = 'navigation' | 'dropdown' | 'mobile' | 'grid' | 'list';

/**
 * SouqSyria Category Item Component
 * 
 * @description
 * Reusable component for displaying individual category items with multiple display modes.
 * Features include:
 * - Multiple display modes (navigation, dropdown, mobile, grid, list)
 * - Arabic and English language support
 * - Icon integration with category icons
 * - Subcategory display capabilities
 * - Hover and focus states
 * - Accessibility compliance
 * - Click and navigation handling
 * 
 * @swagger
 * components:
 *   schemas:
 *     CategoryItemComponent:
 *       type: object
 *       properties:
 *         category:
 *           $ref: '#/components/schemas/Category'
 *           description: Category data to display
 *         config:
 *           $ref: '#/components/schemas/NavigationConfig'
 *           description: Navigation configuration options
 *         displayMode:
 *           type: string
 *           enum: [navigation, dropdown, mobile, grid, list]
 *           description: Visual presentation mode
 *         isActive:
 *           type: boolean
 *           description: Whether this category is currently active
 *         showIcon:
 *           type: boolean
 *           description: Whether to display category icon
 *         showSubcategories:
 *           type: boolean
 *           description: Whether to show subcategories
 *         isClickable:
 *           type: boolean
 *           description: Whether the item should be clickable
 * 
 * @example
 * ```html
 * <!-- Navigation bar usage -->
 * <app-category-item
 *   [category]="electronicsCategory"
 *   [config]="navConfig"
 *   displayMode="navigation"
 *   [isActive]="currentCategory === 'electronics'"
 *   (categoryClick)="onCategorySelect($event)">
 * </app-category-item>
 * 
 * <!-- Dropdown menu usage -->
 * <app-category-item
 *   [category]="fashionCategory"
 *   [config]="navConfig"
 *   displayMode="dropdown"
 *   [showSubcategories]="true"
 *   (categoryClick)="onCategorySelect($event)"
 *   (subcategoryClick)="onSubcategorySelect($event)">
 * </app-category-item>
 * ```
 * 
 * @usageNotes
 * - Choose appropriate displayMode for the context
 * - navigation: For horizontal navigation bars
 * - dropdown: For dropdown menus with subcategories
 * - mobile: For mobile menu lists
 * - grid: For grid-based category displays
 * - list: For vertical list displays
 */
@Component({
  selector: 'app-category-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatRippleModule,
    CategoryIconComponent
  ],
  templateUrl: './category-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './category-item.component.scss',
  host: {
    'class': 'sq-category-item',
    '[attr.data-display-mode]': 'displayMode',
    '[class.sq-active]': 'isActive',
    '[class.sq-clickable]': 'isClickable'
  }
})
export class CategoryItemComponent {

  //#region Input Properties
  
  /**
   * Category data to display
   * @description Contains all category information including name, icon, subcategories
   */
  @Input({ required: true }) category!: Category;
  
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
   * Display mode for the category item
   * @description Controls visual presentation and behavior
   */
  @Input() displayMode: CategoryDisplayMode = 'navigation';
  
  /**
   * Active state of the category
   * @description Whether this category is currently selected/active
   */
  @Input() isActive: boolean = false;
  
  /**
   * Show category icon
   * @description Whether to display the category icon
   */
  @Input() showIcon: boolean = true;
  
  /**
   * Show subcategories
   * @description Whether to display subcategories (for dropdown mode)
   */
  @Input() showSubcategories: boolean = false;
  
  /**
   * Clickable state
   * @description Whether the item should respond to clicks
   */
  @Input() isClickable: boolean = true;
  
  /**
   * Custom CSS classes
   * @description Additional CSS classes to apply
   */
  @Input() customClasses: string = '';
  
  //#endregion
  
  //#region Output Events
  
  /**
   * Event emitted when category is clicked
   * @description Provides category data for navigation
   */
  @Output() categoryClick = new EventEmitter<Category>();
  
  /**
   * Event emitted when subcategory is clicked
   * @description Provides subcategory data for navigation
   */
  @Output() subcategoryClick = new EventEmitter<Subcategory>();
  
  /**
   * Event emitted on mouse enter
   * @description For hover effects and mega menu triggers
   */
  @Output() mouseEnter = new EventEmitter<Category>();
  
  /**
   * Event emitted on mouse leave
   * @description For hover effects and mega menu hide
   */
  @Output() mouseLeave = new EventEmitter<Category>();
  
  //#endregion
  
  //#region Host Listeners
  
  /**
   * Handles mouse enter events
   * @description Emits mouse enter event for parent components
   */
  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.isClickable) {
      this.mouseEnter.emit(this.category);
    }
  }
  
  /**
   * Handles mouse leave events
   * @description Emits mouse leave event for parent components
   */
  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.isClickable) {
      this.mouseLeave.emit(this.category);
    }
  }
  
  //#endregion
  
  //#region Public Methods
  
  /**
   * Handles category item click
   * @description Processes click events and emits categoryClick event
   * @param event - Click event object
   */
  onCategoryClick(event: Event): void {
    if (!this.isClickable) {
      event.preventDefault();
      return;
    }
    
    event.stopPropagation();
    this.categoryClick.emit(this.category);
  }
  
  /**
   * Handles subcategory click
   * @description Processes subcategory clicks and emits subcategoryClick event
   * @param event - Click event object
   * @param subcategory - Clicked subcategory data
   */
  onSubcategoryClick(event: Event, subcategory: Subcategory): void {
    event.stopPropagation();
    this.subcategoryClick.emit(subcategory);
  }
  
  /**
   * Gets display text for category
   * @description Returns localized category name based on current language
   * @returns Localized category name
   */
  getCategoryText(): string {
    return this.config.language === 'ar' ? this.category.nameAr : this.category.name;
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
   * Gets CSS classes for the component
   * @description Builds CSS class string based on state and configuration
   * @returns CSS class string
   */
  getComponentClasses(): string {
    const classes = ['sq-category-item'];
    
    if (this.displayMode) {
      classes.push(`sq-category-item--${this.displayMode}`);
    }
    
    if (this.isActive) {
      classes.push('sq-category-item--active');
    }
    
    if (!this.isClickable) {
      classes.push('sq-category-item--disabled');
    }
    
    if (this.config.rtl) {
      classes.push('sq-category-item--rtl');
    }
    
    if (this.customClasses) {
      classes.push(this.customClasses);
    }
    
    return classes.join(' ');
  }
  
  /**
   * Gets aria label for the category item
   * @description Returns accessible label for screen readers
   * @returns Aria label string
   */
  getAriaLabel(): string {
    const categoryText = this.getCategoryText();
    const hasSubcategories = this.category.subcategories && this.category.subcategories.length > 0;
    
    if (this.config.language === 'ar') {
      return hasSubcategories 
        ? `فئة ${categoryText} - يحتوي على فئات فرعية`
        : `فئة ${categoryText}`;
    } else {
      return hasSubcategories 
        ? `${categoryText} category - contains subcategories`
        : `${categoryText} category`;
    }
  }
  
  /**
   * Checks if category has subcategories
   * @description Determines if subcategories should be shown
   * @returns True if category has subcategories
   */
  hasSubcategories(): boolean {
    return !!(this.category.subcategories && this.category.subcategories.length > 0);
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
   * Gets button type for the display mode
   * @description Returns appropriate Material button type
   * @returns Material button type
   */
  getButtonType(): string {
    switch (this.displayMode) {
      case 'navigation':
        return 'mat-button';
      case 'dropdown':
        return 'mat-menu-item';
      case 'mobile':
        return 'mat-button';
      case 'grid':
        return 'mat-raised-button';
      case 'list':
        return 'mat-button';
      default:
        return 'mat-button';
    }
  }
  
  //#endregion
}