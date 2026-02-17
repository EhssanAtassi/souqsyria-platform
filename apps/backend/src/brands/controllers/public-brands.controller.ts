/**
 * @file public-brands.controller.ts
 * @description Public Brands Controller - Customer-facing API for brand browsing
 *
 * RESPONSIBILITIES:
 * - Serve active and approved brands to customers
 * - Provide brand listings for frontend menus and filters
 * - Support bilingual brand display (Arabic/English)
 * - Optimize for Syrian internet speeds
 * - Mobile-first response optimization
 *
 * FEATURES:
 * - No authentication required
 * - Only public brands (active + approved)
 * - Caching headers for performance
 * - Syrian market optimizations (Arabic support, RTL)
 * - SEO-optimized responses
 *
 * @author SouqSyria Development Team
 * @since 2025-02-16
 * @version 1.0.0
 */

import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PublicBrandsService } from '../services/public-brands.service';

/**
 * PUBLIC BRANDS CONTROLLER
 *
 * Customer-facing API endpoints for brand browsing and filtering.
 * All endpoints are public (no authentication) and serve only active, approved brands.
 *
 * Route Pattern: /api/brands
 * Authentication: None required
 * Rate Limiting: Applied for DDoS protection
 * Caching: Aggressive caching for performance
 */
@ApiTags('Brands')
@Public()
@Controller('brands')
export class PublicBrandsController {
  private readonly logger = new Logger(PublicBrandsController.name);

  constructor(private readonly publicBrandsService: PublicBrandsService) {
    this.logger.log('🎨 Public Brands Controller initialized');
  }

  /**
   * GET ALL ACTIVE BRANDS
   *
   * Returns list of active, approved brands for customer browsing.
   * Optimized for mobile and slow Syrian internet connections.
   *
   * Features:
   * - Only active + approved brands
   * - Lightweight response (essential fields only)
   * - Bilingual support (Arabic/English)
   * - Ordered by popularity (product count)
   * - Mobile-optimized data structure
   * - Caching headers for 15 minutes
   *
   * Use Cases:
   * - Brand filter dropdowns on product listing pages
   * - Brand browsing pages
   * - Mobile app brand selection
   * - Homepage brand carousels
   *
   * @returns Array of active brands with metadata
   */
  @Get()
  @ApiOperation({
    summary: 'Get all active brands',
    description: `
      Retrieve list of active, approved brands for customer browsing.

      Features:
      • Mobile-optimized responses
      • Arabic/English localization support
      • Caching for improved performance
      • Only public brands (active + approved)
      • Ordered by popularity (product count DESC)

      Use Cases:
      • Brand filter dropdowns on product listing pages
      • Brand browsing pages
      • Mobile app brand selection
      • Homepage brand carousels
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Brands retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Apple',
            nameAr: 'أبل',
            slug: 'apple',
            logoUrl: 'https://cdn.souqsyria.com/brands/apple-logo.png',
            productCount: 150,
          },
          {
            id: 2,
            name: 'Samsung',
            nameAr: 'سامسونج',
            slug: 'samsung',
            logoUrl: 'https://cdn.souqsyria.com/brands/samsung-logo.png',
            productCount: 120,
          },
          {
            id: 3,
            name: 'LG',
            nameAr: 'إل جي',
            slug: 'lg',
            logoUrl: 'https://cdn.souqsyria.com/brands/lg-logo.png',
            productCount: 85,
          },
        ],
      },
    },
    headers: {
      'Cache-Control': {
        description: 'Caching directive for performance',
        schema: { type: 'string', example: 'public, max-age=900' },
      },
      'Content-Language': {
        description: 'Response language',
        schema: { type: 'string', example: 'en' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve brands. Please try again.',
        statusCode: 500,
      },
    },
  })
  async getActiveBrands(@Res() response: Response) {
    const startTime = Date.now();

    this.logger.log('📋 Public brands request');

    try {
      // 1. Fetch active brands from service
      const brands = await this.publicBrandsService.findAllActive();

      // 2. Set performance headers (15-minute cache)
      response.set({
        'Cache-Control': 'public, max-age=900', // 15 minutes
        'Content-Language': 'en',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Public brands served: ${brands.length} brands (${processingTime}ms)`,
      );

      // 3. Return response
      return response.status(HttpStatus.OK).json({
        data: brands,
      });
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Public brands failed: ${(error as Error).message} (${processingTime}ms)`,
        (error as Error).stack,
      );

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve brands. Please try again.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
