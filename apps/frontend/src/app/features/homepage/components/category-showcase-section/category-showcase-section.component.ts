import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FeaturedBannerComponent } from '../../../../shared/components/featured-banner/featured-banner.component';
import { SubcategoryGridComponent } from '../../../../shared/components/subcategory-grid/subcategory-grid.component';
import {
  CategoryShowcaseSection,
  BannerClickEvent,
  SubcategoryClickEvent
} from '../../../../shared/interfaces/category-showcase.interface';

/**
 * CategoryShowcaseSection Component
 *
 * Main wrapper component for homepage category sections.
 * Displays featured promotional banner (left) + subcategory grid (right) per Figma design.
 *
 * Features:
 * - Responsive layout (stacked on mobile, side-by-side on desktop)
 * - Section header with title and navigation links (New Arrivals, Best Seller)
 * - Admin-controlled visibility
 * - Syrian Golden Wheat theme
 * - Bilingual support (Arabic RTL / English LTR)
 * - Analytics event tracking
 *
 * @example
 * <app-category-showcase-section
 *   [section]="consumerElectronicsSection"
 *   (bannerClick)="onBannerClick($event)"
 *   (subcategoryClick)="onSubcategoryClick($event)"
 * />
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryShowcaseSectionComponent:
 *       type: object
 *       properties:
 *         section:
 *           $ref: '#/components/schemas/CategoryShowcaseSection'
 *         showHeader:
 *           type: boolean
 *           default: true
 *         showNavigationLinks:
 *           type: boolean
 *           default: true
 */
@Component({
  selector: 'app-category-showcase-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    FeaturedBannerComponent,
    SubcategoryGridComponent
  ],
  templateUrl: './category-showcase-section.component.html',
  styleUrl: './category-showcase-section.component.scss'
})
export class CategoryShowcaseSectionComponent {
  /**
   * Category showcase section data
   * Contains featured banner, subcategories, title, and configuration
   */
  @Input({ required: true }) section!: CategoryShowcaseSection;

  /**
   * Show section header with title and navigation links
   */
  @Input() showHeader: boolean = true;

  /**
   * Show navigation links (New Arrivals, Best Seller)
   */
  @Input() showNavigationLinks: boolean = true;

  /**
   * Custom CSS class for additional styling
   */
  @Input() customClass: string = '';

  /**
   * Event emitted when featured banner is clicked
   */
  @Output() bannerClick = new EventEmitter<BannerClickEvent>();

  /**
   * Event emitted when subcategory card is clicked
   */
  @Output() subcategoryClick = new EventEmitter<SubcategoryClickEvent>();

  /**
   * Handles featured banner click event
   * Passes event up to parent component for analytics tracking
   *
   * @param event - Banner click event data
   */
  onBannerClick(event: BannerClickEvent): void {
    this.bannerClick.emit(event);
  }

  /**
   * Handles subcategory card click event
   * Passes event up to parent component for analytics tracking
   *
   * @param event - Subcategory click event data
   */
  onSubcategoryClick(event: SubcategoryClickEvent): void {
    this.subcategoryClick.emit(event);
  }

  /**
   * Handles navigation link clicks (New Arrivals, Best Seller)
   *
   * @param linkType - Type of navigation link ('newArrivals' | 'bestSeller')
   */
  onNavigationLinkClick(linkType: 'newArrivals' | 'bestSeller'): void {
    console.log(`Navigation link clicked: ${linkType} for section ${this.section.id}`);
    // Analytics tracking handled by parent component via router navigation
  }
}
