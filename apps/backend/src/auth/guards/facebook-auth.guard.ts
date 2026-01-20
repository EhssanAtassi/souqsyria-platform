/**
 * @file facebook-auth.guard.ts
 * @description Guard to initiate and handle Facebook OAuth authentication flow.
 * Use this guard on routes that should redirect to Facebook login or handle Facebook callback.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Facebook OAuth Guard
 *
 * When applied to a route:
 * - Initiates Facebook OAuth flow (redirects user to Facebook consent screen)
 * - Validates Facebook OAuth callback (processes authorization code)
 * - Extracts user profile from Facebook response
 *
 * Usage:
 * @Get('auth/facebook')
 * @UseGuards(FacebookAuthGuard)
 * facebookAuth() {}
 *
 * @Get('auth/facebook/callback')
 * @UseGuards(FacebookAuthGuard)
 * facebookAuthCallback(@Req() req) {
 *   // req.user contains FacebookProfile from strategy
 * }
 */
@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {}
