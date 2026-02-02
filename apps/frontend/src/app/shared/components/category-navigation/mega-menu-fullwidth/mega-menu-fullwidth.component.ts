/**
 * @fileoverview Fullwidth Mega Menu Component for SouqSyria
 * @description Wide mega menu (900-1100px) with multi-column layout and featured image tiles.
 * Used for categories like Beauty & Wellness, Textiles & Fabrics.
 * @author SouqSyria Development Team
 * @version 1.0.0
 *
 * @swagger
 * components:
 *   schemas:
 *     MegaMenuFullwidthComponent:
 *       type: object
 *       description: Fullwidth mega menu with column layout and featured tiles
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
  MenuColumn,
  FeaturedTile,
  MenuLink
} from '../../../interfaces/navigation.interface';

/**
 * MegaMenuFullwidthComponent
 *
 * @description
 * Renders a fullwidth mega menu (900-1100px) centered below the category trigger.
 * Features:
 * - Multi-column grid layout (3 text columns + 1 image column)
 * - Column headings with subcategory links
 * - Featured image tiles with colored backgrounds and Material icons
 * - "View All" link at the bottom
 * - Smooth CSS transitions
 * - Full RTL support
 * - Keyboard accessible
 *
 * @example
 * ```html
 * <app-mega-menu-fullwidth
 *   [category]="beautyCategory"
 *   [config]="navigationConfig"
 *   (subcategoryClick)="onSubcategoryClick($event)"
 *   (menuMouseEnter)="onMegaMenuMouseEnter()"
 *   (menuMouseLeave)="onMegaMenuMouseLeave()">
 * </app-mega-menu-fullwidth>
 * ```
 */
@Component({
  selector: 'app-mega-menu-fullwidth',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './mega-menu-fullwidth.component.html',
  styleUrl: './mega-menu-fullwidth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MegaMenuFullwidthComponent {

  //#region Input Properties

  /** The category whose data to display in the fullwidth mega menu */
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

  /** Emitted when a featured tile is clicked */
  @Output() tileClick = new EventEmitter<FeaturedTile>();

  /** Emitted when the "View All" link is clicked */
  @Output() viewAllClick = new EventEmitter<Category>();

  /** Emitted when mouse enters the mega menu area */
  @Output() menuMouseEnter = new EventEmitter<void>();

  /** Emitted when mouse leaves the mega menu area */
  @Output() menuMouseLeave = new EventEmitter<void>();

  //#endregion

  //#region Public Methods

  /**
   * Gets the menu columns data, falling back to auto-generated columns from subcategories
   * @returns Array of MenuColumn objects
   */
  getMenuColumns(): MenuColumn[] {
    if (this.category.menuColumns && this.category.menuColumns.length > 0) {
      return this.category.menuColumns;
    }

    // Fallback: auto-generate columns from subcategories
    const subcategories = this.category.subcategories || [];
    const columns: MenuColumn[] = [];
    const chunkSize = Math.ceil(subcategories.length / 3);

    for (let i = 0; i < 3 && i * chunkSize < subcategories.length; i++) {
      const chunk = subcategories.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length > 0) {
        columns.push({
          title: chunk[0].name,
          titleAr: chunk[0].nameAr,
          links: chunk.map(sub => ({
            name: sub.name,
            nameAr: sub.nameAr,
            url: sub.url,
            icon: sub.icon
          }))
        });
      }
    }

    return columns;
  }

  /**
   * Gets the featured tiles for the image column
   * @returns Array of FeaturedTile objects
   */
  getFeaturedTiles(): FeaturedTile[] {
    return this.category.featuredTiles || [];
  }

  /**
   * Gets localized column title
   * @param column - MenuColumn object
   * @returns Localized title string
   */
  getColumnTitle(column: MenuColumn): string {
    return this.config.language === 'ar' ? column.titleAr : column.title;
  }

  /**
   * Gets localized link name
   * @param link - MenuLink object
   * @returns Localized name string
   */
  getLinkName(link: MenuLink): string {
    return this.config.language === 'ar' ? link.nameAr : link.name;
  }

  /**
   * Gets localized tile name
   * @param tile - FeaturedTile object
   * @returns Localized name string
   */
  getTileName(tile: FeaturedTile): string {
    return this.config.language === 'ar' ? tile.nameAr : tile.name;
  }

  /**
   * Gets localized category name
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
   * Handles subcategory link click
   * @param link - Clicked link
   */
  onLinkClick(link: MenuLink): void {
    const subcategory: Subcategory = {
      id: link.url.split('/').pop() || '',
      name: link.name,
      nameAr: link.nameAr,
      url: link.url,
      icon: link.icon
    };
    this.subcategoryClick.emit(subcategory);
  }

  /**
   * Handles "View All" link click
   */
  onViewAllClick(): void {
    this.viewAllClick.emit(this.category);
  }

  /**
   * TrackBy for columns
   */
  trackByColumn(index: number, column: MenuColumn): string {
    return column.title;
  }

  /**
   * TrackBy for links
   */
  trackByLink(index: number, link: MenuLink): string {
    return link.url;
  }

  /**
   * TrackBy for tiles
   */
  trackByTile(index: number, tile: FeaturedTile): string {
    return tile.url;
  }

  //#endregion
}
