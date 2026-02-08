/**
 * @file update-profile.dto.ts
 * @description DTO for updating user profile information
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsObject,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * User preferences object structure
 */
export class UserPreferences {
  @ApiPropertyOptional({
    description: 'Preferred language',
    example: 'ar',
    enum: ['en', 'ar'],
  })
  @IsOptional()
  @IsString()
  language?: 'en' | 'ar';

  @ApiPropertyOptional({
    description: 'Preferred currency',
    example: 'SYP',
    enum: ['SYP', 'USD', 'EUR', 'TRY'],
  })
  @IsOptional()
  @IsString()
  currency?: 'SYP' | 'USD' | 'EUR' | 'TRY';

  @ApiPropertyOptional({
    description: 'Email notifications enabled',
    example: true,
  })
  @IsOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'SMS notifications enabled',
    example: false,
  })
  @IsOptional()
  smsNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Marketing emails enabled',
    example: true,
  })
  @IsOptional()
  marketingEmails?: boolean;
}

/**
 * DTO for updating user profile information
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'أحمد محمد السوري',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'ahmed@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (Syrian format: +963XXXXXXXXX)',
    example: '+963987654321',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+963\d{9,10}$/, {
    message:
      'Phone must be in Syrian format: +963XXXXXXXXX (9-10 digits after +963)',
  })
  phone?: string;

  @ApiPropertyOptional({
    description:
      'User avatar - can be a base64 data URL (data:image/png;base64,...), a direct URL string, or null to remove the avatar',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiPropertyOptional({
    description: 'User preferences',
    type: UserPreferences,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UserPreferences)
  preferences?: UserPreferences;
}
