/**
 * @file jwt-auth.guard.ts
 * @description Guard to protect private routes by validating JWT tokens.
 * Respects @Public() decorator to skip authentication for public routes.
 */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * @description Check if route is public before requiring authentication
   * @param context - Execution context
   * @returns True if public route or if JWT is valid
   */
  canActivate(context: ExecutionContext) {
    // Check for @Public() decorator on handler or class
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip JWT validation for public routes
    if (isPublic) {
      return true;
    }

    // Proceed with JWT validation for protected routes
    return super.canActivate(context);
  }
}
