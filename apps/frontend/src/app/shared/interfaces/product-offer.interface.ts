/**
 * Product Offer Interface
 *
 * Represents a promotional product offer displayed in horizontal row layout.
 * Supports 3 different price display formats matching Figma design.
 *
 * Usage in components:
 * ```typescript
 * offers: ProductOffer[] = [
 *   {
 *     id: 1,
 *     title: 'Damascus Steel',
 *     priceDisplay: { type: 'discount', ... },
 *     targetUrl: '/products?category=damascus-steel'
 *   }
 * ];
 * ```
 */

/**
 * Price Display Type Enum
 * - discount: Shows original price, discounted price, and percentage badge
 * - sale: Shows "SALE UP TO X% Off" message
 * - price: Shows "PRICE JUST $X.XX" simple price display
 */
export type PriceDisplayType = 'discount' | 'sale' | 'price';

/**
 * Price Display Configuration
 * Flexible union type supporting 3 different price display formats
 */
export interface PriceDisplay {
  /** Type of price display (determines which fields are used) */
  type: PriceDisplayType;

  // ===== DISCOUNT TYPE FIELDS (Left card in Figma) =====
  /** Discount badge text (e.g., "40%\nOFF") */
  discountBadge?: string;

  /** Badge background color (hex) */
  badgeColor?: string;

  /** Original price before discount */
  originalPrice?: number;

  /** Price after discount */
  discountedPrice?: number;

  // ===== SALE TYPE FIELDS (Middle card in Figma) =====
  /** Sale label text (e.g., "SALE UP TO") */
  saleLabel?: string;

  /** Sale percentage text (e.g., "40% Off") */
  salePercentage?: string;

  // ===== PRICE TYPE FIELDS (Right card in Figma) =====
  /** Price label text (e.g., "PRICE JUST") */
  priceLabel?: string;

  /** Simple price value */
  price?: number;

  /** Currency code (default: 'USD') */
  currency?: string;
}

/**
 * Product Offer Interface
 *
 * Complete data model for a promotional product offer card
 */
export interface ProductOffer {
  /** Unique offer identifier */
  id: number;

  /** Product/offer title (English) */
  title: string;

  /** Product/offer title (Arabic) */
  titleAr: string;

  /** Product image URL (large, high-quality) */
  image: string;

  /** Price display configuration (flexible format) */
  priceDisplay: PriceDisplay;

  /** Call-to-action button text (English) */
  ctaText: string;

  /** Call-to-action button text (Arabic) */
  ctaTextAr: string;

  /** Target URL for navigation (product list page) */
  targetUrl: string;

  /**
   * Optional query parameters for filtering products
   * Example: { category: 'damascus-steel', sale: true }
   */
  filterParams?: Record<string, any>;

  /** Optional subtitle for additional context */
  subtitle?: string;

  /** Optional subtitle in Arabic */
  subtitleAr?: string;

  /** Whether offer is currently active (affects clickability) */
  isActive?: boolean;
}

/**
 * Product Offer Click Event
 * Emitted when user clicks on an offer card
 */
export interface ProductOfferClickEvent {
  /** The clicked offer */
  offer: ProductOffer;

  /** Timestamp of click */
  timestamp: Date;
}
