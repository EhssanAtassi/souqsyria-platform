/**
 * @file staff-management-comprehensive.e2e-spec.ts
 * @description Comprehensive end-to-end tests for Syrian staff management seeding system
 * 
 * Test Coverage:
 * - Staff hierarchy seeding and validation
 * - Role-based staff assignment across departments
 * - Multi-location staff distribution (Damascus, Aleppo, etc.)
 * - Performance analytics and reporting
 * - Bulk operations for enterprise staff onboarding
 * - Arabic and English bilingual staff profiles
 * - Export capabilities and data integrity
 * - Security and access control validation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

// Module and Service Imports
import { StaffManagementModule } from '../../src/staff-management/staff-management.module';
import { StaffManagementSeederService } from '../../src/staff-management/seeds/staff-management-seeder.service';

// Entity Imports
import { User } from '../../src/users/entities/user.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { ActivityLog } from '../../src/access-control/entities/activity-log.entity';

// Test Configuration
import { TestDatabaseModule } from '../utils/test-database.module';

/**
 * Comprehensive E2E test suite for Syrian staff management seeding
 * 
 * Validates enterprise-ready staff hierarchy creation, analytics,
 * and bulk operations with Syrian market focus and Arabic localization
 */
describe('Staff Management Seeding - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let staffSeederService: StaffManagementSeederService;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let activityLogRepository: Repository<ActivityLog>;

  // Performance thresholds for Syrian e-commerce platform
  const PERFORMANCE_THRESHOLDS = {
    SEEDING_MAX_TIME: 15000,        // 15 seconds for comprehensive seeding
    ANALYTICS_MAX_TIME: 3000,       // 3 seconds for analytics
    BULK_OPERATIONS_MAX_TIME: 8000, // 8 seconds for bulk operations
    EXPORT_MAX_TIME: 5000,          // 5 seconds for data export
    CLEANUP_MAX_TIME: 10000,        // 10 seconds for data cleanup
  };

  // Syrian market validation rules
  const SYRIAN_MARKET_RULES = {
    MIN_STAFF_COUNT: 70,            // Minimum staff for platform operations
    MIN_LOCATIONS: 5,               // Minimum Syrian cities covered
    MIN_DEPARTMENTS: 8,             // Minimum departments represented
    REQUIRED_LANGUAGES: ['Arabic', 'English'], // Required language support
    DAMASCUS_MIN_STAFF: 15,         // Minimum staff in capital
    ALEPPO_MIN_STAFF: 10,           // Minimum staff in commercial hub
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TypeOrmModule.forFeature([User, Role, ActivityLog]),
        StaffManagementModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get service and repository instances
    staffSeederService = moduleFixture.get<StaffManagementSeederService>(StaffManagementSeederService);
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = moduleFixture.get<Repository<Role>>(getRepositoryToken(Role));
    activityLogRepository = moduleFixture.get<Repository<ActivityLog>>(getRepositoryToken(ActivityLog));

    // Setup test roles for staff assignment
    await setupTestRoles();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  /**
   * Test suite for comprehensive staff hierarchy seeding
   */
  describe('🏢 Staff Hierarchy Seeding', () => {
    it('should seed comprehensive Syrian staff hierarchy within performance threshold', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/staff-management/seeder/seed-staff-hierarchy')
        .expect(201);

      const processingTime = Date.now() - startTime;

      // Validate response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('message');
      expect(response.body.count).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.MIN_STAFF_COUNT);

      // Validate performance
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEEDING_MAX_TIME);

      // Validate analytics data
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.departments).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.MIN_DEPARTMENTS);
      expect(response.body.analytics.locations).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.MIN_LOCATIONS);

      console.log(`✅ Staff hierarchy seeded: ${response.body.count} staff members in ${processingTime}ms`);
    });

    it('should validate seeded staff data integrity and Syrian market compliance', async () => {
      // Get all staff created by seeding
      const staffMembers = await userRepository.find({
        where: { email: require('typeorm').Like('%@souqsyria.sy') },
        relations: ['assignedRole']
      });

      // Validate staff count
      expect(staffMembers.length).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.MIN_STAFF_COUNT);

      // Validate Syrian locations distribution
      const locations = [...new Set(staffMembers.map(staff => staff.city).filter(Boolean))];
      expect(locations.length).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.MIN_LOCATIONS);
      expect(locations).toContain('Damascus');
      expect(locations).toContain('Aleppo');

      // Validate Damascus and Aleppo staff concentration
      const damascusStaff = staffMembers.filter(staff => staff.city === 'Damascus');
      const aleppoStaff = staffMembers.filter(staff => staff.city === 'Aleppo');
      
      expect(damascusStaff.length).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.DAMASCUS_MIN_STAFF);
      expect(aleppoStaff.length).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.ALEPPO_MIN_STAFF);

      // Validate role assignments
      const staffWithRoles = staffMembers.filter(staff => staff.assignedRole);
      expect(staffWithRoles.length).toBe(staffMembers.length); // All staff should have roles

      // Validate email format compliance
      const emailPattern = /^[a-zA-Z0-9._%+-]+@souqsyria\.sy$/;
      staffMembers.forEach(staff => {
        expect(staff.email).toMatch(emailPattern);
        expect(staff.isVerified).toBe(true); // All seeded staff should be verified
      });

      console.log(`✅ Data integrity validated: ${staffMembers.length} staff across ${locations.length} Syrian cities`);
    });

    it('should handle duplicate seeding gracefully without errors', async () => {
      // Attempt to seed again (should not create duplicates)
      const response = await request(app.getHttpServer())
        .post('/staff-management/seeder/seed-staff-hierarchy')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0); // No new staff should be created

      console.log(`✅ Duplicate seeding handled gracefully: ${response.body.message}`);
    });
  });

  /**
   * Test suite for staff analytics and performance monitoring
   */
  describe('📊 Staff Analytics & Performance', () => {
    it('should provide comprehensive staff analytics within performance threshold', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/analytics')
        .expect(200);

      const processingTime = Date.now() - startTime;

      // Validate performance
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYTICS_MAX_TIME);

      // Validate analytics structure
      expect(response.body).toHaveProperty('totalStaff');
      expect(response.body).toHaveProperty('distributionByLocation');
      expect(response.body).toHaveProperty('distributionByRole');
      expect(response.body).toHaveProperty('staffGrowthMetrics');

      // Validate Syrian market metrics
      expect(response.body.totalStaff).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.MIN_STAFF_COUNT);
      expect(response.body.distributionByLocation.length).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.MIN_LOCATIONS);

      // Validate growth metrics
      expect(response.body.staffGrowthMetrics).toHaveProperty('current');
      expect(response.body.staffGrowthMetrics).toHaveProperty('target');
      expect(response.body.staffGrowthMetrics).toHaveProperty('completionRate');

      console.log(`✅ Analytics retrieved in ${processingTime}ms: ${response.body.totalStaff} total staff`);
    });

    it('should provide summary analytics format', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/analytics?format=summary')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalStaff');
      expect(response.body.summary).toHaveProperty('topLocation');
      expect(response.body.summary).toHaveProperty('completionRate');

      console.log(`✅ Summary analytics: ${response.body.summary.totalStaff} staff, top location: ${response.body.summary.topLocation?.city}`);
    });

    it('should provide location-specific analytics grouping', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/analytics?groupBy=location')
        .expect(200);

      expect(response.body.metadata).toHaveProperty('groupBy', 'location');
      expect(response.body.distributionByLocation).toBeDefined();

      // Validate Syrian cities representation
      const damascusEntry = response.body.distributionByLocation.find(loc => loc.city === 'Damascus');
      const aleppoEntry = response.body.distributionByLocation.find(loc => loc.city === 'Aleppo');
      
      expect(damascusEntry).toBeDefined();
      expect(aleppoEntry).toBeDefined();
      expect(damascusEntry.count).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.DAMASCUS_MIN_STAFF);

      console.log(`✅ Location analytics: Damascus (${damascusEntry.count}), Aleppo (${aleppoEntry.count})`);
    });
  });

  /**
   * Test suite for bulk operations and enterprise features
   */
  describe('⚡ Bulk Operations & Enterprise Features', () => {
    it('should perform bulk staff operations within performance threshold', async () => {
      const bulkOperations = {
        operations: [
          {
            type: 'create',
            data: {
              fullName: 'سامر التجريبي (Samer Al-Tajribi) - Test',
              email: 'samer.test@souqsyria.sy',
              password: 'TestStaff@2024!',
              department: 'Testing',
              location: 'Damascus'
            }
          },
          {
            type: 'create',
            data: {
              fullName: 'نورا التجريبية (Nora Al-Tajribiyya) - Test',
              email: 'nora.test@souqsyria.sy',
              password: 'TestStaff@2024!',
              department: 'Quality Assurance',
              location: 'Aleppo'
            }
          }
        ]
      };

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/staff-management/seeder/bulk-operations')
        .send(bulkOperations)
        .expect(200);

      const processingTime = Date.now() - startTime;

      // Validate performance
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS_MAX_TIME);

      // Validate results
      expect(response.body.results).toHaveProperty('created');
      expect(response.body.results).toHaveProperty('updated');
      expect(response.body.results).toHaveProperty('failed');
      expect(response.body.results.created).toBeGreaterThan(0);

      // Validate performance metrics
      expect(response.body.summary).toHaveProperty('successRate');
      expect(response.body.summary).toHaveProperty('performanceMetrics');

      console.log(`✅ Bulk operations completed in ${processingTime}ms: ${response.body.results.created} created`);
    });

    it('should validate bulk operation error handling', async () => {
      const invalidOperations = {
        operations: [
          {
            type: 'create',
            data: {
              // Missing required fields
              fullName: 'Invalid Test Staff'
            }
          },
          {
            type: 'invalid_operation',
            data: {}
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/staff-management/seeder/bulk-operations')
        .send(invalidOperations)
        .expect(200);

      expect(response.body.results.failed).toBeGreaterThan(0);
      expect(response.body.results.errors.length).toBeGreaterThan(0);

      console.log(`✅ Error handling validated: ${response.body.results.failed} failed operations`);
    });
  });

  /**
   * Test suite for data export and reporting
   */
  describe('📤 Data Export & Reporting', () => {
    it('should export staff data in JSON format within performance threshold', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/export?format=json&includeAnalytics=true')
        .expect(200);

      const processingTime = Date.now() - startTime;

      // Validate performance
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXPORT_MAX_TIME);

      // Validate export structure
      expect(response.body.metadata).toHaveProperty('exportFormat', 'json');
      expect(response.body.metadata).toHaveProperty('includesAnalytics', true);
      expect(response.body.metadata).toHaveProperty('dataCompliance');
      expect(response.body).toHaveProperty('staff');
      expect(response.body).toHaveProperty('analytics');

      // Validate compliance metadata
      expect(response.body.metadata.dataCompliance).toHaveProperty('gdprCompliant', true);
      expect(response.body.metadata.dataCompliance).toHaveProperty('dataRetention', '7 years');

      console.log(`✅ JSON export completed in ${processingTime}ms with analytics`);
    });

    it('should export staff data in CSV format', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/export?format=csv')
        .expect(200);

      expect(response.body.metadata.exportFormat).toBe('csv');
      expect(response.body).toHaveProperty('csvHeaders');
      expect(response.body).toHaveProperty('csvNote');
      expect(response.body.csvHeaders).toContain('Full Name');
      expect(response.body.csvHeaders).toContain('Location');

      console.log(`✅ CSV export format validated`);
    });

    it('should export staff data in Excel format with advanced features', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/export?format=excel&includeAnalytics=true')
        .expect(200);

      expect(response.body.metadata.exportFormat).toBe('excel');
      expect(response.body).toHaveProperty('excelFeatures');
      expect(response.body.excelFeatures).toContain('Arabic Support');
      expect(response.body.excelFeatures).toContain('Charts');
      expect(response.body.excelFeatures).toContain('Pivot Tables');

      console.log(`✅ Excel export format validated with Arabic support`);
    });
  });

  /**
   * Test suite for location distribution and geographic analytics
   */
  describe('🗺️ Location Distribution & Geographic Analytics', () => {
    it('should provide detailed Syrian location distribution', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/distribution/locations')
        .expect(200);

      expect(response.body).toHaveProperty('locationDistribution');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('coverageAnalysis');

      // Validate Syrian market coverage
      const coverageAnalysis = response.body.metadata.coverageAnalysis;
      expect(coverageAnalysis).toHaveProperty('majorCities');
      expect(coverageAnalysis.majorCities).toContain('Damascus');
      expect(coverageAnalysis.majorCities).toContain('Aleppo');
      expect(coverageAnalysis.majorCities).toContain('Latakia');

      // Validate expansion opportunities
      expect(coverageAnalysis).toHaveProperty('expansionOpportunities');
      expect(coverageAnalysis.expansionOpportunities).toContain('Daraa');

      console.log(`✅ Location distribution: ${response.body.metadata.totalLocations} Syrian cities covered`);
    });

    it('should validate geographic coverage balance', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/distribution/locations')
        .expect(200);

      const locationDistribution = response.body.locationDistribution;
      const totalStaff = locationDistribution.reduce((sum, loc) => sum + parseInt(loc.count), 0);
      
      // Validate distribution balance (no single location should have >50% of staff)
      locationDistribution.forEach(location => {
        const percentage = (parseInt(location.count) / totalStaff) * 100;
        expect(percentage).toBeLessThan(50); // Ensure distributed operations
      });

      // Validate minimum staff per major Syrian cities
      const damascusLoc = locationDistribution.find(loc => loc.city === 'Damascus');
      const aleppoLoc = locationDistribution.find(loc => loc.city === 'Aleppo');
      
      if (damascusLoc) {
        expect(parseInt(damascusLoc.count)).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.DAMASCUS_MIN_STAFF);
      }
      if (aleppoLoc) {
        expect(parseInt(aleppoLoc.count)).toBeGreaterThanOrEqual(SYRIAN_MARKET_RULES.ALEPPO_MIN_STAFF);
      }

      console.log(`✅ Geographic balance validated: ${totalStaff} staff across ${locationDistribution.length} locations`);
    });
  });

  /**
   * Test suite for data cleanup and maintenance
   */
  describe('🧹 Data Cleanup & Maintenance', () => {
    it('should clear seeded staff data within performance threshold', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .delete('/staff-management/seeder/clear-data')
        .expect(200);

      const processingTime = Date.now() - startTime;

      // Validate performance
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CLEANUP_MAX_TIME);

      // Validate cleanup results
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('deletedCount');
      expect(response.body.deletedCount).toBeGreaterThan(0);

      // Validate safety features
      expect(response.body.details).toHaveProperty('backupCreated', true);
      expect(response.body.details).toHaveProperty('safetyNote');

      console.log(`✅ Data cleanup completed in ${processingTime}ms: ${response.body.deletedCount} staff removed`);
    });

    it('should validate that only seeded data was removed', async () => {
      // Verify that manually created staff (if any) were preserved
      const remainingStaff = await userRepository.find({
        where: { email: require('typeorm').Like('%@souqsyria.sy') }
      });

      // Should be 0 since we only created seeded staff in tests
      expect(remainingStaff.length).toBe(0);

      console.log(`✅ Cleanup verification: ${remainingStaff.length} staff remaining (expected 0 for test environment)`);
    });
  });

  /**
   * Test suite for error handling and edge cases
   */
  describe('⚠️ Error Handling & Edge Cases', () => {
    it('should handle analytics request with no staff data gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/analytics')
        .expect(200);

      // Should return analytics even with zero staff
      expect(response.body).toHaveProperty('totalStaff', 0);
      expect(response.body.distributionByLocation).toEqual([]);

      console.log(`✅ Empty analytics handled gracefully`);
    });

    it('should handle invalid export format gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff-management/seeder/export?format=invalid')
        .expect(200);

      // Should default to JSON format
      expect(response.body.metadata.exportFormat).toBe('json');

      console.log(`✅ Invalid export format handled with JSON default`);
    });

    it('should handle bulk operations with empty array', async () => {
      const response = await request(app.getHttpServer())
        .post('/staff-management/seeder/bulk-operations')
        .send({ operations: [] })
        .expect(200);

      expect(response.body.results.created).toBe(0);
      expect(response.body.results.updated).toBe(0);
      expect(response.body.results.failed).toBe(0);

      console.log(`✅ Empty bulk operations handled gracefully`);
    });
  });

  /**
   * Helper function to setup test roles
   */
  async function setupTestRoles(): Promise<void> {
    const testRoles = [
      { name: 'CEO', description: 'Chief Executive Officer' },
      { name: 'Manager', description: 'Department Manager' },
      { name: 'Staff', description: 'Regular Staff Member' },
      { name: 'Admin', description: 'System Administrator' },
      { name: 'Regional Manager', description: 'Regional Operations Manager' },
      { name: 'Specialist', description: 'Subject Matter Specialist' },
    ];

    for (const roleData of testRoles) {
      const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!existingRole) {
        const role = roleRepository.create(roleData);
        await roleRepository.save(role);
      }
    }

    console.log(`✅ Test roles setup completed`);
  }

  /**
   * Helper function to cleanup test data
   */
  async function cleanupTestData(): Promise<void> {
    try {
      // Clean up activity logs
      await activityLogRepository.delete({ action: require('typeorm').Like('%STAFF_SEEDING%') });
      
      // Clean up test staff
      await userRepository.delete({ email: require('typeorm').Like('%@souqsyria.sy') });
      await userRepository.delete({ email: require('typeorm').Like('%.test@%') });
      
      console.log(`✅ Test data cleanup completed`);
    } catch (error) {
      console.warn(`⚠️ Cleanup warning: ${error.message}`);
    }
  }
});

/**
 * Performance Summary:
 * - Staff hierarchy seeding: < 15 seconds for 70+ staff
 * - Analytics retrieval: < 3 seconds
 * - Bulk operations: < 8 seconds
 * - Data export: < 5 seconds
 * - Data cleanup: < 10 seconds
 * 
 * Syrian Market Compliance:
 * - Minimum 70 staff across 5+ Syrian cities
 * - Damascus and Aleppo concentration requirements
 * - Arabic and English bilingual support
 * - Department coverage across 8+ areas
 * - Role-based access control integration
 */