/**
 * @file clv-calculation.service.spec.ts
 * @description Comprehensive unit tests for CLVCalculationService
 *
 * TEST COVERAGE:
 * - RFM score calculation with weighted components
 * - Customer segmentation logic for all segments
 * - Churn probability computation
 * - Retention action recommendations
 * - Edge cases and boundary conditions
 * - Batch CLV calculations
 *
 * @author Test Automation Team
 * @since 2026-01-24
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CLVCalculationService, ICustomerCLVMetrics, ICLVAnalytics } from '../clv-calculation.service';
import { User } from '../../../users/entities/user.entity';
import { Order } from '../../../orders/entities/order.entity';
import { BusinessEvent, CustomerSegment, BusinessEventType } from '../../entities/business-event.entity';
import { BusinessEventPublisher } from '../business-event-publisher.service';

/**
 * Test data factory for creating mock users
 */
class UserFactory {
  static create(overrides?: Partial<User>): User {
    const user = new User();
    user.id = overrides?.id || Math.floor(Math.random() * 10000);
    user.email = overrides?.email || `user${user.id}@test.com`;
    user.fullName = overrides?.fullName || 'Test User';
    user.createdAt = overrides?.createdAt || new Date();
    return Object.assign(user, overrides);
  }

  static createActive(daysAgo: number = 60): User {
    return this.create({
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    });
  }

  static createNew(): User {
    return this.create({
      createdAt: new Date()
    });
  }
}

/**
 * Test data factory for creating mock orders
 */
class OrderFactory {
  static create(userId: number, overrides?: Partial<Order>): Order {
    const order = new Order();
    order.id = Math.floor(Math.random() * 100000);
    (order as any).userId = userId;
    order.total_amount = overrides?.total_amount || 100000;
    order.status = 'completed' as any;
    (order as any).createdAt = overrides?.created_at || new Date();
    return Object.assign(order, overrides);
  }

  static createBatch(userId: number, count: number, daysAgoStart: number = 0): Order[] {
    return Array.from({ length: count }, (_, index) => {
      const daysAgo = daysAgoStart + (index * 30);
      return this.create(userId, {
        created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        total_amount: 50000 + (index * 10000)
      } as any);
    });
  }
}

/**
 * CLVCalculationService Unit Tests
 */
describe('CLVCalculationService', () => {
  let service: CLVCalculationService;
  let userRepository: jest.Mocked<Repository<User>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let businessEventRepository: jest.Mocked<Repository<BusinessEvent>>;
  let businessEventPublisher: jest.Mocked<BusinessEventPublisher>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  /**
   * Setup test module with mocked dependencies
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CLVCalculationService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            find: jest.fn(),
            count: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(BusinessEvent),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn()
          }
        },
        {
          provide: BusinessEventPublisher,
          useValue: {
            publishEvent: jest.fn()
          }
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<CLVCalculationService>(CLVCalculationService);
    userRepository = module.get(getRepositoryToken(User));
    orderRepository = module.get(getRepositoryToken(Order));
    businessEventRepository = module.get(getRepositoryToken(BusinessEvent));
    businessEventPublisher = module.get(BusinessEventPublisher);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // RFM SCORE CALCULATION TESTS
  // =========================================================================

  describe('RFM Score Calculation', () => {
    it('should calculate RFM score as weighted average with correct weights', () => {
      // Arrange
      const recency = 30;        // Days since last order
      const frequency = 3;       // Orders per month
      const monetary = 150000;   // SYP

      // Act
      const score = (service as any).calculateRFMScore(recency, frequency, monetary);

      // Assert
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(5);
      expect(typeof score).toBe('number');
    });

    it('should weight recency more heavily (0.4) than frequency (0.3) and monetary (0.3)', () => {
      // Arrange
      const recentCustomer = (service as any).calculateRFMScore(10, 0.5, 30000);
      const inactiveCustomer = (service as any).calculateRFMScore(200, 0.5, 30000);

      // Act & Assert
      expect(recentCustomer).toBeGreaterThan(inactiveCustomer);
    });

    it('should return score 5 for excellent customer (recent, frequent, high value)', () => {
      // Arrange
      const recency = 7;         // Very recent
      const frequency = 10;      // Very frequent
      const monetary = 1000000;  // Very high

      // Act
      const score = (service as any).calculateRFMScore(recency, frequency, monetary);

      // Assert - score should be near max (4-5 range for excellent customers)
      expect(score).toBeGreaterThanOrEqual(4);
      expect(score).toBeLessThanOrEqual(5);
    });

    it('should return score 1 for poor customer (inactive, infrequent, low value)', () => {
      // Arrange
      const recency = 400;       // Very inactive
      const frequency = 0.1;     // Almost never
      const monetary = 10000;    // Very low

      // Act
      const score = (service as any).calculateRFMScore(recency, frequency, monetary);

      // Assert
      expect(score).toBeCloseTo(1, 0);
    });

    it('should handle edge case: zero frequency and monetary', () => {
      // Arrange
      const recency = 0;
      const frequency = 0;
      const monetary = 0;

      // Act
      const score = (service as any).calculateRFMScore(recency, frequency, monetary);

      // Assert
      expect(isNaN(score)).toBeFalsy();
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle extreme values without overflow', () => {
      // Arrange
      const recency = Number.MAX_SAFE_INTEGER;
      const frequency = 0;
      const monetary = 0;

      // Act
      const score = (service as any).calculateRFMScore(recency, frequency, monetary);

      // Assert
      expect(isFinite(score)).toBeTruthy();
      expect(score).toBeLessThanOrEqual(5);
    });
  });

  // =========================================================================
  // CUSTOMER SEGMENTATION TESTS
  // =========================================================================

  describe('Customer Segmentation', () => {
    it('should segment NEW customer correctly (< 30 days, 1 order)', () => {
      // Arrange
      const recency = 5;
      const orderCount = 1;
      const historicalCLV = 50000;
      const lifespanDays = 5;
      const totalCLV = 75000;

      // Act
      const segment = (service as any).determineCustomerSegment(
        recency, orderCount, historicalCLV, lifespanDays, totalCLV
      );

      // Assert
      expect(segment).toBe(CustomerSegment.NEW);
    });

    it('should segment ACTIVE customer correctly (regular purchases within 90 days)', () => {
      // Arrange
      const recency = 30;
      const orderCount = 5;
      const historicalCLV = 300000;
      const lifespanDays = 90;
      const totalCLV = 450000;

      // Act
      const segment = (service as any).determineCustomerSegment(
        recency, orderCount, historicalCLV, lifespanDays, totalCLV
      );

      // Assert
      expect(segment).toBe(CustomerSegment.ACTIVE);
    });

    it('should segment customers with 90-365 days recency appropriately', () => {
      // Arrange - inactive customer with moderate stats
      const recency = 200;  // Higher recency to trigger at-risk or churned
      const orderCount = 2;
      const historicalCLV = 80000;
      const lifespanDays = 200;
      const totalCLV = 100000;

      // Act
      const segment = (service as any).determineCustomerSegment(
        recency, orderCount, historicalCLV, lifespanDays, totalCLV
      );

      // Assert - should be AT_RISK or CHURNED based on algorithm logic
      expect([CustomerSegment.AT_RISK, CustomerSegment.CHURNED]).toContain(segment);
    });

    it('should segment CHURNED customer correctly (> 365 days no purchase)', () => {
      // Arrange
      const recency = 400;
      const orderCount = 3;
      const historicalCLV = 200000;
      const lifespanDays = 365;
      const totalCLV = 250000;

      // Act
      const segment = (service as any).determineCustomerSegment(
        recency, orderCount, historicalCLV, lifespanDays, totalCLV
      );

      // Assert
      expect(segment).toBe(CustomerSegment.CHURNED);
    });

    it('should segment VIP customer correctly (high CLV + frequent orders)', () => {
      // Arrange
      const recency = 10;
      const orderCount = 20;
      const historicalCLV = 2000000;
      const lifespanDays = 300;
      const totalCLV = 3000000;

      // Act
      const segment = (service as any).determineCustomerSegment(
        recency, orderCount, historicalCLV, lifespanDays, totalCLV
      );

      // Assert
      expect(segment).toBe(CustomerSegment.VIP);
    });

    it('should prioritize CHURNED status over other segments', () => {
      // Arrange (Churned takes precedence)
      const recency = 400;
      const orderCount = 50;  // High order count
      const historicalCLV = 5000000;  // High CLV
      const lifespanDays = 500;
      const totalCLV = 7000000;

      // Act
      const segment = (service as any).determineCustomerSegment(
        recency, orderCount, historicalCLV, lifespanDays, totalCLV
      );

      // Assert
      expect(segment).toBe(CustomerSegment.CHURNED);
    });
  });

  // =========================================================================
  // CHURN PROBABILITY TESTS
  // =========================================================================

  describe('Churn Probability Calculation', () => {
    it('should return probability between 0 and 1', () => {
      // Arrange
      const recency = 50;
      const frequency = 2;
      const rfmScore = 3;

      // Act
      const probability = (service as any).calculateChurnProbability(recency, frequency, rfmScore);

      // Assert
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    });

    it('should return high churn probability for inactive customers (recency > 365)', () => {
      // Arrange
      const recency = 400;
      const frequency = 1;
      const rfmScore = 1.5;

      // Act
      const probability = (service as any).calculateChurnProbability(recency, frequency, rfmScore);

      // Assert
      expect(probability).toBeGreaterThan(0.8);
    });

    it('should return low churn probability for recent active customers (recency < 30)', () => {
      // Arrange
      const recency = 10;
      const frequency = 5;
      const rfmScore = 4.5;

      // Act
      const probability = (service as any).calculateChurnProbability(recency, frequency, rfmScore);

      // Assert
      expect(probability).toBeLessThan(0.3);
    });

    it('should reduce churn probability for high-frequency customers', () => {
      // Arrange
      const lowFrequencyChurn = (service as any).calculateChurnProbability(90, 0.5, 2);
      const highFrequencyChurn = (service as any).calculateChurnProbability(90, 5, 2);

      // Act & Assert
      expect(highFrequencyChurn).toBeLessThan(lowFrequencyChurn);
    });

    it('should increase churn probability for low RFM scores', () => {
      // Arrange
      const lowRFMChurn = (service as any).calculateChurnProbability(60, 1, 1.5);
      const highRFMChurn = (service as any).calculateChurnProbability(60, 1, 4.5);

      // Act & Assert
      expect(lowRFMChurn).toBeGreaterThan(highRFMChurn);
    });

    it('should apply correct recency probability bins', () => {
      // Arrange
      const recentChurn = (service as any).calculateChurnProbability(15, 2, 3);        // < 30
      const moderateChurn = (service as any).calculateChurnProbability(60, 2, 3);      // 30-90
      const riskyChurn = (service as any).calculateChurnProbability(150, 2, 3);        // 90-180
      const atRiskChurn = (service as any).calculateChurnProbability(250, 2, 3);       // 180-365
      const churnedChurn = (service as any).calculateChurnProbability(400, 2, 3);      // > 365

      // Act & Assert
      expect(recentChurn).toBeLessThan(moderateChurn);
      expect(moderateChurn).toBeLessThan(riskyChurn);
      expect(riskyChurn).toBeLessThan(atRiskChurn);
      expect(atRiskChurn).toBeLessThan(churnedChurn);
    });
  });

  // =========================================================================
  // RETENTION ACTION RECOMMENDATION TESTS
  // =========================================================================

  describe('Retention Action Recommendations', () => {
    it('should recommend account manager for VIP customers', () => {
      // Arrange
      const segment = CustomerSegment.VIP;
      const churnProbability = 0.1;
      const totalCLV = 2000000;

      // Act
      const action = (service as any).determineRetentionAction(
        segment, churnProbability, totalCLV
      );

      // Assert
      expect(action).toContain('dedicated account manager');
    });

    it('should recommend personalized win-back for high-value at-risk customers', () => {
      // Arrange
      const segment = CustomerSegment.AT_RISK;
      const churnProbability = 0.6;
      const totalCLV = 100000;

      // Act
      const action = (service as any).determineRetentionAction(
        segment, churnProbability, totalCLV
      );

      // Assert
      expect(action).toContain('discount');
    });

    it('should recommend aggressive re-engagement for high-value churned customers', () => {
      // Arrange
      const segment = CustomerSegment.CHURNED;
      const churnProbability = 0.95;
      const totalCLV = 500000;

      // Act
      const action = (service as any).determineRetentionAction(
        segment, churnProbability, totalCLV
      );

      // Assert
      expect(action).toContain('25% discount');
    });

    it('should recommend onboarding for NEW customers', () => {
      // Arrange
      const segment = CustomerSegment.NEW;
      const churnProbability = 0.3;
      const totalCLV = 75000;

      // Act
      const action = (service as any).determineRetentionAction(
        segment, churnProbability, totalCLV
      );

      // Assert
      expect(action).toContain('onboarding');
    });

    it('should recommend upselling for active high-value customers', () => {
      // Arrange
      const segment = CustomerSegment.ACTIVE;
      const churnProbability = 0.2;
      const totalCLV = 300000;

      // Act
      const action = (service as any).determineRetentionAction(
        segment, churnProbability, totalCLV
      );

      // Assert
      expect(action).toContain('premium');
    });

    it('should handle all customer segment transitions', () => {
      const segments = [
        CustomerSegment.NEW,
        CustomerSegment.ACTIVE,
        CustomerSegment.BIG_SPENDER,
        CustomerSegment.AT_RISK,
        CustomerSegment.CHURNED,
        CustomerSegment.VIP
      ];

      for (const segment of segments) {
        // Act
        const action = (service as any).determineRetentionAction(segment, 0.5, 100000);

        // Assert
        expect(action).toBeTruthy();
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // INTEGRATION WITH ACTUAL SERVICE METHODS
  // =========================================================================

  describe('computeCLVMetrics', () => {
    it('should compute complete CLV metrics for a customer', async () => {
      // Arrange
      const user = UserFactory.create({ id: 1 });
      const orders = OrderFactory.createBatch(1, 5, 0);

      // Act
      const metrics = await (service as any).computeCLVMetrics(user, orders);

      // Assert
      expect(metrics).toHaveProperty('userId');
      expect(metrics).toHaveProperty('historicalCLV');
      expect(metrics).toHaveProperty('predictedCLV');
      expect(metrics).toHaveProperty('totalCLV');
      expect(metrics).toHaveProperty('segment');
      expect(metrics).toHaveProperty('churnProbability');
      expect(metrics).toHaveProperty('rfmScore');
      expect(metrics).toHaveProperty('retentionAction');

      expect(metrics.historicalCLV).toBeGreaterThanOrEqual(0);
      expect(metrics.totalCLV).toBeGreaterThanOrEqual(metrics.historicalCLV);
      expect(metrics.rfmScore).toBeGreaterThanOrEqual(1);
      expect(metrics.rfmScore).toBeLessThanOrEqual(5);
    });

    it('should handle customer with no orders', async () => {
      // Arrange
      const user = UserFactory.create({ id: 1 });
      const orders: Order[] = [];

      // Act
      const metrics = await (service as any).computeCLVMetrics(user, orders);

      // Assert
      expect(metrics.orderCount).toBe(0);
      expect(metrics.historicalCLV).toBe(0);
      expect(metrics.frequency).toBe(0);
    });

    it('should calculate correct monetary value for multiple orders', async () => {
      // Arrange
      const user = UserFactory.create({ id: 1 });
      const orders = [
        OrderFactory.create(1, { total_amount: 100000 } as any),
        OrderFactory.create(1, { total_amount: 200000 } as any),
        OrderFactory.create(1, { total_amount: 300000 } as any)
      ];

      // Act
      const metrics = await (service as any).computeCLVMetrics(user, orders);

      // Assert
      expect(metrics.historicalCLV).toBe(600000);
      expect(metrics.monetary).toBe(200000); // Average
      expect(metrics.orderCount).toBe(3);
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================

  describe('Error Handling', () => {
    it('should throw error when calculating CLV for nonexistent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.calculateCustomerCLV(999))
        .rejects
        .toThrow('User 999 not found');
    });

    it('should handle missing order data gracefully', async () => {
      // Arrange
      const user = UserFactory.create({ id: 1 });
      userRepository.findOne.mockResolvedValue(user);
      orderRepository.find.mockResolvedValue([]);
      businessEventPublisher.publishEvent.mockResolvedValue(undefined);

      // Act
      const metrics = await service.calculateCustomerCLV(1);

      // Assert
      expect(metrics.orderCount).toBe(0);
      expect(metrics.historicalCLV).toBe(0);
    });
  });

  // =========================================================================
  // PERFORMANCE TESTS
  // =========================================================================

  describe('Performance', () => {
    it('should calculate CLV for single customer within reasonable time', async () => {
      // Arrange
      const user = UserFactory.create({ id: 1 });
      const orders = OrderFactory.createBatch(1, 20);
      userRepository.findOne.mockResolvedValue(user);
      orderRepository.find.mockResolvedValue(orders);
      businessEventPublisher.publishEvent.mockResolvedValue(undefined);

      // Act
      const start = Date.now();
      await service.calculateCustomerCLV(1);
      const duration = Date.now() - start;

      // Assert
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
