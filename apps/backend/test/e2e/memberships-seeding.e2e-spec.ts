/**
 * @file memberships-seeding.e2e-spec.ts
 * @description End-to-End tests for Memberships Seeding functionality
 *
 * FEATURES TESTED:
 * - Comprehensive membership seeding with tier-based creation
 * - Type-specific seeding (Basic, Premium, VIP, Enterprise, Special)
 * - Statistics and health monitoring
 * - Cleanup and maintenance operations
 * - Validation and dry-run capabilities
 * - Feature validation and business type filtering
 * - Syrian business model integration
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { Membership } from '../../src/memberships/entities/membership.entity';
import { User } from '../../src/users/entities/user.entity';
import { MembershipsModule } from '../../src/memberships/memberships.module';
import { UsersModule } from '../../src/users/users.module';
import { AuditLogModule } from '../../src/audit-log/audit-log.module';
import { GuardsModule } from '../../src/common/guards/guards.module';
import {
  MEMBERSHIP_STATISTICS,
  ALL_MEMBERSHIP_SEEDS,
} from '../../src/memberships/seeds/membership-seeds.data';

describe('Memberships Seeding (e2e)', () => {
  let app: INestApplication;
  let membershipRepository: Repository<Membership>;
  let userRepository: Repository<User>;
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
          entities: [Membership, User],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Membership, User]),
        MembershipsModule,
        UsersModule,
        AuditLogModule,
        GuardsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    membershipRepository = moduleFixture.get('MembershipRepository');
    userRepository = moduleFixture.get('UserRepository');

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
    // Clean up memberships before each test
    await membershipRepository.delete({});
  });

  describe('GET /memberships/seeding/data/info', () => {
    it('should return seed data information', async () => {
      const response = await request(app.getHttpServer())
        .get('/memberships/seeding/data/info')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(MEMBERSHIP_STATISTICS);
      expect(response.body.membershipTiers).toHaveProperty('basic');
      expect(response.body.membershipTiers).toHaveProperty('premium');
      expect(response.body.membershipTiers).toHaveProperty('vip');
      expect(response.body.membershipTiers).toHaveProperty('enterprise');
      expect(response.body.businessTypes).toHaveProperty('individual');
      expect(response.body.features).toHaveProperty('withTaxReporting');
    });
  });

  describe('GET /memberships/seeding/statistics', () => {
    it('should return comprehensive seeding statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/memberships/seeding/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('seedData');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('comparison');
      expect(response.body.data.database.totalMemberships).toBe(0);
      expect(response.body.data.comparison.seedingProgress).toBe(0);
    });
  });

  describe('POST /memberships/seeding/validate', () => {
    it('should validate seed data without making changes', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/validate')
        .send({
          includeBasic: true,
          includePremium: true,
          includeVip: false,
          includeEnterprise: false,
          includeSpecial: false,
          validateFeatures: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('success');
      expect(response.body.result.totalProcessed).toBeGreaterThan(0);
      expect(response.body.result.errors).toBe(0);

      // Ensure no memberships were actually created
      const membershipCount = await membershipRepository.count();
      expect(membershipCount).toBe(0);
    });

    it('should detect validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/validate')
        .send({
          batchSize: 500, // Too large
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /memberships/seeding/seed/basic', () => {
    it('should seed only basic membership plans', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed/basic')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result.created).toEqual(MEMBERSHIP_STATISTICS.basic);
      expect(response.body.result.errors).toBe(0);

      // Verify in database
      const memberships = await membershipRepository.find();
      expect(memberships).toHaveLength(MEMBERSHIP_STATISTICS.basic);

      // All should be basic plans (name contains 'basic')
      const basicMemberships = memberships.filter((membership) =>
        membership.name.toLowerCase().includes('basic'),
      );
      expect(basicMemberships).toHaveLength(MEMBERSHIP_STATISTICS.basic);
    });

    it('should skip duplicates on second run', async () => {
      // First run
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed/basic')
        .expect(200);

      // Second run
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed/basic')
        .expect(200);

      expect(response.body.result.created).toBe(0);
      expect(response.body.result.skipped).toEqual(MEMBERSHIP_STATISTICS.basic);

      // Verify no duplicates in database
      const memberships = await membershipRepository.find();
      expect(memberships).toHaveLength(MEMBERSHIP_STATISTICS.basic);
    });
  });

  describe('POST /memberships/seeding/seed/premium', () => {
    it('should seed premium membership plans', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed/premium')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(MEMBERSHIP_STATISTICS.premium);
      expect(response.body.result.errors).toBe(0);

      // Verify premium memberships in database
      const premiumMemberships = await membershipRepository.find();
      expect(premiumMemberships).toHaveLength(MEMBERSHIP_STATISTICS.premium);

      // Verify Syrian business features
      const premiumMonthly = premiumMemberships.find(
        (membership) => membership.name === 'Premium Monthly',
      );
      expect(premiumMonthly).toBeTruthy();
      expect(premiumMonthly.price).toBe(150000); // 150,000 SYP
      expect(premiumMonthly.maxProducts).toBe(200);
      expect(premiumMonthly.commissionDiscount).toBe(5);
    });
  });

  describe('POST /memberships/seeding/seed/vip', () => {
    it('should seed VIP membership plans', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed/vip')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(MEMBERSHIP_STATISTICS.vip);
      expect(response.body.result.errors).toBe(0);

      // Verify VIP memberships in database
      const vipMemberships = await membershipRepository.find();
      expect(vipMemberships).toHaveLength(MEMBERSHIP_STATISTICS.vip);

      // Verify VIP features
      const vipMonthly = vipMemberships.find(
        (membership) => membership.name === 'VIP Monthly',
      );
      expect(vipMonthly).toBeTruthy();
      expect(vipMonthly.price).toBe(400000); // 400,000 SYP
      expect(vipMonthly.maxProducts).toBe(1000);
      expect(vipMonthly.commissionDiscount).toBe(12);
      expect(vipMonthly.prioritySupport).toBe(true);
    });
  });

  describe('POST /memberships/seeding/seed/enterprise', () => {
    it('should seed enterprise membership plans', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed/enterprise')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(
        MEMBERSHIP_STATISTICS.enterprise,
      );
      expect(response.body.result.errors).toBe(0);

      // Verify enterprise memberships in database
      const enterpriseMemberships = await membershipRepository.find();
      expect(enterpriseMemberships).toHaveLength(
        MEMBERSHIP_STATISTICS.enterprise,
      );

      // Verify enterprise features
      const enterprise = enterpriseMemberships.find(
        (membership) => membership.name === 'Enterprise',
      );
      expect(enterprise).toBeTruthy();
      expect(enterprise.price).toBe(10000000); // 10,000,000 SYP
      expect(enterprise.maxProducts).toBeNull(); // Unlimited
      expect(enterprise.commissionDiscount).toBe(20);
      expect(enterprise.prioritySupport).toBe(true);
    });
  });

  describe('POST /memberships/seeding/seed/special', () => {
    it('should seed special membership plans', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed/special')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(MEMBERSHIP_STATISTICS.special);
      expect(response.body.result.errors).toBe(0);

      // Verify special memberships in database
      const specialMemberships = await membershipRepository.find();
      expect(specialMemberships).toHaveLength(MEMBERSHIP_STATISTICS.special);

      // Verify trial membership
      const trial = specialMemberships.find(
        (membership) => membership.name === 'Trial',
      );
      expect(trial).toBeTruthy();
      expect(trial.price).toBe(0); // Free trial
      expect(trial.durationInDays).toBe(14);
      expect(trial.maxProducts).toBe(10);

      // Verify student membership
      const student = specialMemberships.find(
        (membership) => membership.name === 'Student',
      );
      expect(student).toBeTruthy();
      expect(student.price).toBe(25000); // 25,000 SYP (50% off basic)
      expect(student.maxProducts).toBe(30);
    });
  });

  describe('POST /memberships/seeding/seed (Full Seeding)', () => {
    it('should seed all membership types with proper tiers', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          includeBasic: true,
          includePremium: true,
          includeVip: true,
          includeEnterprise: true,
          includeSpecial: false, // Exclude special for normal test
          validateFeatures: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toEqual(
        MEMBERSHIP_STATISTICS.basic +
          MEMBERSHIP_STATISTICS.premium +
          MEMBERSHIP_STATISTICS.vip +
          MEMBERSHIP_STATISTICS.enterprise,
      );
      expect(response.body.result.errors).toBe(0);
      expect(response.body.result.features.featuresProcessed).toBeGreaterThan(
        0,
      );

      // Verify tier distribution
      const basicMemberships = await membershipRepository
        .createQueryBuilder('membership')
        .where('LOWER(membership.name) LIKE :pattern', { pattern: '%basic%' })
        .getCount();

      const premiumMemberships = await membershipRepository
        .createQueryBuilder('membership')
        .where('LOWER(membership.name) LIKE :pattern', { pattern: '%premium%' })
        .getCount();

      expect(basicMemberships).toBe(MEMBERSHIP_STATISTICS.basic);
      expect(premiumMemberships).toBe(MEMBERSHIP_STATISTICS.premium);
    });

    it('should support dry run without creating records', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          dryRun: true,
          validateFeatures: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.totalProcessed).toEqual(
        MEMBERSHIP_STATISTICS.total,
      );
      expect(response.body.result.errors).toBe(0);

      // Verify no memberships were created
      const membershipCount = await membershipRepository.count();
      expect(membershipCount).toBe(0);
    });

    it('should support filtering by business type', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          specificBusinessTypes: ['individual', 'small_business'],
          includeEnterprise: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBeGreaterThan(0);
      expect(response.body.result.created).toBeLessThan(
        MEMBERSHIP_STATISTICS.total,
      );

      // All created memberships should be for individual or small business
      const memberships = await membershipRepository.find();
      // Note: The current entity doesn't store businessType, but we can verify by price ranges
      // Individual/small business memberships typically have lower prices
      const affordableMemberships = memberships.filter(
        (m) => m.price <= 2000000,
      ); // Under 2M SYP
      expect(affordableMemberships.length).toBeGreaterThan(0);
    });

    it('should support filtering by duration', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          specificDurations: [365], // Only yearly plans
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBeGreaterThan(0);

      // Verify only yearly memberships were created
      const memberships = await membershipRepository.find();
      for (const membership of memberships) {
        expect(membership.durationInDays).toBe(365);
      }
    });

    it('should support price range filtering', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          priceRangeMin: 100000, // 100K SYP
          priceRangeMax: 1000000, // 1M SYP
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBeGreaterThan(0);

      // Verify only memberships in price range were created
      const memberships = await membershipRepository.find();
      for (const membership of memberships) {
        expect(membership.price).toBeGreaterThanOrEqual(100000);
        expect(membership.price).toBeLessThanOrEqual(1000000);
      }
    });
  });

  describe('GET /memberships/seeding/memberships/preview', () => {
    it('should return membership preview by tier', async () => {
      const response = await request(app.getHttpServer())
        .get('/memberships/seeding/memberships/preview')
        .query({ tier: 'premium' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('memberships');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.memberships).toBeInstanceOf(Array);
      expect(response.body.statistics.tierDistribution).toHaveProperty(
        'premium',
      );

      // All returned memberships should be premium
      for (const membership of response.body.memberships) {
        expect(membership.name.toLowerCase()).toContain('premium');
      }
    });

    it('should return membership preview by business type', async () => {
      const response = await request(app.getHttpServer())
        .get('/memberships/seeding/memberships/preview')
        .query({ businessType: 'individual' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.statistics.businessTypeDistribution).toHaveProperty(
        'individual',
      );

      // All returned memberships should be for individuals
      for (const membership of response.body.memberships) {
        expect(membership.businessType).toBe('individual');
      }
    });

    it('should return membership preview by duration', async () => {
      const response = await request(app.getHttpServer())
        .get('/memberships/seeding/memberships/preview')
        .query({ duration: 365 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.statistics.durationDistribution).toHaveProperty(
        '365 days',
      );

      // All returned memberships should be yearly
      for (const membership of response.body.memberships) {
        expect(membership.durationInDays).toBe(365);
      }
    });
  });

  describe('DELETE /memberships/seeding/cleanup', () => {
    beforeEach(async () => {
      // Seed some memberships first
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          includeBasic: true,
          includePremium: true,
          includeVip: false,
          includeEnterprise: false,
          includeSpecial: false,
        });
    });

    it('should support dry run cleanup', async () => {
      const response = await request(app.getHttpServer())
        .delete('/memberships/seeding/cleanup')
        .query({ dryRun: true, onlySeedData: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBeGreaterThan(0);
      expect(response.body.message).toContain('Would delete');

      // Verify memberships still exist
      const membershipCount = await membershipRepository.count();
      expect(membershipCount).toBeGreaterThan(0);
    });

    it('should cleanup seed data memberships', async () => {
      const initialCount = await membershipRepository.count();
      expect(initialCount).toBeGreaterThan(0);

      const response = await request(app.getHttpServer())
        .delete('/memberships/seeding/cleanup')
        .query({ onlySeedData: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBe(initialCount);

      // Verify memberships were deleted
      const finalCount = await membershipRepository.count();
      expect(finalCount).toBe(0);
    });

    it('should require confirmation for complete deletion', async () => {
      const response = await request(app.getHttpServer())
        .delete('/memberships/seeding/cleanup')
        .query({ onlySeedData: false })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('confirmation code');
    });

    it('should perform complete deletion with confirmation', async () => {
      // Add a non-seed membership
      await membershipRepository.save({
        name: 'Custom Membership',
        price: 75000,
        durationInDays: 90,
        maxProducts: 25,
        maxImagesPerProduct: 8,
        prioritySupport: false,
        commissionDiscount: 3,
      });

      const initialCount = await membershipRepository.count();

      const response = await request(app.getHttpServer())
        .delete('/memberships/seeding/cleanup')
        .query({
          onlySeedData: false,
          confirmationCode: 'DELETE_ALL_MEMBERSHIPS_CONFIRMED',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBe(initialCount);
      expect(response.body).toHaveProperty('warning');

      // Verify all memberships were deleted
      const finalCount = await membershipRepository.count();
      expect(finalCount).toBe(0);
    });
  });

  describe('GET /memberships/seeding/health', () => {
    it('should return healthy status when everything is working', async () => {
      const response = await request(app.getHttpServer())
        .get('/memberships/seeding/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('seedDataIntegrity', 'valid');
      expect(response.body).toHaveProperty('featureIntegrity', 'valid');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('lastCheck');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid seeding options', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          batchSize: 500, // Too large
          priceRangeMin: -1000, // Invalid
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle feature validation failures', async () => {
      // This would test custom invalid feature data
      // For this test, we'll test with invalid specific features
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          specificFeatures: ['invalidFeature'],
          validateFeatures: true,
        })
        .expect(200); // Will succeed but filter out all memberships

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should complete seeding within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          batchSize: 5, // Small batch for testing
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.result.processingTimeMs).toBeLessThan(15000); // 15 seconds max
      expect(duration).toBeLessThan(20000); // Including HTTP overhead

      // Verify performance metrics are returned
      expect(response.body.result.performance).toHaveProperty(
        'averageTimePerMembership',
      );
      expect(response.body.result.performance).toHaveProperty(
        'batchProcessingTime',
      );
      expect(response.body.result.performance).toHaveProperty(
        'dbOperationTime',
      );
      expect(response.body.result.performance).toHaveProperty('validationTime');
    });

    it('should handle batch processing correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .send({
          batchSize: 3,
        })
        .expect(200);

      expect(response.body.result.created).toEqual(MEMBERSHIP_STATISTICS.total);
      expect(response.body.result.errors).toBe(0);

      // Verify all memberships were created despite small batch size
      const membershipCount = await membershipRepository.count();
      expect(membershipCount).toEqual(MEMBERSHIP_STATISTICS.total);
    });
  });

  describe('Syrian Business Features', () => {
    it('should seed memberships with proper Syrian pricing', async () => {
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed/basic')
        .expect(200);

      const basicMonthly = await membershipRepository.findOne({
        where: { name: 'Basic Monthly' },
      });

      expect(basicMonthly.price).toBe(50000); // 50,000 SYP
      expect(basicMonthly.maxProducts).toBe(50);
      expect(basicMonthly.commissionDiscount).toBe(0);
    });

    it('should handle Syrian business tier progression', async () => {
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .expect(200);

      const basic = await membershipRepository.findOne({
        where: { name: 'Basic Monthly' },
      });
      const premium = await membershipRepository.findOne({
        where: { name: 'Premium Monthly' },
      });
      const vip = await membershipRepository.findOne({
        where: { name: 'VIP Monthly' },
      });

      // Verify tier progression
      expect(basic.price).toBeLessThan(premium.price);
      expect(premium.price).toBeLessThan(vip.price);
      expect(basic.maxProducts).toBeLessThan(premium.maxProducts);
      expect(premium.maxProducts).toBeLessThan(vip.maxProducts);
      expect(basic.commissionDiscount).toBeLessThan(premium.commissionDiscount);
      expect(premium.commissionDiscount).toBeLessThan(vip.commissionDiscount);
    });

    it('should handle unlimited features for enterprise', async () => {
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed/enterprise')
        .expect(200);

      const enterprise = await membershipRepository.findOne({
        where: { name: 'Enterprise' },
      });

      expect(enterprise.maxProducts).toBeNull(); // Unlimited
      expect(enterprise.maxImagesPerProduct).toBeNull(); // Unlimited
      expect(enterprise.commissionDiscount).toBe(20); // Maximum discount
      expect(enterprise.prioritySupport).toBe(true);
    });

    it('should validate yearly plan savings', async () => {
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed/basic')
        .expect(200);

      const basicMonthly = await membershipRepository.findOne({
        where: { name: 'Basic Monthly' },
      });
      const basicYearly = await membershipRepository.findOne({
        where: { name: 'Basic Yearly' },
      });

      // Yearly should offer savings (less than 12x monthly)
      expect(basicYearly.price).toBeLessThan(basicMonthly.price * 12);
      expect(basicYearly.commissionDiscount).toBeGreaterThan(
        basicMonthly.commissionDiscount,
      );
      expect(basicYearly.durationInDays).toBe(365);
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate membership feature hierarchy', async () => {
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .expect(200);

      const basic = await membershipRepository.findOne({
        where: { name: 'Basic Monthly' },
      });
      const premium = await membershipRepository.findOne({
        where: { name: 'Premium Monthly' },
      });
      const vip = await membershipRepository.findOne({
        where: { name: 'VIP Monthly' },
      });

      // Verify feature progression
      expect(basic.prioritySupport).toBe(false);
      expect(premium.prioritySupport).toBe(true);
      expect(vip.prioritySupport).toBe(true);

      // Verify commission discount progression
      expect(basic.commissionDiscount).toBeLessThan(premium.commissionDiscount);
      expect(premium.commissionDiscount).toBeLessThan(vip.commissionDiscount);
    });

    it('should validate special membership pricing', async () => {
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed/special')
        .expect(200);

      const trial = await membershipRepository.findOne({
        where: { name: 'Trial' },
      });
      const student = await membershipRepository.findOne({
        where: { name: 'Student' },
      });

      expect(trial.price).toBe(0); // Free trial
      expect(trial.durationInDays).toBe(14);
      expect(student.price).toBe(25000); // Discounted price
      expect(student.maxProducts).toBe(30);
    });

    it('should validate duration and pricing relationship', async () => {
      await request(app.getHttpServer())
        .post('/memberships/seeding/seed')
        .expect(200);

      const memberships = await membershipRepository.find();
      const monthlyPlans = memberships.filter((m) => m.durationInDays === 30);
      const yearlyPlans = memberships.filter((m) => m.durationInDays === 365);

      expect(monthlyPlans.length).toBeGreaterThan(0);
      expect(yearlyPlans.length).toBeGreaterThan(0);

      // Find matching tier pairs
      for (const monthly of monthlyPlans) {
        const tierName = monthly.name.replace(' Monthly', '');
        const yearly = yearlyPlans.find((y) => y.name.startsWith(tierName));

        if (yearly) {
          // Yearly should offer better value
          const monthlyAnnualPrice = monthly.price * 12;
          expect(yearly.price).toBeLessThan(monthlyAnnualPrice);
          expect(yearly.commissionDiscount).toBeGreaterThanOrEqual(
            monthly.commissionDiscount,
          );
        }
      }
    });
  });
});
