/**
 * Unit tests for AuthController
 *
 * @description Tests all auth controller endpoints including request delegation,
 * response shaping, guard usage, and error propagation.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockRequest = {
    ip: '192.168.1.1',
    headers: { authorization: 'Bearer mock.jwt.token', 'user-agent': 'Test' },
  } as any;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyOtp: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      resendOtp: jest.fn(),
      deleteAccount: jest.fn(),
      exchangeOAuthCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: UsersService,
          useValue: { findOne: jest.fn(), create: jest.fn() },
        },
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:4200') },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── POST /auth/register ───────────────────────────────────────

  describe('register', () => {
    const registerDto = {
      email: 'user@souqsyria.com',
      password: 'Secure123',
    };

    it('should call authService.register and return result', async () => {
      const expected = {
        message: 'Registration successful',
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: 1, email: 'user@souqsyria.com' },
      };
      authService.register!.mockResolvedValue(expected as any);

      const result = await controller.register(registerDto as any, mockRequest);

      expect(authService.register).toHaveBeenCalledWith(registerDto, mockRequest);
      expect(result).toEqual(expected);
    });

    it('should propagate BadRequestException for duplicate email', async () => {
      authService.register!.mockRejectedValue(
        new BadRequestException('Email already registered'),
      );

      await expect(
        controller.register(registerDto as any, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── POST /auth/verify-otp ─────────────────────────────────────

  describe('verifyOtp', () => {
    const verifyOtpDto = { email: 'user@souqsyria.com', otpCode: '123456' };

    it('should call authService.verifyOtp and return success message', async () => {
      authService.verifyOtp!.mockResolvedValue(undefined as any);

      const result = await controller.verifyOtp(verifyOtpDto as any);

      expect(authService.verifyOtp).toHaveBeenCalledWith(verifyOtpDto);
      expect(result).toEqual({ message: 'Account verified successfully.' });
    });

    it('should propagate BadRequestException for invalid OTP', async () => {
      authService.verifyOtp!.mockRejectedValue(
        new BadRequestException('Invalid OTP code.'),
      );

      await expect(
        controller.verifyOtp(verifyOtpDto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── POST /auth/login ──────────────────────────────────────────

  describe('login', () => {
    const loginDto = {
      email: 'user@souqsyria.com',
      password: 'Secure123',
      rememberMe: true,
    };

    it('should return tokens with rememberMe flag on success', async () => {
      authService.login!.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      } as any);

      const result = await controller.login(loginDto as any, mockRequest);

      expect(authService.login).toHaveBeenCalledWith(loginDto, mockRequest);
      expect(result).toEqual({
        message: 'Login successful.',
        accessToken: 'at',
        refreshToken: 'rt',
        rememberMe: true,
      });
    });

    it('should set rememberMe to false when not provided', async () => {
      const dtoWithoutRemember = { email: 'u@s.com', password: 'P' };
      authService.login!.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      } as any);

      const result = await controller.login(dtoWithoutRemember as any, mockRequest);

      expect(result.rememberMe).toBe(false);
    });

    it('should propagate UnauthorizedException for invalid credentials', async () => {
      authService.login!.mockRejectedValue(
        new UnauthorizedException('Invalid credentials.'),
      );

      await expect(
        controller.login(loginDto as any, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── POST /auth/forgot-password ────────────────────────────────

  describe('forgotPassword', () => {
    it('should delegate to authService.forgotPassword', async () => {
      const dto = { email: 'user@souqsyria.com' };
      authService.forgotPassword!.mockResolvedValue({
        message: 'If the email exists, reset instructions have been sent.',
      } as any);

      const result = await controller.forgotPassword(dto as any);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('reset instructions');
    });
  });

  // ─── POST /auth/reset-password ─────────────────────────────────

  describe('resetPassword', () => {
    const dto = { resetToken: 'token123', newPassword: 'NewPass1' };

    it('should delegate to authService.resetPassword', async () => {
      authService.resetPassword!.mockResolvedValue({
        message: 'Password has been successfully reset.',
      } as any);

      const result = await controller.resetPassword(dto as any);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('successfully reset');
    });

    it('should propagate BadRequestException for expired token', async () => {
      authService.resetPassword!.mockRejectedValue(
        new BadRequestException('Invalid or expired reset token'),
      );

      await expect(controller.resetPassword(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── PUT /auth/change-password ─────────────────────────────────

  describe('changePassword', () => {
    const dto = { currentPassword: 'Old123', newPassword: 'New456' };
    const user = { id: 1 };

    it('should delegate to authService.changePassword with user id', async () => {
      authService.changePassword!.mockResolvedValue({
        message: 'Password successfully changed.',
      } as any);

      const result = await controller.changePassword(user as any, dto as any);

      expect(authService.changePassword).toHaveBeenCalledWith(1, dto);
      expect(result.message).toContain('successfully changed');
    });
  });

  // ─── POST /auth/logout ─────────────────────────────────────────

  describe('logout', () => {
    const user = { id: 1 };

    it('should extract token from header and delegate to authService', async () => {
      authService.logout!.mockResolvedValue({
        message: 'Logout successful.',
      } as any);

      const result = await controller.logout(user as any, mockRequest, {} as any);

      expect(authService.logout).toHaveBeenCalledWith(
        1,
        'mock.jwt.token',
        '192.168.1.1',
        {},
      );
      expect(result.message).toContain('Logout successful');
    });

    it('should throw BadRequestException when no token in header', async () => {
      const reqNoToken = { ...mockRequest, headers: {} };

      await expect(
        controller.logout(user as any, reqNoToken, {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── POST /auth/refresh-token ──────────────────────────────────

  describe('refreshToken', () => {
    it('should delegate to authService.refreshToken', async () => {
      const dto = { token: 'refresh-token-123' };
      authService.refreshToken!.mockResolvedValue({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
        message: 'Token refreshed successfully.',
      } as any);

      const result = await controller.refreshToken(dto as any);

      expect(authService.refreshToken).toHaveBeenCalledWith(dto);
      expect(result.accessToken).toBe('new-at');
    });

    it('should propagate UnauthorizedException for expired refresh token', async () => {
      authService.refreshToken!.mockRejectedValue(
        new UnauthorizedException('Token expired'),
      );

      await expect(
        controller.refreshToken({ token: 'expired' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── POST /auth/resend-otp ─────────────────────────────────────

  describe('resendOtp', () => {
    it('should delegate to authService.resendOtp', async () => {
      const dto = { email: 'user@souqsyria.com' };
      authService.resendOtp!.mockResolvedValue({
        message: 'New verification code sent.',
      } as any);

      const result = await controller.resendOtp(dto as any);

      expect(authService.resendOtp).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('verification code');
    });
  });

  // ─── DELETE /auth/account ──────────────────────────────────────

  describe('deleteAccount', () => {
    const user = { id: 1 };
    const dto = { password: 'Secure123', reason: 'Leaving' };

    it('should delegate to authService.deleteAccount', async () => {
      authService.deleteAccount!.mockResolvedValue({
        message: 'Account successfully deleted.',
      } as any);

      const result = await controller.deleteAccount(user as any, mockRequest, dto as any);

      expect(authService.deleteAccount).toHaveBeenCalledWith(
        1,
        dto,
        '192.168.1.1',
      );
      expect(result.message).toContain('successfully deleted');
    });
  });

  // ─── POST /auth/oauth/exchange (C1 fix) ─────────────────────

  describe('exchangeOAuthCode', () => {
    it('should exchange code for tokens', async () => {
      const tokens = { accessToken: 'at', refreshToken: 'rt' };
      authService.exchangeOAuthCode!.mockReturnValue(tokens);

      const result = await controller.exchangeOAuthCode({ code: 'valid-code' });

      expect(authService.exchangeOAuthCode).toHaveBeenCalledWith('valid-code');
      expect(result).toEqual(tokens);
    });

    it('should throw BadRequestException when code is missing', async () => {
      await expect(
        controller.exchangeOAuthCode({ code: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate BadRequestException for invalid code', async () => {
      authService.exchangeOAuthCode!.mockImplementation(() => {
        throw new BadRequestException('Invalid or expired OAuth code.');
      });

      await expect(
        controller.exchangeOAuthCode({ code: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
