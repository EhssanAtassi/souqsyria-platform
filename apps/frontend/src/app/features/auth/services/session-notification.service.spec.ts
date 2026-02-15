/**
 * @file session-notification.service.spec.ts
 * @description Unit tests for SessionNotificationService
 * Tests bilingual notifications, RTL support, and accessibility features
 */
import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SessionNotificationService } from './session-notification.service';
import { LanguageService } from '../../../shared/services/language.service';

/**
 * SessionNotificationService Test Suite
 *
 * @description Comprehensive tests for session notification service
 * Covers:
 * - Bilingual message display (EN/AR)
 * - RTL-aware positioning
 * - Accessibility (ARIA announcements)
 * - All notification types
 * - Custom notifications
 * - Error handling with retry
 */
describe('SessionNotificationService', () => {
  let service: SessionNotificationService;
  let snackBar: MatSnackBar;
  let languageService: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        SessionNotificationService,
        LanguageService
      ]
    });

    service = TestBed.inject(SessionNotificationService);
    snackBar = TestBed.inject(MatSnackBar);
    languageService = TestBed.inject(LanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Session Created Notification Tests
   */
  describe('showSessionCreated()', () => {
    it('should display session created notification in English', () => {
      languageService.setLanguage('en');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionCreated();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'New guest session created',
        '✓',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
          panelClass: ['session-notification', 'session-notification-success']
        })
      );
    });

    it('should display session created notification in Arabic', () => {
      languageService.setLanguage('ar');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionCreated();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'تم إنشاء جلسة زائر جديدة',
        '✓',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'start', // RTL positioning
          panelClass: ['session-notification', 'session-notification-success']
        })
      );
    });

    it('should accept custom duration', () => {
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionCreated(5000);

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.objectContaining({
          duration: 5000
        })
      );
    });
  });

  /**
   * Session Expired Notification Tests
   */
  describe('showSessionExpired()', () => {
    it('should display session expired notification in English', () => {
      languageService.setLanguage('en');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionExpired();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Session expired, creating new session...',
        'ℹ',
        jasmine.objectContaining({
          duration: 4000,
          panelClass: ['session-notification', 'session-notification-info']
        })
      );
    });

    it('should display session expired notification in Arabic', () => {
      languageService.setLanguage('ar');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionExpired();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'انتهت صلاحية الجلسة، جاري إنشاء جلسة جديدة...',
        'ℹ',
        jasmine.objectContaining({
          horizontalPosition: 'start'
        })
      );
    });
  });

  /**
   * Session Restored Notification Tests
   */
  describe('showSessionRestored()', () => {
    it('should display session restored notification', () => {
      languageService.setLanguage('en');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionRestored();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Session restored successfully',
        '✓',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['session-notification', 'session-notification-success']
        })
      );
    });
  });

  /**
   * Session Error Notification Tests
   */
  describe('showSessionError()', () => {
    it('should display session error notification with retry button in English', () => {
      languageService.setLanguage('en');
      const snackBarSpy = spyOn(snackBar, 'open').and.returnValue({
        onAction: () => ({ subscribe: jasmine.createSpy('subscribe') })
      } as any);

      service.showSessionError();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to create session. Using offline mode.',
        'Retry',
        jasmine.objectContaining({
          duration: 6000,
          panelClass: ['session-notification', 'session-notification-error'],
          politeness: 'assertive'
        })
      );
    });

    it('should display session error notification with retry button in Arabic', () => {
      languageService.setLanguage('ar');
      const snackBarSpy = spyOn(snackBar, 'open').and.returnValue({
        onAction: () => ({ subscribe: jasmine.createSpy('subscribe') })
      } as any);

      service.showSessionError();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'فشل إنشاء الجلسة. استخدام الوضع غير المتصل.',
        'إعادة المحاولة',
        jasmine.objectContaining({
          duration: 6000
        })
      );
    });

    it('should call retry callback when action is clicked', () => {
      const retryCallback = jasmine.createSpy('retryCallback');
      const mockSubscribe = jasmine.createSpy('subscribe');
      const snackBarSpy = spyOn(snackBar, 'open').and.returnValue({
        onAction: () => ({ subscribe: mockSubscribe })
      } as any);

      service.showSessionError(6000, retryCallback);

      expect(snackBarSpy).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalled();

      // Simulate action button click
      const subscribeCallback = mockSubscribe.calls.first().args[0];
      subscribeCallback();

      expect(retryCallback).toHaveBeenCalled();
    });
  });

  /**
   * Network Error Notification Tests
   */
  describe('showNetworkError()', () => {
    it('should display network error notification', () => {
      languageService.setLanguage('en');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showNetworkError();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Network error. Operating in offline mode.',
        '⚠',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['session-notification', 'session-notification-warning']
        })
      );
    });
  });

  /**
   * Offline Mode Notification Tests
   */
  describe('showOfflineMode()', () => {
    it('should display offline mode notification with longer duration', () => {
      languageService.setLanguage('en');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showOfflineMode();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'You are offline. Changes will sync when reconnected.',
        'ℹ',
        jasmine.objectContaining({
          duration: 8000,
          panelClass: ['session-notification', 'session-notification-info']
        })
      );
    });
  });

  /**
   * Custom Notification Tests
   */
  describe('showCustom()', () => {
    it('should display custom message with default info type', () => {
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showCustom('Custom session message');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Custom session message',
        '×',
        jasmine.objectContaining({
          duration: 4000,
          panelClass: ['session-notification', 'session-notification-info']
        })
      );
    });

    it('should display custom message with error type', () => {
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showCustom('Custom error', 5000, 'error');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Custom error',
        '×',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['session-notification', 'session-notification-error']
        })
      );
    });

    it('should display custom message with success type', () => {
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showCustom('Custom success', 3000, 'success');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Custom success',
        '×',
        jasmine.objectContaining({
          panelClass: ['session-notification', 'session-notification-success']
        })
      );
    });

    it('should display custom message with warning type', () => {
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showCustom('Custom warning', 4000, 'warning');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Custom warning',
        '×',
        jasmine.objectContaining({
          panelClass: ['session-notification', 'session-notification-warning']
        })
      );
    });
  });

  /**
   * Dismiss Notification Tests
   */
  describe('dismissAll()', () => {
    it('should dismiss all active notifications', () => {
      const dismissSpy = spyOn(snackBar, 'dismiss');

      service.dismissAll();

      expect(dismissSpy).toHaveBeenCalled();
    });
  });

  /**
   * RTL Support Tests
   */
  describe('RTL Support', () => {
    it('should use "end" position for LTR language (English)', () => {
      languageService.setLanguage('en');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionCreated();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.objectContaining({
          horizontalPosition: 'end'
        })
      );
    });

    it('should use "start" position for RTL language (Arabic)', () => {
      languageService.setLanguage('ar');
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionCreated();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.objectContaining({
          horizontalPosition: 'start'
        })
      );
    });
  });

  /**
   * Accessibility Tests
   */
  describe('Accessibility', () => {
    it('should use polite aria-live for non-error notifications', () => {
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      service.showSessionCreated();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.objectContaining({
          politeness: 'polite'
        })
      );
    });

    it('should use assertive aria-live for error notifications', () => {
      const snackBarSpy = spyOn(snackBar, 'open').and.returnValue({
        onAction: () => ({ subscribe: jasmine.createSpy('subscribe') })
      } as any);

      service.showSessionError();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.objectContaining({
          politeness: 'assertive'
        })
      );
    });
  });

  /**
   * Language Switching Tests
   */
  describe('Language Switching', () => {
    it('should switch notification language when language changes', () => {
      const snackBarSpy = spyOn(snackBar, 'open').and.callThrough();

      // English notification
      languageService.setLanguage('en');
      service.showSessionCreated();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'New guest session created',
        jasmine.any(String),
        jasmine.any(Object)
      );

      snackBarSpy.calls.reset();

      // Arabic notification
      languageService.setLanguage('ar');
      service.showSessionCreated();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'تم إنشاء جلسة زائر جديدة',
        jasmine.any(String),
        jasmine.any(Object)
      );
    });
  });
});
