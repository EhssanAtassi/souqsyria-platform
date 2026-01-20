import { Product } from '../../shared/interfaces/product.interface';

/**
 * Wishlist State Interface
 *
 * @description
 * Defines the structure of the wishlist state managed by Akita.
 * Stores the list of wishlisted products with metadata.
 *
 * @swagger
 * components:
 *   schemas:
 *     WishlistState:
 *       type: object
 *       description: State structure for wishlist management
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: Array of products in the wishlist
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last wishlist update
 *         isLoading:
 *           type: boolean
 *           description: Loading state indicator
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message if any
 */
export interface WishlistState {
  /** Array of products in the wishlist */
  items: Product[];

  /** Timestamp of last wishlist update */
  lastUpdated: Date | null;

  /** Loading state indicator */
  isLoading: boolean;

  /** Error message if any */
  error: string | null;
}

/**
 * Initial wishlist state
 *
 * @description
 * Default state when the wishlist is first initialized
 */
export function createInitialWishlistState(): WishlistState {
  return {
    items: [],
    lastUpdated: null,
    isLoading: false,
    error: null
  };
}
