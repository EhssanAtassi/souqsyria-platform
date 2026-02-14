import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { LoginLog } from './entity/login-log.entity';
import { TokenBlacklist } from './entity/token-blacklist.entity';
import { RefreshToken } from './entity/refresh-token.entity';
import { SecurityAudit } from './entity/security-audit.entity';
import { EmailService } from './service/email.service';
import { EncryptionService } from '../common/utils/encryption.util';
import { RateLimiterService } from '../common/services/rate-limiter.service';
import * as bcrypt from 'bcryptjs';

// Mock bcryptjs at module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword123456'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('$2b$10$salt'),
}));

/**
 * AuthService Unit Tests
 *
 * Tests authentication flows including:
 * - User registration with email verification
 * - Login with JWT token generation
 * - OAuth authentication (Google/Facebook)
 * - Password reset and change
 * - Token refresh and logout
 * - Account deletion (soft delete)
 */
describe('AuthService', () => {
  let service: AuthService;

  // Mock repositories
  let userRepository: any;
  let roleRepository: any;
  let loginLogRepository: any;
  let tokenBlacklistRepository: any;
  let refreshTokenRepository: any;
  let securityAuditRepository: any;

  // Mock services
  let jwtService: any;
  let emailService: any;

  // Mock data
  const mockRole = {
    id: 1,
    name: 'buyer',
    description: 'Default buyer role',
  };

  const mockUser = {
    id: 1,
    email: 'test@souqsyria.com',
    fullName: 'Test User',
    passwordHash: '$2b$10$hashedpassword123456',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    deletedAt: null,
    otpCode: null,
    role: mockRole,
    lastLoginAt: new Date(),
    lastActivityAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    metadata: {},
    // User entity methods for security and account management
    isResetTokenValid: jest.fn().mockReturnValue(true),
    isOtpValid: jest.fn().mockReturnValue(true),
    resetFailedAttempts: jest.fn(),
    isAccountLocked: jest.fn().mockReturnValue(false),
    incrementFailedAttempts: jest.fn(), // SEC-H06: Track failed login attempts
  };

  // Factory for creating mock repositories
  const createMockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    // Initialize mocks
    userRepository = createMockRepository();
    roleRepository = createMockRepository();
    loginLogRepository = createMockRepository();
    tokenBlacklistRepository = createMockRepository();
    refreshTokenRepository = createMockRepository();
    securityAuditRepository = createMockRepository();
    // SecurityAudit uses fire-and-forget .save().catch() — needs default resolved promise
    securityAuditRepository.create.mockReturnValue({});
    securityAuditRepository.save.mockResolvedValue({});

    jwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      verify: jest.fn().mockReturnValue({ sub: 1, email: 'test@souqsyria.com', exp: Math.floor(Date.now() / 1000) + 3600 }),
      decode: jest.fn().mockReturnValue({ sub: 1, email: 'test@souqsyria.com', exp: Math.floor(Date.now() / 1000) + 3600 }),
    };

    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
      sendAccountLockoutEmail: jest.fn().mockResolvedValue(true),
    };

    const encryptionService = {
      // Core encryption methods
      encrypt: jest.fn().mockImplementation((text) => `encrypted_${text}`),
      decrypt: jest.fn().mockImplementation((text) => text.replace('encrypted_', '')),
      hash: jest.fn().mockImplementation((text) => `hashed_${text}`),
      compare: jest.fn().mockResolvedValue(true),
      // String-based encryption for OAuth tokens
      encryptToString: jest.fn().mockImplementation((text) => `enc_${text}`),
      decryptFromString: jest.fn().mockImplementation((text) => text.replace('enc_', '')),
      // Token generation for password reset
      generateSecureToken: jest.fn().mockReturnValue('secure_random_token_32bytes'),
      hashToken: jest.fn().mockImplementation((token) => `hashed_${token}`),
    };

    const rateLimiterService = {
      // Check if rate limit exceeded
      checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, retryAfter: null }),
      // Record failed/successful attempts
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      recordSuccess: jest.fn().mockResolvedValue(undefined),
      // Legacy methods (may be used elsewhere)
      checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10 }),
      isRateLimited: jest.fn().mockResolvedValue(false),
      consume: jest.fn().mockResolvedValue(true),
      reset: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
        {
          provide: getRepositoryToken(LoginLog),
          useValue: loginLogRepository,
        },
        {
          provide: getRepositoryToken(TokenBlacklist),
          useValue: tokenBlacklistRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
        {
          provide: getRepositoryToken(SecurityAudit),
          useValue: securityAuditRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: EncryptionService,
          useValue: encryptionService,
        },
        {
          provide: RateLimiterService,
          useValue: rateLimiterService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@souqsyria.com',
      password: 'SecurePass123!',
      fullName: 'New User',
    };

    const mockRequest = {
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0 Test Browser' },
    } as any;

    it('should successfully register a new user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null); // No existing user
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue({
        ...registerDto,
        id: 2,
        role: mockRole,
        isVerified: false,
      });
      userRepository.save.mockResolvedValue({
        ...registerDto,
        id: 2,
        role: mockRole,
        isVerified: false,
      });
      refreshTokenRepository.create.mockReturnValue({ id: 1, tokenHash: 'hash' });
      refreshTokenRepository.save.mockResolvedValue({ id: 1, tokenHash: 'hash' });

      // Act
      const result = await service.register(registerDto, mockRequest);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.message).toContain('Registration successful');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException for existing email', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser); // User exists

      // Act & Assert
      await expect(service.register(registerDto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when default role not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(null); // No role found

      // Act & Assert
      await expect(service.register(registerDto, mockRequest)).rejects.toThrow(
        'Default role buyer not found',
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@souqsyria.com',
      password: 'correctPassword123',
    };

    const mockRequest = {
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0 Test Browser' },
    } as any;

    beforeEach(() => {
      // Reset bcrypt.compare mock for each test
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should successfully login with valid credentials', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      loginLogRepository.save.mockResolvedValue({ id: 1 });
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.login(loginDto, mockRequest);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(jwtService.sign).toHaveBeenCalled();
      expect(loginLogRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for deleted user', async () => {
      // Arrange
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      userRepository.findOne.mockResolvedValue(deletedUser);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for unverified user', async () => {
      // Arrange
      const unverifiedUser = { ...mockUser, isVerified: false };
      userRepository.findOne.mockResolvedValue(unverifiedUser);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest)).rejects.toThrow(
        'Please verify your account first.',
      );
    });

    it('should throw UnauthorizedException for banned user', async () => {
      // Arrange
      const bannedUser = { ...mockUser, isBanned: true };
      userRepository.findOne.mockResolvedValue(bannedUser);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest)).rejects.toThrow(
        'This account has been banned.',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      const wrongPasswordDto = { ...loginDto, password: 'wrongPassword' };
      // Mock bcrypt.compare to return false for wrong password
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      // Act & Assert
      await expect(service.login(wrongPasswordDto, mockRequest)).rejects.toThrow(
        'Invalid credentials.',
      );
    });

    // ─── C4: Lockout flow tests ──────────────────────────────────────

    /**
     * @description Verifies login is blocked when the account is already locked
     * (isAccountLocked returns true before password check).
     */
    it('should throw FORBIDDEN when account is already locked', async () => {
      // Arrange — locked user with 30 min remaining
      const lockedUser = {
        ...mockUser,
        failedLoginAttempts: 5,
        accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000),
        isAccountLocked: jest.fn().mockReturnValue(true),
      };
      userRepository.findOne.mockResolvedValue(lockedUser);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest)).rejects.toMatchObject({
        response: expect.objectContaining({
          statusCode: 403,
          errorCode: 'ACCOUNT_LOCKED',
          lockedUntilMinutes: expect.any(Number),
        }),
      });
      // Password should never be checked for locked accounts
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    /**
     * @description Verifies incrementFailedAttempts is called on wrong password
     * and remainingAttempts is included in the error response.
     */
    it('should increment failed attempts on wrong password', async () => {
      // Arrange — user with 3 prior failures (2 remaining)
      const userWithFailures = {
        ...mockUser,
        failedLoginAttempts: 3,
        isAccountLocked: jest.fn().mockReturnValue(false),
        incrementFailedAttempts: jest.fn(),
      };
      userRepository.findOne.mockResolvedValue(userWithFailures);
      userRepository.save.mockResolvedValue(userWithFailures);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest)).rejects.toMatchObject({
        response: expect.objectContaining({
          errorCode: 'INVALID_CREDENTIALS',
          remainingAttempts: 2,
        }),
      });
      expect(userWithFailures.incrementFailedAttempts).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(userWithFailures);
    });

    /**
     * @description Verifies lockout email is sent when the 5th failed attempt
     * triggers account lockout (isAccountLocked becomes true after increment).
     */
    it('should send lockout email when account becomes locked on 5th failure', async () => {
      // Arrange — user at 4 failures; after increment isAccountLocked returns true
      const userAtThreshold = {
        ...mockUser,
        failedLoginAttempts: 4,
        isAccountLocked: jest
          .fn()
          .mockReturnValueOnce(false) // first check: not locked yet
          .mockReturnValueOnce(true), // second check (after increment): now locked
        incrementFailedAttempts: jest.fn(),
      };
      userRepository.findOne.mockResolvedValue(userAtThreshold);
      userRepository.save.mockResolvedValue(userAtThreshold);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest)).rejects.toMatchObject({
        response: expect.objectContaining({
          statusCode: 403,
          errorCode: 'ACCOUNT_LOCKED',
          lockedUntilMinutes: 30,
        }),
      });
      expect(emailService.sendAccountLockoutEmail).toHaveBeenCalledWith(
        loginDto.email,
        30,
        expect.any(String),
      );
    });

    // ─── C5: Remember-me TTL tests ───────────────────────────────────

    /**
     * @description Verifies refresh token uses 30-day expiry when rememberMe is true.
     */
    it('should generate 30-day refresh token when rememberMe is true', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      loginLogRepository.save.mockResolvedValue({ id: 1 });
      userRepository.save.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue({});
      refreshTokenRepository.save.mockResolvedValue({});
      const rememberDto = { ...loginDto, rememberMe: true };

      // Act
      await service.login(rememberDto, mockRequest);

      // Assert — jwtService.sign called twice: 1st=access (15m), 2nd=refresh
      const signCalls = jwtService.sign.mock.calls;
      expect(signCalls.length).toBeGreaterThanOrEqual(2);
      // Second call is the refresh token with 30d expiry
      expect(signCalls[1][1]).toEqual(expect.objectContaining({ expiresIn: '30d' }));
      // Verify rememberMe flag stored in refresh token entity
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe: true }),
      );
    });

    /**
     * @description Verifies refresh token uses 7-day expiry when rememberMe is false/absent.
     */
    it('should generate 7-day refresh token when rememberMe is false', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      loginLogRepository.save.mockResolvedValue({ id: 1 });
      userRepository.save.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue({});
      refreshTokenRepository.save.mockResolvedValue({});

      // Act — loginDto has no rememberMe field
      await service.login(loginDto, mockRequest);

      // Assert — refresh token sign call uses 7d
      const signCalls = jwtService.sign.mock.calls;
      expect(signCalls.length).toBeGreaterThanOrEqual(2);
      expect(signCalls[1][1]).toEqual(expect.objectContaining({ expiresIn: '7d' }));
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe: false }),
      );
    });
  });

  describe('verifyOtp', () => {
    it('should successfully verify OTP', async () => {
      // Arrange
      const unverifiedUser = {
        ...mockUser,
        isVerified: false,
        otpCode: '1234',
      };
      userRepository.findOne.mockResolvedValue(unverifiedUser);
      userRepository.save.mockResolvedValue({ ...unverifiedUser, isVerified: true });

      // Act
      await service.verifyOtp({ email: 'test@souqsyria.com', otpCode: '1234' });

      // Assert
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid email', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.verifyOtp({ email: 'nonexistent@test.com', otpCode: '1234' }),
      ).rejects.toThrow('Invalid email.');
    });

    it('should throw BadRequestException for already verified account', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser); // isVerified: true

      // Act & Assert
      await expect(
        service.verifyOtp({ email: 'test@souqsyria.com', otpCode: '1234' }),
      ).rejects.toThrow('Account already verified.');
    });

    it('should throw BadRequestException for wrong OTP', async () => {
      // Arrange
      const unverifiedUser = {
        ...mockUser,
        isVerified: false,
        otpCode: '1234',
      };
      userRepository.findOne.mockResolvedValue(unverifiedUser);

      // Act & Assert
      await expect(
        service.verifyOtp({ email: 'test@souqsyria.com', otpCode: '5678' }),
      ).rejects.toThrow('Invalid OTP code.');
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.forgotPassword({ email: 'test@souqsyria.com' });

      // Assert
      // The service now uses encryptionService.generateSecureToken() instead of jwtService.sign()
      // for generating password reset tokens (more secure approach)
      expect(result.message).toContain('reset instructions');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled(); // Token is saved to user record
    });

    it('should return generic message for non-existent email (security)', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.forgotPassword({ email: 'nonexistent@test.com' });

      // Assert - Should not reveal if email exists
      expect(result.message).toContain('If the email exists');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for unverified user', async () => {
      // Arrange
      const unverifiedUser = { ...mockUser, isVerified: false };
      userRepository.findOne.mockResolvedValue(unverifiedUser);

      // Act & Assert
      await expect(
        service.forgotPassword({ email: 'test@souqsyria.com' }),
      ).rejects.toThrow('verify your email');
    });
  });

  describe('resetPassword', () => {
    const resetDto = {
      resetToken: 'valid.reset.token',
      newPassword: 'NewSecurePass123!',
    };

    beforeEach(() => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$newhashpassword' as never);
    });

    it('should successfully reset password with valid token', async () => {
      // Arrange — resetPasswordToken stored as hashed value
      const userWithResetToken = {
        ...mockUser,
        resetPasswordToken: 'hashed_valid.reset.token',
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        isResetTokenValid: jest.fn().mockReturnValue(true),
        resetFailedAttempts: jest.fn(),
      };
      userRepository.findOne.mockResolvedValue(userWithResetToken);
      userRepository.save.mockResolvedValue(userWithResetToken);
      // Mock createQueryBuilder for revoking refresh tokens
      refreshTokenRepository.createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      });

      // Act
      const result = await service.resetPassword(resetDto);

      // Assert
      expect(result.message).toContain('successfully reset');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      // Arrange
      const userWithExpiredToken = {
        ...mockUser,
        resetPasswordToken: 'expired.reset.token',
        isResetTokenValid: jest.fn().mockReturnValue(false),
      };
      userRepository.findOne.mockResolvedValue(userWithExpiredToken);

      // Act & Assert
      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        'expired',
      );
    });
  });

  describe('changePassword', () => {
    const changeDto = {
      currentPassword: 'correctPassword123',
      newPassword: 'NewSecurePass456!',
    };

    beforeEach(() => {
      jest.spyOn(bcrypt, 'compare').mockImplementation((password: string, hash: string) => {
        if (password === 'correctPassword123') return Promise.resolve(true);
        if (password === 'NewSecurePass456!') return Promise.resolve(false); // New password is different
        return Promise.resolve(false);
      });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$newhash' as never);
    });

    it('should successfully change password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.changePassword(1, changeDto);

      // Assert
      expect(result.message).toContain('successfully changed');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changePassword(999, changeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for wrong current password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      const wrongDto = { ...changeDto, currentPassword: 'wrongPassword' };

      // Act & Assert
      await expect(service.changePassword(1, wrongDto)).rejects.toThrow(
        'Current password is incorrect',
      );
    });

    it('should throw UnauthorizedException for banned user', async () => {
      // Arrange
      const bannedUser = { ...mockUser, isBanned: true };
      userRepository.findOne.mockResolvedValue(bannedUser);

      // Act & Assert
      await expect(service.changePassword(1, changeDto)).rejects.toThrow(
        'banned',
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout and blacklist token', async () => {
      // Arrange
      tokenBlacklistRepository.findOne.mockResolvedValue(null);
      tokenBlacklistRepository.create.mockReturnValue({ id: 1, tokenHash: 'hash' });
      tokenBlacklistRepository.save.mockResolvedValue({ id: 1 });
      userRepository.update.mockResolvedValue({ affected: 1 });
      // Mock createQueryBuilder for revoking refresh tokens
      refreshTokenRepository.createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      });

      // Act
      const result = await service.logout(1, 'mock.jwt.token', '192.168.1.1');

      // Assert
      expect(result.message).toContain('Logout successful');
      expect(tokenBlacklistRepository.save).toHaveBeenCalled();
    });

    it('should handle already blacklisted token gracefully', async () => {
      // Arrange
      tokenBlacklistRepository.findOne.mockResolvedValue({ id: 1 }); // Already blacklisted

      // Act
      const result = await service.logout(1, 'mock.jwt.token', '192.168.1.1');

      // Assert - Should still return success (idempotent)
      expect(result.message).toContain('Logout successful');
    });

    it('should throw BadRequestException for invalid token format', async () => {
      // Arrange
      jwtService.decode.mockReturnValue(null);

      // Act & Assert
      await expect(
        service.logout(1, 'invalid.token', '192.168.1.1'),
      ).rejects.toThrow('Invalid token');
    });
  });

  describe('refreshToken', () => {
    const refreshDto = { token: 'valid.refresh.token' };

    /**
     * @description Helper to create a mock stored RefreshToken entity
     * that mirrors the real entity shape with user relation and isValid()
     */
    const createMockStoredToken = (overrides: Record<string, any> = {}) => ({
      id: 1,
      tokenHash: 'sha256hash',
      userId: mockUser.id,
      user: { ...mockUser },
      rememberMe: false,
      isValid: jest.fn().mockReturnValue(true),
      revoke: jest.fn(),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    });

    it('should successfully refresh token', async () => {
      // Arrange — stored token found with valid user
      const storedToken = createMockStoredToken();
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);
      refreshTokenRepository.create.mockReturnValue({ id: 2 });
      refreshTokenRepository.save.mockResolvedValue({ id: 2 });

      // Act
      const result = await service.refreshToken(refreshDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result.message).toContain('refreshed');
    });

    it('should throw UnauthorizedException when token not found in DB', async () => {
      // Arrange — no stored token matches the hash
      refreshTokenRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw UnauthorizedException for revoked/expired stored token', async () => {
      // Arrange — stored token exists but isValid() returns false
      const revokedToken = createMockStoredToken({
        isValid: jest.fn().mockReturnValue(false),
      });
      refreshTokenRepository.findOne.mockResolvedValue(revokedToken);

      // Act & Assert
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        'expired or been revoked',
      );
    });

    it('should throw UnauthorizedException for deleted user', async () => {
      // Arrange — user associated with token is soft-deleted
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      const storedToken = createMockStoredToken({ user: deletedUser });
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);

      // Act & Assert
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        'not found or account deleted',
      );
    });

    it('should throw UnauthorizedException for banned user', async () => {
      // Arrange — user associated with token is banned
      const bannedUser = { ...mockUser, isBanned: true };
      const storedToken = createMockStoredToken({ user: bannedUser });
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);

      // Act & Assert
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        'banned',
      );
    });
  });

  describe('resendOtp', () => {
    it('should successfully resend OTP for unverified user', async () => {
      // Arrange
      const unverifiedUser = {
        ...mockUser,
        isVerified: false,
        updatedAt: new Date(Date.now() - 120000), // 2 minutes ago
      };
      userRepository.findOne.mockResolvedValue(unverifiedUser);
      userRepository.save.mockResolvedValue(unverifiedUser);

      // Act
      const result = await service.resendOtp({ email: 'test@souqsyria.com' });

      // Assert
      expect(result.message).toContain('verification code');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should return generic message for non-existent email (security)', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.resendOtp({ email: 'nonexistent@test.com' });

      // Assert
      expect(result.message).toContain('If the email exists');
    });

    it('should throw BadRequestException for already verified user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser); // isVerified: true

      // Act & Assert
      await expect(
        service.resendOtp({ email: 'test@souqsyria.com' }),
      ).rejects.toThrow('already verified');
    });

    it('should throw BadRequestException for rate limiting', async () => {
      // Arrange
      const recentOtpUser = {
        ...mockUser,
        isVerified: false,
        updatedAt: new Date(), // Just now
      };
      userRepository.findOne.mockResolvedValue(recentOtpUser);

      // Act & Assert
      await expect(
        service.resendOtp({ email: 'test@souqsyria.com' }),
      ).rejects.toThrow('wait');
    });
  });

  describe('deleteAccount', () => {
    const deleteDto = {
      password: 'correctPassword123',
      reason: 'Personal reasons',
    };

    beforeEach(() => {
      jest.spyOn(bcrypt, 'compare').mockImplementation((password: string) => {
        return Promise.resolve(password === 'correctPassword123');
      });
    });

    it('should successfully soft delete account', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({ ...mockUser, deletedAt: new Date() });
      tokenBlacklistRepository.create.mockReturnValue({ id: 1 });
      tokenBlacklistRepository.save.mockResolvedValue({ id: 1 });

      // Act
      const result = await service.deleteAccount(1, deleteDto, '192.168.1.1');

      // Assert
      expect(result.message).toContain('successfully deleted');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteAccount(999, deleteDto, '192.168.1.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for wrong password', async () => {
      // Arrange - Create fresh user object to avoid mock interference
      const activeUser = {
        id: 1,
        email: 'test@souqsyria.com',
        fullName: 'Test User',
        passwordHash: '$2b$10$hashedpassword123456',
        isVerified: true,
        isBanned: false,
        deletedAt: null,
        role: mockRole,
        metadata: {},
      };
      userRepository.findOne.mockResolvedValue(activeUser);
      const wrongDto = { ...deleteDto, password: 'wrongPassword' };

      // Act & Assert
      await expect(
        service.deleteAccount(1, wrongDto, '192.168.1.1'),
      ).rejects.toThrow('Incorrect password');
    });

    it('should throw NotFoundException for already deleted account', async () => {
      // Arrange
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      userRepository.findOne.mockResolvedValue(deletedUser);

      // Act & Assert
      await expect(
        service.deleteAccount(1, deleteDto, '192.168.1.1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── OAuth: validateOrCreateOAuthUser ───────────────────────────

  describe('validateOrCreateOAuthUser', () => {
    /**
     * @description Unified profile shape used by both Google and Facebook strategies
     */
    const oauthProfile = {
      providerId: 'google123',
      email: 'oauth@test.com',
      fullName: 'OAuth User',
      avatar: 'https://example.com/pic.jpg',
    };

    const mockRequest = {
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
    } as any;

    it('should return existing user found by Google provider ID', async () => {
      // Arrange — user already has googleId linked
      const existingUser = { ...mockUser, googleId: 'google123', role: mockRole };
      userRepository.findOne.mockResolvedValueOnce(existingUser);
      securityAuditRepository.create.mockReturnValue({});
      securityAuditRepository.save.mockResolvedValue({});

      // Act
      const result = await service.validateOrCreateOAuthUser(
        'google',
        oauthProfile,
        mockRequest,
      );

      // Assert — returns the existing user without creating a new one
      expect(result).toEqual(existingUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { googleId: 'google123' },
        relations: ['role'],
      });
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should return existing user found by Facebook provider ID', async () => {
      // Arrange — user already has facebookId linked
      const fbProfile = { ...oauthProfile, providerId: 'fb456' };
      const existingUser = { ...mockUser, facebookId: 'fb456', role: mockRole };
      userRepository.findOne.mockResolvedValueOnce(existingUser);
      securityAuditRepository.create.mockReturnValue({});
      securityAuditRepository.save.mockResolvedValue({});

      // Act
      const result = await service.validateOrCreateOAuthUser(
        'facebook',
        fbProfile,
        mockRequest,
      );

      // Assert — lookup uses facebookId column
      expect(result).toEqual(existingUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { facebookId: 'fb456' },
        relations: ['role'],
      });
    });

    it('should link Google ID to existing account found by email', async () => {
      // Arrange — no match by googleId, but email exists
      const existingByEmail = { ...mockUser, googleId: null, role: mockRole };
      userRepository.findOne
        .mockResolvedValueOnce(null) // No user by googleId
        .mockResolvedValueOnce(existingByEmail); // Found by email
      userRepository.save.mockResolvedValue(existingByEmail);
      securityAuditRepository.create.mockReturnValue({});
      securityAuditRepository.save.mockResolvedValue({});

      // Act
      const result = await service.validateOrCreateOAuthUser(
        'google',
        oauthProfile,
        mockRequest,
      );

      // Assert — provider ID linked to existing account
      expect(result.googleId).toBe('google123');
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ googleId: 'google123' }),
      );
    });

    it('should create new user when no existing account found', async () => {
      // Arrange — neither provider ID nor email match
      userRepository.findOne
        .mockResolvedValueOnce(null) // No user by googleId
        .mockResolvedValueOnce(null); // No user by email
      roleRepository.findOne.mockResolvedValue(mockRole);
      const newUser = {
        id: 2,
        email: oauthProfile.email,
        fullName: oauthProfile.fullName,
        googleId: oauthProfile.providerId,
        isVerified: true,
        role: mockRole,
      };
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);
      securityAuditRepository.create.mockReturnValue({});
      securityAuditRepository.save.mockResolvedValue({});

      // Act
      const result = await service.validateOrCreateOAuthUser(
        'google',
        oauthProfile,
        mockRequest,
      );

      // Assert — new user created with auto-verified flag and buyer role
      expect(result.id).toBe(2);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'oauth@test.com',
          isVerified: true,
          oauthProvider: 'google',
          role: mockRole,
        }),
      );
    });

    it('should throw error when default buyer role not found', async () => {
      // Arrange — no matches, and role lookup returns null
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      roleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.validateOrCreateOAuthUser('google', oauthProfile, mockRequest),
      ).rejects.toThrow('Default role');
    });
  });

  // ─── OAuth: generateOAuthTokens ───────────────────────────────

  describe('generateOAuthTokens', () => {
    /**
     * @description Tests the public wrapper around generateTokens()
     * that also updates lastLoginAt timestamp
     */
    const oauthUser = {
      ...mockUser,
      googleId: 'google123',
      role: mockRole,
    } as any;

    const mockRequest = {
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
    } as any;

    it('should return access and refresh tokens for OAuth user', async () => {
      // Arrange — mock the token generation dependencies
      refreshTokenRepository.create.mockReturnValue({ id: 1 });
      refreshTokenRepository.save.mockResolvedValue({ id: 1 });
      userRepository.save.mockResolvedValue(oauthUser);
      securityAuditRepository.create.mockReturnValue({});
      securityAuditRepository.save.mockResolvedValue({});

      // Act
      const result = await service.generateOAuthTokens(oauthUser, mockRequest);

      // Assert — returns JWT token pair
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should update user lastLoginAt timestamp', async () => {
      // Arrange
      refreshTokenRepository.create.mockReturnValue({ id: 1 });
      refreshTokenRepository.save.mockResolvedValue({ id: 1 });
      userRepository.save.mockResolvedValue(oauthUser);
      securityAuditRepository.create.mockReturnValue({});
      securityAuditRepository.save.mockResolvedValue({});

      // Act
      await service.generateOAuthTokens(oauthUser, mockRequest);

      // Assert — save called with updated lastLoginAt
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });
  });

  // ─── C1: OAuth Code Exchange ──────────────────────────────────

  describe('generateOAuthCode / exchangeOAuthCode', () => {
    const mockTokens = {
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
    };

    /**
     * @description Verifies that generateOAuthCode returns a hex string code
     * that can be subsequently exchanged for the original tokens.
     */
    it('should generate a code and exchange it for tokens', () => {
      const code = service.generateOAuthCode(mockTokens);

      expect(typeof code).toBe('string');
      expect(code.length).toBe(64); // 32 bytes = 64 hex chars

      const result = service.exchangeOAuthCode(code);

      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });

    /**
     * @description Verifies codes are single-use — second exchange attempt throws.
     */
    it('should reject reuse of an already-exchanged code', () => {
      const code = service.generateOAuthCode(mockTokens);
      service.exchangeOAuthCode(code);

      expect(() => service.exchangeOAuthCode(code)).toThrow(
        BadRequestException,
      );
    });

    /**
     * @description Verifies an invalid code throws BadRequestException.
     */
    it('should throw BadRequestException for invalid code', () => {
      expect(() => service.exchangeOAuthCode('invalid_code')).toThrow(
        BadRequestException,
      );
    });

    /**
     * @description Verifies that expired codes are rejected.
     */
    it('should throw BadRequestException for expired code', () => {
      const code = service.generateOAuthCode(mockTokens);

      // Manually expire the code by overwriting expiresAt
      const store = (service as any).oauthCodeStore as Map<string, any>;
      const entry = store.get(code);
      entry.expiresAt = Date.now() - 1000;

      expect(() => service.exchangeOAuthCode(code)).toThrow(
        'OAuth code has expired.',
      );
    });
  });

  // ─── C2: OAuth State CSRF Protection ──────────────────────────

  describe('generateOAuthState / validateOAuthState', () => {
    /**
     * @description Verifies that a freshly generated state passes validation.
     */
    it('should generate a valid state that passes validation', () => {
      const state = service.generateOAuthState();

      expect(typeof state).toBe('string');
      expect(state).toContain('.');

      const isValid = service.validateOAuthState(state);
      expect(isValid).toBe(true);
    });

    /**
     * @description Verifies that a tampered state (modified HMAC) fails validation.
     */
    it('should reject state with tampered HMAC', () => {
      const state = service.generateOAuthState();
      const [timestamp] = state.split('.');
      const tamperedState = `${timestamp}.${'a'.repeat(64)}`;

      const isValid = service.validateOAuthState(tamperedState);
      expect(isValid).toBe(false);
    });

    /**
     * @description Verifies that an expired state (>10 minutes old) is rejected.
     */
    it('should reject expired state (older than 10 minutes)', () => {
      const oldTimestamp = (Date.now() - 11 * 60 * 1000).toString();
      const crypto = require('crypto');
      const secret = jwtService.options?.secret || 'oauth-state-secret';
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(oldTimestamp)
        .digest('hex');
      const expiredState = `${oldTimestamp}.${hmac}`;

      const isValid = service.validateOAuthState(expiredState);
      expect(isValid).toBe(false);
    });

    /**
     * @description Verifies that null/empty/malformed state returns false.
     */
    it('should reject null, empty, or malformed state', () => {
      expect(service.validateOAuthState('')).toBe(false);
      expect(service.validateOAuthState('no-dot-here')).toBe(false);
      expect(service.validateOAuthState('abc.def')).toBe(false);
    });
  });
});
