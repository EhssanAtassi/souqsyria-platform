import { ApplicationConfig, provideZoneChangeDetection, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './features/auth/interceptors/auth.interceptor';
import { offlineInterceptor } from './core/interceptors/offline.interceptor';
import { authReducer, authFeatureKey } from './features/auth/store/auth.reducer';
import * as authEffects from './features/auth/store/auth.effects';
import { initializeGuestSession } from './core/initializers/guest-session.initializer';

/**
 * Main application configuration for Syrian marketplace
 *
 * Providers:
 * - Zone change detection with event coalescing
 * - Router with application routes
 * - Animations (async loaded)
 * - HTTP client with auth interceptor
 * - NgRx Store for auth state management
 * - NgRx Effects for auth side effects
 * - ngx-translate for bilingual i18n (Arabic/English)
 * - Akita DevTools (development only, for legacy stores)
 *
 * State Management:
 * - NgRx: Authentication state (login, register, tokens)
 * - Akita (legacy): Products, Cart, UI, Wishlist stores
 *
 * Initialization:
 * - Guest Session: Automatically initialized on app bootstrap for anonymous users
 *
 * @swagger
 * components:
 *   schemas:
 *     AppConfig:
 *       type: object
 *       description: Angular application configuration with NgRx and ngx-translate
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        authInterceptor,     // First: Add JWT auth token + handle 401 refresh
        offlineInterceptor   // Second: Handle offline scenarios
      ])
    ),

    // Guest Session Initialization - runs on app bootstrap
    {
      provide: APP_INITIALIZER,
      useFactory: initializeGuestSession,
      multi: true
    },

    // NgRx Store - centralized state management for auth
    provideStore({ [authFeatureKey]: authReducer }),

    // NgRx Effects - side effects for auth API calls
    provideEffects(authEffects),

    // NgRx Store DevTools - development only
    ...(isDevMode() ? [
      provideStoreDevtools({
        maxAge: 25,
        logOnly: false,
        name: 'SouqSyria Auth Store'
      })
    ] : []),

    // ngx-translate - bilingual support (Arabic/English)
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
      lang: 'en',
    }),

    // Akita DevTools - enabled in development mode only (for legacy stores)
    ...(isDevMode() ? [
      importProvidersFrom(
        AkitaNgDevtools.forRoot({
          maxAge: 25,
          logTrace: true,
          name: 'Syrian Marketplace State'
        })
      )
    ] : [])
  ]
};
