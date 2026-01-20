/**
 * Syrian Sellers Mock Data
 *
 * Pre-generated Syrian artisan sellers from all 14 governorates
 * Ready for Day 2 implementation
 *
 * @fileoverview Mock seller/artisan data for Syrian marketplace
 * @description Authentic Syrian seller profiles (to be populated on Day 2)
 */

import { ProductSeller } from '../../../shared/interfaces/product.interface';

/**
 * Syrian Sellers Collection
 * Will be populated with SellerFactory.create() on Day 2
 *
 * Governorates to include:
 * - Damascus
 * - Aleppo
 * - Homs
 * - Latakia
 * - Hama
 * - Tartus
 * - Idlib
 * - Daraa
 * - As-Suwayda
 * - Deir ez-Zor
 * - Raqqa
 * - Al-Hasakah
 * - Quneitra
 * - Rif Dimashq
 */
export const SYRIAN_SELLERS: ProductSeller[] = [];

/**
 * Top-rated sellers
 * To be populated on Day 2
 */
export const TOP_RATED_SELLERS: ProductSeller[] = [];

/**
 * Verified artisan sellers
 * To be populated on Day 2
 */
export const VERIFIED_SELLERS: ProductSeller[] = [];

/**
 * Export all seller collections
 */
export default {
  all: SYRIAN_SELLERS,
  topRated: TOP_RATED_SELLERS,
  verified: VERIFIED_SELLERS
};
