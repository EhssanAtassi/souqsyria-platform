import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { Product } from '../../shared/interfaces/product.interface';

/**
 * Products Store State Interface
 * Manages filter, search, and sorting state for product catalog
 *
 * @extends EntityState<Product> - Akita entity state for normalized product storage
 */
export interface ProductsState extends EntityState<Product> {
  /** Currently selected category slug (null = all categories) */
  selectedCategory: string | null;

  /** Current search query text */
  searchQuery: string;

  /** Price range filter (null = no price filter) */
  priceRange: { min: number; max: number } | null;

  /** Filter to show only UNESCO heritage products */
  isHeritageOnly: boolean;

  /** Filter to show only in-stock products */
  inStockOnly: boolean;

  /** Current sort field */
  sortBy: 'price' | 'rating' | 'name' | 'newest';

  /** Sort direction (ascending or descending) */
  sortOrder: 'asc' | 'desc';
}

/**
 * Products Store
 *
 * Centralized state management for Syrian marketplace product catalog.
 * Uses Akita EntityStore for efficient product entity management.
 *
 * Features:
 * - Product entity storage with normalized state
 * - Category filtering
 * - Search functionality
 * - Price range filtering
 * - Heritage/UNESCO filtering
 * - Stock availability filtering
 * - Multi-field sorting
 * - Resettable state
 *
 * @example
 * // Inject in component
 * constructor(private productsStore: ProductsStore) {}
 *
 * // Update filter
 * this.productsStore.update({ selectedCategory: 'damascus-steel' });
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'products', resettable: true })
export class ProductsStore extends EntityStore<ProductsState, Product> {
  constructor() {
    super({
      selectedCategory: null,
      searchQuery: '',
      priceRange: null,
      isHeritageOnly: false,
      inStockOnly: true,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  }
}
