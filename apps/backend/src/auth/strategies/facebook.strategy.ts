/**
 * @file facebook.strategy.ts
 * @description Facebook OAuth authentication strategy for user login/registration.
 * Validates Facebook access tokens and extracts user profile information.
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

/**
 * Interface for Facebook OAuth profile data
 * Represents the user information returned by Facebook after successful authentication
 */
export interface FacebookProfile {
  facebookId: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Facebook OAuth Strategy
 * Handles the OAuth flow with Facebook:
 * 1. User clicks "Login with Facebook" → Redirects to Facebook consent screen
 * 2. User authorizes → Facebook redirects back to callback URL
 * 3. This strategy validates the authorization code with Facebook
 * 4. Facebook returns user profile + tokens
 * 5. validate() method processes the profile and passes it to the controller
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly configService: ConfigService) {
    super({
      // OAuth credentials from Facebook App Dashboard
      clientID: configService.get<string>('FACEBOOK_APP_ID'),
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),

      // Callback URL where Facebook redirects after user authorization
      // Must match the redirect URI configured in Facebook App settings
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),

      // Requested fields from Facebook profile
      // Note: email requires app review for production
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],

      // Requested scopes: basic profile and email
      scope: ['email', 'public_profile'],

      // Pass request object to validate method
      passReqToCallback: false,
    });
  }

  /**
   * Validate and process Facebook OAuth profile
   * Called automatically by Passport after successful OAuth flow
   *
   * @param accessToken - Facebook access token (expires in 60 days by default)
   * @param refreshToken - Facebook refresh token (usually undefined for Facebook)
   * @param profile - User profile data from Facebook
   * @param done - Passport callback to pass user data to controller
   *
   * @returns FacebookProfile object containing normalized user data
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      // Extract user information from Facebook profile
      const { id, name, emails, photos } = profile;

      // Check if email is available (requires Facebook app approval)
      const email = emails && emails.length > 0 ? emails[0].value : null;

      // Facebook may not always provide email if user denied permission
      // In production, you may want to handle this case differently
      if (!email) {
        return done(
          new Error(
            'Email permission required. Please allow email access when logging in with Facebook.',
          ),
          null,
        );
      }

      // Construct normalized user profile
      const facebookProfile: FacebookProfile = {
        facebookId: id, // Facebook's unique user identifier
        email, // Primary email address
        fullName: `${name.givenName} ${name.familyName}`, // Full name
        firstName: name.givenName, // First name
        lastName: name.familyName, // Last name
        profilePictureUrl: photos && photos[0] ? photos[0].value : null, // Profile picture URL
        accessToken, // Facebook access token
        refreshToken, // Facebook refresh token (usually undefined)
      };

      // Pass profile to Passport (will be available as req.user in controller)
      done(null, facebookProfile);
    } catch (error: unknown) {
      // Handle any errors during profile processing
      done(error, null);
    }
  }
}
