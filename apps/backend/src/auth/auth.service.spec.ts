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
import { EmailService } from './service/email.service';
import * as bcrypt from 'bcrypt';

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
    isResetTokenValid: jest.fn().mockReturnValue(true),
    resetFailedAttempts: jest.fn(),
    isAccountLocked: jest.fn().mockReturnValue(false),
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

    jwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      verify: jest.fn().mockReturnValue({ sub: 1, email: 'test@souqsyria.com', exp: Math.floor(Date.now() / 1000) + 3600 }),
      decode: jest.fn().mockReturnValue({ sub: 1, email: 'test@souqsyria.com', exp: Math.floor(Date.now() / 1000) + 3600 }),
    };

    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
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
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: EmailService,
          useValue: emailService,
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
      // Mock bcrypt.compare
      jest.spyOn(bcrypt, 'compare').mockImplementation((password: string) => {
        return Promise.resolve(password === 'correctPassword123');
      });
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

      // Act & Assert
      await expect(service.login(wrongPasswordDto, mockRequest)).rejects.toThrow(
        'Invalid credentials.',
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
      expect(result.message).toContain('reset instructions');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
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
      // Arrange
      const userWithResetToken = {
        ...mockUser,
        resetPasswordToken: 'valid.reset.token',
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        isResetTokenValid: jest.fn().mockReturnValue(true),
        resetFailedAttempts: jest.fn(),
      };
      userRepository.findOne.mockResolvedValue(userWithResetToken);
      userRepository.save.mockResolvedValue(userWithResetToken);
      jwtService.verify.mockReturnValue({ sub: 1, email: 'test@souqsyria.com' });

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

    it('should successfully refresh token', async () => {
      // Arrange
      tokenBlacklistRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);
      tokenBlacklistRepository.create.mockReturnValue({ id: 1 });
      tokenBlacklistRepository.save.mockResolvedValue({ id: 1 });
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshToken(refreshDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result.message).toContain('refreshed');
    });

    it('should throw UnauthorizedException for blacklisted token', async () => {
      // Arrange
      tokenBlacklistRepository.findOne.mockResolvedValue({ id: 1 }); // Token is blacklisted

      // Act & Assert
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        'invalidated',
      );
    });

    it('should throw UnauthorizedException for deleted user', async () => {
      // Arrange
      tokenBlacklistRepository.findOne.mockResolvedValue(null);
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      userRepository.findOne.mockResolvedValue(deletedUser);

      // Act & Assert
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for banned user', async () => {
      // Arrange
      tokenBlacklistRepository.findOne.mockResolvedValue(null);
      const bannedUser = { ...mockUser, isBanned: true };
      userRepository.findOne.mockResolvedValue(bannedUser);

      // Act & Assert
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        'banned',
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act & Assert
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        'expired',
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

  describe('handleGoogleUser', () => {
    const googleProfile = {
      googleId: 'google123',
      email: 'google@test.com',
      firstName: 'Google',
      lastName: 'User',
      fullName: 'Google User',
      profilePictureUrl: 'https://example.com/pic.jpg',
      accessToken: 'google_access_token',
      refreshToken: 'google_refresh_token',
    };

    const mockRequest = {
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
    } as any;

    it('should login existing user by Google ID', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValueOnce({ ...mockUser, googleId: 'google123' });
      refreshTokenRepository.create.mockReturnValue({ id: 1 });
      refreshTokenRepository.save.mockResolvedValue({ id: 1 });
      loginLogRepository.save.mockResolvedValue({ id: 1 });
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.handleGoogleUser(googleProfile, mockRequest);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.isNewUser).toBe(false);
    });

    it('should link account when email exists but no Google ID', async () => {
      // Arrange
      userRepository.findOne
        .mockResolvedValueOnce(null) // No user by Google ID
        .mockResolvedValueOnce(mockUser); // User found by email
      userRepository.save.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue({ id: 1 });
      refreshTokenRepository.save.mockResolvedValue({ id: 1 });
      loginLogRepository.save.mockResolvedValue({ id: 1 });

      // Act
      const result = await service.handleGoogleUser(googleProfile, mockRequest);

      // Assert
      expect(result.isNewUser).toBe(false);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should create new user when no existing account', async () => {
      // Arrange
      userRepository.findOne
        .mockResolvedValueOnce(null) // No user by Google ID
        .mockResolvedValueOnce(null); // No user by email
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue({ id: 2, ...googleProfile, role: mockRole });
      userRepository.save.mockResolvedValue({ id: 2, ...googleProfile, role: mockRole });
      refreshTokenRepository.create.mockReturnValue({ id: 1 });
      refreshTokenRepository.save.mockResolvedValue({ id: 1 });
      loginLogRepository.save.mockResolvedValue({ id: 1 });

      // Act
      const result = await service.handleGoogleUser(googleProfile, mockRequest);

      // Assert
      expect(result.isNewUser).toBe(true);
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for banned Google user', async () => {
      // Arrange
      const bannedUser = { ...mockUser, googleId: 'google123', isBanned: true };
      userRepository.findOne.mockResolvedValueOnce(bannedUser);

      // Act & Assert
      await expect(
        service.handleGoogleUser(googleProfile, mockRequest),
      ).rejects.toThrow('banned');
    });

    it('should throw error when default role not found', async () => {
      // Arrange
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      roleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.handleGoogleUser(googleProfile, mockRequest),
      ).rejects.toThrow('Default role');
    });
  });

  describe('handleFacebookUser', () => {
    const facebookProfile = {
      facebookId: 'fb123',
      email: 'facebook@test.com',
      firstName: 'Facebook',
      lastName: 'User',
      fullName: 'Facebook User',
      profilePictureUrl: 'https://example.com/fbpic.jpg',
      accessToken: 'fb_access_token',
      refreshToken: 'fb_refresh_token',
    };

    const mockRequest = {
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
    } as any;

    it('should login existing user by Facebook ID', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValueOnce({ ...mockUser, facebookId: 'fb123' });
      refreshTokenRepository.create.mockReturnValue({ id: 1 });
      refreshTokenRepository.save.mockResolvedValue({ id: 1 });
      loginLogRepository.save.mockResolvedValue({ id: 1 });
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.handleFacebookUser(facebookProfile, mockRequest);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result.isNewUser).toBe(false);
    });

    it('should create new user when no existing Facebook account', async () => {
      // Arrange
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue({ id: 2, ...facebookProfile, role: mockRole });
      userRepository.save.mockResolvedValue({ id: 2, ...facebookProfile, role: mockRole });
      refreshTokenRepository.create.mockReturnValue({ id: 1 });
      refreshTokenRepository.save.mockResolvedValue({ id: 1 });
      loginLogRepository.save.mockResolvedValue({ id: 1 });

      // Act
      const result = await service.handleFacebookUser(facebookProfile, mockRequest);

      // Assert
      expect(result.isNewUser).toBe(true);
    });
  });
});
