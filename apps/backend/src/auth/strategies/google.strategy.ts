/**
 * @file google.strategy.ts
 * @description Google OAuth 2.0 authentication strategy for user login/registration.
 * Validates Google ID tokens and extracts user profile information.
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Interface for Google OAuth profile data
 * Represents the user information returned by Google after successful authentication
 */
export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Google OAuth 2.0 Strategy
 * Handles the OAuth flow with Google:
 * 1. User clicks "Login with Google" → Redirects to Google consent screen
 * 2. User authorizes → Google redirects back to callback URL
 * 3. This strategy validates the authorization code with Google
 * 4. Google returns user profile + tokens
 * 5. validate() method processes the profile and passes it to the controller
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      // OAuth 2.0 credentials from Google Cloud Console
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),

      // Callback URL where Google redirects after user authorization
      // Must match the redirect URI configured in Google Cloud Console
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),

      // Requested scopes: basic profile and email
      scope: ['profile', 'email'],

      // Pass request object to validate method for accessing headers, IP, etc.
      passReqToCallback: false,
    });
  }

  /**
   * Validate and process Google OAuth profile
   * Called automatically by Passport after successful OAuth flow
   *
   * @param accessToken - Google access token (expires in 1 hour)
   * @param refreshToken - Google refresh token (optional, for offline access)
   * @param profile - User profile data from Google
   * @param done - Passport callback to pass user data to controller
   *
   * @returns GoogleProfile object containing normalized user data
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // Extract user information from Google profile
      const { id, name, emails, photos } = profile;

      // Construct normalized user profile
      const googleProfile: GoogleProfile = {
        googleId: id, // Google's unique user identifier
        email: emails[0].value, // Primary email address
        fullName: name.givenName + ' ' + name.familyName, // Full name
        firstName: name.givenName, // First name
        lastName: name.familyName, // Last name
        profilePictureUrl: photos && photos[0] ? photos[0].value : null, // Profile picture URL
        accessToken, // Google access token
        refreshToken, // Google refresh token (may be undefined)
      };

      // Pass profile to Passport (will be available as req.user in controller)
      done(null, googleProfile);
    } catch (error: unknown) {
      // Handle any errors during profile processing
      done(error, null);
    }
  }
}
