import { QueryEntity } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { ProductsStore, ProductsState } from './products.store';
import { Product } from '../../shared/interfaces/product.interface';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Products Query Service
 *
 * Provides reactive queries and selectors for the products store.
 * All product data access should go through this query service.
 *
 * Features:
 * - Reactive observables for all product data
 * - Computed filtered products based on all active filters
 * - Specialized selectors (featured, heritage, sale products)
 * - Product lookup by slug
 * - Loading state management
 *
 * @example
 * // In component
 * constructor(private productsQuery: ProductsQuery) {}
 *
 * ngOnInit() {
 *   // Subscribe to filtered products
 *   this.productsQuery.filteredProducts$.subscribe(products => {
 *     console.log('Filtered products:', products);
 *   });
 *
 *   // Get single product
 *   this.productsQuery.getProductBySlug('damascus-steel-knife')
 *     .subscribe(product => console.log(product));
 * }
 */
@Injectable({ providedIn: 'root' })
export class ProductsQuery extends QueryEntity<ProductsState, Product> {

  /** Observable of all products in store */
  products$;

  /** Observable of loading state */
  loading$;

  /** Observable of selected category filter */
  selectedCategory$;

  /** Observable of search query */
  searchQuery$;

  /** Observable of price range filter */
  priceRange$;

  /**
   * Filtered Products Observable
   *
   * Combines all active filters (category, search, price, heritage, stock)
   * and returns matching products. Updates reactively when any filter changes.
   */
  filteredProducts$;

  /**
   * Featured Products Observable
   * Returns top-rated products (4.5+ stars), limited to 8 items
   */
  featuredProducts$;

  /**
   * Heritage Products Observable
   * Returns only UNESCO recognized heritage products
   */
  heritageProducts$;

  /**
   * Sale Products Observable
   * Returns products currently on sale (with discount)
   */
  saleProducts$;

  constructor(protected override store: ProductsStore) {
    super(store);

    // Initialize observables after parent constructor
    this.products$ = this.selectAll();
    this.loading$ = this.selectLoading();
    this.selectedCategory$ = this.select('selectedCategory');
    this.searchQuery$ = this.select('searchQuery');
    this.priceRange$ = this.select('priceRange');

    this.filteredProducts$ = combineLatest([
      this.selectAll(),
      this.select('selectedCategory'),
      this.select('searchQuery'),
      this.select('priceRange'),
      this.select('isHeritageOnly'),
      this.select('inStockOnly')
    ]).pipe(
      map(([products, category, search, priceRange, heritage, inStock]) => {
        return products.filter(product => {
          // Category filter
          if (category && product.category.slug !== category) return false;

          // Search filter (matches name, Arabic name, or description)
          if (search) {
            const query = search.toLowerCase();
            const matchesName = product.name.toLowerCase().includes(query);
            const matchesArabic = product.nameArabic?.toLowerCase().includes(query);
            const matchesDesc = product.description.toLowerCase().includes(query);
            if (!matchesName && !matchesArabic && !matchesDesc) return false;
          }

          // Price range filter
          if (priceRange) {
            if (product.price.amount < priceRange.min || product.price.amount > priceRange.max) {
              return false;
            }
          }

          // Heritage filter (UNESCO products only)
          if (heritage && !product.authenticity.isUNESCO) return false;

          // Stock filter (in-stock products only)
          if (inStock && !product.inventory.inStock) return false;

          return true;
        });
      })
    );

    this.featuredProducts$ = this.selectAll({
      filterBy: entity => entity.reviews.averageRating >= 4.5,
      limitTo: 8
    });

    this.heritageProducts$ = this.selectAll({
      filterBy: entity => !!entity.authenticity?.isUNESCO
    });

    this.saleProducts$ = this.selectAll({
      filterBy: entity => !!entity.price.discount
    });
  }

  /**
   * Get Single Product by Slug
   *
   * @param slug - Product URL slug
   * @returns Observable of product or undefined
   *
   * @example
   * this.productsQuery.getProductBySlug('damascus-steel-knife')
   *   .subscribe(product => console.log(product));
   */
  getProductBySlug(slug: string) {
    return this.selectEntity((entity: Product) => entity.slug === slug);
  }
}
