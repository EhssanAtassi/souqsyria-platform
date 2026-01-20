import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { FeaturedBanner, BannerClickEvent } from '../../interfaces/category-showcase.interface';

/**
 * FeaturedBanner Component
 *
 * Displays a promotional banner with product image, pricing, and call-to-action.
 * Used on the left side of CategoryShowcaseSection (per Figma design).
 *
 * Features:
 * - Large product image display
 * - Original vs discounted price comparison
 * - Discount percentage calculation
 * - "Shop Now" CTA button with Syrian Golden Wheat styling
 * - Bilingual support (Arabic RTL / English LTR)
 * - Responsive design (full width on mobile, 40% on desktop)
 * - Optional badge/label (BEST SELLER, NEW, etc.)
 * - Click event tracking for analytics
 *
 * @example
 * <app-featured-banner
 *   [banner]="featuredBannerData"
 *   [sectionId]="'consumer-electronics'"
 *   (bannerClick)="onBannerClick($event)"
 * />
 *
 * @swagger
 * components:
 *   schemas:
 *     FeaturedBannerComponent:
 *       type: object
 *       properties:
 *         banner:
 *           $ref: '#/components/schemas/FeaturedBanner'
 *         sectionId:
 *           type: string
 *         showDiscount:
 *           type: boolean
 *           default: true
 */
@Component({
  selector: 'app-featured-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule
  ],
  templateUrl: './featured-banner.component.html',
  styleUrl: './featured-banner.component.scss'
})
export class FeaturedBannerComponent {
  /**
   * Featured banner data
   */
  @Input({ required: true }) banner!: FeaturedBanner;

  /**
   * Parent section identifier for analytics tracking
   */
  @Input({ required: true }) sectionId: string = '';

  /**
   * Show discount percentage badge
   */
  @Input() showDiscount: boolean = true;

  /**
   * Show original price (strikethrough)
   */
  @Input() showOriginalPrice: boolean = true;

  /**
   * Event emitted when banner is clicked
   */
  @Output() bannerClick = new EventEmitter<BannerClickEvent>();

  /**
   * Computes discount percentage from prices
   * @returns Discount percentage as number (e.g., 67 for 67% off)
   */
  discountPercentage = computed(() => {
    if (!this.banner || !this.banner.originalPrice || !this.banner.discountedPrice) {
      return 0;
    }

    const original = this.banner.originalPrice;
    const discounted = this.banner.discountedPrice;

    if (original <= discounted) {
      return 0;
    }

    return Math.round(((original - discounted) / original) * 100);
  });

  /**
   * Checks if banner has active discount
   * @returns True if discounted price is less than original price
   */
  hasDiscount = computed(() => {
    return this.banner &&
           this.banner.originalPrice > 0 &&
           this.banner.discountedPrice > 0 &&
           this.banner.discountedPrice < this.banner.originalPrice;
  });

  /**
   * Handles banner click event
   * Emits click event for parent component and analytics tracking
   */
  onBannerClick(): void {
    if (!this.banner) return;

    const clickEvent: BannerClickEvent = {
      bannerId: this.banner.id,
      sectionId: this.sectionId,
      targetUrl: this.banner.ctaLink,
      timestamp: new Date(),
      analytics: {
        source: 'featured_banner',
        medium: 'homepage_section',
        campaign: this.sectionId
      }
    };

    this.bannerClick.emit(clickEvent);
  }

  /**
   * Handles CTA button click event
   * Stops propagation to prevent double-click events
   *
   * @param event - Mouse event
   */
  onCtaClick(event: MouseEvent): void {
    event.stopPropagation();
    this.onBannerClick();
  }

  /**
   * Formats price with currency symbol
   *
   * @param amount - Price amount
   * @param currency - Currency code (USD, SYP, EUR, etc.)
   * @returns Formatted price string
   */
  formatPrice(amount: number, currency: string): string {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'SYP': 'ل.س',
      'EUR': '€',
      'GBP': '£'
    };

    const symbol = currencySymbols[currency] || currency;

    // Format number with commas
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Put symbol before amount for Western currencies, after for Arabic
    return currency === 'SYP' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
  }
}
