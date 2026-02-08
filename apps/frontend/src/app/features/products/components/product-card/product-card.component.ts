import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProductListItem } from '../../models/product-list.interface';

/**
 * @description Product card component for displaying individual product information
 * Presentational component with OnPush change detection for optimal performance
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  /** Product data to display */
  product = input.required<ProductListItem>();

  /** Current UI language */
  language = input<'en' | 'ar'>('en');

  /** Emits when user clicks Add to Cart button */
  addToCart = output<ProductListItem>();

  /** Computed product name based on language */
  productName = computed(() => {
    const lang = this.language();
    const prod = this.product();
    return lang === 'ar' ? prod.nameAr : prod.nameEn;
  });

  /** Computed category name based on language */
  categoryName = computed(() => {
    const lang = this.language();
    const prod = this.product();
    return lang === 'ar' ? prod.categoryNameAr : prod.categoryNameEn;
  });

  /** Computed stock status label */
  stockLabel = computed(() => {
    const lang = this.language();
    const status = this.product().stockStatus;
    const labels = {
      in_stock: { en: 'In Stock', ar: 'متوفر' },
      low_stock: { en: 'Low Stock', ar: 'مخزون قليل' },
      out_of_stock: { en: 'Out of Stock', ar: 'غير متوفر' },
    };
    return labels[status][lang];
  });

  /** Computed stock status CSS class */
  stockClass = computed(() => {
    const status = this.product().stockStatus;
    return `stock-badge--${status}`;
  });

  /** Computed formatted base price */
  formattedBasePrice = computed(() => {
    return this.formatPrice(this.product().basePrice);
  });

  /** Computed formatted discount price */
  formattedDiscountPrice = computed(() => {
    const discountPrice = this.product().discountPrice;
    return discountPrice ? this.formatPrice(discountPrice) : null;
  });

  /** Computed whether product has a discount */
  hasDiscount = computed(() => {
    const prod = this.product();
    return (
      prod.discountPrice !== null && prod.discountPrice !== prod.basePrice
    );
  });

  /** Computed array of star ratings */
  stars = computed(() => {
    const rating = this.product().rating;
    const stars: Array<'star' | 'star_half' | 'star_outline'> = [];

    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push('star');
      } else if (rating >= i - 0.5) {
        stars.push('star_half');
      } else {
        stars.push('star_outline');
      }
    }

    return stars;
  });

  /** Computed no reviews label */
  noReviewsLabel = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? 'لا توجد مراجعات' : 'No reviews';
  });

  /** Computed add to cart button label */
  addToCartLabel = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart';
  });

  /**
   * @description Formats price with thousand separators and currency
   * @param price - Price in smallest currency unit
   * @returns Formatted price string
   */
  private formatPrice(price: number): string {
    const formatted = price.toLocaleString('en-US');
    return `${formatted} ل.س`;
  }

  /**
   * @description Handles image loading errors by setting placeholder
   * @param event - Image error event
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23edebe0" width="400" height="300"/%3E%3C/svg%3E';
  }

  /**
   * @description Handles Add to Cart button click
   */
  onAddToCartClick(): void {
    if (this.product().stockStatus !== 'out_of_stock') {
      this.addToCart.emit(this.product());
    }
  }
}
