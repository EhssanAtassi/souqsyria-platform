import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Banner interface for promotional content
 */
export interface Banner {
  id: string;
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  imageUrl: string;
  link?: string;
  buttonText?: string;
  buttonTextAr?: string;
  backgroundClass?: string;
}

/**
 * Theme Banner Component
 *
 * Displays promotional banners in grid layouts
 * Supports 2, 3, or 4 column configurations with responsive behavior
 *
 * Features:
 * - Multiple column layouts (2, 3, 4)
 * - Responsive design (mobile-first)
 * - Router integration for navigation
 * - Bilingual support (English/Arabic)
 * - Golden Wheat design system
 *
 * @swagger
 * components:
 *   schemas:
 *     ThemeBannerComponent:
 *       type: object
 *       description: Promotional banner grid component
 *       properties:
 *         banners:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Banner'
 *           description: Array of banner objects to display
 *         columns:
 *           type: number
 *           enum: [2, 3, 4]
 *           description: Number of columns in grid layout
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *
 * @example
 * ```html
 * <app-theme-banner
 *   [banners]="promotionalBanners"
 *   [columns]="3"
 *   [language]="'en'">
 * </app-theme-banner>
 * ```
 */
@Component({
  selector: 'app-theme-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './theme-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./theme-banner.component.scss']
})
export class ThemeBannerComponent {
  /**
   * Array of banner objects to display
   */
  @Input() banners: Banner[] = [];

  /**
   * Number of columns in grid layout
   * Supports 2, 3, or 4 columns
   * Automatically responsive on mobile (single column)
   */
  @Input() columns: 2 | 3 | 4 = 3;

  /**
   * Current display language
   */
  @Input() language: 'en' | 'ar' = 'en';

  /**
   * Gets grid column class based on column count
   */
  get gridClass(): string {
    return `theme-banner__grid--${this.columns}col`;
  }
}
