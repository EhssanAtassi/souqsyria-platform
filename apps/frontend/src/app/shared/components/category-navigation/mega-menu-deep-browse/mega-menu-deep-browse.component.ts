/**
 * @fileoverview Deep-Browse Mega Menu Component for SouqSyria
 * @description Two-panel mega menu (220px sidebar + flexible right panel) with hover-activated
 * panel switching. Used for categories like Electronics that have many subcategory groups.
 *
 * @swagger
 * components:
 *   schemas:
 *     MegaMenuDeepBrowseComponent:
 *       type: object
 *       description: Deep-browse mega menu with sidebar category groups and switchable right panels
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
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import {
  Category,
  Subcategory,
  NavigationConfig,
  MegaMenuCategoryConfig
} from '../../../interfaces/navigation.interface';

/**
 * MegaMenuDeepBrowseComponent
 *
 * @description
 * Renders a deep-browse mega menu with:
 * - Left sidebar (~220px): category group items with icons + chevron arrows
 * - Right panel (~800px): switches on hover showing 3-column sub-subcategories
 * - Brand chips row at bottom of each panel
 * - Promo banner from megaMenuConfig
 * - HOT/NEW badges on individual items
 * - Uses [hidden] toggling (not *ngIf) for instant panel switching
 * - Full RTL support + keyboard accessible
 *
 * @example
 * ```html
 * <app-mega-menu-deep-browse
 *   [category]="electronicsCategory"
 *   [config]="navigationConfig"
 *   (subcategoryClick)="onSubcategoryClick($event)"
 *   (menuMouseEnter)="onMegaMenuMouseEnter()"
 *   (menuMouseLeave)="onMegaMenuMouseLeave()">
 * </app-mega-menu-deep-browse>
 * ```
 */
@Component({
  selector: 'app-mega-menu-deep-browse',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './mega-menu-deep-browse.component.html',
  styleUrl: './mega-menu-deep-browse.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MegaMenuDeepBrowseComponent {

  //#region Input Properties

  /** The category whose subcategories to display in deep-browse layout */
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

  /** Currently active sidebar item index (first item active by default) */
  activeSidebarIndex = 0;

  //#endregion

  //#region Public Methods

  /**
   * Handles mouse entering a sidebar category group
   * @param index - Index of the hovered sidebar item
   */
  onSidebarHover(index: number): void {
    this.activeSidebarIndex = index;
  }

  /**
   * Gets the subcategories array (sidebar items = top-level subcategories)
   * @returns Array of subcategories for sidebar display
   */
  getSidebarItems(): Subcategory[] {
    return this.category.subcategories || [];
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
   * @param child - Child object with bilingual name
   * @returns Localized name string
   */
  getChildName(child: { name: string; nameAr: string }): string {
    return this.config.language === 'ar' ? child.nameAr : child.name;
  }

  /**
   * Gets localized category name
   * @returns Localized category name
   */
  getCategoryName(): string {
    return this.config.language === 'ar' ? this.category.nameAr : this.category.name;
  }

  /**
   * Gets the "See All" label for a panel header
   * @returns Localized "See All" text
   */
  getSeeAllText(): string {
    return this.config.language === 'ar' ? 'عرض الكل ←' : 'See All →';
  }

  /**
   * Gets brand chips from megaMenuConfig
   * @returns Array of brand chip objects, or empty array
   */
  getBrandChips(): NonNullable<MegaMenuCategoryConfig['brandChips']> {
    return this.category.megaMenuConfig?.brandChips || [];
  }

  /**
   * Gets localized brand name
   * @param brand - Brand chip object
   * @returns Localized brand name
   */
  getBrandName(brand: { name: string; nameAr?: string }): string {
    return (this.config.language === 'ar' && brand.nameAr) ? brand.nameAr : brand.name;
  }

  /**
   * Gets the "Top Brands" label
   * @returns Localized label text
   */
  getBrandsLabel(): string {
    return this.config.language === 'ar' ? 'أفضل العلامات:' : 'Top Brands:';
  }

  /**
   * Checks if a sidebar item is currently active
   * @param index - Sidebar item index
   * @returns True if this item's panel is shown
   */
  isSidebarActive(index: number): boolean {
    return this.activeSidebarIndex === index;
  }

  /**
   * Handles click on a subcategory link within a panel
   * @param subcategory - Clicked subcategory
   */
  onSubcategoryClick(subcategory: Subcategory): void {
    this.subcategoryClick.emit(subcategory);
  }

  /**
   * Handles "View All" click for the entire category
   */
  onViewAllClick(): void {
    this.viewAllClick.emit(this.category);
  }

  /**
   * TrackBy for sidebar items
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
   * TrackBy for brand chips
   */
  trackByBrand(index: number, brand: { slug: string }): string {
    return brand.slug;
  }

  //#endregion
}
