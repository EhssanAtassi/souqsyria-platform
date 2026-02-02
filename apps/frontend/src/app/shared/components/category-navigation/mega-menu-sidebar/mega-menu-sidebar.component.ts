/**
 * @fileoverview Sidebar Mega Menu Component for SouqSyria
 * @description Vertical sidebar mega menu (280px) with nested submenus on hover.
 * Used for categories like Damascus Steel, Food & Spices, Traditional Crafts, etc.
 * @author SouqSyria Development Team
 * @version 1.0.0
 *
 * @swagger
 * components:
 *   schemas:
 *     MegaMenuSidebarComponent:
 *       type: object
 *       description: Sidebar-style mega menu with nested subcategory flyouts
 *       properties:
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         config:
 *           $ref: '#/components/schemas/NavigationConfig'
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import {
  Category,
  Subcategory,
  NavigationConfig,
  MegaMenuFeaturedProduct
} from '../../../interfaces/navigation.interface';

/**
 * MegaMenuSidebarComponent
 *
 * @description
 * Renders a sidebar-style mega menu (280px width) positioned below the category trigger.
 * Features:
 * - Vertical list of subcategories with chevron_right arrows
 * - Nested submenu flyout on hover (240px, positioned to the right/left in RTL)
 * - Featured products grid (2x1) in the right panel
 * - "View All [Category]" link at the bottom
 * - Smooth CSS transitions for show/hide
 * - Full RTL support (submenu opens to left)
 * - Keyboard accessible
 *
 * @example
 * ```html
 * <app-mega-menu-sidebar
 *   [category]="damascusSteelCategory"
 *   [config]="navigationConfig"
 *   (subcategoryClick)="onSubcategoryClick($event)"
 *   (menuMouseEnter)="onMegaMenuMouseEnter()"
 *   (menuMouseLeave)="onMegaMenuMouseLeave()">
 * </app-mega-menu-sidebar>
 * ```
 */
@Component({
  selector: 'app-mega-menu-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './mega-menu-sidebar.component.html',
  styleUrl: './mega-menu-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MegaMenuSidebarComponent {

  //#region Input Properties

  /** The category whose subcategories to display in the sidebar */
  @Input() category!: Category;

  /** Navigation configuration for language and RTL support */
  @Input() config: NavigationConfig = {
    showArabic: true,
    language: 'en',
    rtl: false,
    locations: [],
    featuredCategories: []
  };

  //#endregion

  //#region Output Events

  /** Emitted when a subcategory link is clicked */
  @Output() subcategoryClick = new EventEmitter<Subcategory>();

  /** Emitted when the "View All" link is clicked */
  @Output() viewAllClick = new EventEmitter<Category>();

  /** Emitted when mouse enters the mega menu area */
  @Output() menuMouseEnter = new EventEmitter<void>();

  /** Emitted when mouse leaves the mega menu area */
  @Output() menuMouseLeave = new EventEmitter<void>();

  //#endregion

  //#region Public Properties

  /** Currently hovered subcategory ID for nested submenu display */
  hoveredSubcategoryId: string | null = null;

  //#endregion

  //#region Public Methods

  /**
   * Handles mouse entering a subcategory item to show nested submenu
   * @param subcategoryId - ID of the hovered subcategory
   */
  onSubcategoryHover(subcategoryId: string): void {
    this.hoveredSubcategoryId = subcategoryId;
  }

  /**
   * Resets hovered subcategory when mouse leaves
   */
  onSubcategoryLeave(): void {
    this.hoveredSubcategoryId = null;
  }

  /**
   * Handles subcategory link click
   * @param subcategory - Clicked subcategory
   */
  onSubcategoryClick(subcategory: Subcategory): void {
    this.subcategoryClick.emit(subcategory);
  }

  /**
   * Handles "View All" link click
   */
  onViewAllClick(): void {
    this.viewAllClick.emit(this.category);
  }

  /**
   * Gets localized subcategory name
   * @param subcategory - Subcategory to get name for
   * @returns Localized name string
   */
  getSubcategoryName(subcategory: Subcategory): string {
    return this.config.language === 'ar' ? subcategory.nameAr : subcategory.name;
  }

  /**
   * Gets localized child subcategory name
   * @param child - Child subcategory object
   * @returns Localized name string
   */
  getChildName(child: { name: string; nameAr: string }): string {
    return this.config.language === 'ar' ? child.nameAr : child.name;
  }

  /**
   * Gets localized category name for "View All" link
   * @returns Localized category name
   */
  getCategoryName(): string {
    return this.config.language === 'ar' ? this.category.nameAr : this.category.name;
  }

  /**
   * Gets the "View All" label text
   * @returns Localized "View All [Category]" text
   */
  getViewAllText(): string {
    const name = this.getCategoryName();
    return this.config.language === 'ar' ? `عرض كل ${name}` : `View All ${name}`;
  }

  /**
   * Gets featured product name
   * @param product - Featured product object
   * @returns Localized product name
   */
  getFeaturedProductName(product: MegaMenuFeaturedProduct): string {
    return this.config.language === 'ar' ? product.nameAr : product.name;
  }

  /**
   * Checks if subcategory has children for nested submenu
   * @param subcategory - Subcategory to check
   * @returns True if subcategory has children
   */
  hasChildren(subcategory: Subcategory): boolean {
    return !!(subcategory.children && subcategory.children.length > 0);
  }

  /**
   * Checks if nested submenu is active
   * @param subcategoryId - Subcategory ID to check
   * @returns True if this subcategory's submenu is shown
   */
  isSubmenuActive(subcategoryId: string): boolean {
    return this.hoveredSubcategoryId === subcategoryId;
  }

  /**
   * TrackBy for subcategories list
   */
  trackBySubcategory(index: number, subcategory: Subcategory): string {
    return subcategory.id;
  }

  /**
   * TrackBy for child subcategories
   */
  trackByChild(index: number, child: { id: string }): string {
    return child.id;
  }

  /**
   * TrackBy for featured products
   */
  trackByProduct(index: number, product: MegaMenuFeaturedProduct): string {
    return product.id;
  }

  //#endregion
}
