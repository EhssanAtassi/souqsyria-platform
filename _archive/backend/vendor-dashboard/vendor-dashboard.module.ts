/**
 * @file vendor-dashboard.module.ts
 * @description NestJS module for vendor dashboard functionality
 *
 * FEATURES:
 * - Dashboard overview with metrics and charts
 * - Business analytics and intelligence
 * - Vendor profile management
 * - Financial reports and transaction history
 * - Performance insights and recommendations
 *
 * ENDPOINTS:
 * - GET  /api/vendor-dashboard/overview
 * - GET  /api/vendor-dashboard/analytics
 * - GET  /api/vendor-dashboard/profile
 * - PUT  /api/vendor-dashboard/profile
 * - GET  /api/vendor-dashboard/financial-reports
 * - GET  /api/vendor-dashboard/performance-insights
 *
 * SECURITY:
 * - JWT authentication required on all endpoints
 * - Vendor ownership verification (Week 1 Day 5)
 * - Permission-based access control
 *
 * @author SouqSyria Development Team
 * @since 2025-01-20
 * @version 1.0.0 - Week 1 Day 1-2 Foundation
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers - One controller per functional area
import { VendorOverviewController } from './controllers/vendor-overview.controller';
import { VendorAnalyticsController } from './controllers/vendor-analytics.controller';
import { VendorProfileController } from './controllers/vendor-profile.controller';
import { VendorFinancialController } from './controllers/vendor-financial.controller';
import { VendorInsightsController } from './controllers/vendor-insights.controller';

// Services - Business logic layer
import { VendorDashboardService } from './services/vendor-dashboard.service';
import { VendorAnalyticsService } from './services/vendor-analytics.service';
import { VendorProfileService } from './services/vendor-profile.service';
import { VendorFinancialService } from './services/vendor-financial.service';
import { VendorInsightsService } from './services/vendor-insights.service';

// Guards - Security and access control
import { VendorOwnershipGuard } from './guards/vendor-ownership.guard';

// Entities - Database layer
import {
  VendorMetrics,
  VendorAnalytics,
  VendorFinancial,
  VendorTransaction,
  VendorPayout,
  VendorAlert,
  VendorPerformanceInsight,
  VendorProfile,
} from './entities';

// External modules
import { AuthModule } from '../auth/auth.module';
import { VendorsModule } from '../vendors/vendors.module';

/**
 * Vendor Dashboard Module
 *
 * Provides comprehensive dashboard functionality for vendor users including:
 * - Real-time performance metrics
 * - Business analytics and reporting
 * - Profile and business settings management
 * - Financial tracking and payout information
 * - AI-powered performance insights and recommendations
 *
 * ARCHITECTURE:
 * - Feature-based module structure
 * - Separation of concerns (Controllers → Services → DTOs)
 * - Guard-based security at controller level
 * - Full Swagger/OpenAPI documentation
 *
 * DEVELOPMENT ROADMAP:
 * - Week 1 Day 1-2 Part 1: Module foundation with mock data ✅
 * - Week 1 Day 1-2 Part 2: Database schema and entities ✅
 * - Week 1 Day 3-4: Real business logic with database queries
 * - Week 1 Day 5: Security hardening and vendor ownership guards
 * - Week 2: Advanced analytics and caching
 */
@Module({
  imports: [
    // TypeORM entities for vendor dashboard (Week 1 Day 1-2: Database Layer)
    TypeOrmModule.forFeature([
      // Time-series and analytics
      VendorMetrics,        // Daily performance metrics
      VendorAnalytics,      // Pre-computed business intelligence

      // Financial tracking
      VendorFinancial,      // Financial period summaries
      VendorTransaction,    // Individual transaction records
      VendorPayout,         // Payout schedule and history

      // Dashboard features
      VendorAlert,          // Notifications and alerts
      VendorPerformanceInsight, // AI-generated insights
      VendorProfile,        // Extended vendor profile
    ]),

    // External module dependencies
    AuthModule, // For JWT authentication
    VendorsModule, // For vendor data access
  ],

  controllers: [
    // 5 controllers handling 6 endpoints total
    VendorOverviewController,    // GET /overview
    VendorAnalyticsController,   // GET /analytics
    VendorProfileController,     // GET /profile, PUT /profile (2 endpoints)
    VendorFinancialController,   // GET /financial-reports
    VendorInsightsController,    // GET /performance-insights
  ],

  providers: [
    // Business logic services
    VendorDashboardService,
    VendorAnalyticsService,
    VendorProfileService,
    VendorFinancialService,
    VendorInsightsService,

    // Security guards
    VendorOwnershipGuard,
  ],

  exports: [
    // Export services for potential use in other modules
    VendorDashboardService,
    VendorAnalyticsService,
    VendorProfileService,
    VendorFinancialService,
    VendorInsightsService,
  ],
})
export class VendorDashboardModule {}
