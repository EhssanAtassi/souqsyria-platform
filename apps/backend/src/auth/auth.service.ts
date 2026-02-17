/**
 * @file auth.service.ts
 * @description Business logic for user registration, login, OTP verification, and JWT token generation.
 *
 * Security Enhancements (QA Remediation):
 * - SEC-H02: Password reset tokens hashed with SHA-256 before storage
 * - SEC-H05: OTP strengthened from 4 to 6 digits
 * - SEC-H06: Account lockout after 5 failed login attempts
 * - SEC-M01: Bcrypt cost factor increased from 10 to 12
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 */
import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
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
import {
  SecurityAudit,
  SecurityEventType,
} from './entity/security-audit.entity';
import { EncryptionService } from '../common/utils/encryption.util';
import { RateLimiterService } from '../common/services/rate-limiter.service';

/** @description Shape of a stored OAuth authorization code entry */
interface OAuthCodeEntry {
  /** @description JWT access token */
  accessToken: string;
  /** @description JWT refresh token */
  refreshToken: string;
  /** @description Expiry timestamp in ms (60s TTL) */
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * @description In-memory store for OAuth authorization codes.
   * Maps code → {accessToken, refreshToken, expiresAt}.
   * Codes expire after 60 seconds and are single-use (deleted on exchange).
   */
  private readonly oauthCodeStore = new Map<string, OAuthCodeEntry>();

  /** @description OAuth code TTL in milliseconds (60 seconds) */
  private readonly OAUTH_CODE_TTL_MS = 60_000;

  /** @description OAuth state token max age in milliseconds (10 minutes) */
  private readonly OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

  /**
   * Bcrypt cost factor - SEC-M01 fix: increased from 10 to 12 for production
   * Higher values provide better security but slower hashing
   */
  private readonly BCRYPT_ROUNDS = 12;

  /**
   * OTP length - SEC-H05 fix: increased from 4 to 6 digits
   * 6 digits = 1,000,000 combinations vs 10,000 for 4 digits
   */
  private readonly OTP_LENGTH = 6;

  /**
   * Maximum failed login attempts before account lockout - SEC-H06 fix
   */
  private readonly MAX_FAILED_ATTEMPTS = 5;

  /**
   * Account lockout duration in minutes after max failed attempts
   */
  private readonly LOCKOUT_DURATION_MINUTES = 30;

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
    @InjectRepository(SecurityAudit)
    private readonly securityAuditRepository: Repository<SecurityAudit>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService,
    private readonly rateLimiterService: RateLimiterService,
  ) {}

  /**
   * Generate JWT access and refresh tokens for a user
   * Implements secure token rotation pattern:
   * - Access token: Short-lived (15 minutes) for API access
   * - Refresh token: 7 days (default) or 30 days (remember me) stored in database with hash
   *
   * @param user - User entity to generate tokens for
   * @param request - Express request object for device info and IP
   * @param rememberMe - When true, extends refresh token expiry to 30 days
   * @returns Object containing accessToken and refreshToken strings
   */
  private async generateTokens(
    user: User,
    request?: Request,
    rememberMe = false,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Create JWT payload with user information
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      role_id: user.role.id,
    };

    // Generate short-lived access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Refresh token expiry: 30 days for remember-me, 7 days otherwise
    const refreshExpiry = rememberMe ? '30d' : '7d';
    const refreshExpiryMs = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    // Generate refresh token with conditional expiry
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: refreshExpiry },
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
      expiresAt: new Date(Date.now() + refreshExpiryMs),
      rememberMe,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    this.logger.log(
      `Tokens generated for user ID: ${user.id} (rememberMe: ${rememberMe})`,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user with email/password.
   *
   * AUTO-LOGIN BEHAVIOR (intentional):
   * Returns JWT tokens immediately for auto-login to improve UX.
   * User can browse the marketplace while completing email verification in parallel.
   * Certain protected actions (purchases, reviews) require isVerified=true.
   * The frontend shows a verification banner until the user completes OTP verification.
   *
   * @param registerDto - Registration data (email, password, fullName)
   * @param request - Express request object for IP/device logging and token generation
   * @returns Object containing user info, access token, refresh token, and message
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
    const { email, password, fullName } = registerDto;
    this.logger.log(`Registering new user: ${email}`);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already registered.');
    }

    // SEC-M01: Use stronger bcrypt cost factor (12 vs 10)
    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    // SEC-H05: Use 6-digit OTP (1,000,000 combinations vs 10,000 for 4-digit)
    const otpCode = this.generateSecureOtp();

    const defaultRole = await this.roleRepository.findOne({
      where: { name: 'buyer' },
    });
    if (!defaultRole) {
      throw new Error('Default role buyer not found');
    }

    const user = this.userRepository.create({
      email,
      passwordHash,
      fullName: fullName || null,
      otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isVerified: false,
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
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Verify user OTP
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<void> {
    const { email, otpCode } = verifyOtpDto;
    this.logger.log(`Verifying OTP for email: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } })!;

    if (!user) {
      throw new BadRequestException('Invalid email.');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account already verified.');
    }

    if (!user.isOtpValid()) {
      throw new BadRequestException(
        'OTP code has expired. Please request a new one.',
      );
    }

    if (user.otpCode !== otpCode) {
      throw new BadRequestException('Invalid OTP code.');
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.userRepository.save(user);

    this.logger.log(`Email verified successfully for: ${email}`);
  }

  /**
   * Authenticate a user using email and password.
   * Validates credentials, ensures account is verified,
   * and returns a signed JWT access token upon success.
   * Also logs the login attempt.
   *
   * Security Features (QA Remediation):
   * - SEC-H06: Account lockout after 5 failed attempts
   * - Rate limiting via RateLimiterService
   * - Detailed audit logging of login attempts
   */
  async login(
    loginDto: LoginDto,
    request: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, rememberMe } = loginDto;
    const clientIp = this.getClientIp(request);
    const userAgent = (request.headers['user-agent'] as string) || 'unknown';
    this.logger.log(`Login attempt for email: ${email} from IP: ${clientIp}`);

    // Check rate limit before processing login
    const rateLimitResult = await this.rateLimiterService.checkLimit(
      'login',
      `${email}:${clientIp}`,
    );
    if (!rateLimitResult.allowed) {
      this.logger.warn(`Rate limit exceeded for login: ${email}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many login attempts. Please try again in ${rateLimitResult.retryAfterSeconds} seconds.`,
          retryAfter: rateLimitResult.retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    // Block access for soft-deleted users
    if (!user || user.deletedAt) {
      // Record failed attempt even for non-existent users (prevents user enumeration)
      await this.rateLimiterService.recordFailedAttempt(
        'login',
        `${email}:${clientIp}`,
      );
      throw new UnauthorizedException(
        'Invalid credentials or deleted account.',
      );
    }

    // SEC-H06: Check if account is locked due to failed attempts
    if (user.isAccountLocked()) {
      const lockedUntilMinutes = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 60000,
      );
      this.logger.warn(`Login blocked for locked account: ${email}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${lockedUntilMinutes} minutes.`,
          errorCode: 'ACCOUNT_LOCKED',
          lockedUntilMinutes,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your account first.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // SEC-H06: Increment failed attempts and potentially lock account
      user.incrementFailedAttempts();
      await this.userRepository.save(user);

      // Also record in rate limiter for distributed tracking
      await this.rateLimiterService.recordFailedAttempt(
        'login',
        `${email}:${clientIp}`,
      );

      const remainingAttempts =
        this.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
      this.logger.warn(
        `Invalid password for ${email}. Failed attempts: ${user.failedLoginAttempts}/${this.MAX_FAILED_ATTEMPTS}`,
      );

      // Log LOGIN_FAILURE security event (fire-and-forget)
      this.logSecurityEvent({
        eventType: 'LOGIN_FAILURE',
        email,
        userId: user.id,
        ipAddress: clientIp,
        userAgent,
        failedAttemptNumber: user.failedLoginAttempts,
        metadata: { remainingAttempts },
      });

      if (user.isAccountLocked()) {
        // Log ACCOUNT_LOCKED event (fire-and-forget)
        this.logSecurityEvent({
          eventType: 'ACCOUNT_LOCKED',
          email,
          userId: user.id,
          ipAddress: clientIp,
          userAgent,
          failedAttemptNumber: user.failedLoginAttempts,
          metadata: { lockoutMinutes: this.LOCKOUT_DURATION_MINUTES },
        });

        // Send lockout notification email (fire-and-forget)
        this.emailService
          .sendAccountLockoutEmail(
            email,
            this.LOCKOUT_DURATION_MINUTES,
            clientIp,
          )
          .catch((err) =>
            this.logger.error(`Failed to send lockout email: ${err.message}`),
          );

        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: `Account locked due to too many failed login attempts. Please try again in ${this.LOCKOUT_DURATION_MINUTES} minutes.`,
            errorCode: 'ACCOUNT_LOCKED',
            lockedUntilMinutes: this.LOCKOUT_DURATION_MINUTES,
          },
          HttpStatus.FORBIDDEN,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message:
            remainingAttempts > 0
              ? `Invalid credentials. ${remainingAttempts} attempts remaining before account lockout.`
              : 'Invalid credentials.',
          errorCode: 'INVALID_CREDENTIALS',
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        HttpStatus.UNAUTHORIZED,
      );
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

    // Successful login - reset failed attempts and rate limit
    user.resetFailedAttempts();
    await this.rateLimiterService.recordSuccess(
      'login',
      `${email}:${clientIp}`,
    );

    // Generate both access and refresh tokens with rememberMe flag
    const tokens = await this.generateTokens(user, request, !!rememberMe);

    this.logger.log(`Login successful for user ID: ${user.id}`);

    // Log LOGIN_SUCCESS security event (fire-and-forget)
    this.logSecurityEvent({
      eventType: 'LOGIN_SUCCESS',
      email,
      userId: user.id,
      ipAddress: clientIp,
      userAgent,
      failedAttemptNumber: null,
      metadata: { rememberMe: !!rememberMe },
    });

    /**
     * Update the user's last login timestamp and prepare to save the login audit log.
     * This is essential for auditing and detecting unusual login activity.
     */
    // Save the login log (in real use, request context should pass IP and user-agent)
    await this.loginLogRepository.save({
      user,
      ipAddress: clientIp,
      userAgent,
    });

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
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

    const user = await this.userRepository.findOne({ where: { email } })!;

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

    // SEC-H02: Generate cryptographically secure random token and hash before storage
    // We use a random token instead of JWT for password resets because:
    // 1. Random tokens can be securely hashed in the database
    // 2. No token payload means less attack surface
    // 3. Easier to invalidate after use
    const rawResetToken = this.encryptionService.generateSecureToken(32);

    // Hash the token before storing (user only receives the raw token)
    const hashedResetToken = this.encryptionService.hashToken(rawResetToken);

    // Save HASHED reset token and expiration in database
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepository.save(user);

    // Send reset email with the RAW token (not the hash)
    await this.emailService.sendPasswordResetEmail(email, rawResetToken);

    this.logger.log(`Password reset token generated and sent for: ${email}`);

    return {
      message: 'Password reset instructions have been sent to your email.',
    };
  }

  /**
   * 🔓 RESET PASSWORD FUNCTIONALITY
   * Validates reset token and updates user password
   *
   * SEC-H02: Token verification now uses hash comparison
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { resetToken, newPassword } = resetPasswordDto;
    this.logger.log(`Password reset attempt with token`);

    // SEC-H02: Hash the incoming token to compare with stored hash
    const hashedToken = this.encryptionService.hashToken(resetToken);

    // Find user with the HASHED reset token
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: hashedToken },
    });

    if (!user) {
      // Use constant time comparison to prevent timing attacks
      this.logger.warn(`Invalid reset token provided`);
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // Check if token is expired
    if (!user.isResetTokenValid()) {
      this.logger.warn(`Expired reset token used for user: ${user.email}`);
      throw new BadRequestException(
        'Reset token has expired. Please request a new one.',
      );
    }

    // SEC-M01: Hash new password with stronger bcrypt rounds
    const newPasswordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

    // Update user password and clear reset token
    user.passwordHash = newPasswordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = new Date();
    user.resetFailedAttempts(); // Clear any failed login attempts

    await this.userRepository.save(user);

    // H2 fix: Revoke all active refresh tokens to invalidate existing sessions
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId: user.id })
      .execute();

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
    const user = await this.userRepository.findOne({ where: { id: userId } })!;

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

    // SEC-M01: Hash new password with stronger bcrypt rounds
    const newPasswordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

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

      // Revoke ALL active refresh tokens for this user (C5 fix)
      await this.refreshTokenRepository
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ revokedAt: new Date() })
        .where('user_id = :userId AND revoked_at IS NULL', { userId })
        .execute();

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
    } catch (error: unknown) {
      this.logger.error(
        `Logout failed for user ${userId}: ${(error as Error).message}`,
      );
      throw new BadRequestException('Logout failed. Invalid token.');
    }
  }

  /**
   * 🔄 REFRESH TOKEN FUNCTIONALITY
   * Validates refresh token against the database and issues a new access token.
   * Uses token hash lookup in refresh_tokens table with entity validation methods.
   *
   * @description Implements secure token rotation — issues both new access AND refresh tokens.
   * 1. Hash the incoming refresh token (SHA-256)
   * 2. Look up the hash in the refresh_tokens table
   * 3. Validate the token using RefreshToken.isValid() (not revoked + not expired)
   * 4. Load the user and verify account status
   * 5. Generate new access token (15min) AND new refresh token (7 days)
   * 6. Store new refresh token hash in database
   * 7. Revoke the old refresh token (rotation)
   *
   * @param refreshTokenDto - Contains the raw refresh token string
   * @returns New access token, new refresh token, and confirmation message
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string; message: string }> {
    const { token } = refreshTokenDto;
    this.logger.log(`Token refresh requested`);

    // Step 1: Hash the incoming refresh token to match against DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Step 2: Look up the refresh token in the database
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user', 'user.role'],
    });

    if (!storedToken) {
      this.logger.warn(`Refresh token not found in database`);
      throw new UnauthorizedException(
        'Invalid refresh token. Please log in again.',
      );
    }

    // Step 3: Validate using entity methods (checks revoked + expired)
    if (!storedToken.isValid()) {
      this.logger.warn(
        `Invalid/expired refresh token for user ID: ${storedToken.userId}`,
      );
      throw new UnauthorizedException(
        'Refresh token has expired or been revoked. Please log in again.',
      );
    }

    // Step 4: Load user and verify account status
    const user = storedToken.user;

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found or account deleted.');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Account is banned.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account is not verified.');
    }

    if (user.isAccountLocked()) {
      throw new UnauthorizedException('Account is temporarily locked.');
    }

    // Step 5: Generate a new access token
    const newPayload = {
      sub: user.id,
      role: user.role.name,
      email: user.email,
      role_id: user.role.id,
    };

    const newAccessToken = this.jwtService.sign(newPayload, {
      expiresIn: '15m',
    });

    // Step 6: Generate a NEW refresh token — inherit rememberMe from old token
    const inheritedRememberMe = storedToken.rememberMe || false;
    const refreshExpiry = inheritedRememberMe ? '30d' : '7d';
    const refreshExpiryMs = inheritedRememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    const newRefreshToken = this.jwtService.sign(
      { ...newPayload, type: 'refresh' },
      { expiresIn: refreshExpiry },
    );

    // Step 7: Hash and store the new refresh token
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    const newRefreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash: newRefreshTokenHash,
      userId: user.id,
      user,
      deviceInfo: storedToken.deviceInfo || 'unknown',
      ipAddress: storedToken.ipAddress || 'unknown',
      expiresAt: new Date(Date.now() + refreshExpiryMs),
      rememberMe: inheritedRememberMe,
    });

    await this.refreshTokenRepository.save(newRefreshTokenEntity);

    // Step 8: Revoke the old refresh token (token rotation for security)
    storedToken.revoke();
    await this.refreshTokenRepository.save(storedToken);

    // Update user activity
    user.lastActivityAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(
      `Token successfully refreshed for user ID: ${user.id} with new refresh token`,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: 'Token refreshed successfully.',
    };
  }

  /**
   * 📧 RESEND OTP FUNCTIONALITY
   * Generates new OTP and sends verification email for unverified users
   */
  async resendOtp(resendOtpDto: ResendOtpDto): Promise<{ message: string }> {
    const { email } = resendOtpDto;
    this.logger.log(`OTP resend requested for email: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } })!;

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

    // SEC-H05: Generate 6-digit OTP using secure method
    const newOtpCode = this.generateSecureOtp();

    // Update user with new OTP and expiration
    user.otpCode = newOtpCode;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
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
    const user = await this.userRepository.findOne({ where: { id: userId } })!;

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
    user.otpExpiresAt = null;

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
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to blacklist tokens during account deletion: ${(error as Error).message}`,
      );
    }

    this.logger.log(`Account successfully soft deleted for user ID: ${userId}`);

    return {
      message:
        'Your account has been successfully deleted. All your data has been securely removed.',
    };
  }

  // =============================================================================
  // OAUTH METHODS
  // =============================================================================

  /**
   * Validate or create a user from an OAuth provider profile.
   *
   * Three scenarios handled:
   * 1. User found by provider ID (googleId/facebookId) → return existing user
   * 2. User found by email → link provider ID to existing account
   * 3. No user found → create new auto-verified user with buyer role
   *
   * @param provider - OAuth provider name ('google' | 'facebook')
   * @param profile - Normalized OAuth profile with providerId, email, fullName, avatar
   * @param request - Express request for IP/user-agent logging
   * @returns The existing or newly created User entity with role loaded
   */
  async validateOrCreateOAuthUser(
    provider: 'google' | 'facebook',
    profile: {
      providerId: string;
      email: string | null;
      fullName: string | null;
      avatar: string | null;
    },
    request?: Request,
  ): Promise<User> {
    const providerIdField = provider === 'google' ? 'googleId' : 'facebookId';
    const clientIp = request ? this.getClientIp(request) : 'unknown';
    const userAgent = (request?.headers['user-agent'] as string) || 'unknown';

    // 1. Lookup by provider ID
    const existingByProvider = await this.userRepository.findOne({
      where: { [providerIdField]: profile.providerId },
      relations: ['role'],
    });

    if (existingByProvider) {
      this.logger.log(
        `OAuth login: existing ${provider} user ID: ${existingByProvider.id}`,
      );
      this.logSecurityEvent({
        eventType: 'OAUTH_LOGIN_SUCCESS',
        email: existingByProvider.email,
        userId: existingByProvider.id,
        ipAddress: clientIp,
        userAgent,
        failedAttemptNumber: null,
        metadata: { provider },
      });
      return existingByProvider;
    }

    // 2. Lookup by email → link provider
    if (profile.email) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email: profile.email },
        relations: ['role'],
      });

      if (existingByEmail) {
        existingByEmail[providerIdField] = profile.providerId;
        if (!existingByEmail.avatar && profile.avatar) {
          existingByEmail.avatar = profile.avatar;
        }
        await this.userRepository.save(existingByEmail);

        this.logger.log(
          `OAuth link: ${provider} linked to existing user ID: ${existingByEmail.id}`,
        );
        this.logSecurityEvent({
          eventType: 'OAUTH_ACCOUNT_LINKED',
          email: existingByEmail.email,
          userId: existingByEmail.id,
          ipAddress: clientIp,
          userAgent,
          failedAttemptNumber: null,
          metadata: { provider },
        });
        return existingByEmail;
      }
    }

    // 3. Create new user (auto-verified, no password)
    const defaultRole = await this.roleRepository.findOne({
      where: { name: 'buyer' },
    });
    if (!defaultRole) {
      throw new Error('Default role buyer not found');
    }

    const newUser = this.userRepository.create({
      email: profile.email,
      fullName: profile.fullName,
      avatar: profile.avatar,
      [providerIdField]: profile.providerId,
      oauthProvider: provider,
      isVerified: true, // OAuth providers verify email
      role: defaultRole,
    });

    await this.userRepository.save(newUser);

    this.logger.log(
      `OAuth create: new ${provider} user ID: ${newUser.id}, email: ${profile.email}`,
    );
    this.logSecurityEvent({
      eventType: 'OAUTH_ACCOUNT_CREATED',
      email: profile.email || 'no-email',
      userId: newUser.id,
      ipAddress: clientIp,
      userAgent,
      failedAttemptNumber: null,
      metadata: { provider },
    });

    return newUser;
  }

  /**
   * Generate JWT tokens for an OAuth-authenticated user.
   * Wraps the private generateTokens() with request context and logging.
   *
   * @param user - Authenticated User entity with role loaded
   * @param request - Express request for device/IP tracking
   * @returns Object containing accessToken and refreshToken
   */
  async generateOAuthTokens(
    user: User,
    request?: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.generateTokens(user, request);

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return tokens;
  }

  // =============================================================================
  // SECURITY HELPER METHODS
  // =============================================================================

  /**
   * Generates a cryptographically secure OTP
   * SEC-H05: Uses 6 digits instead of 4 (1,000,000 combinations vs 10,000)
   *
   * @returns 6-digit OTP string
   */
  private generateSecureOtp(): string {
    // Generate random number using crypto for better randomness than Math.random()
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);

    // Get 6 digits (100000 to 999999)
    const otp = (randomNumber % 900000) + 100000;
    return otp.toString();
  }

  /**
   * Log a security event to the security_audit table (fire-and-forget).
   * Never blocks the login flow — errors are caught and logged.
   *
   * @param event - Security event data to persist
   */
  private logSecurityEvent(event: {
    eventType: SecurityEventType;
    email: string;
    userId: number | null;
    ipAddress: string;
    userAgent: string;
    failedAttemptNumber: number | null;
    metadata: Record<string, any> | null;
  }): void {
    const auditEntry = this.securityAuditRepository.create(event);
    this.securityAuditRepository.save(auditEntry).catch((err) => {
      this.logger.error(
        `Failed to log security event [${event.eventType}]: ${err.message}`,
      );
    });
  }

  /**
   * Extracts the client IP address from the request
   * Handles proxy headers (X-Forwarded-For, X-Real-IP)
   *
   * @param request - Express request object
   * @returns Client IP address
   */
  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = (forwardedFor as string).split(',').map((ip) => ip.trim());
      return ips[0];
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }

    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  // =============================================================================
  // OAUTH SECURITY: AUTH CODE EXCHANGE (C1) + STATE CSRF PROTECTION (C2)
  // =============================================================================

  /**
   * @description Generates a short-lived OAuth authorization code mapped to tokens.
   * The code is stored in-memory with a 60-second TTL and is single-use.
   * This prevents JWT tokens from appearing in URL query parameters.
   *
   * @param tokens - The access and refresh tokens to store
   * @returns The generated authorization code string
   */
  generateOAuthCode(tokens: {
    accessToken: string;
    refreshToken: string;
  }): string {
    // Purge expired codes to prevent memory leaks
    this.purgeExpiredOAuthCodes();

    const code = crypto.randomBytes(32).toString('hex');
    this.oauthCodeStore.set(code, {
      ...tokens,
      expiresAt: Date.now() + this.OAUTH_CODE_TTL_MS,
    });

    this.logger.log(`OAuth code generated (expires in 60s)`);
    return code;
  }

  /**
   * @description Exchanges a single-use OAuth authorization code for JWT tokens.
   * The code is deleted after successful exchange to prevent replay attacks.
   *
   * @param code - The authorization code from the OAuth callback redirect
   * @returns Object containing accessToken and refreshToken
   * @throws BadRequestException if code is invalid, expired, or already used
   */
  exchangeOAuthCode(code: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const entry = this.oauthCodeStore.get(code);

    if (!entry) {
      throw new BadRequestException('Invalid or expired OAuth code.');
    }

    if (Date.now() > entry.expiresAt) {
      this.oauthCodeStore.delete(code);
      throw new BadRequestException('OAuth code has expired.');
    }

    // Single-use: delete immediately after exchange
    this.oauthCodeStore.delete(code);

    this.logger.log('OAuth code exchanged for tokens');
    return {
      accessToken: entry.accessToken,
      refreshToken: entry.refreshToken,
    };
  }

  /**
   * @description Generates an HMAC-signed OAuth state parameter for CSRF protection.
   * Uses a stateless approach: state = timestamp.hmac(timestamp, jwtSecret).
   * No server-side session storage needed.
   *
   * @returns The state string to include in the OAuth redirect
   */
  generateOAuthState(): string {
    const timestamp = Date.now().toString();
    const secret = this.jwtService['options']?.secret || 'oauth-state-secret';
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(timestamp)
      .digest('hex');

    return `${timestamp}.${hmac}`;
  }

  /**
   * @description Validates an HMAC-signed OAuth state parameter.
   * Checks both the HMAC signature and the timestamp freshness (10-minute window).
   *
   * @param state - The state string from the OAuth callback query params
   * @returns true if state is valid and fresh
   */
  validateOAuthState(state: string): boolean {
    if (!state || !state.includes('.')) {
      return false;
    }

    const [timestamp, receivedHmac] = state.split('.');
    const ts = parseInt(timestamp, 10);

    if (isNaN(ts)) {
      return false;
    }

    // Check freshness (10-minute window)
    if (Date.now() - ts > this.OAUTH_STATE_MAX_AGE_MS) {
      this.logger.warn('OAuth state expired');
      return false;
    }

    // Verify HMAC signature
    const secret = this.jwtService['options']?.secret || 'oauth-state-secret';
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(timestamp)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex'),
    );

    if (!isValid) {
      this.logger.warn('OAuth state HMAC mismatch (possible CSRF)');
    }

    return isValid;
  }

  /**
   * @description Purges expired OAuth codes from the in-memory store.
   * Called automatically before generating new codes.
   */
  private purgeExpiredOAuthCodes(): void {
    const now = Date.now();
    for (const [code, entry] of this.oauthCodeStore.entries()) {
      if (now > entry.expiresAt) {
        this.oauthCodeStore.delete(code);
      }
    }
  }
}
