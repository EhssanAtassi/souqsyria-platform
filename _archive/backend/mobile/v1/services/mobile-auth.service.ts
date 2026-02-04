import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../users/entities/user.entity';
import { MobileDeviceEntity } from '../../entities/mobile-device.entity';
import { MobileOTPEntity } from '../../entities/mobile-otp.entity';
import { MobileSessionEntity } from '../../entities/mobile-session.entity';

/**
 * Mobile authentication response
 */
export interface MobileAuthResponse {
  user: MobileUserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  deviceInfo?: {
    deviceId: string;
    deviceType: 'ios' | 'android';
    pushToken?: string;
  };
}

/**
 * Mobile user profile (lightweight)
 */
export interface MobileUserProfile {
  id: number;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isVerified: boolean;
  language: 'en' | 'ar';
  currency: 'SYP' | 'USD' | 'EUR';
  addresses?: {
    id: number;
    isDefault: boolean;
    governorate: string;
    city: string;
    street: string;
  }[];
  preferences?: {
    notifications: boolean;
    marketing: boolean;
    language: 'en' | 'ar';
    currency: 'SYP' | 'USD' | 'EUR';
  };
}

/**
 * Mobile login request
 */
export interface MobileLoginRequest {
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
  deviceId?: string;
  deviceType?: 'ios' | 'android';
  pushToken?: string;
}

/**
 * Phone verification request
 */
export interface PhoneVerificationRequest {
  phone: string;
  countryCode?: string;
  deviceId?: string;
}

/**
 * OTP verification request
 */
export interface OTPVerificationRequest {
  phone: string;
  otp: string;
  deviceId?: string;
  deviceType?: 'ios' | 'android';
  pushToken?: string;
}

/**
 * Biometric authentication request
 */
export interface BiometricAuthRequest {
  userId: number;
  biometricToken: string;
  deviceId: string;
  deviceType: 'ios' | 'android';
}

/**
 * Mobile Authentication Service
 *
 * Handles mobile-specific authentication flows including:
 * - Phone number authentication with OTP
 * - Biometric authentication (Face ID, Fingerprint)
 * - Social login integration
 * - Device registration and push tokens
 * - Lightweight user profiles for mobile apps
 */
@Injectable()
export class MobileAuthService {
  private readonly logger = new Logger(MobileAuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MobileDeviceEntity)
    private readonly mobileDeviceRepository: Repository<MobileDeviceEntity>,
    @InjectRepository(MobileOTPEntity)
    private readonly mobileOTPRepository: Repository<MobileOTPEntity>,
    @InjectRepository(MobileSessionEntity)
    private readonly mobileSessionRepository: Repository<MobileSessionEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticate user with email/password for mobile
   * Returns mobile-optimized user profile and tokens
   */
  async loginWithPassword(
    loginRequest: MobileLoginRequest,
  ): Promise<MobileAuthResponse> {
    try {
      const { email, password, deviceId, deviceType, pushToken } = loginRequest;

      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }

      // Find user by email
      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.addresses', 'addresses')
        .where('user.email = :email', { email })
        .andWhere('user.isActive = :isActive', { isActive: true })
        .getOne();

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password (simplified - in real implementation use bcrypt)
      const isPasswordValid = await this.verifyPassword(
        password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update device info if provided
      if (deviceId) {
        await this.updateUserDeviceInfo(
          user.id,
          deviceId,
          deviceType,
          pushToken,
        );
      }

      // Generate tokens
      const tokens = await this.generateMobileTokens(user);

      // Transform to mobile user profile
      const mobileProfile = this.transformToMobileProfile(user);

      this.logger.log(`Mobile login successful for user: ${user.email}`);

      return {
        user: mobileProfile,
        tokens,
        deviceInfo: deviceId
          ? {
              deviceId,
              deviceType: deviceType || 'android',
              pushToken,
            }
          : undefined,
      };
    } catch (error: unknown) {
      this.logger.error('Mobile login failed', error);
      throw error;
    }
  }

  /**
   * Initiate phone number login
   * Sends OTP to provided phone number
   */
  async initiatePhoneLogin(
    request: PhoneVerificationRequest,
  ): Promise<{ otpSent: boolean; expiresAt: Date }> {
    try {
      const { phone, countryCode = '+963' } = request; // Default to Syria

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phone, countryCode);

      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // In real implementation, save OTP to database and send via SMS
      await this.saveOTP(formattedPhone, otp, expiresAt);
      await this.sendOTPSMS(formattedPhone, otp);

      this.logger.log(`OTP sent to phone: ${formattedPhone}`);

      return {
        otpSent: true,
        expiresAt,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to initiate phone login', error);
      throw new BadRequestException('Failed to send OTP');
    }
  }

  /**
   * Verify OTP and complete phone login
   */
  async verifyOTPAndLogin(
    request: OTPVerificationRequest,
  ): Promise<MobileAuthResponse> {
    try {
      const { phone, otp, deviceId, deviceType, pushToken } = request;

      // Verify OTP
      const isOTPValid = await this.verifyOTP(phone, otp);
      if (!isOTPValid) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      // Find or create user by phone
      let user = await this.userRepository.findOne({
        where: { phone },
        relations: ['addresses'],
      });

      if (!user) {
        // Create new user for phone login
        user = await this.createUserFromPhone(phone);
      }

      // Update device info
      if (deviceId) {
        await this.updateUserDeviceInfo(
          user.id,
          deviceId,
          deviceType,
          pushToken,
        );
      }

      // Generate tokens
      const tokens = await this.generateMobileTokens(user);

      // Transform to mobile profile
      const mobileProfile = this.transformToMobileProfile(user);

      // Clear OTP
      await this.clearOTP(phone);

      this.logger.log(`Phone login successful for: ${phone}`);

      return {
        user: mobileProfile,
        tokens,
        deviceInfo: deviceId
          ? {
              deviceId,
              deviceType: deviceType || 'android',
              pushToken,
            }
          : undefined,
      };
    } catch (error: unknown) {
      this.logger.error('OTP verification failed', error);
      throw error;
    }
  }

  /**
   * Authenticate with biometric token (Face ID, Fingerprint)
   */
  async authenticateWithBiometric(
    request: BiometricAuthRequest,
  ): Promise<MobileAuthResponse> {
    try {
      const { userId, biometricToken, deviceId, deviceType } = request;

      // Verify biometric token
      const isTokenValid = await this.verifyBiometricToken(
        userId,
        biometricToken,
        deviceId,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid biometric authentication');
      }

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['addresses'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate tokens
      const tokens = await this.generateMobileTokens(user);

      // Transform to mobile profile
      const mobileProfile = this.transformToMobileProfile(user);

      this.logger.log(`Biometric login successful for user ID: ${userId}`);

      return {
        user: mobileProfile,
        tokens,
        deviceInfo: {
          deviceId,
          deviceType,
        },
      };
    } catch (error: unknown) {
      this.logger.error('Biometric authentication failed', error);
      throw error;
    }
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(
    userId: number,
    deviceId: string,
    deviceType: 'ios' | 'android',
    pushToken: string,
  ): Promise<{ registered: boolean }> {
    try {
      await this.updateUserDeviceInfo(userId, deviceId, deviceType, pushToken);

      this.logger.log(`Device registered for user ${userId}: ${deviceId}`);

      return { registered: true };
    } catch (error: unknown) {
      this.logger.error('Device registration failed', error);
      throw new BadRequestException('Failed to register device');
    }
  }

  /**
   * Refresh mobile tokens
   */
  async refreshMobileTokens(
    refreshToken: string,
  ): Promise<{ tokens: MobileAuthResponse['tokens'] }> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateMobileTokens(user);

      return { tokens };
    } catch (error: unknown) {
      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Transform user entity to mobile-optimized profile
   */
  private transformToMobileProfile(user: any): MobileUserProfile {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      avatar: user.avatar,
      isVerified: user.isEmailVerified || user.isPhoneVerified || false,
      language: user.preferredLanguage || 'en',
      currency: user.preferredCurrency || 'SYP',
      addresses:
        user.addresses?.map((addr) => ({
          id: addr.id,
          isDefault: addr.isDefault || false,
          governorate: addr.governorate || '',
          city: addr.city || '',
          street: addr.street || '',
        })) || [],
      preferences: {
        notifications: user.notificationsEnabled !== false,
        marketing: user.marketingEnabled !== false,
        language: user.preferredLanguage || 'en',
        currency: user.preferredCurrency || 'SYP',
      },
    };
  }

  /**
   * Generate JWT tokens for mobile
   */
  private async generateMobileTokens(
    user: User,
  ): Promise<MobileAuthResponse['tokens']> {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      type: 'mobile',
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' }); // 7 days for mobile
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' }); // 30 days

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  /**
   * Verify password using bcrypt
   */
  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error: unknown) {
      this.logger.error('Password verification error', error);
      return false;
    }
  }

  /**
   * Format phone number with country code
   */
  private formatPhoneNumber(phone: string, countryCode: string): string {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Add country code if not present
    if (!cleanPhone.startsWith(countryCode.replace('+', ''))) {
      return `${countryCode}${cleanPhone}`;
    }

    return `+${cleanPhone}`;
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Save OTP to database
   */
  private async saveOTP(
    phone: string,
    otp: string,
    expiresAt: Date,
    deviceId?: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      // Remove any existing OTPs for this phone
      await this.mobileOTPRepository.delete({ phone });

      // Create new OTP record
      const otpEntity = this.mobileOTPRepository.create({
        phone,
        otp,
        expiresAt,
        deviceId,
        ipAddress,
      });

      await this.mobileOTPRepository.save(otpEntity);
      this.logger.log(`OTP saved for ${phone} (expires: ${expiresAt})`);
    } catch (error: unknown) {
      this.logger.error('Failed to save OTP', error);
      throw new BadRequestException('Failed to save OTP');
    }
  }

  /**
   * Send OTP via SMS (simplified implementation)
   */
  private async sendOTPSMS(phone: string, otp: string): Promise<void> {
    // In real implementation, integrate with SMS service (Twilio, etc.)
    this.logger.log(`Sending OTP SMS to ${phone}: ${otp}`);
  }

  /**
   * Verify OTP against database
   */
  private async verifyOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const otpEntity = await this.mobileOTPRepository.findOne({
        where: { phone, otp, verified: false },
      });

      if (!otpEntity) {
        return false;
      }

      // Check if OTP is still valid
      if (!otpEntity.isValid()) {
        return false;
      }

      // Increment attempt count
      otpEntity.incrementAttempts();

      // If OTP matches, mark as verified
      if (otpEntity.otp === otp) {
        otpEntity.markAsVerified();
        await this.mobileOTPRepository.save(otpEntity);
        return true;
      } else {
        await this.mobileOTPRepository.save(otpEntity);
        return false;
      }
    } catch (error: unknown) {
      this.logger.error('OTP verification error', error);
      return false;
    }
  }

  /**
   * Clear OTP after successful verification
   */
  private async clearOTP(phone: string): Promise<void> {
    try {
      await this.mobileOTPRepository.delete({ phone });
      this.logger.log(`Cleared OTP for ${phone}`);
    } catch (error: unknown) {
      this.logger.error('Failed to clear OTP', error);
    }
  }

  /**
   * Create user from phone login
   */
  private async createUserFromPhone(phone: string): Promise<User> {
    const user = this.userRepository.create({
      phone,
      isVerified: true,
    });

    return await this.userRepository.save(user);
  }

  /**
   * Update user device information
   */
  private async updateUserDeviceInfo(
    userId: number,
    deviceId: string,
    deviceType?: 'ios' | 'android',
    pushToken?: string,
    deviceName?: string,
    appVersion?: string,
    osVersion?: string,
  ): Promise<void> {
    try {
      // Find existing device or create new one
      let device = await this.mobileDeviceRepository.findOne({
        where: { userId, deviceId },
      });

      if (device) {
        // Update existing device
        device.pushToken = pushToken || device.pushToken;
        device.deviceType = deviceType || device.deviceType;
        device.deviceName = deviceName || device.deviceName;
        device.appVersion = appVersion || device.appVersion;
        device.osVersion = osVersion || device.osVersion;
        device.updateLastAccess();
        device.isActive = true;
      } else {
        // Create new device
        device = this.mobileDeviceRepository.create({
          userId,
          deviceId,
          deviceType: deviceType || 'android',
          pushToken,
          deviceName,
          appVersion,
          osVersion,
          isActive: true,
          notificationsEnabled: true,
        });
      }

      await this.mobileDeviceRepository.save(device);
      this.logger.log(
        `Updated device info for user ${userId}: ${deviceId} (${deviceType})`,
      );
    } catch (error: unknown) {
      this.logger.error('Failed to update device info', error);
    }
  }

  /**
   * Verify biometric token
   */
  private async verifyBiometricToken(
    userId: number,
    biometricToken: string,
    deviceId: string,
  ): Promise<boolean> {
    // In real implementation, verify biometric token against stored data
    this.logger.log(
      `Verifying biometric token for user ${userId} on device ${deviceId}`,
    );
    return true; // Simplified - always valid for demo
  }
}
