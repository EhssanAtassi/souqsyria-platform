/**
 * Unit tests for ResetPasswordComponent
 *
 * @description Tests the reset password form validation, submission,
 * token extraction from URL, success/invalid-token states, and password toggles.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthActions } from '../../store/auth.actions';
import {
  selectIsLoading,
  selectError,
  selectPasswordResetSuccess,
} from '../../store/auth.selectors';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  const createComponent = (
    queryParams: Record<string, string> = { token: 'valid-reset-token' },
    selectorOverrides: Record<string, any> = {},
  ) => {
    TestBed.configureTestingModule({
      imports: [
        ResetPasswordComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsLoading, value: selectorOverrides['isLoading'] ?? false },
            { selector: selectError, value: selectorOverrides['error'] ?? null },
            { selector: selectPasswordResetSuccess, value: selectorOverrides['passwordResetSuccess'] ?? false },
          ],
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of(queryParams),
            snapshot: { queryParams },
          },
        },
      ],
    });

    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => fixture?.destroy());

  // ─── Component creation ────────────────────────────────────────

  it('should create the component', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should dispatch clearError on init', () => {
    createComponent();
    expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.clearError());
  });

  // ─── Token from URL ────────────────────────────────────────────

  describe('Reset token', () => {
    it('should read token from query params', () => {
      createComponent({ token: 'my-token' });
      expect(component.resetToken()).toBe('my-token');
    });

    it('should be null when no token in query params', () => {
      createComponent({});
      expect(component.resetToken()).toBeNull();
    });
  });

  // ─── Form initialization ──────────────────────────────────────

  describe('Form', () => {
    beforeEach(() => createComponent());

    it('should create form with password and confirmPassword', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
      expect(component.form.get('confirmPassword')).toBeTruthy();
    });

    it('should be invalid when empty', () => {
      expect(component.form.valid).toBeFalse();
    });

    it('should be valid with strong matching passwords', () => {
      component.form.patchValue({
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      });
      expect(component.form.valid).toBeTrue();
    });

    it('should reject weak password', () => {
      component.form.patchValue({
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(component.form.get('password')!.valid).toBeFalse();
    });

    it('should reject mismatched passwords', () => {
      component.form.patchValue({
        password: 'StrongPass1',
        confirmPassword: 'Different1',
      });
      expect(component.form.get('confirmPassword')!.hasError('passwordMismatch')).toBeTrue();
    });
  });

  // ─── Form submission ───────────────────────────────────────────

  describe('onSubmit', () => {
    beforeEach(() => createComponent({ token: 'reset-tok' }));

    it('should dispatch resetPassword with token and new password', () => {
      component.form.patchValue({
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      });
      component.onSubmit();

      expect(dispatchSpy).toHaveBeenCalledWith(
        AuthActions.resetPassword({
          resetToken: 'reset-tok',
          newPassword: 'NewPass1',
        }),
      );
    });

    it('should mark all fields as touched when form is invalid', () => {
      const markSpy = spyOn(component.form, 'markAllAsTouched');
      component.onSubmit();
      expect(markSpy).toHaveBeenCalled();
    });

    it('should not dispatch when form is invalid', () => {
      component.onSubmit();
      const rpCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.resetPassword.type);
      expect(rpCalls.length).toBe(0);
    });
  });

  // ─── Password visibility ──────────────────────────────────────

  describe('Password visibility', () => {
    beforeEach(() => createComponent());

    it('should start with passwords hidden', () => {
      expect(component.hidePassword()).toBeTrue();
      expect(component.hideConfirmPassword()).toBeTrue();
    });

    it('should toggle new password visibility', () => {
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBeFalse();
    });

    it('should toggle confirm password visibility', () => {
      component.toggleConfirmPasswordVisibility();
      expect(component.hideConfirmPassword()).toBeFalse();
    });
  });

  // ─── UI states ─────────────────────────────────────────────────

  describe('UI states', () => {
    it('should show form when token exists and reset not complete', () => {
      createComponent({ token: 'tok' }, { passwordResetSuccess: false });
      const formEl = fixture.nativeElement.querySelector('form');
      expect(formEl).toBeTruthy();
    });

    it('should show success card after successful reset', () => {
      createComponent({ token: 'tok' }, { passwordResetSuccess: true });
      const successCard = fixture.nativeElement.querySelector('.success-card');
      expect(successCard).toBeTruthy();
    });

    it('should show invalid-token card when no token', () => {
      createComponent({}, { passwordResetSuccess: false });
      const invalidCard = fixture.nativeElement.querySelector('.invalid-token-card');
      expect(invalidCard).toBeTruthy();
    });
  });

  // ─── Store signals ─────────────────────────────────────────────

  describe('Store signals', () => {
    it('should expose error from store', () => {
      createComponent({ token: 'tok' }, { error: 'Token expired' });
      expect(component.error()).toBe('Token expired');
    });

    it('should expose passwordResetSuccess from store', () => {
      createComponent({ token: 'tok' }, { passwordResetSuccess: true });
      expect(component.passwordResetSuccess()).toBeTrue();
    });
  });
});
