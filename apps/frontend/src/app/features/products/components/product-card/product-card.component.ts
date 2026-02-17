import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ProductListItem } from '../../models/product-list.interface';

/**
 * @description Product card component for displaying individual product information
 * Presentational component with OnPush change detection for optimal performance
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, TranslateModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  private readonly translateService = inject(TranslateService);
  /** Product data to display */
  product = input.required<ProductListItem>();

  /** Current UI language */
  language = input<'en' | 'ar'>('en');

  /** Whether product is in wishlist */
  isWishlisted = input<boolean>(false);

  /** @description Whether this card's image should load eagerly (for above-the-fold cards) */
  priority = input<boolean>(false);

  /** @description Whether product is in comparison */
  isInComparison = input<boolean>(false);

  /** Emits when user clicks Add to Cart button */
  addToCart = output<ProductListItem>();

  /** Emits when user clicks Add to Wishlist button */
  addToWishlist = output<ProductListItem>();

  /** @description Emits when user clicks Compare button */
  compare = output<ProductListItem>();

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

  /**
   * @description Computed stock status label using i18n translation keys
   * Maps stock status to translation keys and uses TranslateService.instant for real-time translation
   */
  stockLabel = computed(() => {
    const status = this.product().stockStatus;
    const keyMap: Record<string, string> = {
      in_stock: 'products_stock_in_stock',
      low_stock: 'products_stock_low_stock',
      out_of_stock: 'products_stock_out_of_stock',
    };
    return this.translateService.instant(keyMap[status] || 'products_stock_in_stock');
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

  /** @description Computed wishlist icon based on wishlist state */
  wishlistIcon = computed(() => {
    return this.isWishlisted() ? 'favorite' : 'favorite_border';
  });

  /** @description Computed wishlist button aria label (bilingual) */
  wishlistLabel = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? 'أضف إلى المفضلة' : 'Add to Wishlist';
  });

  /**
   * @description Formats price with thousand separators and currency.
   * Uses Arabic-Indic numerals (٢,٥٠٠,٠٠٠) when in Arabic mode.
   * @param price - Price in smallest currency unit
   * @returns Formatted price string with SYP currency symbol
   */
  private formatPrice(price: number): string {
    const locale = this.language() === 'ar' ? 'ar-SY' : 'en-US';
    const formatted = price.toLocaleString(locale);
    return `${formatted}\u00A0ل.س`;
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

  /**
   * @description Handles Add to Wishlist button click
   */
  onAddToWishlistClick(): void {
    this.addToWishlist.emit(this.product());
  }

  /**
   * @description Handles Compare button click
   */
  onCompareClick(): void {
    this.compare.emit(this.product());
  }

  /** @description Computed compare icon based on comparison state */
  compareIcon = computed(() => {
    return this.isInComparison() ? 'compare' : 'compare_arrows';
  });

  /** @description Computed compare button aria label (bilingual) */
  compareLabel = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? 'قارن المنتج' : 'Compare Product';
  });

  /** @description Computed current price aria label (bilingual) */
  currentPriceAriaLabel = computed(() => {
    const lang = this.language();
    const price = this.hasDiscount() ? this.formattedDiscountPrice() : this.formattedBasePrice();
    return lang === 'ar' ? `السعر الحالي: ${price}` : `Current price: ${price}`;
  });

  /** @description Computed original price aria label (bilingual) */
  originalPriceAriaLabel = computed(() => {
    const lang = this.language();
    const price = this.formattedBasePrice();
    return lang === 'ar' ? `السعر الأصلي: ${price}` : `Original price: ${price}`;
  });

  /** @description Computed rating aria label for screen readers (bilingual) */
  ratingAriaLabel = computed(() => {
    const lang = this.language();
    const rating = this.product().rating;
    const reviewCount = this.product().reviewCount;
    if (lang === 'ar') {
      return `${rating} من 5 نجوم، ${reviewCount} تقييم`;
    } else {
      return `${rating} out of 5 stars, ${reviewCount} reviews`;
    }
  });
}
