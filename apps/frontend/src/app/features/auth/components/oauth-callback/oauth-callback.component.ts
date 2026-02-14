/**
 * OAuth Callback Component for SouqSyria marketplace
 *
 * @description Handles the redirect from backend OAuth flow. Reads a short-lived
 * authorization code from URL query parameters, exchanges it for JWT tokens
 * via POST /auth/oauth/exchange, stores them via TokenService, dispatches
 * loginSuccess to NgRx, and navigates to the home page.
 *
 * C1 Security Fix: Tokens are no longer passed in URL query parameters.
 * Instead, a single-use authorization code (60s TTL) is exchanged server-side.
 *
 * @swagger
 * components:
 *   schemas:
 *     OAuthCallbackComponent:
 *       type: object
 *       description: OAuth redirect handler — exchanges code for tokens
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TokenService } from '../../services/token.service';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthActions } from '../../store/auth.actions';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatProgressSpinnerModule],
  template: `
    <div class="oauth-callback">
      @if (error()) {
        <div class="oauth-error" role="alert">
          <h2>{{ 'auth.oauth.errorTitle' | translate }}</h2>
          <p>{{ error() }}</p>
          <p class="redirect-notice">{{ 'auth.oauth.redirectingToLogin' | translate }}</p>
        </div>
      } @else {
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'auth.oauth.processing' | translate }}</p>
      }
    </div>
  `,
  styles: [`
    .oauth-callback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 2rem;
      text-align: center;
      gap: 1rem;
    }

    .oauth-callback p {
      color: var(--color-text-secondary);
      font-size: 0.9375rem;
    }

    .oauth-error {
      max-width: 400px;
    }

    .oauth-error h2 {
      color: var(--color-error);
      margin-bottom: 0.5rem;
    }

    .redirect-notice {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      margin-top: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OAuthCallbackComponent implements OnInit {
  /** @description ActivatedRoute for reading query params from OAuth redirect */
  private readonly route = inject(ActivatedRoute);

  /** @description Router for navigation after token processing */
  private readonly router = inject(Router);

  /** @description NgRx store for dispatching loginSuccess */
  private readonly store = inject(Store);

  /** @description Token service for persisting JWT tokens */
  private readonly tokenService = inject(TokenService);

  /** @description Auth API service for exchanging OAuth code */
  private readonly authApi = inject(AuthApiService);

  /** @description Error message signal for display */
  readonly error = signal<string | null>(null);

  /**
   * Process OAuth callback query parameters on component init.
   *
   * @description Reads the authorization code from query params, exchanges it
   * for JWT tokens via POST /auth/oauth/exchange, stores them, dispatches
   * loginSuccess, and navigates to home. On error, shows message and redirects.
   */
  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const code = params['code'];
    const errorParam = params['error'];

    if (errorParam) {
      this.handleError(errorParam);
      return;
    }

    if (!code) {
      this.handleError('no_code');
      return;
    }

    // Exchange the authorization code for JWT tokens
    this.authApi.exchangeOAuthCode(code).subscribe({
      next: (tokens) => {
        // Store tokens in localStorage
        this.tokenService.setTokens(tokens.accessToken, tokens.refreshToken);

        // Dispatch loginSuccess — triggers loadUserFromToken effect
        this.store.dispatch(AuthActions.loginSuccess({ accessToken: tokens.accessToken }));

        // Clean URL params and navigate to home
        this.router.navigate(['/'], { replaceUrl: true });
      },
      error: () => {
        this.handleError('exchange_failed');
      },
    });
  }

  /**
   * Handle OAuth errors by showing a message and redirecting to login.
   *
   * @param errorCode - Error code from the OAuth redirect or exchange failure
   */
  private handleError(errorCode: string): void {
    const messages: Record<string, string> = {
      no_profile: 'Could not retrieve your profile from the provider.',
      auth_failed: 'Authentication failed. Please try again.',
      no_code: 'No authorization code received.',
      exchange_failed: 'Failed to complete authentication. Please try again.',
      invalid_state: 'Security validation failed. Please try again.',
    };

    this.error.set(messages[errorCode] || 'An unexpected error occurred.');

    // Redirect to login after 3 seconds
    setTimeout(() => {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    }, 3000);
  }
}
