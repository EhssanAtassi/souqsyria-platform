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
  OnDestroy,
  SecurityContext,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../services/product.service';
import { LanguageService } from '../../../../shared/services/language.service';
import { CartApiService } from '../../../../core/api/cart-api.service';
import { WishlistService } from '../../../../shared/services/wishlist.service';
import { Product } from '../../../../shared/interfaces/product.interface';
import {
  ProductDetailResponse,
  ProductDetailVariant,
  ProductDetailRelated,
} from '../../models/product-detail.interface';
import { ProductListItem } from '../../models/product-list.interface';
import { ReviewSummary } from '../../models/review.interface';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { VariantSelectorComponent } from '../../components/variant-selector/variant-selector.component';
import { SpecificationsTableComponent } from '../../components/specifications-table/specifications-table.component';
import { ImageGalleryComponent } from '../../components/image-gallery/image-gallery.component';
import { ReviewSummaryComponent } from '../../components/review-summary/review-summary.component';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { ReviewFormComponent } from '../../components/review-form/review-form.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../shared/components/ui/breadcrumb/breadcrumb.component';
import { JsonLdComponent } from '../../../../shared/components/json-ld/json-ld.component';
import { SeoService } from '../../../../shared/services/seo.service';
import { ShareService } from '../../../../shared/services/share.service';
import { ReviewService } from '../../services/review.service';
import { TokenService } from '../../../auth/services/token.service';
import { ProductRecommendationsService } from '../../../../shared/services/product-recommendations.service';
import { ProductComparisonService } from '../../../../shared/services/product-comparison.service';
import {
  NotifyDialogComponent,
  NotifyDialogData,
} from '../../components/notify-dialog/notify-dialog.component';
import { RecentlyViewedComponent } from '../../../../shared/components/recently-viewed/recently-viewed.component';

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
    MatSnackBarModule,
    TranslateModule,
    ProductCardComponent,
    VariantSelectorComponent,
    SpecificationsTableComponent,
    ImageGalleryComponent,
    ReviewSummaryComponent,
    ReviewListComponent,
    ReviewFormComponent,
    BreadcrumbComponent,
    JsonLdComponent,
    RecentlyViewedComponent,
  ],
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly languageService = inject(LanguageService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cartApiService = inject(CartApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly wishlistService = inject(WishlistService);
  private readonly translateService = inject(TranslateService);
  private readonly seoService = inject(SeoService);
  private readonly shareService = inject(ShareService);
  private readonly reviewService = inject(ReviewService);
  private readonly tokenService = inject(TokenService);
  private readonly dialog = inject(MatDialog);
  private readonly recommendationsService = inject(ProductRecommendationsService);
  private readonly comparisonService = inject(ProductComparisonService);

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

  /** @description Review summary data (from product response or separate fetch) */
  reviewSummary = signal<ReviewSummary | null>(null);

  /** @description Whether user is authenticated */
  isAuthenticated = computed(() => !!this.tokenService.getAccessToken());

  /** @description Whether to show review form */
  showReviewForm = signal(false);

  /** @description Math object for template use */
  readonly Math = Math;

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

  /**
   * @description Stock status label using i18n translation keys
   * Maps product stock status to translation keys and uses TranslateService.instant
   */
  stockLabel = computed(() => {
    const p = this.product();
    if (!p) return '';
    const keyMap: Record<string, string> = {
      in_stock: 'products_stock_in_stock',
      low_stock: 'products_stock_low_stock',
      out_of_stock: 'products_stock_out_of_stock',
    };
    return this.translateService.instant(keyMap[p.stockStatus] || 'products_stock_in_stock');
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

  /** @description Image index matching the selected variant's imageUrl */
  variantImageIndex = computed(() => {
    const variant = this.selectedVariant();
    const p = this.product();
    if (!variant?.imageUrl || !p) return 0;
    const idx = p.images.findIndex(img => img.imageUrl === variant.imageUrl);
    return idx >= 0 ? idx : 0;
  });

  /** @description Effective price: variant price if selected, else product base/discount price */
  effectivePrice = computed(() => {
    const variant = this.selectedVariant();
    const p = this.product();
    if (variant) return variant.price;
    if (!p?.pricing) return null;
    return p.pricing.discountPrice ?? p.pricing.basePrice;
  });

  /** @description Effective stock status reflecting the selected variant */
  effectiveStockStatus = computed((): 'in_stock' | 'low_stock' | 'out_of_stock' | null => {
    const variant = this.selectedVariant();
    const p = this.product();
    if (variant) return variant.stockStatus;
    if (!p) return null;
    return p.stockStatus;
  });

  /** @description Formatted effective price with currency */
  formattedEffectivePrice = computed(() => {
    const price = this.effectivePrice();
    if (price == null) return null;
    return this.formatPrice(price);
  });

  /**
   * @description Effective stock label reflecting selected variant using i18n translation keys
   * Maps effective stock status to translation keys and uses TranslateService.instant
   */
  effectiveStockLabel = computed(() => {
    const status = this.effectiveStockStatus();
    if (!status) return '';
    const keyMap: Record<string, string> = {
      in_stock: 'products_stock_in_stock',
      low_stock: 'products_stock_low_stock',
      out_of_stock: 'products_stock_out_of_stock',
    };
    return this.translateService.instant(keyMap[status] || 'products_stock_in_stock');
  });

  /** @description Effective stock CSS class reflecting selected variant */
  effectiveStockClass = computed(() => {
    const status = this.effectiveStockStatus();
    if (!status) return '';
    return `stock-badge--${status.replace('_', '-')}`;
  });

  /**
   * @description Breadcrumb navigation items built from category ancestor chain.
   * Shows: Products > [ancestor1] > [ancestor2] > [current category] > Product Name
   */
  breadcrumbItems = computed(() => {
    const product = this.product();
    if (!product) return [];

    const items: BreadcrumbItem[] = [
      { label: 'Products', labelArabic: 'المنتجات', url: '/products' }
    ];

    if (product.category) {
      // Add ancestor categories (root → parent) if available
      if (product.category.ancestors?.length) {
        for (const ancestor of product.category.ancestors) {
          items.push({
            label: ancestor.nameEn,
            labelArabic: ancestor.nameAr,
            url: `/category/${ancestor.slug}`
          });
        }
      }

      // Add the direct category
      items.push({
        label: product.category.nameEn,
        labelArabic: product.category.nameAr,
        url: `/category/${product.category.slug}`
      });
    }

    items.push({
      label: product.nameEn,
      labelArabic: product.nameAr
    });

    return items;
  });

  /** @description Whether current product is in wishlist */
  isInWishlist = computed(() => {
    const p = this.product();
    if (!p) return false;
    return this.wishlistService.isInWishlist(String(p.id));
  });

  /** @description Whether current product is in comparison */
  isInComparison = computed(() => {
    const p = this.product();
    if (!p) return false;
    return this.comparisonService.isInComparison(String(p.id));
  });

  /** @description JSON-LD structured data for product */
  productJsonLd = computed(() => {
    const p = this.product();
    if (!p) return null;

    const lang = this.language();
    const productName = lang === 'ar' ? p.nameAr : p.nameEn;
    const description = p.descriptions.find(d => d.language === lang);

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      image: p.images?.[0]?.imageUrl,
      description: description?.shortDescription || description?.fullDescription,
      sku: p.sku,
      brand: p.manufacturer ? {
        '@type': 'Brand',
        name: p.manufacturer.name
      } : undefined,
      offers: {
        '@type': 'Offer',
        price: p.pricing?.discountPrice || p.pricing?.basePrice,
        priceCurrency: p.pricing?.currency || 'SYP',
        availability: p.stockStatus === 'in_stock'
          ? 'https://schema.org/InStock'
          : p.stockStatus === 'low_stock'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/OutOfStock',
      },
    };
  });

  /** @description Current product URL for sharing */
  productUrl = computed(() => {
    const p = this.product();
    if (!p) return '';
    return `${window.location.origin}/products/${p.slug}`;
  });

  /** @description Whether native share is supported */
  isNativeShareSupported = this.shareService.isNativeShareSupported();

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

          // Set review summary if included in response
          if (response.reviewSummary) {
            this.reviewSummary.set(response.reviewSummary);
          } else {
            // Fetch review summary separately
            this.loadReviewSummary(slug);
          }

          // Set SEO meta tags
          this.seoService.setProductMeta(response, this.language());

          // Track product view for recently viewed
          this.trackProductView(response);

          // Track view count on backend (fire-and-forget)
          this.productService.trackView(slug);
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
   * @description Handles image change from the ImageGalleryComponent
   * @param index - New image index
   */
  onGalleryImageChange(index: number): void {
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
  /**
   * @description Adds selected variant + quantity to cart via backend API.
   * Shows snackbar with "View Cart" action on success.
   */
  onAddToCart(): void {
    const variant = this.selectedVariant();
    if (!variant) return;

    const qty = this.quantity();
    this.cartApiService.addToCart(String(variant.id), qty)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const name = this.productName();
          const message = this.language() === 'ar'
            ? `تمت إضافة ${name} إلى السلة`
            : `${name} added to cart`;
          const action = this.language() === 'ar' ? 'عرض السلة' : 'View Cart';

          const ref = this.snackBar.open(message, action, {
            duration: 4000,
            panelClass: 'success-snackbar',
          });

          ref.onAction().subscribe(() => {
            this.router.navigate(['/cart']);
          });
        },
        error: (err) => {
          const message = err?.error?.message
            || (this.language() === 'ar' ? 'فشل إضافة المنتج' : 'Failed to add to cart');
          this.snackBar.open(message, '✕', {
            duration: 4000,
            panelClass: 'error-snackbar',
          });
        },
      });
  }

  /**
   * @description Adds or removes product from wishlist and shows snackbar notification
   */
  onAddToWishlist(): void {
    const p = this.product();
    if (!p) return;

    // Map ProductDetailResponse to Product interface shape
    const mappedProduct: Product = {
      id: String(p.id),
      name: p.nameEn,
      nameArabic: p.nameAr,
      slug: p.slug,
      description: p.descriptions.find(d => d.language === 'en')?.shortDescription || '',
      descriptionArabic: p.descriptions.find(d => d.language === 'ar')?.shortDescription,
      price: {
        amount: p.pricing.basePrice,
        currency: p.pricing.currency || 'SYP',
        originalPrice: p.pricing.discountPrice ? p.pricing.basePrice : undefined,
      },
      category: {
        id: String(p.category?.id || ''),
        name: p.category?.nameEn || '',
        nameArabic: p.category?.nameAr,
        slug: p.category?.slug || '',
        breadcrumb: [],
      },
      images: p.images.map((img, idx) => ({
        id: String(img.id),
        url: img.imageUrl,
        alt: img.altText || p.nameEn,
        isPrimary: idx === 0,
        order: img.sortOrder,
      })),
      specifications: {} as any,
      seller: {} as any,
      shipping: {} as any,
      authenticity: { certified: false, heritage: 'modern', badges: [] },
      inventory: { inStock: p.stockStatus === 'in_stock', quantity: 0, minOrderQuantity: 1, status: p.stockStatus, lowStockThreshold: 10 },
      reviews: { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      timestamps: { created: new Date(), updated: new Date() },
    };

    const wasAdded = this.wishlistService.toggleWishlist(mappedProduct);

    const productName = this.language() === 'ar' ? p.nameAr : p.nameEn;
    const message = this.language() === 'ar'
      ? (wasAdded ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة')
      : (wasAdded ? 'Added to wishlist' : 'Removed from wishlist');

    this.snackBar.open(`${message}`, '✓', {
      duration: 3000,
      panelClass: wasAdded ? 'success-snackbar' : 'info-snackbar',
    });
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

  /**
   * @description Opens stock notification dialog
   * Allows users to subscribe to email notifications when product is back in stock
   */
  onNotifyMe(): void {
    const p = this.product();
    if (!p) return;

    const variant = this.selectedVariant();
    // Build variant name from variantData attributes
    const variantName = variant
      ? Object.entries(variant.variantData)
          .map(([key, value]) => value)
          .join(' - ')
      : undefined;

    // Get user email if authenticated
    const userEmail = this.tokenService.getAccessToken()
      ? undefined // In real app, would fetch from user service
      : undefined;

    const dialogData: NotifyDialogData = {
      productId: p.id,
      productName: this.productName(),
      variantId: variant?.id,
      variantName,
      userEmail,
    };

    this.dialog.open(NotifyDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData,
      autoFocus: true,
      restoreFocus: true,
    });
  }

  /**
   * @description Share product using native share API
   */
  async onShareNative(): Promise<void> {
    const p = this.product();
    if (!p) return;

    const productName = this.language() === 'ar' ? p.nameAr : p.nameEn;
    const result = await this.shareService.shareNative({
      title: `${productName} - SouqSyria`,
      text: this.language() === 'ar'
        ? `شاهد هذا المنتج السوري الأصيل: ${productName}`
        : `Check out this authentic Syrian product: ${productName}`,
      url: this.productUrl(),
    });

    if (result.method === 'clipboard') {
      const message = this.language() === 'ar'
        ? 'تم نسخ الرابط'
        : 'Link copied to clipboard';
      this.snackBar.open(message, '✓', { duration: 3000 });
    }
  }

  /**
   * @description Share product on WhatsApp
   */
  onShareWhatsApp(): void {
    const p = this.product();
    if (!p) return;

    const productName = this.language() === 'ar' ? p.nameAr : p.nameEn;
    const text = this.language() === 'ar'
      ? `شاهد هذا المنتج من سوق سوريا: ${productName}`
      : `Check out this product from SouqSyria: ${productName}`;

    this.shareService.shareOnWhatsApp(this.productUrl(), text);
  }

  /**
   * @description Share product on Facebook
   */
  onShareFacebook(): void {
    const p = this.product();
    if (!p) return;

    const productName = this.language() === 'ar' ? p.nameAr : p.nameEn;
    this.shareService.shareOnFacebook(this.productUrl(), productName);
  }

  /**
   * @description Share product on Twitter
   */
  onShareTwitter(): void {
    const p = this.product();
    if (!p) return;

    const productName = this.language() === 'ar' ? p.nameAr : p.nameEn;
    const text = this.language() === 'ar'
      ? `${productName} - منتج سوري أصيل من سوق سوريا`
      : `${productName} - Authentic Syrian product from SouqSyria`;

    this.shareService.shareOnTwitter(this.productUrl(), text, ['SyrianProducts', 'Handmade']);
  }

  /**
   * @description Copy product link to clipboard
   */
  async onCopyLink(): Promise<void> {
    const success = await this.shareService.copyToClipboard(this.productUrl());

    const message = this.language() === 'ar'
      ? (success ? 'تم نسخ الرابط' : 'فشل نسخ الرابط')
      : (success ? 'Link copied to clipboard' : 'Failed to copy link');

    this.snackBar.open(message, '✓', {
      duration: 3000,
      panelClass: success ? 'success-snackbar' : 'error-snackbar',
    });
  }

  /**
   * @description Loads review summary for the product
   * @param slug - Product slug
   */
  private loadReviewSummary(slug: string): void {
    this.reviewService
      .getReviewSummary(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.reviewSummary.set(summary);
        },
        error: (err) => {
          console.error('Failed to load review summary:', err);
          // Silently fail - reviews are optional
        },
      });
  }

  /**
   * @description Handles write review button click
   * Opens the review form
   */
  onWriteReview(): void {
    this.showReviewForm.set(true);
  }

  /**
   * @description Handles review submission success
   * Closes form and reloads review summary
   */
  onReviewSubmitted(): void {
    this.showReviewForm.set(false);
    const p = this.product();
    if (p) {
      this.loadReviewSummary(p.slug);
    }
  }

  /** @description Localized reviews tab label */
  get reviewsTabLabel(): string {
    const count = this.reviewSummary()?.totalReviews || 0;
    const base = this.language() === 'ar' ? 'المراجعات' : 'Reviews';
    return count > 0 ? `${base} (${count})` : base;
  }

  /**
   * @description Adds or removes product from comparison
   */
  onAddToComparison(): void {
    const p = this.product();
    if (!p) return;

    // Map ProductDetailResponse to Product interface
    const mappedProduct: Product = this.mapToProduct(p);

    const result = this.comparisonService.addProduct(mappedProduct);

    const message = result.success
      ? this.language() === 'ar'
        ? 'تمت الإضافة للمقارنة'
        : 'Added to comparison'
      : this.language() === 'ar'
      ? result.message
      : result.message;

    this.snackBar.open(message, '✓', {
      duration: 3000,
      panelClass: result.success ? 'success-snackbar' : 'info-snackbar',
    });
  }

  /**
   * @description Maps ProductDetailResponse to Product interface
   * Helper method to convert API response to Product interface format
   * @param response - Product detail response
   * @returns Mapped Product object
   */
  private mapToProduct(response: ProductDetailResponse): Product {
    return {
      id: String(response.id),
      name: response.nameEn,
      nameArabic: response.nameAr,
      slug: response.slug,
      description: response.descriptions.find(d => d.language === 'en')?.shortDescription || '',
      descriptionArabic: response.descriptions.find(d => d.language === 'ar')?.shortDescription,
      price: {
        amount: response.pricing.discountPrice || response.pricing.basePrice,
        currency: response.pricing.currency || 'SYP',
        originalPrice: response.pricing.discountPrice ? response.pricing.basePrice : undefined,
      },
      category: {
        id: String(response.category?.id || ''),
        name: response.category?.nameEn || '',
        nameArabic: response.category?.nameAr,
        slug: response.category?.slug || '',
        breadcrumb: [],
      },
      images: response.images.map((img, idx) => ({
        id: String(img.id),
        url: img.imageUrl,
        alt: img.altText || response.nameEn,
        isPrimary: idx === 0,
        order: img.sortOrder,
      })),
      specifications: {} as any,
      seller: {} as any,
      shipping: {} as any,
      authenticity: { certified: false, heritage: 'modern', badges: [] },
      inventory: {
        inStock: response.stockStatus === 'in_stock',
        quantity: 0,
        minOrderQuantity: 1,
        status: response.stockStatus,
        lowStockThreshold: 10,
      },
      reviews: { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      timestamps: { created: new Date(), updated: new Date() },
    };
  }

  /**
   * @description Track product view for recently viewed list
   * Converts ProductDetailResponse to Product interface format
   * @param response - Product detail response
   */
  private trackProductView(response: ProductDetailResponse): void {
    const product = this.mapToProduct(response);
    this.recommendationsService.trackProductView(product);
  }

  /** @description Computed current price aria label (bilingual) */
  currentPriceAriaLabel = computed(() => {
    const lang = this.language();
    const price = this.selectedVariant()
      ? this.formattedEffectivePrice()
      : this.hasDiscount()
      ? this.formattedDiscountPrice()
      : this.formattedBasePrice();
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
    const summary = this.reviewSummary();
    if (!summary) return '';
    const lang = this.language();
    const rating = summary.averageRating;
    const reviewCount = summary.totalReviews;
    if (lang === 'ar') {
      return `${rating.toFixed(1)} من 5 نجوم، ${reviewCount} مراجعة`;
    } else {
      return `${rating.toFixed(1)} out of 5 stars, ${reviewCount} reviews`;
    }
  });

  /**
   * @description Clean up SEO meta tags on component destroy
   */
  ngOnDestroy(): void {
    this.seoService.clearMeta();
  }
}
