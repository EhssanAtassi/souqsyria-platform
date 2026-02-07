/**
 * @file verify-otp.dto.ts
 * @description Request body validation for OTP verification.
 * Enforces exactly 6 numeric digits to match the OTP generation logic (SEC-H05).
 */
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user to verify',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Six-digit OTP code received via email',
  })
  @IsString({ message: 'OTP code must be a string' })
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP code must contain only numeric digits' })
  otpCode: string;
}
