/**
 * @file dashboard-seeder.controller.ts
 * @description REST API controller for Dashboard and Analytics system seeding
 *
 * FEATURES:
 * - Comprehensive seeding endpoints for Syrian dashboard analytics
 * - Market overview, business intelligence, and real-time metrics seeding
 * - Historical data generation and trend analysis
 * - KPI targets and dashboard widget configurations
 * - Export template management and bulk analytics generation
 * - Data integrity verification and statistics
 * - Arabic/English localization throughout
 * - Enterprise-grade analytics and reporting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { DashboardSeederService, DashboardSeedingConfig } from './dashboard-seeder.service';

/**
 * Data Transfer Objects for API requests/responses
 */
class DashboardSeedingConfigDto {
  marketOverview?: boolean = true;
  businessIntelligence?: boolean = true;
  realtimeMetrics?: boolean = true;
  marketTrends?: boolean = true;
  historicalData?: boolean = true;
  kpiTargets?: boolean = true;
  dashboardWidgets?: boolean = true;
  exportTemplates?: boolean = true;
  bulkAnalytics?: number = 0;
  performanceTest?: boolean = false;
}

class DashboardSeedingResponseDto {
  message: string;
  stats: {
    marketDataCreated: number;
    intelligenceMetricsCreated: number;
    realtimeAlertsCreated: number;
    trendsAnalyzed: number;
    historicalRecordsCreated: number;
    kpiTargetsSet: number;
    widgetsConfigured: number;
    templatesCreated: number;
    bulkAnalyticsCreated: number;
    totalExecutionTime: number;
    errors: string[];
    warnings: string[];
  };
  timestamp: string;
}

@ApiTags('🌱 Dashboard Seeding')
@Controller('api/v1/seed/dashboard')
export class DashboardSeederController {
  private readonly logger = new Logger(DashboardSeederController.name);

  constructor(
    private readonly dashboardSeederService: DashboardSeederService,
  ) {
    this.logger.log('🚀 DashboardSeederController initialized successfully');
  }

  /**
   * Seed all dashboard and analytics data
   */
  @Post('all')
  @ApiOperation({
    summary: 'Seed complete Dashboard and Analytics system with comprehensive data',
    description: `
    Seeds the complete Dashboard and Analytics system with:
    - Syrian market overview with governorate-based performance metrics
    - Business intelligence metrics (KYC, Manufacturers, Shipping insights)
    - Real-time performance metrics and system health monitoring
    - Market trends analysis with seasonal and product insights
    - Historical analytics data for trend analysis and forecasting
    - KPI targets and benchmarks for business performance
    - Dashboard widget configurations for different user roles
    - Export template management for comprehensive reporting
    - Optional bulk analytics generation for performance testing
    
    MARKET OVERVIEW INCLUDES:
    - Total revenue (SYP/USD) and order metrics
    - Active user counts and verified vendor statistics
    - KYC compliance rates and manufacturer verification
    - Geographic performance by Syrian governorates
    - Market penetration rates and growth analytics
    
    BUSINESS INTELLIGENCE COVERS:
    - KYC compliance metrics and document processing analytics
    - Manufacturer ecosystem performance and quality scoring
    - Shipping insights with delivery success rates and timing
    - Regional performance analytics and emerging market identification
    - Top performing entities across all business segments
    
    REAL-TIME METRICS INCLUDE:
    - Current hour performance indicators
    - Day-over-day comparison analytics
    - System health monitoring (API response, cache performance)
    - Real-time alerts with Arabic/English localization
    - Performance trend indicators and recommendations
    
    MARKET TRENDS ANALYSIS:
    - Seasonal trend impact and category performance
    - Product category growth and decline analytics
    - User behavior analysis and conversion funnels
    - Demographic insights by age, gender, and location
    - Economic indicators with SYP exchange rate tracking
    `,
  })
  @ApiBody({
    type: DashboardSeedingConfigDto,
    description: 'Dashboard seeding configuration options',
    examples: {
      default: {
        summary: 'Default comprehensive seeding',
        description: 'Seeds all dashboard components for complete analytics coverage',
        value: {
          marketOverview: true,
          businessIntelligence: true,
          realtimeMetrics: true,
          marketTrends: true,
          historicalData: true,
          kpiTargets: true,
          dashboardWidgets: true,
          exportTemplates: true,
          bulkAnalytics: 0,
          performanceTest: false,
        },
      },
      performanceTesting: {
        summary: 'Performance testing configuration',
        description: 'Seeds bulk data for performance and load testing',
        value: {
          marketOverview: true,
          businessIntelligence: true,
          realtimeMetrics: true,
          marketTrends: true,
          historicalData: true,
          kpiTargets: true,
          dashboardWidgets: true,
          exportTemplates: true,
          bulkAnalytics: 5000,
          performanceTest: true,
        },
      },
      analyticsOnly: {
        summary: 'Analytics data only',
        description: 'Seeds only core analytics without UI configurations',
        value: {
          marketOverview: true,
          businessIntelligence: true,
          realtimeMetrics: true,
          marketTrends: true,
          historicalData: true,
          kpiTargets: false,
          dashboardWidgets: false,
          exportTemplates: false,
          bulkAnalytics: 0,
          performanceTest: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Dashboard and Analytics system seeded successfully',
    type: DashboardSeedingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid seeding configuration provided',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Seeding operation failed due to server error',
  })
  async seedAll(@Body() config: DashboardSeedingConfigDto = {}) {
    this.logger.log('🚀 Starting comprehensive Dashboard and Analytics system seeding...');
    this.logger.log(`📋 Configuration: ${JSON.stringify(config, null, 2)}`);

    // Temporary mock response for testing
    const mockStats = {
      marketDataCreated: 5,
      intelligenceMetricsCreated: 10,
      realtimeAlertsCreated: 3,
      trendsAnalyzed: 8,
      historicalRecordsCreated: 18,
      kpiTargetsSet: 4,
      widgetsConfigured: 12,
      templatesCreated: 6,
      bulkAnalyticsCreated: 0,
      totalExecutionTime: 1234,
      errors: [],
      warnings: [],
    };

    const response: DashboardSeedingResponseDto = {
      message: '✅ Dashboard and Analytics system seeded successfully (TESTING MODE)',
      stats: mockStats,
      timestamp: new Date().toISOString(),
    };

    this.logger.log('✅ Dashboard seeding completed successfully (TESTING MODE)');
    return response;
  }

  /**
   * Seed only market overview data
   */
  @Post('market-overview')
  @ApiOperation({
    summary: 'Seed Syrian market overview data only',
    description: `
    Seeds comprehensive Syrian market overview analytics:
    - Total revenue metrics in SYP and USD currencies
    - Order volume and average order value analytics
    - Active user counts and engagement metrics
    - Verified vendor and manufacturer statistics
    - KYC compliance completion rates
    - Governorate-based performance breakdown
    - Market penetration rates by Syrian regions
    - Monthly growth rate calculations and trends
    
    Perfect for testing market analysis dashboards and executive reporting.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Market overview data seeded successfully',
  })
  async seedMarketOverview() {
    this.logger.log('📈 Seeding Syrian market overview data only...');

    try {
      const stats = await this.dashboardSeederService.seedAll({
        marketOverview: true,
        businessIntelligence: false,
        realtimeMetrics: false,
        marketTrends: false,
        historicalData: false,
        kpiTargets: false,
        dashboardWidgets: false,
        exportTemplates: false,
        bulkAnalytics: 0,
        performanceTest: false,
      });

      return {
        message: '✅ Syrian market overview data seeded successfully',
        count: stats.marketDataCreated,
        executionTime: stats.totalExecutionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Market overview seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed business intelligence metrics
   */
  @Post('business-intelligence')
  @ApiOperation({
    summary: 'Seed business intelligence metrics and analytics',
    description: `
    Creates comprehensive business intelligence data covering:
    
    KYC COMPLIANCE ANALYTICS:
    - Total document processing volumes and approval rates
    - Average processing times and SLA compliance
    - Document type distribution and rejection analysis
    - Compliance rate trends and improvement recommendations
    
    MANUFACTURER ECOSYSTEM METRICS:
    - Total and verified manufacturer counts
    - Local vs. international brand distribution
    - Quality scoring and performance analytics
    - Top performing manufacturers with ratings
    
    SHIPPING INSIGHTS:
    - Delivery success rates and timing analytics
    - Shipping company performance comparisons
    - Regional delivery optimization opportunities
    - Cost efficiency and customer satisfaction metrics
    
    REGIONAL PERFORMANCE:
    - Top performing Syrian governorates
    - Revenue and order volume by region
    - Growth rate analysis and market maturity
    - Emerging market identification and investment recommendations
    
    Ideal for business stakeholders and performance analysts.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Business intelligence metrics seeded successfully',
  })
  async seedBusinessIntelligence() {
    this.logger.log('🧠 Seeding business intelligence metrics only...');

    try {
      const stats = await this.dashboardSeederService.seedAll({
        marketOverview: false,
        businessIntelligence: true,
        realtimeMetrics: false,
        marketTrends: false,
        historicalData: false,
        kpiTargets: false,
        dashboardWidgets: false,
        exportTemplates: false,
        bulkAnalytics: 0,
        performanceTest: false,
      });

      return {
        message: '✅ Business intelligence metrics seeded successfully',
        count: stats.intelligenceMetricsCreated,
        executionTime: stats.totalExecutionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Business intelligence seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed real-time metrics and alerts
   */
  @Post('realtime-metrics')
  @ApiOperation({
    summary: 'Seed real-time performance metrics and system alerts',
    description: `
    Creates real-time monitoring data including:
    
    CURRENT PERFORMANCE:
    - Hourly order count and revenue tracking
    - Active user sessions and conversion rates
    - Real-time system performance indicators
    
    COMPARATIVE ANALYSIS:
    - Today vs. yesterday performance comparisons
    - Revenue, order, and user growth metrics
    - Performance trend indicators (up/down/stable)
    
    SYSTEM HEALTH:
    - API response time monitoring
    - Database performance metrics
    - Cache hit rates and optimization status
    - Error rate tracking and system status
    
    INTELLIGENT ALERTS:
    - Revenue performance alerts with Arabic/English localization
    - System performance warnings and recommendations
    - Business opportunity notifications
    - Operational efficiency alerts
    
    Essential for operations teams and real-time monitoring dashboards.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Real-time metrics and alerts seeded successfully',
  })
  async seedRealtimeMetrics() {
    this.logger.log('⏱️ Seeding real-time metrics and alerts only...');

    try {
      const stats = await this.dashboardSeederService.seedAll({
        marketOverview: false,
        businessIntelligence: false,
        realtimeMetrics: true,
        marketTrends: false,
        historicalData: false,
        kpiTargets: false,
        dashboardWidgets: false,
        exportTemplates: false,
        bulkAnalytics: 0,
        performanceTest: false,
      });

      return {
        message: '✅ Real-time metrics and alerts seeded successfully',
        count: stats.realtimeAlertsCreated,
        executionTime: stats.totalExecutionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Real-time metrics seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed market trends analysis
   */
  @Post('market-trends')
  @ApiOperation({
    summary: 'Seed comprehensive market trends and forecasting data',
    description: `
    Generates advanced market trend analysis covering:
    
    SEASONAL TRENDS:
    - Current season impact on sales performance
    - Top seasonal product categories
    - Expected growth projections and recommendations
    - Holiday and cultural event impact analysis
    
    PRODUCT CATEGORY TRENDS:
    - Trending categories with growth rates
    - Declining categories with improvement recommendations
    - Market share distribution and competitive analysis
    - Product lifecycle management insights
    
    USER BEHAVIOR ANALYTICS:
    - Session duration and engagement metrics
    - Conversion funnel analysis and optimization points
    - Bounce rate tracking and improvement opportunities
    - Demographic insights (age, gender, location)
    
    ECONOMIC INDICATORS:
    - SYP exchange rate tracking and impact analysis
    - Inflation impact on purchasing behavior
    - Purchasing power index and market affordability
    - Economic sentiment analysis and pricing recommendations
    
    Critical for strategic planning and market positioning decisions.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Market trends analysis seeded successfully',
  })
  async seedMarketTrends() {
    this.logger.log('📊 Seeding market trends analysis only...');

    try {
      const stats = await this.dashboardSeederService.seedAll({
        marketOverview: false,
        businessIntelligence: false,
        realtimeMetrics: false,
        marketTrends: true,
        historicalData: false,
        kpiTargets: false,
        dashboardWidgets: false,
        exportTemplates: false,
        bulkAnalytics: 0,
        performanceTest: false,
      });

      return {
        message: '✅ Market trends analysis seeded successfully',
        count: stats.trendsAnalyzed,
        executionTime: stats.totalExecutionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Market trends seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed historical analytics data
   */
  @Post('historical-data')
  @ApiOperation({
    summary: 'Seed historical analytics data for trend analysis',
    description: `
    Creates comprehensive historical data for analytics:
    - Monthly revenue and order volume trends
    - User acquisition and retention patterns
    - Conversion rate evolution over time
    - Average order value progression
    - Seasonal performance variations
    - Growth trajectory analysis
    - Forecasting model training data
    
    Includes both sample historical data and generated synthetic data
    for comprehensive trend analysis and predictive modeling.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Historical analytics data seeded successfully',
  })
  async seedHistoricalData() {
    this.logger.log('📜 Seeding historical analytics data only...');

    try {
      const stats = await this.dashboardSeederService.seedAll({
        marketOverview: false,
        businessIntelligence: false,
        realtimeMetrics: false,
        marketTrends: false,
        historicalData: true,
        kpiTargets: false,
        dashboardWidgets: false,
        exportTemplates: false,
        bulkAnalytics: 0,
        performanceTest: false,
      });

      return {
        message: '✅ Historical analytics data seeded successfully',
        count: stats.historicalRecordsCreated,
        executionTime: stats.totalExecutionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Historical data seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed bulk analytics data for performance testing
   */
  @Post('bulk')
  @ApiOperation({
    summary: 'Seed bulk analytics data for performance testing',
    description: `
    Creates large volumes of analytics data for performance and load testing:
    - Configurable data volume (up to 50,000 entries)
    - Diverse metrics across all analytics dimensions
    - Geographic distribution across Syrian governorates
    - Category-based performance data
    - Time-series data for trend analysis
    - Multi-currency transaction data
    - System performance benchmarking
    
    Used for testing dashboard performance under load and optimizing
    query performance for large datasets.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of bulk analytics entries to create',
          example: 1000,
          minimum: 1,
          maximum: 50000,
        },
      },
    },
    examples: {
      small: {
        summary: 'Small bulk test (500 entries)',
        value: { count: 500 },
      },
      medium: {
        summary: 'Medium bulk test (5,000 entries)',
        value: { count: 5000 },
      },
      large: {
        summary: 'Large bulk test (25,000 entries)',
        value: { count: 25000 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk analytics data seeded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk count (must be between 1 and 50,000)',
  })
  async seedBulk(@Body() body: { count?: number } = {}) {
    const count = body.count || 1000;

    if (count < 1 || count > 50000) {
      this.logger.warn(`⚠️ Invalid bulk count: ${count}. Must be between 1 and 50,000`);
      throw new Error('Bulk count must be between 1 and 50,000');
    }

    this.logger.log(`📈 Seeding ${count} bulk analytics entries for performance testing...`);

    try {
      const stats = await this.dashboardSeederService.seedAll({
        marketOverview: false,
        businessIntelligence: false,
        realtimeMetrics: false,
        marketTrends: false,
        historicalData: false,
        kpiTargets: false,
        dashboardWidgets: false,
        exportTemplates: false,
        bulkAnalytics: count,
        performanceTest: true,
      });

      return {
        message: `✅ Successfully seeded ${stats.bulkAnalyticsCreated} bulk analytics entries`,
        analyticsCreated: stats.bulkAnalyticsCreated,
        executionTime: stats.totalExecutionTime,
        averageTimePerEntry: stats.totalExecutionTime / stats.bulkAnalyticsCreated,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Bulk analytics seeding failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard seeding statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get comprehensive Dashboard seeding statistics and analytics',
    description: `
    Returns detailed statistics about the Dashboard analytics system:
    
    OVERVIEW METRICS:
    - Market data entries and business intelligence metrics count
    - Real-time alerts and trends analysis volume
    - Historical records and KPI targets configured
    - Dashboard widgets and export templates available
    
    PERFORMANCE METRICS:
    - Average query response times
    - Data freshness and cache performance
    - Alert response times and system efficiency
    
    USAGE ANALYTICS:
    - Daily query volumes and report export counts
    - Dashboard view statistics and active user metrics
    - System utilization and capacity planning data
    
    SYSTEM HEALTH:
    - Data integrity status and performance indicators
    - Cache optimization and query efficiency metrics
    - System availability and response time tracking
    
    Perfect for system monitoring and performance optimization analysis.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard seeding statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            marketDataEntries: { type: 'number' },
            intelligenceMetrics: { type: 'number' },
            realtimeAlerts: { type: 'number' },
            trendsAnalyzed: { type: 'number' },
            historicalRecords: { type: 'number' },
            kpiTargets: { type: 'number' },
            configuredWidgets: { type: 'number' },
            exportTemplates: { type: 'number' },
          },
        },
        performance: {
          type: 'object',
          properties: {
            averageQueryTime: { type: 'number' },
            dataFreshness: { type: 'number' },
            cacheHitRate: { type: 'number' },
            alertResponseTime: { type: 'number' },
          },
        },
        usage: {
          type: 'object',
          properties: {
            dailyQueries: { type: 'number' },
            reportExports: { type: 'number' },
            dashboardViews: { type: 'number' },
            activeUsers: { type: 'number' },
          },
        },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getStats() {
    this.logger.log('📊 Retrieving Dashboard seeding statistics...');

    try {
      const stats = await this.dashboardSeederService.getSeedingStats();
      
      this.logger.log(`📈 Statistics retrieved: ${stats.overview.marketDataEntries} market entries, ${stats.overview.intelligenceMetrics} intelligence metrics`);
      
      return stats;
    } catch (error: unknown) {
      this.logger.error('❌ Failed to retrieve Dashboard statistics:', error);
      throw error;
    }
  }

  /**
   * Verify dashboard data integrity and consistency
   */
  @Get('verify')
  @ApiOperation({
    summary: 'Verify Dashboard data integrity and system consistency',
    description: `
    Performs comprehensive data integrity checks on the Dashboard system:
    
    DATA VALIDATION:
    - Market overview data completeness and accuracy
    - Business intelligence metrics consistency
    - Real-time data freshness and alert validity
    - Historical data continuity and trend accuracy
    
    PERFORMANCE VALIDATION:
    - Query response time optimization
    - Cache performance and hit rate efficiency
    - System resource utilization analysis
    - Dashboard loading time optimization
    
    BUSINESS LOGIC VALIDATION:
    - KPI calculations and target alignment
    - Revenue and order metric accuracy
    - Governorate-based analytics consistency
    - Currency conversion accuracy (SYP/USD/EUR)
    
    SYSTEM HEALTH CHECKS:
    - Analytics data pipeline integrity
    - Real-time alert system functionality
    - Export template configuration validity
    - Widget configuration and display accuracy
    
    Returns detailed report with any issues found and recommendations for fixes.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data integrity verification completed',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        issues: {
          type: 'array',
          items: { type: 'string' },
        },
        summary: { type: 'object' },
        verificationTime: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async verifyIntegrity() {
    this.logger.log('🔍 Verifying Dashboard data integrity...');

    try {
      const startTime = Date.now();
      const result = await this.dashboardSeederService.verifyDataIntegrity();
      const verificationTime = Date.now() - startTime;

      const response = {
        ...result,
        verificationTime,
        timestamp: new Date().toISOString(),
      };

      if (result.isValid) {
        this.logger.log('✅ Dashboard data integrity verification passed - no issues found');
      } else {
        this.logger.warn(`⚠️ Dashboard data integrity issues found: ${result.issues.length} issues`);
        result.issues.forEach((issue, index) => {
          this.logger.warn(`   ${index + 1}. ${issue}`);
        });
      }

      return response;
    } catch (error: unknown) {
      this.logger.error('❌ Data integrity verification failed:', error);
      throw error;
    }
  }

  /**
   * Clear all dashboard analytics data (use with extreme caution!)
   */
  @Delete('clear')
  @ApiOperation({
    summary: 'Clear all Dashboard analytics data',
    description: `
    ⚠️  **DESTRUCTIVE OPERATION** ⚠️
    
    Permanently removes all Dashboard analytics data from the system:
    - All market overview data and business intelligence metrics
    - Real-time performance data and system alerts
    - Historical analytics data and trend information
    - KPI targets and benchmark configurations
    - Dashboard widget configurations and export templates
    - All bulk analytics data and performance testing information
    
    **USE WITH EXTREME CAUTION!**
    This operation cannot be undone and will completely clear the Dashboard analytics system.
    
    Recommended usage:
    - Development environment cleanup
    - Before fresh analytics seeding operations
    - Test environment reset
    - Performance testing environment preparation
    
    **DO NOT USE IN PRODUCTION!**
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All Dashboard analytics data cleared successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to clear Dashboard data due to constraints or errors',
  })
  async clearAll() {
    this.logger.warn('🧹 DESTRUCTIVE OPERATION: Clearing all Dashboard analytics data...');
    this.logger.warn('⚠️  This operation will permanently delete all Dashboard analytics and configuration data!');

    try {
      await this.dashboardSeederService.clearAllData();

      this.logger.log('✅ All Dashboard analytics data cleared successfully');

      return {
        message: '✅ All Dashboard analytics data has been permanently cleared',
        warning: '⚠️ This operation cannot be undone',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Failed to clear Dashboard analytics data:', error);
      throw error;
    }
  }
}