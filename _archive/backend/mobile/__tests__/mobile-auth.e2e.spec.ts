import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { MobileSeederService } from '../seeds/mobile.seeder.service';

/**
 * Mobile Authentication E2E Tests
 *
 * Tests mobile authentication endpoints including:
 * - Email/password login
 * - Phone/OTP authentication
 * - Token refresh
 * - Device registration
 */
describe('Mobile Authentication (e2e)', () => {
  let app: INestApplication;
  let seederService: MobileSeederService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    seederService = moduleFixture.get<MobileSeederService>(MobileSeederService);

    await app.init();

    // Clean and seed test data
    await seederService.cleanAll(false);
    await seederService.seedAll();
  });

  afterAll(async () => {
    await seederService.cleanAll(false);
    await app.close();
  });

  describe('POST /api/mobile/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
          deviceId: 'test-device-123',
          deviceType: 'android',
          pushToken: 'test-push-token',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'user@example.com');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.tokens).toHaveProperty('expiresIn');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'wrongpassword',
          deviceId: 'test-device-123',
          deviceType: 'android',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'user@example.com',
          // Missing password
          deviceId: 'test-device-123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });
  });

  describe('POST /api/mobile/v1/auth/phone/initiate', () => {
    it('should initiate phone login with Syrian number', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/phone/initiate')
        .send({
          phone: '991234567',
          countryCode: '+963',
          deviceId: 'test-device-456',
        })
        .expect(200);

      expect(response.body).toHaveProperty('otpSent', true);
      expect(response.body).toHaveProperty('expiresAt');

      // Verify expiration is in the future
      const expirationTime = new Date(response.body.expiresAt);
      expect(expirationTime.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle invalid phone number format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/phone/initiate')
        .send({
          phone: '123', // Invalid format
          deviceId: 'test-device-456',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/mobile/v1/auth/phone/verify', () => {
    let validPhone: string;
    let validOTP: string;

    beforeEach(async () => {
      // First initiate phone login to get valid OTP
      const initiateResponse = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/phone/initiate')
        .send({
          phone: '991234567',
          countryCode: '+963',
          deviceId: 'test-device-789',
        });

      validPhone = '+963991234567';
      validOTP = '123456'; // From seeded test data
    });

    it('should verify OTP and complete login', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/phone/verify')
        .send({
          phone: validPhone,
          otp: validOTP,
          deviceId: 'test-device-789',
          deviceType: 'ios',
          pushToken: 'ios-push-token-123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user).toHaveProperty('phone', validPhone);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/phone/verify')
        .send({
          phone: validPhone,
          otp: '999999', // Invalid OTP
          deviceId: 'test-device-789',
          deviceType: 'ios',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid or expired OTP');
    });

    it('should reject expired OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/phone/verify')
        .send({
          phone: '+963992222222', // From seeded expired OTP
          otp: '999999',
          deviceId: 'expired-test-device',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid or expired OTP');
    });
  });

  describe('POST /api/mobile/v1/auth/refresh', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
          deviceId: 'refresh-test-device',
        });

      validRefreshToken = loginResponse.body.tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.tokens).toHaveProperty('expiresIn');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/refresh')
        .send({
          refreshToken: 'invalid.refresh.token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });
  });

  describe('POST /api/mobile/v1/auth/device/register', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
          deviceId: 'device-register-test',
        });

      validAccessToken = loginResponse.body.tokens.accessToken;
    });

    it('should register device with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/device/register')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          deviceId: 'new-device-123',
          deviceType: 'android',
          pushToken: 'new-push-token-123',
          deviceName: 'Samsung Galaxy S24',
          appVersion: '1.1.0',
          osVersion: 'Android 14',
        })
        .expect(200);

      expect(response.body).toHaveProperty('registered', true);
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/device/register')
        // Missing Authorization header
        .send({
          deviceId: 'unauthorized-device',
          deviceType: 'ios',
          pushToken: 'unauthorized-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate device registration data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/device/register')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          // Missing required fields
          deviceType: 'invalid', // Invalid enum value
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });
  });

  describe('POST /api/mobile/v1/auth/logout', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
          deviceId: 'logout-test-device',
        });

      validAccessToken = loginResponse.body.tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          deviceId: 'logout-test-device',
          removeDevice: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Logged out successfully',
      );
      expect(response.body).toHaveProperty('deviceRemoved', true);
    });

    it('should logout without device removal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          deviceId: 'logout-test-device',
          removeDevice: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Logged out successfully',
      );
      expect(response.body).toHaveProperty('deviceRemoved', false);
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/logout')
        // Missing Authorization header
        .send({
          deviceId: 'unauthorized-device',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Mobile Authentication Flow Integration', () => {
    it('should complete full authentication and device registration flow', async () => {
      const deviceId = 'integration-test-device';
      const pushToken = 'integration-push-token';

      // 1. Login with credentials
      const loginResponse = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
          deviceId,
          deviceType: 'ios',
          pushToken,
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.tokens;

      // 2. Register additional device info
      await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/device/register')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          deviceId: `${deviceId}-2`,
          deviceType: 'android',
          pushToken: `${pushToken}-2`,
          deviceName: 'Google Pixel 8',
          appVersion: '1.0.0',
        })
        .expect(200);

      // 3. Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body.tokens.accessToken).toBeDefined();
      expect(refreshResponse.body.tokens.accessToken).not.toBe(accessToken); // Should be different

      // 4. Logout
      await request(app.getHttpServer())
        .post('/api/mobile/v1/auth/logout')
        .set(
          'Authorization',
          `Bearer ${refreshResponse.body.tokens.accessToken}`,
        )
        .send({
          deviceId,
          removeDevice: true,
        })
        .expect(200);
    });
  });
});
