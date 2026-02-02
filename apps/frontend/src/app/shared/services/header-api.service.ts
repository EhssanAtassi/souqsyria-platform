import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError } from 'rxjs';
import {
  QuickAccessItem,
  SearchSuggestion,
  RecentSearch,
  TopBarLink,
  HeaderData,
  SearchSuggestionParams
} from '../interfaces/header.interfaces';
import { environment } from '../../../environments/environment';

/**
 * Header API Service for SouqSyria
 *
 * @description Provides data for all header components including search suggestions,
 * recent searches, quick access items, and top bar links. Currently uses mock data;
 * will be swapped to real API calls when backend endpoints are ready.
 *
 * @swagger
 * tags:
 *   - name: Header
 *     description: Header data aggregation and search endpoints
 * paths:
 *   /api/header/data:
 *     get:
 *       summary: Get aggregated header data
 *       tags: [Header]
 *       responses:
 *         200:
 *           description: Combined header data
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/HeaderData'
 *   /api/search/suggestions:
 *     get:
 *       summary: Get search autocomplete suggestions
 *       tags: [Header]
 *       parameters:
 *         - name: query
 *           in: query
 *           required: true
 *           schema:
 *             type: string
 *         - name: limit
 *           in: query
 *           schema:
 *             type: number
 *             default: 8
 *       responses:
 *         200:
 *           description: Search suggestions list
 *   /api/search/recent:
 *     get:
 *       summary: Get user's recent searches
 *       tags: [Header]
 *       responses:
 *         200:
 *           description: Recent searches list
 *     post:
 *       summary: Save a new search query
 *       tags: [Header]
 *     delete:
 *       summary: Delete a recent search
 *       tags: [Header]
 *   /api/quick-access:
 *     get:
 *       summary: Get quick access carousel items
 *       tags: [Header]
 *       responses:
 *         200:
 *           description: Quick access items list
 */
@Injectable({
  providedIn: 'root'
})
export class HeaderApiService {

  /** Base URL for backend API */
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3001/api';

  constructor(private readonly http: HttpClient) {}

  /** Mock top bar navigation links matching prototype Row 1 */
  private readonly mockTopBarLinks: TopBarLink[] = [
    { id: 'orders', label: 'My Orders', labelAr: 'طلباتي', url: '/account/orders' },
    { id: 'deals', label: 'Super Deals', labelAr: 'عروض خاصة', url: '/deals' },
    { id: 'seller', label: 'Become a Seller', labelAr: 'كن بائعاً', url: '/seller/register', isHighlighted: true },
    { id: 'help', label: 'Help', labelAr: 'مساعدة', url: '/help' },
    { id: 'premium', label: 'SouqSyria Premium', labelAr: 'سوق سوريا بريميوم', url: '/premium', isPremium: true }
  ];

  /** Mock quick access items matching prototype Row 4 */
  private readonly mockQuickAccessItems: QuickAccessItem[] = [
    {
      id: 'damascus-steel', label: 'Damascus\nSteel', labelAr: 'فولاذ\nدمشقي',
      icon: 'carpenter', iconColor: 'text-primary-400', url: '/category/damascus-steel',
      displayOrder: 1, isActive: true
    },
    {
      id: 'aleppo-soap', label: 'Aleppo\nSoap', labelAr: 'صابون\nحلبي',
      icon: 'spa', iconColor: 'text-pink-400', url: '/category/beauty-wellness/aleppo-soap',
      displayOrder: 2, isActive: true
    },
    {
      id: 'syrian-brocade', label: 'Syrian\nBrocade', labelAr: 'بروكار\nسوري',
      icon: 'checkroom', iconColor: 'text-amber-500', url: '/category/textiles-fabrics/damascus-brocade',
      displayOrder: 3, isActive: true
    },
    {
      id: 'organic-spices', label: 'Organic\nSpices', labelAr: 'توابل\nعضوية',
      icon: 'eco', iconColor: 'text-green-500', url: '/category/food-spices',
      displayOrder: 4, isActive: true
    },
    {
      id: 'handmade-jewelry', label: 'Handmade\nJewelry', labelAr: 'مجوهرات\nيدوية',
      icon: 'diamond', iconColor: 'text-yellow-500', url: '/category/jewelry-accessories',
      displayOrder: 5, isActive: true
    },
    {
      id: 'syrian-sweets', label: 'Syrian\nSweets', labelAr: 'حلويات\nسورية',
      icon: 'cake', iconColor: 'text-orange-400', url: '/category/sweets-desserts',
      displayOrder: 6, isActive: true
    },
    {
      id: 'best-deals', label: 'Best\nDeals', labelAr: 'أفضل\nالعروض',
      icon: 'percent', iconColor: 'text-white', url: '/deals',
      displayOrder: 7, isActive: true, isHighlighted: true
    },
    {
      id: 'free-shipping', label: 'Free\nShipping', labelAr: 'شحن\nمجاني',
      icon: 'local_shipping', iconColor: 'text-purple-400', url: '/free-shipping',
      displayOrder: 8, isActive: true
    },
    {
      id: 'top-brands', label: 'Top\nBrands', labelAr: 'أفضل\nالعلامات',
      icon: 'favorite', iconColor: 'text-red-400', url: '/brands',
      displayOrder: 9, isActive: true
    },
    {
      id: 'new-arrivals', label: 'New\nArrivals', labelAr: 'وصل\nحديثاً',
      icon: 'new_releases', iconColor: 'text-blue-400', url: '/new-arrivals',
      displayOrder: 10, isActive: true
    }
  ];

  /** Mock recent searches */
  private mockRecentSearches: RecentSearch[] = [
    { id: '1', query: 'Damascus steel knife', searchedAt: new Date(Date.now() - 3600000) },
    { id: '2', query: 'Aleppo soap gift set', searchedAt: new Date(Date.now() - 7200000) },
    { id: '3', query: 'Syrian baklava', searchedAt: new Date(Date.now() - 86400000) }
  ];

  /**
   * Get aggregated header data
   * @description Fetches all data needed to render the header in a single call
   * @returns Observable<HeaderData> Combined header data
   */
  getHeaderData(): Observable<HeaderData> {
    return of({
      quickAccessItems: this.mockQuickAccessItems,
      topBarLinks: this.mockTopBarLinks,
      cartCount: 3,
      wishlistCount: 5,
      recentSearches: this.mockRecentSearches
    }).pipe(delay(100));
  }

  /**
   * Get top bar navigation links
   * @description Fetches the links displayed in Row 1 top bar
   * @returns Observable<TopBarLink[]> Top bar links
   */
  getTopBarLinks(): Observable<TopBarLink[]> {
    return of(this.mockTopBarLinks);
  }

  /**
   * Get quick access carousel items
   * @description Fetches items for the Row 4 quick access horizontal scroll.
   * Now uses real backend API with fallback to mock data for resilience.
   * @returns Observable<QuickAccessItem[]> Quick access items sorted by displayOrder
   */
  getQuickAccessItems(): Observable<QuickAccessItem[]> {
    // Try to fetch from real API first
    return this.http.get<any[]>(`${this.apiUrl}/quick-access`).pipe(
      map(items => {
        // Transform backend response to match frontend interface
        return items.map(item => ({
          id: item.id,
          label: item.titleEn,
          labelAr: item.titleAr,
          icon: this.getIconFromBadgeClass(item.badgeClass),
          iconColor: this.getIconColorFromBadgeClass(item.badgeClass),
          url: item.url,
          displayOrder: item.displayOrder,
          isActive: item.isActive,
          isHighlighted: item.badgeClass === 'badge-gold' || item.badgeClass === 'badge-red',
          // Store original backend data for potential use
          categoryEn: item.categoryEn,
          categoryAr: item.categoryAr,
          subtitleEn: item.subtitleEn,
          subtitleAr: item.subtitleAr,
          image: item.image,
          badgeClass: item.badgeClass
        }));
      }),
      catchError(error => {
        // If API fails, fallback to mock data
        console.warn('Quick access API failed, using mock data:', error);
        const active = this.mockQuickAccessItems
          .filter(item => item.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        return of(active);
      })
    );
  }

  /**
   * Map badge class to icon name
   * @private
   */
  private getIconFromBadgeClass(badgeClass: string): string {
    const iconMap: Record<string, string> = {
      'badge-gold': 'star',
      'badge-orange': 'restaurant',
      'badge-green': 'eco',
      'badge-purple': 'workspace_premium',
      'badge-blue': 'verified',
      'badge-red': 'local_offer',
      'badge-teal': 'new_releases',
      'badge-pink': 'favorite'
    };
    return iconMap[badgeClass] || 'category';
  }

  /**
   * Map badge class to icon color
   * @private
   */
  private getIconColorFromBadgeClass(badgeClass: string): string {
    const colorMap: Record<string, string> = {
      'badge-gold': 'text-yellow-500',
      'badge-orange': 'text-orange-400',
      'badge-green': 'text-green-500',
      'badge-purple': 'text-purple-400',
      'badge-blue': 'text-blue-400',
      'badge-red': 'text-red-400',
      'badge-teal': 'text-teal-400',
      'badge-pink': 'text-pink-400'
    };
    return colorMap[badgeClass] || 'text-gray-500';
  }

  /**
   * Get search autocomplete suggestions
   * @description Fetches search suggestions based on query input
   * @param params - Search parameters including query and optional filters
   * @returns Observable<SearchSuggestion[]> Matching suggestions
   */
  getSearchSuggestions(params: SearchSuggestionParams): Observable<SearchSuggestion[]> {
    const { query, limit = 8 } = params;
    const lowerQuery = query.toLowerCase();

    /** Mock product/category suggestions based on query */
    const allSuggestions: SearchSuggestion[] = [
      { text: 'Damascus Steel Chef Knife', type: 'product', categoryId: 'damascus-steel', url: '/product/damascus-steel-chef-knife' },
      { text: 'Damascus Steel', type: 'category', categoryId: 'damascus-steel', url: '/category/damascus-steel' },
      { text: 'Aleppo Soap Traditional', type: 'product', categoryId: 'beauty-wellness', url: '/product/aleppo-soap-traditional' },
      { text: 'Aleppo Soap', type: 'category', categoryId: 'beauty-wellness', url: '/category/beauty-wellness/aleppo-soap' },
      { text: 'Syrian Baklava Gift Box', type: 'product', categoryId: 'sweets-desserts', url: '/product/syrian-baklava-gift-box' },
      { text: 'Syrian Brocade Fabric', type: 'product', categoryId: 'textiles-fabrics', url: '/product/damascus-brocade' },
      { text: 'Organic Za\'atar Blend', type: 'product', categoryId: 'food-spices', url: '/product/zaatar-blend' },
      { text: 'Handmade Jewelry', type: 'category', categoryId: 'jewelry-accessories', url: '/category/jewelry-accessories' },
      { text: 'Rose Water Damascus', type: 'product', categoryId: 'beauty-wellness', url: '/product/damascus-rose-water' },
      { text: 'Traditional Oud Perfume', type: 'product', categoryId: 'beauty-wellness', url: '/product/traditional-oud' },
      { text: 'Pistachio Aleppo Premium', type: 'product', categoryId: 'nuts-snacks', url: '/product/aleppo-pistachios' },
      { text: 'Mosaic Chess Set', type: 'product', categoryId: 'traditional-crafts', url: '/product/mosaic-chess-set' }
    ];

    const filtered = allSuggestions
      .filter(s => s.text.toLowerCase().includes(lowerQuery))
      .slice(0, limit);

    return of(filtered).pipe(delay(150));
  }

  /**
   * Get user's recent searches
   * @description Fetches the current user's recent search history
   * @returns Observable<RecentSearch[]> Recent searches sorted by date
   */
  getRecentSearches(): Observable<RecentSearch[]> {
    return of([...this.mockRecentSearches].sort(
      (a, b) => b.searchedAt.getTime() - a.searchedAt.getTime()
    ));
  }

  /**
   * Save a search query to recent searches
   * @description Adds a new search query to the user's recent search history
   * @param query - Search query text to save
   * @returns Observable<RecentSearch> The saved search record
   */
  saveRecentSearch(query: string): Observable<RecentSearch> {
    const existing = this.mockRecentSearches.find(s => s.query === query);
    if (existing) {
      existing.searchedAt = new Date();
      return of(existing);
    }

    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query,
      searchedAt: new Date()
    };
    this.mockRecentSearches.unshift(newSearch);

    /** Keep only the most recent 10 searches */
    if (this.mockRecentSearches.length > 10) {
      this.mockRecentSearches = this.mockRecentSearches.slice(0, 10);
    }

    return of(newSearch);
  }

  /**
   * Delete a recent search entry
   * @description Removes a search query from the user's recent search history
   * @param searchId - ID of the search record to delete
   * @returns Observable<boolean> Whether the deletion was successful
   */
  deleteRecentSearch(searchId: string): Observable<boolean> {
    const index = this.mockRecentSearches.findIndex(s => s.id === searchId);
    if (index >= 0) {
      this.mockRecentSearches.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  /**
   * Clear all recent searches for the current user
   * @description Removes all entries from the user's recent search history
   * @returns Observable<boolean> Whether the clear was successful
   */
  clearRecentSearches(): Observable<boolean> {
    this.mockRecentSearches = [];
    return of(true);
  }
}
