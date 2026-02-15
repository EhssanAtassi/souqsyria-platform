/**
 * @file session-notification.service.ts
 * @description Session notification service for guest session management UI feedback
 * Provides Material Design notifications with RTL support and bilingual messages
 *
 * @swagger
 * tags:
 *   - name: SessionNotification
 *     description: Guest session UI notifications and feedback
 */
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { LanguageService } from '../../../shared/services/language.service';

/**
 * @description Session notification types for different user feedback scenarios
 */
export type SessionNotificationType =
  | 'session-created'
  | 'session-expired'
  | 'session-restored'
  | 'session-error'
  | 'network-error'
  | 'offline-mode';

/**
 * @description Notification message map for bilingual support
 * Each notification type has English and Arabic translations
 */
interface NotificationMessages {
  en: string;
  ar: string;
}

/**
 * SessionNotificationService
 *
 * @description Material Design notification service for guest session management
 * Features:
 * - RTL-aware positioning (end vs start based on language)
 * - Bilingual messages (EN/AR)
 * - ARIA live regions for screen reader announcements
 * - Material Design snackbar integration
 * - Accessibility-compliant notifications
 *
 * @example
 * ```typescript
 * constructor(private sessionNotification: SessionNotificationService) {}
 *
 * // Show session created notification
 * this.sessionNotification.showSessionCreated();
 *
 * // Show session expired with auto-new session
 * this.sessionNotification.showSessionExpired();
 *
 * // Show error with custom duration
 * this.sessionNotification.showError('Custom error message', 5000);
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     SessionNotificationService:
 *       type: object
 *       description: Service for displaying session-related notifications
 *       properties:
 *         messages:
 *           type: object
 *           description: Bilingual notification messages
 */
@Injectable({
  providedIn: 'root'
})
export class SessionNotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly languageService = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Bilingual notification messages for all session events
   * Supports both English and Arabic with culturally appropriate translations
   */
  private readonly messages: Record<SessionNotificationType, NotificationMessages> = {
    'session-created': {
      en: 'New guest session created',
      ar: 'تم إنشاء جلسة زائر جديدة'
    },
    'session-expired': {
      en: 'Session expired, creating new session...',
      ar: 'انتهت صلاحية الجلسة، جاري إنشاء جلسة جديدة...'
    },
    'session-restored': {
      en: 'Session restored successfully',
      ar: 'تم استعادة الجلسة بنجاح'
    },
    'session-error': {
      en: 'Failed to create session. Using offline mode.',
      ar: 'فشل إنشاء الجلسة. استخدام الوضع غير المتصل.'
    },
    'network-error': {
      en: 'Network error. Operating in offline mode.',
      ar: 'خطأ في الشبكة. العمل في وضع عدم الاتصال.'
    },
    'offline-mode': {
      en: 'You are offline. Changes will sync when reconnected.',
      ar: 'أنت غير متصل. سيتم المزامنة عند إعادة الاتصال.'
    }
  };

  /**
   * Default snackbar configuration for session notifications
   * RTL-aware positioning based on current language
   */
  private getDefaultConfig(): MatSnackBarConfig {
    const isRtl = this.languageService.isRtl();

    return {
      duration: 4000,
      horizontalPosition: (isRtl ? 'start' : 'end') as MatSnackBarHorizontalPosition,
      verticalPosition: 'bottom' as MatSnackBarVerticalPosition,
      panelClass: ['session-notification'],
      politeness: 'polite' // ARIA live region politeness for screen readers
    };
  }

  /**
   * Show session created notification
   *
   * @description Displays a brief success message when a new guest session is initialized
   * @param duration - Custom duration in milliseconds (default: 3000ms)
   *
   * @swagger
   * /api/session/notifications/created:
   *   post:
   *     summary: Show session created notification
   *     description: Display Material snackbar notification for new guest session
   *     parameters:
   *       - name: duration
   *         in: query
   *         schema:
   *           type: number
   *         description: Notification duration in milliseconds
   *     responses:
   *       200:
   *         description: Notification displayed successfully
   */
  showSessionCreated(duration: number = 3000): void {
    const message = this.getMessage('session-created');
    const config = {
      ...this.getDefaultConfig(),
      duration,
      panelClass: ['session-notification', 'session-notification-success']
    };

    this.snackBar.open(message, '✓', config);
    this.announceToScreenReader(message);
  }

  /**
   * Show session expired notification with auto-creation message
   *
   * @description Displays informational message when session expires and new one is being created
   * Longer duration to give users time to read the message
   * @param duration - Custom duration in milliseconds (default: 4000ms)
   *
   * @swagger
   * /api/session/notifications/expired:
   *   post:
   *     summary: Show session expired notification
   *     description: Display notification when session expires
   *     responses:
   *       200:
   *         description: Notification displayed
   */
  showSessionExpired(duration: number = 4000): void {
    const message = this.getMessage('session-expired');
    const config = {
      ...this.getDefaultConfig(),
      duration,
      panelClass: ['session-notification', 'session-notification-info']
    };

    this.snackBar.open(message, 'ℹ', config);
    this.announceToScreenReader(message);
  }

  /**
   * Show session restored notification
   *
   * @description Displays success message when existing session is restored from storage
   * @param duration - Custom duration in milliseconds (default: 3000ms)
   */
  showSessionRestored(duration: number = 3000): void {
    const message = this.getMessage('session-restored');
    const config = {
      ...this.getDefaultConfig(),
      duration,
      panelClass: ['session-notification', 'session-notification-success']
    };

    this.snackBar.open(message, '✓', config);
    this.announceToScreenReader(message);
  }

  /**
   * Show session error notification with offline fallback message
   *
   * @description Displays error message when session creation fails, indicating offline mode usage
   * Includes action button for retry
   * @param duration - Custom duration in milliseconds (default: 6000ms)
   * @param onRetry - Optional callback for retry action
   *
   * @swagger
   * /api/session/notifications/error:
   *   post:
   *     summary: Show session error notification
   *     description: Display error notification with retry option
   *     responses:
   *       200:
   *         description: Error notification displayed
   */
  showSessionError(duration: number = 6000, onRetry?: () => void): void {
    const message = this.getMessage('session-error');
    const action = this.languageService.language() === 'ar' ? 'إعادة المحاولة' : 'Retry';

    const config = {
      ...this.getDefaultConfig(),
      duration,
      panelClass: ['session-notification', 'session-notification-error'],
      politeness: 'assertive' as 'assertive' // Higher priority for errors
    };

    const snackBarRef = this.snackBar.open(message, action, config);

    if (onRetry) {
      snackBarRef.onAction().subscribe(() => {
        onRetry();
      });
    }

    this.announceToScreenReader(message, 'assertive');
  }

  /**
   * Show network error notification
   *
   * @description Displays warning when network issues are detected
   * @param duration - Custom duration in milliseconds (default: 5000ms)
   */
  showNetworkError(duration: number = 5000): void {
    const message = this.getMessage('network-error');
    const config = {
      ...this.getDefaultConfig(),
      duration,
      panelClass: ['session-notification', 'session-notification-warning']
    };

    this.snackBar.open(message, '⚠', config);
    this.announceToScreenReader(message);
  }

  /**
   * Show offline mode notification
   *
   * @description Displays persistent notification about offline operation
   * @param duration - Custom duration in milliseconds (default: 8000ms for longer read time)
   */
  showOfflineMode(duration: number = 8000): void {
    const message = this.getMessage('offline-mode');
    const config = {
      ...this.getDefaultConfig(),
      duration,
      panelClass: ['session-notification', 'session-notification-info']
    };

    this.snackBar.open(message, 'ℹ', config);
    this.announceToScreenReader(message);
  }

  /**
   * Show custom notification message
   *
   * @description Generic method for displaying custom session-related messages
   * @param message - Custom message text
   * @param duration - Duration in milliseconds (default: 4000ms)
   * @param type - Notification style type (default: 'info')
   *
   * @example
   * ```typescript
   * this.sessionNotification.showCustom(
   *   'Session will expire in 5 minutes',
   *   5000,
   *   'warning'
   * );
   * ```
   */
  showCustom(
    message: string,
    duration: number = 4000,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ): void {
    const config = {
      ...this.getDefaultConfig(),
      duration,
      panelClass: ['session-notification', `session-notification-${type}`]
    };

    this.snackBar.open(message, '×', config);
    this.announceToScreenReader(message);
  }

  /**
   * Dismiss all active notifications
   *
   * @description Programmatically closes all open snackbar notifications
   * Useful when navigating away or cleaning up on component destroy
   */
  dismissAll(): void {
    this.snackBar.dismiss();
  }

  /**
   * Get localized message for notification type
   *
   * @description Retrieves the appropriate message based on current language
   * @param type - Session notification type
   * @returns Localized message string
   * @private
   */
  private getMessage(type: SessionNotificationType): string {
    const currentLang = this.languageService.language();
    return this.messages[type][currentLang];
  }

  /**
   * Announce message to screen readers via ARIA live region
   *
   * @description Creates temporary ARIA live region for screen reader announcements
   * Ensures accessibility for visually impaired users
   * @param message - Message to announce
   * @param politeness - ARIA politeness level ('polite' or 'assertive')
   * @private
   */
  private announceToScreenReader(
    message: string,
    politeness: 'polite' | 'assertive' = 'polite'
  ): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Create temporary ARIA live region
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';

    document.body.appendChild(liveRegion);

    // Announce message
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 3000);
  }
}
