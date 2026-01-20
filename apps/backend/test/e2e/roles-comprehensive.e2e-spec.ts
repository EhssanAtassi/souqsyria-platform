/**
 * @file roles-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Roles and Access Control management system
 *
 * COMPREHENSIVE TESTING COVERAGE:
 * - Roles seeding with comprehensive role hierarchy management
 * - Admin and business role types with proper permission assignments
 * - Vendor roles (Premium, Standard, New) with tiered privileges
 * - Customer roles (VIP, Premium, Regular) with benefit levels
 * - Staff roles (Senior, Regular, Junior) with operational access
 * - Regional roles for Syrian market (Damascus, Aleppo managers)
 * - Specialized roles (Analyst, Auditor, API User, etc.)
 * - Role-permission associations and access control validation
 * - Role hierarchy analytics and permission distribution
 * - Bulk role operations with performance validation
 * - Data integrity verification and comprehensive error handling
 * - System performance under load and concurrent operations
 *
 * @author SouqSyria Development Team
 * @since 2025-08-21
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

// Core modules
import { AppModule } from '../../src/app.module';
import { RolesModule } from '../../src/roles/roles.module';

// Services and Controllers
import { RolesSeederService } from '../../src/roles/seeds/roles-seeder.service';
import { RolesService } from '../../src/roles/roles.service';

// Entities
import { Role } from '../../src/roles/entities/role.entity';
import { RolePermission } from '../../src/access-control/entities/role-permission.entity';

// Test utilities
import { TestDataHelper } from '../helpers/test-data-helper';
import { ValidationHelper } from '../helpers/validation-helper';

describe('Roles System - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let rolesSeederService: RolesSeederService;
  let rolesService: RolesService;
  let testDataHelper: TestDataHelper;
  let validationHelper: ValidationHelper;

  // Test configuration
  const TEST_CONFIG = {
    PERFORMANCE_THRESHOLDS: {
      SEED_GENERATION_TIME: 15000, // 15 seconds
      API_RESPONSE_TIME: 3000, // 3 seconds
      BULK_OPERATION_TIME: 8000, // 8 seconds
      ANALYTICS_RESPONSE_TIME: 4000, // 4 seconds
    },
    VALIDATION_RULES: {
      MIN_ROLES: 25, // Comprehensive role set
      MIN_ADMIN_ROLES: 5,
      MIN_BUSINESS_ROLES: 15,
      MIN_ROLE_PERMISSIONS: 100, // Role-permission associations
      MIN_DEFAULT_ROLES: 2,
      ROLE_TYPES: ['admin', 'business'],
    },
    ROLE_CATEGORIES: {
      admin: ['Super Admin', 'System Admin', 'Platform Admin', 'Content Admin', 'Support Admin'],
      vendor: ['Premium Vendor', 'Standard Vendor', 'New Vendor'],
      customer: ['VIP Customer', 'Premium Customer', 'Regular Customer', 'New Customer'],
      staff: ['Senior Staff', 'Staff Member', 'Junior Staff'],
      regional: ['Damascus Regional Manager', 'Aleppo Regional Manager', 'Cross-Border Manager'],
      specialized: ['Analyst', 'Auditor', 'API User', 'Guest'],
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, RolesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services and dependencies
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    rolesSeederService = moduleFixture.get<RolesSeederService>(RolesSeederService);
    rolesService = moduleFixture.get<RolesService>(RolesService);

    // Initialize test helpers
    testDataHelper = new TestDataHelper(dataSource);
    validationHelper = new ValidationHelper();

    // Clear existing test data
    await testDataHelper.clearRolesData();
  });

  afterAll(async () => {
    await testDataHelper.clearRolesData();
    await app.close();
  });

  describe('Roles Seeding System', () => {
    it('should seed comprehensive roles system within performance threshold', async () => {
      const startTime = Date.now();

      const result = await request(app.getHttpServer())
        .post('/roles/seed')
        .expect(201);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance validation
      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEED_GENERATION_TIME);

      // Validate response structure
      expect(result.body).toHaveProperty('success', true);
      expect(result.body).toHaveProperty('roles_created');
      expect(result.body).toHaveProperty('admin_roles');
      expect(result.body).toHaveProperty('business_roles');
      expect(result.body).toHaveProperty('default_roles');
      expect(result.body).toHaveProperty('role_permissions_assigned');
      expect(result.body).toHaveProperty('roles_by_type');
      expect(result.body).toHaveProperty('role_hierarchy_levels');
      expect(result.body).toHaveProperty('performance_metrics');

      // Validate minimum data requirements
      expect(result.body.roles_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ROLES);
      expect(result.body.admin_roles).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ADMIN_ROLES);
      expect(result.body.business_roles).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_BUSINESS_ROLES);
      expect(result.body.role_permissions_assigned).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ROLE_PERMISSIONS);
      expect(result.body.default_roles).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_DEFAULT_ROLES);
    });

    it('should validate role data structure and type distribution', async () => {
      const roles = await dataSource.getRepository(Role).find();

      expect(roles.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ROLES);

      // Validate role type distribution
      const adminRoles = roles.filter(r => r.type === 'admin');
      const businessRoles = roles.filter(r => r.type === 'business');

      expect(adminRoles.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ADMIN_ROLES);
      expect(businessRoles.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_BUSINESS_ROLES);

      // Validate each role
      for (const role of roles) {
        // Required fields validation
        expect(role.name).toBeDefined();
        expect(role.name.length).toBeGreaterThan(2);
        expect(role.description).toBeDefined();
        expect(role.type).toBeDefined();
        expect(TEST_CONFIG.VALIDATION_RULES.ROLE_TYPES).toContain(role.type);

        // Boolean field validation
        expect(typeof role.isDefault).toBe('boolean');

        // Timestamp validation
        expect(role.createdAt).toBeInstanceOf(Date);
        expect(role.updatedAt).toBeInstanceOf(Date);
        expect(role.updatedAt.getTime()).toBeGreaterThanOrEqual(role.createdAt.getTime());

        // Role name format validation
        expect(role.name).toMatch(/^[a-zA-Z\s\-]+$/); // Letters, spaces, and hyphens only
      }
    });

    it('should validate admin role hierarchy and privileges', async () => {
      const roles = await dataSource.getRepository(Role).find();

      const adminRoles = roles.filter(r => r.type === 'admin');
      
      // Check for expected admin roles
      TEST_CONFIG.ROLE_CATEGORIES.admin.forEach(expectedRole => {
        const foundRole = adminRoles.find(r => r.name === expectedRole);
        expect(foundRole).toBeDefined();
        expect(foundRole.type).toBe('admin');
      });

      // Validate admin role structure
      adminRoles.forEach(role => {
        expect(role.type).toBe('admin');
        expect(role.name).toBeTruthy();
        expect(role.description).toBeTruthy();
        
        // Admin roles typically shouldn't be default (except for special cases)
        if (role.name === 'Super Admin') {
          expect(role.isDefault).toBe(false);
        }
      });
    });

    it('should validate vendor role tier system', async () => {
      const roles = await dataSource.getRepository(Role).find();

      // Check for vendor roles
      TEST_CONFIG.ROLE_CATEGORIES.vendor.forEach(expectedRole => {
        const foundRole = roles.find(r => r.name === expectedRole);
        expect(foundRole).toBeDefined();
        expect(foundRole.type).toBe('business');
      });

      // Validate vendor role hierarchy
      const premiumVendor = roles.find(r => r.name === 'Premium Vendor');
      const standardVendor = roles.find(r => r.name === 'Standard Vendor');
      const newVendor = roles.find(r => r.name === 'New Vendor');

      expect(premiumVendor).toBeDefined();
      expect(standardVendor).toBeDefined();
      expect(newVendor).toBeDefined();

      // Standard Vendor should be default
      expect(standardVendor.isDefault).toBe(true);
      expect(premiumVendor.isDefault).toBe(false);
      expect(newVendor.isDefault).toBe(false);
    });

    it('should validate customer role tier system', async () => {
      const roles = await dataSource.getRepository(Role).find();

      // Check for customer roles
      TEST_CONFIG.ROLE_CATEGORIES.customer.forEach(expectedRole => {
        const foundRole = roles.find(r => r.name === expectedRole);
        expect(foundRole).toBeDefined();
        expect(foundRole.type).toBe('business');
      });

      // Validate customer role tier descriptions
      const vipCustomer = roles.find(r => r.name === 'VIP Customer');
      const regularCustomer = roles.find(r => r.name === 'Regular Customer');

      expect(vipCustomer.description).toContain('VIP');
      expect(regularCustomer.description).toContain('Regular');

      // Regular Customer should be default
      expect(regularCustomer.isDefault).toBe(true);
    });

    it('should validate Syrian regional roles', async () => {
      const roles = await dataSource.getRepository(Role).find();

      // Check for regional roles
      const damascusManager = roles.find(r => r.name === 'Damascus Regional Manager');
      const aleppoManager = roles.find(r => r.name === 'Aleppo Regional Manager');
      const crossBorderManager = roles.find(r => r.name === 'Cross-Border Manager');

      expect(damascusManager).toBeDefined();
      expect(aleppoManager).toBeDefined();
      expect(crossBorderManager).toBeDefined();

      // Validate regional role descriptions
      expect(damascusManager.description).toContain('Damascus');
      expect(aleppoManager.description).toContain('Aleppo');
      expect(crossBorderManager.description).toContain('cross-border');

      // Regional roles should be business type
      expect(damascusManager.type).toBe('business');
      expect(aleppoManager.type).toBe('business');
      expect(crossBorderManager.type).toBe('business');
    });

    it('should validate role-permission associations', async () => {
      const rolePermissions = await dataSource.getRepository(RolePermission).find({
        relations: ['role', 'permission'],
      });

      expect(rolePermissions.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ROLE_PERMISSIONS);

      for (const rolePermission of rolePermissions) {
        // Validate relationships
        expect(rolePermission.role).toBeDefined();
        expect(rolePermission.permission).toBeDefined();

        // Validate role and permission data
        expect(rolePermission.role.name).toBeTruthy();
        expect(rolePermission.permission.name).toBeTruthy();
      }

      // Check that different roles have different permission counts
      const rolesWithPermissions = new Map();
      rolePermissions.forEach(rp => {
        const roleName = rp.role.name;
        if (!rolesWithPermissions.has(roleName)) {
          rolesWithPermissions.set(roleName, 0);
        }
        rolesWithPermissions.set(roleName, rolesWithPermissions.get(roleName) + 1);
      });

      // Super Admin should have the most permissions
      const superAdminPermissions = rolesWithPermissions.get('Super Admin') || 0;
      const guestPermissions = rolesWithPermissions.get('Guest') || 0;

      expect(superAdminPermissions).toBeGreaterThan(guestPermissions);
    });
  });

  describe('Roles API Endpoints', () => {
    beforeEach(async () => {
      // Ensure test data exists
      await rolesSeederService.seedRoles();
    });

    it('should retrieve roles statistics with comprehensive analytics', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/roles/seed/statistics')
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);

      // Validate response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('generated_at');

      const stats = response.body.statistics;
      expect(stats).toHaveProperty('total_roles');
      expect(stats).toHaveProperty('admin_roles');
      expect(stats).toHaveProperty('business_roles');
      expect(stats).toHaveProperty('default_roles');
      expect(stats).toHaveProperty('total_role_permissions');
      expect(stats).toHaveProperty('average_permissions_per_role');

      // Validate statistics values
      expect(stats.total_roles).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ROLES);
      expect(stats.admin_roles + stats.business_roles).toBe(stats.total_roles);
      expect(stats.average_permissions_per_role).toBeGreaterThan(0);
    });

    it('should provide roles analytics by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/roles/seed/analytics/types')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('roles_by_type');
      expect(response.body).toHaveProperty('total_types');
      expect(response.body).toHaveProperty('most_populated_type');
      expect(response.body).toHaveProperty('least_populated_type');
      expect(response.body).toHaveProperty('type_balance_score');

      // Validate roles by type data
      const rolesByType = response.body.roles_by_type;
      expect(typeof rolesByType).toBe('object');

      // Check for key role types
      expect(rolesByType).toHaveProperty('admin');
      expect(rolesByType).toHaveProperty('business');
      expect(rolesByType).toHaveProperty('customer');
      expect(rolesByType).toHaveProperty('vendor');

      // Validate counts
      expect(rolesByType.admin).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ADMIN_ROLES);
      expect(rolesByType.business).toBeGreaterThan(0);

      // Validate balance score
      expect(response.body.type_balance_score).toBeGreaterThanOrEqual(0);
      expect(response.body.type_balance_score).toBeLessThanOrEqual(100);
    });

    it('should provide role hierarchy analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/roles/seed/analytics/hierarchy')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('hierarchy');
      expect(response.body).toHaveProperty('hierarchy_analysis');

      const hierarchy = response.body.hierarchy;
      expect(hierarchy).toHaveProperty('admin_hierarchy');
      expect(hierarchy).toHaveProperty('business_hierarchy');

      // Validate hierarchy structure
      expect(Array.isArray(hierarchy.admin_hierarchy)).toBe(true);
      expect(Array.isArray(hierarchy.business_hierarchy)).toBe(true);
      expect(hierarchy.admin_hierarchy.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_ADMIN_ROLES);

      // Validate hierarchy analysis
      const analysis = response.body.hierarchy_analysis;
      expect(analysis).toHaveProperty('admin_levels');
      expect(analysis).toHaveProperty('business_levels');
      expect(analysis).toHaveProperty('total_levels');
      expect(analysis).toHaveProperty('avg_permissions_admin');
      expect(analysis).toHaveProperty('avg_permissions_business');
    });

    it('should handle bulk roles seeding with customization', async () => {
      const startTime = Date.now();

      const bulkConfig = {
        role_types: ['admin', 'business'],
        include_regional_roles: true,
        include_customer_roles: true,
        include_vendor_roles: true,
      };

      const response = await request(app.getHttpServer())
        .post('/roles/seed/bulk')
        .send(bulkConfig)
        .expect(201);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('bulk_configuration');
      expect(response.body).toHaveProperty('optimization_applied', true);
      expect(response.body).toHaveProperty('custom_roles_created');
      expect(response.body.bulk_configuration).toEqual(bulkConfig);
    });

    it('should export roles data in multiple formats', async () => {
      // Test CSV export
      const csvExportConfig = {
        format: 'csv',
        include_permissions: true,
        filter_by_type: ['admin', 'business'],
      };

      const csvResponse = await request(app.getHttpServer())
        .post('/roles/seed/export')
        .send(csvExportConfig)
        .expect(200);

      expect(csvResponse.body).toHaveProperty('success', true);
      expect(csvResponse.body).toHaveProperty('export_config');
      expect(csvResponse.body).toHaveProperty('download_url');
      expect(csvResponse.body).toHaveProperty('expires_at');

      // Test Excel export
      const excelExportConfig = {
        format: 'excel',
        include_permissions: true,
        include_hierarchy: true,
        include_statistics: true,
      };

      const excelResponse = await request(app.getHttpServer())
        .post('/roles/seed/export')
        .send(excelExportConfig)
        .expect(200);

      expect(excelResponse.body.export_config.format).toBe('excel');
      expect(excelResponse.body.data).toHaveProperty('statistics');
      expect(excelResponse.body.data).toHaveProperty('hierarchy');
    });
  });

  describe('Role Type Validation and Structure', () => {
    beforeEach(async () => {
      await rolesSeederService.seedRoles();
    });

    it('should validate specialized roles functionality', async () => {
      const roles = await dataSource.getRepository(Role).find();

      // Check for specialized roles
      const analyst = roles.find(r => r.name === 'Analyst');
      const auditor = roles.find(r => r.name === 'Auditor');
      const apiUser = roles.find(r => r.name === 'API User');
      const guest = roles.find(r => r.name === 'Guest');

      expect(analyst).toBeDefined();
      expect(auditor).toBeDefined();
      expect(apiUser).toBeDefined();
      expect(guest).toBeDefined();

      // Validate specialized role characteristics
      expect(analyst.description).toContain('analyst');
      expect(auditor.description).toContain('audit');
      expect(apiUser.description).toContain('API');
      expect(guest.description).toContain('guest');

      // Guest should have minimal permissions
      expect(guest.isDefault).toBe(false);
    });

    it('should validate staff role organizational structure', async () => {
      const roles = await dataSource.getRepository(Role).find();

      const seniorStaff = roles.find(r => r.name === 'Senior Staff');
      const staffMember = roles.find(r => r.name === 'Staff Member');
      const juniorStaff = roles.find(r => r.name === 'Junior Staff');

      expect(seniorStaff).toBeDefined();
      expect(staffMember).toBeDefined();
      expect(juniorStaff).toBeDefined();

      // Validate staff hierarchy descriptions
      expect(seniorStaff.description).toContain('Senior');
      expect(staffMember.description).toContain('Regular');
      expect(juniorStaff.description).toContain('Junior');

      // All staff roles should be business type
      expect(seniorStaff.type).toBe('business');
      expect(staffMember.type).toBe('business');
      expect(juniorStaff.type).toBe('business');
    });

    it('should validate business manager roles coverage', async () => {
      const roles = await dataSource.getRepository(Role).find();

      const managerRoles = [
        'Vendor Manager', 'Product Manager', 'Order Manager',
        'Sales Manager', 'Marketing Manager', 'Finance Manager', 'Logistics Manager'
      ];

      managerRoles.forEach(managerRole => {
        const foundRole = roles.find(r => r.name === managerRole);
        expect(foundRole).toBeDefined();
        expect(foundRole.type).toBe('business');
        expect(foundRole.description).toContain('management');
      });
    });
  });

  describe('Permission Assignment Validation', () => {
    beforeEach(async () => {
      await rolesSeederService.seedRoles();
    });

    it('should validate permission hierarchy consistency', async () => {
      const rolePermissions = await dataSource.getRepository(RolePermission).find({
        relations: ['role', 'permission'],
      });

      // Group permissions by role
      const rolePermissionMap = new Map();
      rolePermissions.forEach(rp => {
        const roleName = rp.role.name;
        if (!rolePermissionMap.has(roleName)) {
          rolePermissionMap.set(roleName, []);
        }
        rolePermissionMap.get(roleName).push(rp.permission.name);
      });

      // Super Admin should have more permissions than other roles
      const superAdminPerms = rolePermissionMap.get('Super Admin') || [];
      const regularCustomerPerms = rolePermissionMap.get('Regular Customer') || [];
      const guestPerms = rolePermissionMap.get('Guest') || [];

      expect(superAdminPerms.length).toBeGreaterThan(regularCustomerPerms.length);
      expect(regularCustomerPerms.length).toBeGreaterThan(guestPerms.length);

      // Validate specific permission assignments
      expect(superAdminPerms).toContain('user.view');
      expect(regularCustomerPerms).toContain('product.view');
      expect(guestPerms).toContain('product.view');
    });

    it('should validate vendor role permission progression', async () => {
      const rolePermissions = await dataSource.getRepository(RolePermission).find({
        relations: ['role', 'permission'],
      });

      // Group permissions by vendor roles
      const vendorPermissions = new Map();
      ['Premium Vendor', 'Standard Vendor', 'New Vendor'].forEach(vendorType => {
        vendorPermissions.set(vendorType, []);
      });

      rolePermissions.forEach(rp => {
        if (vendorPermissions.has(rp.role.name)) {
          vendorPermissions.get(rp.role.name).push(rp.permission.name);
        }
      });

      const premiumPerms = vendorPermissions.get('Premium Vendor');
      const standardPerms = vendorPermissions.get('Standard Vendor');
      const newPerms = vendorPermissions.get('New Vendor');

      // Premium vendors should have more permissions than standard and new
      expect(premiumPerms.length).toBeGreaterThanOrEqual(standardPerms.length);
      expect(standardPerms.length).toBeGreaterThanOrEqual(newPerms.length);

      // All vendor types should have basic product permissions
      [premiumPerms, standardPerms, newPerms].forEach(perms => {
        expect(perms).toContain('product.view');
      });
    });

    it('should validate regional role permissions specificity', async () => {
      const rolePermissions = await dataSource.getRepository(RolePermission).find({
        relations: ['role', 'permission'],
      });

      const regionalRoles = ['Damascus Regional Manager', 'Aleppo Regional Manager'];
      const regionalPermissions = new Map();

      regionalRoles.forEach(roleName => {
        const perms = rolePermissions
          .filter(rp => rp.role.name === roleName)
          .map(rp => rp.permission.name);
        regionalPermissions.set(roleName, perms);
      });

      // Regional managers should have regional-specific permissions
      regionalRoles.forEach(roleName => {
        const perms = regionalPermissions.get(roleName);
        expect(perms.length).toBeGreaterThan(0);
        expect(perms).toContain('order.view');
        expect(perms).toContain('vendor.view');
      });
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain role name uniqueness', async () => {
      const roles = await dataSource.getRepository(Role).find();

      const roleNames = roles.map(r => r.name);
      const uniqueNames = new Set(roleNames);

      expect(roleNames.length).toBe(uniqueNames.size);
    });

    it('should validate role-permission association integrity', async () => {
      const rolePermissions = await dataSource.getRepository(RolePermission).find({
        relations: ['role', 'permission'],
      });

      for (const rp of rolePermissions) {
        // Each association should have valid role and permission
        expect(rp.role).toBeTruthy();
        expect(rp.permission).toBeTruthy();

        // No duplicate associations for same role-permission combination
        const duplicates = rolePermissions.filter(other => 
          other.role.id === rp.role.id && 
          other.permission.id === rp.permission.id &&
          other.id !== rp.id
        );
        expect(duplicates.length).toBe(0);
      }
    });

    it('should validate default role assignments', async () => {
      const roles = await dataSource.getRepository(Role).find();

      const defaultRoles = roles.filter(r => r.isDefault);
      
      expect(defaultRoles.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_DEFAULT_ROLES);

      // Standard Vendor and Regular Customer should be default
      const standardVendor = roles.find(r => r.name === 'Standard Vendor');
      const regularCustomer = roles.find(r => r.name === 'Regular Customer');

      expect(standardVendor?.isDefault).toBe(true);
      expect(regularCustomer?.isDefault).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle role seeding when permissions do not exist', async () => {
      // This should still work, just with no permission assignments
      const response = await request(app.getHttpServer())
        .post('/roles/seed/test')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('test_mode', true);
    });

    it('should handle clearing roles data', async () => {
      const response = await request(app.getHttpServer())
        .delete('/roles/seed/clear')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('warning');
      expect(response.body).toHaveProperty('cleared_at');

      // Verify data is actually cleared
      const rolesCount = await dataSource.getRepository(Role).count();
      const rolePermissionsCount = await dataSource.getRepository(RolePermission).count();

      expect(rolesCount).toBe(0);
      expect(rolePermissionsCount).toBe(0);
    });

    it('should handle concurrent role operations', async () => {
      const promises = Array(3).fill(0).map(() =>
        request(app.getHttpServer())
          .post('/roles/seed/test')
          .send({ sample_size: 10 })
      );

      const results = await Promise.all(promises);
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('System Performance Under Load', () => {
    it('should maintain performance under concurrent role analytics requests', async () => {
      const startTime = Date.now();

      const promises = Array(10).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/roles/seed/statistics')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME * 2);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should handle high-volume role hierarchy analytics efficiently', async () => {
      const startTime = Date.now();

      const promises = Array(5).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/roles/seed/analytics/hierarchy')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should optimize role export operations', async () => {
      const exportConfigs = [
        { format: 'csv', include_permissions: false },
        { format: 'excel', include_hierarchy: true },
        { format: 'json', filter_by_type: ['admin'] },
      ];
      
      const startTime = Date.now();

      const promises = exportConfigs.map(config =>
        request(app.getHttpServer())
          .post('/roles/seed/export')
          .send(config)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });
});