/**
 * @file reset-password.dto.ts
 * @description Request body validation for password reset functionality.
 * Users provide the reset token and new password to complete the reset process.
 * Password rules match register.dto.ts for consistency (H4 fix).
 */
import { IsString, MinLength, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    description:
      'Password reset token received via email (random hex string, not JWT)',
  })
  @IsString({ message: 'Reset token must be a valid string' })
  @IsNotEmpty({ message: 'Reset token is required' })
  resetToken: string;

  @ApiProperty({
    example: 'NewStrongPass1',
    description: 'New password (min 8 chars, 1 uppercase, 1 number)',
  })
  @IsString({ message: 'Password must be a valid string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}
