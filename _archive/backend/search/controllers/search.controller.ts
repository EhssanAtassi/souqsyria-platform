/**
 * @file search.controller.ts
 * @description Search Controller for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - Provide real-time search suggestions for the header search bar
 * - Manage user recent search history (CRUD)
 * - Support both authenticated and anonymous search
 *
 * ENDPOINTS:
 * - GET  /search/suggestions    — Get autocomplete suggestions (public)
 * - GET  /search/recent         — Get user recent searches (authenticated)
 * - POST /search/recent         — Save search query to history (authenticated)
 * - DELETE /search/recent/:id   — Delete specific recent search (authenticated)
 * - DELETE /search/recent       — Clear all recent searches (authenticated)
 *
 * SECURITY:
 * - Suggestions endpoint is @Public() for anonymous users
 * - Recent searches require JWT authentication via @UseGuards(JwtAuthGuard)
 * - Users can only access/modify their own search history
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import {
  SearchSuggestionsQueryDto,
  SearchSuggestionsResponseDto,
  CreateRecentSearchDto,
  RecentSearchQueryDto,
} from '../dto/index';
import { RecentSearch } from '../entities/recent-search.entity';
import { User } from '../../users/entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * SearchController
 *
 * @description Handles all search-related HTTP endpoints for the SouqSyria header.
 * Provides autocomplete suggestions and user search history management.
 *
 * @swagger
 * tags:
 *   name: Search Suggestions
 *   description: Header search bar autocomplete and recent searches API
 */
@ApiTags('🔍 Search Suggestions')
@Controller('search')
export class SearchController {
  /** Logger instance for SearchController */
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  // ================================
  // PUBLIC ENDPOINTS
  // ================================

  /**
   * GET SEARCH SUGGESTIONS
   *
   * @description Provides real-time autocomplete suggestions for the header search bar.
   * Returns matching products, categories, and popular searches.
   * Public endpoint — no authentication required for anonymous users.
   *
   * @param queryDto - Search query parameters (q, category, language, limit)
   * @returns SearchSuggestionsResponseDto with products, categories, popular searches, and timing
   *
   * @example
   * GET /search/suggestions?q=damas&language=en&limit=8
   */
  @Get('suggestions')
  @Public()
  @ApiOperation({
    summary: 'Get search autocomplete suggestions',
    description:
      'Provides real-time autocomplete suggestions for products, categories, and popular searches. ' +
      'Public endpoint accessible to all users including anonymous visitors. ' +
      'Requires minimum 2 characters. Supports bilingual search (Arabic + English).',
  })
  @ApiOkResponse({
    description: 'Search suggestions retrieved successfully',
    type: SearchSuggestionsResponseDto,
    schema: {
      example: {
        products: [
          {
            id: 42,
            name: 'Damascus Steel Chef Knife',
            slug: 'damascus-steel-chef-knife',
            image: '/images/products/knife-thumb.jpg',
            price: '850,000 SYP',
            category: 'Kitchen & Dining',
          },
        ],
        categories: [
          { id: 5, name: 'Food & Spices', slug: 'food-spices', icon: 'restaurant', productCount: 156 },
        ],
        popular: ['damascus soap', 'aleppo pepper', 'syrian olive oil'],
        searchTime: 45,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters (e.g., query too short)',
    schema: {
      example: { message: ['q must be longer than or equal to 2 characters'], error: 'Bad Request', statusCode: 400 },
    },
  })
  async getSuggestions(
    @Query() queryDto: SearchSuggestionsQueryDto,
  ): Promise<SearchSuggestionsResponseDto> {
    this.logger.log(`🔍 Search suggestions request: q="${queryDto.q}", limit=${queryDto.limit}`);
    return this.searchService.getSuggestions(queryDto);
  }

  // ================================
  // AUTHENTICATED ENDPOINTS
  // ================================

  /**
   * GET RECENT SEARCHES
   *
   * @description Retrieves the authenticated user's recent search history,
   * ordered by most recent first. Used to populate the "Recent Searches"
   * section in the header search bar dropdown.
   *
   * @param user - Authenticated user from JWT token
   * @param queryDto - Query parameters (limit, language)
   * @returns Array of RecentSearch entries
   *
   * @example
   * GET /search/recent?limit=5&language=en
   * Authorization: Bearer <token>
   */
  @Get('recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user recent searches',
    description:
      'Retrieves the authenticated user\'s recent search history in chronological order (newest first). ' +
      'Used to display "Recent Searches" in the header search bar autocomplete dropdown.',
  })
  @ApiOkResponse({
    description: 'Recent searches retrieved successfully',
    schema: {
      example: [
        { id: 101, query: 'damascus steel knife', searchCount: 3, resultCount: 12, searchedAt: '2026-02-01T10:25:00Z' },
        { id: 98, query: 'olive oil soap', searchCount: 1, resultCount: 24, searchedAt: '2026-02-01T09:15:00Z' },
        { id: 95, query: 'syrian spices', searchCount: 2, resultCount: 56, searchedAt: '2026-01-31T14:30:00Z' },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated — JWT token required',
    schema: { example: { message: 'Unauthorized', statusCode: 401 } },
  })
  async getRecentSearches(
    @CurrentUser() user: User,
    @Query() queryDto: RecentSearchQueryDto,
  ): Promise<RecentSearch[]> {
    this.logger.log(`📜 Fetching recent searches for user ${user.id}, limit=${queryDto.limit}`);
    return this.searchService.getRecentSearches(user.id, queryDto);
  }

  /**
   * SAVE RECENT SEARCH
   *
   * @description Saves a search query to the user's recent search history.
   * Deduplicates entries — if the same query exists, updates timestamp and
   * increments the search count. Enforces a maximum of 20 entries per user.
   *
   * @param user - Authenticated user from JWT token
   * @param dto - Search query data to save
   * @returns The created or updated RecentSearch entry
   *
   * @example
   * POST /search/recent
   * Authorization: Bearer <token>
   * Body: { "query": "damascus soap", "categoryContext": "beauty", "resultCount": 24 }
   */
  @Post('recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save search query to history',
    description:
      'Saves a search query to the user\'s recent search history. ' +
      'Duplicate queries are deduplicated — existing entries get their timestamp updated and search count incremented. ' +
      'Maximum 20 entries per user (oldest are automatically pruned).',
  })
  @ApiBody({
    type: CreateRecentSearchDto,
    description: 'Search query data to save',
    examples: {
      basicSearch: {
        summary: 'Basic search save',
        value: { query: 'damascus soap' },
      },
      searchWithContext: {
        summary: 'Search with category context and result count',
        value: { query: 'olive oil', categoryContext: 'food-spices', resultCount: 24 },
      },
    },
  })
  @ApiOkResponse({
    description: 'Search query saved successfully',
    schema: {
      example: {
        id: 102,
        query: 'damascus soap',
        searchCount: 1,
        resultCount: 24,
        categoryContext: 'beauty',
        userId: 1,
        searchedAt: '2026-02-01T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated — JWT token required',
    schema: { example: { message: 'Unauthorized', statusCode: 401 } },
  })
  async saveRecentSearch(
    @CurrentUser() user: User,
    @Body() dto: CreateRecentSearchDto,
  ): Promise<RecentSearch> {
    this.logger.log(`💾 Saving recent search for user ${user.id}: "${dto.query}"`);
    return this.searchService.saveRecentSearch(user.id, dto);
  }

  /**
   * DELETE SPECIFIC RECENT SEARCH
   *
   * @description Removes a specific search entry from the user's history.
   * Verifies ownership — users can only delete their own search entries.
   *
   * @param user - Authenticated user from JWT token
   * @param id - ID of the recent search entry to delete
   * @returns Confirmation message
   *
   * @example
   * DELETE /search/recent/102
   * Authorization: Bearer <token>
   */
  @Delete('recent/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete specific recent search',
    description:
      'Removes a specific search entry from the user\'s history. ' +
      'Ownership is verified — users can only delete their own entries.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the recent search entry to delete',
    example: 102,
  })
  @ApiOkResponse({
    description: 'Recent search deleted successfully',
    schema: { example: { message: 'Recent search deleted successfully' } },
  })
  @ApiNotFoundResponse({
    description: 'Recent search entry not found or does not belong to user',
    schema: { example: { message: 'Recent search not found', statusCode: 404 } },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated — JWT token required',
    schema: { example: { message: 'Unauthorized', statusCode: 401 } },
  })
  async deleteRecentSearch(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    this.logger.log(`🗑️ Deleting recent search ${id} for user ${user.id}`);
    await this.searchService.deleteRecentSearch(user.id, id);
    return { message: 'Recent search deleted successfully' };
  }

  /**
   * CLEAR ALL RECENT SEARCHES
   *
   * @description Removes all search entries from the user's history.
   * This action is permanent and cannot be undone.
   *
   * @param user - Authenticated user from JWT token
   * @returns Confirmation message
   *
   * @example
   * DELETE /search/recent
   * Authorization: Bearer <token>
   */
  @Delete('recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clear all recent searches',
    description:
      'Removes all search entries from the user\'s history. ' +
      'This action is permanent and cannot be undone.',
  })
  @ApiOkResponse({
    description: 'All recent searches cleared successfully',
    schema: { example: { message: 'All recent searches cleared successfully' } },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated — JWT token required',
    schema: { example: { message: 'Unauthorized', statusCode: 401 } },
  })
  async clearRecentSearches(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(`🧹 Clearing all recent searches for user ${user.id}`);
    await this.searchService.clearRecentSearches(user.id);
    return { message: 'All recent searches cleared successfully' };
  }
}
