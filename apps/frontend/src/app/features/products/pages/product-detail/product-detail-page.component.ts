/**
 * @file product-detail-page.component.ts
 * @description Product detail page component displaying full product information
 * Includes image gallery, pricing, variants, descriptions, specifications, and related products
 *
 * @swagger
 * tags:
 *   - name: ProductDetailPage
 *     description: Product detail view with gallery, variants, and related products
 */
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml, SecurityContext } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../../services/product.service';
import { LanguageService } from '../../../../shared/services/language.service';
import {
  ProductDetailResponse,
  ProductDetailVariant,
  ProductDetailRelated,
} from '../../models/product-detail.interface';
import { ProductListItem } from '../../models/product-list.interface';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { VariantSelectorComponent } from '../../components/variant-selector/variant-selector.component';
import { SpecificationsTableComponent } from '../../components/specifications-table/specifications-table.component';

/**
 * @description Product detail page component
 * Displays comprehensive product information with image gallery, variants, and related products
 */
@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTabsModule,
    MatDividerModule,
    CurrencyPipe,
    ProductCardComponent,
    VariantSelectorComponent,
    SpecificationsTableComponent,
  ],
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly languageService = inject(LanguageService);
  private readonly sanitizer = inject(DomSanitizer);

  /** Current UI language from shared LanguageService */
  readonly language = this.languageService.language;

  /** Product detail data from API */
  product = signal<ProductDetailResponse | null>(null);

  /** Loading state while API request is in flight */
  loading = signal(true);

  /** Error message when API call fails */
  error = signal<string | null>(null);

  /** Currently selected variant */
  selectedVariant = signal<ProductDetailVariant | null>(null);

  /** Currently selected image index */
  selectedImageIndex = signal(0);

  /** Selected quantity for add to cart */
  quantity = signal(1);

  /** @description Computed product name based on language */
  productName = computed(() => {
    const p = this.product();
    if (!p) return '';
    return this.language() === 'ar' ? p.nameAr : p.nameEn;
  });

  /** @description Computed category name based on language */
  categoryName = computed(() => {
    const p = this.product();
    if (!p?.category) return null;
    return this.language() === 'ar' ? p.category.nameAr : p.category.nameEn;
  });

  /** @description Currently displayed image */
  currentImage = computed(() => {
    const p = this.product();
    if (!p || p.images.length === 0) return null;
    return p.images[this.selectedImageIndex()];
  });

  /** @description Formatted base price with currency */
  formattedBasePrice = computed(() => {
    const p = this.product();
    if (!p?.pricing) return null;
    return this.formatPrice(p.pricing.basePrice);
  });

  /** @description Formatted discount price with currency */
  formattedDiscountPrice = computed(() => {
    const p = this.product();
    if (!p?.pricing?.discountPrice) return null;
    return this.formatPrice(p.pricing.discountPrice);
  });

  /** @description Whether product has a discount */
  hasDiscount = computed(() => {
    const p = this.product();
    return !!(p?.pricing?.discountPrice && p.pricing.discountPrice < p.pricing.basePrice);
  });

  /** @description Product description for current language */
  descriptionForLang = computed(() => {
    const p = this.product();
    if (!p) return null;
    const lang = this.language();
    return p.descriptions.find(d => d.language === lang);
  });

  /** @description Sanitized full description HTML for rendering
   * Note: Assumes fullDescription contains trusted content from backend.
   * Uses SecurityContext.HTML to allow formatting tags while preventing XSS.
   */
  sanitizedDescription = computed((): SafeHtml | null => {
    const desc = this.descriptionForLang();
    if (!desc?.fullDescription) return null;
    return this.sanitizer.sanitize(SecurityContext.HTML, desc.fullDescription) || null;
  });

  /** @description Stock status label */
  stockLabel = computed(() => {
    const p = this.product();
    if (!p) return '';
    const status = p.stockStatus;
    const lang = this.language();

    if (lang === 'ar') {
      if (status === 'in_stock') return 'متوفر';
      if (status === 'low_stock') return 'مخزون منخفض';
      return 'غير متوفر';
    }

    if (status === 'in_stock') return 'In Stock';
    if (status === 'low_stock') return 'Low Stock';
    return 'Out of Stock';
  });

  /** @description Stock status CSS class */
  stockClass = computed(() => {
    const p = this.product();
    if (!p) return '';
    return `stock-badge--${p.stockStatus.replace('_', '-')}`;
  });

  /** @description Related products mapped to ProductListItem format */
  relatedProductItems = computed(() => {
    const p = this.product();
    if (!p) return [];
    return p.relatedProducts.map(rp => this.mapRelatedToListItem(rp));
  });

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = params['productSlug'];
        if (slug) {
          this.loadProduct(slug);
        }
      });
  }

  /**
   * @description Loads product detail from API by slug
   * @param slug - Product URL slug
   */
  private loadProduct(slug: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService
      .getProductBySlug(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.product.set(response);
          this.loading.set(false);

          // Auto-select first variant if available
          if (response.variants.length > 0) {
            this.selectedVariant.set(response.variants[0]);
          }
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            (this.language() === 'ar'
              ? 'فشل تحميل تفاصيل المنتج'
              : 'Failed to load product details');
          this.error.set(message);
          this.loading.set(false);
        },
      });
  }

  /**
   * @description Handles variant selection from variant selector
   * @param variant - Selected variant
   */
  onVariantSelect(variant: ProductDetailVariant): void {
    this.selectedVariant.set(variant);
  }

  /**
   * @description Handles image thumbnail click
   * @param index - Image index to display
   */
  onImageSelect(index: number): void {
    this.selectedImageIndex.set(index);
  }

  /**
   * @description Updates quantity
   * @param delta - Amount to add/subtract
   */
  onQuantityChange(delta: number): void {
    this.quantity.update(qty => Math.max(1, qty + delta));
  }

  /**
   * @description Placeholder for add to cart action
   */
  onAddToCart(): void {
    // TODO: Integrate with cart service in a later story
    // Intentionally left blank to avoid noisy console logging in production
  }

  /**
   * @description Placeholder for add to wishlist action
   */
  onAddToWishlist(): void {
    // TODO: Integrate with wishlist service in a later story
    // Intentionally left blank to avoid noisy console logging in production
  }

  /**
   * @description Formats price with currency
   * @param price - Raw price value
   * @returns Formatted price string
   */
  formatPrice(price: number): string {
    const p = this.product();
    const currency = p?.pricing?.currency || 'USD';
    return new Intl.NumberFormat(this.language() === 'ar' ? 'ar-SY' : 'en-US', {
      style: 'currency',
      currency,
    }).format(price);
  }

  /**
   * @description Maps ProductDetailRelated to ProductListItem for card component
   * @param related - Related product data
   * @returns ProductListItem compatible object
   */
  private mapRelatedToListItem(related: ProductDetailRelated): ProductListItem {
    return {
      id: related.id,
      slug: related.slug,
      nameEn: related.nameEn,
      nameAr: related.nameAr,
      mainImage: related.mainImage,
      basePrice: related.basePrice,
      discountPrice: related.discountPrice,
      currency: related.currency,
      categoryId: null,
      categoryNameEn: null,
      categoryNameAr: null,
      stockStatus: related.stockStatus,
      rating: 0,
      reviewCount: 0,
    };
  }

  /** @description Retries the product load after an error */
  retryLoad(): void {
    const slug = this.route.snapshot.params['productSlug'];
    if (slug) {
      this.loadProduct(slug);
    }
  }

  /** @description Localized retry button label */
  get retryLabel(): string {
    return this.language() === 'ar' ? 'إعادة المحاولة' : 'Try Again';
  }

  /** @description Localized add to cart button label */
  get addToCartLabel(): string {
    return this.language() === 'ar' ? 'أضف إلى السلة' : 'Add to Cart';
  }

  /** @description Localized add to wishlist button label */
  get addToWishlistLabel(): string {
    return this.language() === 'ar' ? 'أضف إلى المفضلة' : 'Add to Wishlist';
  }

  /** @description Localized description tab label */
  get descriptionTabLabel(): string {
    return this.language() === 'ar' ? 'الوصف' : 'Description';
  }

  /** @description Localized specifications tab label */
  get specificationsTabLabel(): string {
    return this.language() === 'ar' ? 'المواصفات' : 'Specifications';
  }

  /** @description Localized related products heading */
  get relatedProductsHeading(): string {
    return this.language() === 'ar' ? 'منتجات ذات صلة' : 'Related Products';
  }
}
