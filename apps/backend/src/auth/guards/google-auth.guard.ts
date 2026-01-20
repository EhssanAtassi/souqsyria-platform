/**
 * @file google-auth.guard.ts
 * @description Guard to initiate and handle Google OAuth 2.0 authentication flow.
 * Use this guard on routes that should redirect to Google login or handle Google callback.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 *
 * When applied to a route:
 * - Initiates Google OAuth flow (redirects user to Google consent screen)
 * - Validates Google OAuth callback (processes authorization code)
 * - Extracts user profile from Google response
 *
 * Usage:
 * @Get('auth/google')
 * @UseGuards(GoogleAuthGuard)
 * googleAuth() {}
 *
 * @Get('auth/google/callback')
 * @UseGuards(GoogleAuthGuard)
 * googleAuthCallback(@Req() req) {
 *   // req.user contains GoogleProfile from strategy
 * }
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
