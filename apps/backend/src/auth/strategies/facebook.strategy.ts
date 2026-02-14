/**
 * @file facebook.strategy.ts
 * @description Passport strategy for Facebook OAuth 2.0 authentication.
 * Validates the Facebook profile and passes it to the auth service
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
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  /**
   * @description Configures the Facebook OAuth strategy with app credentials
   * from environment variables and requests email + public_profile scopes.
   *
   * @param configService - NestJS ConfigService for reading env vars
   */
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID'),
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    });
  }

  /**
   * @description Called after Facebook returns a valid access token.
   * Extracts the user profile and passes it downstream via done().
   * The returned object is attached to req.user in the callback route.
   *
   * @param accessToken - Facebook OAuth access token (not stored)
   * @param refreshToken - Facebook OAuth refresh token (not stored)
   * @param profile - Facebook user profile with emails, name, photos
   * @param done - Passport verify callback
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile;

    const user = {
      providerId: id,
      email: emails?.[0]?.value || null,
      fullName: displayName || null,
      avatar: photos?.[0]?.value || null,
      provider: 'facebook' as const,
    };

    done(null, user);
  }
}
