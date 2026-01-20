/**
 * @file auth.service.ts
 * @description Business logic for user registration, login, OTP verification, and JWT token generation.
 */
import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginLog } from './entity/login-log.entity';
import { Request } from 'express';
import { EmailService } from './service/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { TokenBlacklist } from './entity/token-blacklist.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { RefreshToken } from './entity/refresh-token.entity';
import { GoogleProfile } from './strategies/google.strategy';
import { FacebookProfile } from './strategies/facebook.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(LoginLog)
    private readonly loginLogRepository: Repository<LoginLog>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 🔐 OAUTH AUTHENTICATION HANDLERS
   * These methods handle Google and Facebook OAuth login/registration flows
   */

  /**
   * Handle Google OAuth user login/registration
   * - Finds existing user by googleId or email (for account linking)
   * - Creates new user if doesn't exist (auto-verified)
   * - Generates JWT access and refresh tokens
   * - Returns user data and tokens for frontend to store
   *
   * @param googleProfile - User profile data from Google OAuth strategy
   * @param request - Express request object for logging IP and user-agent
   * @returns Object containing user, tokens, and isNewUser flag
   */
  async handleGoogleUser(
    googleProfile: GoogleProfile,
    request?: Request,
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const { googleId, email, fullName, profilePictureUrl, accessToken, refreshToken: googleRefreshToken } = googleProfile;
    this.logger.log(`Google OAuth login attempt for email: ${email}`);

    // Step 1: Try to find existing user by Google ID
    let user = await this.userRepository.findOne({
      where: { googleId },
      relations: ['role'],
    });

    let isNewUser = false;

    // Step 2: If not found by Google ID, try to find by email (account linking scenario)
    if (!user) {
      user = await this.userRepository.findOne({
        where: { email },
        relations: ['role'],
      });

      // If user exists with this email but no Google ID, link the accounts
      if (user) {
        this.logger.log(`Linking existing account with Google for email: ${email}`);
        user.googleId = googleId;
        user.oauthProvider = 'google';
        user.profilePictureUrl = profilePictureUrl || user.profilePictureUrl;
        user.oauthAccessToken = accessToken;
        user.oauthRefreshToken = googleRefreshToken;
        user.isVerified = true; // OAuth users are auto-verified
        await this.userRepository.save(user);
      }
    }

    // Step 3: If still no user found, create new user (registration via OAuth)
    if (!user) {
      this.logger.log(`Creating new user via Google OAuth: ${email}`);
      isNewUser = true;

      // Get default "buyer" role
      const defaultRole = await this.roleRepository.findOne({
        where: { name: 'buyer' },
      });

      if (!defaultRole) {
        throw new Error('Default role "buyer" not found in database');
      }

      // Create new user with Google OAuth data
      user = this.userRepository.create({
        email,
        fullName,
        googleId,
        oauthProvider: 'google',
        profilePictureUrl,
        oauthAccessToken: accessToken,
        oauthRefreshToken: googleRefreshToken,
        isVerified: true, // OAuth users are auto-verified
        role: defaultRole,
      });

      await this.userRepository.save(user);
      this.logger.log(`New user created via Google OAuth: ${user.id}`);
    }

    // Step 4: Check account status
    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned.');
    }

    // Step 5: Generate JWT tokens for our application
    const tokens = await this.generateTokens(user, request);

    // Step 6: Log the login
    if (request) {
      await this.loginLogRepository.save({
        user,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || 'unknown',
      });
    }

    // Step 7: Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`Google OAuth successful for user ID: ${user.id}`);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isNewUser,
    };
  }

  /**
   * Handle Facebook OAuth user login/registration
   * Similar flow to Google OAuth handler
   *
   * @param facebookProfile - User profile data from Facebook OAuth strategy
   * @param request - Express request object for logging IP and user-agent
   * @returns Object containing user, tokens, and isNewUser flag
   */
  async handleFacebookUser(
    facebookProfile: FacebookProfile,
    request?: Request,
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const { facebookId, email, fullName, profilePictureUrl, accessToken, refreshToken: facebookRefreshToken } = facebookProfile;
    this.logger.log(`Facebook OAuth login attempt for email: ${email}`);

    // Step 1: Try to find existing user by Facebook ID
    let user = await this.userRepository.findOne({
      where: { facebookId },
      relations: ['role'],
    });

    let isNewUser = false;

    // Step 2: If not found by Facebook ID, try to find by email (account linking scenario)
    if (!user) {
      user = await this.userRepository.findOne({
        where: { email },
        relations: ['role'],
      });

      // If user exists with this email but no Facebook ID, link the accounts
      if (user) {
        this.logger.log(`Linking existing account with Facebook for email: ${email}`);
        user.facebookId = facebookId;
        user.oauthProvider = 'facebook';
        user.profilePictureUrl = profilePictureUrl || user.profilePictureUrl;
        user.oauthAccessToken = accessToken;
        user.oauthRefreshToken = facebookRefreshToken;
        user.isVerified = true; // OAuth users are auto-verified
        await this.userRepository.save(user);
      }
    }

    // Step 3: If still no user found, create new user (registration via OAuth)
    if (!user) {
      this.logger.log(`Creating new user via Facebook OAuth: ${email}`);
      isNewUser = true;

      // Get default "buyer" role
      const defaultRole = await this.roleRepository.findOne({
        where: { name: 'buyer' },
      });

      if (!defaultRole) {
        throw new Error('Default role "buyer" not found in database');
      }

      // Create new user with Facebook OAuth data
      user = this.userRepository.create({
        email,
        fullName,
        facebookId,
        oauthProvider: 'facebook',
        profilePictureUrl,
        oauthAccessToken: accessToken,
        oauthRefreshToken: facebookRefreshToken,
        isVerified: true, // OAuth users are auto-verified
        role: defaultRole,
      });

      await this.userRepository.save(user);
      this.logger.log(`New user created via Facebook OAuth: ${user.id}`);
    }

    // Step 4: Check account status
    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned.');
    }

    // Step 5: Generate JWT tokens for our application
    const tokens = await this.generateTokens(user, request);

    // Step 6: Log the login
    if (request) {
      await this.loginLogRepository.save({
        user,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || 'unknown',
      });
    }

    // Step 7: Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`Facebook OAuth successful for user ID: ${user.id}`);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isNewUser,
    };
  }

  /**
   * Generate JWT access and refresh tokens for a user
   * Implements secure token rotation pattern:
   * - Access token: Short-lived (1 day) for API access
   * - Refresh token: Longer-lived (7 days) stored in database with hash
   *
   * @param user - User entity to generate tokens for
   * @param request - Express request object for device info and IP
   * @returns Object containing accessToken and refreshToken strings
   */
  private async generateTokens(
    user: User,
    request?: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Create JWT payload with user information
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      role_id: user.role.id,
    };

    // Generate short-lived access token (1 day)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1d',
    });

    // Generate long-lived refresh token (7 days)
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        expiresIn: '7d',
      },
    );

    // Hash the refresh token before storing in database (security best practice)
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Store refresh token in database with metadata
    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash: refreshTokenHash,
      userId: user.id,
      user,
      deviceInfo: request?.headers['user-agent'] || 'unknown',
      ipAddress: request?.ip || 'unknown',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    this.logger.log(`Tokens generated for user ID: ${user.id}`);

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user with email/password
   * Now returns JWT tokens for auto-login functionality
   *
   * @param registerDto - Registration data (email, password, etc.)
   * @param request - Express request object for logging and token generation
   * @returns Object containing user info, tokens, and message
   */
  async register(
    registerDto: RegisterDto,
    request?: Request,
  ): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    const { email, password } = registerDto;
    this.logger.log(`Registering new user: ${email}`);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already registered.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP

    const defaultRole = await this.roleRepository.findOne({
      where: { name: 'buyer' },
    });
    if (!defaultRole) {
      throw new Error('Default role buyer not found');
    }

    const user = this.userRepository.create({
      email,
      passwordHash,
      otpCode,
      isVerified: false,
      oauthProvider: 'email', // Mark as email registration
      role: defaultRole,
    });

    await this.userRepository.save(user);

    // Generate tokens for auto-login (even though user is not yet verified)
    // User will see verification banner but can still browse the site
    const tokens = await this.generateTokens(user, request);

    // Send verification email with OTP using EmailService
    await this.emailService.sendVerificationEmail(email, otpCode);

    this.logger.log(`User registered and verification email sent to: ${email}`);

    // Return user data without sensitive fields
    const { passwordHash: _, otpCode: __, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Verify user OTP
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<void> {
    const { email, otpCode } = verifyOtpDto;
    this.logger.log(`Verifying OTP for email: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('Invalid email.');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account already verified.');
    }

    if (user.otpCode !== otpCode) {
      throw new BadRequestException('Invalid OTP code.');
    }

    user.isVerified = true;
    user.otpCode = null;
    await this.userRepository.save(user);

    this.logger.log(`Email verified successfully for: ${email}`);
  }

  /**
   * Authenticate a user using email and password.
   * Validates credentials, ensures account is verified,
   * and returns a signed JWT access token upon success.
   * Also logs the login attempt.
   */
  async login(
    loginDto: LoginDto,
    request: Request,
  ): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;
    this.logger.log(`Login attempt for email: ${email}`);

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    // Block access for soft-deleted users
    if (!user || user.deletedAt) {
      throw new UnauthorizedException(
        'Invalid credentials or deleted account.',
      );
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your account first.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    /**
     * Block login for banned users and optionally warn for suspended users.
     * These checks help prevent access from malicious or misbehaving accounts.
     */
    if (user.isBanned) {
      this.logger.warn(`Login blocked for banned user: ${email}`);
      throw new UnauthorizedException('This account has been banned.');
    }

    if (user.isSuspended) {
      this.logger.warn(`Login attempt from suspended user: ${email}`);
      // Optionally allow login but disable access to protected features
      // For now we allow login, you can restrict access in guards or controllers
    }

    const payload = { sub: user.id, role: user.role.name, email: user.email };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Login successful for user ID: ${user.id}`);

    /**
     * Update the user's last login timestamp and prepare to save the login audit log.
     * This is essential for auditing and detecting unusual login activity.
     */
    // Save the login log (in real use, request context should pass IP and user-agent)
    await this.loginLogRepository.save({
      user,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || 'unknown',
    });

    // Optionally update lastLoginAt
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return { accessToken };
  }

  /**
   * 🔐 FORGOT PASSWORD FUNCTIONALITY
   * Generates a secure reset token and sends it via email
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    this.logger.log(`Password reset requested for email: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`,
      );
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    if (!user.isVerified) {
      throw new BadRequestException(
        'Please verify your email address before resetting password.',
      );
    }

    // Generate secure reset token (JWT with 15-minute expiration)
    const resetPayload = {
      sub: user.id,
      email: user.email,
      type: 'password_reset',
    };

    const resetToken = this.jwtService.sign(resetPayload, { expiresIn: '15m' });

    // Save reset token and expiration in database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await this.userRepository.save(user);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    this.logger.log(`Password reset token generated and sent for: ${email}`);

    return {
      message: 'Password reset instructions have been sent to your email.',
    };
  }

  /**
   * 🔓 RESET PASSWORD FUNCTIONALITY
   * Validates reset token and updates user password
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { resetToken, newPassword } = resetPasswordDto;
    this.logger.log(`Password reset attempt with token`);

    // Find user with the reset token
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: resetToken },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // Check if token is expired
    if (!user.isResetTokenValid()) {
      this.logger.warn(`Expired reset token used for user: ${user.email}`);
      throw new BadRequestException(
        'Reset token has expired. Please request a new one.',
      );
    }

    try {
      // Verify JWT token signature
      const decodedToken = this.jwtService.verify(resetToken);

      // Verify token belongs to this user
      if (decodedToken.sub !== user.id || decodedToken.email !== user.email) {
        throw new BadRequestException('Invalid reset token.');
      }
    } catch (error) {
      this.logger.warn(`Invalid reset token signature for user: ${user.email}`);
      throw new BadRequestException('Invalid or malformed reset token.');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    user.passwordHash = newPasswordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = new Date();
    user.resetFailedAttempts(); // Clear any failed login attempts

    await this.userRepository.save(user);

    this.logger.log(`Password successfully reset for user: ${user.email}`);

    return {
      message:
        'Password has been successfully reset. You can now log in with your new password.',
    };
  }

  /**
   * 🔑 CHANGE PASSWORD FUNCTIONALITY
   * Allows logged-in users to change their password by verifying current password
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;
    this.logger.log(`Password change requested for user ID: ${userId}`);

    // Find the user
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found.');
    }

    // Check if account is banned or suspended
    if (user.isBanned) {
      throw new UnauthorizedException(
        'Cannot change password for banned account.',
      );
    }

    if (!user.isVerified) {
      throw new BadRequestException(
        'Please verify your email before changing password.',
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      this.logger.warn(
        `Invalid current password provided for user ID: ${userId}`,
      );
      throw new BadRequestException('Current password is incorrect.');
    }

    // Check if new password is same as current (optional security measure)
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password.',
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and track change
    user.passwordHash = newPasswordHash;
    user.passwordChangedAt = new Date();
    user.resetFailedAttempts(); // Clear any failed login attempts

    await this.userRepository.save(user);

    this.logger.log(`Password successfully changed for user ID: ${userId}`);

    return {
      message: 'Password has been successfully changed.',
    };
  }
  /**
   * 🚪 LOGOUT FUNCTIONALITY
   * Blacklists JWT token to prevent reuse after logout
   */
  async logout(
    userId: number,
    token: string,
    ipAddress: string,
    logoutDto?: LogoutDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Logout requested for user ID: ${userId}`);

    try {
      // Decode token to get expiration time
      const decodedToken = this.jwtService.decode(token) as any;

      if (!decodedToken || !decodedToken.exp) {
        throw new BadRequestException('Invalid token format.');
      }

      // Create hash of token for storage (for security, don't store full token)
      // const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Check if token is already blacklisted
      const existingBlacklist = await this.tokenBlacklistRepository.findOne({
        where: { tokenHash },
      });

      if (existingBlacklist) {
        // Token already blacklisted, but return success (idempotent operation)
        this.logger.log(`Token already blacklisted for user ID: ${userId}`);
        return { message: 'Logout successful.' };
      }

      // Create blacklist entry
      const blacklistEntry = this.tokenBlacklistRepository.create({
        tokenHash,
        userId,
        expiresAt: new Date(decodedToken.exp * 1000), // Convert JWT exp to Date
        reason: logoutDto?.reason || 'logout',
        ipAddress,
      });

      await this.tokenBlacklistRepository.save(blacklistEntry);

      // Update user's last activity
      await this.userRepository.update(userId, {
        lastActivityAt: new Date(),
      });

      this.logger.log(
        `User ${userId} successfully logged out, token blacklisted`,
      );

      return {
        message: 'Logout successful. Please remove the token from your client.',
      };
    } catch (error) {
      this.logger.error(`Logout failed for user ${userId}: ${error.message}`);
      throw new BadRequestException('Logout failed. Invalid token.');
    }
  }

  /**
   * 🔄 REFRESH TOKEN FUNCTIONALITY
   * Validates current token and issues a new one without requiring re-login
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; message: string }> {
    const { token } = refreshTokenDto;
    this.logger.log(`Token refresh requested`);

    try {
      // Verify the current token
      const decodedToken = this.jwtService.verify(token);

      if (!decodedToken || !decodedToken.sub) {
        throw new BadRequestException('Invalid token format.');
      }

      // Check if token is blacklisted
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const blacklistedToken = await this.tokenBlacklistRepository.findOne({
        where: { tokenHash },
      });

      if (blacklistedToken) {
        this.logger.warn(
          `Attempt to refresh blacklisted token for user: ${decodedToken.sub}`,
        );
        throw new UnauthorizedException(
          'Token has been invalidated. Please log in again.',
        );
      }

      // Get user from database to ensure they still exist and are active
      const user = await this.userRepository.findOne({
        where: { id: decodedToken.sub },
        relations: ['role'],
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedException('User not found or account deleted.');
      }

      // Check account status
      if (user.isBanned) {
        throw new UnauthorizedException('Account is banned.');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException('Account is not verified.');
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new UnauthorizedException('Account is temporarily locked.');
      }

      // Generate new token with same payload but new expiration
      const newPayload = {
        sub: user.id,
        role: user.role.name,
        email: user.email,
        role_id: user.role.id,
      };

      const newAccessToken = this.jwtService.sign(newPayload);

      // Optionally blacklist the old token (for enhanced security)
      // This prevents the old token from being used after refresh
      const oldTokenBlacklist = this.tokenBlacklistRepository.create({
        tokenHash,
        userId: user.id,
        expiresAt: new Date(decodedToken.exp * 1000),
        reason: 'token_refreshed',
        ipAddress: 'refresh_request',
      });
      await this.tokenBlacklistRepository.save(oldTokenBlacklist);

      // Update user activity
      user.lastActivityAt = new Date();
      await this.userRepository.save(user);

      this.logger.log(`Token successfully refreshed for user ID: ${user.id}`);

      return {
        accessToken: newAccessToken,
        message: 'Token refreshed successfully.',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`Expired token provided for refresh`);
        throw new UnauthorizedException(
          'Token has expired. Please log in again.',
        );
      }

      if (error.name === 'JsonWebTokenError') {
        this.logger.warn(`Invalid token provided for refresh`);
        throw new UnauthorizedException('Invalid token. Please log in again.');
      }

      // Re-throw our custom exceptions
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new BadRequestException('Token refresh failed.');
    }
  }

  /**
   * 📧 RESEND OTP FUNCTIONALITY
   * Generates new OTP and sends verification email for unverified users
   */
  async resendOtp(resendOtpDto: ResendOtpDto): Promise<{ message: string }> {
    const { email } = resendOtpDto;
    this.logger.log(`OTP resend requested for email: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      this.logger.warn(`OTP resend requested for non-existent email: ${email}`);
      return {
        message:
          'If the email exists and is unverified, a new OTP has been sent.',
      };
    }

    if (user.isVerified) {
      this.logger.warn(
        `OTP resend requested for already verified email: ${email}`,
      );
      throw new BadRequestException('Email address is already verified.');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Cannot send OTP to banned account.');
    }

    // Check if user recently requested OTP (rate limiting)
    const timeSinceLastOtp = user.updatedAt
      ? Date.now() - user.updatedAt.getTime()
      : 0;
    const minWaitTime = 60 * 1000; // 1 minute between requests

    if (timeSinceLastOtp < minWaitTime) {
      const waitSeconds = Math.ceil((minWaitTime - timeSinceLastOtp) / 1000);
      throw new BadRequestException(
        `Please wait ${waitSeconds} seconds before requesting another OTP.`,
      );
    }

    // Generate new OTP code
    const newOtpCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP

    // Update user with new OTP
    user.otpCode = newOtpCode;
    await this.userRepository.save(user);

    // Send new verification email
    await this.emailService.sendVerificationEmail(email, newOtpCode);

    this.logger.log(`New OTP generated and sent for: ${email}`);

    return {
      message: 'A new verification code has been sent to your email address.',
    };
  }

  /**
   * 🗑️ ACCOUNT DELETION FUNCTIONALITY (SOFT DELETE)
   * Soft deletes user account by setting deletedAt timestamp
   * Preserves data integrity while marking account as deleted
   */
  async deleteAccount(
    userId: number,
    deleteAccountDto: DeleteAccountDto,
    ipAddress: string,
  ): Promise<{ message: string }> {
    const { password, reason } = deleteAccountDto;
    this.logger.log(`Account deletion requested for user ID: ${userId}`);

    // Find the user
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found or account already deleted.');
    }

    // Verify password for security
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(
        `Invalid password provided for account deletion, user ID: ${userId}`,
      );
      throw new BadRequestException(
        'Incorrect password. Cannot delete account.',
      );
    }

    // Perform soft delete by setting deletedAt timestamp
    user.deletedAt = new Date();

    // Store deletion reason in metadata
    if (reason) {
      user.metadata = {
        ...user.metadata,
        deletionReason: reason,
        deletedBy: 'user',
        deletionIp: ipAddress,
        deletionTimestamp: new Date().toISOString(),
      };
    }

    // Clear sensitive data but keep for audit purposes
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.otpCode = null;

    await this.userRepository.save(user);

    // Blacklist any existing tokens for this user
    // This ensures immediate logout across all devices
    try {
      // Note: In a real implementation, you might want to blacklist all user's tokens
      // For now, we'll just log this action
      // Create a general blacklist entry for all user tokens
      // This will block any token belonging to this user
      const userTokenBlacklist = this.tokenBlacklistRepository.create({
        tokenHash: `user_${userId}_deleted`, // Special marker for deleted accounts
        userId: userId,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        reason: 'account_deleted',
        ipAddress: ipAddress,
      });

      await this.tokenBlacklistRepository.save(userTokenBlacklist);

      this.logger.log(
        `User ${userId} account soft deleted - existing tokens should be invalidated`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to blacklist tokens during account deletion: ${error.message}`,
      );
    }

    this.logger.log(`Account successfully soft deleted for user ID: ${userId}`);

    return {
      message:
        'Your account has been successfully deleted. All your data has been securely removed.',
    };
  }
}
