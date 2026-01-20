/**
 * @file delete-account.dto.ts
 * @description Request body validation for account deletion (soft delete).
 * Users must provide their password to confirm account deletion.
 */
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    example: 'myCurrentPassword123',
    description: 'Current password to confirm account deletion',
  })
  @IsString({ message: 'Password must be a valid string' })
  @IsNotEmpty({ message: 'Password is required to delete account' })
  password: string;

  @ApiProperty({
    example: 'No longer needed',
    description: 'Optional reason for account deletion',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
