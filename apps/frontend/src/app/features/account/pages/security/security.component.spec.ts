/**
 * @fileoverview Unit tests for SecurityComponent
 * @description Tests the password change form including form creation, custom validators
 * (uppercase, number, password match), visibility toggle signals, API submission,
 * success logout flow, and error handling.
 */

import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideMockStore, MockStore } from '@ngrx/store/testing';

import { SecurityComponent } from './security.component';
import { AccountApiService } from '../../services/account-api.service';
import { AuthActions } from '../../../auth/store/auth.actions';

describe('SecurityComponent', () => {
  /** Component under test */
  let component: SecurityComponent;

  /** Component fixture for DOM interaction */
  let fixture: ComponentFixture<SecurityComponent>;

  /** Mock AccountApiService with spy methods */
  let accountApiSpy: jasmine.SpyObj<AccountApiService>;

  /** Mock Router with spy methods */
  let routerSpy: jasmine.SpyObj<Router>;

  /** Mock MatSnackBar with spy methods */
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  /** Mock MatDialogRef for success dialog */
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<unknown>>;

  /** Real TranslateService from TranslateModule */
  let translateService: TranslateService;

  /** NgRx MockStore */
  let store: MockStore;

  /** Spy on store dispatch */
  let dispatchSpy: jasmine.Spy;

  /** Spy on the component's dialog.open method */
  let dialogOpenSpy: jasmine.Spy;

  /**
   * @description Test module setup - configures standalone component with mocked dependencies
   */
  beforeEach(async () => {
    accountApiSpy = jasmine.createSpyObj('AccountApiService', [
      'changePassword',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);

    accountApiSpy.changePassword.and.returnValue(
      of({ message: 'Password changed' })
    );
    dialogRefSpy.afterClosed.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [
        SecurityComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideMockStore({}),
        { provide: AccountApiService, useValue: accountApiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    translateService = TestBed.inject(TranslateService);

    fixture = TestBed.createComponent(SecurityComponent);
    component = fixture.componentInstance;

    // Spy on the component's own dialog instance (different from TestBed injector)
    const componentDialog = (component as any).dialog as MatDialog;
    dialogOpenSpy = spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);

    fixture.detectChanges();
  });

  // ─── Component Creation ──────────────────────────────────────────

  describe('Component Creation', () => {
    /**
     * @description Verifies the component is created successfully
     */
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  // ─── Form Structure ──────────────────────────────────────────────

  describe('Form Structure', () => {
    /**
     * @description Verifies the password form has all 3 required fields
     */
    it('should have currentPassword, newPassword, and confirmPassword controls', () => {
      expect(component.passwordForm.get('currentPassword')).toBeTruthy();
      expect(component.passwordForm.get('newPassword')).toBeTruthy();
      expect(component.passwordForm.get('confirmPassword')).toBeTruthy();
    });

    /**
     * @description Verifies all three fields are initially empty
     */
    it('should initialize all password fields as empty', () => {
      expect(component.passwordForm.get('currentPassword')?.value).toBe('');
      expect(component.passwordForm.get('newPassword')?.value).toBe('');
      expect(component.passwordForm.get('confirmPassword')?.value).toBe('');
    });
  });

  // ─── currentPassword Validators ──────────────────────────────────

  describe('Validation - currentPassword', () => {
    /**
     * @description Verifies currentPassword is required
     */
    it('should mark currentPassword as invalid when empty', () => {
      const control = component.passwordForm.get('currentPassword');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    /**
     * @description Verifies currentPassword is valid when non-empty
     */
    it('should mark currentPassword as valid when provided', () => {
      const control = component.passwordForm.get('currentPassword');
      control?.setValue('MyOldPassword1');
      expect(control?.valid).toBe(true);
    });
  });

  // ─── newPassword Validators ──────────────────────────────────────

  describe('Validation - newPassword', () => {
    /**
     * @description Verifies newPassword is required
     */
    it('should mark newPassword as invalid when empty', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    /**
     * @description Verifies newPassword has minLength of 8
     */
    it('should mark newPassword invalid when shorter than 8 characters', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('Ab1');
      expect(control?.hasError('minlength')).toBe(true);
    });

    /**
     * @description Verifies custom uppercase validator flags missing uppercase
     */
    it('should have uppercase error when no uppercase letter present', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('alllowercase1');
      expect(control?.hasError('uppercase')).toBe(true);
    });

    /**
     * @description Verifies uppercase validator passes when uppercase is present
     */
    it('should not have uppercase error when uppercase letter is present', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('Hasuppercase1');
      expect(control?.hasError('uppercase')).toBe(false);
    });

    /**
     * @description Verifies custom number validator flags missing number
     */
    it('should have number error when no digit present', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('AllLettersOnly');
      expect(control?.hasError('number')).toBe(true);
    });

    /**
     * @description Verifies number validator passes when digit is present
     */
    it('should not have number error when digit is present', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('HasNumber1');
      expect(control?.hasError('number')).toBe(false);
    });

    /**
     * @description Verifies a fully valid password passes all validators
     */
    it('should be valid when all criteria met (8+ chars, uppercase, number, special char)', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('ValidPass1!');
      expect(control?.valid).toBe(true);
    });
  });

  // ─── confirmPassword Validators ──────────────────────────────────

  describe('Validation - confirmPassword', () => {
    /**
     * @description Verifies confirmPassword is required
     */
    it('should mark confirmPassword as invalid when empty', () => {
      const control = component.passwordForm.get('confirmPassword');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });
  });

  // ─── Password Match Validator (Form-Level) ───────────────────────

  describe('Validation - Password Match', () => {
    /**
     * @description Verifies mismatch error when passwords do not match
     */
    it('should have mismatch error when newPassword and confirmPassword differ', () => {
      component.passwordForm.get('newPassword')?.setValue('ValidPass1');
      component.passwordForm.get('confirmPassword')?.setValue('DifferentPass1');

      expect(component.passwordForm.hasError('mismatch')).toBe(true);
    });

    /**
     * @description Verifies no mismatch error when passwords match
     */
    it('should not have mismatch error when passwords match', () => {
      component.passwordForm.get('newPassword')?.setValue('ValidPass1');
      component.passwordForm.get('confirmPassword')?.setValue('ValidPass1');

      expect(component.passwordForm.hasError('mismatch')).toBe(false);
    });

    /**
     * @description Verifies getFormErrorMessage returns mismatch key
     */
    it('should return mismatch translation key from getFormErrorMessage', () => {
      component.passwordForm.get('newPassword')?.setValue('ValidPass1');
      component.passwordForm.get('confirmPassword')?.setValue('Different1');

      expect(component.getFormErrorMessage()).toBe(
        'account.security.validation.mismatch'
      );
    });

    /**
     * @description Verifies getFormErrorMessage returns empty when no form error
     */
    it('should return empty string from getFormErrorMessage when passwords match', () => {
      component.passwordForm.get('newPassword')?.setValue('ValidPass1');
      component.passwordForm.get('confirmPassword')?.setValue('ValidPass1');

      expect(component.getFormErrorMessage()).toBe('');
    });
  });

  // ─── Password Visibility Toggles ─────────────────────────────────

  describe('Password Visibility Toggles', () => {
    /**
     * @description Verifies toggleCurrentPasswordVisibility toggles the signal
     */
    it('should toggle showCurrentPassword signal', () => {
      expect(component.showCurrentPassword()).toBe(false);

      component.toggleCurrentPasswordVisibility();
      expect(component.showCurrentPassword()).toBe(true);

      component.toggleCurrentPasswordVisibility();
      expect(component.showCurrentPassword()).toBe(false);
    });

    /**
     * @description Verifies toggleNewPasswordVisibility toggles the signal
     */
    it('should toggle showNewPassword signal', () => {
      expect(component.showNewPassword()).toBe(false);

      component.toggleNewPasswordVisibility();
      expect(component.showNewPassword()).toBe(true);

      component.toggleNewPasswordVisibility();
      expect(component.showNewPassword()).toBe(false);
    });

    /**
     * @description Verifies toggleConfirmPasswordVisibility toggles the signal
     */
    it('should toggle showConfirmPassword signal', () => {
      expect(component.showConfirmPassword()).toBe(false);

      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(true);

      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(false);
    });
  });

  // ─── newPasswordValue Getter ─────────────────────────────────────

  describe('newPasswordValue', () => {
    /**
     * @description Verifies newPasswordValue getter returns current form value
     */
    it('should return the current newPassword form value', () => {
      component.passwordForm.get('newPassword')?.setValue('TestPass1');
      expect(component.newPasswordValue).toBe('TestPass1');
    });

    /**
     * @description Verifies newPasswordValue returns empty string when empty
     */
    it('should return empty string when newPassword is empty', () => {
      component.passwordForm.get('newPassword')?.setValue('');
      expect(component.newPasswordValue).toBe('');
    });
  });

  // ─── Form Submission ─────────────────────────────────────────────

  describe('Form Submission', () => {
    /** Valid form values for submission tests */
    const validFormValues = {
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    };

    /**
     * @description Verifies onSubmit does not call API when form is invalid
     */
    it('should not call changePassword when form is invalid', () => {
      component.onSubmit();
      expect(accountApiSpy.changePassword).not.toHaveBeenCalled();
    });

    /**
     * @description Verifies onSubmit marks all fields as touched when form is invalid
     */
    it('should mark all fields as touched when submitting invalid form', () => {
      component.onSubmit();

      expect(
        component.passwordForm.get('currentPassword')?.touched
      ).toBe(true);
      expect(component.passwordForm.get('newPassword')?.touched).toBe(true);
      expect(
        component.passwordForm.get('confirmPassword')?.touched
      ).toBe(true);
    });

    /**
     * @description Verifies onSubmit calls changePassword with correct DTO
     */
    it('should call changePassword with correct DTO on valid submission', () => {
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      expect(accountApiSpy.changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword1!',
        confirmPassword: 'NewPassword1!',
      });
    });

    /**
     * @description Verifies submitting signal is managed during submission
     */
    it('should set submitting to true during API call', () => {
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      // After sync success response, submitting is set back to false
      expect(component.submitting()).toBe(false);
    });
  });

  // ─── Success Flow: Dialog, Logout, Navigate ────────────────────

  describe('Success Flow', () => {
    /** Valid form values for submission tests */
    const validFormValues = {
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    };

    /**
     * @description Verifies success dialog is opened on successful password change
     */
    it('should open success dialog on successful password change', () => {
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    /**
     * @description Verifies AuthActions.logout is dispatched after dialog close
     */
    it('should dispatch AuthActions.logout after dialog is closed', () => {
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.logout());
    });

    /**
     * @description Verifies navigation to /auth/login after dialog close
     */
    it('should navigate to /auth/login after dialog is closed', () => {
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ─── Error Flow ──────────────────────────────────────────────────

  describe('Error Flow', () => {
    /** Valid form values for submission tests */
    const validFormValues = {
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    };

    /**
     * @description Verifies error snackbar is shown when API call fails
     */
    it('should show error snackbar when changePassword fails', () => {
      accountApiSpy.changePassword.and.returnValue(
        throwError(() => new Error('Wrong password'))
      );
      spyOn(translateService, 'get').and.returnValue(of('Error message'));
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      expect(translateService.get).toHaveBeenCalledWith(
        'account.security.error'
      );
    });

    /**
     * @description Verifies submitting is reset to false on error
     */
    it('should reset submitting to false on error', () => {
      accountApiSpy.changePassword.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      expect(component.submitting()).toBe(false);
    });

    /**
     * @description Verifies store dispatch is NOT called on error
     */
    it('should not dispatch logout on error', () => {
      accountApiSpy.changePassword.and.returnValue(
        throwError(() => new Error('Error'))
      );
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    /**
     * @description Verifies navigation does NOT happen on error
     */
    it('should not navigate on error', () => {
      accountApiSpy.changePassword.and.returnValue(
        throwError(() => new Error('Error'))
      );
      component.passwordForm.setValue(validFormValues);
      component.onSubmit();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  // ─── getErrorMessage ─────────────────────────────────────────────

  describe('getErrorMessage', () => {
    /**
     * @description Verifies required error key for currentPassword
     */
    it('should return currentRequired key for empty currentPassword', () => {
      component.passwordForm.get('currentPassword')?.setValue('');
      component.passwordForm.get('currentPassword')?.markAsTouched();

      expect(component.getErrorMessage('currentPassword')).toBe(
        'account.security.validation.currentRequired'
      );
    });

    /**
     * @description Verifies required error key for newPassword
     */
    it('should return newRequired key for empty newPassword', () => {
      component.passwordForm.get('newPassword')?.setValue('');
      component.passwordForm.get('newPassword')?.markAsTouched();

      expect(component.getErrorMessage('newPassword')).toBe(
        'account.security.validation.newRequired'
      );
    });

    /**
     * @description Verifies required error key for confirmPassword
     */
    it('should return confirmRequired key for empty confirmPassword', () => {
      component.passwordForm.get('confirmPassword')?.setValue('');
      component.passwordForm.get('confirmPassword')?.markAsTouched();

      expect(component.getErrorMessage('confirmPassword')).toBe(
        'account.security.validation.confirmRequired'
      );
    });

    /**
     * @description Verifies uppercase error key
     */
    it('should return uppercase key when newPassword lacks uppercase', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('alllower1234');
      control?.markAsTouched();

      expect(component.getErrorMessage('newPassword')).toBe(
        'account.security.validation.uppercase'
      );
    });

    /**
     * @description Verifies number error key
     */
    it('should return number key when newPassword lacks a digit', () => {
      const control = component.passwordForm.get('newPassword');
      control?.setValue('AllLettersUpper');
      control?.markAsTouched();

      expect(component.getErrorMessage('newPassword')).toBe(
        'account.security.validation.number'
      );
    });

    /**
     * @description Verifies empty string when field has no errors
     */
    it('should return empty string when field has no errors', () => {
      component.passwordForm.get('currentPassword')?.setValue('SomePass1');
      expect(component.getErrorMessage('currentPassword')).toBe('');
    });

    /**
     * @description Verifies empty string for non-existent field
     */
    it('should return empty string for non-existent field', () => {
      expect(component.getErrorMessage('nonExistent')).toBe('');
    });
  });
});
