/**
 * @file facebook-auth.guard.ts
 * @description AuthGuard wrapper for the Facebook OAuth Passport strategy.
 * Triggers the Facebook OAuth redirect flow when applied to a route.
 * Includes HMAC-signed state parameter for CSRF protection (C2 fix).
 *
 * @swagger
 * @tags OAuth Guards
 *
 * @author SouqSyria Development Team
 * @since 2026-02-14
 */

import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  /**
   * @description Overrides default authenticate options to include HMAC-signed
   * state parameter for CSRF protection on OAuth initiation.
   */
  getAuthenticateOptions(): { state: string } {
    return {
      state: this.authService.generateOAuthState(),
    };
  }
}
