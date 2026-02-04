/**
 * @file search-suggestions-response.dto.ts
 * @description Response DTOs for search suggestions/autocomplete endpoint.
 *
 * Defines the shape of autocomplete results returned to the header search bar,
 * including product suggestions, category suggestions, and popular searches.
 *
 * @swagger
 * components:
 *   schemas:
 *     SearchSuggestionsResponse:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductSuggestion'
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategorySuggestion'
 *         popular:
 *           type: array
 *           items:
 *             type: string
 *         searchTime:
 *           type: number
 *           description: Time taken to generate suggestions (ms)
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Product Suggestion DTO
 *
 * Represents a single product match in autocomplete results.
 * Contains minimal data needed for the dropdown display.
 */
export class ProductSuggestionDto {
  @ApiProperty({ description: 'Product ID', example: 42 })
  id: number;

  @ApiProperty({ description: 'Product name (localized)', example: 'Damascus Steel Chef Knife' })
  name: string;

  @ApiProperty({ description: 'Product URL slug', example: 'damascus-steel-chef-knife' })
  slug: string;

  @ApiPropertyOptional({ description: 'Product thumbnail URL', example: '/images/products/knife-thumb.jpg' })
  image?: string;

  @ApiProperty({ description: 'Formatted price', example: '850,000 SYP' })
  price: string;

  @ApiPropertyOptional({ description: 'Category name (localized)', example: 'Kitchen & Dining' })
  category?: string;
}

/**
 * Category Suggestion DTO
 *
 * Represents a matching category in autocomplete results.
 * Shown as a separate section in the dropdown.
 */
export class CategorySuggestionDto {
  @ApiProperty({ description: 'Category ID', example: 5 })
  id: number;

  @ApiProperty({ description: 'Category name (localized)', example: 'Food & Spices' })
  name: string;

  @ApiProperty({ description: 'Category URL slug', example: 'food-spices' })
  slug: string;

  @ApiPropertyOptional({ description: 'Material icon name', example: 'restaurant' })
  icon?: string;

  @ApiProperty({ description: 'Number of products in category', example: 156 })
  productCount: number;
}

/**
 * Search Suggestions Response DTO
 *
 * Complete response shape for the autocomplete endpoint.
 * Groups results by type for easy rendering in the dropdown UI.
 *
 * Response structure matches the header-complete.html prototype:
 * - Products section (up to 5 matches)
 * - Categories section (up to 3 matches)
 * - Popular searches section (up to 5 trending queries)
 */
export class SearchSuggestionsResponseDto {
  @ApiProperty({
    description: 'Matching product suggestions',
    type: [ProductSuggestionDto],
    example: [
      {
        id: 42,
        name: 'Damascus Steel Chef Knife',
        slug: 'damascus-steel-chef-knife',
        image: '/images/products/knife-thumb.jpg',
        price: '850,000 SYP',
        category: 'Kitchen & Dining',
      },
    ],
  })
  products: ProductSuggestionDto[];

  @ApiProperty({
    description: 'Matching category suggestions',
    type: [CategorySuggestionDto],
    example: [
      {
        id: 5,
        name: 'Food & Spices',
        slug: 'food-spices',
        icon: 'restaurant',
        productCount: 156,
      },
    ],
  })
  categories: CategorySuggestionDto[];

  @ApiProperty({
    description: 'Popular/trending search queries',
    type: [String],
    example: ['damascus soap', 'aleppo pepper', 'syrian olive oil'],
  })
  popular: string[];

  @ApiProperty({
    description: 'Time taken to generate suggestions in milliseconds',
    example: 45,
  })
  searchTime: number;
}
