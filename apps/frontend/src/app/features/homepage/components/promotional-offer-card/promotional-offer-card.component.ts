import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Promotional Offer Card Interface
 *
 * Large promotional card for hero section sidebar
 * Displays product offer with image, title, and discount badge
 */
export interface PromotionalOffer {
  /** Unique identifier */
  id: number;

  /** Product/offer title (English) */
  title: string;

  /** Product/offer title (Arabic) */
  titleAr: string;

  /** Short description/tagline (English) */
  description: string;

  /** Short description/tagline (Arabic) */
  descriptionAr: string;

  /** Full-bleed background image URL */
  image: string;

  /** Discount badge text (e.g., "20%\nOFF") */
  discountBadge: string;

  /** Badge background color (hex) */
  badgeColor: string;

  /** Target URL for navigation */
  targetUrl: string;

  /** Image position preference */
  imagePosition?: 'center' | 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Promotional Offer Card Component (Presentational)
 *
 * Large clickable card displaying promotional offer with:
 * - Full-bleed product image background
 * - Title + description overlay
 * - Circular discount badge (top-right)
 * - Hover effects
 *
 * Usage:
 * ```html
 * <app-promotional-offer-card
 *   [offer]="topOffer"
 * />
 * ```
 *
 * @component
 * @standalone
 */
@Component({
  selector: 'app-promotional-offer-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './promotional-offer-card.component.html',
  styleUrl: './promotional-offer-card.component.scss'
})
export class PromotionalOfferCardComponent {
  /**
   * Promotional offer data
   * @input
   */
  offer = input.required<PromotionalOffer>();

  /**
   * Get background image style
   * @returns CSS background-image property
   */
  getBackgroundStyle(): { [key: string]: string } {
    const offer = this.offer();
    const position = offer.imagePosition || 'center';

    return {
      'background-image': `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%), url('${offer.image}')`,
      'background-position': position,
      'background-size': 'cover',
      'background-repeat': 'no-repeat'
    };
  }

  /**
   * Get badge style
   * @returns CSS style object for discount badge
   */
  getBadgeStyle(): { [key: string]: string } {
    return {
      'background-color': this.offer().badgeColor
    };
  }

  /**
   * Format discount badge text for display
   * Converts "20%\nOFF" to proper line breaks
   */
  getBadgeLines(): string[] {
    return this.offer().discountBadge.split('\n');
  }
}
