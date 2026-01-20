/**
 * @file mobile-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Syrian Mobile API system
 *
 * COMPREHENSIVE TESTING COVERAGE:
 * - Mobile API seeding with optimized mobile-specific data structures
 * - Mobile authentication flows and OTP verification systems
 * - Image optimization and multiple format support for mobile bandwidth
 * - Push notification delivery and mobile device management
 * - Mobile-specific product catalog optimization and caching
 * - Cart and order management optimized for mobile workflows
 * - Mobile search functionality with offline-ready responses
 * - Performance optimization for mobile networks and devices
 * - Mobile session management and security validation
 * - Bulk mobile operations with performance validation
 * - Data integrity verification and comprehensive error handling
 * - System performance under mobile load conditions
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
import { MobileModule } from '../../src/mobile/mobile.module';

// Services and Controllers
import { MobileSeederService } from '../../src/mobile/seeds/mobile.seeder.service';
import { MobileProductsService } from '../../src/mobile/v1/services/mobile-products.service';
import { MobileAuthService } from '../../src/mobile/v1/services/mobile-auth.service';
import { MobileNotificationsService } from '../../src/mobile/v1/services/mobile-notifications.service';

// Entities
import { MobileDeviceEntity } from '../../src/mobile/entities/mobile-device.entity';
import { MobileOTPEntity } from '../../src/mobile/entities/mobile-otp.entity';
import { MobileSessionEntity } from '../../src/mobile/entities/mobile-session.entity';
import { MobileNotificationEntity } from '../../src/mobile/entities/mobile-notification.entity';

// Test utilities
import { TestDataHelper } from '../helpers/test-data-helper';
import { ValidationHelper } from '../helpers/validation-helper';

describe('Mobile API System - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let mobileSeederService: MobileSeederService;
  let mobileProductsService: MobileProductsService;
  let mobileAuthService: MobileAuthService;
  let mobileNotificationsService: MobileNotificationsService;
  let testDataHelper: TestDataHelper;
  let validationHelper: ValidationHelper;

  // Test configuration
  const TEST_CONFIG = {
    PERFORMANCE_THRESHOLDS: {
      SEED_GENERATION_TIME: 30000, // 30 seconds
      MOBILE_API_RESPONSE_TIME: 2000, // 2 seconds (mobile optimized)
      IMAGE_OPTIMIZATION_TIME: 5000, // 5 seconds
      SEARCH_RESPONSE_TIME: 1500, // 1.5 seconds
      NOTIFICATION_DELIVERY_TIME: 3000, // 3 seconds
    },
    VALIDATION_RULES: {
      MIN_MOBILE_DEVICES: 20,
      MIN_MOBILE_SESSIONS: 15,
      MIN_MOBILE_NOTIFICATIONS: 30,
      MIN_OTP_RECORDS: 10,
      SUPPORTED_PLATFORMS: ['iOS', 'Android', 'Web'],
      IMAGE_FORMATS: ['webp', 'jpeg', 'png'],
    },
    MOBILE_OPTIMIZATION: {
      MAX_RESPONSE_SIZE_KB: 100, // 100KB max for mobile
      MIN_IMAGE_COMPRESSION: 0.7, // 70% compression
      REQUIRED_MOBILE_FIELDS: ['device_id', 'platform', 'app_version'],
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, MobileModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services and dependencies
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    mobileSeederService = moduleFixture.get<MobileSeederService>(MobileSeederService);
    mobileProductsService = moduleFixture.get<MobileProductsService>(MobileProductsService);
    mobileAuthService = moduleFixture.get<MobileAuthService>(MobileAuthService);
    mobileNotificationsService = moduleFixture.get<MobileNotificationsService>(MobileNotificationsService);

    // Initialize test helpers
    testDataHelper = new TestDataHelper(dataSource);
    validationHelper = new ValidationHelper();

    // Clear existing test data
    await testDataHelper.clearMobileData();
  });

  afterAll(async () => {
    await testDataHelper.clearMobileData();
    await app.close();
  });

  describe('Mobile Seeding System', () => {
    it('should seed comprehensive mobile data within performance threshold', async () => {
      const startTime = Date.now();

      const result = await request(app.getHttpServer())
        .post('/mobile/seed')
        .expect(201);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance validation
      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEED_GENERATION_TIME);

      // Validate response structure
      expect(result.body).toHaveProperty('success', true);
      expect(result.body).toHaveProperty('devices_created');
      expect(result.body).toHaveProperty('sessions_created');
      expect(result.body).toHaveProperty('notifications_created');
      expect(result.body).toHaveProperty('otp_records_created');

      // Validate minimum data requirements
      expect(result.body.devices_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_MOBILE_DEVICES);
      expect(result.body.sessions_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_MOBILE_SESSIONS);
      expect(result.body.notifications_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_MOBILE_NOTIFICATIONS);
    });

    it('should validate mobile device data structure and platform distribution', async () => {
      const devices = await dataSource.getRepository(MobileDeviceEntity).find({
        relations: ['user'],
      });

      expect(devices.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_MOBILE_DEVICES);

      // Validate platform distribution
      const platformCounts = {};
      TEST_CONFIG.VALIDATION_RULES.SUPPORTED_PLATFORMS.forEach(platform => {
        platformCounts[platform] = 0;
      });

      for (const device of devices) {
        // Required fields validation
        TEST_CONFIG.MOBILE_OPTIMIZATION.REQUIRED_MOBILE_FIELDS.forEach(field => {
          expect(device[field]).toBeDefined();
          expect(device[field]).not.toBeNull();
        });

        // Platform validation
        expect(TEST_CONFIG.VALIDATION_RULES.SUPPORTED_PLATFORMS).toContain(device.platform);
        platformCounts[device.platform]++;

        // Device ID format validation
        expect(device.device_id).toMatch(/^[a-f0-9-]{36}$/i); // UUID format

        // App version validation
        expect(device.app_version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning

        // Push token validation (if present)
        if (device.push_token) {
          expect(device.push_token.length).toBeGreaterThan(10);
        }

        // User relationship validation
        if (device.user) {
          expect(device.user.id).toBeDefined();
        }
      }

      // Ensure we have devices for all supported platforms
      TEST_CONFIG.VALIDATION_RULES.SUPPORTED_PLATFORMS.forEach(platform => {
        expect(platformCounts[platform]).toBeGreaterThan(0);
      });
    });

    it('should validate mobile session management and security', async () => {
      const sessions = await dataSource.getRepository(MobileSessionEntity).find({
        relations: ['device', 'user'],
      });

      expect(sessions.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_MOBILE_SESSIONS);

      for (const session of sessions) {
        // Required relationships
        expect(session.device).toBeDefined();
        expect(session.user).toBeDefined();

        // Session token validation
        expect(session.session_token).toBeDefined();
        expect(session.session_token.length).toBeGreaterThan(20);

        // Timestamp validation
        expect(session.created_at).toBeInstanceOf(Date);
        expect(session.last_activity).toBeInstanceOf(Date);
        expect(session.expires_at).toBeInstanceOf(Date);

        // Security validation
        expect(session.expires_at.getTime()).toBeGreaterThan(session.created_at.getTime());
        expect(['active', 'expired', 'revoked']).toContain(session.status);

        // IP address validation (if present)
        if (session.ip_address) {
          expect(session.ip_address).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        }
      }
    });

    it('should validate mobile notification system', async () => {
      const notifications = await dataSource.getRepository(MobileNotificationEntity).find({
        relations: ['device', 'user'],
      });

      expect(notifications.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_MOBILE_NOTIFICATIONS);

      for (const notification of notifications) {
        // Required fields
        expect(notification.title).toBeDefined();
        expect(notification.message).toBeDefined();
        expect(notification.type).toBeDefined();

        // Notification type validation
        expect(['order_update', 'promotion', 'system', 'marketing', 'security']).toContain(notification.type);

        // Status validation
        expect(['pending', 'sent', 'delivered', 'failed', 'read']).toContain(notification.status);

        // Timestamp validation
        expect(notification.created_at).toBeInstanceOf(Date);
        
        if (notification.sent_at) {
          expect(notification.sent_at.getTime()).toBeGreaterThanOrEqual(notification.created_at.getTime());
        }

        // Priority validation
        expect(['low', 'normal', 'high', 'urgent']).toContain(notification.priority);

        // Relationships
        expect(notification.device || notification.user).toBeTruthy(); // At least one should be present
      }
    });
  });

  describe('Mobile Authentication API', () => {
    beforeEach(async () => {
      await mobileSeederService.seedMobileData();
    });

    it('should handle mobile authentication flow with OTP', async () => {
      const startTime = Date.now();

      // Step 1: Request OTP
      const otpResponse = await request(app.getHttpServer())
        .post('/mobile/v1/auth/request-otp')
        .send({
          phone_number: '+963987654321',
          device_id: 'test-device-12345',
          platform: 'iOS',
        })
        .expect(200);

      expect(otpResponse.body).toHaveProperty('success', true);
      expect(otpResponse.body).toHaveProperty('otp_sent', true);
      expect(otpResponse.body).toHaveProperty('expires_in');

      // Step 2: Verify OTP (simulate)
      const verifyResponse = await request(app.getHttpServer())
        .post('/mobile/v1/auth/verify-otp')
        .send({
          phone_number: '+963987654321',
          otp_code: '123456', // Test OTP
          device_id: 'test-device-12345',
        })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.MOBILE_API_RESPONSE_TIME * 2);

      expect(verifyResponse.body).toHaveProperty('access_token');
      expect(verifyResponse.body).toHaveProperty('refresh_token');
      expect(verifyResponse.body).toHaveProperty('user');
      expect(verifyResponse.body).toHaveProperty('session_id');
    });

    it('should manage mobile device registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/mobile/v1/auth/register-device')
        .send({
          device_id: 'new-test-device-67890',
          platform: 'Android',
          app_version: '1.2.3',
          os_version: '12.0',
          device_model: 'Samsung Galaxy S21',
          push_token: 'fcm-token-12345',
        })
        .expect(201);

      expect(response.body).toHaveProperty('device_registered', true);
      expect(response.body).toHaveProperty('device_id', 'new-test-device-67890');

      // Verify device was created in database
      const device = await dataSource.getRepository(MobileDeviceEntity).findOne({
        where: { device_id: 'new-test-device-67890' },
      });

      expect(device).toBeDefined();
      expect(device.platform).toBe('Android');
      expect(device.app_version).toBe('1.2.3');
    });

    it('should handle mobile session refresh', async () => {
      // First create a session
      const authResponse = await request(app.getHttpServer())
        .post('/mobile/v1/auth/verify-otp')
        .send({
          phone_number: '+963987654321',
          otp_code: '123456',
          device_id: 'test-device-refresh',
        })
        .expect(200);

      const refreshToken = authResponse.body.refresh_token;

      // Then refresh the session
      const refreshResponse = await request(app.getHttpServer())
        .post('/mobile/v1/auth/refresh')
        .send({
          refresh_token: refreshToken,
          device_id: 'test-device-refresh',
        })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('access_token');
      expect(refreshResponse.body).toHaveProperty('refresh_token');
      expect(refreshResponse.body.access_token).not.toBe(authResponse.body.access_token);
    });
  });

  describe('Mobile Product API', () => {
    beforeEach(async () => {
      await mobileSeederService.seedMobileData();
    });

    it('should provide mobile-optimized product listings', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/mobile/v1/products')
        .query({ 
          page: 1, 
          limit: 20,
          optimize_images: true,
          image_format: 'webp'
        })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.MOBILE_API_RESPONSE_TIME);

      // Validate response structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Validate mobile optimization
      const responseSize = JSON.stringify(response.body).length / 1024; // Size in KB
      expect(responseSize).toBeLessThan(TEST_CONFIG.MOBILE_OPTIMIZATION.MAX_RESPONSE_SIZE_KB);

      // Validate product data structure
      response.body.data.forEach(product => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('images');

        // Validate mobile-optimized images
        if (product.images && product.images.length > 0) {
          product.images.forEach(image => {
            expect(image).toHaveProperty('url');
            expect(image).toHaveProperty('format');
            expect(image).toHaveProperty('size');
            expect(TEST_CONFIG.VALIDATION_RULES.IMAGE_FORMATS).toContain(image.format);
          });
        }
      });
    });

    it('should provide fast mobile search functionality', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/mobile/v1/search')
        .query({
          q: 'Samsung',
          category: 'Electronics',
          limit: 10,
          mobile_optimized: true,
        })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(Array.isArray(response.body.suggestions)).toBe(true);

      // Validate search results are mobile-optimized
      response.body.results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('price');
        expect(result).toHaveProperty('thumbnail'); // Mobile should have thumbnails
      });
    });

    it('should handle mobile image optimization requests', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/mobile/v1/products/1/images')
        .query({
          format: 'webp',
          quality: 80,
          width: 400,
          height: 400,
        })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.IMAGE_OPTIMIZATION_TIME);

      expect(response.body).toHaveProperty('images');
      expect(Array.isArray(response.body.images)).toBe(true);

      response.body.images.forEach(image => {
        expect(image).toHaveProperty('url');
        expect(image).toHaveProperty('format', 'webp');
        expect(image).toHaveProperty('width', 400);
        expect(image).toHaveProperty('height', 400);
        expect(image).toHaveProperty('size_kb');
      });
    });
  });

  describe('Mobile Cart and Orders API', () => {
    beforeEach(async () => {
      await mobileSeederService.seedMobileData();
    });

    it('should handle mobile cart operations efficiently', async () => {
      // Add item to cart
      const addResponse = await request(app.getHttpServer())
        .post('/mobile/v1/cart/add')
        .send({
          product_id: 1,
          variant_id: 1,
          quantity: 2,
          device_id: 'test-device-cart',
        })
        .expect(200);

      expect(addResponse.body).toHaveProperty('success', true);
      expect(addResponse.body).toHaveProperty('cart_item_id');

      // Get cart
      const cartResponse = await request(app.getHttpServer())
        .get('/mobile/v1/cart')
        .query({ device_id: 'test-device-cart' })
        .expect(200);

      expect(cartResponse.body).toHaveProperty('items');
      expect(cartResponse.body).toHaveProperty('total_amount');
      expect(Array.isArray(cartResponse.body.items)).toBe(true);
      expect(cartResponse.body.items.length).toBeGreaterThan(0);
    });

    it('should handle mobile order creation and tracking', async () => {
      // Create order
      const orderResponse = await request(app.getHttpServer())
        .post('/mobile/v1/orders')
        .send({
          cart_items: [
            { product_id: 1, variant_id: 1, quantity: 1 },
            { product_id: 2, variant_id: 2, quantity: 2 },
          ],
          shipping_address: {
            street: 'Test Street',
            city: 'Damascus',
            governorate: 'Damascus',
            phone: '+963987654321',
          },
          payment_method: 'cod',
          device_id: 'test-device-order',
        })
        .expect(201);

      expect(orderResponse.body).toHaveProperty('order_id');
      expect(orderResponse.body).toHaveProperty('order_number');
      expect(orderResponse.body).toHaveProperty('status');

      const orderId = orderResponse.body.order_id;

      // Track order
      const trackResponse = await request(app.getHttpServer())
        .get(`/mobile/v1/orders/${orderId}/track`)
        .expect(200);

      expect(trackResponse.body).toHaveProperty('order_id', orderId);
      expect(trackResponse.body).toHaveProperty('status');
      expect(trackResponse.body).toHaveProperty('tracking_events');
      expect(Array.isArray(trackResponse.body.tracking_events)).toBe(true);
    });
  });

  describe('Mobile Notifications System', () => {
    beforeEach(async () => {
      await mobileSeederService.seedMobileData();
    });

    it('should send and track mobile push notifications', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/mobile/v1/notifications/send')
        .send({
          device_ids: ['test-device-notification-1', 'test-device-notification-2'],
          title: 'Test Notification',
          message: 'This is a test notification for mobile devices',
          type: 'promotion',
          priority: 'normal',
          data: {
            action: 'view_product',
            product_id: 123,
          },
        })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.NOTIFICATION_DELIVERY_TIME);

      expect(response.body).toHaveProperty('notifications_sent');
      expect(response.body).toHaveProperty('batch_id');
      expect(response.body.notifications_sent).toBeGreaterThan(0);
    });

    it('should retrieve mobile notification history', async () => {
      const response = await request(app.getHttpServer())
        .get('/mobile/v1/notifications/history')
        .query({
          device_id: 'test-device-history',
          limit: 20,
          status: 'delivered',
        })
        .expect(200);

      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('unread_count');
      expect(Array.isArray(response.body.notifications)).toBe(true);

      response.body.notifications.forEach(notification => {
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('title');
        expect(notification).toHaveProperty('message');
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('status');
        expect(notification).toHaveProperty('created_at');
      });
    });

    it('should handle notification preferences management', async () => {
      const response = await request(app.getHttpServer())
        .put('/mobile/v1/notifications/preferences')
        .send({
          device_id: 'test-device-preferences',
          preferences: {
            order_updates: true,
            promotions: false,
            marketing: false,
            system: true,
            security: true,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('preferences_updated', true);
      expect(response.body).toHaveProperty('device_id', 'test-device-preferences');
    });
  });

  describe('Data Integrity and Mobile Security', () => {
    it('should maintain mobile session security', async () => {
      const sessions = await dataSource.getRepository(MobileSessionEntity).find();

      for (const session of sessions) {
        // Validate session token is properly encrypted/hashed
        expect(session.session_token).toBeTruthy();
        expect(session.session_token.length).toBeGreaterThan(20);

        // Validate expiration times
        expect(session.expires_at.getTime()).toBeGreaterThan(session.created_at.getTime());

        // Validate device association
        expect(session.device_id).toBeTruthy();
      }
    });

    it('should validate mobile device uniqueness', async () => {
      const devices = await dataSource.getRepository(MobileDeviceEntity).find();

      const deviceIds = devices.map(device => device.device_id);
      const uniqueDeviceIds = new Set(deviceIds);

      // Ensure all device IDs are unique
      expect(deviceIds.length).toBe(uniqueDeviceIds.size);
    });

    it('should handle mobile OTP security', async () => {
      const otpRecords = await dataSource.getRepository(MobileOTPEntity).find();

      for (const otp of otpRecords) {
        // Validate OTP code format
        expect(otp.otp_code).toMatch(/^\d{6}$/); // 6-digit numeric

        // Validate expiration
        expect(otp.expires_at).toBeInstanceOf(Date);
        
        // Validate attempt tracking
        expect(otp.attempts).toBeGreaterThanOrEqual(0);
        expect(otp.attempts).toBeLessThanOrEqual(5); // Max attempts

        // Validate status
        expect(['pending', 'verified', 'expired', 'failed']).toContain(otp.status);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid device ID gracefully', async () => {
      await request(app.getHttpServer())
        .get('/mobile/v1/cart')
        .query({ device_id: 'invalid-device-id-format' })
        .expect(400);
    });

    it('should handle expired mobile sessions', async () => {
      await request(app.getHttpServer())
        .get('/mobile/v1/user/profile')
        .set('Authorization', 'Bearer expired-jwt-token')
        .expect(401);
    });

    it('should handle mobile network timeouts gracefully', async () => {
      // Simulate slow network by testing with minimal timeout
      const response = await request(app.getHttpServer())
        .get('/mobile/v1/products')
        .query({ timeout: 1 }) // Very short timeout
        .expect(200);

      // Should still respond but may have reduced data
      expect(response.body).toHaveProperty('data');
    });

    it('should handle concurrent mobile operations', async () => {
      const promises = Array(10).fill(0).map((_, index) =>
        request(app.getHttpServer())
          .post('/mobile/v1/cart/add')
          .send({
            product_id: 1,
            variant_id: 1,
            quantity: 1,
            device_id: `concurrent-device-${index}`,
          })
      );

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect([200, 201]).toContain(result.status);
      });
    });
  });

  describe('System Performance Under Mobile Load', () => {
    it('should maintain performance under concurrent mobile API calls', async () => {
      const startTime = Date.now();

      const promises = Array(15).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/mobile/v1/products')
          .query({ limit: 10, optimize_images: true })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.MOBILE_API_RESPONSE_TIME * 3);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should handle high-volume mobile notification delivery', async () => {
      const startTime = Date.now();

      const notificationPromises = Array(5).fill(0).map((_, index) =>
        request(app.getHttpServer())
          .post('/mobile/v1/notifications/send')
          .send({
            device_ids: [`perf-test-device-${index}`],
            title: `Performance Test ${index}`,
            message: 'Performance testing notification',
            type: 'system',
            priority: 'normal',
          })
      );

      const results = await Promise.all(notificationPromises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.NOTIFICATION_DELIVERY_TIME * 2);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should optimize mobile search performance', async () => {
      const searchQueries = ['Samsung', 'iPhone', 'Nike', 'Adidas', 'Sony'];
      
      const startTime = Date.now();

      const promises = searchQueries.map(query =>
        request(app.getHttpServer())
          .get('/mobile/v1/search')
          .query({ 
            q: query, 
            limit: 5,
            mobile_optimized: true,
          })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME * searchQueries.length);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });
});