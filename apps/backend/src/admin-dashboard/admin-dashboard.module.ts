/**
 * @file admin-dashboard.module.ts
 * @description Admin Dashboard Module - Provides comprehensive dashboard functionality
 *              for platform administrators and owners. Includes metrics, user management,
 *              vendor management, product approval, order management, and analytics.
 * @module AdminDashboardModule
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminVendorsController } from './controllers/admin-vendors.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminBIAnalyticsController } from './controllers/admin-bi-analytics.controller';
import { AdminAnalyticsEnhancedController } from './controllers/admin-analytics-enhanced.controller';

// Services
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminAnalyticsEnhancedService } from './services/admin-analytics-enhanced.service';
import { AdminExportService } from './services/admin-export.service';
import { DashboardCacheService } from './services/dashboard-cache.service';

// Entities from other modules
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { Category } from '../categories/entities/category.entity';
import { RefundTransaction } from '../refund/entities/refund-transaction.entity';
import { VendorCommissionEntity } from '../commissions/entites/vendor-commission.entity';
import { CommissionPayoutEntity } from '../commissions/entites/commission-payout.entity';
import { GlobalCommissionEntity } from '../commissions/entites/global-commission.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';
import { KycDocument } from '../kyc/entites/kyc-document.entity';

// Related modules for dependency injection
import { UsersModule } from '../users/users.module';
import { VendorsModule } from '../vendors/vendors.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { KycModule } from '../kyc/kyc.module';
import { RefundModule } from '../refund/refund.module';
import { RolesModule } from '../roles/roles.module';
import { AccessControlModule } from '../access-control/access-control.module';

// Business Intelligence Module for BI service integration
import { BusinessIntelligenceModule } from '../business-intelligence/business-intelligence.module';

/**
 * Admin Dashboard Module
 * @description Provides comprehensive admin/owner dashboard functionality including:
 *              - Real-time dashboard metrics
 *              - User management and KYC verification
 *              - Vendor management and verification workflow
 *              - Product approval and bulk operations
 *              - Order management and refund processing
 *              - Analytics and report generation
 *              - Business Intelligence (Phase 2):
 *                * Customer Lifetime Value (CLV) Analytics
 *                * Conversion Funnel Tracking
 *                * Cart Abandonment Analysis
 *                * Cohort Analysis (Retention, Revenue, Behavioral)
 *                * Event Tracking and Real-time Session Monitoring
 *
 * @example
 * ```typescript
 * // Import in app.module.ts
 * import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
 *
 * @Module({
 *   imports: [AdminDashboardModule, ...],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    // TypeORM entities for direct queries
    TypeOrmModule.forFeature([
      User,
      Order,
      OrderItem,
      ProductEntity,
      VendorEntity,
      Category,
      RefundTransaction,
      VendorCommissionEntity,
      CommissionPayoutEntity,
      GlobalCommissionEntity,
      AuditLog,
      KycDocument,
    ]),

    // Related modules for service injection
    UsersModule,
    VendorsModule,
    ProductsModule,
    OrdersModule,
    CommissionsModule,
    AuditLogModule,
    KycModule,
    RefundModule,
    RolesModule,
    AccessControlModule,

    // Business Intelligence Module for BI services
    BusinessIntelligenceModule,
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminVendorsController,
    AdminProductsController,
    AdminOrdersController,
    AdminAnalyticsController,
    // ✅ Phase 2: Business Intelligence Analytics Controller
    AdminBIAnalyticsController,
    // ✅ Phase 2.5: Enhanced Analytics Controller (Integrated BI + Operational)
    AdminAnalyticsEnhancedController,
  ],
  providers: [
    // Core Services
    AdminDashboardService,
    AdminAnalyticsService,
    AdminAnalyticsEnhancedService,
    AdminExportService,
    // ✅ Cache Service for optimized metric retrieval
    DashboardCacheService,
  ],
  exports: [
    AdminDashboardService,
    AdminAnalyticsService,
    AdminAnalyticsEnhancedService,
    AdminExportService,
    DashboardCacheService,
  ],
})
export class AdminDashboardModule {}
