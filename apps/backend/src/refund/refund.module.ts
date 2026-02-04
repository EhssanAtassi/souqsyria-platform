/**
 * @file refund.module.ts
 * @description Enterprise Syrian Refund Module
 *
 * ENTERPRISE FEATURES:
 * - Complete Syrian refund management system
 * - Advanced workflow automation with SLA monitoring
 * - Multi-currency processing with banking integration
 * - Performance analytics and business intelligence
 * - Automated cron jobs for SLA compliance
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { RefundService } from './services/refund.service';
import { SyrianRefundWorkflowService } from './services/syrian-refund-workflow.service';

// Controllers
import { RefundController } from './controllers/refund.controller';
import { SyrianRefundController } from './controllers/syrian-refund.controller';

// Entities
import { RefundTransaction } from './entities/refund-transaction.entity';
import { SyrianRefundEntity } from './entities/syrian-refund.entity';
import { SyrianGovernorateEntity } from '../addresses/entities/syrian-governorate.entity';

// External Module Dependencies
import { OrdersModule } from '../orders/orders.module';
import { PaymentModule } from '../payment/payment.module';
import { AccessControlModule } from '../access-control/access-control.module';
import { UsersModule } from '../users/users.module';
import { AddressesModule } from '../addresses/addresses.module';

@Module({
  imports: [
    // TypeORM Entities
    TypeOrmModule.forFeature([
      RefundTransaction, // Legacy refund transaction entity
      SyrianRefundEntity, // Enterprise Syrian refund entity
      SyrianGovernorateEntity, // Syrian governorate entity for geographic data
    ]),

    // Schedule Module for Cron Jobs
    ScheduleModule.forRoot(),

    // Access Control
    AccessControlModule,

    // External Module Dependencies (with forward references to avoid circular dependencies)
    forwardRef(() => OrdersModule), // For order information and relationships
    forwardRef(() => PaymentModule), // For payment transaction integration
    forwardRef(() => UsersModule), // For user information and customer data
    forwardRef(() => AddressesModule), // For Syrian governorate and address data
  ],

  providers: [
    // Legacy Service (maintaining backward compatibility)
    RefundService,

    // Enterprise Syrian Refund Services
    SyrianRefundWorkflowService,
  ],

  controllers: [
    // Legacy Controller (maintaining backward compatibility)
    RefundController,

    // Enterprise Syrian Refund Controller
    SyrianRefundController,
  ],

  exports: [
    // Services available to other modules
    RefundService,
    SyrianRefundWorkflowService,

    // TypeORM repositories for external access
    TypeOrmModule,
  ],
})
export class RefundModule {}
