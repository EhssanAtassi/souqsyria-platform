import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { offlineInterceptor } from './core/interceptors/offline.interceptor';

/**
 * Main application configuration for Syrian marketplace
 *
 * Providers:
 * - Zone change detection with event coalescing
 * - Router with application routes
 * - Animations (async loaded)
 * - HTTP client for API calls
 * - Akita DevTools (development only)
 *
 * Akita State Management:
 * - Products Store: Product catalog with filtering and search
 * - Cart Store: Shopping cart with localStorage persistence
 * - User Store: Authentication and user preferences
 * - UI Store: Global UI state (modals, sidebars, toasts)
 *
 * DevTools:
 * - Akita DevTools enabled in development mode
 * - Access via Redux DevTools browser extension
 * - Track state changes, time-travel debugging
 *
 * @swagger
 * components:
 *   schemas:
 *     AppConfig:
 *       type: object
 *       description: Angular application configuration with Akita state management
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        apiInterceptor,      // First: Add API base URL
        offlineInterceptor   // Second: Handle offline scenarios
      ])
    ),

    // Akita DevTools - enabled in development mode only
    // Requires Redux DevTools browser extension
    ...(isDevMode() ? [
      importProvidersFrom(
        AkitaNgDevtools.forRoot({
          maxAge: 25, // Maximum number of states to keep in history
          logTrace: true, // Log trace information for debugging
          name: 'Syrian Marketplace State' // DevTools instance name
        })
      )
    ] : [])
  ]
};
