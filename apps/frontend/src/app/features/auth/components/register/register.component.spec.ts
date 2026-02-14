/**
 * Unit tests for RegisterComponent
 *
 * @description Tests the registration form rendering, validation, submission,
 * NgRx store dispatch, and password visibility toggles.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthActions } from '../../store/auth.actions';
import { selectIsLoading, selectError } from '../../store/auth.selectors';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  const createComponent = (selectorOverrides: Record<string, any> = {}) => {
    TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsLoading, value: selectorOverrides['isLoading'] ?? false },
            { selector: selectError, value: selectorOverrides['error'] ?? null },
          ],
        }),
        { provide: ActivatedRoute, useValue: { queryParams: of({}), snapshot: { queryParams: {} } } },
      ],
    });

    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

    fixture = TestBed.createComponent(RegisterComponent);
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

  describe('Form initialization', () => {
    beforeEach(() => createComponent());

    it('should create form with 4 controls', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('fullName')).toBeTruthy();
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
      expect(component.form.get('confirmPassword')).toBeTruthy();
    });

    it('should initialize with empty values', () => {
      expect(component.form.get('email')!.value).toBe('');
      expect(component.form.get('password')!.value).toBe('');
      expect(component.form.get('fullName')!.value).toBe('');
    });
  });

  // ─── Form validation ──────────────────────────────────────────

  describe('Form validation', () => {
    beforeEach(() => createComponent());

    it('should be invalid when empty', () => {
      expect(component.form.valid).toBeFalse();
    });

    it('should require full name', () => {
      component.form.patchValue({
        fullName: '',
        email: 'test@souq.sy',
        password: 'Pass1234',
        confirmPassword: 'Pass1234',
      });
      expect(component.form.get('fullName')!.hasError('required')).toBeTrue();
    });

    it('should require valid email', () => {
      component.form.patchValue({
        fullName: 'Test',
        email: 'not-email',
        password: 'Pass1234',
        confirmPassword: 'Pass1234',
      });
      expect(component.form.get('email')!.hasError('email')).toBeTrue();
    });

    it('should require strong password (min 8 chars, uppercase, number)', () => {
      component.form.patchValue({
        fullName: 'Test',
        email: 'test@souq.sy',
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(component.form.get('password')!.valid).toBeFalse();
    });

    it('should accept valid strong password', () => {
      component.form.patchValue({
        fullName: 'Test',
        email: 'test@souq.sy',
        password: 'StrongPass1',
        confirmPassword: 'StrongPass1',
      });
      expect(component.form.valid).toBeTrue();
    });

    it('should reject mismatched passwords', () => {
      component.form.patchValue({
        fullName: 'Test',
        email: 'test@souq.sy',
        password: 'StrongPass1',
        confirmPassword: 'Different1',
      });
      expect(component.form.get('confirmPassword')!.hasError('passwordMismatch')).toBeTrue();
    });
  });

  // ─── Form submission ───────────────────────────────────────────

  describe('onSubmit', () => {
    beforeEach(() => createComponent());

    it('should dispatch register action with valid form data', () => {
      component.form.patchValue({
        fullName: 'Test User',
        email: 'test@souq.sy',
        password: 'StrongPass1',
        confirmPassword: 'StrongPass1',
      });
      component.onSubmit();

      expect(dispatchSpy).toHaveBeenCalledWith(
        AuthActions.register({
          email: 'test@souq.sy',
          password: 'StrongPass1',
          fullName: 'Test User',
        }),
      );
    });

    it('should mark all fields as touched when form is invalid', () => {
      const markSpy = spyOn(component.form, 'markAllAsTouched');
      component.onSubmit();
      expect(markSpy).toHaveBeenCalled();
    });

    it('should not dispatch register when form is invalid', () => {
      component.onSubmit();
      const registerCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.register.type);
      expect(registerCalls.length).toBe(0);
    });
  });

  // ─── Password visibility toggles ──────────────────────────────

  describe('Password visibility', () => {
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

    it('should start with confirm password hidden', () => {
      expect(component.hideConfirmPassword()).toBeTrue();
    });

    it('should toggle confirm password visibility', () => {
      component.toggleConfirmPasswordVisibility();
      expect(component.hideConfirmPassword()).toBeFalse();
    });
  });

  // ─── Store signals ─────────────────────────────────────────────

  describe('Store signals', () => {
    it('should expose isLoading from store', () => {
      createComponent({ isLoading: true });
      expect(component.isLoading()).toBeTrue();
    });

    it('should expose error from store', () => {
      createComponent({ error: 'Email already registered' });
      expect(component.error()).toBe('Email already registered');
    });
  });
});
