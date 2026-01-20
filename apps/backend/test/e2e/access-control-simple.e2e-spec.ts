/**
 * @file access-control-simple.e2e-spec.ts
 * @description Simple E2E Tests for Access Control Module without full app bootstrap
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../src/access-control/entities/permission.entity';
import { RolePermission } from '../../src/access-control/entities/role-permission.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { User } from '../../src/users/entities/user.entity';
import { Route } from '../../src/access-control/entities/route.entity';
import { ActivityLog } from '../../src/access-control/entities/activity-log.entity';
import { AccessControlModule } from '../../src/access-control/access-control.module';
import { RolesModule } from '../../src/roles/roles.module';
import { UsersModule } from '../../src/users/users.module';

describe('Access Control Simple (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;

  // Repositories
  let permissionRepository: Repository<Permission>;
  let roleRepository: Repository<Role>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_TEST_PORT) || 3307,
          username: process.env.DB_USER || 'root',
          password: process.env.DB_PASS || '',
          database: process.env.DB_TEST_NAME || 'souq_syria_test',
          entities: [
            Permission,
            RolePermission,
            Role,
            User,
            Route,
            ActivityLog,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        AccessControlModule,
        RolesModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get repositories
    permissionRepository = moduleFixture.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );
    roleRepository = moduleFixture.get<Repository<Role>>(
      getRepositoryToken(Role),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Setup minimal test data
    await setupMinimalTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('Basic Permission Management', () => {
    it('should create a new permission successfully', async () => {
      const permissionData = {
        name: 'test_permission_simple',
        description: 'Simple test permission',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/permissions')
        .send(permissionData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(permissionData.name);
      expect(response.body.description).toBe(permissionData.description);
    });

    it('should list all permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/permissions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        description: 'Permission without name',
      };

      await request(app.getHttpServer())
        .post('/admin/permissions')
        .send(invalidData)
        .expect(400);
    });
  });

  // Helper functions
  async function setupMinimalTestData() {
    // Create basic admin role for testing
    const adminRole = roleRepository.create({
      name: 'admin',
      description: 'Administrator role',
      type: 'admin',
    });
    await roleRepository.save(adminRole);

    // Create basic admin user
    const adminUser = userRepository.create({
      email: 'admin@simple-test.com',
      fullName: 'Admin User',
      firebaseUid: 'simple-admin-uid',
      isVerified: true,
      role: adminRole,
    });
    await userRepository.save(adminUser);
  }

  async function cleanupTestData() {
    await permissionRepository.delete({});
    await userRepository.delete({});
    await roleRepository.delete({});
  }
});
