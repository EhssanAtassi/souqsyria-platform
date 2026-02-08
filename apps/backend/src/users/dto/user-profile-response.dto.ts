/**
 * @file user-profile-response.dto.ts
 * @description Response DTO for user profile information
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

/**
 * User role information
 */
export class UserRoleDto {
  @ApiProperty({
    description: 'Role ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Role name',
    example: 'buyer',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Role display name',
    example: 'Customer',
  })
  @Expose()
  displayName?: string;
}

/**
 * User preferences
 */
export class UserPreferencesDto {
  @ApiPropertyOptional({
    description: 'Preferred language',
    example: 'ar',
  })
  @Expose()
  language?: string;

  @ApiPropertyOptional({
    description: 'Preferred currency',
    example: 'SYP',
  })
  @Expose()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Email notifications enabled',
    example: true,
  })
  @Expose()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'SMS notifications enabled',
    example: false,
  })
  @Expose()
  smsNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Marketing emails enabled',
    example: true,
  })
  @Expose()
  marketingEmails?: boolean;
}

/**
 * User address summary
 */
export class UserAddressSummaryDto {
  @ApiProperty({
    description: 'Address ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Address label',
    example: 'Home',
  })
  @Expose()
  label: string;

  @ApiProperty({
    description: 'Is default address',
    example: true,
  })
  @Expose()
  isDefault: boolean;

  @ApiProperty({
    description: 'Full address string',
    example: 'شارع الثورة، حي المزة، دمشق، سوريا',
  })
  @Expose()
  fullAddress: string;
}

/**
 * Complete user profile response DTO
 */
export class UserProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 123,
  })
  @Expose()
  id: number;

  @ApiPropertyOptional({
    description: 'Firebase UID',
    example: 'firebase-uid-12345',
  })
  @Expose()
  firebaseUid?: string;

  @ApiPropertyOptional({
    description: 'User email',
    example: 'ahmed@example.com',
  })
  @Expose()
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+963987654321',
  })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'أحمد محمد السوري',
  })
  @Expose()
  fullName?: string;

  @ApiPropertyOptional({
    description:
      'User avatar URL or path (e.g., /avatars/user-123-1234567890.png)',
    example: '/avatars/user-123-1234567890.png',
  })
  @Expose()
  avatar?: string;

  @ApiProperty({
    description: 'Account verification status',
    example: true,
  })
  @Expose()
  isVerified: boolean;

  @ApiProperty({
    description: 'User role information',
    type: UserRoleDto,
  })
  @Expose()
  @Type(() => UserRoleDto)
  role: UserRoleDto;

  @ApiPropertyOptional({
    description: 'User preferences',
    type: UserPreferencesDto,
  })
  @Expose()
  @Type(() => UserPreferencesDto)
  @Transform(({ value }) => value || {})
  preferences?: UserPreferencesDto;

  @ApiPropertyOptional({
    description: 'User addresses summary',
    type: [UserAddressSummaryDto],
  })
  @Expose()
  @Type(() => UserAddressSummaryDto)
  addresses?: UserAddressSummaryDto[];

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    example: '2025-08-08T12:00:00.000Z',
  })
  @Expose()
  lastLoginAt?: Date;

  @ApiPropertyOptional({
    description: 'Last activity timestamp',
    example: '2025-08-08T14:30:00.000Z',
  })
  @Expose()
  lastActivityAt?: Date;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-07-01T10:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Account last update timestamp',
    example: '2025-08-08T14:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Total number of orders placed by the user',
    example: 15,
  })
  @Expose()
  ordersCount: number;

  @ApiProperty({
    description: 'Total number of items in user wishlist',
    example: 8,
  })
  @Expose()
  wishlistCount: number;

  @ApiProperty({
    description: 'Account statistics (deprecated - use flat ordersCount and wishlistCount instead)',
    example: {
      totalOrders: 15,
      totalSpent: 5750000,
      wishlistItems: 8,
      savedAddresses: 3,
    },
  })
  @Expose()
  statistics?: {
    totalOrders: number;
    totalSpent: number;
    wishlistItems: number;
    savedAddresses: number;
  };
}
