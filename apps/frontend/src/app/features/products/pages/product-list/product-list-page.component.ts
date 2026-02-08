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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ProductListItem,
  ProductListMeta,
} from '../../models/product-list.interface';
import { ProductService } from '../../services/product.service';
import { LanguageService } from '../../../../shared/services/language.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductSkeletonComponent } from '../../components/product-skeleton/product-skeleton.component';
import { ProductsPaginationComponent } from '../../components/pagination/products-pagination.component';
import { FilterSidebarComponent } from '../../../../shared/components/filter-sidebar/filter-sidebar.component';
import { FilterState } from '../../../../shared/components/filter-sidebar/filter-sidebar.component';

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
  ],
  templateUrl: './product-list-page.component.html',
  styleUrls: ['./product-list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListPageComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly languageService = inject(LanguageService);

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
    } catch {
      // localStorage unavailable (Safari private mode, etc.)
    }

    // Persist view mode changes to localStorage
    effect(() => {
      try {
        localStorage.setItem('productViewMode', this.viewMode());
      } catch {
        // localStorage unavailable
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
        const sortBy = params['sort'] || 'newest';
        const categoryId = params['categoryId'] ? Number(params['categoryId']) : undefined;
        const minPrice = params['minPrice'] ? Number(params['minPrice']) : undefined;
        const maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : undefined;
        const search = params['search'] || undefined;

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
        this.activeFilters.set(filters);

        this.loadProducts(page, limit, sortBy, categoryId, minPrice, maxPrice, search);
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
    search?: string
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
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            (this.language() === 'ar'
              ? 'فشل تحميل المنتجات'
              : 'Failed to load products');
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
      queryParams: { sort: sortBy, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * @description Handles Add to Cart event from product card.
   * Placeholder for cart service integration.
   * @param product - Product to add to cart
   */
  onAddToCart(product: ProductListItem): void {
    // TODO: Integrate with cart service in a later story
    console.log('Add to cart:', product.id, product.nameEn);
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
      params['search']
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
    }

    // Preserve existing categoryId and search from URL
    const currentParams = this.route.snapshot.queryParams;
    if (currentParams['categoryId']) {
      queryParams.categoryId = currentParams['categoryId'];
    }
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

  /** @description Page title based on current language */
  get pageTitle(): string {
    return this.language() === 'ar' ? 'جميع المنتجات' : 'All Products';
  }

  /** @description Aria label for view mode toggle button */
  get viewModeLabel(): string {
    const mode = this.viewMode() === 'grid' ? 'list' : 'grid';
    if (this.language() === 'ar') {
      return mode === 'grid' ? 'عرض شبكي' : 'عرض قائمة';
    }
    return mode === 'grid' ? 'Grid view' : 'List view';
  }

  /** @description Localized retry button label */
  get retryLabel(): string {
    return this.language() === 'ar' ? 'إعادة المحاولة' : 'Try Again';
  }

  /** @description Localized empty state message */
  get emptyMessage(): string {
    return this.language() === 'ar' ? 'لا توجد منتجات' : 'No products found';
  }

  /** @description Localized browse all button label */
  get browseAllLabel(): string {
    return this.language() === 'ar' ? 'تصفح الكل' : 'Browse All';
  }

  /** @description Localized sort dropdown label */
  get sortLabel(): string {
    return this.language() === 'ar' ? 'ترتيب حسب' : 'Sort by';
  }

  /** @description Array of skeleton card indices for ngFor */
  get skeletonArray(): number[] {
    return Array(this.skeletonCount()).fill(0);
  }

  /**
   * @description Whether any filters are active
   */
  hasActiveFilters = computed(() => {
    const params = this.route.snapshot.queryParams;
    return !!(params['categoryId'] || params['minPrice'] || params['maxPrice'] || params['search']);
  });

  /**
   * @description Active category filter label
   */
  activeFilterCategory = computed(() => {
    const params = this.route.snapshot.queryParams;
    return params['categoryId'] ? `#${params['categoryId']}` : null;
  });

  /**
   * @description Active price range label
   */
  activeFilterPriceRange = computed(() => {
    const params = this.route.snapshot.queryParams;
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
    return this.route.snapshot.queryParams['search'] || null;
  });

  /**
   * @description Remove a specific filter
   * @param type - Filter type to remove
   */
  removeFilter(type: 'categoryId' | 'price' | 'search'): void {
    const params: any = { page: 1 };
    if (type === 'categoryId') params.categoryId = null;
    if (type === 'price') { params.minPrice = null; params.maxPrice = null; }
    if (type === 'search') params.search = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
