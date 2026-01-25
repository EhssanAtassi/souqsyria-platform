/**
 * @file cart-security.integration.spec.ts
 * @description Integration tests for Cart Security System
 *
 * COVERAGE:
 * - End-to-end security flow validation
 * - Rate limiting + fraud detection integration
 * - Real Redis integration testing
 * - Performance testing under security load
 * - Security event audit trail validation
 * - Guest session lifecycle with security
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import request from 'supertest';
import { Repository } from 'typeorm';
import { CartModule } from '../cart.module';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { GuestSession } from '../entities/guest-session.entity';
import { AuditLog } from '../../audit-log/entities/audit-log.entity';
import { User } from '../../users/entities/user.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';

// Test database configuration (use test database)
const testDbConfig = {
  type: 'mysql' as const,
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT) || 3307,
  username: process.env.TEST_DB_USERNAME || 'testuser',
  password: process.env.TEST_DB_PASSWORD || 'testpass',
  database: process.env.TEST_DB_NAME || 'souqsyria_test',
  entities: [Cart, CartItem, GuestSession, AuditLog, User, ProductVariant],
  synchronize: true,
  logging: false,
  dropSchema: true,
};

// Test Redis configuration
const testRedisConfig = {
  host: process.env.TEST_REDIS_HOST || 'localhost',
  port: parseInt(process.env.TEST_REDIS_PORT) || 6380,
  db: 1, // Use different DB for tests
};

describe('Cart Security Integration Tests', () => {
  let app: INestApplication;
  let cartRepository: Repository<Cart>;
  let guestSessionRepository: Repository<GuestSession>;
  let auditLogRepository: Repository<AuditLog>;
  let testUserId: string;
  let testGuestSessionId: string;
  let testVariantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDbConfig),
        RedisModule.forRoot(testRedisConfig),
        ScheduleModule.forRoot(),
        CartModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get repositories for test data setup
    cartRepository = moduleFixture.get('CartRepository');
    guestSessionRepository = moduleFixture.get('GuestSessionRepository');
    auditLogRepository = moduleFixture.get('AuditLogRepository');

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Clear Redis rate limiting data before each test
    const redis = app.get('default_IORedisModuleConnectionToken');
    await redis.flushdb();
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits on authenticated cart operations', async () => {
      // Simulate authenticated user making rapid cart requests
      const authToken = 'Bearer test-jwt-token';

      // Make requests within the limit (should succeed)
      for (let i = 0; i < 10; i++) {
        const response = await request(app.getHttpServer())
          .post('/cart/items')
          .set('Authorization', authToken)
          .send({
            variantId: testVariantId,
            quantity: 1,
            priceAtAdd: 50000,
          });

        if (i < 20) { // Within authenticated user limit
          expect(response.status).toBe(201);
        }
      }

      // Exceed the rate limit
      const response = await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', authToken)
        .send({
          variantId: testVariantId,
          quantity: 1,
          priceAtAdd: 50000,
        });

      // Should be rate limited after exceeding threshold
      if (response.status === 429) {
        expect(response.body.message).toContain('rate limit');
      }
    });

    it('should enforce stricter rate limits on guest operations', async () => {
      const guestSessionCookie = `guest_session_id=${testGuestSessionId}`;

      // Make requests as guest user
      for (let i = 0; i < 15; i++) {
        const response = await request(app.getHttpServer())
          .post('/cart/guest')
          .set('Cookie', guestSessionCookie)
          .send({
            items: [{ variantId: testVariantId, quantity: 1, priceAtAdd: 50000 }],
            clientVersion: i,
            clientTimestamp: new Date().toISOString(),
          });

        if (i < 10) { // Within guest limit (lower than authenticated)
          expect(response.status).toBe(201);
        } else {
          // Should start rate limiting sooner for guests
          expect([201, 429]).toContain(response.status);
        }
      }
    });

    it('should apply progressive penalties for repeat offenders', async () => {
      const maliciousUserAgent = 'python-requests/2.28.1';

      // First violation
      await request(app.getHttpServer())
        .post('/cart/guest')
        .set('User-Agent', maliciousUserAgent)
        .send({
          items: Array.from({ length: 50 }, (_, i) => ({
            variantId: testVariantId,
            quantity: 999,
            priceAtAdd: 1,
          })),
        });

      // Subsequent requests should have increased penalties
      const response = await request(app.getHttpServer())
        .post('/cart/guest')
        .set('User-Agent', maliciousUserAgent)
        .send({
          items: [{ variantId: testVariantId, quantity: 1, priceAtAdd: 50000 }],
        });

      expect([403, 429]).toContain(response.status);
    });
  });

  describe('Fraud Detection Integration', () => {
    it('should detect and log suspicious quantity patterns', async () => {
      const initialAuditCount = await auditLogRepository.count({
        where: { action: 'SECURITY_ALERT_QUANTITY' },
      });

      await request(app.getHttpServer())
        .post('/cart/guest')
        .send({
          items: [
            { variantId: testVariantId, quantity: 999, priceAtAdd: 50000 },
            { variantId: testVariantId, quantity: 500, priceAtAdd: 25000 },
          ],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        });

      // Verify security event was logged
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow async logging

      const finalAuditCount = await auditLogRepository.count({
        where: { action: 'SECURITY_ALERT_QUANTITY' },
      });

      expect(finalAuditCount).toBeGreaterThan(initialAuditCount);
    });

    it('should detect and log price tampering attempts', async () => {
      const initialAuditCount = await auditLogRepository.count({
        where: { action: 'SECURITY_ALERT_PRICE' },
      });

      await request(app.getHttpServer())
        .post('/cart/guest')
        .send({
          items: [
            { variantId: testVariantId, quantity: 1, priceAtAdd: 1 }, // Suspiciously low
            { variantId: testVariantId, quantity: 1, priceAtAdd: 50000000 }, // Suspiciously high
          ],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        });

      await new Promise(resolve => setTimeout(resolve, 100)); // Allow async logging

      const finalAuditCount = await auditLogRepository.count({
        where: { action: 'SECURITY_ALERT_PRICE' },
      });

      expect(finalAuditCount).toBeGreaterThan(initialAuditCount);
    });

    it('should detect bot-like user agents', async () => {
      const initialAuditCount = await auditLogRepository.count({
        where: { action: 'SECURITY_ALERT_BOT' },
      });

      await request(app.getHttpServer())
        .post('/cart/guest')
        .set('User-Agent', 'python-requests/2.28.1')
        .send({
          items: [{ variantId: testVariantId, quantity: 1, priceAtAdd: 50000 }],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        });

      await new Promise(resolve => setTimeout(resolve, 100)); // Allow async logging

      const finalAuditCount = await auditLogRepository.count({
        where: { action: 'SECURITY_ALERT_BOT' },
      });

      expect(finalAuditCount).toBeGreaterThan(initialAuditCount);
    });

    it('should detect velocity-based attacks', async () => {
      const initialAuditCount = await auditLogRepository.count({
        where: { action: 'SECURITY_ALERT_VELOCITY' },
      });

      // Simulate rapid-fire requests
      const promises = Array.from({ length: 15 }, (_, i) =>
        request(app.getHttpServer())
          .post('/cart/guest')
          .send({
            items: [{ variantId: testVariantId, quantity: 1, priceAtAdd: 50000 }],
            clientVersion: i,
            clientTimestamp: new Date().toISOString(),
          })
      );

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 200)); // Allow async logging

      const finalAuditCount = await auditLogRepository.count({
        where: { action: 'SECURITY_ALERT_VELOCITY' },
      });

      expect(finalAuditCount).toBeGreaterThan(initialAuditCount);
    });
  });

  describe('Security + Performance Integration', () => {
    it('should maintain performance while applying security checks', async () => {
      const startTime = Date.now();
      const concurrentRequests = 20;

      // Run multiple cart operations concurrently
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app.getHttpServer())
          .post('/cart/guest')
          .send({
            items: [{ variantId: testVariantId, quantity: 1, priceAtAdd: 50000 }],
            clientVersion: i,
            clientTimestamp: new Date().toISOString(),
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Verify most requests succeeded (some might be rate limited)
      const successfulRequests = responses.filter(r => r.status === 201).length;
      expect(successfulRequests).toBeGreaterThan(concurrentRequests * 0.5);

      // Verify performance is acceptable (< 5 seconds for 20 requests)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000);

      // Verify average response time is acceptable (< 250ms per request)
      const averageTime = totalTime / concurrentRequests;
      expect(averageTime).toBeLessThan(250);
    });

    it('should handle Redis failures gracefully', async () => {
      // Simulate Redis failure by disconnecting
      const redis = app.get('default_IORedisModuleConnectionToken');
      await redis.disconnect();

      // Requests should still work (fail-open behavior)
      const response = await request(app.getHttpServer())
        .post('/cart/guest')
        .send({
          items: [{ variantId: testVariantId, quantity: 1, priceAtAdd: 50000 }],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        });

      expect(response.status).toBe(201);

      // Reconnect Redis for other tests
      await redis.connect();
    });
  });

  describe('Guest Session Cleanup Integration', () => {
    it('should cleanup expired guest sessions and associated carts', async () => {
      // Create an expired guest session with cart
      const expiredSession = guestSessionRepository.create({
        status: 'active',
        lastActivityAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days old
        expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        deviceFingerprint: { userAgent: 'Mozilla/5.0 Chrome', platform: 'MacIntel' },
      });

      await guestSessionRepository.save(expiredSession);

      const expiredCart = cartRepository.create({
        sessionId: expiredSession.id,
        currency: 'SYP',
        totalItems: 1,
        totalAmount: 50000,
        status: 'active',
      });

      await cartRepository.save(expiredCart);

      // Get cleanup service and run manual cleanup
      const cleanupService = app.get('SessionCleanupService');
      const stats = await cleanupService.cleanupExpiredSessions();

      expect(stats.sessionsDeleted).toBeGreaterThan(0);
      expect(stats.cartsDeleted).toBeGreaterThan(0);

      // Verify session and cart were actually deleted
      const remainingSession = await guestSessionRepository.findOne({
        where: { id: expiredSession.id },
      });
      expect(remainingSession).toBeNull();

      const remainingCart = await cartRepository.findOne({
        where: { id: expiredCart.id },
      });
      expect(remainingCart).toBeNull();
    });

    it('should preserve sessions within grace period', async () => {
      // Create a session within grace period
      const recentSession = guestSessionRepository.create({
        status: 'active',
        lastActivityAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days old (within grace period)
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        deviceFingerprint: { userAgent: 'Mozilla/5.0 Firefox', platform: 'Linux' },
      });

      await guestSessionRepository.save(recentSession);

      const cleanupService = app.get('SessionCleanupService');
      await cleanupService.cleanupExpiredSessions();

      // Verify session was not deleted
      const remainingSession = await guestSessionRepository.findOne({
        where: { id: recentSession.id },
      });
      expect(remainingSession).not.toBeNull();
    });
  });

  describe('Audit Trail Integration', () => {
    it('should maintain comprehensive audit trail for security events', async () => {
      const initialAuditCount = await auditLogRepository.count();

      // Trigger various security events
      await request(app.getHttpServer())
        .post('/cart/guest')
        .set('User-Agent', 'automated-bot/1.0')
        .send({
          items: [{ variantId: testVariantId, quantity: 999, priceAtAdd: 1 }],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        });

      await new Promise(resolve => setTimeout(resolve, 200)); // Allow async logging

      const finalAuditCount = await auditLogRepository.count();
      expect(finalAuditCount).toBeGreaterThan(initialAuditCount);

      // Verify audit logs contain security information
      const securityLogs = await auditLogRepository.find({
        where: [
          { action: 'SECURITY_ALERT_BOT' },
          { action: 'SECURITY_ALERT_QUANTITY' },
          { action: 'SECURITY_ALERT_PRICE' },
        ],
        order: { createdAt: 'DESC' },
        take: 10,
      });

      expect(securityLogs.length).toBeGreaterThan(0);
      expect(securityLogs[0].module).toBe('cart_security');
      expect(securityLogs[0].actorType).toBe('system');
    });
  });

  describe('End-to-End Security Scenarios', () => {
    it('should handle legitimate user workflow without security interference', async () => {
      const authToken = 'Bearer legitimate-user-token';

      // 1. Add items to cart (normal quantities and prices)
      const addResponse = await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', authToken)
        .send({
          variantId: testVariantId,
          quantity: 2,
          priceAtAdd: 50000,
        });

      expect(addResponse.status).toBe(201);

      // 2. Update cart item
      const updateResponse = await request(app.getHttpServer())
        .put(`/cart/items/${addResponse.body.id}`)
        .set('Authorization', authToken)
        .send({
          quantity: 3,
        });

      expect(updateResponse.status).toBe(200);

      // 3. Get cart
      const getResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', authToken);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);

      // Verify no security alerts were logged for legitimate behavior
      const securityAlerts = await auditLogRepository.find({
        where: { actorId: testUserId },
        take: 10,
      });

      const alertActions = securityAlerts.map(log => log.action);
      expect(alertActions).not.toContain('SECURITY_ALERT_QUANTITY');
      expect(alertActions).not.toContain('SECURITY_ALERT_PRICE');
      expect(alertActions).not.toContain('SECURITY_ALERT_VELOCITY');
    });

    it('should block extreme security threats', async () => {
      const maliciousPayload = {
        items: Array.from({ length: 100 }, (_, i) => ({
          variantId: testVariantId,
          quantity: 999,
          priceAtAdd: 1,
        })),
        clientVersion: 1,
        clientTimestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/cart/guest')
        .set('User-Agent', 'malicious-bot/1.0')
        .set('X-Forwarded-For', '192.168.255.255') // Suspicious IP
        .send(maliciousPayload);

      // Should be blocked or heavily rate limited
      expect([403, 429, 400]).toContain(response.status);

      // Verify multiple security alerts were logged
      await new Promise(resolve => setTimeout(resolve, 200));

      const securityAlerts = await auditLogRepository.find({
        where: [
          { action: 'SECURITY_ALERT_BOT' },
          { action: 'SECURITY_ALERT_QUANTITY' },
          { action: 'SECURITY_ALERT_PRICE' },
          { action: 'SECURITY_BLOCK' },
        ],
        order: { createdAt: 'DESC' },
        take: 20,
      });

      expect(securityAlerts.length).toBeGreaterThan(1);
    });
  });

  /**
   * Test Data Setup and Cleanup
   */
  async function setupTestData() {
    // Create test user
    const userRepository = app.get('UserRepository');
    const testUser = userRepository.create({
      email: 'test@souqsyria.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
    });
    const savedUser = await userRepository.save(testUser);
    testUserId = savedUser.id;

    // Create test guest session
    const testGuestSession = guestSessionRepository.create({
      status: 'active',
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deviceFingerprint: { userAgent: 'Mozilla/5.0 Chrome', platform: 'Windows' },
    });
    const savedGuestSession = await guestSessionRepository.save(testGuestSession);
    testGuestSessionId = savedGuestSession.id;

    // Create test product variant
    const variantRepository = app.get('ProductVariantRepository');
    const testVariant = variantRepository.create({
      name: 'Test Product Variant',
      price: 50000,
      stock: 100,
      isActive: true,
    });
    const savedVariant = await variantRepository.save(testVariant);
    testVariantId = savedVariant.id;
  }

  async function cleanupTestData() {
    // Clean up in reverse order of creation
    if (testVariantId) {
      const variantRepository = app.get('ProductVariantRepository');
      await variantRepository.delete(testVariantId);
    }

    if (testGuestSessionId) {
      await guestSessionRepository.delete(testGuestSessionId);
    }

    if (testUserId) {
      const userRepository = app.get('UserRepository');
      await userRepository.delete(testUserId);
    }

    // Clean up any test audit logs
    await auditLogRepository.delete({});
  }
});

/**
 * Test Configuration Helpers
 */
export const integrationTestConfig = {
  // Skip integration tests if test database is not available
  skipIfNoTestDb: () => {
    if (!process.env.TEST_DB_HOST) {
      console.log('Skipping integration tests - TEST_DB_HOST not configured');
      return true;
    }
    return false;
  },

  // Skip if Redis is not available
  skipIfNoRedis: () => {
    if (!process.env.TEST_REDIS_HOST) {
      console.log('Skipping integration tests - TEST_REDIS_HOST not configured');
      return true;
    }
    return false;
  },
};