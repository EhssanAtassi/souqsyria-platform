/**
 * Social Auth Buttons Component for SouqSyria marketplace
 *
 * @description Standalone Angular component rendering Google and Facebook
 * OAuth login buttons with an "Or continue with" divider. Clicking a button
 * navigates the browser to the backend OAuth initiation endpoint, which
 * triggers the full Passport redirect flow.
 *
 * @swagger
 * components:
 *   schemas:
 *     SocialAuthButtonsComponent:
 *       type: object
 *       description: Google + Facebook OAuth login buttons with divider
 */

import {
  Component,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';

/**
 * Allowed OAuth redirect origins
 * @description Whitelist of trusted backend origins to prevent open-redirect attacks.
 * If environment.apiUrl is somehow tampered (e.g., prototype pollution), the
 * redirect is blocked before the browser navigates.
 */
const ALLOWED_OAUTH_ORIGINS: readonly string[] = [
  'http://localhost:3001',
  'https://api.souqsyria.com',
] as const;

@Component({
  selector: 'app-social-auth-buttons',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './social-auth-buttons.component.html',
  styleUrls: ['./social-auth-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialAuthButtonsComponent {
  /** @description Disabled state to prevent double-clicks during redirect */
  readonly isRedirecting = signal(false);

  /**
   * Initiate Google OAuth by navigating to backend endpoint.
   * @description Full-page redirect to /api/auth/google which triggers Passport flow.
   * Validates the redirect URL origin before navigating.
   */
  loginWithGoogle(): void {
    this.safeOAuthRedirect(`${environment.apiUrl}/auth/google`);
  }

  /**
   * Initiate Facebook OAuth by navigating to backend endpoint.
   * @description Full-page redirect to /api/auth/facebook which triggers Passport flow.
   * Validates the redirect URL origin before navigating.
   */
  loginWithFacebook(): void {
    this.safeOAuthRedirect(`${environment.apiUrl}/auth/facebook`);
  }

  /**
   * Validate and perform an OAuth redirect
   * @description Checks the constructed URL's origin against ALLOWED_OAUTH_ORIGINS
   * before redirecting. Blocks navigation and logs an error if the origin is untrusted.
   * @param url - The full OAuth backend URL to redirect to
   */
  private safeOAuthRedirect(url: string): void {
    if (!this.isAllowedOAuthOrigin(url)) {
      console.error('[SocialAuth] Blocked redirect to untrusted origin:', url);
      return;
    }
    this.isRedirecting.set(true);
    window.location.href = url;
  }

  /**
   * Validate that a URL points to a trusted OAuth backend origin
   * @description Parses the URL and checks its origin against the whitelist.
   * Returns false for malformed URLs or untrusted origins.
   * @param url - The URL to validate
   * @returns true if the URL's origin is in ALLOWED_OAUTH_ORIGINS
   */
  private isAllowedOAuthOrigin(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ALLOWED_OAUTH_ORIGINS.includes(parsed.origin);
    } catch {
      return false;
    }
  }
}
