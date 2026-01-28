/**
 * @file user-seeder.service.ts
 * @description Enterprise User Seeding Service for SouqSyria Platform
 *
 * SEEDING FEATURES:
 * - Comprehensive user data seeding with Syrian market focus
 * - Role-based user creation (Admin, Staff, Vendor, Customer, System)
 * - Password hashing and security implementation
 * - Bulk operations with transaction safety and rollback
 * - Duplicate detection and intelligent conflict resolution
 * - Performance monitoring and batch processing optimization
 * - Multi-language support (Arabic/English users)
 * - Advanced filtering and validation
 * - Comprehensive logging and error handling
 * - Statistics tracking and analytics
 * - Role resolution and assignment
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import * as bcrypt from 'bcryptjs';
import {
  ALL_USER_SEEDS,
  ADMIN_USERS,
  VENDOR_USERS,
  CUSTOMER_USERS,
  SYSTEM_USERS,
  SPECIAL_USERS,
  USER_STATISTICS,
  UserSeedData,
  getUsersByType,
  getUsersByLocation,
  getVerifiedUsers,
  getActiveUsers,
  getUsersByTier,
  getDiasporaUsers,
  getUsersByLanguage,
} from './user-seeds.data';

/**
 * Seeding Options Interface
 */
export interface UserSeedOptions {
  includeAdmins?: boolean;
  includeStaff?: boolean;
  includeVendors?: boolean;
  includeCustomers?: boolean;
  includeSystem?: boolean;
  includeSpecial?: boolean;
  clearExisting?: boolean;
  batchSize?: number;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  specificUserTypes?: string[];
  specificLocations?: string[];
  onlyVerified?: boolean;
  onlyActive?: boolean;
  specificTiers?: string[];
  specificLanguages?: string[];
  hashPasswords?: boolean;
  createMissingRoles?: boolean;
  dryRun?: boolean;
  validateRoles?: boolean;
}

/**
 * Seeding Result Interface
 */
export interface UserSeedResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  processingTimeMs: number;
  errorDetails: Array<{
    userName: string;
    email: string;
    error: string;
    details?: any;
  }>;
  statistics: {
    total: number;
    admins: number;
    staff: number;
    vendors: number;
    customers: number;
    system: number;
    verified: number;
    active: number;
    diaspora: number;
    syrian: number;
  };
  performance: {
    averageTimePerUser: number;
    batchProcessingTime: number;
    dbOperationTime: number;
    passwordHashingTime: number;
  };
  roles: {
    rolesProcessed: number;
    rolesCreated: number;
    roleResolutionTime: number;
    missingRoles: string[];
  };
}

@Injectable()
export class UserSeederService {
  private readonly logger = new Logger(UserSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ✅ SEED ALL USERS: Main seeding method with comprehensive options
   */
  async seedUsers(
    options: UserSeedOptions = {},
    adminUser?: User,
  ): Promise<UserSeedResult> {
    const startTime = Date.now();
    let queryRunner: QueryRunner | null = null;

    // Default options
    const {
      includeAdmins = true,
      includeStaff = true,
      includeVendors = true,
      includeCustomers = true,
      includeSystem = true,
      includeSpecial = false,
      clearExisting = false,
      batchSize = 20,
      validateOnly = false,
      skipDuplicates = true,
      updateExisting = false,
      specificUserTypes = [],
      specificLocations = [],
      onlyVerified = false,
      onlyActive = false,
      specificTiers = [],
      specificLanguages = [],
      hashPasswords = true,
      createMissingRoles = true,
      dryRun = false,
      validateRoles = true,
    } = options;

    this.logger.log('🌱 Starting user seeding process...');
    this.logger.debug(`Seeding options: ${JSON.stringify(options)}`);

    try {
      // Initialize transaction for data integrity
      if (!dryRun && !validateOnly) {
        queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
      }

      // Get admin user for audit trail
      const seedingUser = adminUser || (await this.getSystemUser());

      // Clear existing data if requested
      if (clearExisting && !dryRun && !validateOnly) {
        await this.clearExistingUsers(queryRunner);
      }

      // Prepare user data based on options
      const usersToSeed = this.prepareUserData({
        includeAdmins,
        includeStaff,
        includeVendors,
        includeCustomers,
        includeSystem,
        includeSpecial,
        specificUserTypes,
        specificLocations,
        onlyVerified,
        onlyActive,
        specificTiers,
        specificLanguages,
      });

      this.logger.log(`📊 Prepared ${usersToSeed.length} users for seeding`);

      // Validate roles if requested
      if (validateRoles) {
        const roleValidation = await this.validateRoles(
          usersToSeed,
          createMissingRoles,
          queryRunner,
        );
        if (!roleValidation.isValid && !createMissingRoles) {
          throw new BadRequestException(
            `Role validation failed: Missing roles: ${roleValidation.missingRoles.join(', ')}`,
          );
        }
        this.logger.log('✅ Role validation passed');
      }

      // Validate data if requested
      if (validateOnly) {
        return this.validateUserData(usersToSeed);
      }

      // Process users in batches
      const result = await this.processUsersBatch(
        usersToSeed,
        {
          batchSize,
          skipDuplicates,
          updateExisting,
          hashPasswords,
          dryRun,
        },
        seedingUser,
        queryRunner,
      );

      // Commit transaction if successful
      if (queryRunner && !dryRun) {
        await queryRunner.commitTransaction();
        this.logger.log('✅ Transaction committed successfully');
      }

      const processingTime = Date.now() - startTime;
      result.processingTimeMs = processingTime;
      result.performance.batchProcessingTime = processingTime;

      this.logger.log(
        `🎉 User seeding completed successfully in ${processingTime}ms`,
      );
      this.logger.log(
        `📈 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );

      return result;
    } catch (error: unknown) {
      // Rollback transaction on error
      if (queryRunner && !dryRun) {
        await queryRunner.rollbackTransaction();
        this.logger.error('🔄 Transaction rolled back due to error');
      }

      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ User seeding failed after ${processingTime}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        `User seeding failed: ${(error as Error).message}`,
      );
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  /**
   * ✅ SEED SPECIFIC USER TYPES: Seed only specific user groups
   */
  async seedAdminUsers(adminUser?: User): Promise<UserSeedResult> {
    return this.seedUsers(
      {
        includeAdmins: true,
        includeStaff: true,
        includeVendors: false,
        includeCustomers: false,
        includeSystem: false,
        includeSpecial: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  async seedVendorUsers(adminUser?: User): Promise<UserSeedResult> {
    return this.seedUsers(
      {
        includeAdmins: false,
        includeStaff: false,
        includeVendors: true,
        includeCustomers: false,
        includeSystem: false,
        includeSpecial: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  async seedCustomerUsers(adminUser?: User): Promise<UserSeedResult> {
    return this.seedUsers(
      {
        includeAdmins: false,
        includeStaff: false,
        includeVendors: false,
        includeCustomers: true,
        includeSystem: false,
        includeSpecial: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  async seedSystemUsers(adminUser?: User): Promise<UserSeedResult> {
    return this.seedUsers(
      {
        includeAdmins: false,
        includeStaff: false,
        includeVendors: false,
        includeCustomers: false,
        includeSystem: true,
        includeSpecial: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  /**
   * ✅ GET SEEDING STATISTICS: Comprehensive statistics about available seed data
   */
  async getSeedingStatistics(): Promise<{
    seedData: typeof USER_STATISTICS;
    database: {
      totalUsers: number;
      verifiedUsers: number;
      activeUsers: number;
      bannedUsers: number;
      suspendedUsers: number;
      adminUsers: number;
      vendorUsers: number;
      customerUsers: number;
    };
    comparison: {
      seedingProgress: number;
      missingFromDb: number;
      duplicatesInDb: number;
    };
  }> {
    const startTime = Date.now();

    try {
      // Get database statistics
      const [
        totalUsers,
        verifiedUsers,
        activeUsers,
        bannedUsers,
        suspendedUsers,
      ] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { isVerified: true } }),
        this.userRepository.count({
          where: { isBanned: false, isSuspended: false },
        }),
        this.userRepository.count({ where: { isBanned: true } }),
        this.userRepository.count({ where: { isSuspended: true } }),
      ]);

      // Count users by role type (this would need to be adjusted based on your role system)
      const adminUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .where('role.name IN (:...roleNames)', {
          roleNames: ['super_admin', 'admin'],
        })
        .getCount();

      const vendorUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .where('role.name = :roleName', { roleName: 'vendor' })
        .getCount();

      const customerUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .where('role.name = :roleName', { roleName: 'customer' })
        .getCount();

      // Calculate progress and missing data
      const seedingProgress = Math.round(
        (totalUsers / ALL_USER_SEEDS.length) * 100,
      );
      const missingFromDb = Math.max(0, ALL_USER_SEEDS.length - totalUsers);

      // Check for duplicates (users with same email)
      const duplicateCount = await this.countDuplicateUsers();

      const processingTime = Date.now() - startTime;

      this.logger.log(`📊 Statistics generated in ${processingTime}ms`);

      return {
        seedData: USER_STATISTICS,
        database: {
          totalUsers,
          verifiedUsers,
          activeUsers,
          bannedUsers,
          suspendedUsers,
          adminUsers,
          vendorUsers,
          customerUsers,
        },
        comparison: {
          seedingProgress,
          missingFromDb,
          duplicatesInDb: duplicateCount,
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to get seeding statistics: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate seeding statistics',
      );
    }
  }

  /**
   * ✅ CLEANUP USERS: Remove seeded users or all users
   */
  async cleanupUsers(
    options: {
      onlySeedData?: boolean;
      confirmationCode?: string;
      dryRun?: boolean;
      excludeAdmins?: boolean;
    } = {},
  ): Promise<{
    success: boolean;
    deletedCount: number;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    const {
      onlySeedData = true,
      confirmationCode,
      dryRun = false,
      excludeAdmins = true,
    } = options;

    // Safety check for complete deletion
    if (!onlySeedData) {
      if (confirmationCode !== 'DELETE_ALL_USERS_CONFIRMED') {
        throw new BadRequestException(
          'Complete user deletion requires confirmation code',
        );
      }
    }

    try {
      let deletedCount = 0;

      if (dryRun) {
        // Count what would be deleted
        if (onlySeedData) {
          const seedUserEmails = ALL_USER_SEEDS.map((user) => user.email);
          let totalCount = 0;
          for (const email of seedUserEmails) {
            const count = await this.userRepository.count({ where: { email } });
            totalCount += count;
          }
          deletedCount = totalCount;
        } else {
          if (excludeAdmins) {
            deletedCount = await this.userRepository
              .createQueryBuilder('user')
              .leftJoin('user.role', 'role')
              .where('role.name NOT IN (:...adminRoles)', {
                adminRoles: ['super_admin', 'admin'],
              })
              .getCount();
          } else {
            deletedCount = await this.userRepository.count();
          }
        }

        this.logger.log(`🧪 DRY RUN: Would delete ${deletedCount} users`);
      } else {
        if (onlySeedData) {
          // Delete only users that match seed data
          const seedUserEmails = ALL_USER_SEEDS.map((user) => user.email);

          for (const email of seedUserEmails) {
            const result = await this.userRepository.delete({ email });
            deletedCount += result.affected || 0;
          }
        } else {
          // Delete all users (dangerous operation)
          if (excludeAdmins) {
            const result = await this.userRepository
              .createQueryBuilder()
              .delete()
              .from(User)
              .where(
                'id NOT IN (SELECT u.id FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE r.name IN (:...adminRoles))',
                { adminRoles: ['super_admin', 'admin'] },
              )
              .execute();
            deletedCount = result.affected || 0;
          } else {
            const result = await this.userRepository.delete({});
            deletedCount = result.affected || 0;
          }
        }

        this.logger.log(`🗑️  Successfully deleted ${deletedCount} users`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        deletedCount,
        processingTimeMs: processingTime,
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ User cleanup failed after ${processingTime}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        `User cleanup failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * ✅ HEALTH CHECK: Verify seeding service health and database connectivity
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: 'connected' | 'disconnected';
    seedDataIntegrity: 'valid' | 'invalid';
    roleIntegrity: 'valid' | 'invalid';
    statistics: any;
    lastCheck: Date;
  }> {
    const startTime = Date.now();

    try {
      // Test database connectivity
      const userCount = await this.userRepository.count();

      // Test seed data integrity
      const dataValidation = this.validateSeedDataIntegrity();

      // Test role integrity
      const roleValidation = await this.validateRoles(
        ALL_USER_SEEDS,
        false,
        null,
      );

      // Get basic statistics
      const stats = await this.getSeedingStatistics();

      const processingTime = Date.now() - startTime;

      this.logger.log(`💚 Health check completed in ${processingTime}ms`);

      return {
        status: 'healthy',
        database: 'connected',
        seedDataIntegrity: dataValidation ? 'valid' : 'invalid',
        roleIntegrity: roleValidation.isValid ? 'valid' : 'invalid',
        statistics: {
          totalUsersInDb: userCount,
          seedDataAvailable: ALL_USER_SEEDS.length,
          processingTime,
        },
        lastCheck: new Date(),
      };
    } catch (error: unknown) {
      this.logger.error(`❌ Health check failed: ${(error as Error).message}`);

      return {
        status: 'unhealthy',
        database: 'disconnected',
        seedDataIntegrity: 'invalid',
        roleIntegrity: 'invalid',
        statistics: null,
        lastCheck: new Date(),
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * ✅ PREPARE USER DATA: Filter and prepare users based on options
   */
  private prepareUserData(options: {
    includeAdmins: boolean;
    includeStaff: boolean;
    includeVendors: boolean;
    includeCustomers: boolean;
    includeSystem: boolean;
    includeSpecial: boolean;
    specificUserTypes: string[];
    specificLocations: string[];
    onlyVerified: boolean;
    onlyActive: boolean;
    specificTiers: string[];
    specificLanguages: string[];
  }): UserSeedData[] {
    let users: UserSeedData[] = [];

    // Collect users based on types
    if (options.includeAdmins) users.push(...ADMIN_USERS);
    if (options.includeStaff)
      users.push(...ADMIN_USERS.filter((u) => u.userType === 'staff'));
    if (options.includeVendors) users.push(...VENDOR_USERS);
    if (options.includeCustomers) users.push(...CUSTOMER_USERS);
    if (options.includeSystem) users.push(...SYSTEM_USERS);
    if (options.includeSpecial) users.push(...SPECIAL_USERS);

    // Filter by specific user types
    if (options.specificUserTypes.length > 0) {
      users = users.filter((user) =>
        options.specificUserTypes.includes(user.userType),
      );
    }

    // Filter by specific locations
    if (options.specificLocations.length > 0) {
      users = users.filter((user) =>
        options.specificLocations.includes(user.location),
      );
    }

    // Filter by verification status
    if (options.onlyVerified) {
      users = users.filter((user) => user.isVerified);
    }

    // Filter by active status
    if (options.onlyActive) {
      users = users.filter((user) => !user.isBanned && !user.isSuspended);
    }

    // Filter by specific tiers
    if (options.specificTiers.length > 0) {
      users = users.filter((user) =>
        options.specificTiers.includes(user.accountTier),
      );
    }

    // Filter by specific languages
    if (options.specificLanguages.length > 0) {
      users = users.filter((user) =>
        options.specificLanguages.includes(user.preferredLanguage),
      );
    }

    return users;
  }

  /**
   * ✅ PROCESS USERS BATCH: Process users in batches with performance optimization
   */
  private async processUsersBatch(
    users: UserSeedData[],
    options: {
      batchSize: number;
      skipDuplicates: boolean;
      updateExisting: boolean;
      hashPasswords: boolean;
      dryRun: boolean;
    },
    adminUser: User,
    queryRunner?: QueryRunner,
  ): Promise<UserSeedResult> {
    const result: UserSeedResult = {
      success: true,
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      processingTimeMs: 0,
      errorDetails: [],
      statistics: USER_STATISTICS,
      performance: {
        averageTimePerUser: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
        passwordHashingTime: 0,
      },
      roles: {
        rolesProcessed: 0,
        rolesCreated: 0,
        roleResolutionTime: 0,
        missingRoles: [],
      },
    };

    let totalDbTime = 0;
    let totalHashingTime = 0;
    const roleResolutionTime = 0;
    const batchCount = Math.ceil(users.length / options.batchSize);

    for (let i = 0; i < batchCount; i++) {
      const batchStart = i * options.batchSize;
      const batchEnd = Math.min(batchStart + options.batchSize, users.length);
      const batch = users.slice(batchStart, batchEnd);

      this.logger.log(
        `🔄 Processing batch ${i + 1}/${batchCount} (${batch.length} users)`,
      );

      const batchStartTime = Date.now();

      for (const userData of batch) {
        try {
          const dbStartTime = Date.now();
          const hashStartTime = Date.now();

          const userResult = await this.processSingleUser(
            userData,
            {
              skipDuplicates: options.skipDuplicates,
              updateExisting: options.updateExisting,
              hashPasswords: options.hashPasswords,
              dryRun: options.dryRun,
            },
            adminUser,
            queryRunner,
          );

          const hashingTime = Date.now() - hashStartTime;
          totalHashingTime += hashingTime;
          totalDbTime += Date.now() - dbStartTime;

          // Update counters
          result.totalProcessed++;
          switch (userResult) {
            case 'created':
              result.created++;
              break;
            case 'updated':
              result.updated++;
              break;
            case 'skipped':
              result.skipped++;
              break;
          }
        } catch (error: unknown) {
          result.errors++;
          result.errorDetails.push({
            userName: userData.fullName,
            email: userData.email,
            error: (error as Error).message,
            details: (error as Error).stack,
          });

          this.logger.error(
            `❌ Failed to process user ${userData.fullName} (${userData.email}): ${(error as Error).message}`,
          );
        }
      }

      const batchTime = Date.now() - batchStartTime;
      this.logger.log(`✅ Batch ${i + 1} completed in ${batchTime}ms`);
    }

    // Calculate performance metrics
    result.performance.dbOperationTime = totalDbTime;
    result.performance.passwordHashingTime = totalHashingTime;
    result.performance.averageTimePerUser =
      result.totalProcessed > 0 ? totalDbTime / result.totalProcessed : 0;
    result.roles.roleResolutionTime = roleResolutionTime;

    return result;
  }

  /**
   * ✅ PROCESS SINGLE USER: Handle individual user creation/update with role resolution
   */
  private async processSingleUser(
    userData: UserSeedData,
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
      hashPasswords: boolean;
      dryRun: boolean;
    },
    adminUser: User,
    queryRunner?: QueryRunner,
  ): Promise<'created' | 'updated' | 'skipped'> {
    // Check for existing user by email
    const repository =
      queryRunner?.manager.getRepository(User) || this.userRepository;
    const existingUser = await repository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      if (options.skipDuplicates && !options.updateExisting) {
        this.logger.debug(`⏭️  Skipped existing user: ${userData.fullName}`);
        return 'skipped';
      }

      if (options.updateExisting) {
        if (options.dryRun) {
          this.logger.debug(
            `🧪 DRY RUN: Would update user: ${userData.fullName}`,
          );
          return 'updated';
        }

        // Update existing user
        const updateData = await this.transformSeedDataToUser(
          userData,
          options.hashPasswords,
          queryRunner,
        );
        await repository.update(existingUser.id, updateData);

        this.logger.debug(`🔄 Updated existing user: ${userData.fullName}`);
        return 'updated';
      }
    }

    if (options.dryRun) {
      this.logger.debug(`🧪 DRY RUN: Would create user: ${userData.fullName}`);
      return 'created';
    }

    // Transform seed data to user entity format
    const userEntityData = await this.transformSeedDataToUser(
      userData,
      options.hashPasswords,
      queryRunner,
    );

    // Create new user
    const newUser = repository.create(userEntityData);
    await repository.save(newUser);

    this.logger.debug(`✨ Created new user: ${userData.fullName}`);
    return 'created';
  }

  /**
   * ✅ TRANSFORM SEED DATA: Convert seed data to user entity format with role resolution
   */
  private async transformSeedDataToUser(
    seedData: UserSeedData,
    hashPasswords: boolean,
    queryRunner?: QueryRunner,
  ): Promise<Partial<User>> {
    const roleRepository =
      queryRunner?.manager.getRepository(Role) || this.roleRepository;

    // Resolve primary role
    const role = await roleRepository.findOne({
      where: { name: seedData.roleName },
    });

    if (!role) {
      throw new BadRequestException(
        `Role '${seedData.roleName}' not found for user '${seedData.fullName}'`,
      );
    }

    // Resolve assigned role if specified
    let assignedRole: Role | null = null;
    if (seedData.assignedRoleName) {
      assignedRole = await roleRepository.findOne({
        where: { name: seedData.assignedRoleName },
      });

      if (!assignedRole) {
        throw new BadRequestException(
          `Assigned role '${seedData.assignedRoleName}' not found for user '${seedData.fullName}'`,
        );
      }
    }

    // Hash password if provided and hashing is enabled
    let hashedPassword: string | undefined;
    if (seedData.passwordHash && hashPasswords) {
      hashedPassword = await bcrypt.hash(seedData.passwordHash, 10);
    }

    return {
      firebaseUid: seedData.firebaseUid,
      email: seedData.email,
      phone: seedData.phone,
      fullName: seedData.fullName,
      passwordHash: hashedPassword || seedData.passwordHash,
      isVerified: seedData.isVerified,
      role: role,
      assignedRole: assignedRole,
      lastLoginAt: seedData.lastLoginAt,
      isBanned: seedData.isBanned,
      isSuspended: seedData.isSuspended,
      metadata: seedData.metadata,
      resetPasswordToken: seedData.resetPasswordToken,
      resetPasswordExpires: seedData.resetPasswordExpires,
      failedLoginAttempts: seedData.failedLoginAttempts,
      accountLockedUntil: seedData.accountLockedUntil,
      passwordChangedAt: seedData.passwordChangedAt,
      lastActivityAt: seedData.lastActivityAt,
      banReason: seedData.banReason,
      bannedUntil: seedData.bannedUntil,
    };
  }

  /**
   * ✅ VALIDATE ROLES: Check if all required roles exist
   */
  private async validateRoles(
    users: UserSeedData[],
    createMissingRoles: boolean,
    queryRunner?: QueryRunner,
  ): Promise<{
    isValid: boolean;
    missingRoles: string[];
  }> {
    const roleRepository =
      queryRunner?.manager.getRepository(Role) || this.roleRepository;
    const requiredRoles = new Set<string>();

    // Collect all required role names
    users.forEach((user) => {
      requiredRoles.add(user.roleName);
      if (user.assignedRoleName) {
        requiredRoles.add(user.assignedRoleName);
      }
    });

    const missingRoles: string[] = [];

    // Check each role
    for (const roleName of requiredRoles) {
      const existingRole = await roleRepository.findOne({
        where: { name: roleName },
      });

      if (!existingRole) {
        if (createMissingRoles) {
          // Create missing role
          const newRole = roleRepository.create({
            name: roleName,
            description: `Auto-created role for user seeding: ${roleName}`,
            isDefault: roleName === 'customer',
            type:
              roleName.includes('admin') || roleName.includes('staff')
                ? 'admin'
                : 'business',
          });
          await roleRepository.save(newRole);
          this.logger.log(`✨ Created missing role: ${roleName}`);
        } else {
          missingRoles.push(roleName);
        }
      }
    }

    return {
      isValid: missingRoles.length === 0,
      missingRoles,
    };
  }

  /**
   * ✅ VALIDATE USER DATA: Comprehensive validation of seed data
   */
  private validateUserData(users: UserSeedData[]): UserSeedResult {
    const errors: Array<{
      userName: string;
      email: string;
      error: string;
      details?: any;
    }> = [];

    users.forEach((user) => {
      // Validate required fields
      if (!user.email) {
        errors.push({
          userName: user.fullName,
          email: user.email || 'Unknown',
          error: 'Email is required',
        });
      }

      if (!user.fullName) {
        errors.push({
          userName: user.fullName || 'Unknown',
          email: user.email,
          error: 'Full name is required',
        });
      }

      if (!user.firebaseUid) {
        errors.push({
          userName: user.fullName,
          email: user.email,
          error: 'Firebase UID is required',
        });
      }

      // Validate email format
      if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push({
          userName: user.fullName,
          email: user.email,
          error: 'Invalid email format',
        });
      }

      // Validate phone format (if provided)
      if (user.phone && !/^\+\d{1,3}-\d{1,3}-\d{6,10}$/.test(user.phone)) {
        errors.push({
          userName: user.fullName,
          email: user.email,
          error: 'Invalid phone format (expected: +country-area-number)',
        });
      }
    });

    return {
      success: errors.length === 0,
      totalProcessed: users.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: errors.length,
      processingTimeMs: 0,
      errorDetails: errors,
      statistics: USER_STATISTICS,
      performance: {
        averageTimePerUser: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
        passwordHashingTime: 0,
      },
      roles: {
        rolesProcessed: 0,
        rolesCreated: 0,
        roleResolutionTime: 0,
        missingRoles: [],
      },
    };
  }

  /**
   * ✅ VALIDATE SEED DATA INTEGRITY: Check for issues in seed data
   */
  private validateSeedDataIntegrity(): boolean {
    try {
      // Check for duplicate emails
      const emails = ALL_USER_SEEDS.map((user) => user.email);
      const uniqueEmails = new Set(emails);

      if (emails.length !== uniqueEmails.size) {
        this.logger.warn('⚠️  Duplicate emails found in seed data');
        return false;
      }

      // Check for duplicate Firebase UIDs
      const firebaseUids = ALL_USER_SEEDS.map((user) => user.firebaseUid);
      const uniqueFirebaseUids = new Set(firebaseUids);

      if (firebaseUids.length !== uniqueFirebaseUids.size) {
        this.logger.warn('⚠️  Duplicate Firebase UIDs found in seed data');
        return false;
      }

      // Validate required fields
      for (const user of ALL_USER_SEEDS) {
        if (!user.email || !user.fullName || !user.firebaseUid) {
          this.logger.warn(
            `⚠️  Invalid user data: ${user.fullName || 'Unknown'}`,
          );
          return false;
        }
      }

      return true;
    } catch (error: unknown) {
      this.logger.error(`❌ Seed data validation failed: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * ✅ GET SYSTEM USER: Get or create system user for audit trail
   */
  private async getSystemUser(): Promise<User> {
    let systemUser = await this.userRepository.findOne({
      where: { email: 'system@souqsyria.com' },
    });

    if (!systemUser) {
      // Create system user if it doesn't exist
      systemUser = this.userRepository.create({
        email: 'system@souqsyria.com',
        fullName: 'System User',
        firebaseUid: 'system-uid',
        isVerified: true,
      });
      systemUser = await this.userRepository.save(systemUser);
    }

    return systemUser;
  }

  /**
   * ✅ CLEAR EXISTING USERS: Remove all existing users (dangerous operation)
   */
  private async clearExistingUsers(queryRunner?: QueryRunner): Promise<void> {
    const repository =
      queryRunner?.manager.getRepository(User) || this.userRepository;

    const deletedCount = await repository.delete({});
    this.logger.warn(
      `🗑️  Cleared ${deletedCount.affected || 0} existing users`,
    );
  }

  /**
   * ✅ COUNT DUPLICATE USERS: Count users with duplicate emails
   */
  private async countDuplicateUsers(): Promise<number> {
    const duplicateEmails = await this.userRepository
      .createQueryBuilder('user')
      .select('user.email')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.email')
      .having('COUNT(*) > 1')
      .getRawMany();

    return duplicateEmails.length;
  }
}
