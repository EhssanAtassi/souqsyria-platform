/**
 * @fileoverview Unit tests for AccountApiService
 * @description Tests all HTTP API calls for user profile management endpoints.
 * Uses HttpTestingController to mock HTTP requests and verify correct URLs,
 * HTTP methods, request bodies, and response types.
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AccountApiService } from './account-api.service';
import { environment } from '../../../../environments/environment';
import {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../models/user-profile.interface';

/**
 * @description Factory to create a mock UserProfile for test assertions
 * @returns {UserProfile} Complete mock user profile
 */
function createMockProfile(): UserProfile {
  return {
    id: 1,
    email: 'user@souq.sy',
    phone: '+963912345678',
    fullName: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    isVerified: true,
    role: { id: 1, name: 'customer' },
    ordersCount: 5,
    wishlistCount: 10,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  };
}

describe('AccountApiService', () => {
  /** Service under test */
  let service: AccountApiService;

  /** HTTP testing controller for intercepting and verifying requests */
  let httpMock: HttpTestingController;

  /** Base API URL for user endpoints */
  const apiUrl = environment.userApiUrl;

  /**
   * @description Test module setup - configures HttpClient testing providers
   */
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  /**
   * @description Verifies no outstanding HTTP requests after each test
   */
  afterEach(() => {
    httpMock.verify();
  });

  /**
   * @description Verifies the service is created via dependency injection
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getProfile ──────────────────────────────────────────────────

  describe('getProfile', () => {
    /**
     * @description Verifies GET request is sent to the correct profile endpoint
     */
    it('should send GET request to userApiUrl/profile', () => {
      const mockProfile = createMockProfile();

      service.getProfile().subscribe((profile) => {
        expect(profile).toEqual(mockProfile);
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });

    /**
     * @description Verifies the response is typed as UserProfile
     */
    it('should return an Observable of UserProfile', () => {
      const mockProfile = createMockProfile();

      service.getProfile().subscribe((profile) => {
        expect(profile.id).toBe(1);
        expect(profile.email).toBe('user@souq.sy');
        expect(profile.fullName).toBe('Test User');
        expect(profile.isVerified).toBe(true);
        expect(profile.role.name).toBe('customer');
        expect(profile.ordersCount).toBe(5);
        expect(profile.wishlistCount).toBe(10);
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush(mockProfile);
    });

    /**
     * @description Verifies error propagation on HTTP failure
     */
    it('should propagate error when request fails', () => {
      const errorMessage = 'Unauthorized';

      service.getProfile().subscribe({
        next: () => fail('Expected an error, not a profile'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush(errorMessage, { status: 401, statusText: 'Unauthorized' });
    });
  });

  // ─── updateProfile ───────────────────────────────────────────────

  describe('updateProfile', () => {
    /**
     * @description Verifies PATCH request is sent with correct body to the profile endpoint
     */
    it('should send PATCH request to userApiUrl/profile with update DTO', () => {
      const updateDto: UpdateProfileRequest = {
        fullName: 'Updated Name',
        phone: '+963987654321',
      };
      const updatedProfile = {
        ...createMockProfile(),
        fullName: 'Updated Name',
        phone: '+963987654321',
      };

      service.updateProfile(updateDto).subscribe((profile) => {
        expect(profile.fullName).toBe('Updated Name');
        expect(profile.phone).toBe('+963987654321');
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedProfile);
    });

    /**
     * @description Verifies partial update works with only fullName
     */
    it('should send PATCH with partial update data', () => {
      const updateDto: UpdateProfileRequest = {
        fullName: 'Name Only',
      };
      const updatedProfile = {
        ...createMockProfile(),
        fullName: 'Name Only',
      };

      service.updateProfile(updateDto).subscribe((profile) => {
        expect(profile.fullName).toBe('Name Only');
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedProfile);
    });

    /**
     * @description Verifies avatar can be sent as base64 data in the update DTO
     */
    it('should send avatar data in the update DTO', () => {
      const updateDto: UpdateProfileRequest = {
        avatar: 'data:image/png;base64,iVBORw0KGgo=',
      };

      service.updateProfile(updateDto).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      expect(req.request.body.avatar).toContain('data:image/png;base64');
      req.flush(createMockProfile());
    });

    /**
     * @description Verifies error propagation on update failure
     */
    it('should propagate error when update fails', () => {
      const updateDto: UpdateProfileRequest = { fullName: 'Fail' };

      service.updateProfile(updateDto).subscribe({
        next: () => fail('Expected an error, not a profile'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/profile`);
      req.flush('Validation failed', {
        status: 400,
        statusText: 'Bad Request',
      });
    });
  });

  // ─── changePassword ──────────────────────────────────────────────

  describe('changePassword', () => {
    /** Common password change DTO for tests */
    const changePasswordDto: ChangePasswordRequest = {
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    };

    /**
     * @description Verifies POST request is sent to the change-password endpoint
     */
    it('should send POST request to userApiUrl/change-password', () => {
      const successResponse = { message: 'Password changed successfully' };

      service.changePassword(changePasswordDto).subscribe((response) => {
        expect(response.message).toBe('Password changed successfully');
      });

      const req = httpMock.expectOne(`${apiUrl}/change-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(changePasswordDto);
      req.flush(successResponse);
    });

    /**
     * @description Verifies the return type is Observable<{ message: string }>
     */
    it('should return Observable with message on success', () => {
      const successResponse = { message: 'Password updated' };

      service.changePassword(changePasswordDto).subscribe((response) => {
        expect(response).toEqual(successResponse);
        expect(typeof response.message).toBe('string');
      });

      const req = httpMock.expectOne(`${apiUrl}/change-password`);
      req.flush(successResponse);
    });

    /**
     * @description Verifies error propagation when current password is wrong
     */
    it('should propagate error when current password is incorrect', () => {
      service.changePassword(changePasswordDto).subscribe({
        next: () => fail('Expected an error, not success'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/change-password`);
      req.flush('Invalid current password', {
        status: 401,
        statusText: 'Unauthorized',
      });
    });

    /**
     * @description Verifies that the full DTO including confirmPassword is sent
     */
    it('should include confirmPassword in the request body', () => {
      service.changePassword(changePasswordDto).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/change-password`);
      expect(req.request.body.confirmPassword).toBe('NewPassword1');
      req.flush({ message: 'ok' });
    });
  });
});
