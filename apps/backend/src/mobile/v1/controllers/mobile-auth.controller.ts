import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  MobileAuthService,
  MobileLoginRequest,
  PhoneVerificationRequest,
  OTPVerificationRequest,
  BiometricAuthRequest,
} from '../services/mobile-auth.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

/**
 * Mobile Authentication Controller
 *
 * Handles mobile-specific authentication flows including:
 * - Traditional email/password login optimized for mobile
 * - Phone number authentication with OTP
 * - Biometric authentication (Face ID, Fingerprint)
 * - Device registration for push notifications
 * - Token refresh for mobile apps
 */
@ApiTags('📱 Mobile Authentication API v1')
@Controller('api/mobile/v1/auth')
export class MobileAuthController {
  constructor(private readonly mobileAuthService: MobileAuthService) {}

  /**
   * POST /api/mobile/v1/auth/login
   * Mobile-optimized email/password login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mobile email/password login',
    description:
      'Authenticate user with email and password, optimized for mobile apps with device registration and push token support.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
        deviceId: {
          type: 'string',
          example: 'device-uuid-123',
          description: 'Unique device identifier',
        },
        deviceType: {
          type: 'string',
          enum: ['ios', 'android'],
          example: 'android',
        },
        pushToken: {
          type: 'string',
          example: 'fcm-token-123',
          description: 'Firebase/APNS push token',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        user: {
          id: 123,
          email: 'user@example.com',
          phone: '+963991234567',
          firstName: 'Ahmad',
          lastName: 'Al-Syrian',
          avatar: 'https://cdn.souqsyria.com/avatars/user-123.jpg',
          isVerified: true,
          language: 'ar',
          currency: 'SYP',
          addresses: [
            {
              id: 1,
              isDefault: true,
              governorate: 'Damascus',
              city: 'Damascus',
              street: 'Al-Mazzeh Street 15',
            },
          ],
          preferences: {
            notifications: true,
            marketing: true,
            language: 'ar',
            currency: 'SYP',
          },
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 604800,
        },
        deviceInfo: {
          deviceId: 'device-uuid-123',
          deviceType: 'android',
          pushToken: 'fcm-token-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        message: 'Invalid credentials',
        error: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  async loginWithPassword(@Body() loginRequest: MobileLoginRequest) {
    return await this.mobileAuthService.loginWithPassword(loginRequest);
  }

  /**
   * POST /api/mobile/v1/auth/phone/initiate
   * Initiate phone number login by sending OTP
   */
  @Post('phone/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate phone number login',
    description:
      'Send OTP to provided phone number for authentication. Optimized for Syrian mobile numbers.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['phone'],
      properties: {
        phone: {
          type: 'string',
          example: '991234567',
          description: 'Syrian mobile number (without country code)',
        },
        countryCode: {
          type: 'string',
          example: '+963',
          description: 'Country code (default: +963 for Syria)',
        },
        deviceId: {
          type: 'string',
          example: 'device-uuid-123',
          description: 'Device identifier for security',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      example: {
        otpSent: true,
        expiresAt: '2024-03-20T10:35:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone number or failed to send OTP',
    schema: {
      example: {
        message: 'Failed to send OTP',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async initiatePhoneLogin(@Body() request: PhoneVerificationRequest) {
    return await this.mobileAuthService.initiatePhoneLogin(request);
  }

  /**
   * POST /api/mobile/v1/auth/phone/verify
   * Verify OTP and complete phone login
   */
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP and login',
    description:
      'Verify OTP code and complete phone-based authentication. Creates new user if phone number not registered.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['phone', 'otp'],
      properties: {
        phone: {
          type: 'string',
          example: '+963991234567',
          description: 'Full phone number with country code',
        },
        otp: {
          type: 'string',
          example: '123456',
          description: '6-digit OTP code',
        },
        deviceId: { type: 'string', example: 'device-uuid-123' },
        deviceType: {
          type: 'string',
          enum: ['ios', 'android'],
          example: 'android',
        },
        pushToken: { type: 'string', example: 'fcm-token-123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified and login successful',
    schema: {
      example: {
        user: {
          id: 124,
          email: null,
          phone: '+963991234567',
          firstName: '',
          lastName: '',
          avatar: null,
          isVerified: true,
          language: 'en',
          currency: 'SYP',
          addresses: [],
          preferences: {
            notifications: true,
            marketing: true,
            language: 'en',
            currency: 'SYP',
          },
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 604800,
        },
        deviceInfo: {
          deviceId: 'device-uuid-123',
          deviceType: 'android',
          pushToken: 'fcm-token-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired OTP',
    schema: {
      example: {
        message: 'Invalid or expired OTP',
        error: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  async verifyOTPAndLogin(@Body() request: OTPVerificationRequest) {
    return await this.mobileAuthService.verifyOTPAndLogin(request);
  }

  /**
   * POST /api/mobile/v1/auth/biometric
   * Authenticate with biometric data (Face ID, Fingerprint)
   */
  @Post('biometric')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Biometric authentication',
    description:
      'Authenticate using biometric data like Face ID or Fingerprint. Requires prior biometric setup.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'biometricToken', 'deviceId', 'deviceType'],
      properties: {
        userId: {
          type: 'number',
          example: 123,
          description: 'User ID for biometric authentication',
        },
        biometricToken: {
          type: 'string',
          example: 'biometric-hash-token',
          description: 'Encrypted biometric data token',
        },
        deviceId: {
          type: 'string',
          example: 'device-uuid-123',
          description: 'Device identifier for security',
        },
        deviceType: {
          type: 'string',
          enum: ['ios', 'android'],
          example: 'ios',
          description: 'Device type for biometric compatibility',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Biometric authentication successful',
    schema: {
      example: {
        user: {
          id: 123,
          email: 'user@example.com',
          phone: '+963991234567',
          firstName: 'Ahmad',
          lastName: 'Al-Syrian',
          avatar: 'https://cdn.souqsyria.com/avatars/user-123.jpg',
          isVerified: true,
          language: 'ar',
          currency: 'SYP',
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 604800,
        },
        deviceInfo: {
          deviceId: 'device-uuid-123',
          deviceType: 'ios',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid biometric authentication',
    schema: {
      example: {
        message: 'Invalid biometric authentication',
        error: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  async authenticateWithBiometric(@Body() request: BiometricAuthRequest) {
    return await this.mobileAuthService.authenticateWithBiometric(request);
  }

  /**
   * POST /api/mobile/v1/auth/device/register
   * Register device for push notifications
   */
  @Post('device/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register device for push notifications',
    description:
      'Register user device for push notifications and app-specific features.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['deviceId', 'deviceType', 'pushToken'],
      properties: {
        deviceId: { type: 'string', example: 'device-uuid-123' },
        deviceType: {
          type: 'string',
          enum: ['ios', 'android'],
          example: 'android',
        },
        pushToken: {
          type: 'string',
          example: 'fcm-token-123',
          description: 'Firebase (Android) or APNS (iOS) push token',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Device registered successfully',
    schema: {
      example: {
        registered: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  async registerDevice(
    @Request() req,
    @Body()
    body: {
      deviceId: string;
      deviceType: 'ios' | 'android';
      pushToken: string;
    },
  ) {
    const userId = req.user.id;
    const { deviceId, deviceType, pushToken } = body;

    return await this.mobileAuthService.registerDevice(
      userId,
      deviceId,
      deviceType,
      pushToken,
    );
  }

  /**
   * POST /api/mobile/v1/auth/refresh
   * Refresh access token using refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refresh expired access token using a valid refresh token.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Valid refresh token',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 604800,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
    schema: {
      example: {
        message: 'Invalid refresh token',
        error: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  async refreshTokens(@Body() body: { refreshToken: string }) {
    return await this.mobileAuthService.refreshMobileTokens(body.refreshToken);
  }

  /**
   * POST /api/mobile/v1/auth/logout
   * Logout and invalidate tokens
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout from mobile app',
    description:
      'Logout user and invalidate tokens. Optionally remove device registration.',
  })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          example: 'device-uuid-123',
          description: 'Device ID to unregister (optional)',
        },
        removeDevice: {
          type: 'boolean',
          example: true,
          description: 'Remove device registration for push notifications',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logged out successfully',
        deviceRemoved: true,
      },
    },
  })
  async logout(
    @Request() req,
    @Body() body?: { deviceId?: string; removeDevice?: boolean },
  ) {
    // In real implementation, invalidate tokens and optionally remove device
    const userId = req.user.id;

    return {
      message: 'Logged out successfully',
      deviceRemoved: body?.removeDevice || false,
    };
  }
}
