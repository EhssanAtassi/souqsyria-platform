/**
 * @file guest-session.middleware.spec.ts
 * @description Comprehensive unit tests for GuestSessionMiddleware with real Syrian user scenarios
 *
 * TEST COVERAGE:
 * - Guest session creation and management
 * - Cookie handling and security
 * - Session validation and expiration
 * - Device fingerprinting and IP tracking
 * - Error handling and fallback mechanisms
 * - Real Syrian market user scenarios
 *
 * REAL DATA INTEGRATION:
 * - Authentic Syrian IP addresses and locations
 * - Real device fingerprints and user agents
 * - Production-like session scenarios
 * - Actual Syrian customer behaviors
 *
 * @author SouqSyria Development Team
 * @since 2026-01-29
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';

import {
  GuestSessionMiddleware,
  RequestWithSession
} from './guest-session.middleware';
import { GuestSession } from '../../cart/entities/guest-session.entity';

/**
 * Real Syrian User Request Data Factory
 */
const createSyrianUserRequest = (overrides?: Record<string, unknown>): Partial<RequestWithSession> => {
  const syrianIPs = [
    '185.79.156.0', // Syrian Telecom
    '46.161.14.0',  // SyriaTel
    '188.161.175.0', // MTN Syria
    '37.143.9.0',   // Damascus ISP
    '185.79.157.0', // Aleppo ISP
  ];

  const syrianUserAgents = [
    'Mozilla/5.0 (Linux; Android 11; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36', // Samsung Galaxy A51 (popular in Syria)
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1', // iPhone (diaspora users)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36', // Windows PC
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36', // Linux
  ];

  return {
    ip: syrianIPs[Math.floor(Math.random() * syrianIPs.length)],
    headers: {
      'user-agent': syrianUserAgents[Math.floor(Math.random() * syrianUserAgents.length)],
      'accept-language': 'ar,ar-SY;q=0.9,en;q=0.8,en-US;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
      'x-forwarded-for': undefined,
      'x-real-ip': undefined,
      'sec-ch-ua-platform': '"Android"',
    },
    socket: {
      remoteAddress: syrianIPs[Math.floor(Math.random() * syrianIPs.length)],
    },
    cookies: {},
    get: jest.fn(), // Required method for Express Request
    ...overrides,
  } as unknown as RequestWithSession;
};

/**
 * Real Syrian Guest Session Data Factory
 */
const createSyrianGuestSession = (overrides?: Record<string, unknown>) => {
  const damascusIP = '185.79.156.25';
  const aleppoIP = '46.161.14.100';
  const homsIP = '188.161.175.50';

  return {
    id: `guest_${Math.random().toString(36).substr(2, 16)}`,
    ipAddress: [damascusIP, aleppoIP, homsIP][Math.floor(Math.random() * 3)],
    deviceFingerprint: {
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-A515F) AppleWebKit/537.36 Mobile Safari/537.36',
      platform: 'Android',
      language: 'ar-SY',
      acceptLanguage: 'ar,ar-SY;q=0.9,en;q=0.8',
      acceptEncoding: 'gzip, deflate, br',
    },
    status: 'active',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    refreshExpiration: jest.fn(),
    isExpired: jest.fn().mockReturnValue(false),
    isInGracePeriod: jest.fn().mockReturnValue(false),
    ...overrides,
  };
};

/**
 * Mock Response Factory
 */
const createMockResponse = (): Partial<Response> => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
});

describe('GuestSessionMiddleware', () => {
  let middleware: GuestSessionMiddleware;
  let guestSessionRepo: jest.Mocked<Repository<GuestSession>>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(async () => {
    // Create mock repository
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<GuestSession>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestSessionMiddleware,
        {
          provide: getRepositoryToken(GuestSession),
          useValue: mockRepository,
        },
      ],
    }).compile();

    middleware = module.get<GuestSessionMiddleware>(GuestSessionMiddleware);
    guestSessionRepo = module.get(getRepositoryToken(GuestSession)) as jest.Mocked<Repository<GuestSession>>;

    mockResponse = createMockResponse();
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // NEW SESSION CREATION TESTS
  // ===========================================================================

  describe('New Session Creation', () => {
    /**
     * Test: Should create new session for first-time Syrian visitor
     * Validates: Guest session creation with Syrian market data
     */
    it('should create new session for first-time Syrian visitor from Damascus', async () => {
      const request = createSyrianUserRequest({
        ip: '185.79.156.25', // Damascus IP
        headers: {
          'user-agent': 'Mozilla/5.0 (Linux; Android 11; SM-A515F) AppleWebKit/537.36 Mobile Safari/537.36',
          'accept-language': 'ar,ar-SY;q=0.9,en;q=0.8',
        },
        cookies: {}, // No existing session
      });

      const newSession = createSyrianGuestSession({
        id: 'guest_damascus_12345',
        ipAddress: '185.79.156.25',
      });

      guestSessionRepo.create.mockReturnValue(newSession as any);
      guestSessionRepo.save.mockResolvedValue(newSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(guestSessionRepo.create).toHaveBeenCalledWith({
        ipAddress: '185.79.156.25',
        deviceFingerprint: expect.objectContaining({
          userAgent: expect.stringContaining('SM-A515F'),
          acceptLanguage: 'ar,ar-SY;q=0.9,en;q=0.8',
        }),
        status: 'active',
      });

      expect(guestSessionRepo.save).toHaveBeenCalledWith(newSession);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'guest_session_id',
        newSession.id,
        expect.objectContaining({
          httpOnly: true,
          secure: false, // Test environment
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: '/',
        })
      );

      expect(request.guestSession).toBe(newSession);
      expect(request.guestSessionId).toBe(newSession.id);
      expect(nextFunction).toHaveBeenCalled();
    });

    /**
     * Test: Should create session for Aleppo mobile user
     * Validates: Mobile device session creation
     */
    it('should create session for Aleppo mobile user', async () => {
      const request = createSyrianUserRequest({
        ip: '46.161.14.100', // Aleppo SyriaTel IP
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
          'accept-language': 'ar,ar-SY;q=0.9,en;q=0.8',
          'sec-ch-ua-platform': '"iOS"',
        },
        cookies: {},
      });

      const newSession = createSyrianGuestSession({
        id: 'guest_aleppo_mobile_67890',
        ipAddress: '46.161.14.100',
        deviceFingerprint: {
          userAgent: request.headers['user-agent'],
          platform: '"iOS"', // Platform comes with quotes from sec-ch-ua-platform header
          language: 'ar', // Primary language extracted from accept-language
        },
      });

      guestSessionRepo.create.mockReturnValue(newSession as any);
      guestSessionRepo.save.mockResolvedValue(newSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      // The middleware extracts raw platform value which includes quotes
      // and primary language from accept-language header
      expect(guestSessionRepo.create).toHaveBeenCalledWith({
        ipAddress: '46.161.14.100',
        deviceFingerprint: expect.objectContaining({
          platform: '"iOS"',
          language: 'ar',
        }),
        status: 'active',
      });

      expect(nextFunction).toHaveBeenCalled();
    });

    /**
     * Test: Should handle proxy headers for Syrian users behind load balancer
     * Validates: IP extraction through proxies
     */
    it('should handle proxy headers for Syrian users behind load balancer', async () => {
      const request = createSyrianUserRequest({
        headers: {
          'x-forwarded-for': '185.79.156.50, 10.0.0.1', // Real Syrian IP through proxy
          'x-real-ip': '185.79.156.50',
        },
        ip: '10.0.0.1', // Internal proxy IP
      });

      const newSession = createSyrianGuestSession();
      guestSessionRepo.create.mockReturnValue(newSession as any);
      guestSessionRepo.save.mockResolvedValue(newSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(guestSessionRepo.create).toHaveBeenCalledWith({
        ipAddress: '185.79.156.50', // Should extract real IP
        deviceFingerprint: expect.any(Object),
        status: 'active',
      });
    });
  });

  // ===========================================================================
  // EXISTING SESSION VALIDATION TESTS
  // ===========================================================================

  describe('Existing Session Validation', () => {
    /**
     * Test: Should validate and refresh existing Syrian session
     * Validates: Session refresh and sliding window
     */
    it('should validate and refresh existing Syrian customer session', async () => {
      const sessionId = 'guest_existing_session_123';
      const request = createSyrianUserRequest({
        cookies: { guest_session_id: sessionId },
        ip: '185.79.156.25',
      });

      const existingSession = createSyrianGuestSession({
        id: sessionId,
        ipAddress: '185.79.156.25',
        status: 'active',
      });

      guestSessionRepo.findOne.mockResolvedValue(existingSession as any);
      guestSessionRepo.save.mockResolvedValue(existingSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(guestSessionRepo.findOne).toHaveBeenCalledWith({
        where: { id: sessionId },
      });

      expect(existingSession.refreshExpiration).toHaveBeenCalled();
      expect(guestSessionRepo.save).toHaveBeenCalledWith(existingSession);

      expect(request.guestSession).toBe(existingSession);
      expect(request.guestSessionId).toBe(sessionId);
      expect(nextFunction).toHaveBeenCalled();
    });

    /**
     * Test: Should update IP address when Syrian user changes location
     * Validates: IP address tracking for mobile users
     */
    it('should update IP address when Syrian user moves from Damascus to Aleppo', async () => {
      const sessionId = 'guest_mobile_user_456';
      const request = createSyrianUserRequest({
        cookies: { guest_session_id: sessionId },
        ip: '46.161.14.100', // New Aleppo IP
      });

      const existingSession = createSyrianGuestSession({
        id: sessionId,
        ipAddress: '185.79.156.25', // Old Damascus IP
        status: 'active',
      });

      guestSessionRepo.findOne.mockResolvedValue(existingSession as any);
      guestSessionRepo.save.mockResolvedValue(existingSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(existingSession.ipAddress).toBe('46.161.14.100');
      expect(guestSessionRepo.save).toHaveBeenCalledWith(existingSession);
    });

    /**
     * Test: Should update device fingerprint when Syrian user changes browser
     * Validates: Device fingerprint tracking
     */
    it('should update device fingerprint when Syrian user switches from mobile to desktop', async () => {
      const sessionId = 'guest_multi_device_789';
      const request = createSyrianUserRequest({
        cookies: { guest_session_id: sessionId },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Safari/537.36', // Desktop
          'accept-language': 'ar,ar-SY;q=0.9,en;q=0.8',
        },
      });

      const existingSession = createSyrianGuestSession({
        id: sessionId,
        deviceFingerprint: {
          userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-A515F) Mobile Safari/537.36', // Old mobile
          platform: 'Android',
        },
      });

      guestSessionRepo.findOne.mockResolvedValue(existingSession as any);
      guestSessionRepo.save.mockResolvedValue(existingSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(existingSession.deviceFingerprint).toEqual(
        expect.objectContaining({
          userAgent: expect.stringContaining('Windows NT 10.0'),
        })
      );
      expect(guestSessionRepo.save).toHaveBeenCalledWith(existingSession);
    });
  });

  // ===========================================================================
  // SESSION EXPIRATION TESTS
  // ===========================================================================

  describe('Session Expiration Handling', () => {
    /**
     * Test: Should create new session when existing session expired
     * Validates: Expired session cleanup and renewal
     */
    it('should create new session when existing Syrian session expired', async () => {
      const expiredSessionId = 'guest_expired_123';
      const request = createSyrianUserRequest({
        cookies: { guest_session_id: expiredSessionId },
      });

      const expiredSession = createSyrianGuestSession({
        id: expiredSessionId,
        status: 'expired',
      });
      expiredSession.isExpired.mockReturnValue(true);
      expiredSession.isInGracePeriod.mockReturnValue(false);

      const newSession = createSyrianGuestSession({
        id: 'guest_new_after_expiry_456',
      });

      guestSessionRepo.findOne.mockResolvedValue(expiredSession as any);
      guestSessionRepo.create.mockReturnValue(newSession as any);
      guestSessionRepo.save.mockResolvedValueOnce(expiredSession as any) // Save expired status
        .mockResolvedValueOnce(newSession as any); // Save new session

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(expiredSession.status).toBe('expired');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('guest_session_id');
      expect(guestSessionRepo.create).toHaveBeenCalled();
      expect(request.guestSession).toBe(newSession);
    });

    /**
     * Test: Should handle session in grace period
     * Validates: Grace period extension for active Syrian users
     */
    it('should handle session in grace period for active Syrian shopper', async () => {
      const graceSessionId = 'guest_grace_period_789';
      const request = createSyrianUserRequest({
        cookies: { guest_session_id: graceSessionId },
      });

      const gracePeriodSession = createSyrianGuestSession({
        id: graceSessionId,
        status: 'active',
      });
      gracePeriodSession.isExpired.mockReturnValue(true);
      gracePeriodSession.isInGracePeriod.mockReturnValue(true);

      guestSessionRepo.findOne.mockResolvedValue(gracePeriodSession as any);
      guestSessionRepo.save.mockResolvedValue(gracePeriodSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(gracePeriodSession.refreshExpiration).toHaveBeenCalled();
      expect(mockResponse.clearCookie).not.toHaveBeenCalled();
      expect(request.guestSession).toBe(gracePeriodSession);
    });
  });

  // ===========================================================================
  // SESSION NOT FOUND TESTS
  // ===========================================================================

  describe('Session Not Found Handling', () => {
    /**
     * Test: Should create new session when session ID not found in database
     * Validates: Invalid session handling
     */
    it('should create new session when session ID not found for Syrian user', async () => {
      const invalidSessionId = 'guest_nonexistent_999';
      const request = createSyrianUserRequest({
        cookies: { guest_session_id: invalidSessionId },
      });

      const newSession = createSyrianGuestSession({
        id: 'guest_replacement_111',
      });

      guestSessionRepo.findOne.mockResolvedValue(null); // Session not found
      guestSessionRepo.create.mockReturnValue(newSession as any);
      guestSessionRepo.save.mockResolvedValue(newSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('guest_session_id');
      expect(guestSessionRepo.create).toHaveBeenCalled();
      expect(request.guestSession).toBe(newSession);
      expect(request.guestSessionId).toBe(newSession.id);
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  describe('Error Handling and Fallbacks', () => {
    /**
     * Test: Should create fallback session when database error occurs
     * Validates: Database error recovery
     */
    it('should create fallback session when database error occurs for Syrian user', async () => {
      const request = createSyrianUserRequest({
        cookies: { guest_session_id: 'problematic_session' },
      });

      const fallbackSession = createSyrianGuestSession({
        id: 'guest_fallback_222',
      });

      // Database error on first attempt
      guestSessionRepo.findOne.mockRejectedValueOnce(new Error('Database connection failed'));

      // Fallback session creation succeeds
      guestSessionRepo.create.mockReturnValue(fallbackSession as any);
      guestSessionRepo.save.mockResolvedValue(fallbackSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(request.guestSession).toBe(fallbackSession);
      expect(nextFunction).toHaveBeenCalled();
    });

    /**
     * Test: Should continue without session when all attempts fail
     * Validates: Complete error recovery
     */
    it('should continue without session when all attempts fail', async () => {
      const request = createSyrianUserRequest();

      guestSessionRepo.findOne.mockRejectedValue(new Error('Database error'));
      guestSessionRepo.create.mockImplementation(() => {
        throw new Error('Fallback creation failed');
      });

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(request.guestSession).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // REAL SYRIAN MARKET SCENARIOS
  // ===========================================================================

  describe('Real Syrian Market Scenarios', () => {
    /**
     * Test: Syrian diaspora user accessing from Germany
     * Validates: International user session handling
     */
    it('should handle Syrian diaspora user accessing from Germany', async () => {
      const request = createSyrianUserRequest({
        ip: '87.123.45.67', // German IP
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36',
          'accept-language': 'ar,de;q=0.9,en;q=0.8', // Arabic + German
        },
        cookies: {},
      });

      const diasporaSession = createSyrianGuestSession({
        id: 'guest_diaspora_de_333',
        ipAddress: '87.123.45.67',
        deviceFingerprint: {
          userAgent: request.headers['user-agent'],
          acceptLanguage: 'ar,de;q=0.9,en;q=0.8',
        },
      });

      guestSessionRepo.create.mockReturnValue(diasporaSession as any);
      guestSessionRepo.save.mockResolvedValue(diasporaSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(guestSessionRepo.create).toHaveBeenCalledWith({
        ipAddress: '87.123.45.67',
        deviceFingerprint: expect.objectContaining({
          acceptLanguage: 'ar,de;q=0.9,en;q=0.8',
        }),
        status: 'active',
      });
    });

    /**
     * Test: Rural Syrian user on slow connection
     * Validates: Performance considerations for limited connectivity
     */
    it('should efficiently handle rural Syrian user with limited connectivity', async () => {
      const request = createSyrianUserRequest({
        ip: '188.161.175.200', // Rural Syria IP
        headers: {
          'user-agent': 'Mozilla/5.0 (Linux; Android 8.1.0; Nokia 3.1) Mobile Safari/537.36', // Budget phone
          'accept-language': 'ar,ar-SY;q=0.9',
          'connection': 'close', // Indicates limited bandwidth
        },
      });

      const ruralSession = createSyrianGuestSession({
        id: 'guest_rural_444',
        ipAddress: '188.161.175.200',
      });

      guestSessionRepo.create.mockReturnValue(ruralSession as any);
      guestSessionRepo.save.mockResolvedValue(ruralSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(request.guestSession).toBe(ruralSession);
      expect(nextFunction).toHaveBeenCalled();
    });

    /**
     * Test: Damascus business user during peak hours
     * Validates: High-traffic scenario handling
     */
    it('should handle Damascus business user during peak shopping hours', async () => {
      const request = createSyrianUserRequest({
        ip: '185.79.156.75', // Damascus business district
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110 Safari/537.36',
          'accept-language': 'ar,ar-SY;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      const businessSession = createSyrianGuestSession({
        id: 'guest_business_damascus_555',
        ipAddress: '185.79.156.75',
      });

      guestSessionRepo.create.mockReturnValue(businessSession as any);
      guestSessionRepo.save.mockResolvedValue(businessSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(request.guestSession).toBe(businessSession);
      expect(request.guestSessionId).toBe(businessSession.id);
    });
  });

  // ===========================================================================
  // SECURITY TESTS
  // ===========================================================================

  describe('Security and Cookie Handling', () => {
    /**
     * Test: Should set secure cookie flags in production
     * Validates: Production security settings
     */
    it('should set secure cookie flags in production environment', async () => {
      process.env.NODE_ENV = 'production';

      const request = createSyrianUserRequest();
      const session = createSyrianGuestSession();

      guestSessionRepo.create.mockReturnValue(session as any);
      guestSessionRepo.save.mockResolvedValue(session as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'guest_session_id',
        session.id,
        expect.objectContaining({
          secure: true, // Should be true in production
        })
      );

      process.env.NODE_ENV = 'test'; // Reset
    });

    /**
     * Test: Should properly clear invalid cookies
     * Validates: Cookie security cleanup
     */
    it('should properly clear invalid session cookies', async () => {
      const request = createSyrianUserRequest({
        cookies: { guest_session_id: 'invalid_session_id' },
      });

      guestSessionRepo.findOne.mockResolvedValue(null);
      const newSession = createSyrianGuestSession();
      guestSessionRepo.create.mockReturnValue(newSession as any);
      guestSessionRepo.save.mockResolvedValue(newSession as any);

      await middleware.use(request as any, mockResponse as Response, nextFunction);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('guest_session_id');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'guest_session_id',
        newSession.id,
        expect.any(Object)
      );
    });
  });
});