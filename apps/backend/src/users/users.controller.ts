/**
 * @file users.controller.ts
 * @description User Profile Management Controller for SouqSyria
 *
 * RESPONSIBILITIES:
 * - User profile CRUD operations
 * - Account settings management
 * - Address book integration
 * - Password management
 * - User preferences and statistics
 *
 * ENDPOINTS:
 * - GET /users/profile - Get user profile
 * - PATCH /users/profile - Update user profile
 * - POST /users/change-password - Change password
 * - GET /users/addresses - Get user addresses
 * - GET /users/statistics - Get account statistics
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Logger,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserFromToken } from '../common/interfaces/user-from-token.interface';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('👤 User Profile Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * GET USER PROFILE
   *
   * Retrieves complete user profile with addresses, preferences, and statistics
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Retrieves complete user profile including addresses, preferences, and account statistics',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async getUserProfile(
    @CurrentUser() user: UserFromToken,
  ): Promise<UserProfileResponseDto> {
    this.logger.log(`🔍 Getting profile for user ${user.id}`);

    const [userProfile, addresses, statistics] = await Promise.all([
      this.usersService.getUserProfile(user.id),
      this.usersService.getUserAddresses(user.id),
      this.usersService.getUserStatistics(user.id),
    ]);

    // Transform to response DTO with flat stats
    const responseData = {
      ...userProfile,
      avatar: userProfile.avatar || null,
      ordersCount: statistics.totalOrders,
      wishlistCount: statistics.wishlistItems,
      addresses: addresses.map((address) => ({
        id: address.id,
        label: address.label,
        isDefault: address.isDefault,
        fullAddress: `${address.addressLine1}, ${address.city?.name || ''}, ${address.region?.name || ''}, ${address.country?.name || ''}`,
      })),
      preferences: userProfile.metadata?.preferences || {},
      statistics, // Keep for backwards compatibility
    };

    return plainToInstance(UserProfileResponseDto, responseData, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * UPDATE USER PROFILE
   *
   * Updates user profile information with validation
   */
  @Patch('profile')
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Updates user profile information including name, email, phone, avatar, and preferences',
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Profile update data',
    examples: {
      updateName: {
        summary: 'Update full name',
        value: {
          fullName: 'أحمد محمد السوري',
        },
      },
      updatePreferences: {
        summary: 'Update preferences',
        value: {
          preferences: {
            language: 'ar',
            currency: 'SYP',
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: true,
          },
        },
      },
      updateContact: {
        summary: 'Update contact information',
        value: {
          fullName: 'أحمد محمد السوري',
          email: 'ahmed.updated@example.com',
          phone: '+963987654321',
          preferences: {
            language: 'ar',
            currency: 'SYP',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid profile data or email/phone already taken',
    schema: {
      example: {
        message: 'Email is already taken by another user',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async updateUserProfile(
    @CurrentUser() user: UserFromToken,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    this.logger.log(`✏️ Updating profile for user ${user.id}`);

    await this.usersService.updateUserProfile(user.id, updateProfileDto);

    // Return full profile response (same as GET /profile)
    return this.getUserProfile(user);
  }

  /**
   * CHANGE PASSWORD
   *
   * Changes user password with current password verification
   */
  @Post('change-password')
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Changes user password with current password verification and security validation',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Password change data',
    examples: {
      changePassword: {
        summary: 'Change password',
        value: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully',
        changedAt: '2025-08-08T14:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid password data or current password incorrect',
    schema: {
      examples: {
        wrongCurrentPassword: {
          summary: 'Wrong current password',
          value: {
            message: 'Current password is incorrect',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
        passwordMismatch: {
          summary: 'Password confirmation mismatch',
          value: {
            message: 'New password and confirm password do not match',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
        weakPassword: {
          summary: 'Password validation failed',
          value: {
            message:
              'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async changePassword(
    @CurrentUser() user: UserFromToken,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    this.logger.log(`🔐 Changing password for user ${user.id}`);

    await this.usersService.changePassword(user.id, changePasswordDto);

    return {
      message: 'Password changed successfully',
      changedAt: new Date(),
    };
  }

  /**
   * GET USER ADDRESSES
   *
   * Retrieves all addresses for the authenticated user
   */
  @Get('addresses')
  @ApiOperation({
    summary: 'Get user addresses',
    description:
      'Retrieves all saved addresses for the authenticated user with location details',
  })
  @ApiOkResponse({
    description: 'User addresses retrieved successfully',
    schema: {
      example: {
        addresses: [
          {
            id: 1,
            label: 'Home',
            isDefault: true,
            streetAddress: 'شارع الثورة، حي المزة',
            additionalInfo: 'بناء رقم 15، الطابق الثالث',
            city: {
              id: 1,
              nameEn: 'Damascus',
              nameAr: 'دمشق',
            },
            region: {
              id: 1,
              nameEn: 'Damascus',
              nameAr: 'دمشق',
            },
            country: {
              id: 1,
              nameEn: 'Syria',
              nameAr: 'سوريا',
            },
            postalCode: '12345',
            createdAt: '2025-07-15T10:00:00.000Z',
          },
          {
            id: 2,
            label: 'Work',
            isDefault: false,
            streetAddress: 'شارع الحمرا، وسط البلد',
            city: {
              nameEn: 'Damascus',
              nameAr: 'دمشق',
            },
            region: {
              nameEn: 'Damascus',
              nameAr: 'دمشق',
            },
            country: {
              nameEn: 'Syria',
              nameAr: 'سوريا',
            },
            createdAt: '2025-07-20T14:30:00.000Z',
          },
        ],
        total: 2,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getUserAddresses(@CurrentUser() user: UserFromToken) {
    this.logger.log(`🏠 Getting addresses for user ${user.id}`);

    const addresses = await this.usersService.getUserAddresses(user.id);

    return {
      addresses,
      total: addresses.length,
    };
  }

  /**
   * GET USER STATISTICS
   *
   * Retrieves account statistics for dashboard display
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get user account statistics',
    description:
      'Retrieves account statistics including orders, spending, wishlist, and addresses',
  })
  @ApiOkResponse({
    description: 'User statistics retrieved successfully',
    schema: {
      example: {
        statistics: {
          totalOrders: 15,
          totalSpent: 5750000,
          wishlistItems: 8,
          savedAddresses: 3,
        },
        accountAge: {
          days: 45,
          joinedDate: '2025-06-24T10:00:00.000Z',
        },
        activityStatus: {
          lastLoginAt: '2025-08-08T12:00:00.000Z',
          lastActivityAt: '2025-08-08T14:30:00.000Z',
          isActive: true,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getUserStatistics(@CurrentUser() user: UserFromToken) {
    this.logger.log(`📊 Getting statistics for user ${user.id}`);

    const [statistics, userProfile] = await Promise.all([
      this.usersService.getUserStatistics(user.id),
      this.usersService.findById(user.id),
    ]);

    const accountAgeDays = userProfile
      ? Math.floor(
          (Date.now() - userProfile.createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      statistics,
      accountAge: {
        days: accountAgeDays,
        joinedDate: userProfile?.createdAt,
      },
      activityStatus: {
        lastLoginAt: userProfile?.lastLoginAt,
        lastActivityAt: userProfile?.lastActivityAt,
        isActive: userProfile?.lastActivityAt
          ? userProfile.lastActivityAt > new Date(Date.now() - 30 * 60 * 1000) // Active if activity within 30 minutes
          : false,
      },
    };
  }
}
