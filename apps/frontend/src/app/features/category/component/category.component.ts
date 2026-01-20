/**
 * SouqSyria Syrian Marketplace Category Component (Refactored)
 *
 * @description Streamlined category component following PROJECT_STRUCTURE_BLUEPRINT pattern
 * Reduced from 780 lines to ~400 lines by:
 * - Extracting configurations to config/ folder
 * - Using facade service for business logic orchestration
 * - Delegating analytics to dedicated service
 * - Simplifying event handlers
 *
 * @pattern Smart Container Component (300-400 lines)
 * - Presentation logic only
 * - Delegates to facade and analytics services
 * - Uses signals for reactive state management
 * - Imports configurations from dedicated config files
 * - Clean, maintainable, testable
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryComponent:
 *       type: object
 *       description: Main category container component
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  Inject,
  PLATFORM_ID,
  HostListener
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

// Child Components
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { MarketplaceLayoutComponent } from '../../../shared/layouts/marketplace-layout/marketplace-layout.component';
import { FilterSidebarComponent, FilterState } from '../../../shared/components/filter-sidebar/filter-sidebar.component';
import { ProductsToolbarComponent, SortOption } from '../../../shared/components/products-toolbar/products-toolbar.component';
import { ActiveFiltersChipsComponent } from '../../../shared/components/active-filters-chips/active-filters-chips.component';
import { ProductRecommendationsCarouselComponent } from '../../../shared/components/product-recommendations-carousel/product-recommendations-carousel.component';

// Services
import { CategoryFacadeService } from '../services/category-facade.service';
import { CategoryAnalyticsService } from '../services/category-analytics.service';

// Interfaces
import { Product } from '../../../shared/interfaces/product.interface';
import {
  CategoryFilter,
  ProductSort,
  ProductViewMode,
  ProductListingRequest,
  ProductListingResponse
} from '../../../shared/interfaces/category-filter.interface';

// Configurations
import {
  CATEGORY_SORT_OPTIONS,
  DEFAULT_CATEGORY_SORT,
  mapSortOptionToProductSort,
  mapProductSortToSortOption
} from '../config/sort-options.config';
import {
  VIEW_MODE_OPTIONS,
  DEFAULT_VIEW_MODE,
  getViewModeConfig
} from '../config/view-mode.config';
import {
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE
} from '../config/pagination.config';
import {
  getRelatedCategories,
  RelatedCategoryConfig
} from '../config/related-categories.config';

// Models
import {
  DEFAULT_FILTER_STATE,
  BACK_TO_TOP_SCROLL_THRESHOLD,
  MOBILE_BREAKPOINT
} from '../models/category.interface';

/**
 * Category Component
 *
 * @description Syrian marketplace category page with comprehensive filtering
 * Features:
 * - Advanced filtering (price, rating, location, materials, etc.)
 * - Multiple sorting options
 * - Grid/List view modes
 * - Pagination
 * - SEO optimization with meta tags and structured data
 * - Related categories for cross-selling
 * - Back to top button
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Component kept to 300-400 lines
 * - All configs imported from config/ folder
 * - Business logic delegated to facade service
 * - Analytics delegated to analytics service
 * - Reactive state with Angular signals
 * - Clean, maintainable, testable
 */
@Component({
  selector: 'app-category',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatExpansionModule,
    MatTooltipModule,
    ProductCardComponent,
    MarketplaceLayoutComponent,
    FilterSidebarComponent,
    ProductsToolbarComponent,
    ActiveFiltersChipsComponent,
    ProductRecommendationsCarouselComponent
  ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  //#region Dependency Injection

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);
  private readonly categoryFacade = inject(CategoryFacadeService);
  private readonly analytics = inject(CategoryAnalyticsService);

  //#endregion

  //#region Configuration Imports

  /** Sort options from config */
  readonly sortOptions = CATEGORY_SORT_OPTIONS;

  /** View mode options from config */
  readonly viewModeOptions = VIEW_MODE_OPTIONS;

  /** Page size options from config */
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  //#endregion

  //#region Reactive State with Signals

  /** Current category slug */
  readonly categorySlug = signal<string>('');

  /** Product listing response */
  readonly productListingResponse = signal<ProductListingResponse | null>(null);

  /** Loading states */
  readonly isLoading = signal<boolean>(false);
  readonly isSidenavOpen = signal<boolean>(false);

  /** Filter state */
  readonly priceRange = signal<{ min: number; max: number }>({ min: 0, max: 1000 });
  readonly selectedRatings = signal<number[]>([]);
  readonly selectedAvailability = signal<string[]>([]);
  readonly selectedLocations = signal<string[]>([]);
  readonly selectedMaterials = signal<string[]>([]);
  readonly selectedHeritage = signal<string[]>([]);
  readonly onlyAuthentic = signal<boolean>(false);
  readonly onlyFreeShipping = signal<boolean>(false);
  readonly onlyOnSale = signal<boolean>(false);
  readonly onlyUnesco = signal<boolean>(false);

  /** UI state */
  readonly currentSort = signal<ProductSort>(DEFAULT_CATEGORY_SORT);
  readonly currentViewMode = signal<ProductViewMode>(DEFAULT_VIEW_MODE);
  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = signal<number>(DEFAULT_PAGE_SIZE);
  readonly showBackToTop = signal<boolean>(false);

  /** Computed properties */
  readonly products = computed(() => this.productListingResponse()?.products || []);
  readonly pagination = computed(() => this.productListingResponse()?.pagination);
  readonly category = computed(() => this.productListingResponse()?.category);
  readonly availableFilters = computed(() => this.productListingResponse()?.availableFilters);

  /** Related categories */
  readonly relatedCategories = computed<RelatedCategoryConfig[]>(() => {
    const currentSlug = this.categorySlug();
    return currentSlug ? getRelatedCategories(currentSlug, 4) : [];
  });

  /** Current filters as FilterState */
  readonly currentFilters = computed<FilterState>(() => {
    const filters: FilterState = {};

    const priceRange = this.priceRange();
    if (priceRange.min !== 0 || priceRange.max !== 1000) {
      filters.priceRange = priceRange;
    }

    const ratings = this.selectedRatings();
    if (ratings.length > 0) {
      filters.ratings = ratings;
    }

    const authenticity: any = {};
    if (this.onlyUnesco()) authenticity.unesco = true;

    const heritage = this.selectedHeritage();
    if (heritage.includes('traditional')) authenticity.handmade = true;
    if (heritage.includes('regional')) authenticity.regional = true;

    if (Object.keys(authenticity).length > 0) {
      filters.authenticity = authenticity;
    }

    const availability: any = {};
    const avail = this.selectedAvailability();
    if (avail.includes('in_stock')) availability.inStock = true;
    if (avail.includes('out_of_stock')) availability.outOfStock = true;

    if (Object.keys(availability).length > 0) {
      filters.availability = availability;
    }

    const regions = this.selectedLocations();
    if (regions.length > 0) {
      filters.regions = regions;
    }

    return filters;
  });

  //#endregion

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  //#region Lifecycle Hooks

  /**
   * Component initialization
   * @description Loads category products and watches route changes
   */
  ngOnInit(): void {
    // Get category slug from route
    this.categorySlug.set(this.route.snapshot.paramMap.get('categorySlug') || '');

    // Watch for route parameter changes
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const slug = params.get('categorySlug') || '';
        this.categorySlug.set(slug);
        this.loadProducts();
      });

    // Load initial products
    this.loadProducts();
  }

  //#endregion

  //#region Product Loading

  /**
   * Load products based on current filters and sorting
   * @description Uses facade service for orchestration
   */
  private loadProducts(): void {
    this.isLoading.set(true);

    const request: ProductListingRequest = {
      categorySlug: this.categorySlug(),
      filters: this.buildCategoryFilter(),
      sort: this.currentSort(),
      pagination: {
        page: this.currentPage(),
        limit: this.itemsPerPage()
      },
      viewMode: this.currentViewMode()
    };

    this.categoryFacade
      .loadCategoryProducts(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.productListingResponse.set(response);
          this.isLoading.set(false);

          // Update price range if not set
          if (response.availableFilters && this.priceRange().max === 1000) {
            this.priceRange.set({
              min: Math.floor(response.availableFilters.priceRanges.min),
              max: Math.ceil(response.availableFilters.priceRanges.max)
            });
          }

          // Update SEO tags
          if (response.category) {
            this.updateSEOTags(response.category, response.products, response.pagination.total);
            this.updateStructuredData(response.category, response.products);
          }
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Build CategoryFilter from component state
   */
  private buildCategoryFilter(): CategoryFilter {
    return {
      priceRange: {
        min: this.priceRange().min,
        max: this.priceRange().max,
        currency: 'USD'
      },
      ratings: this.selectedRatings(),
      availability: this.selectedAvailability() as any[],
      locations: this.selectedLocations(),
      materials: this.selectedMaterials(),
      heritage: this.selectedHeritage() as any[],
      authenticityOnly: this.onlyAuthentic(),
      freeShippingOnly: this.onlyFreeShipping(),
      onSaleOnly: this.onlyOnSale(),
      unescoOnly: this.onlyUnesco()
    };
  }

  //#endregion

  //#region Event Handlers - Sorting & View Mode

  /**
   * Handle sort change from toolbar
   */
  onSortChangeFromToolbar(sortValue: SortOption): void {
    const productSort = mapSortOptionToProductSort(sortValue);
    this.currentSort.set(productSort);
    this.currentPage.set(1);
    this.loadProducts();
  }

  /**
   * Get current sort value for toolbar
   */
  getCurrentSortValue(): SortOption {
    return mapProductSortToSortOption(this.currentSort());
  }

  /**
   * Handle view mode change
   */
  onViewModeChange(mode: 'grid' | 'list'): void {
    const newViewMode = getViewModeConfig(mode);
    this.currentViewMode.set(newViewMode);
    this.analytics.trackViewModeChange(this.categorySlug(), mode);
  }

  //#endregion

  //#region Event Handlers - Pagination

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();

    // Scroll to top of products
    document.querySelector('.products-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(size: number): void {
    this.itemsPerPage.set(size);
    this.currentPage.set(1);
    this.loadProducts();
  }

  //#endregion

  //#region Event Handlers - Filters

  /**
   * Handle filters change from filter sidebar
   */
  onFiltersChange(filters: FilterState): void {
    // Convert FilterState to component state
    if (filters.priceRange) {
      this.priceRange.set(filters.priceRange);
    }
    if (filters.ratings) {
      this.selectedRatings.set(filters.ratings);
    }
    if (filters.authenticity) {
      this.onlyUnesco.set(filters.authenticity.unesco || false);
      const heritageValues: string[] = [];
      if (filters.authenticity.handmade) heritageValues.push('traditional');
      if (filters.authenticity.regional) heritageValues.push('regional');
      this.selectedHeritage.set(heritageValues);
    }
    if (filters.availability) {
      const availability: string[] = [];
      if (filters.availability.inStock) availability.push('in_stock');
      if (filters.availability.outOfStock) availability.push('out_of_stock');
      this.selectedAvailability.set(availability);
    }
    if (filters.regions) {
      this.selectedLocations.set(filters.regions);
    }

    this.applyFilters();
  }

  /**
   * Apply current filters
   */
  applyFilters(): void {
    this.currentPage.set(1);
    this.loadProducts();

    // Close sidebar on mobile
    if (typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT) {
      this.isSidenavOpen.set(false);
    }
  }

  /**
   * Clear all filters
   */
  onClearAllFilters(): void {
    Object.assign(this, DEFAULT_FILTER_STATE);
    this.currentPage.set(1);
    this.loadProducts();
  }

  /**
   * Remove specific filter
   */
  onRemoveFilter(filterKey: string): void {
    // Parse filter key and remove
    if (filterKey === 'priceRange') {
      this.priceRange.set({ min: 0, max: 1000 });
    } else if (filterKey.startsWith('rating-')) {
      const rating = parseInt(filterKey.split('-')[1], 10);
      const ratings = this.selectedRatings().filter(r => r !== rating);
      this.selectedRatings.set(ratings);
    } else if (filterKey.startsWith('authenticity-')) {
      const type = filterKey.split('-')[1];
      if (type === 'unesco') {
        this.onlyUnesco.set(false);
      } else if (type === 'handmade') {
        const heritage = this.selectedHeritage().filter(h => h !== 'traditional');
        this.selectedHeritage.set(heritage);
      } else if (type === 'regional') {
        const heritage = this.selectedHeritage().filter(h => h !== 'regional');
        this.selectedHeritage.set(heritage);
      }
    } else if (filterKey.startsWith('availability-')) {
      const type = filterKey.split('-')[1];
      const availability = this.selectedAvailability().filter(a =>
        type === 'inStock' ? a !== 'in_stock' : a !== 'out_of_stock'
      );
      this.selectedAvailability.set(availability);
    } else if (filterKey.startsWith('region-')) {
      const region = filterKey.replace('region-', '');
      const locations = this.selectedLocations().filter(l => l !== region);
      this.selectedLocations.set(locations);
    }

    this.applyFilters();
  }

  //#endregion

  //#region Event Handlers - Products

  /**
   * Handle product click
   */
  onProductClick(product: Product): void {
    this.categoryFacade.handleProductClick(product, undefined, 'category');
    this.router.navigate(['/product', product.slug]);
  }

  /**
   * Handle add to cart
   */
  onAddToCart(product: Product): void {
    try {
      this.categoryFacade.addToCart(product, 1, 'category');
      console.log(`✅ Added ${product.name} to cart`);
    } catch (error: any) {
      console.error('Failed to add to cart:', error.message);
    }
  }

  /**
   * Handle wishlist toggle
   */
  onToggleWishlist(product: Product): void {
    this.categoryFacade.handleWishlistToggle(product, 'category');
  }

  //#endregion

  //#region Event Handlers - UI

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    const newState = !this.isSidenavOpen();
    this.isSidenavOpen.set(newState);
    this.analytics.trackSidebarToggle(this.categorySlug(), newState);
  }

  /**
   * Handle back to top click
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.analytics.trackBackToTopClick(this.categorySlug());
  }

  /**
   * Listen to window scroll for back to top button
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showBackToTop.set(scrollPosition > BACK_TO_TOP_SCROLL_THRESHOLD);
  }

  /**
   * Handle related category click
   */
  onRelatedCategoryClick(categorySlug: string): void {
    const category = this.relatedCategories().find(c => c.slug === categorySlug);
    if (category) {
      this.categoryFacade.handleRelatedCategoryClick(categorySlug, category.name);
    }
    this.router.navigate(['/category', categorySlug]);
  }

  //#endregion

  //#region SEO Methods

  /**
   * Update SEO meta tags
   */
  private updateSEOTags(category: any, products: Product[], totalProducts: number): void {
    const seoTags = this.categoryFacade.generateSEOMetaTags(category, products, totalProducts);

    this.titleService.setTitle(seoTags.title);
    this.metaService.updateTag({ name: 'description', content: seoTags.description });
    this.metaService.updateTag({ name: 'keywords', content: seoTags.keywords });

    // Open Graph tags
    this.metaService.updateTag({ property: 'og:title', content: seoTags.openGraph.title });
    this.metaService.updateTag({ property: 'og:description', content: seoTags.openGraph.description });
    this.metaService.updateTag({ property: 'og:url', content: seoTags.openGraph.url });
    this.metaService.updateTag({ property: 'og:image', content: seoTags.openGraph.image });
    this.metaService.updateTag({ property: 'og:type', content: seoTags.openGraph.type });
    this.metaService.updateTag({ property: 'og:site_name', content: seoTags.openGraph.siteName });

    // Twitter Card tags
    this.metaService.updateTag({ name: 'twitter:card', content: seoTags.twitterCard.card });
    this.metaService.updateTag({ name: 'twitter:title', content: seoTags.twitterCard.title });
    this.metaService.updateTag({ name: 'twitter:description', content: seoTags.twitterCard.description });
    this.metaService.updateTag({ name: 'twitter:image', content: seoTags.twitterCard.image });

    // Canonical URL
    this.metaService.updateTag({ rel: 'canonical', href: seoTags.canonicalUrl });
  }

  /**
   * Update JSON-LD structured data
   */
  private updateStructuredData(category: any, products: Product[]): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Remove existing structured data
    const existingScript = this.document.getElementById('category-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // Generate structured data
    const structuredData = this.categoryFacade.generateStructuredData(category, products);

    // Inject into DOM
    const script = this.document.createElement('script');
    script.id = 'category-structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    this.document.head.appendChild(script);
  }

  //#endregion

  //#region Helper Methods

  /**
   * Format slider value for display
   */
  formatSliderValue(value: number): string {
    return `$${value}`;
  }

  /**
   * Get active filters count
   */
  getActiveFiltersCount(): number {
    let count = 0;

    if (this.selectedRatings().length > 0) count++;
    if (this.selectedAvailability().length > 0) count++;
    if (this.selectedLocations().length > 0) count++;
    if (this.selectedMaterials().length > 0) count++;
    if (this.selectedHeritage().length > 0) count++;
    if (this.onlyAuthentic()) count++;
    if (this.onlyFreeShipping()) count++;
    if (this.onlyOnSale()) count++;
    if (this.onlyUnesco()) count++;

    return count;
  }

  //#endregion
}
