import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Mobile OTP Entity
 *
 * Stores OTP codes for mobile phone authentication.
 * Designed for Syrian mobile numbers with +963 country code.
 *
 * Features:
 * - 6-digit OTP codes with 5-minute expiry
 * - Phone number verification for Syrian market
 * - Attempt tracking for security
 * - Automatic cleanup of expired codes
 */
@Entity('mobile_otp')
@Index(['phone', 'expiresAt'])
@Index(['otp', 'phone'])
export class MobileOTPEntity {
  /**
   * Primary key
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Phone number with country code (e.g., +963991234567)
   */
  @Column({
    length: 20,
    comment: 'Phone number with country code (Syrian format: +963XXXXXXXXX)',
  })
  phone: string;

  /**
   * 6-digit OTP code
   */
  @Column({
    length: 6,
    comment: '6-digit OTP code for verification',
  })
  otp: string;

  /**
   * OTP expiration timestamp (5 minutes from creation)
   */
  @Column({
    type: 'timestamp',
    comment: 'OTP expires after 5 minutes',
  })
  expiresAt: Date;

  /**
   * Whether OTP has been verified successfully
   */
  @Column({
    default: false,
    comment: 'Whether OTP has been used for successful verification',
  })
  verified: boolean;

  /**
   * Number of verification attempts
   */
  @Column({
    default: 0,
    comment: 'Number of failed verification attempts',
  })
  attempts: number;

  /**
   * Maximum allowed attempts before blocking
   */
  @Column({
    default: 3,
    comment: 'Maximum verification attempts (default: 3)',
  })
  maxAttempts: number;

  /**
   * Device ID that requested the OTP (for security)
   */
  @Column({
    length: 255,
    nullable: true,
    comment: 'Device ID that requested OTP for security tracking',
  })
  deviceId: string;

  /**
   * IP address that requested the OTP (for security)
   */
  @Column({
    length: 45,
    nullable: true,
    comment: 'IP address for security and fraud prevention',
  })
  ipAddress: string;

  /**
   * OTP creation timestamp
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Check if OTP is still valid and not expired
   */
  isValid(): boolean {
    return (
      !this.verified &&
      new Date() < this.expiresAt &&
      this.attempts < this.maxAttempts
    );
  }

  /**
   * Check if OTP has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if maximum attempts reached
   */
  isBlocked(): boolean {
    return this.attempts >= this.maxAttempts;
  }

  /**
   * Increment verification attempt counter
   */
  incrementAttempts(): void {
    this.attempts += 1;
  }

  /**
   * Mark OTP as successfully verified
   */
  markAsVerified(): void {
    this.verified = true;
  }

  /**
   * Get remaining time before expiry in seconds
   */
  getRemainingSeconds(): number {
    const now = new Date().getTime();
    const expires = this.expiresAt.getTime();
    const remainingMs = expires - now;

    return Math.max(0, Math.floor(remainingMs / 1000));
  }

  /**
   * Get remaining attempts before blocking
   */
  getRemainingAttempts(): number {
    return Math.max(0, this.maxAttempts - this.attempts);
  }

  /**
   * Generate new OTP expiration time (5 minutes from now)
   */
  static generateExpirationTime(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes from now
    return expiresAt;
  }

  /**
   * Generate random 6-digit OTP
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate Syrian phone number format
   */
  static isValidSyrianPhone(phone: string): boolean {
    // Syrian mobile numbers: +963 9X XXX XXXX (total 13 digits including +963)
    const syrianPhoneRegex = /^\+963(9[0-9]|8[0-9]|7[0-9])[0-9]{7}$/;
    return syrianPhoneRegex.test(phone);
  }

  /**
   * Format phone number to Syrian standard
   */
  static formatSyrianPhone(
    phone: string,
    countryCode: string = '+963',
  ): string {
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');

    // Add country code if not present
    if (cleanPhone.startsWith('963')) {
      return '+' + cleanPhone;
    } else if (cleanPhone.startsWith('9')) {
      return '+963' + cleanPhone;
    } else if (
      cleanPhone.length === 9 &&
      (cleanPhone.startsWith('9') ||
        cleanPhone.startsWith('8') ||
        cleanPhone.startsWith('7'))
    ) {
      return '+963' + cleanPhone;
    }

    return countryCode + cleanPhone;
  }
}
