/**
 * @fileoverview Account API service for user profile management
 * @description Handles HTTP requests for user profile, updates, and password changes
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../models/user-profile.interface';

/**
 * @description Service for managing user account operations via API
 * @class AccountApiService
 */
@Injectable({
  providedIn: 'root',
})
export class AccountApiService {
  /** HTTP client for API requests */
  private http = inject(HttpClient);

  /** Base API URL for user endpoints */
  private readonly apiUrl = environment.userApiUrl;

  /**
   * @description Fetches the current user's profile data
   * @returns {Observable<UserProfile>} Observable containing user profile data
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  /**
   * @description Updates the current user's profile information
   * @param {UpdateProfileRequest} dto - Profile data to update
   * @returns {Observable<UserProfile>} Observable containing updated user profile
   */
  updateProfile(dto: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/profile`, dto);
  }

  /**
   * @description Changes the current user's password
   * @param {ChangePasswordRequest} dto - Password change request data
   * @returns {Observable<{ message: string }>} Observable containing success message
   */
  changePassword(
    dto: ChangePasswordRequest
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/change-password`,
      dto
    );
  }
}
