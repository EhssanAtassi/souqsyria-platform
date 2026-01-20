import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Brand/Artisan interface for Syrian marketplace
 */
export interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  logoUrl: string;
  description?: string;
  descriptionAr?: string;
  link?: string;
  location?: string;
  verified?: boolean;
}

/**
 * Theme Brand Component
 *
 * Displays Syrian artisans and brands in a horizontal scrollable layout
 * Highlights authentic Syrian craftsmen and producers
 *
 * Features:
 * - Horizontal scrollable grid
 * - Verified artisan badges
 * - Bilingual support (English/Arabic)
 * - Responsive design
 * - Golden Wheat design system
 * - Router integration for artisan profiles
 *
 * @swagger
 * components:
 *   schemas:
 *     ThemeBrandComponent:
 *       type: object
 *       description: Syrian artisan/brand showcase component
 *       properties:
 *         brands:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Brand'
 *           description: Array of brand/artisan objects
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *
 * @example
 * ```html
 * <app-theme-brand
 *   [brands]="syrianArtisans"
 *   [language]="'en'">
 * </app-theme-brand>
 * ```
 */
@Component({
  selector: 'app-theme-brand',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './theme-brand.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./theme-brand.component.scss']
})
export class ThemeBrandComponent {
  /**
   * Array of brand/artisan objects to display
   */
  @Input() brands: Brand[] = [];

  /**
   * Current display language
   */
  @Input() language: 'en' | 'ar' = 'en';

  /**
   * Show verification badges
   */
  @Input() showVerification: boolean = true;
}
