/**
 * @file verify-otp.dto.ts
 * @description Request body validation for OTP verification.
 */
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 6, { message: 'OTP code must be 4-6 digits' })
  otpCode: string;
}
