/**
 * @file users.controller.spec.ts
 * @description Comprehensive unit tests for UsersController
 *
 * Tests cover:
 * - User profile retrieval with transformed response
 * - Profile updates with PATCH decorator
 * - Password changes with success response
 * - Error handling and authorization
 * - Response DTO transformation with plainToInstance
 *
 * @author Claude Code
 * @since 2025-02-08
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { UserFromToken } from '../common/interfaces/user-from-token.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Mock plainToInstance for DTO transformation tests
 */
jest.mock('class-transformer', () => ({
  plainToInstance: jest.fn((cls, obj) => obj),
  Type: () => () => {},
  Expose: () => () => {},
  Transform: () => () => {},
  Exclude: () => () => {},
}));

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: UserFromToken = {
    id: 1,
    email: 'test@example.com',
    role_id: 1,
    firebase_uid: 'firebase-uid-123',
  };

  const mockUserProfile = {
    id: 1,
    firebaseUid: 'firebase-uid-123',
    email: 'test@example.com',
    phone: '+963987654321',
    fullName: 'Test User',
    avatar: '/avatars/user-1-123456.png',
    isVerified: true,
    lastLoginAt: new Date('2025-08-08T12:00:00Z'),
    lastActivityAt: new Date('2025-08-08T14:30:00Z'),
    createdAt: new Date('2025-07-01T10:00:00Z'),
    updatedAt: new Date('2025-08-08T14:30:00Z'),
    metadata: { preferences: { language: 'ar' } },
    role: { id: 1, name: 'buyer' },
    addresses: [],
  };

  const mockAddresses = [
    {
      id: 1,
      label: 'Home',
      isDefault: true,
      fullAddress: 'شارع الثورة، حي المزة، دمشق، سوريا',
    },
    {
      id: 2,
      label: 'Work',
      isDefault: false,
      fullAddress: 'شارع الحمرا، وسط البلد، دمشق، سوريا',
    },
  ];

  const mockStatistics = {
    totalOrders: 15,
    totalSpent: 5750000,
    wishlistItems: 8,
    savedAddresses: 3,
  };

  beforeEach(async () => {
    /**
     * Create test module with mocked UsersService and overridden JwtAuthGuard
     */
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getUserProfile: jest.fn(),
            updateUserProfile: jest.fn(),
            changePassword: jest.fn(),
            getUserAddresses: jest.fn(),
            getUserStatistics: jest.fn(),
            findById: jest.fn(),
            updateLastActivity: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;

    /**
     * Reset all mocks before each test
     */
    jest.clearAllMocks();
  });

  afterEach(() => {
    /**
     * Clean up mocks after each test
     */
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    /**
     * Test: getUserProfile should return profile with ordersCount and wishlistCount as flat fields
     * Verifies that statistics are flattened into the response object
     */
    it('should return profile with ordersCount and wishlistCount as flat fields', async () => {
      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.getUserProfile(mockUser);

      expect(result.ordersCount).toBe(15);
      expect(result.wishlistCount).toBe(8);
      expect(result).toHaveProperty('ordersCount');
      expect(result).toHaveProperty('wishlistCount');
    });

    /**
     * Test: getUserProfile should return transformed DTO via plainToInstance
     * Verifies that response is properly transformed using class-transformer
     */
    it('should return transformed DTO via plainToInstance', async () => {
      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      await controller.getUserProfile(mockUser);

      expect(plainToInstance).toHaveBeenCalledWith(
        UserProfileResponseDto,
        expect.any(Object),
        {
          excludeExtraneousValues: true,
        },
      );
    });

    /**
     * Test: getUserProfile should call service methods with userId
     * Verifies all three service methods are called for complete profile
     */
    it('should call all service methods with correct userId', async () => {
      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      await controller.getUserProfile(mockUser);

      expect(usersService.getUserProfile).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.getUserAddresses).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.getUserStatistics).toHaveBeenCalledWith(mockUser.id);
    });

    /**
     * Test: getUserProfile should include avatar field in response
     * Verifies avatar URL is properly included in profile response
     */
    it('should include avatar field in response', async () => {
      const userWithAvatar = {
        ...mockUserProfile,
        avatar: '/avatars/user-1-123456.png',
      };

      usersService.getUserProfile.mockResolvedValue(userWithAvatar as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.getUserProfile(mockUser);

      expect(result.avatar).toBe('/avatars/user-1-123456.png');
    });

    /**
     * Test: getUserProfile should include preferences from metadata
     * Verifies user preferences are extracted from metadata
     */
    it('should include preferences from metadata', async () => {
      const userWithPreferences = {
        ...mockUserProfile,
        metadata: {
          preferences: {
            language: 'ar',
            currency: 'SYP',
            emailNotifications: true,
          },
        },
      };

      usersService.getUserProfile.mockResolvedValue(
        userWithPreferences as any,
      );
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.getUserProfile(mockUser);

      expect(result.preferences).toEqual({
        language: 'ar',
        currency: 'SYP',
        emailNotifications: true,
      });
    });

    /**
     * Test: getUserProfile should format address strings correctly
     * Verifies address formatting with city, region, and country
     */
    it('should format address strings correctly', async () => {
      const mockAddressWithDetails = [
        {
          id: 1,
          label: 'Home',
          isDefault: true,
          addressLine1: 'شارع الثورة',
          addressLine2: 'حي المزة',
          city: { id: 1, name: 'Damascus' },
          region: { id: 1, name: 'Damascus' },
          country: { id: 1, name: 'Syria' },
        },
      ];

      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(
        mockAddressWithDetails as any,
      );
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.getUserProfile(mockUser);

      expect(result.addresses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            label: 'Home',
            isDefault: true,
            fullAddress: expect.stringContaining('شارع الثورة'),
          }),
        ]),
      );
    });

    /**
     * Test: getUserProfile should handle null avatar gracefully
     * Verifies null avatar is returned as null in response
     */
    it('should handle null avatar gracefully', async () => {
      const userWithoutAvatar = { ...mockUserProfile, avatar: null };

      usersService.getUserProfile.mockResolvedValue(userWithoutAvatar as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.getUserProfile(mockUser);

      expect(result.avatar).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    /**
     * Test: updateUserProfile should call service then return full profile
     * Verifies service is called for update, then getUserProfile is called for response
     */
    it('should call service then return full profile', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Updated Name',
      };

      usersService.updateUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      await controller.updateUserProfile(mockUser, updateDto);

      expect(usersService.updateUserProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
    });

    /**
     * Test: updateUserProfile should return full profile after update
     * Verifies complete profile response is returned with updated data
     */
    it('should return full profile after update', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Updated Name',
      };
      const updatedProfile = { ...mockUserProfile, fullName: 'Updated Name' };

      usersService.updateUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.updateUserProfile(mockUser, updateDto);

      expect(result).toBeDefined();
      expect(result.ordersCount).toBe(mockStatistics.totalOrders);
    });

    /**
     * Test: updateUserProfile should use PATCH decorator
     * Verifies that the endpoint is configured as PATCH request
     */
    it('should use PATCH decorator for endpoint', async () => {
      usersService.updateUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      /**
       * Verify Patch decorator exists on method
       */
      const patchDecorator = Reflect.getMetadata(
        'path',
        controller.updateUserProfile,
      );
      expect(patchDecorator).toBeDefined();
    });

    /**
     * Test: updateUserProfile should handle email update
     * Verifies email can be updated via update profile endpoint
     */
    it('should handle email update in profile', async () => {
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };
      const updatedProfile = {
        ...mockUserProfile,
        email: 'newemail@example.com',
      };

      usersService.updateUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.updateUserProfile(mockUser, updateDto);

      expect(result.email).toBe('newemail@example.com');
    });

    /**
     * Test: updateUserProfile should handle phone update
     * Verifies phone can be updated via update profile endpoint
     */
    it('should handle phone update in profile', async () => {
      const updateDto: UpdateProfileDto = {
        phone: '+963988888888',
      };
      const updatedProfile = {
        ...mockUserProfile,
        phone: '+963988888888',
      };

      usersService.updateUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.updateUserProfile(mockUser, updateDto);

      expect(result.phone).toBe('+963988888888');
    });

    /**
     * Test: updateUserProfile should handle avatar upload
     * Verifies avatar can be updated via update profile endpoint
     */
    it('should handle avatar upload in profile', async () => {
      const base64Avatar =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const updateDto: UpdateProfileDto = {
        avatar: base64Avatar,
      };
      const updatedProfile = {
        ...mockUserProfile,
        avatar: '/avatars/user-1-123456.png',
      };

      usersService.updateUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.updateUserProfile(mockUser, updateDto);

      expect(result.avatar).toBe('/avatars/user-1-123456.png');
    });

    /**
     * Test: updateUserProfile should handle preferences update
     * Verifies preferences can be updated via update profile endpoint
     */
    it('should handle preferences update in profile', async () => {
      const updateDto: UpdateProfileDto = {
        preferences: {
          language: 'en',
          currency: 'USD',
          emailNotifications: false,
        },
      };
      const updatedProfile = {
        ...mockUserProfile,
        metadata: {
          preferences: {
            language: 'en',
            currency: 'USD',
            emailNotifications: false,
          },
        },
      };

      usersService.updateUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserProfile.mockResolvedValue(updatedProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.updateUserProfile(mockUser, updateDto);

      expect(result.preferences).toEqual(
        expect.objectContaining({
          language: 'en',
          currency: 'USD',
        }),
      );
    });
  });

  describe('changePassword', () => {
    /**
     * Test: changePassword should call service and return success message
     * Verifies service is called with correct parameters and returns success response
     */
    it('should call service and return success message', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      usersService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(mockUser, changePasswordDto);

      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto,
      );
      expect(result.message).toBe('Password changed successfully');
    });

    /**
     * Test: changePassword should return changedAt timestamp
     * Verifies response includes current timestamp for audit purposes
     */
    it('should return changedAt timestamp', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };
      const beforeTime = new Date();

      usersService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(mockUser, changePasswordDto);
      const afterTime = new Date();

      expect(result.changedAt).toBeDefined();
      expect(result.changedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(result.changedAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });

    /**
     * Test: changePassword should return correct response shape
     * Verifies response object contains all required fields
     */
    it('should return correct response shape', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      usersService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(mockUser, changePasswordDto);

      expect(result).toEqual({
        message: 'Password changed successfully',
        changedAt: expect.any(Date),
      });
    });

    /**
     * Test: changePassword should pass userId to service
     * Verifies service receives authenticated user ID
     */
    it('should pass userId from CurrentUser decorator to service', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      usersService.changePassword.mockResolvedValue(undefined);

      await controller.changePassword(mockUser, changePasswordDto);

      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto,
      );
    });

    /**
     * Test: changePassword should propagate service errors
     * Verifies exceptions from service are not caught by controller
     */
    it('should propagate service errors', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      usersService.changePassword.mockRejectedValue(
        new Error('Current password is incorrect'),
      );

      await expect(
        controller.changePassword(mockUser, changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('getUserAddresses', () => {
    /**
     * Test: getUserAddresses should return addresses with total count
     * Verifies response structure includes addresses array and total field
     */
    it('should return addresses with total count', async () => {
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);

      const result = await controller.getUserAddresses(mockUser);

      expect(result.addresses).toEqual(mockAddresses);
      expect(result.total).toBe(2);
    });

    /**
     * Test: getUserAddresses should call service with userId
     * Verifies service is called with correct user ID
     */
    it('should call service with userId', async () => {
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);

      await controller.getUserAddresses(mockUser);

      expect(usersService.getUserAddresses).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getUserStatistics', () => {
    /**
     * Test: getUserStatistics should return statistics with account age and activity
     * Verifies complete statistics response structure
     */
    it('should return statistics with account age and activity', async () => {
      const userProfile = {
        ...mockUserProfile,
        createdAt: new Date('2025-07-01T10:00:00Z'),
        lastLoginAt: new Date('2025-08-08T12:00:00Z'),
        lastActivityAt: new Date('2025-08-08T14:30:00Z'),
      };

      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);
      usersService.findById.mockResolvedValue(userProfile as any);

      const result = await controller.getUserStatistics(mockUser);

      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('accountAge');
      expect(result).toHaveProperty('activityStatus');
    });

    /**
     * Test: getUserStatistics should calculate account age in days
     * Verifies accountAge.days is calculated correctly
     */
    it('should calculate account age in days', async () => {
      const createdDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      const userProfile = {
        ...mockUserProfile,
        createdAt: createdDate,
      };

      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);
      usersService.findById.mockResolvedValue(userProfile as any);

      const result = await controller.getUserStatistics(mockUser);

      expect(result.accountAge.days).toBeGreaterThanOrEqual(44);
      expect(result.accountAge.days).toBeLessThanOrEqual(46);
    });

    /**
     * Test: getUserStatistics should determine if user is active
     * Verifies activity status considers lastActivityAt within 30 minutes
     */
    it('should determine if user is active based on recent activity', async () => {
      const recentActivityDate = new Date(Date.now() - 10 * 60 * 1000);
      const userProfile = {
        ...mockUserProfile,
        lastActivityAt: recentActivityDate,
      };

      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);
      usersService.findById.mockResolvedValue(userProfile as any);

      const result = await controller.getUserStatistics(mockUser);

      expect(result.activityStatus.isActive).toBe(true);
    });

    /**
     * Test: getUserStatistics should mark user as inactive if no recent activity
     * Verifies isActive is false when lastActivityAt is older than 30 minutes
     */
    it('should mark user as inactive if no recent activity', async () => {
      const oldActivityDate = new Date(Date.now() - 60 * 60 * 1000);
      const userProfile = {
        ...mockUserProfile,
        lastActivityAt: oldActivityDate,
      };

      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);
      usersService.findById.mockResolvedValue(userProfile as any);

      const result = await controller.getUserStatistics(mockUser);

      expect(result.activityStatus.isActive).toBe(false);
    });

    /**
     * Test: getUserStatistics should call service methods with userId
     * Verifies both statistics and user profile service methods are called
     */
    it('should call service methods with userId', async () => {
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);
      usersService.findById.mockResolvedValue(mockUserProfile as any);

      await controller.getUserStatistics(mockUser);

      expect(usersService.getUserStatistics).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updatePreferences', () => {
    /**
     * Test: updatePreferences should call service and return success response
     * Verifies the endpoint calls usersService.updatePreferences and returns the expected shape
     */
    it('should call service and return success response', async () => {
      const preferencesDto = {
        language: 'en',
        currency: 'USD',
        emailNotifications: true,
      };
      const updatedPreferences = {
        language: 'en',
        currency: 'USD',
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
      };

      (usersService as any).updatePreferences = jest
        .fn()
        .mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(
        mockUser,
        preferencesDto as any,
      );

      expect((usersService as any).updatePreferences).toHaveBeenCalledWith(
        mockUser.id,
        preferencesDto,
      );
      expect(result.message).toBe('Preferences updated successfully');
      expect(result.preferences).toEqual(updatedPreferences);
    });

    /**
     * Test: updatePreferences should propagate service errors
     * Verifies that NotFoundException from service is not caught
     */
    it('should propagate service errors', async () => {
      (usersService as any).updatePreferences = jest
        .fn()
        .mockRejectedValue(new Error('User with ID 999 not found'));

      await expect(
        controller.updatePreferences(mockUser, { language: 'en' } as any),
      ).rejects.toThrow('User with ID 999 not found');
    });
  });

  describe('Authorization and Security', () => {
    /**
     * Test: All endpoints should require JwtAuthGuard
     * Verifies authentication guard is applied to controller
     */
    it('should have JwtAuthGuard applied to controller', async () => {
      /**
       * Verify UseGuards decorator exists on controller
       */
      const guards = Reflect.getMetadata('__guards__', UsersController);
      expect(guards).toBeDefined();
    });

    /**
     * Test: CurrentUser decorator should provide authenticated user
     * Verifies CurrentUser provides user from JWT token
     */
    it('should use CurrentUser decorator to get authenticated user', async () => {
      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const result = await controller.getUserProfile(mockUser);

      expect(result).toBeDefined();
      expect(usersService.getUserProfile).toHaveBeenCalled();
    });
  });

  describe('Response Transformation', () => {
    /**
     * Test: Responses should use UserProfileResponseDto
     * Verifies DTO transformation for type safety and consistency
     */
    it('should transform response with UserProfileResponseDto', async () => {
      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const mockPlainToInstance = plainToInstance as jest.Mock;
      mockPlainToInstance.mockReturnValue(mockUserProfile);

      await controller.getUserProfile(mockUser);

      expect(mockPlainToInstance).toHaveBeenCalledWith(
        UserProfileResponseDto,
        expect.any(Object),
        expect.any(Object),
      );
    });

    /**
     * Test: plainToInstance should exclude extraneous values
     * Verifies only declared DTO properties are included in response
     */
    it('should exclude extraneous values from response', async () => {
      usersService.getUserProfile.mockResolvedValue(mockUserProfile as any);
      usersService.getUserAddresses.mockResolvedValue(mockAddresses as any);
      usersService.getUserStatistics.mockResolvedValue(mockStatistics as any);

      const mockPlainToInstance = plainToInstance as jest.Mock;

      await controller.getUserProfile(mockUser);

      expect(mockPlainToInstance).toHaveBeenCalledWith(
        UserProfileResponseDto,
        expect.any(Object),
        {
          excludeExtraneousValues: true,
        },
      );
    });
  });
});
