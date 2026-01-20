/**
 * @file reset-password.dto.ts
 * @description Request body validation for password reset functionality.
 * Users provide the reset token and new password to complete the reset process.
 */
import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token received via email',
  })
  @IsString({ message: 'Reset token must be a valid string' })
  @IsNotEmpty({ message: 'Reset token is required' })
  resetToken: string;

  @ApiProperty({
    example: 'newStrongPassword123',
    description: 'New password (minimum 8 characters)',
  })
  @IsString({ message: 'Password must be a valid string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}
