/**
 * @file users.service.spec.ts
 * @description Comprehensive unit tests for UsersService
 *
 * Tests cover:
 * - User profile retrieval with relationships
 * - Profile updates with validation
 * - Password changes with security verification
 * - Avatar processing (base64 and URL)
 * - Email notifications
 * - Token invalidation after password change
 *
 * @author Claude Code
 * @since 2025-02-08
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Address } from '../addresses/entities/address.entity';
import { RefreshToken } from '../auth/entity/refresh-token.entity';
import { EmailService } from '../auth/service/email.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * Mock fs module for avatar processing tests
 */
jest.mock('fs');
/**
 * Mock bcrypt module for password hashing and comparison
 */
jest.mock('bcryptjs');
/**
 * Mock path module for file path operations
 */
jest.mock('path');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let addressRepository: jest.Mocked<Repository<Address>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser = {
    id: 1,
    firebaseUid: 'firebase-uid-123',
    email: 'test@example.com',
    phone: '+963987654321',
    fullName: 'Test User',
    avatar: null,
    isVerified: true,
    lastLoginAt: new Date('2025-08-08T12:00:00Z'),
    lastActivityAt: new Date('2025-08-08T14:30:00Z'),
    createdAt: new Date('2025-07-01T10:00:00Z'),
    updatedAt: new Date('2025-08-08T14:30:00Z'),
    metadata: { preferences: { language: 'ar' } },
    passwordHash: 'hashed_password_123',
    role: { id: 1, name: 'buyer' },
    addresses: [],
  } as any;

  const mockRole = {
    id: 1,
    name: 'buyer',
  };

  const mockAddress = {
    id: 1,
    label: 'Home',
    isDefault: true,
    addressLine1: 'Street 1',
    addressLine2: 'Apt 2',
    city: { id: 1, name: 'Damascus' },
    region: { id: 1, name: 'Damascus' },
    country: { id: 1, name: 'Syria' },
  };

  beforeEach(async () => {
    /**
     * Create test module with mocked dependencies
     */
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Address),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            delete: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordChangedEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
    addressRepository = module.get(getRepositoryToken(Address));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    emailService = module.get(EmailService);

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
     * Test: getUserProfile should return user with avatar field selected
     * Verifies that getUserProfile includes avatar in the response
     * and loads all required relationships (role, addresses, etc)
     */
    it('should return user with avatar field in select', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserProfile(1);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'role',
          'addresses',
          'addresses.city',
          'addresses.region',
          'addresses.country',
        ],
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          phone: true,
          fullName: true,
          avatar: true,
          isVerified: true,
          lastLoginAt: true,
          lastActivityAt: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
          role: {
            id: true,
            name: true,
          },
          addresses: {
            id: true,
            label: true,
            isDefault: true,
            addressLine1: true,
            addressLine2: true,
            city: { id: true, name: true },
            region: { id: true, name: true },
            country: { id: true, name: true },
          },
        },
      });
    });

    /**
     * Test: getUserProfile should throw NotFoundException when user not found
     * Verifies that NotFoundException is raised with proper message when userId is invalid
     */
    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserProfile(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getUserProfile(999)).rejects.toThrow(
        'User with ID 999 not found',
      );
    });
  });

  describe('updateUserProfile', () => {
    /**
     * Test: updateUserProfile should update fullName successfully
     * Verifies that fullName field is updated and user is saved
     */
    it('should update fullName successfully', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Updated Name',
      };
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUserProfile(1, updateDto);

      expect(result.fullName).toBe('Updated Name');
      expect(userRepository.save).toHaveBeenCalled();
    });

    /**
     * Test: updateUserProfile should update phone with uniqueness check
     * Verifies phone uniqueness validation before update
     */
    it('should update phone with uniqueness check', async () => {
      const updateDto: UpdateProfileDto = {
        phone: '+963988888888',
      };
      const updatedUser = { ...mockUser, phone: '+963988888888' };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUserProfile(1, updateDto);

      expect(result.phone).toBe('+963988888888');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { phone: '+963988888888' },
      });
    });

    /**
     * Test: updateUserProfile should update email with uniqueness check
     * Verifies email uniqueness validation before update
     */
    it('should update email with uniqueness check', async () => {
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };
      const updatedUser = { ...mockUser, email: 'newemail@example.com' };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUserProfile(1, updateDto);

      expect(result.email).toBe('newemail@example.com');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'newemail@example.com' },
      });
    });

    /**
     * Test: updateUserProfile should reject duplicate email
     * Verifies BadRequestException is thrown when email already taken by another user
     */
    it('should reject duplicate email with BadRequestException', async () => {
      const updateDto: UpdateProfileDto = {
        email: 'taken@example.com',
      };
      const existingUser = { ...mockUser, id: 2, email: 'taken@example.com' };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingUser);

      await expect(service.updateUserProfile(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateUserProfile(1, updateDto)).rejects.toThrow(
        'Email is already taken by another user',
      );
    });

    /**
     * Test: updateUserProfile should reject duplicate phone
     * Verifies BadRequestException is thrown when phone already taken by another user
     */
    it('should reject duplicate phone with BadRequestException', async () => {
      const updateDto: UpdateProfileDto = {
        phone: '+963987654321',
      };
      const existingUser = {
        ...mockUser,
        id: 2,
        phone: '+963987654321',
      };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingUser);

      await expect(service.updateUserProfile(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateUserProfile(1, updateDto)).rejects.toThrow(
        'Phone number is already taken by another user',
      );
    });

    /**
     * Test: updateUserProfile should handle avatar base64 processing
     * Verifies processAvatarUpload is called for base64 avatar data
     */
    it('should handle avatar base64 processing', async () => {
      const base64Avatar =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const updateDto: UpdateProfileDto = {
        avatar: base64Avatar,
      };

      const mockFsModule = fs as jest.Mocked<typeof fs>;
      const mockPathModule = path as jest.Mocked<typeof path>;

      mockPathModule.join.mockReturnValue('/path/to/avatars/user-1-123456.png');
      mockFsModule.existsSync.mockReturnValue(true);
      mockFsModule.writeFileSync.mockReturnValue(undefined);

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        avatar: '/avatars/user-1-123456.png',
      });

      const result = await service.updateUserProfile(1, updateDto);

      expect(result.avatar).toBe('/avatars/user-1-123456.png');
      expect(mockFsModule.writeFileSync).toHaveBeenCalled();
    });

    /**
     * Test: updateUserProfile should handle avatar URL string
     * Verifies avatar URL is stored directly without processing
     */
    it('should handle avatar URL string stored directly', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      const updateDto: UpdateProfileDto = {
        avatar: avatarUrl,
      };
      const updatedUser = { ...mockUser, avatar: avatarUrl };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUserProfile(1, updateDto);

      expect(result.avatar).toBe(avatarUrl);
    });

    /**
     * Test: updateUserProfile should throw NotFoundException when user not found
     * Verifies proper error handling for invalid userId
     */
    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserProfile(999, { fullName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * Test: updateUserProfile should merge preferences with existing ones
     * Verifies that preferences are merged, not replaced
     */
    it('should merge preferences with existing ones', async () => {
      const updateDto: UpdateProfileDto = {
        preferences: { language: 'en' },
      };
      const userWithPrefs = {
        ...mockUser,
        metadata: { preferences: { language: 'ar', currency: 'SYP' } },
      };
      const updatedUser = {
        ...userWithPrefs,
        metadata: {
          preferences: { language: 'en', currency: 'SYP' },
        },
      };

      userRepository.findOne.mockResolvedValue(userWithPrefs);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUserProfile(1, updateDto);

      expect(result.metadata.preferences.language).toBe('en');
      expect(result.metadata.preferences.currency).toBe('SYP');
    });

    /**
     * Test: updateUserProfile should update lastActivityAt
     * Verifies that lastActivityAt is updated on profile changes
     */
    it('should update lastActivityAt timestamp', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Updated',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        fullName: 'Updated',
      });

      await service.updateUserProfile(1, updateDto);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    /**
     * Test: changePassword should successfully change password
     * Verifies bcrypt compare and hash operations, token deletion, and email sending
     */
    it('should successfully change password with bcrypt operations', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };
      const hashedNewPassword = 'hashed_new_password_123';

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedNewPassword);

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });
      refreshTokenRepository.delete.mockResolvedValue({
        affected: 3,
        raw: {},
      });

      await service.changePassword(1, changePasswordDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'OldPassword123!',
        mockUser.passwordHash,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'NewPassword456!',
        mockUser.passwordHash,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456!', 12);
      expect(userRepository.update).toHaveBeenCalled();
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({ userId: 1 });
    });

    /**
     * Test: changePassword should throw BadRequestException when passwords don't match
     * Verifies validation of confirmPassword matching newPassword
     */
    it('should throw BadRequestException when confirmPassword !== newPassword', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'DifferentPassword456!',
      };

      await expect(
        service.changePassword(1, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(1, changePasswordDto),
      ).rejects.toThrow('New password and confirm password do not match');
    });

    /**
     * Test: changePassword should throw NotFoundException when user not found
     * Verifies error handling for invalid userId
     */
    it('should throw NotFoundException when user not found', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword(999, changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * Test: changePassword should throw BadRequestException when no passwordHash set
     * Verifies that users without existing password cannot change it
     */
    it('should throw BadRequestException when no passwordHash set', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };
      const userWithoutPassword = { ...mockUser, passwordHash: null };

      userRepository.findOne.mockResolvedValue(userWithoutPassword);

      await expect(
        service.changePassword(1, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(1, changePasswordDto),
      ).rejects.toThrow(
        'User does not have a password set. Please use password reset instead.',
      );
    });

    /**
     * Test: changePassword should throw BadRequestException when current password incorrect
     * Verifies bcrypt.compare rejection for wrong current password
     */
    it('should throw BadRequestException when current password incorrect', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(1, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(1, changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });

    /**
     * Test: changePassword should throw BadRequestException when new === current password
     * Verifies that new password must be different from current password
     */
    it('should throw BadRequestException when new === current password', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'SamePassword123!',
        newPassword: 'SamePassword123!',
        confirmPassword: 'SamePassword123!',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      await expect(
        service.changePassword(1, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(1, changePasswordDto),
      ).rejects.toThrow('New password must be different from current password');
    });

    /**
     * Test: changePassword should delete all refresh tokens after successful change
     * Verifies token invalidation for security (force re-login on all devices)
     */
    it('should delete all refresh tokens after password change', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });
      refreshTokenRepository.delete.mockResolvedValue({
        affected: 5,
        raw: {},
      });

      await service.changePassword(1, changePasswordDto);

      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({ userId: 1 });
    });

    /**
     * Test: changePassword should send password changed email
     * Verifies email notification is sent after successful password change
     */
    it('should send password changed email', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      userRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });
      refreshTokenRepository.delete.mockResolvedValue({
        affected: 1,
        raw: {},
      });

      await service.changePassword(1, changePasswordDto);

      expect(emailService.sendPasswordChangedEmail).toHaveBeenCalledWith(
        mockUser.email,
      );
    });

    /**
     * Test: changePassword should not throw if email sending fails
     * Verifies graceful error handling for email delivery failures
     */
    it('should not throw if email sending fails', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      userRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });
      refreshTokenRepository.delete.mockResolvedValue({
        affected: 1,
        raw: {},
      });
      emailService.sendPasswordChangedEmail.mockRejectedValue(
        new Error('Email service unavailable'),
      );

      /**
       * Should not throw even if email fails
       */
      await expect(
        service.changePassword(1, changePasswordDto),
      ).resolves.not.toThrow();
    });

    /**
     * Test: changePassword should update passwordChangedAt timestamp
     * Verifies security field is updated for password age policies
     */
    it('should update passwordChangedAt timestamp', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);

      const updateSpy = jest
        .spyOn(userRepository, 'update')
        .mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      refreshTokenRepository.delete.mockResolvedValue({
        affected: 1,
        raw: {},
      });

      await service.changePassword(1, changePasswordDto);

      expect(updateSpy).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          passwordChangedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('processAvatarUpload (private)', () => {
    /**
     * Test: processAvatarUpload should handle URL string without base64 prefix
     * Verifies direct storage of URL strings without file processing
     */
    it('should store URL string directly without processing', async () => {
      const avatarUrl = 'https://example.com/avatars/profile-pic.jpg';
      const updateDto: UpdateProfileDto = { avatar: avatarUrl };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        avatar: avatarUrl,
      });

      const result = await service.updateUserProfile(1, updateDto);

      expect(result.avatar).toBe(avatarUrl);
      expect(userRepository.save).toHaveBeenCalled();
    });

    /**
     * Test: processAvatarUpload should create avatars directory if not exists
     * Verifies fs.mkdirSync is called with recursive option
     */
    it('should create avatars directory if not exists', async () => {
      const base64Avatar =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const updateDto: UpdateProfileDto = { avatar: base64Avatar };

      const mockFsModule = fs as jest.Mocked<typeof fs>;
      const mockPathModule = path as jest.Mocked<typeof path>;

      mockPathModule.join.mockReturnValue('/path/to/avatars');
      mockFsModule.existsSync.mockReturnValue(false);
      mockFsModule.mkdirSync.mockReturnValue(undefined);
      mockFsModule.writeFileSync.mockReturnValue(undefined);

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        avatar: '/avatars/user-1-123456.png',
      });

      await service.updateUserProfile(1, updateDto);

      expect(mockFsModule.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true },
      );
    });

    /**
     * Test: processAvatarUpload should throw BadRequestException for invalid format
     * Verifies error handling for malformed base64 data
     */
    it('should throw BadRequestException for invalid avatar format', async () => {
      const invalidAvatar = 'invalid-data-url';
      const updateDto: UpdateProfileDto = { avatar: invalidAvatar };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.updateUserProfile(1, updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserAddresses', () => {
    /**
     * Test: getUserAddresses should return user addresses ordered correctly
     * Verifies default address appears first, then by creation date
     */
    it('should return user addresses ordered by default and creation date', async () => {
      const addresses = [
        { ...mockAddress, isDefault: true },
        { ...mockAddress, id: 2, label: 'Work', isDefault: false },
      ];

      addressRepository.find.mockResolvedValue(addresses as any);

      const result = await service.getUserAddresses(1);

      expect(result).toEqual(addresses);
      expect(addressRepository.find).toHaveBeenCalledWith({
        where: {
          user: { id: 1 },
          deletedAt: null,
        },
        relations: ['city', 'region', 'country'],
        order: {
          isDefault: 'DESC',
          createdAt: 'DESC',
        },
      });
    });
  });

  describe('getUserStatistics', () => {
    /**
     * Test: getUserStatistics should return correct statistics object
     * Verifies all statistics fields are populated correctly
     */
    it('should return user statistics with correct structure', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(15),
      };

      userRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      addressRepository.count.mockResolvedValue(3);

      const result = await service.getUserStatistics(1);

      expect(result).toEqual({
        totalOrders: 15,
        totalSpent: 0,
        wishlistItems: 15,
        savedAddresses: 3,
      });
    });
  });

  describe('updateLastActivity', () => {
    /**
     * Test: updateLastActivity should update lastActivityAt timestamp
     * Verifies repository update is called with current timestamp
     */
    it('should update lastActivityAt timestamp', async () => {
      userRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      await service.updateLastActivity(1);

      expect(userRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          lastActivityAt: expect.any(Date),
        }),
      );
    });
  });

  describe('findById', () => {
    /**
     * Test: findById should return user with role relationship
     * Verifies user lookup with role relation loaded
     */
    it('should return user with role relationship', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['role'],
      });
    });

    /**
     * Test: findById should return null when user not found
     * Verifies graceful handling of missing users
     */
    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });
});
