/**
 * @file change-password.dto.ts
 * @description Request body validation for changing password while logged in.
 * User must provide current password for verification and new password.
 * Password rules match register.dto.ts for consistency (H4 fix).
 */
import { IsString, MinLength, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'Current password for verification',
  })
  @IsString({ message: 'Current password must be a valid string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewStrongPass1',
    description: 'New password (min 8 chars, 1 uppercase, 1 number)',
  })
  @IsString({ message: 'New password must be a valid string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/[A-Z]/, { message: 'New password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'New password must contain at least one number' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}
