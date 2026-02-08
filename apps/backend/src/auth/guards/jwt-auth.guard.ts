/**
 * @file jwt-auth.guard.ts
 * @description Guard to protect private routes by validating JWT tokens.
 * Respects @Public() decorator to skip authentication for public routes.
 * Checks the token_blacklist table to reject revoked tokens (C2 fix).
 */
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { TokenBlacklist } from '../entity/token-blacklist.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {
    super();
  }

  /**
   * @description Check if route is public, validate JWT, then check blacklist
   * @param context - Execution context
   * @returns True if public route or if JWT is valid and not blacklisted
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for @Public() decorator on handler or class
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip JWT validation for public routes
    if (isPublic) {
      return true;
    }

    // Validate JWT signature and expiry via Passport strategy
    const isValid = await (super.canActivate(context) as Promise<boolean>);
    if (!isValid) {
      return false;
    }

    // Extract raw token from Authorization header and check blacklist
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (token) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const blacklisted = await this.tokenBlacklistRepository.findOne({
        where: { tokenHash },
      });

      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked.');
      }
    }

    return true;
  }
}
