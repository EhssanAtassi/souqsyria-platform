/**
 * @file users-seeding.e2e-spec.ts
 * @description End-to-End tests for Users Seeding functionality
 *
 * FEATURES TESTED:
 * - Comprehensive user seeding with role-based creation
 * - Type-specific seeding (Admin, Staff, Vendor, Customer, System)
 * - Statistics and health monitoring
 * - Cleanup and maintenance operations
 * - Validation and dry-run capabilities
 * - Role validation and creation
 * - Syrian demographics and localization
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { UsersModule } from '../../src/users/users.module';
import { RolesModule } from '../../src/roles/roles.module';
import { AuditLogModule } from '../../src/audit-log/audit-log.module';
import { GuardsModule } from '../../src/common/guards/guards.module';
import {
  USER_STATISTICS,
  ALL_USER_SEEDS,
} from '../../src/users/seeds/user-seeds.data';

describe('Users Seeding (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: '',
          database: 'souqsyria_test',
          entities: [User, Role],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([User, Role]),
        UsersModule,
        RolesModule,
        AuditLogModule,
        GuardsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get('UserRepository');
    roleRepository = moduleFixture.get('RoleRepository');

    // Create required roles for testing
    await seedRequiredRoles();

    // Create test user
    testUser = await userRepository.save({
      email: 'test@souqsyria.com',
      fullName: 'Test User',
      firebaseUid: 'test-uid',
      isVerified: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up users before each test (keep roles)
    await userRepository.delete({});
  });

  /**
   * Helper function to create required roles
   */
  async function seedRequiredRoles(): Promise<void> {
    const requiredRoles = [
      {
        name: 'super_admin',
        description: 'Super Administrator',
        isDefault: false,
        type: 'admin',
      },
      {
        name: 'admin',
        description: 'Administrator',
        isDefault: false,
        type: 'admin',
      },
      {
        name: 'staff',
        description: 'Staff Member',
        isDefault: false,
        type: 'admin',
      },
      {
        name: 'vendor',
        description: 'Vendor/Seller',
        isDefault: false,
        type: 'business',
      },
      {
        name: 'customer',
        description: 'Customer/Buyer',
        isDefault: true,
        type: 'business',
      },
      {
        name: 'system',
        description: 'System Account',
        isDefault: false,
        type: 'admin',
      },
      {
        name: 'marketing_manager',
        description: 'Marketing Manager',
        isDefault: false,
        type: 'admin',
      },
      {
        name: 'customer_support',
        description: 'Customer Support',
        isDefault: false,
        type: 'admin',
      },
    ];

    for (const roleData of requiredRoles) {
      const existingRole = await roleRepository.findOne({
        where: { name: roleData.name },
      });
      if (!existingRole) {
        await roleRepository.save(roleData);
      }
    }
  }

  describe('GET /users/seeding/data/info', () => {
    it('should return seed data information', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/seeding/data/info')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(USER_STATISTICS);
      expect(response.body.userTypes).toHaveProperty('admins');
      expect(response.body.userTypes).toHaveProperty('vendors');
      expect(response.body.userTypes).toHaveProperty('customers');
      expect(response.body.demographics).toHaveProperty('syrian');
      expect(response.body.demographics).toHaveProperty('diaspora');
    });
  });

  describe('GET /users/seeding/statistics', () => {
    it('should return comprehensive seeding statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/seeding/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('seedData');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('comparison');
      expect(response.body.data.database.totalUsers).toBe(0);
      expect(response.body.data.comparison.seedingProgress).toBe(0);
    });
  });

  describe('POST /users/seeding/validate', () => {
    it('should validate seed data without making changes', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/validate')
        .send({
          includeAdmins: true,
          includeVendors: true,
          includeCustomers: false,
          includeSystem: false,
          validateRoles: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('success');
      expect(response.body.result.totalProcessed).toBeGreaterThan(0);
      expect(response.body.result.errors).toBe(0);

      // Ensure no users were actually created
      const userCount = await userRepository.count();
      expect(userCount).toBe(0);
    });

    it('should detect validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/validate')
        .send({
          batchSize: 500, // Too large
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /users/seeding/seed/admins', () => {
    it('should seed only admin and staff users', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed/admins')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result.created).toEqual(
        USER_STATISTICS.admins + USER_STATISTICS.staff,
      );
      expect(response.body.result.errors).toBe(0);

      // Verify in database
      const users = await userRepository.find({ relations: ['role'] });
      expect(users).toHaveLength(
        USER_STATISTICS.admins + USER_STATISTICS.staff,
      );

      // All should be admin or staff roles
      const adminUsers = users.filter((user) =>
        ['super_admin', 'admin', 'staff'].includes(user.role?.name),
      );
      expect(adminUsers).toHaveLength(
        USER_STATISTICS.admins + USER_STATISTICS.staff,
      );
    });

    it('should skip duplicates on second run', async () => {
      // First run
      await request(app.getHttpServer())
        .post('/users/seeding/seed/admins')
        .expect(200);

      // Second run
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed/admins')
        .expect(200);

      expect(response.body.result.created).toBe(0);
      expect(response.body.result.skipped).toEqual(
        USER_STATISTICS.admins + USER_STATISTICS.staff,
      );

      // Verify no duplicates in database
      const users = await userRepository.find();
      expect(users).toHaveLength(
        USER_STATISTICS.admins + USER_STATISTICS.staff,
      );
    });
  });

  describe('POST /users/seeding/seed/vendors', () => {
    it('should seed vendor users', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed/vendors')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(USER_STATISTICS.vendors);
      expect(response.body.result.errors).toBe(0);

      // Verify vendor users in database
      const vendorUsers = await userRepository.find({
        where: { role: { name: 'vendor' } },
        relations: ['role'],
      });
      expect(vendorUsers).toHaveLength(USER_STATISTICS.vendors);

      // Verify Syrian business metadata
      const electronicsVendor = vendorUsers.find(
        (user) => user.email === 'vendor.electronics@souqsyria.com',
      );
      expect(electronicsVendor).toBeTruthy();
      expect(electronicsVendor.metadata).toHaveProperty('businessName');
      expect(electronicsVendor.metadata).toHaveProperty('taxId');
      expect(electronicsVendor.metadata.businessType).toBe('electronics');
    });
  });

  describe('POST /users/seeding/seed/customers', () => {
    it('should seed customer users including diaspora', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed/customers')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(USER_STATISTICS.customers);
      expect(response.body.result.errors).toBe(0);

      // Verify customer users in database
      const customerUsers = await userRepository.find({
        where: { role: { name: 'customer' } },
        relations: ['role'],
      });
      expect(customerUsers).toHaveLength(USER_STATISTICS.customers);

      // Verify diaspora customer
      const diasporaCustomer = customerUsers.find(
        (user) => user.email === 'customer.germany@example.com',
      );
      expect(diasporaCustomer).toBeTruthy();
      expect(diasporaCustomer.metadata).toHaveProperty(
        'diasporaCountry',
        'Germany',
      );
      expect(diasporaCustomer.metadata).toHaveProperty('yearsAbroad', 5);
    });
  });

  describe('POST /users/seeding/seed/system', () => {
    it('should seed system users', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed/system')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(USER_STATISTICS.system);
      expect(response.body.result.errors).toBe(0);

      // Verify system users in database
      const systemUsers = await userRepository.find({
        where: { role: { name: 'system' } },
        relations: ['role'],
      });
      expect(systemUsers).toHaveLength(USER_STATISTICS.system);

      // Verify system bot
      const systemBot = systemUsers.find(
        (user) => user.email === 'system@souqsyria.com',
      );
      expect(systemBot).toBeTruthy();
      expect(systemBot.metadata).toHaveProperty('type', 'system_bot');
      expect(systemBot.metadata).toHaveProperty('canProcessPayments', true);
    });
  });

  describe('POST /users/seeding/seed (Full Seeding)', () => {
    it('should seed all user types with proper roles', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed')
        .send({
          includeAdmins: true,
          includeVendors: true,
          includeCustomers: true,
          includeSystem: true,
          includeSpecial: false, // Exclude special users for normal test
          validateRoles: true,
          createMissingRoles: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toEqual(
        USER_STATISTICS.admins +
          USER_STATISTICS.staff +
          USER_STATISTICS.vendors +
          USER_STATISTICS.customers +
          USER_STATISTICS.system,
      );
      expect(response.body.result.errors).toBe(0);
      expect(response.body.result.roles.rolesProcessed).toBeGreaterThan(0);

      // Verify role distribution
      const adminUsers = await userRepository.count({
        where: { role: { name: 'super_admin' } },
        relations: ['role'],
      });
      const vendorUsers = await userRepository.count({
        where: { role: { name: 'vendor' } },
        relations: ['role'],
      });
      const customerUsers = await userRepository.count({
        where: { role: { name: 'customer' } },
        relations: ['role'],
      });

      expect(adminUsers).toBeGreaterThan(0);
      expect(vendorUsers).toBe(USER_STATISTICS.vendors);
      expect(customerUsers).toBe(USER_STATISTICS.customers);
    });

    it('should support dry run without creating records', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed')
        .send({
          dryRun: true,
          validateRoles: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.totalProcessed).toEqual(
        USER_STATISTICS.total,
      );
      expect(response.body.result.errors).toBe(0);

      // Verify no users were created
      const userCount = await userRepository.count();
      expect(userCount).toBe(0);
    });

    it('should support filtering by location', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed')
        .send({
          specificLocations: ['Damascus', 'Aleppo'],
          includeAdmins: false,
          includeSystem: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBeGreaterThan(0);
      expect(response.body.result.created).toBeLessThan(USER_STATISTICS.total);

      // Verify only Damascus and Aleppo users were created
      const users = await userRepository.find();
      for (const user of users) {
        expect(['Damascus', 'Aleppo']).toContain(
          user.metadata?.location || 'Unknown',
        );
      }
    });

    it('should support filtering by verified status', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed')
        .send({
          onlyVerified: true,
          includeSpecial: true, // Include special users to test unverified filtering
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBeGreaterThan(0);

      // Verify only verified users were created
      const users = await userRepository.find();
      for (const user of users) {
        expect(user.isVerified).toBe(true);
      }
    });
  });

  describe('GET /users/seeding/users/preview', () => {
    it('should return user preview by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/seeding/users/preview')
        .query({ userType: 'vendor' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.statistics.userTypeDistribution).toHaveProperty(
        'vendor',
      );

      // All returned users should be vendors
      for (const user of response.body.users) {
        expect(user.userType).toBe('vendor');
      }
    });

    it('should return user preview by location', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/seeding/users/preview')
        .query({ location: 'Damascus' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.statistics.locationDistribution).toHaveProperty(
        'Damascus',
      );

      // All returned users should be from Damascus
      for (const user of response.body.users) {
        expect(user.location).toBe('Damascus');
      }
    });
  });

  describe('DELETE /users/seeding/cleanup', () => {
    beforeEach(async () => {
      // Seed some users first
      await request(app.getHttpServer()).post('/users/seeding/seed').send({
        includeAdmins: true,
        includeVendors: true,
        includeCustomers: false,
        includeSystem: false,
        includeSpecial: false,
      });
    });

    it('should support dry run cleanup', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/seeding/cleanup')
        .query({ dryRun: true, onlySeedData: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBeGreaterThan(0);
      expect(response.body.message).toContain('Would delete');

      // Verify users still exist
      const userCount = await userRepository.count();
      expect(userCount).toBeGreaterThan(0);
    });

    it('should cleanup seed data users', async () => {
      const initialCount = await userRepository.count();
      expect(initialCount).toBeGreaterThan(0);

      const response = await request(app.getHttpServer())
        .delete('/users/seeding/cleanup')
        .query({ onlySeedData: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBe(initialCount);

      // Verify users were deleted
      const finalCount = await userRepository.count();
      expect(finalCount).toBe(0);
    });

    it('should require confirmation for complete deletion', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/seeding/cleanup')
        .query({ onlySeedData: false })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('confirmation code');
    });

    it('should perform complete deletion with confirmation', async () => {
      // Add a non-seed user
      await userRepository.save({
        email: 'custom.user@example.com',
        fullName: 'Custom User',
        firebaseUid: 'custom-uid',
        isVerified: true,
      });

      const initialCount = await userRepository.count();

      const response = await request(app.getHttpServer())
        .delete('/users/seeding/cleanup')
        .query({
          onlySeedData: false,
          confirmationCode: 'DELETE_ALL_USERS_CONFIRMED',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBe(initialCount);
      expect(response.body).toHaveProperty('warning');

      // Verify all users were deleted
      const finalCount = await userRepository.count();
      expect(finalCount).toBe(0);
    });
  });

  describe('GET /users/seeding/health', () => {
    it('should return healthy status when everything is working', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/seeding/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('seedDataIntegrity', 'valid');
      expect(response.body).toHaveProperty('roleIntegrity', 'valid');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('lastCheck');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid seeding options', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed')
        .send({
          batchSize: 500, // Too large
          specificTiers: ['invalid-tier'], // Invalid tier
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle missing roles gracefully', async () => {
      // Delete a required role
      await roleRepository.delete({ name: 'vendor' });

      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed/vendors')
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Performance Tests', () => {
    it('should complete seeding within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed')
        .send({
          batchSize: 10, // Small batch for testing
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.result.processingTimeMs).toBeLessThan(30000); // 30 seconds max
      expect(duration).toBeLessThan(35000); // Including HTTP overhead

      // Verify performance metrics are returned
      expect(response.body.result.performance).toHaveProperty(
        'averageTimePerUser',
      );
      expect(response.body.result.performance).toHaveProperty(
        'batchProcessingTime',
      );
      expect(response.body.result.performance).toHaveProperty(
        'dbOperationTime',
      );
      expect(response.body.result.performance).toHaveProperty(
        'passwordHashingTime',
      );
    });

    it('should handle batch processing correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/seeding/seed')
        .send({
          batchSize: 5,
        })
        .expect(200);

      expect(response.body.result.created).toEqual(USER_STATISTICS.total);
      expect(response.body.result.errors).toBe(0);

      // Verify all users were created despite small batch size
      const userCount = await userRepository.count();
      expect(userCount).toEqual(USER_STATISTICS.total);
    });
  });

  describe('Syrian Localization', () => {
    it('should seed users with proper Arabic names', async () => {
      await request(app.getHttpServer())
        .post('/users/seeding/seed/admins')
        .expect(200);

      const adminUser = await userRepository.findOne({
        where: { email: 'admin@souqsyria.com' },
      });

      expect(adminUser.fullName).toBe('محمد العلي - Mohammed Al-Ali');
      expect(adminUser.phone).toBe('+963-11-1234567');
      expect(adminUser.metadata.department).toBe('IT');
    });

    it('should handle Syrian phone number formats', async () => {
      await request(app.getHttpServer())
        .post('/users/seeding/seed/customers')
        .expect(200);

      const syrianCustomer = await userRepository.findOne({
        where: { email: 'customer.damascus@example.com' },
      });

      expect(syrianCustomer.phone).toMatch(/^\+963-\d{2}-\d{7}$/);
      expect(syrianCustomer.fullName).toContain('نور الهدى محمد');
    });

    it('should handle diaspora user preferences', async () => {
      await request(app.getHttpServer())
        .post('/users/seeding/seed/customers')
        .expect(200);

      const diasporaUser = await userRepository.findOne({
        where: { email: 'customer.germany@example.com' },
      });

      expect(diasporaUser.metadata.diasporaCountry).toBe('Germany');
      expect(diasporaUser.metadata.diasporaCity).toBe('Berlin');
      expect(diasporaUser.metadata.yearsAbroad).toBe(5);
      expect(diasporaUser.metadata.shippingPreference).toBe(
        'international_express',
      );
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate vendor business metadata', async () => {
      await request(app.getHttpServer())
        .post('/users/seeding/seed/vendors')
        .expect(200);

      const vendor = await userRepository.findOne({
        where: { email: 'vendor.electronics@souqsyria.com' },
      });

      // Verify Syrian business compliance
      expect(vendor.metadata.taxId).toMatch(/^SY-TAX-\d+$/);
      expect(vendor.metadata.commercialLicense).toMatch(/^CL-[A-Z]{3}-\d+$/);
      expect(vendor.metadata.bankAccount).toMatch(/^SY-BANK-\d+$/);
      expect(vendor.metadata.monthlyRevenue).toBeGreaterThan(0);
      expect(vendor.metadata.rating).toBeGreaterThanOrEqual(4.0);
    });

    it('should validate customer loyalty data', async () => {
      await request(app.getHttpServer())
        .post('/users/seeding/seed/customers')
        .expect(200);

      const customer = await userRepository.findOne({
        where: { email: 'customer.damascus@example.com' },
      });

      expect(customer.metadata.totalOrders).toBeGreaterThan(0);
      expect(customer.metadata.totalSpent).toBeGreaterThan(0);
      expect(customer.metadata.loyaltyPoints).toBeGreaterThan(0);
      expect(customer.metadata.favoriteCategories).toBeInstanceOf(Array);
      expect(customer.metadata.preferredPaymentMethod).toBeTruthy();
    });

    it('should validate system user permissions', async () => {
      await request(app.getHttpServer())
        .post('/users/seeding/seed/system')
        .expect(200);

      const systemBot = await userRepository.findOne({
        where: { email: 'system@souqsyria.com' },
      });

      expect(systemBot.metadata.type).toBe('system_bot');
      expect(systemBot.metadata.canProcessPayments).toBe(true);
      expect(systemBot.metadata.canSendNotifications).toBe(true);
      expect(systemBot.metadata.canUpdateInventory).toBe(true);
    });
  });
});
