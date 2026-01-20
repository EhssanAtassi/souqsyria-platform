/**
 * @file change-password.dto.ts
 * @description Request body validation for changing password while logged in.
 * User must provide current password for verification and new password.
 */
import { IsString, MinLength, IsNotEmpty } from 'class-validator';
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
    example: 'newStrongPassword456',
    description: 'New password (minimum 6 characters)',
  })
  @IsString({ message: 'New password must be a valid string' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}
