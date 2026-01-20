/**
 * @file test-setup.ts
 * @description E2E Testing Setup and Configuration
 *
 * E2E SETUP FEATURES:
 * - Test database initialization
 * - Authentication helpers
 * - Data cleanup utilities
 * - Syrian test data setup
 * - Performance monitoring
 *
 * @author SouqSyria Development Team
 * @since 2025-08-11
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { SimpleSeedingService } from '../../../src/testing/services/simple-seeding.service';
import * as request from 'supertest';

/**
 * E2E Test Setup Configuration
 */
export interface E2ETestConfig {
  seedBasicData?: boolean;
  seedSyrianData?: boolean;
  cleanupAfterTests?: boolean;
  enableAuthentication?: boolean;
  logRequests?: boolean;
}

/**
 * E2E Test Context
 */
export interface E2ETestContext {
  app: INestApplication;
  module: TestingModule;
  seedingService: SimpleSeedingService;
  request: any;
  authTokens: {
    admin?: string;
    vendor?: string;
    customer?: string;
  };
  testUsers: {
    admin?: any;
    vendor?: any;
    customer?: any;
  };
}

/**
 * E2E Test Setup Class
 */
export class E2ETestSetup {
  private static instance: E2ETestSetup;
  private context: E2ETestContext;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): E2ETestSetup {
    if (!E2ETestSetup.instance) {
      E2ETestSetup.instance = new E2ETestSetup();
    }
    return E2ETestSetup.instance;
  }

  /**
   * Initialize E2E testing environment
   */
  async initialize(config: E2ETestConfig = {}): Promise<E2ETestContext> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    // Initialize services
    const seedingService = app.get(SimpleSeedingService);

    this.context = {
      app,
      module: moduleFixture,
      seedingService,
      request: request(app.getHttpServer()),
      authTokens: {},
      testUsers: {},
    };

    // Setup test data if requested
    if (config.seedBasicData) {
      await this.seedBasicTestData();
    }

    if (config.seedSyrianData) {
      await this.seedSyrianTestData();
    }

    // Setup authentication if requested
    if (config.enableAuthentication) {
      await this.setupAuthentication();
    }

    return this.context;
  }

  /**
   * Seed basic test data
   */
  private async seedBasicTestData(): Promise<void> {
    // Basic test data seeding would be implemented here
    console.log('Basic test data seeding not implemented');
  }

  /**
   * Seed Syrian test data
   */
  private async seedSyrianTestData(): Promise<void> {
    // Syrian test data seeding would be implemented here
    console.log('Syrian test data seeding not implemented');
  }

  /**
   * Setup authentication for different user roles
   */
  private async setupAuthentication(): Promise<void> {
    // Create test users for different roles
    const userFactory = this.context.app.get('UserFactory');

    // Create admin user
    this.context.testUsers.admin = await userFactory.createAdmin({
      email: 'admin@e2e-test.com',
      firstName: 'Test',
      lastName: 'Admin',
    });

    // Create vendor user
    this.context.testUsers.vendor = await userFactory.createVendor({
      email: 'vendor@e2e-test.com',
      firstName: 'Test',
      lastName: 'Vendor',
    });

    // Create customer user
    this.context.testUsers.customer = await userFactory.createCustomer({
      email: 'customer@e2e-test.com',
      firstName: 'Test',
      lastName: 'Customer',
    });

    // Get auth tokens for each user
    this.context.authTokens.admin = await this.getAuthToken(
      this.context.testUsers.admin,
    );
    this.context.authTokens.vendor = await this.getAuthToken(
      this.context.testUsers.vendor,
    );
    this.context.authTokens.customer = await this.getAuthToken(
      this.context.testUsers.customer,
    );
  }

  /**
   * Get authentication token for user
   */
  private async getAuthToken(user: any): Promise<string> {
    const response = await this.context.request
      .post('/auth/login')
      .send({
        email: user.email,
        firebaseUid: user.firebaseUid,
      })
      .expect(200);

    return response.body.access_token;
  }

  /**
   * Cleanup test environment
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      // Clean up test data would be implemented here
      console.log('Test data cleanup not implemented');

      // Close application
      await this.context.app.close();
    }
  }

  /**
   * Get current test context
   */
  getContext(): E2ETestContext {
    return this.context;
  }
}

/**
 * Helper function for authenticated requests
 */
export function authenticatedRequest(
  requestAgent: any,
  token: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
) {
  return requestAgent[method](url).set('Authorization', `Bearer ${token}`);
}

/**
 * Helper function to create Syrian test user
 */
export async function createSyrianTestUser(
  context: E2ETestContext,
  role: string = 'customer',
) {
  const userFactory = context.app.get('UserFactory');

  return await userFactory.createSyrianUser({
    email: `syrian-${role}@e2e-test.com`,
    firstName: 'أحمد',
    lastName: 'السوري',
    roleName: role,
    governorate: 'Damascus',
    preferences: {
      language: 'ar',
      currency: 'SYP',
    },
  });
}

/**
 * Helper function to create test product
 */
export async function createTestProduct(
  context: E2ETestContext,
  options: any = {},
) {
  const productFactory = context.app.get('ProductFactory');

  return await productFactory.create({
    nameEn: 'Test Product',
    nameAr: 'منتج اختبار',
    status: 'approved',
    isActive: true,
    ...options,
  });
}

/**
 * Helper function to create test category
 */
export async function createTestCategory(
  context: E2ETestContext,
  options: any = {},
) {
  const categoryFactory = context.app.get('CategoryFactory');

  return await categoryFactory.create({
    nameEn: 'Test Category',
    nameAr: 'فئة اختبار',
    status: 'approved',
    isActive: true,
    ...options,
  });
}

/**
 * Helper function to create test order
 */
export async function createTestOrder(
  context: E2ETestContext,
  user: any,
  products: any[] = [],
) {
  const orderFactory = context.app.get('OrderFactory');

  return await orderFactory.create({
    user,
    products,
    status: 'pending',
    paymentMethod: 'cash_on_delivery',
    currency: 'SYP',
  });
}

/**
 * Helper function to validate Syrian localization
 */
export function validateSyrianLocalization(response: any) {
  expect(response).toHaveProperty('nameEn');
  expect(response).toHaveProperty('nameAr');
  expect(response.nameEn).toBeTruthy();
  expect(response.nameAr).toBeTruthy();
}

/**
 * Helper function to validate API response structure
 */
export function validateApiResponse(response: any, expectedFields: string[]) {
  expectedFields.forEach((field) => {
    expect(response).toHaveProperty(field);
  });
}

/**
 * Helper function for pagination testing
 */
export function validatePaginationResponse(response: any) {
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('total');
  expect(response).toHaveProperty('page');
  expect(response).toHaveProperty('limit');
  expect(Array.isArray(response.data)).toBe(true);
}

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private startTime: number;

  start(): void {
    this.startTime = Date.now();
  }

  end(): number {
    const endTime = Date.now();
    return endTime - this.startTime;
  }

  expectResponseTime(maxMs: number): void {
    const duration = this.end();
    expect(duration).toBeLessThan(maxMs);
  }
}

/**
 * Data validation helpers
 */
export const ValidationHelpers = {
  /**
   * Validate Syrian phone number format
   */
  validateSyrianPhone(phone: string): boolean {
    const syrianPhoneRegex = /^\+963-9[3-9]-\d{6}$/;
    return syrianPhoneRegex.test(phone);
  },

  /**
   * Validate SYP currency format
   */
  validateSYPCurrency(amount: number): boolean {
    return typeof amount === 'number' && amount >= 0;
  },

  /**
   * Validate Arabic text
   */
  validateArabicText(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
  },

  /**
   * Validate UUID format
   */
  validateUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },
};
