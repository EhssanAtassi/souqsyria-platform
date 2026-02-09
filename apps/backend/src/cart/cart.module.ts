/**
 * @file cart.module.ts
 * @description Enhanced Cart Module for SouqSyria E-commerce Platform
 *
 * FEATURES:
 * - Shopping cart management with multi-currency support
 * - Real-time stock validation and cart totals
 * - Comprehensive audit logging for all cart operations
 * - Cart analytics for business intelligence
 * - Syrian market compliance and localization
 * - Advanced fraud detection with ML-based scoring (Week 3)
 * - Device fingerprinting and validation (Week 3)
 * - Automated threat response system (Week 3)
 *
 * INTEGRATIONS:
 * - Access control and permissions
 * - Audit logging system
 * - Product variants and stock management
 * - Multi-currency support (SYP, USD, EUR, TRY)
 * - Fraud detection and security monitoring
 * - Geolocation intelligence and device tracking
 *
 * @author SouqSyria Development Team
 * @since 2025-08-07
 * @version 3.0.0
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { GuestSession } from './entities/guest-session.entity';
import { CartController } from './controller/cart.controller';
import { CartGuestController } from './controller/cart-guest.controller';
import { CartMonitoringController } from './controller/cart-monitoring.controller';
import { ProductVariant } from '../products/variants/entities/product-variant.entity';
import { CartService } from './service/cart.service';
import { CartMergeService } from './service/cart-merge.service';
import { CartSyncService } from './service/cart-sync.service';
import { CartValidationService } from './service/cart-validation.service';
import { CartMonitoringService } from './services/cart-monitoring.service';
import { CartFraudDetectionService } from './services/cart-fraud-detection.service';
import { DeviceFingerprintService } from './services/device-fingerprint.service';
import { ThreatResponseService } from './services/threat-response.service';
import { SessionCleanupService } from '../guest-sessions/services/session-cleanup.service';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { User } from '../users/entities/user.entity';
import { Route } from '../access-control/entities/route.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      GuestSession,
      ProductVariant,
      User,
      Route,
      ProductEntity,
      AuditLog, // ✅ For monitoring dashboard analytics
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'souqsyria_dev_jwt_secret',
      signOptions: {
        expiresIn: '1d',
        issuer: 'souqsyria-api',
        audience: 'souqsyria-client',
      },
    }), // ✅ For OptionalAuthGuard JWT verification
    ScheduleModule, // ✅ Required for SessionCleanupService @Cron decorators
    AccessControlModule, // ✅ For permissions and access control
    AuditLogModule, // ✅ For comprehensive audit logging
  ],
  controllers: [
    CartController,
    CartGuestController, // ✅ Guest cart management
    CartMonitoringController, // ✅ Admin monitoring dashboard
  ],
  providers: [
    CartService,
    CartMergeService, // ✅ Guest-to-user cart merging
    CartSyncService, // ✅ Multi-device synchronization
    CartValidationService, // ✅ Pre-checkout validation
    CartMonitoringService, // ✅ Real-time monitoring and analytics
    // Week 3: Advanced Security Services
    CartFraudDetectionService, // ✅ ML-based fraud detection with geolocation
    DeviceFingerprintService, // ✅ Device fingerprinting and validation
    ThreatResponseService, // ✅ Automated threat response system
    SessionCleanupService, // ✅ Automated guest session cleanup (daily cron job)
  ],
  exports: [
    CartService,
    CartMergeService,
    CartSyncService,
    CartValidationService,
    CartMonitoringService,
    CartFraudDetectionService,
    DeviceFingerprintService,
    ThreatResponseService,
    SessionCleanupService, // ✅ Export for potential manual cleanup triggers
  ],
})
export class CartModule {}
