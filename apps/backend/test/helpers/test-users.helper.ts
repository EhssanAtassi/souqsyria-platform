/**
 * @file test-users.helper.ts
 * @description Test user creation utilities for integration tests
 *
 * Provides factory methods to create test users with different role combinations:
 * - Business roles: buyer, vendor
 * - Admin roles: admin, moderator, support
 *
 * DUAL-ROLE ARCHITECTURE:
 * - User.role: Business role (buyer, vendor)
 * - User.assignedRole: Admin role (admin, moderator, support)
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @since 2025-01-23
 */

import { Repository } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Role } from '../../src/roles/entities/role.entity';

/**
 * Enum defining test user types with different role combinations
 * Used to create users with specific business and admin role assignments
 */
export enum TestUserType {
  // Business role only (no admin role)
  BUYER_ONLY = 'BUYER_ONLY',
  VENDOR_ONLY = 'VENDOR_ONLY',

  // Admin role only (with buyer business role as default)
  ADMIN_ONLY = 'ADMIN_ONLY',
  MODERATOR_ONLY = 'MODERATOR_ONLY',
  SUPPORT_ONLY = 'SUPPORT_ONLY',

  // Buyer + Admin combinations
  BUYER_ADMIN = 'BUYER_ADMIN',
  BUYER_MODERATOR = 'BUYER_MODERATOR',
  BUYER_SUPPORT = 'BUYER_SUPPORT',

  // Vendor + Admin combinations
  VENDOR_ADMIN = 'VENDOR_ADMIN',
  VENDOR_MODERATOR = 'VENDOR_MODERATOR',
  VENDOR_SUPPORT = 'VENDOR_SUPPORT',
}

/**
 * Interface for test user creation options
 */
export interface CreateTestUserOptions {
  /** Custom email address */
  email?: string;
  /** Custom full name */
  fullName?: string;
  /** Firebase UID override */
  firebaseUid?: string;
  /** Whether the user is verified */
  isVerified?: boolean;
  /** Whether the user is banned */
  isBanned?: boolean;
  /** Whether the user is suspended */
  isSuspended?: boolean;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Interface for roles structure passed to the factory
 */
export interface TestRolesInput {
  buyer: Role;
  vendor: Role;
  admin: Role;
  moderator: Role;
  support: Role;
}

/**
 * TestUserFactory
 *
 * Factory class for creating test users with different role combinations.
 * Provides methods to create users for various test scenarios including:
 * - Users with business roles only
 * - Users with admin roles only
 * - Users with dual roles (business + admin)
 *
 * @example
 * ```typescript
 * const factory = new TestUserFactory(userRepository, roleRepository);
 *
 * // Create a buyer with no admin role
 * const buyer = await factory.createUser(TestUserType.BUYER_ONLY, roles);
 *
 * // Create a vendor with admin role
 * const vendorAdmin = await factory.createUser(TestUserType.VENDOR_ADMIN, roles);
 * ```
 */
export class TestUserFactory {
  /** Counter for unique user identification */
  private userCounter = 0;

  constructor(
    private readonly userRepository: Repository<User>,
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Create a test user with specified role combination
   *
   * @param type - The type of user to create (role combination)
   * @param roles - Available roles to assign
   * @param options - Additional user options
   * @returns Created User entity
   *
   * @example
   * ```typescript
   * // Create buyer with moderator admin role
   * const user = await factory.createUser(
   *   TestUserType.BUYER_MODERATOR,
   *   roles,
   *   { email: 'custom@test.com' }
   * );
   * ```
   */
  async createUser(
    type: TestUserType,
    roles: TestRolesInput,
    options: CreateTestUserOptions = {},
  ): Promise<User> {
    this.userCounter++;

    // Determine roles based on type
    const { businessRole, adminRole } = this.getRolesForType(type, roles);

    // Generate unique identifiers
    const uniqueId = `${Date.now()}-${this.userCounter}`;
    const email = options.email || `test-user-${uniqueId}@souqsyria.test`;
    const firebaseUid = options.firebaseUid || `firebase-${uniqueId}`;
    const fullName = options.fullName || `Test User ${this.userCounter}`;

    // Create user entity
    const user = this.userRepository.create({
      email,
      firebaseUid,
      fullName,
      passwordHash: 'test-password-hash',
      isVerified: options.isVerified ?? true,
      isBanned: options.isBanned ?? false,
      isSuspended: options.isSuspended ?? false,
      role: businessRole,
      assignedRole: adminRole,
      metadata: options.metadata || {},
    });

    return this.userRepository.save(user);
  }

  /**
   * Create multiple test users of the same type
   *
   * @param count - Number of users to create
   * @param type - The type of user to create
   * @param roles - Available roles to assign
   * @returns Array of created User entities
   */
  async createUsers(
    count: number,
    type: TestUserType,
    roles: TestRolesInput,
  ): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createUser(type, roles);
      users.push(user);
    }
    return users;
  }

  /**
   * Create a complete set of test users (one of each type)
   *
   * @param roles - Available roles to assign
   * @returns Map of TestUserType to User
   */
  async createAllUserTypes(
    roles: TestRolesInput,
  ): Promise<Map<TestUserType, User>> {
    const users = new Map<TestUserType, User>();

    for (const type of Object.values(TestUserType)) {
      const user = await this.createUser(type, roles);
      users.set(type, user);
    }

    return users;
  }

  /**
   * Determine business and admin roles based on user type
   *
   * @param type - The user type
   * @param roles - Available roles
   * @returns Object containing business and admin roles
   */
  private getRolesForType(
    type: TestUserType,
    roles: TestRolesInput,
  ): { businessRole: Role; adminRole: Role | null } {
    switch (type) {
      // Business role only
      case TestUserType.BUYER_ONLY:
        return { businessRole: roles.buyer, adminRole: null };
      case TestUserType.VENDOR_ONLY:
        return { businessRole: roles.vendor, adminRole: null };

      // Admin role only (with buyer as default business role)
      case TestUserType.ADMIN_ONLY:
        return { businessRole: roles.buyer, adminRole: roles.admin };
      case TestUserType.MODERATOR_ONLY:
        return { businessRole: roles.buyer, adminRole: roles.moderator };
      case TestUserType.SUPPORT_ONLY:
        return { businessRole: roles.buyer, adminRole: roles.support };

      // Buyer + Admin combinations
      case TestUserType.BUYER_ADMIN:
        return { businessRole: roles.buyer, adminRole: roles.admin };
      case TestUserType.BUYER_MODERATOR:
        return { businessRole: roles.buyer, adminRole: roles.moderator };
      case TestUserType.BUYER_SUPPORT:
        return { businessRole: roles.buyer, adminRole: roles.support };

      // Vendor + Admin combinations
      case TestUserType.VENDOR_ADMIN:
        return { businessRole: roles.vendor, adminRole: roles.admin };
      case TestUserType.VENDOR_MODERATOR:
        return { businessRole: roles.vendor, adminRole: roles.moderator };
      case TestUserType.VENDOR_SUPPORT:
        return { businessRole: roles.vendor, adminRole: roles.support };

      default:
        throw new Error(`Unknown user type: ${type}`);
    }
  }

  /**
   * Ban a test user
   *
   * @param user - User to ban
   * @param reason - Optional ban reason
   * @returns Updated User entity
   */
  async banUser(user: User, reason?: string): Promise<User> {
    user.isBanned = true;
    user.banReason = reason || 'Test ban';
    return this.userRepository.save(user);
  }

  /**
   * Suspend a test user
   *
   * @param user - User to suspend
   * @returns Updated User entity
   */
  async suspendUser(user: User): Promise<User> {
    user.isSuspended = true;
    return this.userRepository.save(user);
  }

  /**
   * Change user's business role
   *
   * @param user - User to update
   * @param newRole - New business role
   * @returns Updated User entity
   */
  async changeBusinessRole(user: User, newRole: Role): Promise<User> {
    user.role = newRole;
    return this.userRepository.save(user);
  }

  /**
   * Change user's admin role
   *
   * @param user - User to update
   * @param newRole - New admin role (or null to remove)
   * @returns Updated User entity
   */
  async changeAdminRole(user: User, newRole: Role | null): Promise<User> {
    user.assignedRole = newRole;
    return this.userRepository.save(user);
  }

  /**
   * Reset the user counter (useful for test isolation)
   */
  resetCounter(): void {
    this.userCounter = 0;
  }
}

/**
 * Helper function to create a single test user without instantiating the factory
 * Useful for quick one-off user creation in tests
 */
export async function createTestUser(
  userRepository: Repository<User>,
  type: TestUserType,
  roles: TestRolesInput,
  options: CreateTestUserOptions = {},
): Promise<User> {
  const factory = new TestUserFactory(userRepository, null);
  return factory.createUser(type, roles, options);
}
