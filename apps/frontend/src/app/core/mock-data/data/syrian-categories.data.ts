/**
 * Syrian Categories Mock Data
 *
 * Pre-generated category data based on category themes
 * Ready for Day 2 implementation
 *
 * @fileoverview Mock category data for Syrian marketplace
 * @description Syrian marketplace categories (to be populated on Day 2)
 */

import { ProductCategory } from '../../../shared/interfaces/product.interface';

/**
 * Syrian Categories Collection
 * Will be populated with CategoryFactory.createAll() on Day 2
 *
 * 12 Main Categories:
 * 1. Damascus Steel
 * 2. Aleppo Soap & Beauty
 * 3. Textiles & Fabrics
 * 4. Food & Spices
 * 5. Jewelry & Accessories
 * 6. Traditional Crafts
 * 7. Ceramics & Pottery
 * 8. Oud & Perfumes
 * 9. Nuts & Snacks
 * 10. Sweets & Desserts
 * 11. Musical Instruments
 * 12. Calligraphy & Art
 */
export const SYRIAN_CATEGORIES: ProductCategory[] = [];

/**
 * Heritage categories (UNESCO recognized)
 * To be populated on Day 2
 */
export const HERITAGE_CATEGORIES: ProductCategory[] = [];

/**
 * Export all category collections
 */
export default {
  all: SYRIAN_CATEGORIES,
  heritage: HERITAGE_CATEGORIES
};
