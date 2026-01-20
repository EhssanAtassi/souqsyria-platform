import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductOfferCardComponent } from '../product-offer-card/product-offer-card.component';
import { ProductOffer, ProductOfferClickEvent } from '../../interfaces/product-offer.interface';

/**
 * Product Offers Row Component (Container/Smart)
 *
 * Displays a horizontal row of 3 promotional product offer cards.
 * This is a SMART component that handles navigation and event coordination.
 *
 * Features:
 * - Horizontal layout (3 cards side-by-side)
 * - Optional section title
 * - Handles navigation with query params
 * - Emits click events for analytics
 * - Responsive (stacks vertically on mobile)
 * - Bilingual Arabic/English support
 *
 * Usage:
 * ```html
 * <app-product-offers-row
 *   [offers]="weeklyOffers()"
 *   [sectionTitle]="'Hot Deals This Week'"
 *   [sectionTitleAr]="'أفضل العروض هذا الأسبوع'"
 *   (offerClick)="onOfferClick($event)" />
 * ```
 *
 * @component
 * @standalone
 * @swagger
 * components:
 *   schemas:
 *     ProductOffersRowComponent:
 *       type: object
 *       description: Displays horizontal row of product offers
 *       properties:
 *         offers:
 *           type: array
 *           description: Array of 1-6 product offers (recommended 3)
 *           items:
 *             $ref: '#/components/schemas/ProductOffer'
 *         sectionTitle:
 *           type: string
 *           description: Section title in English
 *         sectionTitleAr:
 *           type: string
 *           description: Section title in Arabic
 *         showTitle:
 *           type: boolean
 *           description: Whether to show section title (default true)
 */
@Component({
  selector: 'app-product-offers-row',
  standalone: true,
  imports: [CommonModule, ProductOfferCardComponent],
  templateUrl: './product-offers-row.component.html',
  styleUrl: './product-offers-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductOffersRowComponent {
  /**
   * Array of product offers to display (recommended 3)
   * @input
   */
  offers = input.required<ProductOffer[]>();

  /**
   * Section title (English)
   * @input
   */
  sectionTitle = input<string>('Special Offers');

  /**
   * Section title (Arabic)
   * @input
   */
  sectionTitleAr = input<string>('العروض الخاصة');

  /**
   * Whether to show section title
   * @input
   */
  showTitle = input<boolean>(true);

  /**
   * Background color (default: white)
   * @input
   */
  bgColor = input<string>('#FFFFFF');

  /**
   * Offer click event
   * Emits when user clicks on an offer card
   * @output
   */
  offerClick = output<ProductOfferClickEvent>();

  constructor(private router: Router) {}

  /**
   * Handle offer card click
   * Navigates to target URL with query params and emits event
   */
  onOfferCardClick(event: ProductOfferClickEvent): void {
    const { offer } = event;

    // Emit event for analytics tracking
    this.offerClick.emit(event);

    // Navigate with filter params if provided
    if (offer.targetUrl) {
      if (offer.filterParams && Object.keys(offer.filterParams).length > 0) {
        this.router.navigate([offer.targetUrl], {
          queryParams: offer.filterParams
        });
      } else {
        this.router.navigateByUrl(offer.targetUrl);
      }
    }
  }

  /**
   * Track by offer ID for ngFor performance
   */
  trackByOfferId(index: number, offer: ProductOffer): number {
    return offer.id;
  }
}
