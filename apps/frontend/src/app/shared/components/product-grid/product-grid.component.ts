import { Component, Input, Output, EventEmitter, OnInit, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Product } from '../../interfaces/product.interface';
import { ProductsService } from '../../../store/products/products.service';
import { ProductsQuery } from '../../../store/products/products.query';
import { ProductCardComponent } from '../product-card/product-card.component';

/**
 * Sort options for products
 */
export type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';

/**
 * Simplified Product Grid Component for Syrian marketplace
 * Displays products in responsive grid with basic sorting
 * 
 * @swagger
 * components:
 *   schemas:
 *     ProductGridComponent:
 *       type: object
 *       description: Basic product grid with sorting and responsive layout
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: Array of products to display
 *         showFilters:
 *           type: boolean
 *           description: Whether to show filter sidebar
 *         showSorting:
 *           type: boolean
 *           description: Whether to show sorting options
 *         currency:
 *           type: string
 *           enum: [USD, EUR, SYP]
 *           description: Display currency preference
 */
@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    ProductCardComponent
  ],
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGridComponent implements OnInit {
  /**
   * Input products array (optional - if not provided, will load from service)
   */
  @Input() products: Product[] | null = null;

  /**
   * Whether to show filter sidebar
   */
  @Input() showFilters: boolean = true;

  /**
   * Whether to show sorting options
   */
  @Input() showSorting: boolean = true;

  /**
   * Currency preference for price display
   */
  @Input() currency: 'USD' | 'EUR' | 'SYP' = 'USD';

  /**
   * Loading state
   */
  @Input() isLoading: boolean = false;

  /**
   * Event emitted when product is clicked
   */
  @Output() productClick = new EventEmitter<Product>();

  /**
   * Event emitted when products are added to cart
   */
  @Output() addToCart = new EventEmitter<Product>();

  /**
   * Event emitted when products are added/removed from wishlist
   */
  @Output() toggleWishlist = new EventEmitter<Product>();

  // Component state
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  currentSort: SortOption = 'newest';
  searchQuery: string = '';
  private destroyRef = inject(DestroyRef);

  // Sort options
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'price_asc', label: 'Price Low to High' },
    { value: 'price_desc', label: 'Price High to Low' },
    { value: 'rating_desc', label: 'Highest Rated' }
  ];

  constructor(
    private productsService: ProductsService,
    private productsQuery: ProductsQuery
  ) {}

  ngOnInit(): void {
    // Load products if not provided
    if (!this.products) {
      this.loadProducts();
    } else {
      this.allProducts = this.products;
      this.applyFiltersAndSort();
    }
  }


  /**
   * Loads products from the service
   */
  private loadProducts(): void {
    this.productsService.loadProducts();
    this.allProducts = this.productsQuery.getAll();
    this.applyFiltersAndSort();
  }

  /**
   * Applies current filters and sorting
   */
  private applyFiltersAndSort(): void {
    let filtered = [...this.allProducts];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.name.toLowerCase().includes(query) ||
        product.seller.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.currentSort) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price_asc':
          return a.price.amount - b.price.amount;
        case 'price_desc':
          return b.price.amount - a.price.amount;
        case 'rating_desc':
          return b.reviews.averageRating - a.reviews.averageRating;
        case 'newest':
          return new Date(b.timestamps.created).getTime() - new Date(a.timestamps.created).getTime();
        default:
          return 0;
      }
    });

    this.filteredProducts = filtered;
  }

  /**
   * Handles sort option change
   */
  onSortChange(sortOption: SortOption): void {
    this.currentSort = sortOption;
    this.applyFiltersAndSort();
  }

  /**
   * Handles search query change
   */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFiltersAndSort();
  }

  /**
   * Handles product click
   */
  onProductClick(product: Product): void {
    this.productClick.emit(product);
  }

  /**
   * Handles add to cart
   */
  onAddToCart(product: Product): void {
    this.addToCart.emit(product);
  }

  /**
   * Handles wishlist toggle
   */
  onToggleWishlist(product: Product): void {
    this.toggleWishlist.emit(product);
  }

  /**
   * TrackBy function for products to optimize rendering
   */
  trackByProductId(index: number, product: Product): string {
    return product.id;
  }

  /**
   * Gets formatted price display
   */
  formatPrice(amount: number): string {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'SYP': 'ل.س'
    };
    
    const symbol = symbols[this.currency] || this.currency;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: this.currency === 'SYP' ? 0 : 2,
      maximumFractionDigits: this.currency === 'SYP' ? 0 : 2
    }).format(amount);
    
    return this.currency === 'SYP' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
  }
}