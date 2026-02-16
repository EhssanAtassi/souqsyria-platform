/**
 * @file product-list-page.component.ts
 * @description Smart component that orchestrates product browsing with server-side pagination.
 * Reads page/limit/sort from URL query params, calls ProductService, and renders
 * product cards in a responsive grid with loading/error/empty states.
 *
 * @swagger
 * tags:
 *   - name: ProductListPage
 *     description: Main product catalog browsing page with server-side pagination
 */
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ProductListItem,
  ProductListMeta,
} from '../../models/product-list.interface';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductService } from '../../services/product.service';
import { LanguageService } from '../../../../shared/services/language.service';
import { CartService } from '../../../../store/cart/cart.service';
import { WishlistService } from '../../../../shared/services/wishlist.service';
import { Product } from '../../../../shared/interfaces/product.interface';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductSkeletonComponent } from '../../components/product-skeleton/product-skeleton.component';
import { ProductsPaginationComponent } from '../../components/pagination/products-pagination.component';
import { FilterSidebarComponent } from '../../../../shared/components/filter-sidebar/filter-sidebar.component';
import { FilterState } from '../../../../shared/components/filter-sidebar/filter-sidebar.component';
import { SeoService } from '../../../../shared/services/seo.service';

/**
 * @description Product listing page component.
 * Orchestrates server-side pagination by syncing URL query params with API calls.
 * Uses Angular signals for reactive state management and OnPush for performance.
 */
@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    ProductCardComponent,
    ProductSkeletonComponent,
    ProductsPaginationComponent,
    FilterSidebarComponent,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './product-list-page.component.html',
  styleUrls: ['./product-list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListPageComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly languageService = inject(LanguageService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translateService = inject(TranslateService);
  private readonly wishlistService = inject(WishlistService);
  private readonly seoService = inject(SeoService);

  /** Product list items from API */
  products = signal<ProductListItem[]>([]);

  /** Pagination metadata from API */
  meta = signal<ProductListMeta | null>(null);

  /** Loading state while API request is in flight */
  loading = signal(true);

  /** Error message when API call fails */
  error = signal<string | null>(null);

  /** View mode toggle (grid or list) */
  viewMode = signal<'grid' | 'list'>('grid');

  /** Current UI language from shared LanguageService */
  readonly language = this.languageService.language;

  /** Query params as a signal for reactive computations */
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  /** Current sort option synced from URL */
  sortBy = signal<string>('newest');

  /** Current page number synced from URL */
  currentPage = signal(1);

  /** Current items per page synced from URL */
  currentLimit = signal(20);

  /** Available sort options with bilingual labels */
  readonly sortOptions = [
    { value: 'price_asc', labelEn: 'Price: Low to High', labelAr: 'السعر: من الأقل إلى الأعلى' },
    { value: 'price_desc', labelEn: 'Price: High to Low', labelAr: 'السعر: من الأعلى إلى الأقل' },
    { value: 'newest', labelEn: 'Newest', labelAr: 'الأحدث' },
    { value: 'rating', labelEn: 'Rating', labelAr: 'التقييم' },
    { value: 'popularity', labelEn: 'Most Popular', labelAr: 'الأكثر شعبية' },
  ];

  /** Active filters from sidebar */
  activeFilters = signal<FilterState>({});

  /** Sidebar open state for mobile */
  sidebarOpen = signal(false);

  /** Number of skeleton cards matches current page limit for consistent layout */
  readonly skeletonCount = computed(() => this.currentLimit());

  constructor() {
    // Restore view mode preference from localStorage
    try {
      const savedViewMode = localStorage.getItem('productViewMode') as 'grid' | 'list';
      if (savedViewMode) {
        this.viewMode.set(savedViewMode);
      }
    } catch (error) {
      // localStorage unavailable (Safari private mode, etc.)
      console.warn('Failed to restore view mode from localStorage:', error);
    }

    // Persist view mode changes to localStorage
    effect(() => {
      try {
        localStorage.setItem('productViewMode', this.viewMode());
      } catch (error) {
        // localStorage unavailable
        console.warn('Failed to save view mode to localStorage:', error);
      }
    });
  }

  /**
   * @description Subscribes to URL query params to drive pagination and filters.
   * Every time query params change (page, limit, sort, filters), a new API call fires.
   */
  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const page = Number(params['page']) || 1;
        const limit = Number(params['limit']) || 20;
        const sortBy = params['sortBy'] || 'newest';
        const categoryId = params['categoryId'] ? Number(params['categoryId']) : undefined;
        const minPrice = params['minPrice'] ? Number(params['minPrice']) : undefined;
        const maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : undefined;
        const search = params['search'] || undefined;
        const brandIds = params['brandIds'] || undefined;

        this.currentPage.set(page);
        this.currentLimit.set(limit);
        this.sortBy.set(sortBy);

        // Update activeFilters from URL
        const filters: FilterState = {};
        if (minPrice !== undefined || maxPrice !== undefined) {
          filters.priceRange = {
            min: minPrice || 0,
            max: maxPrice || 999999
          };
        }
        if (brandIds) {
          filters.brandIds = brandIds;
        }
        if (categoryId) {
          filters.categoryIds = [categoryId];
        }
        this.activeFilters.set(filters);

        this.loadProducts(page, limit, sortBy, categoryId, minPrice, maxPrice, search, brandIds);
      });
  }

  /**
   * @description Fetches products from the API with current pagination and filter state
   * @param page - Page number to fetch
   * @param limit - Items per page
   * @param sortBy - Sort order key
   * @param categoryId - Optional category filter
   * @param minPrice - Optional minimum price filter
   * @param maxPrice - Optional maximum price filter
   * @param search - Optional search term
   */
  loadProducts(
    page: number,
    limit: number,
    sortBy?: string,
    categoryId?: number,
    minPrice?: number,
    maxPrice?: number,
    search?: string,
    brandIds?: string
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService
      .getProducts({
        page,
        limit,
        sortBy: sortBy || this.sortBy(),
        categoryId,
        minPrice,
        maxPrice,
        search,
        brandIds,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);

          // Set SEO meta tags
          this.seoService.setProductListMeta({
            categoryName: categoryId ? `Category #${categoryId}` : undefined,
            searchQuery: search,
            page,
            language: this.language(),
          });
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            this.translateService.instant('products_error_loading');
          this.error.set(message);
          this.loading.set(false);
        },
      });
  }

  /**
   * @description Handles page change from pagination component.
   * Navigates to new URL with updated page param, which triggers queryParams subscription.
   * @param page - New page number
   */
  onPageChange(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * @description Handles items-per-page change from pagination component.
   * Resets to page 1 when limit changes to avoid stale page references.
   * @param limit - New items per page
   */
  onLimitChange(limit: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1, limit },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * @description Handles sort dropdown change.
   * Keeps current page but updates sort param in URL.
   * @param sortBy - New sort option value
   */
  onSortChange(sortBy: string): void {
    this.sortBy.set(sortBy);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy: sortBy, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * @description Handles Add to Cart event from product card.
   * Placeholder for cart service integration.
   * @param product - Product to add to cart
   */
  /**
   * @description Adds a product to cart and shows snackbar with "View Cart" action
   * @param product - Product to add to cart
   */
  onAddToCart(product: ProductListItem): void {
    this.cartService.addToCart(String(product.id), 1);

    const productName = this.language() === 'ar' ? product.nameAr : product.nameEn;
    const message = this.language() === 'ar'
      ? `تمت إضافة ${productName} إلى السلة`
      : `${productName} added to cart`;
    const action = this.language() === 'ar' ? 'عرض السلة' : 'View Cart';

    const ref = this.snackBar.open(message, action, {
      duration: 4000,
      panelClass: 'success-snackbar',
    });

    ref.onAction().subscribe(() => {
      this.router.navigate(['/cart']);
    });
  }

  /** @description Toggles between grid and list view modes */
  toggleViewMode(): void {
    this.viewMode.update((mode) => (mode === 'grid' ? 'list' : 'grid'));
  }

  /** @description Retries the last API call after an error */
  retryLoad(): void {
    const params = this.route.snapshot.queryParams;
    this.loadProducts(
      this.currentPage(),
      this.currentLimit(),
      this.sortBy(),
      params['categoryId'] ? Number(params['categoryId']) : undefined,
      params['minPrice'] ? Number(params['minPrice']) : undefined,
      params['maxPrice'] ? Number(params['maxPrice']) : undefined,
      params['search'],
      params['brandIds']
    );
  }

  /**
   * @description Handles filter changes from sidebar
   * Extracts price range and updates URL params
   * @param filters - New filter state from sidebar
   */
  onFiltersChange(filters: FilterState): void {
    const queryParams: any = { page: 1 }; // Reset to page 1 on filter change

    if (filters.priceRange) {
      queryParams.minPrice = filters.priceRange.min;
      queryParams.maxPrice = filters.priceRange.max;
    } else {
      // Explicitly clear price params when filter is removed
      queryParams.minPrice = null;
      queryParams.maxPrice = null;
    }

    if (filters.brandIds) {
      queryParams.brandIds = filters.brandIds;
    } else {
      queryParams.brandIds = null;
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      // Use first selected category for URL
      queryParams.categoryId = filters.categoryIds[0];
    } else {
      queryParams.categoryId = null;
    }

    // Preserve existing search from URL
    const currentParams = this.route.snapshot.queryParams;
    if (currentParams['search']) {
      queryParams.search = currentParams['search'];
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * @description Clears all active filters
   * Removes filter params from URL
   */
  onClearFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        minPrice: null,
        maxPrice: null,
        categoryId: null,
        search: null,
        brandIds: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  /** @description Toggles sidebar visibility for mobile */
  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  /**
   * @description Gets localized sort option label
   * @param option - Sort option object
   * @returns Localized label string
   */
  getSortLabel(option: (typeof this.sortOptions)[0]): string {
    return this.language() === 'ar' ? option.labelAr : option.labelEn;
  }

  /** @description Page title from i18n translation */
  get pageTitle(): string {
    return this.translateService.instant('products_page_title');
  }

  /** @description Aria label for view mode toggle button from i18n */
  get viewModeLabel(): string {
    const mode = this.viewMode() === 'grid' ? 'list' : 'grid';
    return this.translateService.instant(mode === 'grid' ? 'products_view_grid' : 'products_view_list');
  }

  /** @description Localized retry button label from i18n */
  get retryLabel(): string {
    return this.translateService.instant('products_retry');
  }

  /** @description Localized empty state message from i18n */
  get emptyMessage(): string {
    return this.translateService.instant('products_empty');
  }

  /** @description Localized browse all button label from i18n */
  get browseAllLabel(): string {
    return this.translateService.instant('products_browse_all');
  }

  /** @description Localized sort dropdown label from i18n */
  get sortLabel(): string {
    return this.translateService.instant('products_sort_by');
  }

  /** @description Array of skeleton card indices for ngFor */
  get skeletonArray(): number[] {
    return Array(this.skeletonCount()).fill(0);
  }

  /**
   * @description Whether any filters are active
   */
  hasActiveFilters = computed(() => {
    const params = this.queryParams();
    return !!(params['categoryId'] || params['minPrice'] || params['maxPrice'] || params['search'] || params['brandIds']);
  });

  /**
   * @description Active category filter label
   */
  activeFilterCategory = computed(() => {
    const params = this.queryParams();
    return params['categoryId'] ? `#${params['categoryId']}` : null;
  });

  /**
   * @description Active price range label
   */
  activeFilterPriceRange = computed(() => {
    const params = this.queryParams();
    const min = params['minPrice'];
    const max = params['maxPrice'];
    if (!min && !max) return null;
    const fmt = (v: string) => Number(v).toLocaleString();
    if (min && max) return `${fmt(min)} - ${fmt(max)} ل.س`;
    if (min) return `${this.language() === 'ar' ? 'من' : 'From'} ${fmt(min)} ل.س`;
    return `${this.language() === 'ar' ? 'إلى' : 'Up to'} ${fmt(max)} ل.س`;
  });

  /**
   * @description Active search term
   */
  activeFilterSearch = computed(() => {
    return this.queryParams()['search'] || null;
  });

  /**
   * @description Active brand filter label
   */
  activeFilterBrands = computed(() => {
    const params = this.queryParams();
    const brandIds = params['brandIds'];
    if (!brandIds) return null;

    const count = brandIds.split(',').filter((id: string) => id.trim()).length;
    return this.language() === 'ar'
      ? `${count} علامة تجارية`
      : `${count} brand${count > 1 ? 's' : ''}`;
  });

  /**
   * @description Remove a specific filter
   * @param type - Filter type to remove
   */
  removeFilter(type: 'categoryId' | 'price' | 'search' | 'brandIds'): void {
    const params: any = { page: 1 };
    if (type === 'categoryId') params.categoryId = null;
    if (type === 'price') { params.minPrice = null; params.maxPrice = null; }
    if (type === 'search') params.search = null;
    if (type === 'brandIds') params.brandIds = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * @description Handles Add to Wishlist event from product card
   * Maps ProductListItem to Product interface and toggles wishlist
   * @param product - Product to toggle in wishlist
   */
  onAddToWishlist(product: ProductListItem): void {
    // Map ProductListItem to Product interface shape
    const mappedProduct: Product = {
      id: String(product.id),
      name: product.nameEn,
      nameArabic: product.nameAr,
      slug: product.slug,
      description: '',
      price: {
        amount: product.discountPrice ?? product.basePrice,
        currency: product.currency || 'SYP',
        originalPrice: product.discountPrice ? product.basePrice : undefined,
      },
      category: {
        id: String(product.categoryId || ''),
        name: product.categoryNameEn || '',
        nameArabic: product.categoryNameAr,
        slug: '',
        breadcrumb: [],
      },
      images: product.mainImage ? [{
        id: '1',
        url: product.mainImage,
        alt: product.nameEn,
        isPrimary: true,
        order: 0,
      }] : [],
      specifications: {} as any,
      seller: {} as any,
      shipping: {} as any,
      authenticity: { certified: false, heritage: 'modern', badges: [] },
      inventory: { inStock: product.stockStatus === 'in_stock', quantity: 0, minOrderQuantity: 1, status: product.stockStatus, lowStockThreshold: 10 },
      reviews: { averageRating: product.rating, totalReviews: product.reviewCount, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      timestamps: { created: new Date(), updated: new Date() },
    };

    const wasAdded = this.wishlistService.toggleWishlist(mappedProduct);

    const productName = this.language() === 'ar' ? product.nameAr : product.nameEn;
    const message = this.language() === 'ar'
      ? (wasAdded ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة')
      : (wasAdded ? 'Added to wishlist' : 'Removed from wishlist');

    this.snackBar.open(`${message}`, '✓', {
      duration: 3000,
      panelClass: wasAdded ? 'success-snackbar' : 'info-snackbar',
    });
  }

  /**
   * @description Checks if a product is in the wishlist
   * @param productId - Product ID to check
   * @returns True if product is wishlisted
   */
  isProductWishlisted(productId: number): boolean {
    return this.wishlistService.isInWishlist(String(productId));
  }

  /**
   * @description Clean up SEO meta tags on component destroy
   */
  ngOnDestroy(): void {
    this.seoService.clearMeta();
  }
}
