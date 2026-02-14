/**
 * Unit tests for OtpVerificationComponent
 *
 * @description Tests OTP form validation, submission, countdown timers,
 * resend OTP functionality, and redirect behavior.
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';

import { OtpVerificationComponent } from './otp-verification.component';
import { AuthActions } from '../../store/auth.actions';
import {
  selectIsLoading,
  selectError,
  selectOtpEmail,
} from '../../store/auth.selectors';

describe('OtpVerificationComponent', () => {
  let component: OtpVerificationComponent;
  let fixture: ComponentFixture<OtpVerificationComponent>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;
  let router: Router;

  const createComponent = (selectorOverrides: Record<string, any> = {}) => {
    TestBed.configureTestingModule({
      imports: [
        OtpVerificationComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsLoading, value: selectorOverrides['isLoading'] ?? false },
            { selector: selectError, value: selectorOverrides['error'] ?? null },
            { selector: selectOtpEmail, value: selectorOverrides['otpEmail'] ?? 'test@souq.sy' },
          ],
        }),
        provideRouter([]),
      ],
    });

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(OtpVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    fixture?.destroy();
  });

  // ─── Component creation ────────────────────────────────────────

  it('should create the component', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should dispatch clearError on init', () => {
    createComponent();
    expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.clearError());
  });

  // ─── Form initialization ──────────────────────────────────────

  describe('Form', () => {
    beforeEach(() => createComponent());

    it('should create form with otpCode control', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('otpCode')).toBeTruthy();
    });

    it('should be invalid when empty', () => {
      expect(component.form.valid).toBeFalse();
    });

    it('should be valid with 6-digit code', () => {
      component.form.patchValue({ otpCode: '123456' });
      expect(component.form.valid).toBeTrue();
    });

    it('should be invalid with non-6-digit code', () => {
      component.form.patchValue({ otpCode: '123' });
      expect(component.form.get('otpCode')!.hasError('otpFormat')).toBeTrue();
    });

    it('should be invalid with non-numeric characters', () => {
      component.form.patchValue({ otpCode: 'abcdef' });
      expect(component.form.get('otpCode')!.valid).toBeFalse();
    });
  });

  // ─── Form submission ───────────────────────────────────────────

  describe('onSubmit', () => {
    beforeEach(() => createComponent());

    it('should dispatch verifyOtp with email and code', () => {
      component.form.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(dispatchSpy).toHaveBeenCalledWith(
        AuthActions.verifyOtp({ email: 'test@souq.sy', otpCode: '123456' }),
      );
    });

    it('should mark form as touched when invalid', () => {
      const markSpy = spyOn(component.form, 'markAllAsTouched');
      component.onSubmit();
      expect(markSpy).toHaveBeenCalled();
    });

    it('should not dispatch when form is invalid', () => {
      component.onSubmit();
      const otpCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.verifyOtp.type);
      expect(otpCalls.length).toBe(0);
    });
  });

  // ─── Resend OTP ────────────────────────────────────────────────

  describe('resendOtp', () => {
    beforeEach(() => createComponent());

    it('should dispatch resendOtp action', () => {
      component.resendOtp();
      expect(dispatchSpy).toHaveBeenCalledWith(
        AuthActions.resendOtp({ email: 'test@souq.sy' }),
      );
    });

    it('should reset countdown to 60', () => {
      component.countdown.set(0);
      component.resendOtp();
      expect(component.countdown()).toBe(60);
    });

    it('should reset validity countdown to 600', () => {
      component.otpValidityCountdown.set(0);
      component.resendOtp();
      expect(component.otpValidityCountdown()).toBe(600);
    });
  });

  // ─── Countdown timer ──────────────────────────────────────────

  describe('Countdown', () => {
    it('should start at 60 seconds', () => {
      createComponent();
      expect(component.countdown()).toBe(60);
    });

    it('should decrement countdown each second', fakeAsync(() => {
      createComponent();
      tick(3000);
      expect(component.countdown()).toBe(57);
      fixture.destroy();
    }));
  });

  // ─── OTP validity timer ───────────────────────────────────────

  describe('OTP validity timer', () => {
    it('should start at 600 seconds (10 minutes)', () => {
      createComponent();
      expect(component.otpValidityCountdown()).toBe(600);
    });
  });

  // ─── formatTime ────────────────────────────────────────────────

  describe('formatTime', () => {
    beforeEach(() => createComponent());

    it('should format 600 seconds as 10:00', () => {
      expect(component.formatTime(600)).toBe('10:00');
    });

    it('should format 65 seconds as 1:05', () => {
      expect(component.formatTime(65)).toBe('1:05');
    });

    it('should format 0 as 0:00', () => {
      expect(component.formatTime(0)).toBe('0:00');
    });
  });

  // ─── Store signals ─────────────────────────────────────────────

  describe('Store signals', () => {
    it('should expose otpEmail from store', () => {
      createComponent({ otpEmail: 'user@souq.sy' });
      expect(component.otpEmail()).toBe('user@souq.sy');
    });

    it('should expose error from store', () => {
      createComponent({ error: 'Invalid OTP' });
      expect(component.error()).toBe('Invalid OTP');
    });
  });
});
