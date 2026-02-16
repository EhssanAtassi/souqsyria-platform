/**
 * Category Service (Concrete Implementation)
 *
 * @description Concrete implementation of AbstractCategoryService
 * Provides both mock (development) and real API methods
 *
 * @pattern Concrete Service Implementation
 * - Extends AbstractCategoryService
 * - Implements both mock and real API methods
 * - Environment flag controls which is used
 * - Client-side filtering and sorting for mock data
 *
 * @swagger
 * tags:
 *   - name: Category Service
 *     description: Category operations with mock/real API switching
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap, take, catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AbstractCategoryService } from './abstract-category.service';
import { Product } from '../../../shared/interfaces/product.interface';
import {
  CategoryFilter,
  ProductSort,
  ProductListingRequest,
  ProductListingResponse,
  ProductPagination,
  AvailableFilters,
  SORT_OPTIONS,
  SYRIAN_GOVERNORATES,
  COMMON_MATERIALS
} from '../../../shared/interfaces/category-filter.interface';
import { ProductsService } from '../../../store/products/products.service';
import { ProductsQuery } from '../../../store/products/products.query';
import { environment } from '../../../../environments/environment';
import { RELATED_CATEGORIES_CONFIG, getRelatedCategories } from '../config/related-categories.config';
import { CategorySEOMetaTags, BreadcrumbListStructuredData, ItemListStructuredData } from '../models/category.interface';

/**
 * Category Service
 *
 * @description Handles category browsing, filtering, sorting, and pagination
 * Supports both mock data (development) and real API (production)
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Concrete implementation of abstract service
 * - Environment-based mock/real API switching
 * - Client-side filtering for mock data
 * - Integration with Akita store for products
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService extends AbstractCategoryService {
  //#region Dependency Injection

  private readonly http = inject(HttpClient);
  private readonly productsService = inject(ProductsService);
  private readonly productsQuery = inject(ProductsQuery);

  //#endregion

  //#region Configuration

  private readonly apiUrl = environment.apiUrl;
  private readonly siteUrl = environment.production ? 'https://souqsyria.com' : 'http://localhost:4202';
  private readonly mockDelay = 700; // Simulate API delay

  /**
   * Syrian marketplace category definitions with metadata
   */
  private readonly categoryDefinitions = [
    {
      id: 'damascus-steel',
      name: 'Damascus Steel',
      nameArabic: 'الفولاذ الدمشقي',
      slug: 'damascus-steel',
      parent: 'traditional-crafts',
      breadcrumb: ['Home', 'Crafts', 'Damascus Steel'],
      description: 'World-renowned Damascus steel products handcrafted by master artisans using traditional techniques passed down through generations.',
      descriptionArabic: 'منتجات الفولاذ الدمشقي المشهورة عالمياً والمصنوعة يدوياً من قبل حرفيين ماهرين باستخدام التقنيات التقليدية الموروثة عبر الأجيال.'
    },
    {
      id: 'beauty-wellness',
      name: 'Beauty & Wellness',
      nameArabic: 'الجمال والعافية',
      slug: 'beauty-wellness',
      breadcrumb: ['Home', 'Beauty & Wellness'],
      description: 'Traditional Syrian beauty and wellness products including authentic Aleppo soap and natural skincare.',
      descriptionArabic: 'منتجات الجمال والعافية السورية التقليدية بما في ذلك الصابون الحلبي الأصيل ومنتجات العناية الطبيعية بالبشرة.'
    },
    {
      id: 'textiles-fabrics',
      name: 'Textiles & Fabrics',
      nameArabic: 'المنسوجات والأقمشة',
      slug: 'textiles-fabrics',
      breadcrumb: ['Home', 'Textiles'],
      description: 'Luxurious Syrian textiles including traditional brocade fabrics woven with gold and silver threads.',
      descriptionArabic: 'المنسوجات السورية الفاخرة بما في ذلك أقمشة البروكار التقليدية المنسوجة بخيوط الذهب والفضة.'
    },
    {
      id: 'food-spices',
      name: 'Food & Spices',
      nameArabic: 'الطعام والبهارات',
      slug: 'food-spices',
      breadcrumb: ['Home', 'Food', 'Spices & Seasonings'],
      description: 'Authentic Syrian spices and food products including traditional spice blends from Damascus markets.',
      descriptionArabic: 'البهارات والمنتجات الغذائية السورية الأصيلة بما في ذلك خلطات البهارات التقليدية من أسواق دمشق.'
    },
    {
      id: 'traditional-crafts',
      name: 'Traditional Crafts',
      nameArabic: 'الحرف التقليدية',
      slug: 'traditional-crafts',
      breadcrumb: ['Home', 'Crafts'],
      description: 'Handcrafted Syrian traditional items including woodwork, metalwork, and decorative arts.',
      descriptionArabic: 'الحرف السورية التقليدية المصنوعة يدوياً بما في ذلك الأعمال الخشبية والمعدنية والفنون الزخرفية.'
    },
    {
      id: 'jewelry-accessories',
      name: 'Jewelry & Accessories',
      nameArabic: 'المجوهرات والإكسسوارات',
      slug: 'jewelry-accessories',
      breadcrumb: ['Home', 'Jewelry'],
      description: 'Traditional Syrian jewelry crafted from precious metals with Arabic calligraphy and cultural motifs.',
      descriptionArabic: 'المجوهرات السورية التقليدية المصنوعة من المعادن النفيسة مع الخط العربي والزخارف الثقافية.'
    },
    {
      id: 'nuts-snacks',
      name: 'Nuts & Snacks',
      nameArabic: 'المكسرات والوجبات الخفيفة',
      slug: 'nuts-snacks',
      breadcrumb: ['Home', 'Food', 'Nuts & Snacks'],
      description: 'Premium Syrian nuts and healthy snacks from the finest groves.',
      descriptionArabic: 'المكسرات والوجبات الخفيفة السورية الممتازة من أفضل البساتين.'
    },
    {
      id: 'sweets-desserts',
      name: 'Sweets & Desserts',
      nameArabic: 'الحلويات والمعجنات',
      slug: 'sweets-desserts',
      breadcrumb: ['Home', 'Food', 'Sweets'],
      description: 'Traditional Syrian sweets and desserts prepared using authentic recipes.',
      descriptionArabic: 'الحلويات والمعجنات السورية التقليدية المحضرة باستخدام وصفات أصيلة.'
    }
  ];

  //#endregion

  //#region Product Listing Operations

  /**
   * Get products by category with filtering, sorting, and pagination
   * @description Delegates to mock or real API based on environment
   */
  getProductsByCategory(request: ProductListingRequest): Observable<ProductListingResponse> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockProductsByCategory(request)
      : this.http.get<{success: boolean; data: any[]; meta: {page: number; limit: number; total: number; totalPages: number}}>(
          `${this.apiUrl}/categories/${request.categorySlug}/products`,
          { params: this.buildRequestParams(request) }
        ).pipe(
          map(response => ({
            products: response.data,
            pagination: {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages,
              hasNext: response.meta.page < response.meta.totalPages,
              hasPrevious: response.meta.page > 1
            },
            appliedFilters: request.filters,
            appliedSort: request.sort,
            availableFilters: undefined,
            category: undefined
          } as ProductListingResponse))
        );
  }

  /**
   * Get mock products by category
   * @description Client-side filtering, sorting, and pagination
   */
  getMockProductsByCategory(request: ProductListingRequest): Observable<ProductListingResponse> {
    // Load products from Akita and wait for them to be available
    return this.productsService.loadProducts().pipe(
      switchMap(() => this.productsQuery.selectAll().pipe(take(1))),
      map((allProducts) => {
        let filteredProducts = [...allProducts];

        // Apply category filter
        if (request.categorySlug) {
          filteredProducts = filteredProducts.filter(product =>
            product.category.slug === request.categorySlug
          );
        }

        // Apply search query filter
        if (request.searchQuery) {
          const searchTerm = request.searchQuery.toLowerCase();
          filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.nameArabic?.toLowerCase().includes(searchTerm) ||
            product.category.name.toLowerCase().includes(searchTerm) ||
            product.seller.name.toLowerCase().includes(searchTerm)
          );
        }

        // Apply filters
        if (request.filters) {
          filteredProducts = this.applyFilters(filteredProducts, request.filters);
        }

        // Apply sorting
        if (request.sort) {
          filteredProducts = this.applySorting(filteredProducts, request.sort);
        }

        // Calculate total before pagination
        const total = filteredProducts.length;

        // Apply pagination
        const page = request.pagination?.page || 1;
        const limit = request.pagination?.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        // Build pagination info
        const pagination: ProductPagination = {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: endIndex < total,
          hasPrevious: page > 1
        };

        // Get category info
        const category = request.categorySlug
          ? this.categoryDefinitions.find(cat => cat.slug === request.categorySlug)
          : undefined;

        // Get available filters based on current results
        const availableFilters = this.getAvailableFilters(filteredProducts);

        return {
          products: paginatedProducts,
          pagination,
          appliedFilters: request.filters,
          appliedSort: request.sort,
          availableFilters,
          category
        } as ProductListingResponse;
      }),
      delay(this.mockDelay),
      tap(response => {
        console.log(`✅ Loaded ${response.products.length} of ${response.pagination.total} products for category: ${request.categorySlug}`);
      })
    );
  }

  /**
   * Build request parameters for API call
   */
  private buildRequestParams(request: ProductListingRequest): any {
    const params: any = {};

    if (request.searchQuery) params.search = request.searchQuery;
    if (request.pagination) {
      params.page = request.pagination.page;
      params.limit = request.pagination.limit;
    }
    if (request.sort) {
      // Map sort to backend sortBy format
      const sortMap: Record<string, string> = {
        'price-asc': 'price_asc',
        'price-desc': 'price_desc',
        'newest': 'newest',
        'popularity': 'popularity',
        'rating': 'rating',
      };
      params.sortBy = sortMap[`${request.sort.field}-${request.sort.direction}`] || request.sort.field || 'newest';
    }
    if (request.filters) {
      // Add price filter params
      if (request.filters.priceRange) {
        if (request.filters.priceRange.min > 0) params.minPrice = request.filters.priceRange.min;
        if (request.filters.priceRange.max < Infinity) params.maxPrice = request.filters.priceRange.max;
      }
      // Add other filter parameters
      Object.keys(request.filters).forEach(key => {
        if (key !== 'priceRange') {
          params[key] = request.filters![key as keyof CategoryFilter];
        }
      });
    }

    return params;
  }

  //#endregion

  //#region Category Information Operations

  /**
   * Get category information by slug
   */
  getCategoryInfo(categorySlug: string): Observable<any> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockCategoryInfo(categorySlug)
      : this.http.get<{success: boolean; data: any}>(`${this.apiUrl}/categories/by-slug/${categorySlug}`).pipe(
          map(response => response.data)
        );
  }

  /**
   * Get mock category information
   */
  getMockCategoryInfo(categorySlug: string): Observable<any> {
    const category = this.categoryDefinitions.find(cat => cat.slug === categorySlug);
    return of(category).pipe(delay(300));
  }

  /**
   * Get all categories
   */
  getAllCategories(): Observable<any[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockAllCategories()
      : this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  /**
   * Get mock all categories
   */
  getMockAllCategories(): Observable<any[]> {
    return of(this.categoryDefinitions).pipe(delay(300));
  }

  //#endregion

  //#region Filter Operations

  /**
   * Get available filters for current product set
   */
  getAvailableFilters(products: Product[]): AvailableFilters {
    if (products.length === 0) {
      return {
        priceRanges: { min: 0, max: 0, currency: 'USD' },
        ratings: [],
        categories: [],
        sellers: [],
        locations: [],
        materials: [],
        heritage: []
      };
    }

    // Calculate price range
    const prices = products.map(p => p.price.amount);
    const priceRanges = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: 'USD'
    };

    // Aggregate ratings
    const ratingCounts = products.reduce((acc, product) => {
      const rating = Math.floor(product.reviews.averageRating);
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const ratings = Object.entries(ratingCounts).map(([rating, count]: [string, number]) => ({
      value: parseInt(rating),
      count
    })).sort((a, b) => b.value - a.value);

    // Aggregate categories
    const categoryCounts = products.reduce((acc, product) => {
      const key = product.category.id;
      acc[key] = acc[key] || {
        id: product.category.id,
        name: product.category.name,
        nameArabic: product.category.nameArabic,
        count: 0
      };
      acc[key].count++;
      return acc;
    }, {} as Record<string, any>);

    const categories = Object.values(categoryCounts);

    // Aggregate sellers
    const sellerCounts = products.reduce((acc, product) => {
      const key = product.seller.id;
      acc[key] = acc[key] || {
        id: product.seller.id,
        name: product.seller.name,
        location: `${product.seller.location.city}, ${product.seller.location.governorate}`,
        count: 0,
        verified: product.seller.verified
      };
      acc[key].count++;
      return acc;
    }, {} as Record<string, any>);

    const sellers = Object.values(sellerCounts);

    // Aggregate locations
    const locationCounts = products.reduce((acc, product) => {
      const governorate = product.seller.location.governorate;
      acc[governorate] = (acc[governorate] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locations = Object.entries(locationCounts).map(([governorate, count]) => ({
      governorate,
      count
    }));

    // Aggregate materials
    const materialCounts = products.reduce((acc, product) => {
      const materials = product.specifications.materials || [];
      materials.forEach((material: string) => {
        acc[material] = (acc[material] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const materials = Object.entries(materialCounts)
      .map(([name, count]: [string, number]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate heritage
    const heritageCounts = products.reduce((acc, product) => {
      const heritage = product.authenticity.heritage;
      acc[heritage] = (acc[heritage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const heritage = Object.entries(heritageCounts).map(([type, count]) => ({
      type: type as 'traditional' | 'modern' | 'contemporary',
      count
    }));

    return {
      priceRanges,
      ratings,
      categories,
      sellers,
      locations,
      materials,
      heritage
    };
  }

  /**
   * Apply filters to product list
   */
  applyFilters(products: Product[], filters: CategoryFilter): Product[] {
    return products.filter(product => {
      // Price range filter
      if (filters.priceRange) {
        const price = product.price.amount;
        if (price < filters.priceRange.min || price > filters.priceRange.max) {
          return false;
        }
      }

      // Rating filter
      if (filters.ratings && filters.ratings.length > 0) {
        const minRating = Math.min(...filters.ratings);
        if (product.reviews.averageRating < minRating) {
          return false;
        }
      }

      // Availability filter
      if (filters.availability && filters.availability.length > 0) {
        if (!filters.availability.includes(product.inventory.status)) {
          return false;
        }
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(product.category.id)) {
          return false;
        }
      }

      // Seller filter
      if (filters.sellers && filters.sellers.length > 0) {
        if (!filters.sellers.includes(product.seller.id)) {
          return false;
        }
      }

      // Location filter (by seller location)
      if (filters.locations && filters.locations.length > 0) {
        if (!filters.locations.includes(product.seller.location.governorate)) {
          return false;
        }
      }

      // Heritage filter
      if (filters.heritage && filters.heritage.length > 0) {
        const heritage = product.authenticity.heritage as string;
        if (!filters.heritage.includes(heritage)) {
          return false;
        }
      }

      // Material filter
      if (filters.materials && filters.materials.length > 0) {
        const productMaterials = product.specifications.materials || [];
        const hasMatchingMaterial = filters.materials.some(filterMaterial =>
          productMaterials.some(productMaterial =>
            productMaterial.toLowerCase().includes(filterMaterial.toLowerCase())
          )
        );
        if (!hasMatchingMaterial) {
          return false;
        }
      }

      // Authenticity filter
      if (filters.authenticityOnly && !product.authenticity.certified) {
        return false;
      }

      // Free shipping filter
      if (filters.freeShippingOnly) {
        const hasEligibleShipping = product.shipping.methods.some(method =>
          product.price.amount >= (product.shipping.freeShippingThreshold?.amount || Infinity)
        );
        if (!hasEligibleShipping) {
          return false;
        }
      }

      // On sale filter
      if (filters.onSaleOnly && !product.price.discount) {
        return false;
      }

      // UNESCO filter
      if (filters.unescoOnly && !product.authenticity.unescoRecognition) {
        return false;
      }

      return true;
    });
  }

  //#endregion

  //#region Sorting Operations

  /**
   * Apply sorting to product list
   */
  applySorting(products: Product[], sort: ProductSort): Product[] {
    return [...products].sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'price':
          comparison = a.price.amount - b.price.amount;
          break;
        case 'rating':
          comparison = a.reviews.averageRating - b.reviews.averageRating;
          break;
        case 'popularity':
          comparison = a.reviews.totalReviews - b.reviews.totalReviews;
          break;
        case 'newest':
          comparison = a.timestamps.created.getTime() - b.timestamps.created.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'reviews':
          comparison = a.reviews.totalReviews - b.reviews.totalReviews;
          break;
        default:
          comparison = 0;
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get sorting options
   */
  getSortOptions(): ProductSort[] {
    return SORT_OPTIONS;
  }

  //#endregion

  //#region Syrian Marketplace Specific Operations

  /**
   * Get Syrian governorates
   */
  getSyrianGovernorates(): string[] {
    return [...SYRIAN_GOVERNORATES];
  }

  /**
   * Get common materials
   */
  getCommonMaterials(): string[] {
    return COMMON_MATERIALS;
  }

  /**
   * Get heritage types
   */
  getHeritageTypes(): string[] {
    return ['traditional', 'modern', 'contemporary'];
  }

  //#endregion

  //#region Related Products Operations

  /**
   * Get related categories
   */
  getRelatedCategories(currentCategorySlug: string, limit: number = 4): Observable<any[]> {
    return environment.enableMockData || environment.forceOfflineMode
      ? this.getMockRelatedCategories(currentCategorySlug, limit)
      : this.http.get<any[]>(`${this.apiUrl}/categories/${currentCategorySlug}/related`, {
          params: { limit: limit.toString() }
        });
  }

  /**
   * Get mock related categories
   */
  getMockRelatedCategories(currentCategorySlug: string, limit: number = 4): Observable<any[]> {
    const related = getRelatedCategories(currentCategorySlug, limit);
    return of(related).pipe(delay(300));
  }

  //#endregion

  //#region Analytics Operations

  trackCategoryView(categorySlug: string, productCount: number): Observable<void> {
    console.log(`📊 Track category view: ${categorySlug} (${productCount} products)`);
    return of(void 0);
  }

  trackFilterUsage(categorySlug: string, filters: CategoryFilter): Observable<void> {
    console.log(`📊 Track filter usage: ${categorySlug}`, filters);
    return of(void 0);
  }

  trackSortUsage(categorySlug: string, sort: ProductSort): Observable<void> {
    console.log(`📊 Track sort usage: ${categorySlug}`, sort);
    return of(void 0);
  }

  trackPaginationUsage(categorySlug: string, page: number, limit: number): Observable<void> {
    console.log(`📊 Track pagination: ${categorySlug} (page ${page}, limit ${limit})`);
    return of(void 0);
  }

  //#endregion

  //#region SEO Operations

  /**
   * Generate SEO meta tags for category page
   * @description Creates complete SEO metadata for category pages
   * @param category - Category information with name, nameArabic, slug, and description
   * @param products - Array of products to extract featured image
   * @param totalProducts - Total number of products in category
   * @returns SEO meta tags with Open Graph and Twitter Card data
   */
  generateSEOMetaTags(
    category: { name: string; nameArabic: string; slug: string; description: string },
    products: Product[],
    totalProducts: number
  ): CategorySEOMetaTags {
    const title = `${category.name} - Syrian Marketplace | ${totalProducts} Authentic Products`;
    const description = `${category.description} Browse ${totalProducts} authentic Syrian products in ${category.name}. UNESCO-recognized crafts, traditional items, and more.`;
    const url = `${this.siteUrl}/category/${category.slug}`;
    const imageUrl = products.length > 0 && products[0].images.length > 0
      ? products[0].images[0].url
      : `${this.siteUrl}/assets/default-category.jpg`;

    return {
      title,
      description,
      keywords: `Syrian ${category.name}, authentic Syrian products, UNESCO heritage, traditional crafts, ${category.nameArabic}`,
      canonicalUrl: url,
      openGraph: {
        title,
        description,
        url,
        image: imageUrl,
        type: 'website',
        siteName: 'SouqSyria - Syrian Marketplace'
      },
      twitterCard: {
        card: 'summary_large_image',
        title,
        description,
        image: imageUrl
      }
    };
  }

  /**
   * Generate structured data for category page
   * @description Creates JSON-LD structured data for Google rich results
   * @param category - Category information with name, slug, and description
   * @param products - Array of products to include in structured data
   * @returns Structured data object with breadcrumbs and product list
   */
  generateStructuredData(
    category: { name: string; nameArabic: string; slug: string; description: string },
    products: Product[]
  ): { '@context': string; '@graph': Array<BreadcrumbListStructuredData | ItemListStructuredData> } {
    const breadcrumbList: BreadcrumbListStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': this.siteUrl
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': category.name,
          'item': `${this.siteUrl}/category/${category.slug}`
        }
      ]
    };

    const itemList: ItemListStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': `${category.name} Products`,
      'description': category.description,
      'numberOfItems': products.length,
      'itemListElement': products.slice(0, 12).map((product, index) => ({
        '@type': 'Product',
        'position': index + 1,
        'name': product.name,
        'description': product.description,
        'image': product.images.length > 0 ? product.images[0].url : '',
        'url': `${this.siteUrl}/product/${product.slug}`,
        'offers': {
          '@type': 'Offer',
          'price': product.price.amount,
          'priceCurrency': product.price.currency,
          'availability': product.inventory.status === 'in_stock'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          'seller': {
            '@type': 'Organization',
            'name': product.seller.name
          }
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': product.reviews.averageRating,
          'reviewCount': product.reviews.totalReviews
        }
      }))
    };

    return {
      '@context': 'https://schema.org',
      '@graph': [breadcrumbList, itemList]
    };
  }

  //#endregion
}
