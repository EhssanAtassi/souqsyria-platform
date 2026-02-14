/**
 * @file google.strategy.ts
 * @description Passport strategy for Google OAuth 2.0 authentication.
 * Validates the Google profile and passes it to the auth service
 * for account creation or linking.
 *
 * @swagger
 * @tags OAuth Strategies
 *
 * @author SouqSyria Development Team
 * @since 2026-02-14
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  /**
   * @description Configures the Google OAuth 2.0 strategy with client credentials
   * from environment variables and requests email + profile scopes.
   *
   * @param configService - NestJS ConfigService for reading env vars
   */
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  /**
   * @description Called after Google returns a valid access token.
   * Extracts the user profile and passes it downstream via done().
   * The returned object is attached to req.user in the callback route.
   *
   * @param accessToken - Google OAuth access token (not stored)
   * @param refreshToken - Google OAuth refresh token (not stored)
   * @param profile - Google user profile with emails, photos, displayName
   * @param done - Passport verify callback
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile;

    const user = {
      providerId: id,
      email: emails?.[0]?.value || null,
      fullName: displayName || null,
      avatar: photos?.[0]?.value || null,
      provider: 'google' as const,
    };

    done(null, user);
  }
}
