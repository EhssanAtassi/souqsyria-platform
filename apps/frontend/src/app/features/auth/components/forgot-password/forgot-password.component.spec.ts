/**
 * Unit tests for ForgotPasswordComponent
 *
 * @description Tests the forgot password form validation, submission,
 * success state UI switching, and NgRx store integration.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthActions } from '../../store/auth.actions';
import {
  selectIsLoading,
  selectError,
  selectResetEmailSent,
} from '../../store/auth.selectors';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  const createComponent = (selectorOverrides: Record<string, any> = {}) => {
    TestBed.configureTestingModule({
      imports: [
        ForgotPasswordComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsLoading, value: selectorOverrides['isLoading'] ?? false },
            { selector: selectError, value: selectorOverrides['error'] ?? null },
            { selector: selectResetEmailSent, value: selectorOverrides['resetEmailSent'] ?? false },
          ],
        }),
        { provide: ActivatedRoute, useValue: { queryParams: of({}), snapshot: { queryParams: {} } } },
      ],
    });

    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
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

  // ─── Form initialization ──────────────────────────────────────

  describe('Form', () => {
    beforeEach(() => createComponent());

    it('should create form with email control', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('email')).toBeTruthy();
    });

    it('should be invalid when empty', () => {
      expect(component.form.valid).toBeFalse();
    });

    it('should be valid with correct email', () => {
      component.form.patchValue({ email: 'test@souq.sy' });
      expect(component.form.valid).toBeTrue();
    });

    it('should be invalid with bad email format', () => {
      component.form.patchValue({ email: 'not-email' });
      expect(component.form.get('email')!.hasError('email')).toBeTrue();
    });

    it('should require email', () => {
      component.form.patchValue({ email: '' });
      expect(component.form.get('email')!.hasError('required')).toBeTrue();
    });
  });

  // ─── Form submission ───────────────────────────────────────────

  describe('onSubmit', () => {
    beforeEach(() => createComponent());

    it('should dispatch forgotPassword with email', () => {
      component.form.patchValue({ email: 'test@souq.sy' });
      component.onSubmit();

      expect(dispatchSpy).toHaveBeenCalledWith(
        AuthActions.forgotPassword({ email: 'test@souq.sy' }),
      );
    });

    it('should mark all fields as touched when invalid', () => {
      const markSpy = spyOn(component.form, 'markAllAsTouched');
      component.onSubmit();
      expect(markSpy).toHaveBeenCalled();
    });

    it('should not dispatch when form is invalid', () => {
      component.onSubmit();
      const fpCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.forgotPassword.type);
      expect(fpCalls.length).toBe(0);
    });
  });

  // ─── Store signals ─────────────────────────────────────────────

  describe('Store signals', () => {
    it('should expose isLoading from store', () => {
      createComponent({ isLoading: true });
      expect(component.isLoading()).toBeTrue();
    });

    it('should expose error from store', () => {
      createComponent({ error: 'Something went wrong' });
      expect(component.error()).toBe('Something went wrong');
    });

    it('should expose resetEmailSent from store', () => {
      createComponent({ resetEmailSent: true });
      expect(component.resetEmailSent()).toBeTrue();
    });

    it('should default resetEmailSent to false', () => {
      createComponent();
      expect(component.resetEmailSent()).toBeFalse();
    });
  });

  // ─── UI state switching ────────────────────────────────────────

  describe('UI states', () => {
    it('should show form when resetEmailSent is false', () => {
      createComponent({ resetEmailSent: false });
      const formEl = fixture.nativeElement.querySelector('form');
      expect(formEl).toBeTruthy();
    });

    it('should show success card when resetEmailSent is true', () => {
      createComponent({ resetEmailSent: true });
      const successCard = fixture.nativeElement.querySelector('.success-card');
      expect(successCard).toBeTruthy();
    });
  });
});
