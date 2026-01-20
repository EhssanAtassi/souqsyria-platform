import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge Type Enumeration
 */
export type BadgeType = 'unesco' | 'sale' | 'artisan' | 'new' | 'out-of-stock' | 'limited' | 'featured';

/**
 * Badge Label Component
 *
 * Displays product status badges with Syrian cultural styling.
 * Supports UNESCO heritage, sale, artisan, new, and stock status indicators.
 *
 * @swagger
 * components:
 *   schemas:
 *     BadgeComponent:
 *       type: object
 *       description: Product status badge with cultural Syrian styling
 *       properties:
 *         type:
 *           type: string
 *           enum: [unesco, sale, artisan, new, out-of-stock, limited, featured]
 *           description: Badge variant with semantic styling
 *         text:
 *           type: string
 *           description: Badge text (optional, defaults by type)
 *         textArabic:
 *           type: string
 *           description: Badge text in Arabic (optional)
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Current display language
 *         value:
 *           type: string
 *           description: Dynamic value (e.g., discount percentage)
 *
 * @example
 * ```html
 * <!-- UNESCO Heritage Badge -->
 * <app-badge type="unesco"></app-badge>
 *
 * <!-- Sale Badge with Percentage -->
 * <app-badge type="sale" value="25%"></app-badge>
 *
 * <!-- Artisan Badge (bilingual) -->
 * <app-badge
 *   type="artisan"
 *   text="Handcrafted"
 *   textArabic="صناعة يدوية"
 *   [language]="currentLang">
 * </app-badge>
 *
 * <!-- Out of Stock Badge -->
 * <app-badge type="out-of-stock"></app-badge>
 * ```
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  /**
   * Badge type (determines color, icon, and default text)
   */
  @Input() type: BadgeType = 'new';

  /**
   * Custom badge text (English)
   * If not provided, uses default text for badge type
   */
  @Input() text?: string;

  /**
   * Custom badge text (Arabic)
   */
  @Input() textArabic?: string;

  /**
   * Current language for text display
   */
  @Input() language: 'en' | 'ar' = 'en';

  /**
   * Dynamic value (e.g., discount percentage, stock count)
   */
  @Input() value?: string;

  /**
   * Default badge texts by type
   */
  private defaultTexts: Record<BadgeType, { en: string; ar: string }> = {
    unesco: { en: 'UNESCO Heritage', ar: 'تراث اليونسكو' },
    sale: { en: 'Sale', ar: 'تخفيض' },
    artisan: { en: 'Artisan Made', ar: 'صناعة حرفية' },
    new: { en: 'New', ar: 'جديد' },
    'out-of-stock': { en: 'Out of Stock', ar: 'غير متوفر' },
    limited: { en: 'Limited Edition', ar: 'إصدار محدود' },
    featured: { en: 'Featured', ar: 'مميز' }
  };

  /**
   * Get display text based on language and custom text
   */
  get displayText(): string {
    // Use custom text if provided
    if (this.language === 'ar' && this.textArabic) {
      return this.textArabic;
    }
    if (this.text) {
      return this.text;
    }

    // Use default text for badge type
    const defaults = this.defaultTexts[this.type];
    return this.language === 'ar' ? defaults.ar : defaults.en;
  }

  /**
   * Get full badge text including value
   */
  get fullText(): string {
    if (this.value) {
      return `${this.displayText} ${this.value}`;
    }
    return this.displayText;
  }

  /**
   * Check if badge should show icon
   */
  get showIcon(): boolean {
    return ['unesco', 'artisan', 'featured'].includes(this.type);
  }

  /**
   * Get icon SVG path based on badge type
   */
  get iconPath(): string {
    const icons = {
      unesco: 'M12 2L15 8L21 9L16.5 13.5L18 20L12 17L6 20L7.5 13.5L3 9L9 8L12 2Z', // Star
      artisan: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z', // Handcraft/globe
      featured: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' // Star filled
    };
    return icons[this.type as keyof typeof icons] || '';
  }
}
