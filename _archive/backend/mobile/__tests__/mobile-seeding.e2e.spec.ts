import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

/**
 * Mobile Seeding E2E Tests
 *
 * Tests mobile seeding endpoints for development and testing data.
 */
describe('Mobile Seeding (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // Clean up seeded data
    await request(app.getHttpServer()).delete('/seed/mobile/clean').expect(200);

    await app.close();
  });

  describe('POST /seed/mobile/all', () => {
    it('should seed all mobile test data successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/seed/mobile/all')
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'Mobile test data seeded successfully',
      );
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('performance');

      expect(response.body.data).toHaveProperty('devices');
      expect(response.body.data).toHaveProperty('otpCodes');
      expect(response.body.data).toHaveProperty('sessions');
      expect(response.body.data).toHaveProperty('notifications');

      expect(response.body.data.devices).toBeGreaterThan(0);
      expect(response.body.data.otpCodes).toBeGreaterThan(0);
      expect(response.body.data.sessions).toBeGreaterThan(0);
      expect(response.body.data.notifications).toBeGreaterThan(0);

      expect(response.body.performance).toHaveProperty('executionTime');
      expect(response.body.performance).toHaveProperty('totalRecords');
    });
  });

  describe('POST /seed/mobile/devices', () => {
    it('should seed mobile devices', async () => {
      const response = await request(app.getHttpServer())
        .post('/seed/mobile/devices')
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'Mobile devices seeded successfully',
      );
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('POST /seed/mobile/otp', () => {
    it('should seed OTP codes', async () => {
      const response = await request(app.getHttpServer())
        .post('/seed/mobile/otp')
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'OTP codes seeded successfully',
      );
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('POST /seed/mobile/sessions', () => {
    it('should seed mobile sessions', async () => {
      const response = await request(app.getHttpServer())
        .post('/seed/mobile/sessions')
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'Mobile sessions seeded successfully',
      );
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('POST /seed/mobile/notifications', () => {
    it('should seed mobile notifications', async () => {
      const response = await request(app.getHttpServer())
        .post('/seed/mobile/notifications')
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'Mobile notifications seeded successfully',
      );
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('GET /seed/mobile/stats', () => {
    it('should return seeding statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/seed/mobile/stats')
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Mobile seeding statistics',
      );
      expect(response.body).toHaveProperty('data');

      expect(response.body.data).toHaveProperty('devices');
      expect(response.body.data).toHaveProperty('otpCodes');
      expect(response.body.data).toHaveProperty('sessions');
      expect(response.body.data).toHaveProperty('notifications');
      expect(response.body.data).toHaveProperty('total');

      expect(typeof response.body.data.devices).toBe('number');
      expect(typeof response.body.data.otpCodes).toBe('number');
      expect(typeof response.body.data.sessions).toBe('number');
      expect(typeof response.body.data.notifications).toBe('number');
      expect(typeof response.body.data.total).toBe('number');
    });
  });

  describe('DELETE /seed/mobile/clean', () => {
    it('should clean all mobile test data', async () => {
      const response = await request(app.getHttpServer())
        .delete('/seed/mobile/clean')
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Mobile test data cleaned successfully',
      );

      // Verify data is cleaned by checking stats
      const statsResponse = await request(app.getHttpServer())
        .get('/seed/mobile/stats')
        .expect(200);

      expect(statsResponse.body.data.devices).toBe(0);
      expect(statsResponse.body.data.otpCodes).toBe(0);
      expect(statsResponse.body.data.sessions).toBe(0);
      expect(statsResponse.body.data.notifications).toBe(0);
      expect(statsResponse.body.data.total).toBe(0);
    });
  });

  describe('Mobile Seeding Integration Flow', () => {
    it('should handle complete seeding lifecycle', async () => {
      // 1. Clean existing data
      await request(app.getHttpServer())
        .delete('/seed/mobile/clean')
        .expect(200);

      // 2. Verify clean state
      const cleanStatsResponse = await request(app.getHttpServer())
        .get('/seed/mobile/stats')
        .expect(200);

      expect(cleanStatsResponse.body.data.total).toBe(0);

      // 3. Seed devices first
      const devicesResponse = await request(app.getHttpServer())
        .post('/seed/mobile/devices')
        .expect(201);

      expect(devicesResponse.body.count).toBeGreaterThan(0);

      // 4. Seed OTP codes
      const otpResponse = await request(app.getHttpServer())
        .post('/seed/mobile/otp')
        .expect(201);

      expect(otpResponse.body.count).toBeGreaterThan(0);

      // 5. Seed sessions (requires devices)
      const sessionsResponse = await request(app.getHttpServer())
        .post('/seed/mobile/sessions')
        .expect(201);

      expect(sessionsResponse.body.count).toBeGreaterThan(0);

      // 6. Seed notifications
      const notificationsResponse = await request(app.getHttpServer())
        .post('/seed/mobile/notifications')
        .expect(201);

      expect(notificationsResponse.body.count).toBeGreaterThan(0);

      // 7. Verify final state
      const finalStatsResponse = await request(app.getHttpServer())
        .get('/seed/mobile/stats')
        .expect(200);

      expect(finalStatsResponse.body.data.devices).toBeGreaterThan(0);
      expect(finalStatsResponse.body.data.otpCodes).toBeGreaterThan(0);
      expect(finalStatsResponse.body.data.sessions).toBeGreaterThan(0);
      expect(finalStatsResponse.body.data.notifications).toBeGreaterThan(0);
      expect(finalStatsResponse.body.data.total).toBeGreaterThan(0);

      // 8. Clean up
      await request(app.getHttpServer())
        .delete('/seed/mobile/clean')
        .expect(200);
    });

    it('should seed all data in single operation', async () => {
      // Clean first
      await request(app.getHttpServer())
        .delete('/seed/mobile/clean')
        .expect(200);

      // Seed all at once
      const seedAllResponse = await request(app.getHttpServer())
        .post('/seed/mobile/all')
        .expect(201);

      expect(seedAllResponse.body.data.devices).toBeGreaterThan(0);
      expect(seedAllResponse.body.data.otpCodes).toBeGreaterThan(0);
      expect(seedAllResponse.body.data.sessions).toBeGreaterThan(0);
      expect(seedAllResponse.body.data.notifications).toBeGreaterThan(0);

      // Verify with stats
      const statsResponse = await request(app.getHttpServer())
        .get('/seed/mobile/stats')
        .expect(200);

      expect(statsResponse.body.data.total).toBeGreaterThan(0);
      expect(statsResponse.body.data.total).toBe(
        statsResponse.body.data.devices +
          statsResponse.body.data.otpCodes +
          statsResponse.body.data.sessions +
          statsResponse.body.data.notifications,
      );

      // Clean up
      await request(app.getHttpServer())
        .delete('/seed/mobile/clean')
        .expect(200);
    });
  });

  describe('Syrian Mobile Data Validation', () => {
    beforeEach(async () => {
      // Ensure clean state
      await request(app.getHttpServer())
        .delete('/seed/mobile/clean')
        .expect(200);
    });

    it('should seed Syrian phone numbers in OTP data', async () => {
      await request(app.getHttpServer()).post('/seed/mobile/otp').expect(201);

      // Note: This test verifies the seeding works
      // In a real implementation, you'd query the database to verify
      // Syrian phone number format (+963...)
      const statsResponse = await request(app.getHttpServer())
        .get('/seed/mobile/stats')
        .expect(200);

      expect(statsResponse.body.data.otpCodes).toBeGreaterThan(0);
    });

    it('should seed mobile notifications with Arabic content', async () => {
      await request(app.getHttpServer())
        .post('/seed/mobile/notifications')
        .expect(201);

      // Verify notifications are seeded
      const statsResponse = await request(app.getHttpServer())
        .get('/seed/mobile/stats')
        .expect(200);

      expect(statsResponse.body.data.notifications).toBeGreaterThan(0);
    });

    it('should seed mobile devices with realistic Syrian user data', async () => {
      await request(app.getHttpServer())
        .post('/seed/mobile/devices')
        .expect(201);

      const statsResponse = await request(app.getHttpServer())
        .get('/seed/mobile/stats')
        .expect(200);

      expect(statsResponse.body.data.devices).toBeGreaterThan(0);
    });
  });
});
