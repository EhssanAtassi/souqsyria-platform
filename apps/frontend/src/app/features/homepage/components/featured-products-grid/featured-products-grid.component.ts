import {
  Component,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Featured Product interface
 */
export interface FeaturedProduct {
  id: number;
  name: string;
  nameAr: string;
  image: string;
  price: number;
  badge?: string;
  slug: string;
}

/**
 * Featured Products Grid Component
 *
 * Displays a compact grid of featured products with:
 * - Product image with badge overlay
 * - Product name (English + Arabic)
 * - Formatted price in SYP
 * - Click navigation to product detail page
 *
 * @Input products - Array of featured products to display
 */
@Component({
  selector: 'app-featured-products-grid',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './featured-products-grid.component.html',
  styleUrl: './featured-products-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturedProductsGridComponent {
  // Input: Featured products from parent
  products = input<FeaturedProduct[]>([]);

  /**
   * Format price with thousand separators
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US').format(price);
  }
}
