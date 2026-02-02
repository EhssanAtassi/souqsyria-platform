/**
 * @fileoverview Header-specific interfaces for SouqSyria e-commerce platform
 * @description TypeScript interfaces for header components including quick access items,
 * search suggestions, recent searches, top bar links, and aggregated header data.
 *
 * @swagger
 * components:
 *   schemas:
 *     QuickAccessItem:
 *       type: object
 *       required: [id, label, labelAr, icon, iconColor, url, displayOrder, isActive]
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the quick access item
 *         label:
 *           type: string
 *           description: Display label in English
 *         labelAr:
 *           type: string
 *           description: Display label in Arabic
 *         icon:
 *           type: string
 *           description: Material icon name
 *         iconColor:
 *           type: string
 *           description: Tailwind color class for the icon
 *         bgColor:
 *           type: string
 *           description: Tailwind background color class for the tile
 *         badge:
 *           type: string
 *           description: Optional badge text
 *         badgeClass:
 *           type: string
 *           description: CSS class for badge gradient
 *         url:
 *           type: string
 *           description: Navigation URL
 *         displayOrder:
 *           type: number
 *           description: Sort order for display
 *         isActive:
 *           type: boolean
 *           description: Whether this item is currently visible
 *         isHighlighted:
 *           type: boolean
 *           description: Whether this item uses the highlighted gradient style
 *     SearchSuggestion:
 *       type: object
 *       required: [text, type]
 *       properties:
 *         text:
 *           type: string
 *           description: Suggestion display text
 *         type:
 *           type: string
 *           enum: [product, category, brand, query]
 *           description: Type of suggestion for icon display
 *         categoryId:
 *           type: string
 *           description: Associated category ID
 *         imageUrl:
 *           type: string
 *           description: Optional thumbnail image URL
 *         url:
 *           type: string
 *           description: Direct navigation URL
 *     RecentSearch:
 *       type: object
 *       required: [id, query, searchedAt]
 *       properties:
 *         id:
 *           type: string
 *           description: Unique search record ID
 *         query:
 *           type: string
 *           description: Search query text
 *         searchedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the search
 *     TopBarLink:
 *       type: object
 *       required: [id, label, labelAr, url]
 *       properties:
 *         id:
 *           type: string
 *           description: Link identifier for analytics
 *         label:
 *           type: string
 *           description: Display text in English
 *         labelAr:
 *           type: string
 *           description: Display text in Arabic
 *         url:
 *           type: string
 *           description: Navigation URL
 *         icon:
 *           type: string
 *           description: Optional Material icon name
 *         isHighlighted:
 *           type: boolean
 *           description: Whether this link gets accent styling
 *         isPremium:
 *           type: boolean
 *           description: Whether this is a premium/special link
 */

/**
 * Quick access item displayed in Row 4 carousel
 * @description Represents an icon tile in the quick access horizontal scroll area
 */
export interface QuickAccessItem {
  /** Unique identifier */
  id: string;
  /** Display label in English (supports line breaks via \n) */
  label: string;
  /** Display label in Arabic */
  labelAr: string;
  /** Material icon name */
  icon: string;
  /** Tailwind color class for the icon (e.g., 'text-primary-400') */
  iconColor: string;
  /** Tailwind background color class for the tile (e.g., 'bg-white') */
  bgColor?: string;
  /** Optional badge text (e.g., 'NEW', '50% OFF') */
  badge?: string;
  /** CSS class for badge gradient (e.g., 'badge-gold') */
  badgeClass?: string;
  /** Navigation URL */
  url: string;
  /** Sort order for display */
  displayOrder: number;
  /** Whether this item is currently visible */
  isActive: boolean;
  /** Whether this item uses the highlighted gradient style (golden bg) */
  isHighlighted?: boolean;
}

/**
 * Search suggestion returned from autocomplete API
 * @description Represents a single suggestion in the search dropdown
 */
export interface SearchSuggestion {
  /** Suggestion display text */
  text: string;
  /** Type of suggestion for icon and styling */
  type: 'product' | 'category' | 'brand' | 'query';
  /** Associated category ID for filtering */
  categoryId?: string;
  /** Optional thumbnail image URL */
  imageUrl?: string;
  /** Direct navigation URL (if clicking should navigate directly) */
  url?: string;
}

/**
 * Recent search entry stored per user
 * @description Represents a previously executed search query
 */
export interface RecentSearch {
  /** Unique search record ID */
  id: string;
  /** Search query text */
  query: string;
  /** Timestamp of when the search was performed */
  searchedAt: Date;
}

/**
 * Top bar navigation link
 * @description Represents a link in the Row 1 top bar area
 */
export interface TopBarLink {
  /** Link identifier for analytics tracking */
  id: string;
  /** Display text in English */
  label: string;
  /** Display text in Arabic */
  labelAr: string;
  /** Navigation URL or route path */
  url: string;
  /** Optional Material icon name */
  icon?: string;
  /** Whether this link gets accent/highlighted styling (e.g., "Become a Seller") */
  isHighlighted?: boolean;
  /** Whether this is a premium/special link (e.g., "SouqSyria Premium") */
  isPremium?: boolean;
}

/**
 * Aggregated header data response from the backend
 * @description Combined response containing all data needed to render the header
 */
export interface HeaderData {
  /** Quick access items for Row 4 */
  quickAccessItems: QuickAccessItem[];
  /** Top bar navigation links */
  topBarLinks: TopBarLink[];
  /** Cart item count */
  cartCount: number;
  /** Wishlist item count */
  wishlistCount: number;
  /** User's recent searches */
  recentSearches: RecentSearch[];
}

/**
 * Search request parameters
 * @description Parameters sent to the search suggestions API
 */
export interface SearchSuggestionParams {
  /** Search query string */
  query: string;
  /** Maximum number of suggestions to return */
  limit?: number;
  /** Optional category filter */
  categoryId?: string;
}
