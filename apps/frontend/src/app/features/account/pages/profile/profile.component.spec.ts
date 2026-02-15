/**
 * @fileoverview Unit tests for ProfileComponent
 * @description Tests the profile view component including data loading, error states,
 * initials generation, date formatting, navigation methods, and retry behavior.
 * Mocks AccountApiService to isolate component logic from HTTP layer.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ProfileComponent } from './profile.component';
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
    ordersCount: 12,
    wishlistCount: 7,
    totalSpent: 250000,
    lastOrderDate: '2024-05-20T10:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-06-01T12:00:00.000Z',
  };
}

describe('ProfileComponent', () => {
  /** Component under test */
  let component: ProfileComponent;

  /** Component fixture for DOM interaction */
  let fixture: ComponentFixture<ProfileComponent>;

  /** Mock AccountApiService with spy methods */
  let accountApiSpy: jasmine.SpyObj<AccountApiService>;

  /** Mock Router with spy methods */
  let routerSpy: jasmine.SpyObj<Router>;

  /**
   * @description Test module setup - configures standalone component with mocked dependencies
   */
  beforeEach(async () => {
    accountApiSpy = jasmine.createSpyObj('AccountApiService', ['getProfile']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Default: return a valid profile
    accountApiSpy.getProfile.and.returnValue(of(createMockProfile()));

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: AccountApiService, useValue: accountApiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  // ─── Component Creation ──────────────────────────────────────────

  describe('Component Creation', () => {
    /**
     * @description Verifies the component is created successfully
     */
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  // ─── Profile Loading ─────────────────────────────────────────────

  describe('Profile Loading', () => {
    /**
     * @description Verifies loadProfile is called on ngOnInit
     */
    it('should call getProfile on initialization', () => {
      fixture.detectChanges();
      expect(accountApiSpy.getProfile).toHaveBeenCalledTimes(1);
    });

    /**
     * @description Verifies profile signal is populated after successful load
     */
    it('should set profile signal after successful load', () => {
      const mockProfile = createMockProfile();
      fixture.detectChanges();

      expect(component.profile()).toEqual(mockProfile);
    });

    /**
     * @description Verifies loading signal is set to false after successful load
     */
    it('should set loading to false after successful load', () => {
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    /**
     * @description Verifies loading is initially true before API responds
     */
    it('should start with loading as true', () => {
      // Before detectChanges (ngOnInit), loading defaults to true
      expect(component.loading()).toBe(true);
    });

    /**
     * @description Verifies error signal is null after successful load
     */
    it('should have null error after successful load', () => {
      fixture.detectChanges();
      expect(component.error()).toBeNull();
    });
  });

  // ─── Error Handling ──────────────────────────────────────────────

  describe('Error Handling', () => {
    /**
     * @description Verifies error signal is set when API call fails
     */
    it('should set error signal when getProfile fails', () => {
      accountApiSpy.getProfile.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load profile');
    });

    /**
     * @description Verifies loading is set to false after error
     */
    it('should set loading to false after error', () => {
      accountApiSpy.getProfile.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
    });

    /**
     * @description Verifies profile remains null after error
     */
    it('should keep profile as null on error', () => {
      accountApiSpy.getProfile.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();

      expect(component.profile()).toBeNull();
    });
  });

  // ─── Initials Generation ─────────────────────────────────────────

  describe('getInitials', () => {
    /**
     * @description Verifies initials are extracted from a two-word full name
     */
    it('should return initials from full name (e.g., "AK" for "Ahmad Khalil")', () => {
      expect(component.getInitials('Ahmad Khalil')).toBe('AK');
    });

    /**
     * @description Verifies initials for a single-word name returns first character
     */
    it('should return first character for single-word name', () => {
      expect(component.getInitials('Ahmad')).toBe('A');
    });

    /**
     * @description Verifies initials for a three-word name uses first and last
     */
    it('should return first and last initials for three-word name', () => {
      expect(component.getInitials('Ahmad Ibn Khalil')).toBe('AK');
    });

    /**
     * @description Verifies "?" is returned for undefined input
     */
    it('should return "?" when fullName is undefined', () => {
      expect(component.getInitials(undefined)).toBe('?');
    });

    /**
     * @description Verifies "?" is returned for empty string input
     */
    it('should return "?" when fullName is empty string', () => {
      expect(component.getInitials('')).toBe('?');
    });

    /**
     * @description Verifies initials are uppercased
     */
    it('should uppercase the initials', () => {
      expect(component.getInitials('ahmad khalil')).toBe('AK');
    });

    /**
     * @description Verifies trimming of whitespace
     */
    it('should handle names with extra whitespace', () => {
      expect(component.getInitials('  Ahmad  ')).toBe('A');
    });
  });

  // ─── Date Formatting ────────────────────────────────────────────

  describe('formatDate', () => {
    /**
     * @description Verifies ISO date string is converted to locale date string
     */
    it('should return a formatted locale date string', () => {
      const result = component.formatDate('2024-01-15T10:00:00.000Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    /**
     * @description Verifies the formatted date uses toLocaleDateString output
     */
    it('should match Date.toLocaleDateString output', () => {
      const isoDate = '2024-06-01T12:00:00.000Z';
      const expected = new Date(isoDate).toLocaleDateString();
      expect(component.formatDate(isoDate)).toBe(expected);
    });
  });

  // ─── Navigation Methods ──────────────────────────────────────────

  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    /**
     * @description Verifies navigateToEdit routes to /account/profile/edit
     */
    it('should navigate to /account/profile/edit when navigateToEdit is called', () => {
      component.navigateToEdit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/account/profile/edit']);
    });

    /**
     * @description Verifies navigateToSecurity routes to /account/security
     */
    it('should navigate to /account/security when navigateToSecurity is called', () => {
      component.navigateToSecurity();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/account/security']);
    });
  });

  // ─── Retry ───────────────────────────────────────────────────────

  describe('retry', () => {
    /**
     * @description Verifies retry calls loadProfile again
     */
    it('should call getProfile again when retry is invoked', () => {
      accountApiSpy.getProfile.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();
      expect(accountApiSpy.getProfile).toHaveBeenCalledTimes(1);

      // Now retry with a successful response
      accountApiSpy.getProfile.and.returnValue(of(createMockProfile()));
      component.retry();

      expect(accountApiSpy.getProfile).toHaveBeenCalledTimes(2);
    });

    /**
     * @description Verifies retry resets error state
     */
    it('should reset error and set loading when retry is called', () => {
      accountApiSpy.getProfile.and.returnValue(
        throwError(() => new Error('First error'))
      );
      fixture.detectChanges();
      expect(component.error()).toBe('Failed to load profile');

      // Now retry with success
      accountApiSpy.getProfile.and.returnValue(of(createMockProfile()));
      component.retry();

      expect(component.error()).toBeNull();
      expect(component.loading()).toBe(false);
      expect(component.profile()).toBeTruthy();
    });
  });

  // ─── DOM Rendering ───────────────────────────────────────────────

  describe('DOM Rendering', () => {
    /**
     * @description Verifies loading spinner is displayed while loading
     */
    it('should display loading spinner when loading is true', () => {
      // Use a Subject that never completes to keep loading=true
      accountApiSpy.getProfile.and.returnValue(new Subject<UserProfile>());
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-spinner')).toBeTruthy();
    });

    /**
     * @description Verifies profile data is rendered after load
     */
    it('should display user full name after successful load', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const userName = compiled.querySelector('.user-name');

      expect(userName?.textContent).toContain('Ahmad Khalil');
    });

    /**
     * @description Verifies email is rendered in the profile view
     */
    it('should display user email when available', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('user@souq.sy');
    });

    /**
     * @description Verifies phone is rendered in the profile view
     */
    it('should display user phone when available', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('+963912345678');
    });

    /**
     * @description Verifies initials are displayed when no avatar is present
     */
    it('should show initials placeholder when user has no avatar', () => {
      const profileNoAvatar: UserProfile = {
        ...createMockProfile(),
        avatar: undefined,
      };
      accountApiSpy.getProfile.and.returnValue(of(profileNoAvatar));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const initials = compiled.querySelector('.avatar-initials');
      expect(initials).toBeTruthy();
      expect(initials?.textContent).toContain('AK');
    });

    /**
     * @description Verifies avatar image is displayed when avatar URL exists
     */
    it('should show avatar image when user has avatar', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const avatarImg = compiled.querySelector('.avatar-img') as HTMLImageElement;

      expect(avatarImg).toBeTruthy();
      expect(avatarImg?.src).toContain('avatar.jpg');
    });

    /**
     * @description Verifies error card is displayed on load failure
     */
    it('should display error card when error occurs', () => {
      accountApiSpy.getProfile.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.error-card')).toBeTruthy();
    });

    /**
     * @description Verifies orders count stat is rendered
     */
    it('should display orders count', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const statValues = compiled.querySelectorAll('.stat-value');

      expect(statValues.length).toBeGreaterThanOrEqual(1);
      expect(statValues[0]?.textContent?.trim()).toBe('12');
    });

    /**
     * @description Verifies wishlist count stat is rendered
     */
    it('should display wishlist count', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const statValues = compiled.querySelectorAll('.stat-value');

      expect(statValues.length).toBeGreaterThanOrEqual(2);
      expect(statValues[1]?.textContent?.trim()).toBe('7');
    });

    /**
     * @description Verifies total spent stat is rendered
     */
    it('should display total spent in SYP', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const statValues = compiled.querySelectorAll('.stat-value');

      expect(statValues.length).toBeGreaterThanOrEqual(3);
      expect(statValues[2]?.textContent).toContain('250,000');
    });

    /**
     * @description Verifies last order date stat is rendered
     */
    it('should display last order date when available', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const statValues = compiled.querySelectorAll('.stat-value');

      expect(statValues.length).toBeGreaterThanOrEqual(4);
      expect(statValues[3]?.textContent?.trim().length).toBeGreaterThan(0);
    });

    /**
     * @description Verifies "No orders yet" is shown when lastOrderDate is null
     */
    it('should show "No orders yet" when lastOrderDate is null', () => {
      const profileNoOrders: UserProfile = {
        ...createMockProfile(),
        lastOrderDate: undefined,
      };
      accountApiSpy.getProfile.and.returnValue(of(profileNoOrders));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      // Check that the template shows the noOrders message
      expect(compiled.textContent).toContain('account.profile.noOrders');
    });
  });
});
