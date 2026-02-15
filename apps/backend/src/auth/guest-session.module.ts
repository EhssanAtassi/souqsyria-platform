/**
 * @file guest-session.module.ts
 * @description Guest Session Module for SouqSyria E-commerce Platform
 *
 * PROVIDES:
 * - GuestSessionService - Session management logic
 * - GuestSessionGuard - Route protection for guest operations
 * - GuestSessionController - Public API endpoints
 *
 * EXPORTS:
 * - GuestSessionService - For use in cart, checkout, order modules
 * - GuestSessionGuard - For protecting cart/checkout routes
 *
 * DEPENDENCIES:
 * - TypeORM - GuestSession entity from cart module
 * - ScheduleModule - Required for cron job (cleanup)
 *
 * INTEGRATION:
 * - Import this module in AuthModule or AppModule
 * - Apply GuestSessionGuard to cart/checkout routes
 * - Use GuestSessionService for session operations
 *
 * @author SouqSyria Development Team
 * @since 2026-02-15
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestSession } from '../cart/entities/guest-session.entity';
import { GuestSessionService } from './service/guest-session.service';
import { GuestSessionGuard } from './guards/guest-session.guard';
import { GuestSessionController } from './controllers/guest-session.controller';

/**
 * GuestSessionModule
 *
 * Manages anonymous user sessions for guest shopping functionality.
 * Enables cart persistence and checkout for non-authenticated users.
 *
 * Features:
 * - Automatic session creation and validation
 * - HTTP-only cookie-based session storage
 * - 30-day expiration with sliding window
 * - Cron job for cleanup (runs daily at midnight)
 * - Seamless conversion to authenticated users
 *
 * Usage:
 * ```typescript
 * // In cart.module.ts or app.module.ts
 * import { GuestSessionModule } from './auth/guest-session.module';
 *
 * @Module({
 *   imports: [GuestSessionModule]
 * })
 * export class AppModule {}
 * ```
 *
 * Apply guard to routes:
 * ```typescript
 * // In cart.controller.ts
 * import { GuestSessionGuard } from '../auth/guards/guest-session.guard';
 *
 * @UseGuards(GuestSessionGuard)
 * @Post('cart/add')
 * async addToCart(@Req() req: Request) {
 *   // Access session via req.guestSession
 * }
 * ```
 */
@Module({
  imports: [
    /**
     * Import GuestSession entity from cart module
     *
     * The entity is defined in cart/entities because it has OneToOne
     * relationship with Cart entity. We import it here for service access.
     */
    TypeOrmModule.forFeature([GuestSession]),
  ],
  providers: [
    /**
     * GuestSessionService
     *
     * Core service for session management:
     * - createSession() - Create new guest session
     * - getSession() - Retrieve and validate session
     * - validateSession() - Check session status
     * - associateCart() - Link cart to session
     * - convertToUser() - Convert guest to authenticated user
     * - cleanupExpiredSessions() - Cron job (daily at midnight)
     */
    GuestSessionService,

    /**
     * GuestSessionGuard
     *
     * Route guard for cart/checkout operations:
     * - Validates session from cookie
     * - Allows authenticated users to bypass
     * - Attaches session to request object
     * - Blocks invalid/expired sessions
     */
    GuestSessionGuard,
  ],
  controllers: [
    /**
     * GuestSessionController
     *
     * Public API endpoints:
     * - POST /auth/guest-session/init - Create new session
     * - GET /auth/guest-session/validate - Validate existing session
     *
     * All endpoints marked @Public() (no JWT required)
     */
    GuestSessionController,
  ],
  exports: [
    /**
     * Export GuestSessionService for use in other modules:
     * - CartModule - Session validation and cart association
     * - OrderModule - Session-based order creation
     * - CheckoutModule - Guest checkout flow
     */
    GuestSessionService,

    /**
     * Export GuestSessionGuard for route protection:
     * - Apply to cart routes with @UseGuards(GuestSessionGuard)
     * - Apply to checkout routes
     * - Apply to order creation endpoints
     */
    GuestSessionGuard,
  ],
})
export class GuestSessionModule {}
