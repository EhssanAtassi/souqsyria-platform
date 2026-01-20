/**
 * @file payment.service.spec.ts
 * @description Unit tests for PaymentService
 *
 * Tests comprehensive payment processing functionality including:
 * - Payment creation and confirmation
 * - Payment gateway integrations
 * - Refund processing
 * - Syrian market specific features
 * - Admin payment overrides
 * - Transaction status management
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';

import { PaymentService } from './payment.service';
import {
  PaymentTransaction,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment-transaction.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';
import { OrdersService } from '../../orders/service/orders.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<Repository<PaymentTransaction>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let refundRepository: jest.Mocked<Repository<RefundTransaction>>;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(PaymentTransaction),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
            })),
          }),
        },
        {
          provide: getRepositoryToken(Order),
          useFactory: () => ({
            findOne: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(RefundTransaction),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: OrdersService,
          useFactory: () => ({
            setOrderPaid: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepository = module.get(getRepositoryToken(PaymentTransaction));
    orderRepository = module.get(getRepositoryToken(Order));
    userRepository = module.get(getRepositoryToken(User));
    refundRepository = module.get(getRepositoryToken(RefundTransaction));
    ordersService = module.get(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('💳 Payment Creation', () => {
    it('should create payment transaction successfully', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: mockUser,
        total_amount: 275000, // 275,000 SYP
        status: 'confirmed',
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 275000,
        payment_method: PaymentMethod.CARD,
        gateway_transaction_id: 'stripe_pi_123456',
        metadata: {
          card_brand: 'visa',
          last4: '4242',
        },
      };

      const mockPayment = {
        id: 1,
        order: mockOrder,
        user: mockUser,
        amount: 275000,
        payment_method: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        gateway_transaction_id: 'stripe_pi_123456',
        created_at: new Date(),
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      paymentRepository.create.mockReturnValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue(mockPayment as any);

      const result = await service.createPayment(
        mockUser as any,
        createPaymentDto as any,
        '192.168.1.1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.amount).toBe(275000);
      expect(result.method).toBe(PaymentMethod.CARD);
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(paymentRepository.save).toHaveBeenCalled();
    });

    it('should throw error for non-existent order', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const createPaymentDto = {
        order_id: 999,
        amount: 275000,
        payment_method: PaymentMethod.CARD,
      };

      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createPayment(
          mockUser as any,
          createPaymentDto as any,
          '192.168.1.1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate payment amount against order total', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: mockUser,
        total_amount: 275000,
        status: 'confirmed',
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 500000, // Exceeds order total
        payment_method: PaymentMethod.CARD,
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      await expect(
        service.createPayment(
          mockUser as any,
          createPaymentDto as any,
          '192.168.1.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle SYP currency amounts correctly', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: mockUser,
        total_amount: 2750000, // 2,750,000 SYP
        status: 'confirmed',
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 2750000,
        payment_method: PaymentMethod.CASH,
        notes: 'Cash payment in Syrian Pounds',
      };

      const mockPayment = {
        id: 1,
        amount: 2750000,
        payment_method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      paymentRepository.create.mockReturnValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue(mockPayment as any);

      const result = await service.createPayment(
        mockUser as any,
        createPaymentDto as any,
        '192.168.1.1',
      );

      expect(result.amount).toBe(2750000);
      expect(result.method).toBe(PaymentMethod.CASH);
    });
  });

  describe('✅ Payment Confirmation', () => {
    it('should confirm payment successfully', async () => {
      const mockPayment = {
        id: 1,
        order: { id: 1, user: { id: 1 } },
        amount: 275000,
        status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.CARD,
      };

      const confirmDto = {
        payment_id: 1,
        gateway_response: {
          status: 'succeeded',
          transaction_id: 'stripe_pi_confirmed_123',
        },
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      } as any);
      ordersService.setOrderPaid.mockResolvedValue(undefined);

      const result = await service.confirmPayment(confirmDto as any);

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(paymentRepository.save).toHaveBeenCalled();
      expect(ordersService.setOrderPaid).toHaveBeenCalledWith(1);
    });

    it('should handle payment failure confirmation', async () => {
      const mockPayment = {
        id: 1,
        order: { id: 1 },
        status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.CARD,
      };

      const confirmDto = {
        payment_id: 1,
        gateway_response: {
          status: 'failed',
          error_message: 'Insufficient funds',
        },
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
      } as any);

      const result = await service.confirmPayment(confirmDto as any);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(ordersService.setOrderPaid).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent payment', async () => {
      const confirmDto = {
        payment_id: 999,
        gateway_response: { status: 'succeeded' },
      };

      paymentRepository.findOne.mockResolvedValue(null);

      await expect(service.confirmPayment(confirmDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error for already processed payment', async () => {
      const mockPayment = {
        id: 1,
        status: PaymentStatus.PAID, // Already processed
        payment_method: PaymentMethod.CARD,
      };

      const confirmDto = {
        payment_id: 1,
        gateway_response: { status: 'succeeded' },
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);

      await expect(service.confirmPayment(confirmDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('💰 Refund Processing', () => {
    it('should process refund successfully', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockPayment = {
        id: 1,
        order: { id: 1 },
        amount: 275000,
        status: PaymentStatus.PAID,
        payment_method: PaymentMethod.CARD,
      };

      const refundDto = {
        payment_id: 1,
        amount: 137500, // Partial refund
        reason: 'Customer requested refund',
      };

      const mockRefund = {
        id: 1,
        payment_transaction: mockPayment,
        amount: 137500,
        status: 'pending',
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);
      refundRepository.create.mockReturnValue(mockRefund as any);
      refundRepository.save.mockResolvedValue(mockRefund as any);

      const result = await service.refundPayment(
        refundDto as any,
        mockUser as any,
      );

      expect(result).toBeDefined();
      expect(result.amount).toBe(137500);
      expect(refundRepository.save).toHaveBeenCalled();
    });

    it('should validate refund amount', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockPayment = {
        id: 1,
        amount: 275000,
        status: PaymentStatus.PAID,
      };

      const refundDto = {
        payment_id: 1,
        amount: 500000, // Exceeds payment amount
        reason: 'Invalid refund amount',
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);

      await expect(
        service.refundPayment(refundDto as any, mockUser as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for non-paid payment', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockPayment = {
        id: 1,
        amount: 275000,
        status: PaymentStatus.PENDING, // Not paid yet
      };

      const refundDto = {
        payment_id: 1,
        amount: 137500,
        reason: 'Cannot refund pending payment',
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);

      await expect(
        service.refundPayment(refundDto as any, mockUser as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('🔍 Payment Retrieval', () => {
    it('should get payment by ID', async () => {
      const mockPayment = {
        id: 1,
        order: { id: 1 },
        user: { id: 1 },
        amount: 275000,
        status: PaymentStatus.PAID,
        payment_method: PaymentMethod.CARD,
        created_at: new Date(),
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);

      const result = await service.getTransactionById(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.amount).toBe(275000);
      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['order', 'user', 'refunds'],
      });
    });

    it('should throw error for non-existent payment', async () => {
      paymentRepository.findOne.mockResolvedValue(null);

      await expect(service.getTransactionById(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should search payments with filters', async () => {
      const searchDto = {
        status: PaymentStatus.PAID,
        payment_method: PaymentMethod.CARD,
        amount_min: 100000,
        amount_max: 500000,
        page: 1,
        limit: 10,
      };

      const mockPayments = [
        {
          id: 1,
          amount: 275000,
          status: PaymentStatus.PAID,
          payment_method: PaymentMethod.CARD,
        },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockPayments, 1]),
      };

      paymentRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.searchPayments(searchDto as any);

      expect(result).toBeDefined();
      expect(result[0]).toHaveLength(1);
      expect(result[1]).toBe(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'payment.status = :status',
        { status: PaymentStatus.PAID },
      );
    });
  });

  describe('👨‍💼 Admin Operations', () => {
    it('should allow admin to override payment status', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@souqsyria.com',
        role: { name: 'admin' },
      };

      const mockPayment = {
        id: 1,
        order: { id: 1 },
        status: PaymentStatus.FAILED,
        payment_method: PaymentMethod.CARD,
      };

      const overrideDto = {
        payment_id: 1,
        new_status: PaymentStatus.PAID,
        admin_notes: 'Manual verification completed',
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      } as any);
      ordersService.setOrderPaid.mockResolvedValue(undefined);

      const result = await service.adminOverridePayment(
        overrideDto as any,
        mockAdmin as any,
      );

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(paymentRepository.save).toHaveBeenCalled();
      expect(ordersService.setOrderPaid).toHaveBeenCalled();
    });

    it('should soft delete payment transaction', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@souqsyria.com',
      };

      const mockPayment = {
        id: 1,
        status: PaymentStatus.FAILED,
        deleted_at: null,
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue({
        ...mockPayment,
        deleted_at: new Date(),
      } as any);

      await service.softDeletePayment(1, mockAdmin as any);

      expect(paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(Date),
        }),
      );
    });

    it('should throw error when deleting successful payment', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@souqsyria.com',
      };

      const mockPayment = {
        id: 1,
        status: PaymentStatus.PAID, // Cannot delete successful payment
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment as any);

      await expect(
        service.softDeletePayment(1, mockAdmin as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('🌍 Syrian Market Features', () => {
    it('should handle Syrian bank transfers', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: mockUser,
        total_amount: 1000000, // 1,000,000 SYP
        status: 'confirmed',
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 1000000,
        payment_method: 'bank_transfer',
        bank_details: {
          bank_name: 'Central Bank of Syria',
          account_number: 'CBS123456789',
          reference_number: 'REF789123',
        },
        metadata: {
          currency: 'SYP',
          exchange_rate: 1,
        },
      };

      const mockPayment = {
        id: 1,
        amount: 1000000,
        payment_method: 'bank_transfer',
        status: PaymentStatus.PENDING,
        metadata: {
          currency: 'SYP',
          bank_name: 'Central Bank of Syria',
        },
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      paymentRepository.create.mockReturnValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue(mockPayment as any);

      const result = await service.createPayment(
        mockUser as any,
        createPaymentDto as any,
        '192.168.1.1',
      );

      expect(result.amount).toBe(1000000);
      expect(result.gatewayResponse.currency).toBe('SYP');
      expect(result.gatewayResponse.bank_name).toBe('Central Bank of Syria');
    });

    it('should handle cash on delivery payments', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: mockUser,
        total_amount: 500000, // 500,000 SYP
        status: 'confirmed',
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 500000,
        payment_method: PaymentMethod.CASH,
        notes: 'Cash on delivery - Damascus area',
        metadata: {
          delivery_area: 'Damascus',
          currency: 'SYP',
        },
      };

      const mockPayment = {
        id: 1,
        amount: 500000,
        payment_method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      paymentRepository.create.mockReturnValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue(mockPayment as any);

      const result = await service.createPayment(
        mockUser as any,
        createPaymentDto as any,
        '192.168.1.1',
      );

      expect(result.amount).toBe(500000);
      expect(result.method).toBe(PaymentMethod.CASH);
    });

    it('should handle multi-currency payments for diaspora customers', async () => {
      const mockUser = { id: 1, email: 'diaspora@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: mockUser,
        total_amount: 2750000, // Equivalent in SYP
        status: 'confirmed',
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 100, // 100 USD
        payment_method: PaymentMethod.CARD,
        metadata: {
          original_currency: 'USD',
          original_amount: 100,
          exchange_rate: 27500, // 1 USD = 27,500 SYP
          converted_amount: 2750000,
        },
      };

      const mockPayment = {
        id: 1,
        amount: 2750000, // Stored in SYP
        payment_method: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        metadata: {
          original_currency: 'USD',
          original_amount: 100,
        },
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      paymentRepository.create.mockReturnValue(mockPayment as any);
      paymentRepository.save.mockResolvedValue(mockPayment as any);

      const result = await service.createPayment(
        mockUser as any,
        createPaymentDto as any,
        '192.168.1.1',
      );

      expect(result.amount).toBe(2750000);
      expect(result.gatewayResponse.original_currency).toBe('USD');
      expect(result.gatewayResponse.original_amount).toBe(100);
    });
  });

  describe('🔒 Security and Validation', () => {
    it('should validate user ownership of order', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: { id: 2 }, // Different user
        total_amount: 275000,
        status: 'confirmed',
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 275000,
        payment_method: PaymentMethod.CARD,
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      await expect(
        service.createPayment(
          mockUser as any,
          createPaymentDto as any,
          '192.168.1.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate payment method availability', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: mockUser,
        total_amount: 275000,
        status: 'confirmed',
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 275000,
        payment_method: 'invalid_method',
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      await expect(
        service.createPayment(
          mockUser as any,
          createPaymentDto as any,
          '192.168.1.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent duplicate payments for same order', async () => {
      const mockUser = { id: 1, email: 'customer@souqsyria.com' };
      const mockOrder = {
        id: 1,
        user: mockUser,
        total_amount: 275000,
        status: 'confirmed',
      };

      const existingPayment = {
        id: 1,
        order: { id: 1 },
        status: PaymentStatus.PAID,
      };

      const createPaymentDto = {
        order_id: 1,
        amount: 275000,
        payment_method: PaymentMethod.CARD,
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      paymentRepository.findOne.mockResolvedValue(existingPayment as any);

      await expect(
        service.createPayment(
          mockUser as any,
          createPaymentDto as any,
          '192.168.1.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
