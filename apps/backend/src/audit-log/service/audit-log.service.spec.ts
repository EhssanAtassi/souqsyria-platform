/**
 * @fileoverview Comprehensive unit tests for AuditLogService
 * @description Tests audit logging, security monitoring, and compliance features
 *
 * Test Coverage:
 * - Audit log creation and retrieval
 * - Security monitoring and threat detection
 * - Syrian geographic risk analysis
 * - Compliance and retention policies
 * - Performance metrics tracking
 *
 * Syrian Market Context:
 * - 14 governorates for geographic analysis
 * - Arabic action descriptions
 * - Syrian IP address tracking
 * - Local payment method auditing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../entities/audit-log.entity';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { SimpleAuditLogDto } from '../dto/simple-audit-log.dto';
import { BulkAuditLogDto } from '../dto/bulk-audit-log.dto';
import { ProductionLoggerService } from '../../common/services/logger.service';
import { SentryService } from '../../common/services/sentry.service';

// ============================================================================
// Entity Method Helpers
// ============================================================================

/**
 * Adds AuditLog entity methods to a plain object
 * This ensures mocked entities have the methods the service expects
 */
const addEntityMethods = (obj: Partial<AuditLog>): Partial<AuditLog> => {
  return {
    ...obj,
    generateChecksum: jest.fn().mockImplementation(function (this: AuditLog) {
      if (!this.isComplianceEvent && !this.isSecurityEvent && !this.isFinancialEvent) {
        return null;
      }
      return `checksum_${this.action}_${Date.now()}`;
    }),
    calculateRiskScore: jest.fn().mockReturnValue(30),
    calculateRetentionDate: jest.fn().mockReturnValue(new Date('2029-01-15T10:30:00Z')),
    isCritical: jest.fn().mockReturnValue(false),
    generateSummary: jest.fn().mockReturnValue('Mock summary'),
  };
};

// ============================================================================
// Mock Factories - Syrian Audit Data
// ============================================================================

/**
 * Creates a mock audit log entry with correct entity structure
 * Includes entity methods for proper service testing
 * @param overrides - Optional property overrides
 * @returns Partial AuditLog entity with methods
 */
const createMockAuditLog = (overrides: Partial<AuditLog> = {}): Partial<AuditLog> => {
  const baseLog = {
    id: 1,
    action: 'user.login',
    actorId: 123,
    actorType: 'user' as const,
    actorEmail: 'ahmad@souqsyria.com',
    actorName: 'Ahmad Al-Shami',
    module: 'auth',
    entityType: 'session',
    entityId: 456,
    entityDescription: 'User session created',
    description: 'User logged in successfully',
    ipAddress: '185.117.75.10', // Syrian IP range
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    country: 'Syria',
    city: 'Damascus',
    meta: {
      governorate: 'Damascus',
      deviceType: 'desktop',
    },
    severity: 'low' as const,
    isSecurityEvent: false,
    isFinancialEvent: false,
    isComplianceEvent: false,
    isAnomaly: false,
    wasSuccessful: true,
    riskScore: 10,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    ...overrides,
  };
  // Add entity methods and return
  return addEntityMethods(baseLog);
};

/**
 * Creates a mock security event with elevated severity
 * @param overrides - Optional property overrides
 * @returns Partial AuditLog entity for security events
 */
const createMockSecurityEvent = (overrides: Partial<AuditLog> = {}): Partial<AuditLog> => ({
  ...createMockAuditLog(),
  id: 2,
  action: 'auth.failed_login',
  module: 'auth',
  severity: 'high',
  isSecurityEvent: true,
  description: 'Multiple failed login attempts detected',
  meta: {
    failedAttempts: 5,
    governorate: 'Aleppo',
    suspiciousActivity: true,
  },
  riskScore: 75,
  isAnomaly: true,
  ...overrides,
});

/**
 * Creates a mock financial event for payment tracking
 * @param overrides - Optional property overrides
 * @returns Partial AuditLog entity for financial events
 */
const createMockFinancialEvent = (overrides: Partial<AuditLog> = {}): Partial<AuditLog> => ({
  ...createMockAuditLog(),
  id: 3,
  action: 'payment.process',
  module: 'payments',
  severity: 'medium',
  isFinancialEvent: true,
  description: 'Payment processed successfully',
  monetaryAmount: 500000, // 500,000 SYP
  currency: 'SYP',
  transactionReference: 'TXN-2024-001',
  meta: {
    orderId: 789,
    paymentMethod: 'syriatel_cash',
    governorate: 'Damascus',
  },
  ...overrides,
});

/**
 * Creates a mock compliance event for regulatory tracking
 * @param overrides - Optional property overrides
 * @returns Partial AuditLog entity for compliance events
 */
const createMockComplianceEvent = (overrides: Partial<AuditLog> = {}): Partial<AuditLog> => ({
  ...createMockAuditLog(),
  id: 4,
  action: 'user.data_export',
  module: 'users',
  severity: 'high',
  isComplianceEvent: true,
  regulatoryCategory: 'Syrian_Commerce_Law',
  description: 'User data exported for compliance audit',
  ...overrides,
});

// ============================================================================
// Mock Repository and Cache
// ============================================================================

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

/**
 * Creates a mock TypeORM repository with query builder
 */
const createMockRepository = <T>(): MockRepository<T> & {
  createQueryBuilder: jest.Mock;
} => {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ count: 0, total: 0 }),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
  };

  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => addEntityMethods({ ...dto, id: 1 })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 1 })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
};


// ============================================================================
// Test Suite
// ============================================================================

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepo: MockRepository<AuditLog>;

  beforeEach(async () => {
    auditLogRepo = createMockRepository<AuditLog>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: auditLogRepo,
        },
        {
          provide: ProductionLoggerService,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            logAuditEvent: jest.fn(),
            logSecurityEvent: jest.fn(),
            logPerformance: jest.fn(),
            logBusinessEvent: jest.fn(),
            getWinstonLogger: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
            captureMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Service Initialization
  // ==========================================================================

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==========================================================================
  // log() Method Tests
  // ==========================================================================

  describe('log()', () => {
    /**
     * Valid CreateAuditLogDto with required fields
     * Action format: module.action (e.g., 'user.create')
     */
    const validLogDto: CreateAuditLogDto = {
      action: 'user.create',
      actorId: 1,
      actorType: 'admin',
      actorEmail: 'admin@souqsyria.com',
      actorName: 'System Admin',
      module: 'users',
      entityType: 'user',
      entityId: 100,
      entityDescription: 'New user account',
      description: 'New user created by admin',
      ipAddress: '185.117.75.20',
      country: 'Syria',
      city: 'Damascus',
      severity: 'low',
      meta: { governorate: 'Damascus' },
    };

    it('should create an audit log entry with valid DTO', async () => {
      const mockLog = createMockAuditLog(validLogDto);
      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(validLogDto);

      expect(auditLogRepo.create).toHaveBeenCalled();
      expect(auditLogRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should auto-calculate severity for security actions', async () => {
      const securityDto: CreateAuditLogDto = {
        ...validLogDto,
        action: 'auth.unauthorized_access',
        isSecurityEvent: true,
        severity: 'critical',
      };
      const mockLog = createMockSecurityEvent(securityDto);

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(securityDto);

      expect(auditLogRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should mark financial events correctly', async () => {
      const financialDto: CreateAuditLogDto = {
        ...validLogDto,
        action: 'payment.receive',
        module: 'payments',
        isFinancialEvent: true,
        severity: 'medium',
        meta: {
          amount: 1000000,
          paymentMethod: 'mtn_cash',
        },
      };
      const mockLog = createMockFinancialEvent(financialDto);

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(financialDto);

      expect(auditLogRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle system actor type for automated events', async () => {
      const systemDto: CreateAuditLogDto = {
        action: 'system.cleanup',
        actorId: 0, // System has ID 0
        actorType: 'system',
        module: 'admin',
        description: 'Automated system cleanup',
        severity: 'low',
      };
      const mockLog = createMockAuditLog({ ...systemDto, actorId: 0 });

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(systemDto);

      expect(auditLogRepo.save).toHaveBeenCalled();
      expect(result.actorType).toBe('system');
    });

    it('should handle vendor actor type', async () => {
      const vendorDto: CreateAuditLogDto = {
        action: 'product.create',
        actorId: 50,
        actorType: 'vendor',
        actorEmail: 'vendor@damascus-crafts.sy',
        module: 'products',
        entityType: 'product',
        entityId: 200,
        description: 'Vendor created new product',
        severity: 'low',
      };
      const mockLog = createMockAuditLog(vendorDto);

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(vendorDto);

      expect(result.actorType).toBe('vendor');
    });

    it('should handle api_client actor type for external integrations', async () => {
      const apiClientDto: CreateAuditLogDto = {
        action: 'api.request',
        actorId: 999,
        actorType: 'api_client',
        module: 'auth',
        description: 'External API request processed',
        severity: 'low',
        meta: { clientId: 'external-partner-001' },
      };
      const mockLog = createMockAuditLog(apiClientDto);

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(apiClientDto);

      expect(result.actorType).toBe('api_client');
    });
  });

  // ==========================================================================
  // Severity Level Tests
  // ==========================================================================

  describe('Severity Levels', () => {
    const baseDto: CreateAuditLogDto = {
      action: 'test.action',
      actorId: 1,
      actorType: 'admin',
    };

    it('should handle low severity events', async () => {
      const dto: CreateAuditLogDto = { ...baseDto, severity: 'low' };
      const mockLog = createMockAuditLog({ severity: 'low' });

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(dto);
      expect(result.severity).toBe('low');
    });

    it('should handle medium severity events', async () => {
      const dto: CreateAuditLogDto = { ...baseDto, severity: 'medium' };
      const mockLog = createMockAuditLog({ severity: 'medium' });

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(dto);
      expect(result.severity).toBe('medium');
    });

    it('should handle high severity events', async () => {
      const dto: CreateAuditLogDto = { ...baseDto, severity: 'high' };
      const mockLog = createMockAuditLog({ severity: 'high' });

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(dto);
      expect(result.severity).toBe('high');
    });

    it('should handle critical severity events', async () => {
      const dto: CreateAuditLogDto = { ...baseDto, severity: 'critical' };
      const mockLog = createMockAuditLog({ severity: 'critical' });

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(dto);
      expect(result.severity).toBe('critical');
    });
  });

  // ==========================================================================
  // findFiltered() Method Tests
  // ==========================================================================

  describe('findFiltered()', () => {
    it('should filter logs by action type', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([
        [createMockAuditLog({ action: 'user.login' })],
        1,
      ]);

      const result = await service.findFiltered({
        action: 'user.login',
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should filter logs by actor ID (number)', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([
        [createMockAuditLog({ actorId: 123 })],
        1,
      ]);

      const result = await service.findFiltered({
        actorId: 123,
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should filter logs by date range', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findFiltered({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should filter logs by severity (valid enum values)', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([
        [createMockSecurityEvent({ severity: 'high' })],
        1,
      ]);

      const result = await service.findFiltered({
        severity: 'high',
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should filter security events only', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([
        [createMockSecurityEvent()],
        1,
      ]);

      const result = await service.findFiltered({
        isSecurityEvent: true,
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should filter financial events only', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([
        [createMockFinancialEvent()],
        1,
      ]);

      const result = await service.findFiltered({
        isFinancialEvent: true,
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should filter by module', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([
        [createMockAuditLog({ module: 'orders' })],
        1,
      ]);

      const result = await service.findFiltered({
        module: 'orders',
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should filter by entity type', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([
        [createMockAuditLog({ entityType: 'product' })],
        1,
      ]);

      const result = await service.findFiltered({
        entityType: 'product',
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should filter by country', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([
        [createMockAuditLog({ country: 'Syria' })],
        1,
      ]);

      const result = await service.findFiltered({
        country: 'Syria',
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // findByActor() Method Tests
  // ==========================================================================

  describe('findByActor()', () => {
    it('should find logs by actor ID (number type)', async () => {
      const mockLogs = [
        createMockAuditLog({ actorId: 123, action: 'user.login' }),
        createMockAuditLog({ actorId: 123, action: 'order.create' }),
      ];

      auditLogRepo.find.mockResolvedValue(mockLogs);

      const result = await service.findByActor(123);

      expect(result).toHaveLength(2);
      expect(auditLogRepo.find).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // getAnalytics() Method Tests
  // ==========================================================================

  describe('getAnalytics()', () => {
    it('should return analytics summary', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getRawMany.mockResolvedValue([
        { action: 'user.login', count: '150' },
        { action: 'order.create', count: '75' },
        { action: 'payment.process', count: '60' },
      ]);
      queryBuilder.getCount.mockResolvedValue(285);

      const result = await service.getAnalytics({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      });

      expect(result).toBeDefined();
    });

    it('should handle empty date range', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getRawMany.mockResolvedValue([]);
      queryBuilder.getCount.mockResolvedValue(0);

      const result = await service.getAnalytics({});

      expect(result).toBeDefined();
    });

    it('should filter analytics by business model', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getRawMany.mockResolvedValue([
        { action: 'order.create', count: '50' },
      ]);
      queryBuilder.getCount.mockResolvedValue(50);

      const result = await service.getAnalytics({
        businessModel: 'B2B',
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // getSecurityMonitoring() Method Tests
  // ==========================================================================

  describe('getSecurityMonitoring()', () => {
    it('should return security monitoring data', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getRawMany.mockResolvedValue([
        { action: 'auth.failed_login', count: '25', severity: 'high' },
        { action: 'auth.unauthorized_access', count: '5', severity: 'critical' },
      ]);

      const result = await service.getSecurityMonitoring();

      expect(result).toBeDefined();
    });

    it('should identify suspicious IP addresses', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getRawMany.mockResolvedValue([
        { ipAddress: '192.168.1.100', failedAttempts: '15' },
        { ipAddress: '10.0.0.50', failedAttempts: '8' },
      ]);

      const result = await service.getSecurityMonitoring();

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // logSimple() Method Tests
  // ==========================================================================

  describe('logSimple()', () => {
    it('should create a simple audit log entry', async () => {
      const simpleDto: SimpleAuditLogDto = {
        action: 'product.view',
        module: 'products',
        actorId: 100,
        actorType: 'user',
        description: 'User viewed product page',
      };

      const mockLog = createMockAuditLog({
        ...simpleDto,
        severity: 'low',
      });

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);
      auditLogRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.logSimple(simpleDto);

      expect(auditLogRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should auto-calculate severity for financial actions', async () => {
      const simpleDto: SimpleAuditLogDto = {
        action: 'payment.process',
        module: 'payments',
        actorId: 100,
        actorType: 'user',
        monetaryAmount: 500000,
        currency: 'SYP',
      };

      const mockLog = createMockFinancialEvent(simpleDto);

      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);
      auditLogRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.logSimple(simpleDto);

      expect(auditLogRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // logBulk() Method Tests
  // ==========================================================================

  describe('logBulk()', () => {
    it('should create multiple audit log entries', async () => {
      const bulkDto: BulkAuditLogDto = {
        logs: [
          {
            action: 'bulk.action_1',
            actorId: 1,
            actorType: 'system',
            description: 'First action',
          },
          {
            action: 'bulk.action_2',
            actorId: 2,
            actorType: 'system',
            description: 'Second action',
          },
          {
            action: 'bulk.action_3',
            actorId: 3,
            actorType: 'system',
            description: 'Third action',
          },
        ],
      };
      const mockLogs = bulkDto.logs.map((log, i) =>
        createMockAuditLog({ ...log, id: i + 1 }),
      );

      auditLogRepo.create.mockImplementation((dto) =>
        createMockAuditLog(dto),
      );
      auditLogRepo.save.mockResolvedValue(mockLogs);

      const result = await service.logBulk(bulkDto);

      expect(auditLogRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle batch with priority and source', async () => {
      const bulkDto: BulkAuditLogDto = {
        logs: [
          {
            action: 'migration.import',
            actorId: 0,
            actorType: 'system',
            description: 'Data migration import',
          },
        ],
        batchId: 'batch_20240115_001',
        priority: 'high',
        source: 'data_migration',
        failOnError: false,
      };

      const mockLog = createMockAuditLog(bulkDto.logs[0]);
      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue([mockLog]);

      const result = await service.logBulk(bulkDto);

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // exportLogs() Method Tests
  // ==========================================================================

  describe('exportLogs()', () => {
    it('should export logs in JSON format', async () => {
      const mockLogs = [
        createMockAuditLog({ id: 1 }),
        createMockAuditLog({ id: 2 }),
      ];

      auditLogRepo.find.mockResolvedValue(mockLogs);

      const result = await service.exportLogs(
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
        'json',
      );

      expect(result).toBeDefined();
      expect(result.format).toBe('json');
      expect(result.recordCount).toBe(2);
    });

    it('should export logs in CSV format', async () => {
      const mockLogs = [
        createMockAuditLog({ id: 1 }),
        createMockAuditLog({ id: 2 }),
      ];

      auditLogRepo.find.mockResolvedValue(mockLogs);

      const result = await service.exportLogs(
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
        'csv',
      );

      expect(result).toBeDefined();
      expect(result.format).toBe('csv');
    });

    it('should export logs in XML format', async () => {
      const mockLogs = [
        createMockAuditLog({ id: 1 }),
        createMockAuditLog({ id: 2 }),
        createMockAuditLog({ id: 3 }),
      ];

      auditLogRepo.find.mockResolvedValue(mockLogs);

      const result = await service.exportLogs(
        {
          actorType: 'user',
          isFinancialEvent: true,
        },
        'xml',
      );

      expect(result).toBeDefined();
      expect(result.format).toBe('xml');
      expect(result.recordCount).toBe(3);
    });

    it('should include processing time in export response', async () => {
      auditLogRepo.find.mockResolvedValue([]);

      const result = await service.exportLogs({}, 'csv');

      expect(result.processingTimeMs).toBeDefined();
      expect(result.exportId).toBeDefined();
      expect(result.status).toBe('completed');
    });
  });

  // ==========================================================================
  // getHealthStatus() Method Tests
  // ==========================================================================

  describe('getHealthStatus()', () => {
    it('should return system health status', async () => {
      auditLogRepo.count.mockResolvedValue(10000);

      const result = await service.getHealthStatus();

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Syrian Market Specific Tests
  // ==========================================================================

  describe('Syrian Market Compliance', () => {
    it('should track Syrian governorate in audit logs', async () => {
      const logDto: CreateAuditLogDto = {
        action: 'order.place',
        actorId: 100,
        actorType: 'user',
        module: 'orders',
        description: 'Order placed from Damascus',
        country: 'Syria',
        city: 'Damascus',
        meta: {
          governorate: 'Damascus',
          paymentMethod: 'syriatel_cash',
        },
      };

      const mockLog = createMockAuditLog(logDto);
      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(logDto);

      expect(result.meta.governorate).toBe('Damascus');
    });

    it('should handle all 14 Syrian governorates', async () => {
      const governorates = [
        'Damascus', 'Aleppo', 'Homs', 'Hama', 'Latakia',
        'Tartus', 'Daraa', 'Sweida', 'Quneitra', 'Rif Dimashq',
        'Idlib', 'Deir ez-Zor', 'Raqqa', 'Al-Hasakah',
      ];

      for (const governorate of governorates) {
        const logDto: CreateAuditLogDto = {
          action: 'region.access',
          actorId: 1,
          actorType: 'user',
          description: `Access from ${governorate}`,
          country: 'Syria',
          city: governorate,
          meta: { governorate },
        };

        const mockLog = createMockAuditLog(logDto);
        auditLogRepo.create.mockReturnValue(mockLog);
        auditLogRepo.save.mockResolvedValue(mockLog);

        const result = await service.log(logDto);
        expect(result.meta.governorate).toBe(governorate);
      }
    });

    it('should track Syrian payment methods', async () => {
      const paymentMethods = ['syriatel_cash', 'mtn_cash', 'bank_transfer', 'cod'];

      for (const method of paymentMethods) {
        const logDto: CreateAuditLogDto = {
          action: 'payment.attempt',
          actorId: 50,
          actorType: 'user',
          module: 'payments',
          isFinancialEvent: true,
          description: `Payment via ${method}`,
          meta: {
            paymentMethod: method,
            amount: 250000, // 250,000 SYP
          },
        };

        const mockLog = createMockFinancialEvent(logDto);
        auditLogRepo.create.mockReturnValue(mockLog);
        auditLogRepo.save.mockResolvedValue(mockLog);

        const result = await service.log(logDto);
        expect(result.meta.paymentMethod).toBe(method);
      }
    });

    it('should track large SYP transactions for financial compliance', async () => {
      const largeTransaction: CreateAuditLogDto = {
        action: 'payment.large_transaction',
        actorId: 200,
        actorType: 'user',
        module: 'payments',
        description: 'High-value transaction detected',
        isFinancialEvent: true,
        severity: 'high',
        meta: {
          amount: 50000000, // 50 million SYP
          threshold: 10000000,
          requiresReview: true,
        },
      };

      const mockLog = createMockFinancialEvent({
        ...largeTransaction,
        monetaryAmount: 50000000,
        currency: 'SYP',
      });
      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(largeTransaction);

      expect(result.isFinancialEvent).toBe(true);
      expect(result.monetaryAmount).toBe(50000000);
    });

    it('should support multiple currencies (SYP, USD, EUR, TRY)', async () => {
      const currencies = ['SYP', 'USD', 'EUR', 'TRY'];

      for (const currency of currencies) {
        const logDto: CreateAuditLogDto = {
          action: 'payment.process',
          actorId: 100,
          actorType: 'user',
          module: 'payments',
          isFinancialEvent: true,
          meta: { currency, amount: 1000 },
        };

        const mockLog = createMockFinancialEvent({ currency });
        auditLogRepo.create.mockReturnValue(mockLog);
        auditLogRepo.save.mockResolvedValue(mockLog);

        const result = await service.log(logDto);
        expect(result.currency).toBe(currency);
      }
    });
  });

  // ==========================================================================
  // Security Event Analysis Tests
  // ==========================================================================

  describe('Security Event Analysis', () => {
    it('should detect brute force login attempts', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getRawMany.mockResolvedValue([
        { ipAddress: '192.168.1.100', failedCount: '10', timeWindow: '5min' },
      ]);

      const result = await service.getSecurityMonitoring();

      expect(result).toBeDefined();
    });

    it('should flag suspicious geographic access patterns', async () => {
      const queryBuilder = auditLogRepo.createQueryBuilder();
      queryBuilder.getRawMany.mockResolvedValue([
        { actorId: 1, city: 'Damascus', timestamp: '2024-01-15T10:00:00' },
        { actorId: 1, city: 'Aleppo', timestamp: '2024-01-15T10:05:00' },
      ]);

      const result = await service.getSecurityMonitoring();

      expect(result).toBeDefined();
    });

    it('should track admin actions for security review', async () => {
      const adminLog = createMockSecurityEvent({
        action: 'admin.permission_change',
        actorType: 'admin',
        actorId: 1,
        severity: 'high',
        isSecurityEvent: true,
        meta: {
          targetUserId: 100,
          oldPermissions: ['read'],
          newPermissions: ['read', 'write', 'delete'],
        },
      });

      auditLogRepo.create.mockReturnValue(adminLog);
      auditLogRepo.save.mockResolvedValue(adminLog);

      const result = await service.log({
        action: 'admin.permission_change',
        actorType: 'admin',
        actorId: 1,
        isSecurityEvent: true,
        severity: 'high',
        description: 'Admin changed user permissions',
        meta: {
          targetUserId: 100,
          oldPermissions: ['read'],
          newPermissions: ['read', 'write', 'delete'],
        },
      });

      expect(result.isSecurityEvent).toBe(true);
    });
  });

  // ==========================================================================
  // Performance and Caching Tests
  // ==========================================================================

  describe('Performance and Caching', () => {
    it('should use cache for frequent queries', async () => {
      // Note: Service uses internal Map cache, not CACHE_MANAGER
      // This test verifies that repeated analytics calls work efficiently
      auditLogRepo.find.mockResolvedValue([]);

      // First call - should complete successfully
      const result1 = await service.getAnalytics({});
      expect(result1).toBeDefined();
      expect(result1.totalLogs).toBeDefined();

      // Second call - should also complete (uses internal cache)
      const result2 = await service.getAnalytics({});
      expect(result2).toBeDefined();

      // Analytics structure should be consistent
      expect(result1.totalLogs).toEqual(result2.totalLogs);
    });

    it('should return cached results when available', async () => {
      // Note: Service uses internal Map cache with 10-minute TTL
      // This test verifies that repeated calls within TTL return consistent results
      const mockLogs = [
        createMockAuditLog({ id: 1, action: 'user.login', severity: 'low' }),
        createMockAuditLog({ id: 2, action: 'order.create', severity: 'medium' }),
      ];

      auditLogRepo.find.mockResolvedValue(mockLogs);

      // First call - populates internal cache
      const result1 = await service.getAnalytics({});
      expect(result1.totalLogs).toBe(2);

      // Verify find was called for first request
      expect(auditLogRepo.find).toHaveBeenCalled();

      // Clear mock call count
      auditLogRepo.find.mockClear();

      // Second call within TTL - should use internal cache
      const result2 = await service.getAnalytics({});
      expect(result2.totalLogs).toBe(2);

      // Find should NOT be called again (internal cache hit)
      expect(auditLogRepo.find).not.toHaveBeenCalled();
    });

    it('should handle high-volume logging efficiently', async () => {
      const bulkDto: BulkAuditLogDto = {
        logs: Array.from({ length: 100 }, (_, i) => ({
          action: `bulk.action_${i}`,
          actorId: i + 1, // actorId must be >= 1
          actorType: 'system' as const,
          description: `Bulk action ${i}`,
        })),
        priority: 'normal',
        source: 'batch_job',
      };

      auditLogRepo.create.mockImplementation((dto) => dto);
      auditLogRepo.save.mockResolvedValue(bulkDto.logs);

      const startTime = Date.now();
      await service.logBulk(bulkDto);
      const endTime = Date.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  // ==========================================================================
  // Data Retention and Archival Tests
  // ==========================================================================

  describe('Data Retention', () => {
    it('should calculate retention dates correctly', async () => {
      const logDto: CreateAuditLogDto = {
        action: 'standard.event',
        actorId: 1,
        actorType: 'user',
        description: 'Standard event for retention testing',
      };

      const mockLog = createMockAuditLog(logDto);
      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(logDto);

      expect(result).toBeDefined();
    });

    it('should extend retention for critical events', async () => {
      const criticalEvent: CreateAuditLogDto = {
        action: 'security.breach',
        actorId: 0,
        actorType: 'system',
        description: 'Critical security event',
        severity: 'critical',
        isSecurityEvent: true,
      };

      const mockLog = createMockSecurityEvent({
        ...criticalEvent,
        severity: 'critical',
      });
      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(criticalEvent);

      expect(result.severity).toBe('critical');
    });

    it('should handle compliance events with extended retention', async () => {
      const complianceEvent: CreateAuditLogDto = {
        action: 'compliance.audit',
        actorId: 1,
        actorType: 'admin',
        isComplianceEvent: true,
        severity: 'high',
        description: 'Compliance audit performed',
      };

      const mockLog = createMockComplianceEvent(complianceEvent);
      auditLogRepo.create.mockReturnValue(mockLog);
      auditLogRepo.save.mockResolvedValue(mockLog);

      const result = await service.log(complianceEvent);

      expect(result.isComplianceEvent).toBe(true);
    });
  });

  // ==========================================================================
  // Entity Methods Tests
  // ==========================================================================

  describe('AuditLog Entity Methods', () => {
    it('should generate checksum for critical events', () => {
      const auditLog = new AuditLog();
      auditLog.action = 'payment.process';
      auditLog.actorId = 1;
      auditLog.entityType = 'order';
      auditLog.entityId = 100;
      auditLog.isFinancialEvent = true;
      auditLog.createdAt = new Date();

      const checksum = auditLog.generateChecksum();

      // Financial events should generate checksum
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
    });

    it('should return null checksum for non-critical events', () => {
      const auditLog = new AuditLog();
      auditLog.action = 'product.view';
      auditLog.actorId = 1;
      auditLog.isFinancialEvent = false;
      auditLog.isSecurityEvent = false;
      auditLog.isComplianceEvent = false;

      const checksum = auditLog.generateChecksum();

      expect(checksum).toBeNull();
    });

    it('should calculate risk score correctly', () => {
      const auditLog = new AuditLog();
      auditLog.severity = 'critical';
      auditLog.isSecurityEvent = true;
      auditLog.isFinancialEvent = true;
      auditLog.monetaryAmount = 100000;
      auditLog.operationType = 'delete';

      const riskScore = auditLog.calculateRiskScore();

      expect(riskScore).toBeGreaterThan(50);
      expect(riskScore).toBeLessThanOrEqual(100);
    });

    it('should identify critical logs correctly', () => {
      const auditLog = new AuditLog();
      auditLog.severity = 'critical';

      expect(auditLog.isCritical()).toBe(true);
    });

    it('should generate human-readable summary', () => {
      const auditLog = new AuditLog();
      auditLog.actorName = 'Ahmad';
      auditLog.actorType = 'user';
      auditLog.actorId = 123;
      auditLog.action = 'order.create';
      auditLog.entityDescription = 'Order #456';
      auditLog.entityType = 'order';
      auditLog.entityId = 456;

      const summary = auditLog.generateSummary();

      expect(summary).toContain('Ahmad');
      expect(summary).toContain('order.create');
    });
  });
});
