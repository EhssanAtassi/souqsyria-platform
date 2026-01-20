import { Component, OnInit, signal, computed, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Product } from '../../shared/interfaces/product.interface';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CategoryService } from '../../shared/services/category.service';
import { CartService } from '../../store/cart/cart.service';
import { 
  CategoryFilter, 
  ProductSort, 
  ProductListingRequest, 
  ProductListingResponse,
  ProductViewMode,
  SORT_OPTIONS,
  DEFAULT_VIEW_MODE 
} from '../../shared/interfaces/category-filter.interface';

/**
 * Search results component for Syrian marketplace
 * Provides comprehensive search functionality with filtering, sorting, and pagination
 * 
 * @swagger
 * components:
 *   schemas:
 *     SearchResultsComponent:
 *       type: object
 *       properties:
 *         searchQuery:
 *           type: string
 *           description: Current search query
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         filters:
 *           $ref: '#/components/schemas/CategoryFilter'
 *         totalResults:
 *           type: number
 *           description: Total number of search results
 *         isLoading:
 *           type: boolean
 *           description: Loading state indicator
 */
@Component({
  selector: 'app-search-results',
  standalone: true,
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
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ProductCardComponent
  ],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  // Signals for reactive state management
  searchQuery = signal<string>('');
  originalSearchQuery = signal<string>(''); // Store original query for display
  productListingResponse = signal<ProductListingResponse | null>(null);
  isLoading = signal<boolean>(false);
  isSidenavOpen = signal<boolean>(false);
  
  // Filter state (reusing category filter functionality)
  currentFilters = signal<CategoryFilter>({});
  currentSort = signal<ProductSort>(SORT_OPTIONS[0]);
  currentViewMode = signal<ProductViewMode>(DEFAULT_VIEW_MODE);
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(20);
  
  // Computed properties
  products = computed(() => this.productListingResponse()?.products || []);
  pagination = computed(() => this.productListingResponse()?.pagination);
  availableFilters = computed(() => this.productListingResponse()?.availableFilters);
  totalResults = computed(() => this.pagination()?.total || 0);
  hasResults = computed(() => this.totalResults() > 0);
  
  // Filter panel state
  priceRange = signal<{ min: number; max: number }>({ min: 0, max: 1000 });
  selectedRatings = signal<number[]>([]);
  selectedAvailability = signal<string[]>([]);
  selectedCategories = signal<string[]>([]);
  selectedLocations = signal<string[]>([]);
  selectedMaterials = signal<string[]>([]);
  selectedHeritage = signal<string[]>([]);
  onlyAuthentic = signal<boolean>(false);
  onlyFreeShipping = signal<boolean>(false);
  onlyOnSale = signal<boolean>(false);
  onlyUnesco = signal<boolean>(false);
  onlyMasterCraftsman = signal<boolean>(false);
  onlyInStock = signal<boolean>(false);
  
  // Available options
  sortOptions = SORT_OPTIONS;
  viewModeOptions = [
    { value: 'grid', icon: 'view_module', label: 'Grid View' },
    { value: 'list', icon: 'view_list', label: 'List View' }
  ];
  
  // Window reference for responsive checks
  window = window;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Get search query from route
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const query = params.get('q') || '';
        this.searchQuery.set(query);
        this.originalSearchQuery.set(query);
        if (query) {
          this.loadSearchResults();
        }
      });
    
    // Load initial results if query exists
    const initialQuery = this.route.snapshot.queryParamMap.get('q') || '';
    if (initialQuery) {
      this.searchQuery.set(initialQuery);
      this.originalSearchQuery.set(initialQuery);
      this.loadSearchResults();
    }
  }


  /**
   * Loads search results based on current query and filters
   * Uses CategoryService for consistent filtering experience
   */
  private loadSearchResults(): void {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.isLoading.set(true);
    
    const filters: CategoryFilter = {
      priceRange: {
        min: this.priceRange().min,
        max: this.priceRange().max,
        currency: 'USD'
      },
      ratings: this.selectedRatings(),
      availability: this.selectedAvailability() as any[],
      categories: this.selectedCategories(),
      locations: this.selectedLocations(),
      materials: this.selectedMaterials(),
      heritage: this.selectedHeritage() as any[],
      authenticityOnly: this.onlyAuthentic(),
      freeShippingOnly: this.onlyFreeShipping(),
      onSaleOnly: this.onlyOnSale(),
      unescoOnly: this.onlyUnesco(),
      masterCraftsmanOnly: this.onlyMasterCraftsman(),
      inStockOnly: this.onlyInStock()
    };
    
    const request: ProductListingRequest = {
      searchQuery: query,
      filters,
      sort: this.currentSort(),
      pagination: {
        page: this.currentPage(),
        limit: this.itemsPerPage()
      },
      viewMode: this.currentViewMode()
    };
    
    this.categoryService.getProductsByCategory(request)
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
        },
        error: (error) => {
          console.error('Error loading search results:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Performs new search with updated query
   * Updates URL and reloads results
   */
  performSearch(query: string): void {
    if (!query.trim()) return;

    this.searchQuery.set(query.trim());
    this.originalSearchQuery.set(query.trim());
    this.currentPage.set(1); // Reset to first page
    
    // Update URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query.trim() },
      queryParamsHandling: 'merge'
    });
    
    this.loadSearchResults();
  }

  /**
   * Handles sorting change
   */
  onSortChange(sort: ProductSort): void {
    this.currentSort.set(sort);
    this.currentPage.set(1);
    this.loadSearchResults();
  }

  /**
   * Handles view mode toggle
   */
  onViewModeChange(mode: 'grid' | 'list'): void {
    const newViewMode: ProductViewMode = {
      ...this.currentViewMode(),
      mode
    };
    this.currentViewMode.set(newViewMode);
  }

  /**
   * Handles pagination change
   */
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSearchResults();
    
    // Scroll to top of results
    document.querySelector('.search-results-grid')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }

  /**
   * Handles items per page change
   */
  onPageSizeChange(size: number): void {
    this.itemsPerPage.set(size);
    this.currentPage.set(1);
    this.loadSearchResults();
  }

  /**
   * Applies current filters
   */
  applyFilters(): void {
    this.currentPage.set(1);
    this.loadSearchResults();
    
    // Close sidebar on mobile after applying filters
    if (window.innerWidth < 768) {
      this.isSidenavOpen.set(false);
    }
  }

  /**
   * Clears all filters
   */
  clearAllFilters(): void {
    this.priceRange.set({ min: 0, max: 1000 });
    this.selectedRatings.set([]);
    this.selectedAvailability.set([]);
    this.selectedCategories.set([]);
    this.selectedLocations.set([]);
    this.selectedMaterials.set([]);
    this.selectedHeritage.set([]);
    this.onlyAuthentic.set(false);
    this.onlyFreeShipping.set(false);
    this.onlyOnSale.set(false);
    this.onlyUnesco.set(false);
    this.onlyMasterCraftsman.set(false);
    this.onlyInStock.set(false);
    this.currentPage.set(1);
    this.loadSearchResults();
  }

  /**
   * Toggle methods for filter options
   */
  toggleRating(rating: number): void {
    const ratings = this.selectedRatings();
    const index = ratings.indexOf(rating);
    
    if (index > -1) {
      ratings.splice(index, 1);
    } else {
      ratings.push(rating);
    }
    
    this.selectedRatings.set([...ratings]);
  }

  toggleAvailability(status: string): void {
    const availability = this.selectedAvailability();
    const index = availability.indexOf(status);
    
    if (index > -1) {
      availability.splice(index, 1);
    } else {
      availability.push(status);
    }
    
    this.selectedAvailability.set([...availability]);
  }

  toggleCategory(categoryId: string): void {
    const categories = this.selectedCategories();
    const index = categories.indexOf(categoryId);
    
    if (index > -1) {
      categories.splice(index, 1);
    } else {
      categories.push(categoryId);
    }
    
    this.selectedCategories.set([...categories]);
  }

  toggleLocation(location: string): void {
    const locations = this.selectedLocations();
    const index = locations.indexOf(location);
    
    if (index > -1) {
      locations.splice(index, 1);
    } else {
      locations.push(location);
    }
    
    this.selectedLocations.set([...locations]);
  }

  toggleMaterial(material: string): void {
    const materials = this.selectedMaterials();
    const index = materials.indexOf(material);
    
    if (index > -1) {
      materials.splice(index, 1);
    } else {
      materials.push(material);
    }
    
    this.selectedMaterials.set([...materials]);
  }

  toggleHeritage(heritage: string): void {
    const heritages = this.selectedHeritage();
    const index = heritages.indexOf(heritage);
    
    if (index > -1) {
      heritages.splice(index, 1);
    } else {
      heritages.push(heritage);
    }
    
    this.selectedHeritage.set([...heritages]);
  }

  /**
   * Handles product card actions
   */
  onAddToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1);
    console.log(`Added ${product.name} to cart`);
    // Could show toast notification here
  }

  onToggleWishlist(product: Product): void {
    console.log('Toggle wishlist:', product);
    // TODO: Implement wishlist service integration
  }

  onProductClick(product: Product): void {
    this.router.navigate(['/product', product.slug]);
  }

  /**
   * Gets active filters count for display
   */
  getActiveFiltersCount(): number {
    let count = 0;
    
    if (this.selectedRatings().length > 0) count++;
    if (this.selectedAvailability().length > 0) count++;
    if (this.selectedCategories().length > 0) count++;
    if (this.selectedLocations().length > 0) count++;
    if (this.selectedMaterials().length > 0) count++;
    if (this.selectedHeritage().length > 0) count++;
    if (this.onlyAuthentic()) count++;
    if (this.onlyFreeShipping()) count++;
    if (this.onlyOnSale()) count++;
    if (this.onlyUnesco()) count++;
    if (this.onlyMasterCraftsman()) count++;
    if (this.onlyInStock()) count++;
    
    return count;
  }

  /**
   * Toggles sidebar visibility (for mobile)
   */
  toggleSidebar(): void {
    this.isSidenavOpen.set(!this.isSidenavOpen());
  }

  /**
   * Formats slider values for display
   */
  formatSliderValue(value: number): string {
    return `$${value}`;
  }

  /**
   * Gets search suggestions based on current query
   * This is a mock implementation - in real app would call API
   */
  getSearchSuggestions(): string[] {
    const query = this.searchQuery().toLowerCase();
    if (!query || query.length < 2) return [];

    const suggestions = [
      'Damascus steel knife',
      'Aleppo soap',
      'Syrian brocade',
      'Traditional spices',
      'Handcrafted jewelry',
      'Olive oil',
      'Cedar wood',
      'Silver necklace',
      'Mosaic art',
      'Prayer rug'
    ];

    return suggestions.filter(s => 
      s.toLowerCase().includes(query)
    ).slice(0, 5);
  }

  /**
   * Handles search suggestion click
   */
  onSuggestionClick(suggestion: string): void {
    this.performSearch(suggestion);
  }

  /**
   * Performs a regional search for Syrian products
   * 
   * @param region - Syrian region name
   */
  performRegionalSearch(region: string): void {
    // Clear previous filters and set region-specific search
    this.clearAllFilters();
    this.selectedLocations.set([region]);
    this.performSearch(`${region} products`);
  }

  /**
   * Searches for UNESCO recognized crafts
   * 
   * @param craft - UNESCO craft type
   */
  searchUNESCOCraft(craft: string): void {
    this.onlyUnesco.set(true);
    this.performSearch(craft);
  }

  /**
   * Gets list of Syrian regions for filtering
   * 
   * @returns Array of Syrian regions
   */
  getSyrianRegions(): string[] {
    return [
      'Damascus',
      'Aleppo',
      'Homs', 
      'Hama',
      'Latakia',
      'Daraa',
      'Deir ez-Zor',
      'Al-Hasakah',
      'Ar-Raqqa',
      'As-Suwayda',
      'Quneitra',
      'Idlib',
      'Tartus',
      'Damascus Countryside'
    ];
  }

  /**
   * Gets list of traditional Syrian materials
   * 
   * @returns Array of traditional materials
   */
  getTraditionalMaterials(): string[] {
    return [
      'Damascus Steel',
      'Olive Wood',
      'Cedar Wood',
      'Silver',
      'Gold',
      'Silk',
      'Cotton',
      'Wool',
      'Copper',
      'Bronze',
      'Mother of Pearl',
      'Ivory',
      'Brass',
      'Leather'
    ];
  }

  /**
   * Gets Syrian regional specialties with product information
   * 
   * @returns Array of regional specialties
   */
  getSyrianRegionalSpecialties(): Array<{name: string; specialty: string; productCount: number}> {
    return [
      { name: 'Damascus', specialty: 'Steel & Metalwork', productCount: 127 },
      { name: 'Aleppo', specialty: 'Soap & Textiles', productCount: 89 },
      { name: 'Homs', specialty: 'Crafts & Jewelry', productCount: 64 },
      { name: 'Hama', specialty: 'Woodwork & Pottery', productCount: 43 },
      { name: 'Latakia', specialty: 'Coastal Crafts', productCount: 38 },
      { name: 'Daraa', specialty: 'Agricultural Products', productCount: 29 },
      { name: 'Tartus', specialty: 'Maritime Crafts', productCount: 25 },
      { name: 'Idlib', specialty: 'Olive Products', productCount: 31 }
    ];
  }

  /**
   * Gets UNESCO recognized Syrian crafts
   * 
   * @returns Array of UNESCO crafts
   */
  getUNESCOCrafts(): string[] {
    return [
      'Damascus Steel Forging',
      'Traditional Soap Making',
      'Brocade Weaving',
      'Mosaic Artistry',
      'Calligraphy',
      'Traditional Music Instruments',
      'Ceramic Pottery',
      'Wood Inlay Work'
    ];
  }

  /**
   * Gets breadcrumb for search results
   */
  getBreadcrumb(): string[] {
    const query = this.originalSearchQuery();
    return ['Home', 'Search Results', `"${query}"`];
  }

  /**
   * Handles clear search
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.router.navigate(['/']);
  }
}