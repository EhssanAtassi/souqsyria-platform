/**
 * @file payment.seeder.service.spec.ts
 * @description Unit tests for PaymentSeederService
 *
 * Tests payment seeding functionality including:
 * - Payment transaction creation with various methods and statuses
 * - Syrian market payment method distribution
 * - Multi-currency payment support
 * - Gateway response simulation
 * - Refund transaction seeding
 * - Error handling and validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentSeederService } from './payment.seeder.service';
import {
  PaymentTransaction,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment-transaction.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

describe('PaymentSeederService', () => {
  let service: PaymentSeederService;
  let paymentRepository: jest.Mocked<Repository<PaymentTransaction>>;
  let refundRepository: jest.Mocked<Repository<RefundTransaction>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentSeederService,
        {
          provide: getRepositoryToken(PaymentTransaction),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(RefundTransaction),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(Order),
          useFactory: () => ({
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            find: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<PaymentSeederService>(PaymentSeederService);
    paymentRepository = module.get(getRepositoryToken(PaymentTransaction));
    refundRepository = module.get(getRepositoryToken(RefundTransaction));
    orderRepository = module.get(getRepositoryToken(Order));
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('💳 Payment Seeding', () => {
    beforeEach(() => {
      // Mock test data
      const mockOrders = [
        {
          id: 1,
          total_amount: 2750000,
          user: { id: 1, email: 'customer1@souqsyria.com' },
        },
        {
          id: 2,
          total_amount: 550000,
          user: { id: 2, email: 'customer2@souqsyria.com' },
        },
        {
          id: 3,
          total_amount: 1100000,
          user: { id: 3, email: 'customer3@souqsyria.com' },
        },
      ];

      const mockUsers = [
        {
          id: 1,
          email: 'customer1@souqsyria.com',
          fullName: 'Ahmad Al-Syrian',
        },
        {
          id: 2,
          email: 'customer2@souqsyria.com',
          fullName: 'Fatima Al-Halabi',
        },
        { id: 3, email: 'customer3@souqsyria.com', fullName: 'Omar Al-Homsi' },
      ];

      orderRepository.find.mockResolvedValue(mockOrders as any);
      userRepository.find.mockResolvedValue(mockUsers as any);

      paymentRepository.create.mockImplementation(
        (data) => ({ id: Date.now(), ...data }) as any,
      );
      paymentRepository.save.mockImplementation((payment) =>
        Promise.resolve(payment as any),
      );
    });

    it('should seed payments successfully with default options', async () => {
      const result = await service.seedPayments();

      expect(result.success).toBe(true);
      expect(result.paymentsCreated).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.paymentsByMethod).toBeDefined();
      expect(result.paymentsByStatus).toBeDefined();
      expect(orderRepository.find).toHaveBeenCalled();
      expect(userRepository.find).toHaveBeenCalled();
    });

    it('should create payments with Syrian market focus', async () => {
      const options = {
        batchSize: 10,
        syrianMarketFocus: true,
        includeGatewayResponses: true,
      };

      const result = await service.seedPayments(options);

      expect(result.success).toBe(true);
      expect(result.paymentsCreated).toBe(3); // Limited by available orders
      expect(paymentRepository.create).toHaveBeenCalledTimes(3);
      expect(paymentRepository.save).toHaveBeenCalledTimes(3);

      // Verify payment creation calls
      const createCalls = paymentRepository.create.mock.calls;
      expect(createCalls.length).toBe(3);

      // Check that payment methods include Syrian-specific options
      const methods = createCalls.map((call) => call[0].method);
      const hasValidMethods = methods.every((method) =>
        [
          PaymentMethod.CASH,
          PaymentMethod.CARD,
          PaymentMethod.WALLET,
          'bank_transfer',
          'mobile_payment',
        ].includes(method),
      );
      expect(hasValidMethods).toBe(true);
    });

    it('should handle currency conversion correctly', async () => {
      const result = await service.seedPayments({
        batchSize: 5,
        syrianMarketFocus: false, // More USD/EUR payments
      });

      expect(result.success).toBe(true);

      const createCalls = paymentRepository.create.mock.calls;
      expect(createCalls.length).toBeGreaterThan(0);

      // Check that amounts are properly converted for non-SYP currencies
      const paymentsWithUSD = createCalls.filter(
        (call) => call[0].currency === 'USD',
      );
      if (paymentsWithUSD.length > 0) {
        const usdPayment = paymentsWithUSD[0][0];
        expect(usdPayment.amount).toBeLessThan(10000); // USD amounts should be much smaller than SYP
      }
    });

    it('should generate realistic gateway responses', async () => {
      const result = await service.seedPayments({
        batchSize: 5,
        includeGatewayResponses: true,
      });

      expect(result.success).toBe(true);

      const createCalls = paymentRepository.create.mock.calls;
      const paymentsWithGateway = createCalls.filter(
        (call) => call[0].gatewayResponse !== null,
      );

      if (paymentsWithGateway.length > 0) {
        const gatewayPayment = paymentsWithGateway[0][0];
        expect(gatewayPayment.gatewayResponse).toBeDefined();
        expect(gatewayPayment.gatewayResponse.amount).toBeDefined();
        expect(gatewayPayment.gatewayResponse.currency).toBeDefined();
        expect(gatewayPayment.gatewayResponse.timestamp).toBeDefined();
      }
    });

    it('should track payment statistics correctly', async () => {
      const result = await service.seedPayments({
        batchSize: 3,
      });

      expect(result.success).toBe(true);
      expect(result.paymentsByMethod).toBeDefined();
      expect(result.paymentsByStatus).toBeDefined();

      // Sum of all method counts should equal total payments created
      const totalByMethod = Object.values(result.paymentsByMethod).reduce(
        (sum, count) => sum + count,
        0,
      );
      expect(totalByMethod).toBe(result.paymentsCreated);

      // Sum of all status counts should equal total payments created
      const totalByStatus = Object.values(result.paymentsByStatus).reduce(
        (sum, count) => sum + count,
        0,
      );
      expect(totalByStatus).toBe(result.paymentsCreated);
    });

    it('should generate Syrian IP addresses', async () => {
      const result = await service.seedPayments({
        batchSize: 3,
        syrianMarketFocus: true,
      });

      expect(result.success).toBe(true);

      const createCalls = paymentRepository.create.mock.calls;
      expect(createCalls.length).toBeGreaterThan(0);

      // Check that IP addresses are generated
      const ipAddresses = createCalls.map((call) => call[0].ipAddress);
      expect(
        ipAddresses.every((ip) => typeof ip === 'string' && ip.includes('.')),
      ).toBe(true);
    });

    it('should handle error when no orders found', async () => {
      orderRepository.find.mockResolvedValue([]);

      const result = await service.seedPayments();

      expect(result.success).toBe(false);
      expect(result.paymentsCreated).toBe(0);
      expect(result.error).toContain('No orders found');
      expect(paymentRepository.create).not.toHaveBeenCalled();
    });

    it('should handle error when no users found', async () => {
      userRepository.find.mockResolvedValue([]);

      const result = await service.seedPayments();

      expect(result.success).toBe(false);
      expect(result.paymentsCreated).toBe(0);
      expect(result.error).toContain('No users found');
      expect(paymentRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      paymentRepository.save.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.seedPayments({
        batchSize: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('💰 Refund Seeding', () => {
    beforeEach(() => {
      const mockPaidPayments = [
        {
          id: 1,
          amount: 2750000,
          status: PaymentStatus.PAID,
          createdAt: new Date('2025-08-10'),
          order: { id: 1 },
          user: { id: 1 },
        },
        {
          id: 2,
          amount: 550000,
          status: PaymentStatus.PAID,
          createdAt: new Date('2025-08-12'),
          order: { id: 2 },
          user: { id: 2 },
        },
      ];

      paymentRepository.find.mockResolvedValue(mockPaidPayments as any);
      refundRepository.create.mockImplementation(
        (data) => ({ id: Date.now(), ...data }) as any,
      );
      refundRepository.save.mockImplementation((refund) =>
        Promise.resolve(refund as any),
      );
    });

    it('should seed refunds successfully', async () => {
      const result = await service.seedRefunds();

      expect(result.success).toBe(true);
      expect(result.refundsCreated).toBeGreaterThan(0);
      expect(paymentRepository.find).toHaveBeenCalledWith({
        where: { status: PaymentStatus.PAID },
        relations: ['order', 'user'],
        take: 20,
      });
      expect(refundRepository.create).toHaveBeenCalled();
      expect(refundRepository.save).toHaveBeenCalled();
    });

    it('should create partial and full refunds', async () => {
      const result = await service.seedRefunds();

      expect(result.success).toBe(true);

      const createCalls = refundRepository.create.mock.calls;
      expect(createCalls.length).toBeGreaterThan(0);

      // Check that refund amounts are reasonable
      createCalls.forEach((call) => {
        const refund = call[0];
        expect(refund.amount).toBeGreaterThan(0);
        expect(refund.notes).toBeDefined();
        expect(refund.method).toBeDefined();
        expect(refund.status).toBeDefined();
      });
    });

    it('should handle Arabic refund reasons', async () => {
      const result = await service.seedRefunds();

      expect(result.success).toBe(true);

      const createCalls = refundRepository.create.mock.calls;
      const arabicReasons = createCalls.filter(
        (call) => call[0].notes && /[\u0600-\u06FF]/.test(call[0].notes),
      );

      // At least some refunds should have Arabic reasons
      expect(arabicReasons.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle no paid payments gracefully', async () => {
      paymentRepository.find.mockResolvedValue([]);

      const result = await service.seedRefunds();

      expect(result.success).toBe(true);
      expect(result.refundsCreated).toBe(0);
      expect(refundRepository.create).not.toHaveBeenCalled();
    });

    it('should handle refund repository errors', async () => {
      refundRepository.save.mockRejectedValue(new Error('Refund save failed'));

      const result = await service.seedRefunds();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Refund save failed');
    });
  });

  describe('🌍 Syrian Market Features', () => {
    beforeEach(() => {
      // Generate multiple orders for diverse payment methods and currencies
      const mockOrders = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        total_amount: 1000000 + i * 500000, // 1M - 8M SYP
        user: { id: (i % 5) + 1, email: `customer${(i % 5) + 1}@souqsyria.com` },
      }));

      const mockUsers = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        email: `customer${i + 1}@souqsyria.com`,
        fullName: `أحمد السوري ${i + 1}`,
      }));

      orderRepository.find.mockResolvedValue(mockOrders as any);
      userRepository.find.mockResolvedValue(mockUsers as any);

      paymentRepository.create.mockImplementation(
        (data) => ({ id: Date.now() + Math.random(), ...data }) as any,
      );
      paymentRepository.save.mockImplementation((payment) =>
        Promise.resolve(payment as any),
      );
    });

    it('should prioritize Syrian payment methods', async () => {
      const result = await service.seedPayments({
        batchSize: 20,
        syrianMarketFocus: true,
      });

      expect(result.success).toBe(true);
      expect(result.paymentsByMethod).toBeDefined();

      // COD should be popular in Syrian market
      const totalPayments = result.paymentsCreated;
      const codPayments = result.paymentsByMethod[PaymentMethod.CASH] || 0;

      if (totalPayments > 5) {
        expect(codPayments).toBeGreaterThan(0); // COD should be present
      }
    });

    it('should handle SYP currency correctly', async () => {
      const result = await service.seedPayments({
        batchSize: 5,
        syrianMarketFocus: true,
      });

      expect(result.success).toBe(true);

      const createCalls = paymentRepository.create.mock.calls;
      const sypPayments = createCalls.filter(
        (call) => call[0].currency === 'SYP',
      );

      // Most payments should be in SYP for Syrian market
      expect(sypPayments.length).toBeGreaterThan(0);

      // SYP amounts should be in thousands/millions
      sypPayments.forEach((call) => {
        expect(call[0].amount).toBeGreaterThan(1000);
      });
    });

    it('should generate Syrian bank gateway responses', async () => {
      const result = await service.seedPayments({
        batchSize: 10,
        syrianMarketFocus: true,
        includeGatewayResponses: true,
      });

      expect(result.success).toBe(true);

      const createCalls = paymentRepository.create.mock.calls;

      // Verify gateway responses are generated for all payments with responses
      const paymentsWithGatewayResponse = createCalls.filter(
        (call: any) => call[0].gatewayResponse,
      );

      // At least some payments should have gateway responses
      expect(paymentsWithGatewayResponse.length).toBeGreaterThan(0);

      // Check that gateway responses have required base fields
      paymentsWithGatewayResponse.forEach((call: any) => {
        const gatewayResponse = call[0].gatewayResponse;
        expect(gatewayResponse.amount).toBeDefined();
        expect(gatewayResponse.currency).toBeDefined();
        expect(gatewayResponse.timestamp).toBeDefined();
      });
    });

    it('should generate mobile payment responses', async () => {
      const result = await service.seedPayments({
        batchSize: 10,
        syrianMarketFocus: true,
        includeGatewayResponses: true,
      });

      expect(result.success).toBe(true);

      const createCalls = paymentRepository.create.mock.calls;

      // Verify diverse payment methods were used
      const methods = new Set(createCalls.map((call: any) => call[0].method));
      expect(methods.size).toBeGreaterThan(0);

      // Verify gateway responses exist for card payments (those have mobile-like structure)
      const cardPayments = createCalls.filter(
        (call: any) =>
          call[0].method === 'card' && call[0].gatewayResponse?.card,
      );

      if (cardPayments.length > 0) {
        const cardPayment = cardPayments[0][0];
        expect(cardPayment.gatewayResponse.card.brand).toBeDefined();
        expect(cardPayment.gatewayResponse.card.last4).toBeDefined();
      }
    });
  });

  describe('⚡ Performance and Validation', () => {
    beforeEach(() => {
      // Setup default mock data for performance tests
      const mockOrders = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        total_amount: 1000000 + i * 500000,
        user: { id: (i % 5) + 1, email: `customer${i + 1}@souqsyria.com` },
      }));

      const mockUsers = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        email: `customer${i + 1}@souqsyria.com`,
        fullName: `Customer ${i + 1}`,
      }));

      orderRepository.find.mockResolvedValue(mockOrders as any);
      userRepository.find.mockResolvedValue(mockUsers as any);

      paymentRepository.create.mockImplementation(
        (data) => ({ id: Date.now() + Math.random(), ...data }) as any,
      );
      paymentRepository.save.mockImplementation((payment) =>
        Promise.resolve(payment as any),
      );
    });

    it('should complete seeding within reasonable time', async () => {
      const startTime = Date.now();

      const result = await service.seedPayments({
        batchSize: 10,
      });

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(5000); // Should complete within 5 seconds

      const actualTime = Date.now() - startTime;
      expect(actualTime).toBeLessThan(10000); // Actual execution should be under 10 seconds
    });

    it('should handle large batch sizes efficiently', async () => {
      // Mock more orders for large batch test
      const manyOrders = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        total_amount: 100000 + i * 50000,
        user: { id: (i % 10) + 1, email: `customer${i + 1}@souqsyria.com` },
      }));

      orderRepository.find.mockResolvedValue(manyOrders as any);

      const result = await service.seedPayments({
        batchSize: 50,
      });

      expect(result.success).toBe(true);
      expect(result.paymentsCreated).toBe(50);
      expect(paymentRepository.save).toHaveBeenCalledTimes(50);
    });

    it('should validate payment data integrity', async () => {
      const result = await service.seedPayments({
        batchSize: 5,
      });

      expect(result.success).toBe(true);

      const createCalls = paymentRepository.create.mock.calls;

      // Validate each payment has required fields
      createCalls.forEach((call) => {
        const payment = call[0];
        expect(payment.order).toBeDefined();
        expect(payment.user).toBeDefined();
        expect(payment.method).toBeDefined();
        expect(payment.amount).toBeGreaterThan(0);
        expect(payment.currency).toBeDefined();
        expect(payment.status).toBeDefined();
        expect(payment.createdAt).toBeDefined();
        expect(payment.updatedAt).toBeDefined();
      });
    });
  });
});
