import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  MobileSearchService,
  MobileSearchFilters,
} from '../services/mobile-search.service';

/**
 * Mobile Search Controller
 *
 * Provides search functionality optimized for mobile applications
 */
@ApiTags('📱 Mobile Search API v1')
@Controller('api/mobile/v1/search')
export class MobileSearchController {
  constructor(private readonly mobileSearchService: MobileSearchService) {}

  /**
   * GET /api/mobile/v1/search
   * Mobile-optimized product search
   */
  @Get()
  @ApiOperation({
    summary: 'Mobile product search',
    description: 'Search products with mobile-optimized responses',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'categoryId', required: false, type: 'number' })
  @ApiQuery({ name: 'minPrice', required: false, type: 'number' })
  @ApiQuery({ name: 'maxPrice', required: false, type: 'number' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['relevance', 'price', 'rating', 'newest'],
  })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'] })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchProducts(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sortBy') sortBy?: 'relevance' | 'price' | 'rating' | 'newest',
    @Query('language') language?: 'en' | 'ar',
  ) {
    const filters: MobileSearchFilters = {
      page: page || 1,
      limit: limit || 20,
      categoryId,
      minPrice,
      maxPrice,
      sortBy: sortBy || 'relevance',
      language: language || 'en',
    };

    return await this.mobileSearchService.searchProducts(query, filters);
  }

  /**
   * GET /api/mobile/v1/search/suggestions
   * Get search suggestions
   */
  @Get('suggestions')
  @ApiOperation({
    summary: 'Get search suggestions',
    description: 'Get search suggestions for mobile autocomplete',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Partial search query' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'] })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions retrieved successfully',
  })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('language') language?: 'en' | 'ar',
  ) {
    return await this.mobileSearchService.getSearchSuggestions(
      query,
      language || 'en',
    );
  }

  /**
   * GET /api/mobile/v1/search/trending
   * Get trending searches
   */
  @Get('trending')
  @ApiOperation({
    summary: 'Get trending searches',
    description: 'Get trending search terms for mobile discovery',
  })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'] })
  @ApiResponse({
    status: 200,
    description: 'Trending searches retrieved successfully',
  })
  async getTrendingSearches(@Query('language') language?: 'en' | 'ar') {
    return await this.mobileSearchService.getTrendingSearches(language || 'en');
  }
}
