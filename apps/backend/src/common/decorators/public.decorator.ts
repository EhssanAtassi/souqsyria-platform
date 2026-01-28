/**
 * @file public.decorator.ts
 * @description Custom decorator to mark routes as public (no authentication/authorization required).
 *
 * This decorator allows routes to bypass JWT authentication and permission checks.
 * Useful for:
 * - Public API endpoints (e.g., health checks, documentation)
 * - Authentication routes (e.g., login, register, password reset)
 * - Public product listings or content
 * - Webhook receivers
 *
 * Security Considerations:
 * - Use sparingly and only for truly public endpoints
 * - Public routes are still logged in security audit
 * - Consider rate limiting on public routes
 * - Validate all inputs even on public routes
 *
 * Performance:
 * - Zero overhead (compile-time decorator)
 * - Checked via Reflector at runtime (cached)
 *
 * @swagger
 * @tags Authentication Decorators
 *
 * @example
 * ```typescript
 * // Mark entire controller as public
 * @Public()
 * @Controller('public')
 * export class PublicController {
 *   // All routes in this controller are public
 * }
 *
 * // Mark specific route as public
 * @Controller('auth')
 * export class AuthController {
 *   @Public()
 *   @Post('login')
 *   async login(@Body() dto: LoginDto) {
 *     // No authentication required
 *   }
 *
 *   @Post('logout')
 *   async logout() {
 *     // Requires authentication (no @Public decorator)
 *   }
 * }
 * ```
 *
 * @author SouqSyria Backend Team
 * @version 1.0.0
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for the @Public() decorator
 * Used by PermissionsGuard to identify public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route or controller as publicly accessible
 *
 * When applied:
 * - JWT authentication is skipped (if using global JwtAuthGuard)
 * - Permission checks are bypassed
 * - User authentication is NOT required
 * - Access is logged in security audit with action: PUBLIC_ACCESS
 *
 * Best Practices:
 * - Document why each route is public
 * - Review public routes regularly for security
 * - Apply rate limiting to prevent abuse
 * - Consider IP-based restrictions if needed
 *
 * Use cases:
 * - Login/registration endpoints
 * - Password reset flows
 * - Public content viewing
 * - Health check endpoints
 * - Public API documentation
 *
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * // Health check endpoint (public)
 * @Public()
 * @Get('health')
 * getHealth() {
 *   return { status: 'ok' };
 * }
 *
 * // User registration (public)
 * @Public()
 * @Post('auth/register')
 * async register(@Body() dto: RegisterDto) {
 *   return this.authService.register(dto);
 * }
 *
 * // Password reset request (public)
 * @Public()
 * @Post('auth/forgot-password')
 * async forgotPassword(@Body() dto: ForgotPasswordDto) {
 *   return this.authService.sendResetEmail(dto.email);
 * }
 *
 * // Protected route (default - no decorator)
 * @Get('profile')
 * async getProfile(@Req() req) {
 *   // Requires authentication and permissions
 *   return this.userService.findOne(req.user.id);
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
