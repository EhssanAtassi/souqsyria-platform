import {
  Component,
  input,
  output,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PromoCard } from '../../interfaces/promo-card.interface';

/**
 * PromoCard Component (Presentational)
 *
 * Displays promotional card with 70/30 content/image split layout for hero banner sidebar.
 * This is a dumb component that receives data via inputs and emits events via outputs.
 *
 * Features:
 * - 70% content area (headline, description, badge)
 * - 30% image area (product/category image)
 * - Bilingual support (Arabic RTL / English LTR)
 * - Discount badge overlay
 * - Click tracking via output event
 * - Responsive breakpoints (stacks on mobile)
 * - Golden Wheat theme colors
 *
 * Layout Structure:
 * ```
 * ┌────────────────────────────────────────┐
 * │  70% Content      │  30% Image         │
 * │  - Headline       │  - Product Img     │
 * │  - Description    │  [Badge]           │
 * │  - Theme Color    │                    │
 * └────────────────────────────────────────┘
 * ```
 *
 * Usage:
 * ```html
 * <app-promo-card
 *   [promoCard]="topPromoCard"
 *   [position]="0"
 *   (cardClick)="handlePromoCardClick($event)"
 * />
 * ```
 *
 * @component
 * @standalone
 *
 * @example
 * // In parent component (HeroContainerComponent)
 * export class HeroContainerComponent {
 *   topPromoCard = signal<PromoCard>({
 *     id: 'promo-001',
 *     headline: { english: 'Damascus Steel', arabic: 'الفولاذ الدمشقي' },
 *     description: { english: '20% OFF', arabic: '٪٢٠ خصم' },
 *     image: { url: '...', alt: { english: 'Damascus Steel', arabic: 'فولاذ دمشقي' } },
 *     contentAlignment: 'left',
 *     themeColor: 'golden-wheat',
 *     // ... other properties
 *   });
 *
 *   handlePromoCardClick(event: { promoCardId: string; position: number }) {
 *     console.log('Promo card clicked:', event);
 *     this.analyticsService.trackPromoCardClick(event.promoCardId, event.position);
 *   }
 * }
 *
 * @swagger
 * components:
 *   schemas:
 *     PromoCardComponent:
 *       type: object
 *       description: Presentational component for promotional cards in hero banner
 *       properties:
 *         promoCard:
 *           type: object
 *           description: Promo card data with bilingual content
 *         position:
 *           type: number
 *           description: Card position in sidebar (0=top, 1=bottom)
 */
@Component({
  selector: 'app-promo-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './promo-card.component.html',
  styleUrls: ['./promo-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromoCardComponent {
  /**
   * Promo card data with bilingual content
   * @input
   * @required
   */
  promoCard = input.required<PromoCard>();

  /**
   * Position in sidebar (0=top, 1=bottom)
   * Used for analytics tracking
   * @input
   * @default 0
   */
  position = input<number>(0);

  /**
   * Event emitted when promo card is clicked
   * @output
   * @event cardClick - Emits { promoCardId: string, position: number, targetRoute: string }
   */
  cardClick = output<{
    promoCardId: string;
    position: number;
    targetRoute: string;
  }>();

  /**
   * Allowed CSS color pattern: hex (#abc, #aabbcc, #aabbccdd), rgb/rgba, or named CSS colors
   *
   * @description Pattern to validate CSS color values and prevent XSS injection
   */
  private static readonly SAFE_COLOR_PATTERN = /^(#[0-9A-Fa-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)|[a-z-]+)$/i;

  /**
   * Resolve current display language from localStorage or browser settings
   * Defaults to 'ar' (Arabic) for Syrian marketplace
   *
   * @description Extract to a static method with proper logic to avoid operator precedence bugs
   * @returns 'ar' | 'en' Validated language code
   */
  private static resolveLanguage(): 'ar' | 'en' {
    if (typeof window === 'undefined') return 'ar';
    const stored = localStorage.getItem('language');
    if (stored === 'ar' || stored === 'en') return stored;
    return navigator.language.startsWith('ar') ? 'ar' : 'en';
  }

  /**
   * Current language from localStorage or navigator
   * Defaults to 'ar' (Arabic) for Syrian marketplace
   */
  readonly currentLanguage = PromoCardComponent.resolveLanguage();

  /**
   * Sanitize CSS color value to prevent XSS injection
   * Returns transparent if color is invalid
   *
   * @description Validates color against safe pattern to prevent malicious CSS injection
   * @param color CSS color value to sanitize
   * @returns string Sanitized color or 'transparent' if invalid
   */
  private sanitizeColor(color: string | undefined): string {
    if (!color) return 'transparent';
    return PromoCardComponent.SAFE_COLOR_PATTERN.test(color.trim()) ? color.trim() : 'transparent';
  }

  /**
   * Computed headline in current language
   */
  headline = computed(() => {
    const card = this.promoCard();
    return this.currentLanguage === 'ar'
      ? card.headline.arabic
      : card.headline.english;
  });

  /**
   * Computed description in current language
   */
  description = computed(() => {
    const card = this.promoCard();
    return this.currentLanguage === 'ar'
      ? card.description.arabic
      : card.description.english;
  });

  /**
   * Computed image alt text in current language
   */
  imageAlt = computed(() => {
    const card = this.promoCard();
    return this.currentLanguage === 'ar'
      ? card.image.alt.arabic
      : card.image.alt.english;
  });

  /**
   * Computed badge text in current language (if badge exists)
   */
  badgeText = computed(() => {
    const card = this.promoCard();
    if (!card.badge || !card.badge.visible) return null;
    return this.currentLanguage === 'ar'
      ? card.badge.text.arabic
      : card.badge.text.english;
  });

  /**
   * Computed theme color CSS variable
   */
  themeColorClass = computed(() => {
    const colorMap: { [key: string]: string } = {
      'golden-wheat': 'bg-golden-wheat',
      'forest': 'bg-forest',
      'charcoal': 'bg-charcoal',
      'deep-umber': 'bg-deep-umber',
      'syrian-red': 'bg-syrian-red',
      'syrian-gold': 'bg-syrian-gold'
    };
    return colorMap[this.promoCard().themeColor] || 'bg-golden-wheat';
  });

  /**
   * Computed content order class (for left/right alignment)
   */
  contentOrderClass = computed(() => {
    return this.promoCard().contentAlignment === 'right'
      ? 'flex-row-reverse'
      : 'flex-row';
  });

  /**
   * Computed badge position classes
   */
  badgePositionClass = computed(() => {
    const card = this.promoCard();
    if (!card.badge || !card.badge.visible) return '';

    const positionMap: { [key: string]: string } = {
      'top-left': 'top-2 left-2',
      'top-right': 'top-2 right-2',
      'bottom-left': 'bottom-2 left-2',
      'bottom-right': 'bottom-2 right-2'
    };
    return positionMap[card.badge.position] || 'top-2 right-2';
  });

  /**
   * Handle promo card click event
   * Emits cardClick event with promo card ID, position, and target route
   *
   * @example
   * // In template
   * <a (click)="onCardClick($event)">
   */
  onCardClick(event: Event): void {
    const card = this.promoCard();

    this.cardClick.emit({
      promoCardId: card.id,
      position: this.position(),
      targetRoute: card.targetRoute.target
    });

    console.log(`📊 Promo Card Click: ${card.id} at position ${this.position()}`);
  }

  /**
   * Get badge style object for dynamic background color
   *
   * @description Sanitizes badge colors to prevent XSS injection via malicious CSS
   */
  getBadgeStyle = computed(() => {
    const card = this.promoCard();
    if (!card.badge || !card.badge.visible) return {};

    return {
      'background-color': this.sanitizeColor(card.badge.backgroundColor),
      'color': this.sanitizeColor(card.badge.textColor)
    };
  });

  /**
   * Get router link for navigation
   */
  getRouterLink = computed(() => {
    const card = this.promoCard();
    return card.targetRoute.type === 'external'
      ? null
      : card.targetRoute.target;
  });

  /**
   * Get external URL (if type is external)
   */
  getExternalUrl = computed(() => {
    const card = this.promoCard();
    return card.targetRoute.type === 'external'
      ? card.targetRoute.target
      : null;
  });

  /**
   * Check if route is external
   */
  isExternalRoute = computed(() => {
    return this.promoCard().targetRoute.type === 'external';
  });
}
