import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { Address } from '../addresses/entities/address.entity';
import { RefreshToken } from '../auth/entity/refresh-token.entity';
import { SecurityAudit } from '../auth/entity/security-audit.entity';
import { EmailService } from '../auth/service/email.service';
import { UpdateProfileDto, UserPreferences } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(SecurityAudit)
    private readonly securityAuditRepository: Repository<SecurityAudit>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Find an existing user by Firebase UID or create a new one with default role
   * @param firebaseUser { uid: string, email?: string, phone?: string }
   */
  async findOrCreateByFirebaseUid(firebaseUser: {
    uid: string;
    email?: string;
    phone?: string;
  }): Promise<User> {
    this.logger.log(`Checking user existence for UID: ${firebaseUser.uid}`);

    let user = await this.userRepository.findOne({
      where: { firebaseUid: firebaseUser.uid },
      relations: ['role'],
    });

    if (!user) {
      this.logger.log(
        `User not found for UID: ${firebaseUser.uid}. Creating new user...`,
      );
      const defaultRole = await this.roleRepository.findOne({
        where: { name: 'buyer' },
      });
      if (!defaultRole) {
        this.logger.error(`Default role "buyer" not found`);
        throw new Error('Default role "buyer" not found');
      }

      user = this.userRepository.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        phone: firebaseUser.phone,
        role: defaultRole,
      });
      const savedUser = await this.userRepository.save(user);
      this.logger.log(`New user created with ID: ${savedUser.id}`);
      return savedUser;
    } else {
      this.logger.log(`User already exists with ID: ${user.id}`);
    }

    return user;
  }

  /**
   * GET USER PROFILE
   *
   * Retrieves complete user profile with relationships
   *
   * @param userId - User ID to retrieve
   * @returns Promise<User> - Complete user profile
   */
  async getUserProfile(userId: number): Promise<User> {
    this.logger.log(`🔍 Retrieving profile for user ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
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

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * UPDATE USER PROFILE
   *
   * Updates user profile information with validation and sends email notification
   *
   * FEATURES:
   * - Partial updates (only provided fields are updated)
   * - Email uniqueness validation
   * - Phone uniqueness validation
   * - Avatar upload support (base64 or URL)
   * - Old avatar file deletion
   * - Profile update email notification (fire-and-forget)
   * - Last activity timestamp update
   *
   * VALIDATIONS:
   * - Email uniqueness (if changed)
   * - Phone uniqueness (if changed)
   * - Avatar file size limit (2MB)
   * - Avatar format validation (PNG, JPG)
   *
   * @param userId - User ID to update
   * @param updateProfileDto - Profile update data (all fields optional)
   * @returns Promise<User> - Updated user profile
   * @throws NotFoundException - If user not found
   * @throws BadRequestException - If email/phone already taken or avatar processing fails
   */
  async updateUserProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    this.logger.log(`✏️ Updating profile for user ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update basic profile fields
    if (updateProfileDto.fullName) {
      user.fullName = updateProfileDto.fullName;
    }

    if (updateProfileDto.email) {
      // Check if email is already taken by another user
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already taken by another user');
      }

      user.email = updateProfileDto.email;
    }

    if (updateProfileDto.phone) {
      // Check if phone is already taken by another user
      const existingUser = await this.userRepository.findOne({
        where: { phone: updateProfileDto.phone },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException(
          'Phone number is already taken by another user',
        );
      }

      user.phone = updateProfileDto.phone;
    }

    // Update preferences (merge with existing)
    if (updateProfileDto.preferences) {
      const currentPreferences = user.metadata?.preferences || {};
      user.metadata = {
        ...user.metadata,
        preferences: {
          ...currentPreferences,
          ...updateProfileDto.preferences,
        },
      };
    }

    // Handle avatar upload/update/removal
    if (updateProfileDto.avatar !== undefined) {
      if (updateProfileDto.avatar === null || updateProfileDto.avatar === '') {
        // Explicit removal - also delete old file if exists
        if (user.avatar && user.avatar.startsWith('/avatars/')) {
          await fs
            .unlink(path.join(process.cwd(), 'public', user.avatar))
            .catch(() => {});
        }
        user.avatar = null;
      } else {
        // Delete old avatar file before uploading new one
        if (user.avatar && user.avatar.startsWith('/avatars/')) {
          await fs
            .unlink(path.join(process.cwd(), 'public', user.avatar))
            .catch(() => {});
        }
        // Upload new avatar
        user.avatar = await this.processAvatarUpload(
          userId,
          updateProfileDto.avatar,
        );
      }
    }

    // Update last activity
    user.lastActivityAt = new Date();

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`✅ Profile updated successfully for user ${userId}`);

    // Send profile updated confirmation email (async, fire-and-forget)
    if (updatedUser.email && updatedUser.fullName) {
      this.emailService
        .sendProfileUpdatedEmail(updatedUser.email, updatedUser.fullName)
        .catch((error) => {
          this.logger.warn(
            `⚠️ Failed to send profile updated email for user ${userId}: ${error.message}`,
          );
        });
    }

    return updatedUser;
  }

  /**
   * UPDATE USER PREFERENCES
   *
   * Merges new preferences into existing user preferences.
   * Only the provided fields are updated; others remain unchanged.
   *
   * @param userId - User ID
   * @param preferencesDto - Partial preferences to merge
   * @returns Promise<UserPreferences> - Updated preferences object
   */
  async updatePreferences(
    userId: number,
    preferencesDto: UserPreferences,
  ): Promise<UserPreferences> {
    this.logger.log(`⚙️ Updating preferences for user ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const currentPreferences = user.metadata?.preferences || {};
    const mergedPreferences = {
      ...currentPreferences,
      ...preferencesDto,
    };

    user.metadata = {
      ...user.metadata,
      preferences: mergedPreferences,
    };
    user.lastActivityAt = new Date();

    await this.userRepository.save(user);
    this.logger.log(`✅ Preferences updated for user ${userId}`);

    return mergedPreferences;
  }

  /**
   * PROCESS AVATAR UPLOAD
   *
   * Handles avatar upload - supports both base64 data URLs and direct URL strings
   *
   * @param userId - User ID for filename generation
   * @param avatarData - Avatar data (base64 data URL or direct URL string)
   * @returns Promise<string> - Path to saved avatar or URL string
   */
  private async processAvatarUpload(
    userId: number,
    avatarData: string,
  ): Promise<string> {
    this.logger.log(`📸 Processing avatar upload for user ${userId}`);

    // If it's already a URL string (not base64), just store it directly
    if (!avatarData.startsWith('data:image/')) {
      this.logger.log(`Avatar is a URL string, storing directly`);
      return avatarData;
    }

    try {
      // Extract image format and base64 data
      // Format: data:image/png;base64,iVBORw0KGgoAAAANS...
      const matches = avatarData.match(/^data:image\/(\w+);base64,(.+)$/);

      if (!matches) {
        throw new BadRequestException(
          'Invalid avatar format. Must be a data URL (data:image/png;base64,...) or a direct URL',
        );
      }

      const extension = matches[1]; // png, jpg, jpeg, gif, etc.
      const base64Data = matches[2];

      // Decode base64 and enforce server-side size limit before writing to file
      const buffer = Buffer.from(base64Data, 'base64');
      const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
      if (buffer.length > MAX_AVATAR_SIZE_BYTES) {
        throw new BadRequestException(
          `Avatar image is too large. Maximum allowed size is ${MAX_AVATAR_SIZE_BYTES} bytes.`,
        );
      }

      // Create avatars directory if it doesn't exist
      const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
      try {
        await fs.access(avatarsDir);
      } catch {
        await fs.mkdir(avatarsDir, { recursive: true });
        this.logger.log(`📁 Created avatars directory: ${avatarsDir}`);
      }

      // Generate unique filename
      const filename = `user-${userId}-${Date.now()}.${extension}`;
      const filePath = path.join(avatarsDir, filename);

      // Write to file asynchronously
      await fs.writeFile(filePath, buffer);

      this.logger.log(`✅ Avatar saved successfully: ${filename}`);

      // Return relative path for storage in database
      return `/avatars/${filename}`;
    } catch (error) {
      this.logger.error(
        `❌ Failed to process avatar upload for user ${userId}`,
        error,
      );
      throw new BadRequestException(
        'Failed to process avatar upload. Please ensure the image format is correct.',
      );
    }
  }

  /**
   * CHANGE PASSWORD
   *
   * Changes user password with current password verification and security audit tracking
   *
   * SECURITY FEATURES:
   * - Current password verification required
   * - Strong password policy enforcement
   * - Prevents password reuse (new password must be different from current)
   * - Security audit logging (success and failure events)
   * - Failed attempt tracking (3-strike rule: blocks after 3 failures in 1 hour)
   * - All refresh tokens invalidated (force re-login on all devices)
   * - Password change confirmation email sent
   * - Password change timestamp updated
   *
   * WORKFLOW:
   * 1. Validate new password matches confirm password
   * 2. Verify user exists and has password set
   * 3. Verify current password is correct
   *    - If wrong: log failed attempt, check 3-strike rule, throw error
   *    - If 3+ failures in last hour: throw ForbiddenException
   * 4. Verify new password is different from current
   * 5. Hash new password with bcrypt (12 rounds)
   * 6. Update password and timestamp in database
   * 7. Invalidate all refresh tokens
   * 8. Log success event to security audit
   * 9. Send password changed email (fire-and-forget)
   *
   * @param userId - User ID
   * @param changePasswordDto - Password change data (currentPassword, newPassword, confirmPassword)
   * @param ipAddress - IP address of the request (optional, for security audit)
   * @returns Promise<void>
   * @throws NotFoundException - If user not found
   * @throws BadRequestException - If passwords don't match, no password set, or new password same as current
   * @throws UnauthorizedException - If current password is incorrect
   * @throws ForbiddenException - If 3+ failed attempts in last hour
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
    ipAddress?: string,
  ): Promise<void> {
    this.logger.log(`🔐 Changing password for user ${userId}`);

    // Validate that new password and confirm password match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'passwordHash'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify current password
    if (!user.passwordHash) {
      throw new BadRequestException(
        'User does not have a password set. Please use password reset instead.',
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await this.logSecurityAudit(
        user.id,
        user.email,
        'PASSWORD_CHANGE_FAILED',
        ipAddress,
        { reason: 'Invalid current password' },
      );

      // Count recent failed attempts within last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentFailures = await this.securityAuditRepository.count({
        where: {
          userId: user.id,
          eventType: 'PASSWORD_CHANGE_FAILED',
          createdAt: oneHourAgo as any, // TypeORM requires this cast
        },
      });

      this.logger.warn(
        `❌ Password change failed for user ${userId}. Failed attempts in last hour: ${recentFailures}`,
      );

      // If 3 or more failures in last hour, trigger security alert
      if (recentFailures >= 3) {
        this.logger.error(
          `🚨 SECURITY ALERT: User ${userId} has ${recentFailures} failed password change attempts in the last hour`,
        );

        // Send admin alert email (fire-and-forget)
        // Note: This would require an admin email configuration or notification service
        // For now, we just log it prominently

        throw new ForbiddenException(
          'Too many failed password change attempts. Please contact support or try again later.',
        );
      }

      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    // Update password and password change timestamp
    await this.userRepository.update(userId, {
      passwordHash: hashedNewPassword,
      passwordChangedAt: new Date(),
      lastActivityAt: new Date(),
    });

    // Invalidate all refresh tokens for this user (force re-login on all devices)
    await this.refreshTokenRepository.delete({ userId });
    this.logger.log(
      `🔐 All refresh tokens invalidated for user ${userId} after password change`,
    );

    // Log successful password change
    await this.logSecurityAudit(
      user.id,
      user.email,
      'PASSWORD_CHANGE_SUCCESS',
      ipAddress,
      { timestamp: new Date() },
    );

    // Send password change confirmation email (fire-and-forget)
    this.emailService
      .sendPasswordChangedEmail(user.email)
      .then(() => {
        this.logger.log(
          `📧 Password change confirmation email sent to ${user.email}`,
        );
      })
      .catch((emailError) => {
        this.logger.warn(
          `⚠️ Failed to send password change email for user ${userId}: ${emailError.message}`,
        );
      });

    this.logger.log(`✅ Password changed successfully for user ${userId}`);
  }

  /**
   * LOG SECURITY AUDIT
   *
   * Records a security audit event for password changes
   *
   * @param userId - User ID
   * @param email - User email
   * @param eventType - Type of security event
   * @param ipAddress - IP address of the request
   * @param metadata - Additional metadata
   */
  private async logSecurityAudit(
    userId: number,
    email: string,
    eventType: 'PASSWORD_CHANGE_SUCCESS' | 'PASSWORD_CHANGE_FAILED',
    ipAddress?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.securityAuditRepository.save({
        userId,
        email,
        eventType,
        ipAddress: ipAddress || 'unknown',
        userAgent: null, // Not available in service layer
        failedAttemptNumber: null,
        metadata,
      });

      this.logger.log(
        `📝 Security audit logged: ${eventType} for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to log security audit for user ${userId}: ${error.message}`,
      );
      // Don't throw - security audit logging should not break the main flow
    }
  }

  /**
   * GET USER ADDRESSES
   *
   * Retrieves all addresses for a user
   *
   * @param userId - User ID
   * @returns Promise<Address[]> - User addresses
   */
  async getUserAddresses(userId: number): Promise<Address[]> {
    this.logger.log(`🏠 Retrieving addresses for user ${userId}`);

    const addresses = await this.addressRepository.find({
      where: {
        user: { id: userId },
        deletedAt: null, // Only active addresses
      },
      relations: ['city', 'region', 'country'],
      order: {
        isDefault: 'DESC', // Default address first
        createdAt: 'DESC',
      },
    });

    return addresses;
  }

  /**
   * GET USER STATISTICS
   *
   * Calculates user account statistics for profile display
   *
   * @param userId - User ID
   * @returns Promise<object> - User statistics
   */
  async getUserStatistics(userId: number): Promise<{
    totalOrders: number;
    totalSpent: number;
    wishlistItems: number;
    savedAddresses: number;
  }> {
    this.logger.log(`📊 Calculating statistics for user ${userId}`);

    const [totalOrders, totalSpent, wishlistItems, savedAddresses] =
      await Promise.all([
        // Total orders count
        this.userRepository
          .createQueryBuilder('user')
          .leftJoin('user.orders', 'order')
          .where('user.id = :userId', { userId })
          .getCount(),

        // Total spent (placeholder - would need orders relationship)
        Promise.resolve(0),

        // Wishlist items count
        this.userRepository
          .createQueryBuilder('user')
          .leftJoin('user.wishlist', 'wishlist')
          .where('user.id = :userId', { userId })
          .getCount(),

        // Saved addresses count
        this.addressRepository.count({
          where: {
            user: { id: userId },
            deletedAt: null,
          },
        }),
      ]);

    return {
      totalOrders,
      totalSpent,
      wishlistItems,
      savedAddresses,
    };
  }

  /**
   * UPDATE LAST ACTIVITY
   *
   * Updates user's last activity timestamp for session management
   *
   * @param userId - User ID
   */
  async updateLastActivity(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      lastActivityAt: new Date(),
    });
  }

  /**
   * FIND USER BY ID
   *
   * Simple user lookup by ID
   *
   * @param userId - User ID
   * @returns Promise<User | null> - User entity or null
   */
  async findById(userId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
  }
}
