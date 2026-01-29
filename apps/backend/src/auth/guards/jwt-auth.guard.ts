/**
 * @file jwt-auth.guard.ts
 * @description Guard to protect private routes by validating JWT tokens.
 * Respects @Public() decorator to allow unauthenticated access to specific routes.
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Check if route should be authenticated
   * Routes marked with @Public() decorator bypass JWT validation
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip JWT validation for public routes
    if (isPublic) {
      return true;
    }

    // Otherwise, perform JWT validation
    return super.canActivate(context);
  }
}
