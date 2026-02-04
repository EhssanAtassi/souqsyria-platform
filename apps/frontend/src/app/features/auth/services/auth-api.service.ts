/**
 * @fileoverview Authentication API Service
 * @description Service responsible for making HTTP calls to the NestJS backend auth endpoints.
 * Handles user registration, login, OTP verification, password reset, token refresh, and logout operations.
 * All methods return observables that emit the API response and are consumed by NgRx effects.
 * @module AuthApiService
 * @requires HttpClient
 * @requires environment
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse
} from '../models/auth.models';

/**
 * @class AuthApiService
 * @description Provides HTTP methods for authentication-related API calls to the backend.
 * This service acts as a data layer between NgRx effects and the NestJS backend API.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  /**
   * @method register
   * @description Registers a new user account with email and password.
   * Sends a POST request to /auth/register endpoint.
   * @param {RegisterRequest} request - Contains email and password for registration
   * @returns {Observable<RegisterResponse>} Observable emitting registration response with user data and tokens
   */
  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request);
  }

  /**
   * @method login
   * @description Authenticates a user with email and password credentials.
   * Sends a POST request to /auth/email-login endpoint.
   * @param {LoginRequest} request - Contains email and password for authentication
   * @returns {Observable<LoginResponse>} Observable emitting login response with access token and user info
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/email-login`, request);
  }

  /**
   * @method verifyOtp
   * @description Verifies the OTP code sent to user's email after registration.
   * Sends a POST request to /auth/verify endpoint.
   * @param {VerifyOtpRequest} request - Contains email and OTP code for verification
   * @returns {Observable<VerifyOtpResponse>} Observable emitting verification response
   */
  verifyOtp(request: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.apiUrl}/verify`, request);
  }

  /**
   * @method resendOtp
   * @description Resends OTP verification code to user's email.
   * Sends a POST request to /auth/resend-otp endpoint.
   * @param {ResendOtpRequest} request - Contains email to resend OTP to
   * @returns {Observable<VerifyOtpResponse>} Observable emitting resend OTP response
   */
  resendOtp(request: ResendOtpRequest): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.apiUrl}/resend-otp`, request);
  }

  /**
   * @method forgotPassword
   * @description Initiates password reset process by sending reset link to user's email.
   * Sends a POST request to /auth/forgot-password endpoint.
   * @param {ForgotPasswordRequest} request - Contains email for password reset
   * @returns {Observable<ForgotPasswordResponse>} Observable emitting forgot password response
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, request);
  }

  /**
   * @method resetPassword
   * @description Resets user password using the reset token from email link.
   * Sends a POST request to /auth/reset-password endpoint.
   * @param {ResetPasswordRequest} request - Contains reset token and new password
   * @returns {Observable<ResetPasswordResponse>} Observable emitting reset password response
   */
  resetPassword(request: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/reset-password`, request);
  }

  /**
   * @method refreshToken
   * @description Refreshes the access token using a valid refresh token.
   * Sends a POST request to /auth/refresh endpoint.
   * @param {RefreshTokenRequest} request - Contains refresh token
   * @returns {Observable<RefreshTokenResponse>} Observable emitting new access token
   */
  refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, request);
  }

  /**
   * @method logout
   * @description Logs out the current user and invalidates tokens.
   * Sends a POST request to /auth/logout endpoint.
   * @param {LogoutRequest} request - Optional token and reason for logout
   * @returns {Observable<LogoutResponse>} Observable emitting logout confirmation response
   */
  logout(request: LogoutRequest): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.apiUrl}/logout`, request);
  }
}
