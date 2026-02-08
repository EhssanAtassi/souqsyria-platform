/**
 * @fileoverview Unit tests for ProfileEditComponent
 * @description Tests the profile edit form including form creation, validation rules,
 * avatar upload/removal, form submission, API integration, snackbar notifications,
 * and navigation behavior.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProfileEditComponent } from './profile-edit.component';
import { AccountApiService } from '../../services/account-api.service';
import { UserProfile } from '../../models/user-profile.interface';

/**
 * @description Factory to create a mock UserProfile for test assertions
 * @returns {UserProfile} Complete mock user profile
 */
function createMockProfile(): UserProfile {
  return {
    id: 1,
    email: 'user@souq.sy',
    phone: '+963912345678',
    fullName: 'Ahmad Khalil',
    avatar: 'https://example.com/avatar.jpg',
    isVerified: true,
    role: { id: 1, name: 'customer' },
    ordersCount: 5,
    wishlistCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  };
}

describe('ProfileEditComponent', () => {
  /** Component under test */
  let component: ProfileEditComponent;

  /** Component fixture for DOM interaction */
  let fixture: ComponentFixture<ProfileEditComponent>;

  /** Mock AccountApiService with spy methods */
  let accountApiSpy: jasmine.SpyObj<AccountApiService>;

  /** Mock Router with spy methods */
  let routerSpy: jasmine.SpyObj<Router>;

  /** Mock MatSnackBar with spy methods */
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  /** Mock TranslateService with spy methods */
  let translateSpy: jasmine.SpyObj<TranslateService>;

  /**
   * @description Test module setup - configures standalone component with mocked dependencies
   */
  beforeEach(async () => {
    accountApiSpy = jasmine.createSpyObj('AccountApiService', [
      'getProfile',
      'updateProfile',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    translateSpy = jasmine.createSpyObj('TranslateService', ['get']);

    // Default: return a valid profile
    accountApiSpy.getProfile.and.returnValue(of(createMockProfile()));
    accountApiSpy.updateProfile.and.returnValue(of(createMockProfile()));
    translateSpy.get.and.returnValue(of('Translated message'));

    await TestBed.configureTestingModule({
      imports: [
        ProfileEditComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: AccountApiService, useValue: accountApiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: TranslateService, useValue: translateSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditComponent);
    component = fixture.componentInstance;
  });

  // ─── Component Creation ──────────────────────────────────────────

  describe('Component Creation', () => {
    /**
     * @description Verifies the component is created successfully
     */
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    /**
     * @description Verifies the profile form is initialized with required controls
     */
    it('should initialize the profileForm with fullName and phone controls', () => {
      expect(component.profileForm).toBeTruthy();
      expect(component.profileForm.get('fullName')).toBeTruthy();
      expect(component.profileForm.get('phone')).toBeTruthy();
    });
  });

  // ─── Profile Loading & Form Population ───────────────────────────

  describe('Profile Loading', () => {
    /**
     * @description Verifies loadProfile is called on init and populates form
     */
    it('should call getProfile and populate form on init', () => {
      fixture.detectChanges();

      expect(accountApiSpy.getProfile).toHaveBeenCalledTimes(1);
      expect(component.profileForm.get('fullName')?.value).toBe('Ahmad Khalil');
      expect(component.profileForm.get('phone')?.value).toBe('+963912345678');
    });

    /**
     * @description Verifies loading signal is set to false after successful load
     */
    it('should set loading to false after successful load', () => {
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    /**
     * @description Verifies avatar preview is set from profile data
     */
    it('should set avatarPreview from existing profile avatar', () => {
      fixture.detectChanges();
      expect(component.avatarPreview()).toBe('https://example.com/avatar.jpg');
    });

    /**
     * @description Verifies form is populated with empty strings when profile has no optional fields
     */
    it('should populate form with empty strings when profile fields are null', () => {
      const profileNoOptionals: UserProfile = {
        ...createMockProfile(),
        fullName: undefined,
        phone: undefined,
        avatar: undefined,
      };
      accountApiSpy.getProfile.and.returnValue(of(profileNoOptionals));
      fixture.detectChanges();

      expect(component.profileForm.get('fullName')?.value).toBe('');
      expect(component.profileForm.get('phone')?.value).toBe('');
      expect(component.avatarPreview()).toBeNull();
    });

    /**
     * @description Verifies error handling shows snackbar on load failure
     */
    it('should show error snackbar when profile load fails', () => {
      accountApiSpy.getProfile.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
      expect(translateSpy.get).toHaveBeenCalledWith('account.editProfile.error');
    });
  });

  // ─── Form Validation: fullName ───────────────────────────────────

  describe('Form Validation - fullName', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    /**
     * @description Verifies fullName is required
     */
    it('should mark fullName as invalid when empty', () => {
      const fullName = component.profileForm.get('fullName');
      fullName?.setValue('');
      expect(fullName?.hasError('required')).toBe(true);
    });

    /**
     * @description Verifies fullName minimum length is 2
     */
    it('should mark fullName invalid when less than 2 characters', () => {
      const fullName = component.profileForm.get('fullName');
      fullName?.setValue('A');
      expect(fullName?.hasError('minlength')).toBe(true);
    });

    /**
     * @description Verifies fullName is valid at exactly 2 characters
     */
    it('should mark fullName valid at exactly 2 characters', () => {
      const fullName = component.profileForm.get('fullName');
      fullName?.setValue('AB');
      expect(fullName?.valid).toBe(true);
    });

    /**
     * @description Verifies fullName maximum length is 100
     */
    it('should mark fullName invalid when exceeding 100 characters', () => {
      const fullName = component.profileForm.get('fullName');
      fullName?.setValue('A'.repeat(101));
      expect(fullName?.hasError('maxlength')).toBe(true);
    });

    /**
     * @description Verifies fullName is valid at exactly 100 characters
     */
    it('should mark fullName valid at exactly 100 characters', () => {
      const fullName = component.profileForm.get('fullName');
      fullName?.setValue('A'.repeat(100));
      expect(fullName?.valid).toBe(true);
    });
  });

  // ─── Form Validation: phone ──────────────────────────────────────

  describe('Form Validation - phone', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    /**
     * @description Verifies phone field accepts valid Syrian phone number
     */
    it('should accept valid Syrian phone number +963XXXXXXXXX', () => {
      const phone = component.profileForm.get('phone');
      phone?.setValue('+963912345678');
      expect(phone?.valid).toBe(true);
    });

    /**
     * @description Verifies phone field rejects invalid format
     */
    it('should reject phone number without +963 prefix', () => {
      const phone = component.profileForm.get('phone');
      phone?.setValue('0912345678');
      expect(phone?.hasError('pattern')).toBe(true);
    });

    /**
     * @description Verifies phone rejects too few digits after +963
     */
    it('should reject phone with fewer than 9 digits after +963', () => {
      const phone = component.profileForm.get('phone');
      phone?.setValue('+96391234567');
      expect(phone?.hasError('pattern')).toBe(true);
    });

    /**
     * @description Verifies phone rejects too many digits after +963
     */
    it('should reject phone with more than 9 digits after +963', () => {
      const phone = component.profileForm.get('phone');
      phone?.setValue('+9639123456789');
      expect(phone?.hasError('pattern')).toBe(true);
    });

    /**
     * @description Verifies phone field is optional (empty is valid)
     */
    it('should accept empty phone (field is optional)', () => {
      const phone = component.profileForm.get('phone');
      phone?.setValue('');
      expect(phone?.valid).toBe(true);
    });

    /**
     * @description Verifies phone rejects non-numeric characters
     */
    it('should reject phone with alphabetic characters', () => {
      const phone = component.profileForm.get('phone');
      phone?.setValue('+963abcdefghi');
      expect(phone?.hasError('pattern')).toBe(true);
    });
  });

  // ─── Avatar Operations ───────────────────────────────────────────

  describe('Avatar Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    /**
     * @description Verifies onAvatarChange reads file and sets preview using FileReader
     */
    it('should set avatar preview and data on valid image file selection', fakeAsync(() => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgo=';
      const mockFile = new File(['test'], 'avatar.png', { type: 'image/png' });

      // Create a mock FileReader
      const mockReader = {
        result: mockBase64,
        readAsDataURL: function () {
          // Simulate async FileReader behavior
          setTimeout(() => {
            this.onload?.();
          }, 0);
        },
        onload: null as (() => void) | null,
      };
      spyOn(window, 'FileReader' as any).and.returnValue(mockReader as any);

      const event = {
        target: { files: [mockFile] },
      } as unknown as Event;

      component.onAvatarChange(event);
      tick();

      expect(component.avatarPreview()).toBe(mockBase64);
      expect(component.avatarData()).toBe(mockBase64);
    }));

    /**
     * @description Verifies onAvatarChange does nothing when no file selected
     */
    it('should not change preview when no file is selected', () => {
      const event = {
        target: { files: [] },
      } as unknown as Event;

      const previousPreview = component.avatarPreview();
      component.onAvatarChange(event);

      expect(component.avatarPreview()).toBe(previousPreview);
    });

    /**
     * @description Verifies onAvatarChange does nothing when files is null
     */
    it('should not change preview when input.files is null', () => {
      const event = {
        target: { files: null },
      } as unknown as Event;

      const previousPreview = component.avatarPreview();
      component.onAvatarChange(event);

      expect(component.avatarPreview()).toBe(previousPreview);
    });

    /**
     * @description Verifies onAvatarChange rejects non-image files
     */
    it('should show error snackbar for non-image files', () => {
      const mockFile = new File(['test'], 'doc.pdf', {
        type: 'application/pdf',
      });
      const event = {
        target: { files: [mockFile] },
      } as unknown as Event;

      component.onAvatarChange(event);

      expect(translateSpy.get).toHaveBeenCalled();
    });

    /**
     * @description Verifies removeAvatar clears preview and sets data to empty string
     */
    it('should clear avatar preview and set data to empty string on removeAvatar', () => {
      component.avatarPreview.set('some-url');
      component.avatarData.set('some-data');

      component.removeAvatar();

      expect(component.avatarPreview()).toBeNull();
      expect(component.avatarData()).toBe('');
    });
  });

  // ─── Form Submission ─────────────────────────────────────────────

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    /**
     * @description Verifies onSubmit does not call API when form is invalid
     */
    it('should not call updateProfile when form is invalid', () => {
      component.profileForm.get('fullName')?.setValue('');
      component.onSubmit();

      expect(accountApiSpy.updateProfile).not.toHaveBeenCalled();
    });

    /**
     * @description Verifies onSubmit marks form as touched when invalid
     */
    it('should mark form fields as touched when submitting invalid form', () => {
      component.profileForm.get('fullName')?.setValue('');
      component.onSubmit();

      expect(component.profileForm.get('fullName')?.touched).toBe(true);
    });

    /**
     * @description Verifies onSubmit sends correct data to API
     */
    it('should call updateProfile with correct data on valid submission', () => {
      component.profileForm.setValue({
        fullName: 'Updated Name',
        phone: '+963999888777',
      });
      component.avatarData.set(null);

      component.onSubmit();

      expect(accountApiSpy.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({
          fullName: 'Updated Name',
          phone: '+963999888777',
        })
      );
    });

    /**
     * @description Verifies onSubmit includes avatar data when present
     */
    it('should include avatar data in update when avatarData is set', () => {
      component.profileForm.setValue({
        fullName: 'Test User',
        phone: '+963912345678',
      });
      component.avatarData.set('data:image/png;base64,abc123');

      component.onSubmit();

      expect(accountApiSpy.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({
          avatar: 'data:image/png;base64,abc123',
        })
      );
    });

    /**
     * @description Verifies saving signal is set during submission
     */
    it('should set saving to true during submission', () => {
      component.profileForm.setValue({
        fullName: 'Test User',
        phone: '+963912345678',
      });

      component.onSubmit();
      // After successful response (sync), saving is set back to false
      expect(component.saving()).toBe(false);
    });

    /**
     * @description Verifies success snackbar is shown after successful update
     */
    it('should show success snackbar on successful update', () => {
      component.profileForm.setValue({
        fullName: 'Test User',
        phone: '+963912345678',
      });

      component.onSubmit();

      expect(translateSpy.get).toHaveBeenCalledWith(
        'account.editProfile.success'
      );
    });

    /**
     * @description Verifies navigation to /account/profile after successful update
     */
    it('should navigate to /account/profile after successful update', fakeAsync(() => {
      component.profileForm.setValue({
        fullName: 'Test User',
        phone: '+963912345678',
      });

      component.onSubmit();
      tick(1000); // setTimeout in onSubmit success handler

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/account/profile']);
    }));

    /**
     * @description Verifies error snackbar is shown on update failure
     */
    it('should show error snackbar when update fails', () => {
      accountApiSpy.updateProfile.and.returnValue(
        throwError(() => new Error('Update failed'))
      );
      component.profileForm.setValue({
        fullName: 'Test User',
        phone: '+963912345678',
      });

      component.onSubmit();

      expect(component.saving()).toBe(false);
      expect(translateSpy.get).toHaveBeenCalledWith(
        'account.editProfile.error'
      );
    });

    /**
     * @description Verifies phone is sent as undefined when empty
     */
    it('should send phone as undefined when field is empty', () => {
      component.profileForm.setValue({
        fullName: 'Test User',
        phone: '',
      });
      component.avatarData.set(null);

      component.onSubmit();

      expect(accountApiSpy.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({
          phone: undefined,
        })
      );
    });
  });

  // ─── Cancel Navigation ───────────────────────────────────────────

  describe('Cancel', () => {
    /**
     * @description Verifies cancel navigates back to profile page
     */
    it('should navigate to /account/profile on cancel', () => {
      fixture.detectChanges();
      component.cancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/account/profile']);
    });
  });

  // ─── getErrorMessage ─────────────────────────────────────────────

  describe('getErrorMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    /**
     * @description Verifies error message key for required fullName
     */
    it('should return required error key for empty fullName', () => {
      component.profileForm.get('fullName')?.setValue('');
      component.profileForm.get('fullName')?.markAsTouched();

      const errorKey = component.getErrorMessage('fullName');
      expect(errorKey).toBe('account.editProfile.validation.fullNameRequired');
    });

    /**
     * @description Verifies error message key for minlength fullName
     */
    it('should return minLength error key for short fullName', () => {
      component.profileForm.get('fullName')?.setValue('A');
      component.profileForm.get('fullName')?.markAsTouched();

      const errorKey = component.getErrorMessage('fullName');
      expect(errorKey).toBe('account.editProfile.validation.fullNameMinLength');
    });

    /**
     * @description Verifies error message key for phone pattern
     */
    it('should return pattern error key for invalid phone', () => {
      component.profileForm.get('phone')?.setValue('invalid-phone');
      component.profileForm.get('phone')?.markAsTouched();

      const errorKey = component.getErrorMessage('phone');
      expect(errorKey).toBe('account.editProfile.validation.phoneInvalid');
    });

    /**
     * @description Verifies empty string when no error
     */
    it('should return empty string when field has no errors', () => {
      component.profileForm.get('fullName')?.setValue('Valid Name');

      const errorKey = component.getErrorMessage('fullName');
      expect(errorKey).toBe('');
    });

    /**
     * @description Verifies empty string for non-existent field
     */
    it('should return empty string for non-existent field name', () => {
      const errorKey = component.getErrorMessage('nonExistent');
      expect(errorKey).toBe('');
    });
  });

  // ─── getInitials ─────────────────────────────────────────────────

  describe('getInitials', () => {
    /**
     * @description Verifies initials from two-word name
     */
    it('should return initials from full name', () => {
      expect(component.getInitials('Ahmad Khalil')).toBe('AK');
    });

    /**
     * @description Verifies "?" for empty name
     */
    it('should return "?" for empty name', () => {
      expect(component.getInitials('')).toBe('?');
    });
  });
});
