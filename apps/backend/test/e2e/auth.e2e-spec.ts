/**
 * @file auth.e2e-spec.ts
 * @description E2E Tests for Authentication Module
 *
 * AUTH E2E TESTS:
 * - User registration and login
 * - JWT token validation
 * - Role-based access control
 * - Firebase authentication
 * - Syrian user authentication
 * - Password reset flows
 * - Session management
 *
 * @author SouqSyria Development Team
 * @since 2025-08-11
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  E2ETestSetup,
  E2ETestContext,
  createSyrianTestUser,
  ValidationHelpers,
  PerformanceMonitor,
} from './setup/test-setup';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let testSetup: E2ETestSetup;
  let context: E2ETestContext;
  let performanceMonitor: PerformanceMonitor;

  beforeAll(async () => {
    testSetup = E2ETestSetup.getInstance();
    context = await testSetup.initialize({
      seedBasicData: true,
      seedSyrianData: true,
      enableAuthentication: false, // We'll test auth manually
      cleanupAfterTests: true,
    });

    app = context.app;
    performanceMonitor = new PerformanceMonitor();
  });

  afterAll(async () => {
    await testSetup.cleanup();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      performanceMonitor.start();

      const userData = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        phone: '+963-93-123456',
        firebaseUid: 'firebase-test-uid-1',
      };

      const response = await context.request
        .post('/auth/register')
        .send(userData)
        .expect(201);

      performanceMonitor.expectResponseTime(2000);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('firstName', userData.firstName);
      expect(response.body).toHaveProperty('lastName', userData.lastName);
      expect(response.body).not.toHaveProperty('firebaseUid'); // Should not expose internal ID
    });

    it('should register a Syrian user with Arabic name', async () => {
      const syrianUserData = {
        email: 'ahmed.syrian@test.com',
        firstName: 'أحمد',
        lastName: 'السوري',
        phone: '+963-94-789012',
        firebaseUid: 'firebase-syrian-uid-1',
        preferences: {
          language: 'ar',
          currency: 'SYP',
          governorate: 'Damascus',
        },
      };

      const response = await context.request
        .post('/auth/register')
        .send(syrianUserData)
        .expect(201);

      expect(response.body).toHaveProperty('firstName', 'أحمد');
      expect(response.body).toHaveProperty('lastName', 'السوري');
      expect(
        ValidationHelpers.validateArabicText(response.body.firstName),
      ).toBe(true);
      expect(ValidationHelpers.validateSyrianPhone(syrianUserData.phone)).toBe(
        true,
      );
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: 'Test',
        lastName: 'User',
        firebaseUid: 'firebase-test-uid-invalid',
      };

      await context.request
        .post('/auth/register')
        .send(invalidData)
        .expect(400);
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        firstName: 'First',
        lastName: 'User',
        firebaseUid: 'firebase-uid-1',
      };

      // First registration should succeed
      await context.request.post('/auth/register').send(userData).expect(201);

      // Second registration with same email should fail
      const duplicateData = {
        ...userData,
        firebaseUid: 'firebase-uid-2',
      };

      await context.request
        .post('/auth/register')
        .send(duplicateData)
        .expect(409); // Conflict
    });

    it('should validate Syrian phone number format', async () => {
      const userData = {
        email: 'phonetest@test.com',
        firstName: 'Phone',
        lastName: 'Test',
        phone: 'invalid-phone',
        firebaseUid: 'firebase-phone-test',
      };

      await context.request.post('/auth/register').send(userData).expect(400);
    });
  });

  describe('POST /auth/login', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create a test user for login tests
      testUser = await createSyrianTestUser(context, 'customer');
    });

    it('should login successfully with valid credentials', async () => {
      performanceMonitor.start();

      const loginData = {
        email: testUser.email,
        firebaseUid: testUser.firebaseUid,
      };

      const response = await context.request
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      performanceMonitor.expectResponseTime(1500);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body.access_token.length).toBeGreaterThan(50);
    });

    it('should login Syrian user and return Arabic preferences', async () => {
      const loginData = {
        email: testUser.email,
        firebaseUid: testUser.firebaseUid,
      };

      const response = await context.request
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user).toHaveProperty('preferences');
      expect(response.body.user.preferences).toHaveProperty('language', 'ar');
      expect(response.body.user.preferences).toHaveProperty('currency', 'SYP');
      expect(response.body.user.preferences).toHaveProperty('governorate');
    });

    it('should reject login with invalid email', async () => {
      const invalidLoginData = {
        email: 'nonexistent@test.com',
        firebaseUid: 'some-firebase-uid',
      };

      await context.request
        .post('/auth/login')
        .send(invalidLoginData)
        .expect(401);
    });

    it('should reject login with mismatched firebase UID', async () => {
      const mismatchedData = {
        email: testUser.email,
        firebaseUid: 'wrong-firebase-uid',
      };

      await context.request
        .post('/auth/login')
        .send(mismatchedData)
        .expect(401);
    });

    it('should reject login for unverified user', async () => {
      // Create unverified user
      const userFactory = context.app.get('UserFactory');
      const unverifiedUser = await userFactory.create({
        email: 'unverified@test.com',
        firstName: 'Unverified',
        lastName: 'User',
        isVerified: false,
      });

      const loginData = {
        email: unverifiedUser.email,
        firebaseUid: unverifiedUser.firebaseUid,
      };

      await context.request.post('/auth/login').send(loginData).expect(403); // Forbidden
    });
  });

  describe('GET /auth/profile', () => {
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
      testUser = await createSyrianTestUser(context, 'customer');

      // Get auth token
      const loginResponse = await context.request
        .post('/auth/login')
        .send({
          email: testUser.email,
          firebaseUid: testUser.firebaseUid,
        })
        .expect(200);

      authToken = loginResponse.body.access_token;
    });

    it('should get user profile with valid token', async () => {
      const response = await context.request
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
      expect(response.body).toHaveProperty('role');
      expect(response.body).not.toHaveProperty('firebaseUid'); // Should not expose
    });

    it('should return Syrian user profile with Arabic data', async () => {
      const response = await context.request
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('preferences');
      expect(response.body.preferences).toHaveProperty('language', 'ar');
      expect(response.body.preferences).toHaveProperty('currency', 'SYP');
      expect(
        ValidationHelpers.validateArabicText(response.body.firstName),
      ).toBe(true);
    });

    it('should reject request without token', async () => {
      await context.request.get('/auth/profile').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await context.request
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject request with expired token', async () => {
      // This would require mocking time or using a pre-expired token
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      await context.request
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;
    let testUser: any;

    beforeEach(async () => {
      testUser = await createSyrianTestUser(context, 'customer');

      const loginResponse = await context.request
        .post('/auth/login')
        .send({
          email: testUser.email,
          firebaseUid: testUser.firebaseUid,
        })
        .expect(200);

      refreshToken = loginResponse.body.refresh_token || 'mock-refresh-token';
    });

    it('should refresh token successfully', async () => {
      const response = await context.request
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should reject refresh with invalid token', async () => {
      await context.request
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid-refresh-token' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
      testUser = await createSyrianTestUser(context, 'customer');

      const loginResponse = await context.request
        .post('/auth/login')
        .send({
          email: testUser.email,
          firebaseUid: testUser.firebaseUid,
        })
        .expect(200);

      authToken = loginResponse.body.access_token;
    });

    it('should logout successfully', async () => {
      await context.request
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // After logout, profile request should fail
      await context.request
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });

    it('should handle logout without token gracefully', async () => {
      await context.request.post('/auth/logout').expect(401);
    });
  });

  describe('Role-Based Access Control', () => {
    let adminToken: string;
    let vendorToken: string;
    let customerToken: string;

    beforeEach(async () => {
      const userFactory = context.app.get('UserFactory');

      // Create users with different roles
      const adminUser = await userFactory.createAdmin({
        email: 'admin.rbac@test.com',
      });

      const vendorUser = await userFactory.createVendor({
        email: 'vendor.rbac@test.com',
      });

      const customerUser = await userFactory.createCustomer({
        email: 'customer.rbac@test.com',
      });

      // Get auth tokens
      const adminLogin = await context.request
        .post('/auth/login')
        .send({ email: adminUser.email, firebaseUid: adminUser.firebaseUid });

      const vendorLogin = await context.request
        .post('/auth/login')
        .send({ email: vendorUser.email, firebaseUid: vendorUser.firebaseUid });

      const customerLogin = await context.request.post('/auth/login').send({
        email: customerUser.email,
        firebaseUid: customerUser.firebaseUid,
      });

      adminToken = adminLogin.body.access_token;
      vendorToken = vendorLogin.body.access_token;
      customerToken = customerLogin.body.access_token;
    });

    it('should allow admin access to admin endpoints', async () => {
      await context.request
        .get('/admin/dashboard') // Example admin endpoint
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          // Should not return 403 Forbidden
          expect(res.status).not.toBe(403);
        });
    });

    it('should deny customer access to admin endpoints', async () => {
      await context.request
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should allow vendor access to vendor endpoints', async () => {
      await context.request
        .get('/vendors/profile')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('should allow customer access to customer endpoints', async () => {
      await context.request
        .get('/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });
  });

  describe('Performance Tests', () => {
    it('should handle login within reasonable time', async () => {
      const testUser = await createSyrianTestUser(context, 'customer');

      performanceMonitor.start();

      await context.request
        .post('/auth/login')
        .send({
          email: testUser.email,
          firebaseUid: testUser.firebaseUid,
        })
        .expect(200);

      performanceMonitor.expectResponseTime(1500); // 1.5 seconds max
    });

    it('should handle concurrent login requests', async () => {
      const testUser = await createSyrianTestUser(context, 'customer');

      const loginData = {
        email: testUser.email,
        firebaseUid: testUser.firebaseUid,
      };

      // Make 5 concurrent login requests
      const promises = Array(5)
        .fill(null)
        .map(() =>
          context.request.post('/auth/login').send(loginData).expect(200),
        );

      performanceMonitor.start();
      await Promise.all(promises);
      performanceMonitor.expectResponseTime(3000); // 3 seconds for all concurrent requests
    });

    it('should handle high-frequency profile requests', async () => {
      const testUser = await createSyrianTestUser(context, 'customer');

      const loginResponse = await context.request.post('/auth/login').send({
        email: testUser.email,
        firebaseUid: testUser.firebaseUid,
      });

      const token = loginResponse.body.access_token;

      // Make 10 rapid profile requests
      const promises = Array(10)
        .fill(null)
        .map(() =>
          context.request
            .get('/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .expect(200),
        );

      performanceMonitor.start();
      await Promise.all(promises);
      performanceMonitor.expectResponseTime(2000); // 2 seconds for all requests
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive user data in responses', async () => {
      const testUser = await createSyrianTestUser(context, 'customer');

      const response = await context.request
        .post('/auth/login')
        .send({
          email: testUser.email,
          firebaseUid: testUser.firebaseUid,
        })
        .expect(200);

      // Should not expose sensitive fields
      expect(response.body.user).not.toHaveProperty('firebaseUid');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should validate input and prevent injection', async () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --",
        firebaseUid: '<script>alert("xss")</script>',
        firstName: '"><img src=x onerror=alert("xss")>',
      };

      await context.request
        .post('/auth/register')
        .send(maliciousData)
        .expect(400); // Should reject malicious input
    });

    it('should rate limit authentication requests', async () => {
      const loginData = {
        email: 'ratelimit@test.com',
        firebaseUid: 'wrong-uid',
      };

      // Make multiple failed login attempts
      const promises = Array(10)
        .fill(null)
        .map(() => context.request.post('/auth/login').send(loginData));

      const results = await Promise.all(promises);

      // Some requests should be rate limited (429 Too Many Requests)
      const rateLimitedRequests = results.filter((res) => res.status === 429);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });
});
