import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  Length,
  IsPhoneNumber,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Mobile Login Request DTO
 *
 * Used for email/password login from mobile applications
 */
export class MobileLoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @Length(6, 50)
  password: string;

  @ApiPropertyOptional({
    example: 'device-uuid-123',
    description: 'Unique device identifier',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    enum: ['ios', 'android'],
    example: 'android',
    description: 'Mobile device type',
  })
  @IsOptional()
  @IsEnum(['ios', 'android'])
  deviceType?: 'ios' | 'android';

  @ApiPropertyOptional({
    example: 'fcm-token-123',
    description: 'Firebase/APNS push token',
  })
  @IsOptional()
  @IsString()
  pushToken?: string;

  @ApiPropertyOptional({
    example: 'Samsung Galaxy S24',
    description: 'Device name/model',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    example: '1.2.3',
    description: 'Mobile app version',
  })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

/**
 * Phone Verification Request DTO
 *
 * Used to initiate phone number verification with OTP
 */
export class PhoneVerificationDto {
  @ApiProperty({
    example: '991234567',
    description: 'Syrian mobile number (without country code)',
  })
  @IsString()
  @Length(9, 15)
  phone: string;

  @ApiPropertyOptional({
    example: '+963',
    description: 'Country code (default: +963 for Syria)',
    default: '+963',
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({
    example: 'device-uuid-123',
    description: 'Device identifier for security',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

/**
 * OTP Verification Request DTO
 *
 * Used to verify OTP and complete phone login
 */
export class OTPVerificationDto {
  @ApiProperty({
    example: '+963991234567',
    description: 'Full phone number with country code',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code',
  })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiPropertyOptional({
    example: 'device-uuid-123',
    description: 'Device identifier',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    enum: ['ios', 'android'],
    example: 'android',
    description: 'Device type',
  })
  @IsOptional()
  @IsEnum(['ios', 'android'])
  deviceType?: 'ios' | 'android';

  @ApiPropertyOptional({
    example: 'fcm-token-123',
    description: 'Push notification token',
  })
  @IsOptional()
  @IsString()
  pushToken?: string;

  @ApiPropertyOptional({
    example: 'Samsung Galaxy S24',
    description: 'Device name',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    example: '1.2.3',
    description: 'App version',
  })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

/**
 * Biometric Authentication Request DTO
 *
 * Used for biometric authentication (Face ID, Fingerprint)
 */
export class BiometricAuthDto {
  @ApiProperty({
    example: 123,
    description: 'User ID for biometric authentication',
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    example: 'biometric-hash-token',
    description: 'Encrypted biometric data token',
  })
  @IsString()
  biometricToken: string;

  @ApiProperty({
    example: 'device-uuid-123',
    description: 'Device identifier for security',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    enum: ['ios', 'android'],
    example: 'ios',
    description: 'Device type for biometric compatibility',
  })
  @IsEnum(['ios', 'android'])
  deviceType: 'ios' | 'android';
}

/**
 * Device Registration DTO
 *
 * Used to register device for push notifications
 */
export class DeviceRegistrationDto {
  @ApiProperty({
    example: 'device-uuid-123',
    description: 'Unique device identifier',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    enum: ['ios', 'android'],
    example: 'android',
    description: 'Device type',
  })
  @IsEnum(['ios', 'android'])
  deviceType: 'ios' | 'android';

  @ApiProperty({
    example: 'fcm-token-123',
    description: 'Firebase (Android) or APNS (iOS) push token',
  })
  @IsString()
  pushToken: string;

  @ApiPropertyOptional({
    example: 'Samsung Galaxy S24',
    description: 'Device name/model',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    example: '1.2.3',
    description: 'Mobile app version',
  })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional({
    example: 'Android 14',
    description: 'Device OS version',
  })
  @IsOptional()
  @IsString()
  osVersion?: string;
}

/**
 * Token Refresh Request DTO
 *
 * Used to refresh access tokens
 */
export class TokenRefreshDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Valid refresh token',
  })
  @IsString()
  refreshToken: string;
}

/**
 * Logout Request DTO
 *
 * Used for mobile app logout
 */
export class MobileLogoutDto {
  @ApiPropertyOptional({
    example: 'device-uuid-123',
    description: 'Device ID to unregister (optional)',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Remove device registration for push notifications',
  })
  @IsOptional()
  @IsBoolean()
  removeDevice?: boolean;
}

/**
 * Mobile Authentication Response DTO
 *
 * Standardized response for all mobile authentication flows
 */
export class MobileAuthResponseDto {
  @ApiProperty({
    description: 'User profile optimized for mobile',
    example: {
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
  })
  user: {
    id: number;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isVerified: boolean;
    language: 'en' | 'ar';
    currency: 'SYP' | 'USD' | 'EUR';
    addresses?: Array<{
      id: number;
      isDefault: boolean;
      governorate: string;
      city: string;
      street: string;
    }>;
    preferences?: {
      notifications: boolean;
      marketing: boolean;
      language: 'en' | 'ar';
      currency: 'SYP' | 'USD' | 'EUR';
    };
  };

  @ApiProperty({
    description: 'JWT tokens for authentication',
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresIn: 604800,
    },
  })
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };

  @ApiPropertyOptional({
    description: 'Device information',
    example: {
      deviceId: 'device-uuid-123',
      deviceType: 'android',
      pushToken: 'fcm-token-123',
    },
  })
  deviceInfo?: {
    deviceId: string;
    deviceType: 'ios' | 'android';
    pushToken?: string;
  };
}
