/**
 * @file change-password.dto.ts
 * @description DTO for changing user password
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

/**
 * DTO for changing user password
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description:
      'New password (8-50 chars, must include uppercase, lowercase, number, and special character)',
    example: 'NewSecurePassword123!',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewSecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
