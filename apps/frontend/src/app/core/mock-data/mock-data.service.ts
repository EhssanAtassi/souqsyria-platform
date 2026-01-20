/**
 * Mock Data Service
 *
 * Centralized service for accessing all mock data
 * Provides unified API for products, categories, sellers, and campaigns
 *
 * @fileoverview Central mock data service for Syrian marketplace
 * @description Injectable service providing access to all mock data collections
 *
 * @swagger
 * components:
 *   schemas:
 *     MockDataService:
 *       type: object
 *       description: Service for accessing Syrian marketplace mock data
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Product, ProductCategory, ProductSeller } from '../../shared/interfaces/product.interface';
import { Campaign } from '../../shared/interfaces/campaign.interface';
import { SYRIAN_PRODUCTS, FEATURED_PRODUCTS, BESTSELLER_PRODUCTS, NEW_ARRIVAL_PRODUCTS, HERITAGE_PRODUCTS, SALE_PRODUCTS } from './data/syrian-products.data';
import { SYRIAN_SELLERS, TOP_RATED_SELLERS, VERIFIED_SELLERS } from './data/syrian-sellers.data';
import { SYRIAN_CATEGORIES, HERITAGE_CATEGORIES } from './data/syrian-categories.data';
import { SYRIAN_GOVERNORATES_DATA } from './data/syrian-regions.data';

/**
 * Filter options for product queries
 */
export interface ProductFilterOptions {
  /** Filter by category slug */
  categorySlug?: string;

  /** Filter by price range */
  priceRange?: {
    min: number;
    max: number;
  };

  /** Filter by heritage status */
  heritage?: boolean;

  /** Filter by UNESCO recognition */
  unesco?: boolean;

  /** Filter by in-stock status */
  inStock?: boolean;

  /** Filter by seller ID */
  sellerId?: string;

  /** Search query */
  search?: string;

  /** Sort by field */
  sortBy?: 'price' | 'rating' | 'name' | 'newest' | 'popularity';

  /** Sort order */
  sortOrder?: 'asc' | 'desc';

  /** Pagination: page number */
  page?: number;

  /** Pagination: items per page */
  limit?: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Mock Data Service
 * Provides centralized access to all Syrian marketplace mock data
 */
@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  /**
   * Simulated network delay (milliseconds)
   * Set to 0 for instant responses, 500-1000 for realistic simulation
   */
  private readonly NETWORK_DELAY = 300;

  constructor() {}

  // ==========================================
  // PRODUCT METHODS
  // ==========================================

  /**
   * Gets all products
   *
   * @returns Observable of all products
   *
   * @example
   * this.mockDataService.getProducts().subscribe(products => {
   *   console.log('All products:', products);
   * });
   */
  getProducts(): Observable<Product[]> {
    return of(SYRIAN_PRODUCTS).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets products with filtering, sorting, and pagination
   *
   * @param options - Filter and pagination options
   * @returns Observable of paginated products
   *
   * @example
   * this.mockDataService.getProductsFiltered({
   *   categorySlug: 'damascus-steel',
   *   inStock: true,
   *   page: 1,
   *   limit: 12
   * }).subscribe(response => {
   *   console.log('Products:', response.data);
   *   console.log('Total:', response.total);
   * });
   */
  getProductsFiltered(options: ProductFilterOptions = {}): Observable<PaginatedResponse<Product>> {
    let filtered = [...SYRIAN_PRODUCTS];

    // Apply filters
    if (options.categorySlug) {
      filtered = filtered.filter(p => p.category.slug === options.categorySlug);
    }

    if (options.priceRange) {
      filtered = filtered.filter(
        p => p.price.amount >= options.priceRange!.min && p.price.amount <= options.priceRange!.max
      );
    }

    if (options.heritage !== undefined) {
      filtered = filtered.filter(p => p.authenticity.heritage === 'traditional' === options.heritage);
    }

    if (options.unesco !== undefined) {
      filtered = filtered.filter(p => p.authenticity.unescoRecognition === options.unesco);
    }

    if (options.inStock !== undefined) {
      filtered = filtered.filter(p => p.inventory.inStock === options.inStock);
    }

    if (options.sellerId) {
      filtered = filtered.filter(p => p.seller.id === options.sellerId);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (options.sortBy) {
      filtered = this.sortProducts(filtered, options.sortBy, options.sortOrder || 'asc');
    }

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    const response: PaginatedResponse<Product> = {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    };

    return of(response).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets a single product by ID
   *
   * @param id - Product ID
   * @returns Observable of product or undefined
   */
  getProduct(id: string): Observable<Product | undefined> {
    const product = SYRIAN_PRODUCTS.find(p => p.id === id);
    return of(product).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets a single product by slug
   *
   * @param slug - Product slug
   * @returns Observable of product or undefined
   */
  getProductBySlug(slug: string): Observable<Product | undefined> {
    const product = SYRIAN_PRODUCTS.find(p => p.slug === slug);
    return of(product).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets featured products
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of featured products
   */
  getFeaturedProducts(limit?: number): Observable<Product[]> {
    const products = limit ? FEATURED_PRODUCTS.slice(0, limit) : FEATURED_PRODUCTS;
    return of(products).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets bestseller products
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of bestseller products
   */
  getBestsellers(limit?: number): Observable<Product[]> {
    const products = limit ? BESTSELLER_PRODUCTS.slice(0, limit) : BESTSELLER_PRODUCTS;
    return of(products).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets new arrival products
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of new arrival products
   */
  getNewArrivals(limit?: number): Observable<Product[]> {
    const products = limit ? NEW_ARRIVAL_PRODUCTS.slice(0, limit) : NEW_ARRIVAL_PRODUCTS;
    return of(products).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets heritage products
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of heritage products
   */
  getHeritageProducts(limit?: number): Observable<Product[]> {
    const products = limit ? HERITAGE_PRODUCTS.slice(0, limit) : HERITAGE_PRODUCTS;
    return of(products).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets products on sale
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of sale products
   */
  getSaleProducts(limit?: number): Observable<Product[]> {
    const products = limit ? SALE_PRODUCTS.slice(0, limit) : SALE_PRODUCTS;
    return of(products).pipe(delay(this.NETWORK_DELAY));
  }

  // ==========================================
  // CATEGORY METHODS
  // ==========================================

  /**
   * Gets all categories
   *
   * @returns Observable of all categories
   */
  getCategories(): Observable<ProductCategory[]> {
    return of(SYRIAN_CATEGORIES).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets a single category by slug
   *
   * @param slug - Category slug
   * @returns Observable of category or undefined
   */
  getCategory(slug: string): Observable<ProductCategory | undefined> {
    const category = SYRIAN_CATEGORIES.find(c => c.slug === slug);
    return of(category).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets heritage categories
   *
   * @returns Observable of heritage categories
   */
  getHeritageCategories(): Observable<ProductCategory[]> {
    return of(HERITAGE_CATEGORIES).pipe(delay(this.NETWORK_DELAY));
  }

  // ==========================================
  // SELLER METHODS
  // ==========================================

  /**
   * Gets all sellers
   *
   * @returns Observable of all sellers
   */
  getSellers(): Observable<ProductSeller[]> {
    return of(SYRIAN_SELLERS).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets a single seller by ID
   *
   * @param id - Seller ID
   * @returns Observable of seller or undefined
   */
  getSeller(id: string): Observable<ProductSeller | undefined> {
    const seller = SYRIAN_SELLERS.find(s => s.id === id);
    return of(seller).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets top-rated sellers
   *
   * @param limit - Maximum number of sellers to return
   * @returns Observable of top-rated sellers
   */
  getTopRatedSellers(limit?: number): Observable<ProductSeller[]> {
    const sellers = limit ? TOP_RATED_SELLERS.slice(0, limit) : TOP_RATED_SELLERS;
    return of(sellers).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets verified sellers
   *
   * @returns Observable of verified sellers
   */
  getVerifiedSellers(): Observable<ProductSeller[]> {
    return of(VERIFIED_SELLERS).pipe(delay(this.NETWORK_DELAY));
  }

  // ==========================================
  // REGION METHODS
  // ==========================================

  /**
   * Gets all Syrian governorates
   *
   * @returns Observable of governorates
   */
  getGovernorates(): Observable<any[]> {
    return of(SYRIAN_GOVERNORATES_DATA).pipe(delay(this.NETWORK_DELAY));
  }

  // ==========================================
  // CAMPAIGN METHODS (Placeholder for Day 2)
  // ==========================================

  /**
   * Gets active campaigns
   *
   * @returns Observable of active campaigns
   */
  getActiveCampaigns(): Observable<Campaign[]> {
    // To be implemented on Day 2
    return of([]).pipe(delay(this.NETWORK_DELAY));
  }

  /**
   * Gets hero campaigns
   *
   * @returns Observable of hero campaigns
   */
  getHeroCampaigns(): Observable<Campaign[]> {
    // To be implemented on Day 2
    return of([]).pipe(delay(this.NETWORK_DELAY));
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Sorts products array
   *
   * @param products - Products to sort
   * @param sortBy - Field to sort by
   * @param order - Sort order (asc/desc)
   * @returns Sorted products array
   */
  private sortProducts(
    products: Product[],
    sortBy: 'price' | 'rating' | 'name' | 'newest' | 'popularity',
    order: 'asc' | 'desc'
  ): Product[] {
    const sorted = [...products];
    const multiplier = order === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.price.amount - b.price.amount) * multiplier;
        case 'rating':
          return (a.reviews.averageRating - b.reviews.averageRating) * multiplier;
        case 'name':
          return a.name.localeCompare(b.name) * multiplier;
        case 'newest':
          return (a.timestamps.created.getTime() - b.timestamps.created.getTime()) * multiplier;
        case 'popularity':
          return (a.reviews.totalReviews - b.reviews.totalReviews) * multiplier;
        default:
          return 0;
      }
    });

    return sorted;
  }

  /**
   * Gets statistics about the mock data
   *
   * @returns Observable of data statistics
   */
  getStatistics(): Observable<{
    totalProducts: number;
    totalCategories: number;
    totalSellers: number;
    totalGovernorates: number;
  }> {
    const stats = {
      totalProducts: SYRIAN_PRODUCTS.length,
      totalCategories: SYRIAN_CATEGORIES.length,
      totalSellers: SYRIAN_SELLERS.length,
      totalGovernorates: SYRIAN_GOVERNORATES_DATA.length
    };
    return of(stats).pipe(delay(this.NETWORK_DELAY));
  }
}

/**
 * Export mock data service
 */
export default MockDataService;
