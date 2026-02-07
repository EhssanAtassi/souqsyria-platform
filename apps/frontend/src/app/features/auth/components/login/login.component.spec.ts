/**
 * Unit tests for LoginComponent
 *
 * @description Tests the login form rendering, validation, submission,
 * NgRx store dispatch, query param handling (verified/passwordReset banners),
 * and password visibility toggle.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { LoginComponent } from './login.component';
import { AuthActions } from '../../store/auth.actions';
import { selectIsLoading, selectError } from '../../store/auth.selectors';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  const createComponent = (queryParams: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsLoading, value: false },
            { selector: selectError, value: null },
          ],
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of(queryParams),
          },
        },
      ],
    });

    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    fixture?.destroy();
  });

  // ─── Component creation ───────────────────────────────────────

  it('should create the component', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values', () => {
    createComponent();
    expect(component.form).toBeTruthy();
    expect(component.form.get('email')!.value).toBe('');
    expect(component.form.get('password')!.value).toBe('');
    expect(component.form.get('rememberMe')!.value).toBeFalse();
  });

  it('should dispatch clearError on init', () => {
    createComponent();
    expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.clearError());
  });

  // ─── Form validation ──────────────────────────────────────────

  describe('Form validation', () => {
    beforeEach(() => createComponent());

    it('should be invalid when empty', () => {
      expect(component.form.valid).toBeFalse();
    });

    it('should be invalid with invalid email', () => {
      component.form.patchValue({ email: 'not-an-email', password: '123456' });
      expect(component.form.valid).toBeFalse();
    });

    it('should be valid with correct email and password', () => {
      component.form.patchValue({ email: 'test@souq.sy', password: '123456' });
      expect(component.form.valid).toBeTrue();
    });

    it('should require email field', () => {
      component.form.patchValue({ email: '', password: '123456' });
      expect(component.form.get('email')!.hasError('required')).toBeTrue();
    });

    it('should require password field', () => {
      component.form.patchValue({ email: 'test@souq.sy', password: '' });
      expect(component.form.get('password')!.hasError('required')).toBeTrue();
    });
  });

  // ─── Form submission ──────────────────────────────────────────

  describe('onSubmit', () => {
    beforeEach(() => createComponent());

    it('should dispatch login action with valid form', () => {
      component.form.patchValue({ email: 'test@souq.sy', password: 'Pass123' });
      component.onSubmit();
      expect(dispatchSpy).toHaveBeenCalledWith(
        AuthActions.login({ email: 'test@souq.sy', password: 'Pass123' })
      );
    });

    it('should mark all fields as touched when form is invalid', () => {
      const markSpy = spyOn(component.form, 'markAllAsTouched');
      component.onSubmit();
      expect(markSpy).toHaveBeenCalled();
    });

    it('should not dispatch login when form is invalid', () => {
      component.onSubmit();
      const loginCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.login.type);
      expect(loginCalls.length).toBe(0);
    });
  });

  // ─── Password visibility toggle ──────────────────────────────

  describe('togglePasswordVisibility', () => {
    beforeEach(() => createComponent());

    it('should start with password hidden', () => {
      expect(component.hidePassword()).toBeTrue();
    });

    it('should toggle password visibility', () => {
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBeFalse();
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBeTrue();
    });
  });

  // ─── Query parameter banners ──────────────────────────────────

  describe('Success banners', () => {
    it('should show verified message when query param is set', () => {
      createComponent({ verified: 'true' });
      expect(component.showVerifiedMessage()).toBeTrue();
    });

    it('should not show verified message when query param absent', () => {
      createComponent();
      expect(component.showVerifiedMessage()).toBeFalse();
    });

    it('should show password reset message when query param is set', () => {
      createComponent({ passwordReset: 'true' });
      expect(component.showPasswordResetMessage()).toBeTrue();
    });

    it('should not show password reset message when query param absent', () => {
      createComponent();
      expect(component.showPasswordResetMessage()).toBeFalse();
    });
  });
});
