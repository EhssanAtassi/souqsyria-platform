/**
 * @fileoverview Category Icon Component for SouqSyria
 * @description Specialized icon component for category display with Syrian e-commerce theming
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule, MatBadgePosition, MatBadgeSize } from '@angular/material/badge';

// Local imports
import { Category } from '../../interfaces/navigation.interface';

/**
 * Icon size options
 * @description Predefined sizes for consistent icon scaling
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Icon color options
 * @description Predefined colors aligned with SouqSyria design system
 */
export type IconColor = 'current' | 'primary-600' | 'primary-200' | 'neutral-600' | 'neutral-400' | 'white' | 'accent-600';

/**
 * SouqSyria Category Icon Component
 * 
 * @description
 * A specialized icon component for displaying category icons with Syrian e-commerce styling.
 * Features include:
 * - Multiple size variants (xs, sm, md, lg, xl, 2xl)
 * - Color variants aligned with SouqSyria design system
 * - Material Design icon integration
 * - Badge support for notifications/counts
 * - Accessibility compliance with ARIA labels
 * - Support for both Material icons and custom SVG icons
 * - Responsive scaling and hover effects
 * 
 * @swagger
 * components:
 *   schemas:
 *     CategoryIconComponent:
 *       type: object
 *       properties:
 *         category:
 *           $ref: '#/components/schemas/Category'
 *           description: Category data containing icon information
 *         size:
 *           type: string
 *           enum: [xs, sm, md, lg, xl, 2xl]
 *           description: Icon size variant
 *         color:
 *           type: string
 *           enum: [current, primary-600, primary-200, neutral-600, neutral-400, white, accent-600]
 *           description: Icon color variant
 *         showBadge:
 *           type: boolean
 *           description: Whether to display notification badge
 *         badgeValue:
 *           type: string
 *           description: Badge text/number to display
 *         ariaLabel:
 *           type: string
 *           description: Accessibility label for screen readers
 * 
 * @example
 * ```html
 * <!-- Basic category icon -->
 * <app-category-icon
 *   [category]="electronicsCategory"
 *   size="md"
 *   color="primary-600">
 * </app-category-icon>
 * 
 * <!-- Icon with badge for notifications -->
 * <app-category-icon
 *   [category]="fashionCategory"
 *   size="lg"
 *   color="neutral-600"
 *   [showBadge]="true"
 *   badgeValue="NEW">
 * </app-category-icon>
 * ```
 * 
 * @usageNotes
 * - Use appropriate sizes based on context (xs/sm for navigation, md/lg for cards)
 * - Color should align with surrounding design and accessibility contrast requirements
 * - Badge is useful for highlighting new categories or special offers
 * - Icons automatically inherit RTL support from parent components
 */
@Component({
  selector: 'app-category-icon',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule
  ],
  templateUrl: './category-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './category-icon.component.scss',
  host: {
    'class': 'sq-category-icon',
    '[attr.data-size]': 'size',
    '[attr.data-color]': 'color'
  }
})
export class CategoryIconComponent implements OnInit {

  //#region Input Properties
  
  /**
   * Category data containing icon information
   * @description Contains icon name and category metadata
   */
  @Input({ required: true }) category!: Category;
  
  /**
   * Icon size variant
   * @description Controls icon dimensions and scaling
   */
  @Input() size: IconSize = 'md';
  
  /**
   * Icon color variant
   * @description Controls icon color from design system palette
   */
  @Input() color: IconColor = 'current';
  
  /**
   * Show notification badge
   * @description Whether to display a badge overlay on the icon
   */
  @Input() showBadge: boolean = false;
  
  /**
   * Badge text/number
   * @description Content to display in the badge
   */
  @Input() badgeValue: string = '';
  
  /**
   * Custom aria label
   * @description Accessibility label override for screen readers
   */
  @Input() ariaLabel: string = '';
  
  /**
   * Custom CSS classes
   * @description Additional CSS classes to apply
   */
  @Input() customClasses: string = '';
  
  /**
   * Enable hover effects
   * @description Whether to apply hover animations and effects
   */
  @Input() enableHover: boolean = true;
  
  //#endregion
  
  //#region Public Properties
  
  /** Computed CSS classes for the icon */
  public iconClasses: string = '';
  
  /** Computed aria label for accessibility */
  public computedAriaLabel: string = '';
  
  /** Size mapping for icon dimensions */
  public readonly sizeMap: Record<IconSize, string> = {
    'xs': 'text-xs w-3 h-3',
    'sm': 'text-sm w-4 h-4',
    'md': 'text-base w-5 h-5',
    'lg': 'text-lg w-6 h-6',
    'xl': 'text-xl w-8 h-8',
    '2xl': 'text-2xl w-10 h-10'
  };
  
  /** Color mapping for icon colors */
  public readonly colorMap: Record<IconColor, string> = {
    'current': 'text-current',
    'primary-600': 'text-primary-600',
    'primary-200': 'text-primary-200',
    'neutral-600': 'text-neutral-600',
    'neutral-400': 'text-neutral-400',
    'white': 'text-white',
    'accent-600': 'text-accent-600'
  };
  
  /** Syrian e-commerce category icon mapping */
  public readonly syrianCategoryIcons: Record<string, string> = {
    'electronics': 'devices',
    'fashion': 'checkroom',
    'home-garden': 'home',
    'beauty': 'face',
    'sports': 'sports_soccer',
    'books': 'menu_book',
    'automotive': 'directions_car',
    'food': 'restaurant',
    'health': 'local_pharmacy',
    'toys': 'toys',
    'jewelry': 'diamond',
    'mobile': 'smartphone'
  };
  
  //#endregion
  
  //#region Lifecycle Methods
  
  /**
   * Component initialization
   * @description Sets up icon classes and aria labels
   */
  ngOnInit(): void {
    this.initializeIconClasses();
    this.initializeAriaLabel();
  }
  
  //#endregion
  
  //#region Public Methods
  
  /**
   * Gets the icon name to display
   * @description Returns appropriate Material Design icon name
   * @returns Material Design icon name
   */
  getIconName(): string {
    if (this.category.icon) {
      return this.category.icon;
    }
    
    // Fallback to Syrian category icon mapping
    const categoryType = this.category.id.toLowerCase();
    return this.syrianCategoryIcons[categoryType] || 'category';
  }
  
  /**
   * Gets the complete CSS class string
   * @description Builds CSS classes based on size, color, and custom classes
   * @returns Complete CSS class string
   */
  getIconClasses(): string {
    const classes = [
      this.iconClasses,
      this.enableHover ? 'sq-icon-hover' : '',
      this.customClasses
    ].filter(Boolean);
    
    return classes.join(' ');
  }
  
  /**
   * Gets the aria label for accessibility
   * @description Returns appropriate ARIA label for screen readers
   * @returns ARIA label string
   */
  getAriaLabel(): string {
    return this.computedAriaLabel;
  }
  
  /**
   * Checks if icon should show badge
   * @description Determines if badge should be visible
   * @returns True if badge should be shown
   */
  shouldShowBadge(): boolean {
    return this.showBadge && !!this.badgeValue;
  }
  
  /**
   * Gets badge position based on icon size
   * @description Returns appropriate badge positioning
   * @returns Badge position string
   */
  getBadgePosition(): MatBadgePosition {
    switch (this.size) {
      case 'xs':
      case 'sm':
        return 'above after';
      case 'md':
      case 'lg':
        return 'above after';
      case 'xl':
      case '2xl':
        return 'above after';
      default:
        return 'above after';
    }
  }
  
  /**
   * Gets badge size based on icon size
   * @description Returns appropriate badge size
   * @returns Badge size string
   */
  getBadgeSize(): MatBadgeSize {
    switch (this.size) {
      case 'xs':
        return 'small';
      case 'sm':
      case 'md':
        return 'small';
      case 'lg':
      case 'xl':
      case '2xl':
        return 'medium';
      default:
        return 'small';
    }
  }
  
  //#endregion
  
  //#region Private Methods
  
  /**
   * Initializes icon CSS classes
   * @description Builds CSS class string based on size and color
   * @private
   */
  private initializeIconClasses(): void {
    const sizeClasses = this.sizeMap[this.size] || this.sizeMap['md'];
    const colorClasses = this.colorMap[this.color] || this.colorMap['current'];
    
    this.iconClasses = [sizeClasses, colorClasses].join(' ');
  }
  
  /**
   * Initializes aria label for accessibility
   * @description Sets up appropriate ARIA label
   * @private
   */
  private initializeAriaLabel(): void {
    if (this.ariaLabel) {
      this.computedAriaLabel = this.ariaLabel;
    } else {
      const categoryName = this.category.name;
      this.computedAriaLabel = `${categoryName} category icon`;
    }
  }
  
  //#endregion
}