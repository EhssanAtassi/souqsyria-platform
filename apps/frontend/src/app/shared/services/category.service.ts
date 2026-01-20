import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap, take, catchError, tap } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';
import { CategoriesApiService } from '../../core/api/categories-api.service';
import {
  CategoryFilter,
  ProductSort,
  ProductPagination,
  ProductListingRequest,
  ProductListingResponse,
  AvailableFilters,
  SORT_OPTIONS,
  DEFAULT_PAGINATION,
  SYRIAN_GOVERNORATES,
  COMMON_MATERIALS
} from '../interfaces/category-filter.interface';
import { ProductsService } from '../../store/products/products.service';
import { ProductsQuery } from '../../store/products/products.query';

/**
 * Category service for Syrian marketplace
 * Handles category browsing, filtering, sorting, and pagination
 * 
 * @swagger
 * components:
 *   schemas:
 *     CategoryService:
 *       type: object
 *       description: Service for managing product categories and filtering
 *       properties:
 *         getProductsByCategory:
 *           type: function
 *           description: Retrieves filtered and sorted products by category
 *         getFilteredProducts:
 *           type: function
 *           description: Applies filters and sorting to product list
 *         getAvailableFilters:
 *           type: function
 *           description: Gets available filter options for current product set
 *         getCategoryInfo:
 *           type: function
 *           description: Retrieves category information and metadata
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {

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
      id: 'ceramics-pottery',
      name: 'Ceramics & Pottery',
      nameArabic: 'الخزف والفخار',
      slug: 'ceramics-pottery',
      breadcrumb: ['Home', 'Home & Kitchen', 'Ceramics'],
      description: 'Hand-thrown and painted Syrian ceramics featuring traditional geometric patterns and functional designs.',
      descriptionArabic: 'الخزف السوري المصنوع والمرسوم يدوياً والذي يتميز بالأنماط الهندسية التقليدية والتصاميم الوظيفية.'
    },
    {
      id: 'food-oils',
      name: 'Food & Oils',
      nameArabic: 'الطعام والزيوت',
      slug: 'food-oils',
      breadcrumb: ['Home', 'Food', 'Oils & Condiments'],
      description: 'Premium Syrian olive oils and condiments from ancient groves and traditional production methods.',
      descriptionArabic: 'زيوت الزيتون السورية الفاخرة والتوابل من البساتين القديمة وطرق الإنتاج التقليدية.'
    }
  ];

  private categoriesApi = inject(CategoriesApiService);

  constructor(
    private productsService: ProductsService,
    private productsQuery: ProductsQuery
  ) {}

  /**
   * Retrieves products by category with filtering, sorting, and pagination
   * Simulates comprehensive e-commerce category browsing experience
   *
   * @param request - Product listing request with filters and sorting
   * @returns Observable containing paginated and filtered product results
   */
  getProductsByCategory(request: ProductListingRequest): Observable<ProductListingResponse> {
    // Load products from Akita and wait for them to be available
    return this.productsService.loadProducts().pipe(
      switchMap(() => this.productsQuery.selectAll().pipe(take(1))),
      map((allProducts) => {
        const req = request;
        let filteredProducts = [...allProducts];
        
        // Apply category filter
        if (req.categorySlug) {
          filteredProducts = filteredProducts.filter(product => 
            product.category.slug === req.categorySlug
          );
        }
        
        // Apply search query filter
        if (req.searchQuery) {
          const searchTerm = req.searchQuery.toLowerCase();
          filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.nameArabic?.toLowerCase().includes(searchTerm) ||
            product.category.name.toLowerCase().includes(searchTerm) ||
            product.seller.name.toLowerCase().includes(searchTerm)
          );
        }
        
        // Apply filters
        if (req.filters) {
          filteredProducts = this.applyFilters(filteredProducts, req.filters);
        }
        
        // Apply sorting
        if (req.sort) {
          filteredProducts = this.applySorting(filteredProducts, req.sort);
        }
        
        // Calculate total before pagination
        const total = filteredProducts.length;
        
        // Apply pagination
        const page = req.pagination?.page || 1;
        const limit = req.pagination?.limit || 20;
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
        const category = req.categorySlug 
          ? this.categoryDefinitions.find(cat => cat.slug === req.categorySlug)
          : undefined;
        
        // Get available filters based on current results
        const availableFilters = this.getAvailableFilters(filteredProducts);
        
        return {
          products: paginatedProducts,
          pagination,
          appliedFilters: req.filters,
          appliedSort: req.sort,
          availableFilters,
          category
        } as ProductListingResponse;
      }),
      delay(700) // Simulate API delay
    );
  }

  /**
   * Applies filter criteria to product list
   * Handles comprehensive filtering including price, rating, availability, etc.
   * 
   * @param products - Array of products to filter
   * @param filters - Filter criteria to apply
   * @returns Filtered product array
   */
  private applyFilters(products: Product[], filters: CategoryFilter): Product[] {
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

  /**
   * Applies sorting to product list
   * Handles multiple sort criteria for Syrian marketplace
   * 
   * @param products - Array of products to sort
   * @param sort - Sorting criteria
   * @returns Sorted product array
   */
  private applySorting(products: Product[], sort: ProductSort): Product[] {
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
          // Use review count as popularity indicator
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
   * Generates available filter options based on current product set
   * Provides dynamic filter options for better user experience
   * 
   * @param products - Current filtered product set
   * @returns Available filter options
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

    const ratings = Object.entries(ratingCounts).map(([rating, count]) => ({
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
      materials.forEach(material => {
        acc[material] = (acc[material] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const materials = Object.entries(materialCounts)
      .map(([name, count]) => ({ name, count }))
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
   * Retrieves category information by slug
   * Provides category metadata for breadcrumbs and page headers
   * 
   * @param categorySlug - Category slug identifier
   * @returns Observable containing category information
   */
  getCategoryInfo(categorySlug: string): Observable<any> {
    const category = this.categoryDefinitions.find(cat => cat.slug === categorySlug);
    return of(category).pipe(delay(300));
  }

  /**
   * Gets all available categories for navigation
   * NOW CONNECTED TO REAL BACKEND API! ✅
   * Falls back to local definitions if API fails.
   *
   * @returns Observable containing array of all categories from MySQL
   */
  getAllCategories(): Observable<any[]> {
    return this.categoriesApi.getAllCategories().pipe(
      tap(categories => {
        console.log(`✅ Loaded ${categories.length} categories from MySQL backend`);
      }),
      catchError(error => {
        console.warn('⚠️ Failed to load categories from backend, using local definitions:', error);
        return of(this.categoryDefinitions);
      })
    );
  }

  /**
   * Gets predefined sorting options
   * Returns available sort options for UI display
   * 
   * @returns Array of sort options
   */
  getSortOptions(): ProductSort[] {
    return SORT_OPTIONS;
  }

  /**
   * Gets Syrian governorates for location filtering
   * Returns list of Syrian governorates for filter options
   * 
   * @returns Array of Syrian governorate names
   */
  getSyrianGovernorates(): string[] {
    return [...SYRIAN_GOVERNORATES];
  }

  /**
   * Gets common materials for filtering
   * Returns list of common Syrian product materials
   * 
   * @returns Array of common material names
   */
  getCommonMaterials(): string[] {
    return COMMON_MATERIALS;
  }
}