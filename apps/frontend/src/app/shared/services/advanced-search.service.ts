import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';
import {
  SearchSuggestion,
  SearchHistoryItem,
  SearchFilters,
  SearchResult,
  PopularSearch,
  VoiceSearchResult
} from '../interfaces/search.interface';
import { ProductsService } from '../../store/products/products.service';
import { MockDataService } from '../../core/mock-data/mock-data.service';

/**
 * Advanced Search Service
 *
 * Provides comprehensive search functionality including:
 * - Autocomplete suggestions
 * - Search history management
 * - Voice search support
 * - Advanced filtering
 * - Bilingual search (English/Arabic)
 * - Popular searches
 *
 * @swagger
 * tags:
 *   name: Search
 *   description: Advanced search operations
 *
 * @example
 * ```typescript
 * constructor(private searchService: AdvancedSearchService) {}
 *
 * ngOnInit() {
 *   // Search with autocomplete
 *   this.searchService.searchQuery$.pipe(
 *     debounceTime(300)
 *   ).subscribe(query => {
 *     this.suggestions = this.searchService.getSuggestions(query);
 *   });
 *
 *   // Get search results
 *   this.searchService.search('damascus steel', filters).subscribe(results => {
 *     console.log(results.products);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AdvancedSearchService {
  private productsService = inject(ProductsService);
  private mockDataService = inject(MockDataService);

  // Search state signals
  private readonly searchQuerySubject = new BehaviorSubject<string>('');
  readonly searchQuery$ = this.searchQuerySubject.asObservable();

  readonly searchQuery = signal<string>('');
  readonly isSearching = signal<boolean>(false);
  readonly recentSearches = signal<SearchHistoryItem[]>([]);
  readonly popularSearches = signal<PopularSearch[]>([]);

  private readonly SEARCH_HISTORY_KEY = 'souq_search_history';
  private readonly MAX_HISTORY_ITEMS = 10;
  private readonly MAX_SUGGESTIONS = 8;

  constructor() {
    this.loadSearchHistory();
    this.loadPopularSearches();
  }

  /**
   * Perform product search with filters
   *
   * @param query - Search query text
   * @param filters - Optional search filters
   * @param page - Page number (default: 1)
   * @param pageSize - Items per page (default: 20)
   * @returns Observable of search results
   *
   * @swagger
   * /api/search:
   *   get:
   *     summary: Search products
   *     parameters:
   *       - name: query
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *       - name: filters
   *         in: query
   *         schema:
   *           $ref: '#/components/schemas/SearchFilters'
   *     responses:
   *       200:
   *         description: Search results
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SearchResult'
   */
  search(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Observable<SearchResult> {
    this.isSearching.set(true);
    this.searchQuery.set(query);
    this.searchQuerySubject.next(query);

    const startTime = Date.now();

    return this.mockDataService.getProducts().pipe(
      map(products => {
        // Filter products based on query
        let filtered = this.filterByQuery(products, query);

        // Apply additional filters
        filtered = this.applyFilters(filtered, filters);

        // Sort results
        filtered = this.sortResults(filtered, filters.sortBy || 'relevance', query);

        // Save to history
        if (query.trim()) {
          this.addToHistory(query, filtered.length, filters.category);
        }

        // Pagination
        const start = (page - 1) * pageSize;
        const paginatedProducts = filtered.slice(start, start + pageSize);

        const result: SearchResult = {
          products: paginatedProducts,
          total: filtered.length,
          page,
          pageSize,
          filters,
          query,
          executionTime: Date.now() - startTime,
          suggestions: this.getSuggestions(query)
        };

        this.isSearching.set(false);
        return result;
      })
    );
  }

  /**
   * Get autocomplete suggestions
   *
   * @param query - Partial search query
   * @returns Array of search suggestions
   */
  getSuggestions(query: string): SearchSuggestion[] {
    if (!query || query.length < 2) {
      return this.getDefaultSuggestions();
    }

    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Get all products for suggestions (in real app, this would be optimized)
    this.mockDataService.getProducts().subscribe(products => {
      // Product name suggestions
      products.forEach(product => {
        const nameMatch = product.name.toLowerCase().includes(lowerQuery) ||
                         product.nameArabic?.toLowerCase().includes(lowerQuery);

        if (nameMatch && suggestions.length < this.MAX_SUGGESTIONS) {
          suggestions.push({
            text: product.name,
            type: 'product',
            productId: product.id,
            imageUrl: product.images[0]?.url,
            resultCount: 1
          });
        }
      });

      // Category suggestions
      const categories = new Set(products.map(p => p.category.name));
      categories.forEach(category => {
        if (category.toLowerCase().includes(lowerQuery) && suggestions.length < this.MAX_SUGGESTIONS) {
          const categorySlug = products.find(p => p.category.name === category)?.category.slug;
          suggestions.push({
            text: category,
            type: 'category',
            categorySlug,
            resultCount: products.filter(p => p.category.name === category).length
          });
        }
      });
    });

    // Recent searches matching query
    const recentMatches = this.recentSearches()
      .filter(item => item.query.toLowerCase().includes(lowerQuery))
      .slice(0, 2)
      .map(item => ({
        text: item.query,
        type: 'recent' as const,
        resultCount: item.resultsCount
      }));

    suggestions.push(...recentMatches);

    return suggestions.slice(0, this.MAX_SUGGESTIONS);
  }

  /**
   * Get default suggestions (recent + popular searches)
   */
  private getDefaultSuggestions(): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Recent searches
    this.recentSearches()
      .slice(0, 3)
      .forEach(item => {
        suggestions.push({
          text: item.query,
          type: 'recent',
          resultCount: item.resultsCount
        });
      });

    // Popular searches
    this.popularSearches()
      .slice(0, 5)
      .forEach(item => {
        suggestions.push({
          text: item.query,
          type: 'popular',
          resultCount: item.searchCount
        });
      });

    return suggestions;
  }

  /**
   * Voice search using Web Speech API
   *
   * @param language - Language for recognition ('en' or 'ar')
   * @returns Observable of voice search result
   */
  startVoiceSearch(language: 'en' | 'ar' = 'en'): Observable<VoiceSearchResult> {
    return new Observable(observer => {
      // Check browser support
      const SpeechRecognition = (window as any).SpeechRecognition ||
                                (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        observer.error(new Error('Speech recognition not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ar' ? 'ar-SY' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const result = event.results[0];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        const alternatives = Array.from(event.results[0])
          .slice(1)
          .map((alt: any) => alt.transcript);

        observer.next({
          transcript,
          confidence,
          alternatives,
          language
        });
        observer.complete();
      };

      recognition.onerror = (event: any) => {
        observer.error(event.error);
      };

      recognition.start();

      // Cleanup
      return () => {
        recognition.stop();
      };
    });
  }

  /**
   * Filter products by search query (bilingual)
   */
  private filterByQuery(products: Product[], query: string): Product[] {
    if (!query.trim()) return products;

    const lowerQuery = query.toLowerCase();
    const queryTerms = lowerQuery.split(' ').filter(term => term.length > 0);

    return products.filter(product => {
      const searchableText = [
        product.name,
        product.nameArabic || '',
        product.description,
        product.descriptionArabic || '',
        product.category.name,
        product.category.nameArabic || '',
        ...(product.tags || [])
      ].join(' ').toLowerCase();

      return queryTerms.every(term => searchableText.includes(term));
    });
  }

  /**
   * Apply advanced filters to products
   */
  private applyFilters(products: Product[], filters: SearchFilters): Product[] {
    let filtered = [...products];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(p => p.category.slug === filters.category);
    }

    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(p =>
        p.price.amount >= filters.priceRange!.min &&
        p.price.amount <= filters.priceRange!.max
      );
    }

    // Rating filter
    if (filters.minRating) {
      filtered = filtered.filter(p =>
        p.reviews.averageRating >= filters.minRating!
      );
    }

    // Stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(p => p.inventory.inStock);
    }

    // UNESCO filter
    if (filters.unescoOnly) {
      filtered = filtered.filter(p => p.authenticity.unescoRecognition);
    }

    // Certified filter
    if (filters.certifiedOnly) {
      filtered = filtered.filter(p => p.authenticity.certified);
    }

    // Regional filter
    if (filters.region) {
      filtered = filtered.filter(p =>
        p.seller.location.governorate === filters.region
      );
    }

    // Brand/Artisan filter
    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter(p =>
        filters.brands!.includes(p.seller.name)
      );
    }

    return filtered;
  }

  /**
   * Sort search results
   */
  private sortResults(
    products: Product[],
    sortBy: string,
    query: string
  ): Product[] {
    const sorted = [...products];

    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price.amount - b.price.amount);
      case 'price-desc':
        return sorted.sort((a, b) => b.price.amount - a.price.amount);
      case 'rating':
        return sorted.sort((a, b) => b.reviews.averageRating - a.reviews.averageRating);
      case 'newest':
        return sorted.sort((a, b) =>
          new Date(b.timestamps.created).getTime() - new Date(a.timestamps.created).getTime()
        );
      case 'relevance':
      default:
        // Calculate relevance score based on query match
        return sorted.sort((a, b) => {
          const scoreA = this.calculateRelevanceScore(a, query);
          const scoreB = this.calculateRelevanceScore(b, query);
          return scoreB - scoreA;
        });
    }
  }

  /**
   * Calculate relevance score for sorting
   */
  private calculateRelevanceScore(product: Product, query: string): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Exact name match (highest weight)
    if (product.name.toLowerCase() === lowerQuery) score += 100;
    else if (product.name.toLowerCase().includes(lowerQuery)) score += 50;

    // Category match
    if (product.category.name.toLowerCase().includes(lowerQuery)) score += 30;

    // Description match
    if (product.description.toLowerCase().includes(lowerQuery)) score += 10;

    // Rating bonus
    score += product.reviews.averageRating * 5;

    // UNESCO bonus
    if (product.authenticity.unescoRecognition) score += 10;

    return score;
  }

  /**
   * Add search to history
   */
  private addToHistory(query: string, resultsCount: number, category?: string): void {
    const history = this.recentSearches();

    // Remove duplicate if exists
    const filtered = history.filter(item => item.query !== query);

    // Add new search at the beginning
    const newHistory: SearchHistoryItem[] = [
      {
        query,
        timestamp: new Date(),
        resultsCount,
        category
      },
      ...filtered
    ].slice(0, this.MAX_HISTORY_ITEMS);

    this.recentSearches.set(newHistory);
    this.saveSearchHistory();
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.recentSearches.set([]);
    localStorage.removeItem(this.SEARCH_HISTORY_KEY);
  }

  /**
   * Remove item from history
   */
  removeFromHistory(query: string): void {
    const filtered = this.recentSearches().filter(item => item.query !== query);
    this.recentSearches.set(filtered);
    this.saveSearchHistory();
  }

  /**
   * Load search history from localStorage
   */
  private loadSearchHistory(): void {
    try {
      const stored = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        this.recentSearches.set(history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  /**
   * Save search history to localStorage
   */
  private saveSearchHistory(): void {
    try {
      localStorage.setItem(
        this.SEARCH_HISTORY_KEY,
        JSON.stringify(this.recentSearches())
      );
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Load popular searches (mock data)
   */
  private loadPopularSearches(): void {
    const popular: PopularSearch[] = [
      { query: 'Damascus steel knife', searchCount: 1250, trending: true, category: 'damascus-steel' },
      { query: 'Aleppo soap', searchCount: 980, trending: true, category: 'beauty-wellness' },
      { query: 'Syrian spices', searchCount: 750, trending: false, category: 'food-spices' },
      { query: 'Traditional crafts', searchCount: 620, trending: false, category: 'traditional-crafts' },
      { query: 'Brocade fabric', searchCount: 510, trending: false, category: 'textiles-fabrics' },
      { query: 'Pistachios', searchCount: 480, trending: true, category: 'nuts-snacks' },
      { query: 'Baklava', searchCount: 450, trending: false, category: 'sweets-desserts' }
    ];

    this.popularSearches.set(popular);
  }

  /**
   * Update search query
   */
  updateSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.searchQuerySubject.next(query);
  }

  /**
   * Clear search query
   */
  clearSearchQuery(): void {
    this.searchQuery.set('');
    this.searchQuerySubject.next('');
  }
}
