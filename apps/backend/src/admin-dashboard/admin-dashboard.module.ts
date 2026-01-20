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

// Services
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminExportService } from './services/admin-export.service';

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

/**
 * Admin Dashboard Module
 * @description Provides comprehensive admin/owner dashboard functionality including:
 *              - Real-time dashboard metrics
 *              - User management and KYC verification
 *              - Vendor management and verification workflow
 *              - Product approval and bulk operations
 *              - Order management and refund processing
 *              - Analytics and report generation
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
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminVendorsController,
    AdminProductsController,
    AdminOrdersController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminDashboardService,
    AdminAnalyticsService,
    AdminExportService,
  ],
  exports: [
    AdminDashboardService,
    AdminAnalyticsService,
    AdminExportService,
  ],
})
export class AdminDashboardModule {}
