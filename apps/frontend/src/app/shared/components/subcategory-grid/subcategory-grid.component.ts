import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { SubcategoryCard, SubcategoryClickEvent } from '../../interfaces/category-showcase.interface';

/**
 * SubcategoryGrid Component
 *
 * Displays a grid of subcategory cards (typically 7 items based on Figma design).
 * Each card shows category icon/image, name, and item count.
 * Used on the right side of CategoryShowcaseSection.
 *
 * Features:
 * - Responsive grid layout (2 columns on mobile, 2-3 on tablet, 2 on desktop within section)
 * - Bilingual support (Arabic RTL / English LTR)
 * - Syrian Golden Wheat theme
 * - Hover effects with scale animation
 * - Click event tracking for analytics
 *
 * @example
 * <app-subcategory-grid
 *   [subcategories]="subcategoryCards"
 *   [sectionId]="'consumer-electronics'"
 *   (subcategoryClick)="onSubcategoryClick($event)"
 * />
 *
 * @swagger
 * components:
 *   schemas:
 *     SubcategoryGridComponent:
 *       type: object
 *       properties:
 *         subcategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubcategoryCard'
 *         sectionId:
 *           type: string
 *         gridColumns:
 *           type: number
 *           default: 2
 */
@Component({
  selector: 'app-subcategory-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatRippleModule
  ],
  templateUrl: './subcategory-grid.component.html',
  styleUrl: './subcategory-grid.component.scss'
})
export class SubcategoryGridComponent {
  /**
   * Array of subcategory cards to display
   * Typically 7 items per Figma design
   */
  @Input({ required: true }) subcategories: SubcategoryCard[] = [];

  /**
   * Parent section identifier for analytics tracking
   */
  @Input({ required: true }) sectionId: string = '';

  /**
   * Number of grid columns (default: 2 for desktop layout within section)
   */
  @Input() gridColumns: number = 2;

  /**
   * Show item count badge on cards
   */
  @Input() showItemCount: boolean = true;

  /**
   * Show discount/special badges
   */
  @Input() showBadges: boolean = true;

  /**
   * Event emitted when subcategory card is clicked
   */
  @Output() subcategoryClick = new EventEmitter<SubcategoryClickEvent>();

  /**
   * Handles subcategory card click event
   * Emits click event for parent component and analytics tracking
   *
   * @param subcategory - Clicked subcategory card data
   * @param index - Position of card in grid (for analytics)
   */
  onSubcategoryClick(subcategory: SubcategoryCard, index: number): void {
    const clickEvent: SubcategoryClickEvent = {
      subcategoryId: subcategory.id,
      sectionId: this.sectionId,
      categoryName: subcategory.name.en,
      targetUrl: subcategory.route,
      timestamp: new Date(),
      analytics: {
        source: 'subcategory_grid',
        position: index
      }
    };

    this.subcategoryClick.emit(clickEvent);
  }

  /**
   * TrackBy function for ngFor performance optimization
   *
   * @param index - Array index
   * @param subcategory - Subcategory card object
   * @returns Unique identifier for tracking
   */
  trackBySubcategoryId(index: number, subcategory: SubcategoryCard): string {
    return subcategory.id;
  }

  /**
   * Gets grid column class based on gridColumns input
   *
   * @returns Tailwind CSS grid column classes
   */
  getGridColumnClass(): string {
    const columnMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4'
    };

    return columnMap[this.gridColumns] || 'grid-cols-2';
  }
}
