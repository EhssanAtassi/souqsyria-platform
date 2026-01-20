import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Theme Title Component
 *
 * Reusable section header component for Syrian marketplace
 * Supports bilingual display (English/Arabic) with optional icon
 *
 * Features:
 * - Multiple style variants (basic, centered, with-icon)
 * - Bilingual support for title and subtitle
 * - Optional icon/emoji display
 * - Golden Wheat design system integration
 *
 * @swagger
 * components:
 *   schemas:
 *     ThemeTitleComponent:
 *       type: object
 *       description: Section header component with bilingual support
 *       properties:
 *         title:
 *           type: string
 *           description: Title text in English
 *         titleAr:
 *           type: string
 *           description: Title text in Arabic
 *         subtitle:
 *           type: string
 *           description: Optional subtitle text
 *         icon:
 *           type: string
 *           description: Optional icon or emoji
 *         variant:
 *           type: string
 *           enum: [basic, centered, with-icon]
 *           description: Visual style variant
 *
 * @example
 * ```html
 * <app-theme-title
 *   [title]="'Featured Products'"
 *   [titleAr]="'المنتجات المميزة'"
 *   [subtitle]="'Handpicked Syrian treasures'"
 *   [variant]="'centered'">
 * </app-theme-title>
 * ```
 */
@Component({
  selector: 'app-theme-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./theme-title.component.scss']
})
export class ThemeTitleComponent {
  /**
   * Main title text in English
   */
  @Input() title: string = '';

  /**
   * Main title text in Arabic
   */
  @Input() titleAr?: string;

  /**
   * Optional subtitle text
   */
  @Input() subtitle?: string;

  /**
   * Optional subtitle text in Arabic
   */
  @Input() subtitleAr?: string;

  /**
   * Optional icon or emoji to display
   */
  @Input() icon?: string;

  /**
   * Visual style variant
   * - 'basic': Left-aligned with simple styling
   * - 'centered': Center-aligned with decorative elements
   * - 'with-icon': Includes icon display
   */
  @Input() variant: 'basic' | 'centered' | 'with-icon' = 'basic';

  /**
   * Current language for bilingual display
   * Defaults to English, can be set to 'ar' for Arabic
   */
  @Input() language: 'en' | 'ar' = 'en';
}
