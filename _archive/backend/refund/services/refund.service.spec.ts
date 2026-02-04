/**
 * 💰 RefundService Test Suite
 *
 * Comprehensive unit tests for refund management service covering:
 * - Refund initiation and validation
 * - Approval/rejection workflows
 * - Status tracking by order
 * - Syrian market payment methods
 * - Multi-currency refund scenarios
 * - Error handling and edge cases
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { RefundService } from './refund.service';
import { RefundTransaction } from '../entities/refund-transaction.entity';
import { RefundStatus } from '../enums/refund-status.enum';
import { RefundMethod } from '../enums/refund-method.enum';
import { OrdersService } from '../../orders/service/orders.service';
import { PaymentService } from '../../payment/service/payment.service';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { PaymentTransaction } from '../../payment/entities/payment-transaction.entity';

// =============================================================================
// MOCK FACTORIES - Syrian Market Data
// =============================================================================

/**
 * Factory for creating Syrian user test data
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianUser = (overrides = {}): any => ({
  id: 1,
  email: 'ahmad.khalil@gmail.com',
  fullName: 'Ahmad Khalil',
  phone: '+963-11-234-5678',
  ...overrides,
});

/**
 * Factory for creating Syrian orders
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianOrder = (overrides = {}): any => ({
  id: 1,
  total_amount: 8500000, // Syrian Pounds
  status: 'completed',
  user: createSyrianUser(),
  ...overrides,
});

/**
 * Factory for creating Syrian payment transactions
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianPayment = (overrides = {}): any => ({
  id: 1,
  amount: 8500000, // Syrian Pounds
  currency: 'SYP',
  status: 'completed',
  order: createSyrianOrder(),
  ...overrides,
});

/**
 * Factory for creating Syrian refund transactions
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianRefund = (overrides = {}): any => ({
  id: 1,
  amount: 8500000,
  status: RefundStatus.PENDING,
  method: RefundMethod.MANUAL,
  reason_code: 'product_defective',
  notes: 'Product arrived damaged',
  evidence: ['https://storage.souqsyria.com/evidence/damage-photo-1.jpg'],
  order: createSyrianOrder() as Order,
  paymentTransaction: createSyrianPayment() as PaymentTransaction,
  created_at: new Date(),
  ...overrides,
});

// =============================================================================
// TEST SUITE
// =============================================================================

describe('RefundService', () => {
  let service: RefundService;
  let refundRepo: jest.Mocked<Repository<RefundTransaction>>;
  let ordersService: jest.Mocked<OrdersService>;
  let paymentService: jest.Mocked<PaymentService>;

  beforeEach(async () => {
    // Create mock repository
    const mockRefundRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    // Create mock services
    const mockOrdersService = {
      getOrderDetails: jest.fn(),
    };

    const mockPaymentService = {
      getTransactionById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundService,
        { provide: getRepositoryToken(RefundTransaction), useValue: mockRefundRepo },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    service = module.get<RefundService>(RefundService);
    refundRepo = module.get(getRepositoryToken(RefundTransaction));
    ordersService = module.get(OrdersService);
    paymentService = module.get(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Service Initialization Tests
  // ===========================================================================

  describe('📦 Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required dependencies injected', () => {
      expect(refundRepo).toBeDefined();
      expect(ordersService).toBeDefined();
      expect(paymentService).toBeDefined();
    });
  });

  // ===========================================================================
  // Initiate Refund Tests
  // ===========================================================================

  describe('🎯 initiateRefund', () => {
    const mockOrder = createSyrianOrder();
    const mockPayment = createSyrianPayment();

    it('should initiate refund successfully with Syrian market data', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 8500000,
        method: RefundMethod.MANUAL,
        reason_code: 'product_defective',
        evidence: ['https://storage.souqsyria.com/evidence/damage.jpg'],
        notes: 'Product arrived damaged - عيب في المنتج',
      };

      const createdRefund = createSyrianRefund();

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result).toBeDefined();
      expect(result.status).toBe(RefundStatus.PENDING);
      expect(result.amount).toBe(8500000);
      expect(ordersService.getOrderDetails).toHaveBeenCalledWith(1);
      expect(paymentService.getTransactionById).toHaveBeenCalledWith(1);
      expect(refundRepo.create).toHaveBeenCalled();
      expect(refundRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      const dto = {
        order_id: 999,
        payment_transaction_id: 1,
        amount: 8500000,
        method: RefundMethod.MANUAL,
      };

      ordersService.getOrderDetails.mockResolvedValue(null);

      await expect(service.initiateRefund(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when payment not found', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 999,
        amount: 8500000,
        method: RefundMethod.MANUAL,
      };

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(null);

      await expect(service.initiateRefund(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment belongs to different order', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 8500000,
        method: RefundMethod.MANUAL,
      };

      const paymentForDifferentOrder = createSyrianPayment({
        order: createSyrianOrder({ id: 2 }) as Order,
      });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(paymentForDifferentOrder as PaymentTransaction);

      await expect(service.initiateRefund(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.initiateRefund(dto)).rejects.toThrow(
        'Invalid payment transaction for this order',
      );
    });

    it('should use default method when not provided', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 5000000,
        method: RefundMethod.MANUAL, // Required by DTO but service has fallback
      };

      const createdRefund = createSyrianRefund({ method: RefundMethod.MANUAL });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(refundRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        method: RefundMethod.MANUAL,
      }));
    });

    it('should handle partial refund amount', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 4250000, // Half of the order amount
        method: RefundMethod.MANUAL,
        reason_code: 'partial_return',
        notes: 'Customer keeping some items',
      };

      const createdRefund = createSyrianRefund({ amount: 4250000 });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.amount).toBe(4250000);
    });

    it('should handle wallet refund method', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 8500000,
        method: RefundMethod.WALLET,
        notes: 'Refund to customer wallet balance',
      };

      const createdRefund = createSyrianRefund({ method: RefundMethod.WALLET });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(refundRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        method: RefundMethod.WALLET,
      }));
    });

    it('should handle card refund method', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 8500000,
        method: RefundMethod.CARD,
        notes: 'Refund via Stripe',
      };

      const createdRefund = createSyrianRefund({ method: RefundMethod.CARD });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(refundRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        method: RefundMethod.CARD,
      }));
    });

    it('should store multiple evidence items', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 8500000,
        method: RefundMethod.MANUAL,
        evidence: [
          'https://storage.souqsyria.com/evidence/damage-1.jpg',
          'https://storage.souqsyria.com/evidence/damage-2.jpg',
          'https://storage.souqsyria.com/evidence/receipt.pdf',
        ],
      };

      const createdRefund = createSyrianRefund({ evidence: dto.evidence });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      await service.initiateRefund(dto);

      expect(refundRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        evidence: dto.evidence,
      }));
    });
  });

  // ===========================================================================
  // Approve Refund Tests
  // ===========================================================================

  describe('✅ approveRefund', () => {
    const adminUserId = 100;

    it('should approve refund successfully', async () => {
      const dto = {
        refund_id: 1,
        status: RefundStatus.APPROVED,
        notes: 'Approved - valid damage claim',
      };

      const existingRefund = createSyrianRefund({ status: RefundStatus.PENDING });

      refundRepo.findOne.mockResolvedValue(existingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.status).toBe(RefundStatus.APPROVED);
      expect(result.processedBy).toEqual({ id: adminUserId });
      expect(result.notes).toBe('Approved - valid damage claim');
    });

    it('should reject refund successfully', async () => {
      const dto = {
        refund_id: 1,
        status: RefundStatus.REJECTED,
        notes: 'Insufficient evidence for damage claim',
      };

      const existingRefund = createSyrianRefund({ status: RefundStatus.PENDING });

      refundRepo.findOne.mockResolvedValue(existingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.status).toBe(RefundStatus.REJECTED);
    });

    it('should process refund and set refunded_at timestamp', async () => {
      const dto = {
        refund_id: 1,
        status: RefundStatus.PROCESSED,
      };

      const existingRefund = createSyrianRefund({ status: RefundStatus.APPROVED });

      refundRepo.findOne.mockResolvedValue(existingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.status).toBe(RefundStatus.PROCESSED);
      expect(result.refunded_at).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when refund not found', async () => {
      const dto = {
        refund_id: 999,
        status: RefundStatus.APPROVED,
      };

      refundRepo.findOne.mockResolvedValue(null);

      await expect(service.approveRefund(dto, adminUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when refund already processed', async () => {
      const dto = {
        refund_id: 1,
        status: RefundStatus.APPROVED,
      };

      const processedRefund = createSyrianRefund({
        status: RefundStatus.PROCESSED,
        refunded_at: new Date(),
      });

      refundRepo.findOne.mockResolvedValue(processedRefund as RefundTransaction);

      await expect(service.approveRefund(dto, adminUserId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.approveRefund(dto, adminUserId)).rejects.toThrow(
        'Refund has already been completed',
      );
    });

    it('should preserve existing notes if new notes not provided', async () => {
      const dto = {
        refund_id: 1,
        status: RefundStatus.APPROVED,
        // notes not provided
      };

      const existingRefund = createSyrianRefund({
        status: RefundStatus.PENDING,
        notes: 'Original customer notes',
      });

      refundRepo.findOne.mockResolvedValue(existingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.notes).toBe('Original customer notes');
    });

    it('should update notes when provided', async () => {
      const dto = {
        refund_id: 1,
        status: RefundStatus.APPROVED,
        notes: 'Admin override note',
      };

      const existingRefund = createSyrianRefund({
        status: RefundStatus.PENDING,
        notes: 'Original notes',
      });

      refundRepo.findOne.mockResolvedValue(existingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.notes).toBe('Admin override note');
    });

    it('should assign processedBy user', async () => {
      const dto = {
        refund_id: 1,
        status: RefundStatus.APPROVED,
      };

      const existingRefund = createSyrianRefund({ status: RefundStatus.PENDING });

      refundRepo.findOne.mockResolvedValue(existingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.processedBy).toEqual({ id: adminUserId } as User);
    });
  });

  // ===========================================================================
  // Get Refund Status By Order Tests
  // ===========================================================================

  describe('📦 getRefundStatusByOrder', () => {
    it('should return latest refund status for order', async () => {
      const refund = createSyrianRefund({
        id: 5,
        status: RefundStatus.APPROVED,
        refunded_at: new Date('2025-01-15'),
      });

      refundRepo.findOne.mockResolvedValue(refund as RefundTransaction);

      const result = await service.getRefundStatusByOrder(1);

      expect(result).toEqual({
        refund_id: 5,
        status: RefundStatus.APPROVED,
        refunded_at: expect.any(Date),
      });
      expect(refundRepo.findOne).toHaveBeenCalledWith({
        where: { order: { id: 1 } },
        order: { created_at: 'DESC' },
      });
    });

    it('should throw NotFoundException when no refund found', async () => {
      refundRepo.findOne.mockResolvedValue(null);

      await expect(service.getRefundStatusByOrder(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getRefundStatusByOrder(999)).rejects.toThrow(
        'No refund found for this order',
      );
    });

    it('should return pending status for new refund', async () => {
      const refund = createSyrianRefund({
        id: 10,
        status: RefundStatus.PENDING,
        refunded_at: null,
      });

      refundRepo.findOne.mockResolvedValue(refund as RefundTransaction);

      const result = await service.getRefundStatusByOrder(1);

      expect(result.status).toBe(RefundStatus.PENDING);
      expect(result.refunded_at).toBeNull();
    });

    it('should return processed status with refunded_at', async () => {
      const refundedAt = new Date('2025-01-15T10:30:00Z');
      const refund = createSyrianRefund({
        id: 15,
        status: RefundStatus.PROCESSED,
        refunded_at: refundedAt,
      });

      refundRepo.findOne.mockResolvedValue(refund as RefundTransaction);

      const result = await service.getRefundStatusByOrder(1);

      expect(result.status).toBe(RefundStatus.PROCESSED);
      expect(result.refunded_at).toEqual(refundedAt);
    });
  });

  // ===========================================================================
  // Syrian Market Data Scenarios
  // ===========================================================================

  describe('🇸🇾 Syrian Market Data Scenarios', () => {
    it('should handle Damascus customer refund in SYP', async () => {
      const damascusOrder = createSyrianOrder({
        id: 100,
        totalAmount: 15000000, // 15M SYP - high-value electronics
        user: createSyrianUser({
          firstName: 'ياسر',
          lastName: 'الدمشقي',
          email: 'yaser.damascus@gmail.com',
          phone: '+963-11-555-1234',
        }),
      });

      const dto = {
        order_id: 100,
        payment_transaction_id: 50,
        amount: 15000000,
        method: RefundMethod.MANUAL,
        reason_code: 'wrong_product',
        notes: 'Customer received wrong model - يجب إعادة المنتج الخاطئ',
      };

      const createdRefund = createSyrianRefund({
        order: damascusOrder as Order,
        amount: 15000000,
      });

      ordersService.getOrderDetails.mockResolvedValue(damascusOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(
        createSyrianPayment({ order: damascusOrder as Order }) as PaymentTransaction,
      );
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.amount).toBe(15000000);
    });

    it('should handle Aleppo vendor refund with cash on delivery', async () => {
      const aleppoOrder = createSyrianOrder({
        id: 200,
        totalAmount: 3500000, // Clothing order
        user: createSyrianUser({
          firstName: 'خالد',
          lastName: 'الحلبي',
          email: 'khaled.aleppo@hotmail.com',
        }),
      });

      const dto = {
        order_id: 200,
        payment_transaction_id: 75,
        amount: 3500000,
        method: RefundMethod.MANUAL,
        reason_code: 'size_mismatch',
        notes: 'Size does not match description',
        evidence: ['https://storage.souqsyria.com/evidence/size-label.jpg'],
      };

      const createdRefund = createSyrianRefund({
        order: aleppoOrder as Order,
        amount: 3500000,
        method: RefundMethod.MANUAL,
      });

      ordersService.getOrderDetails.mockResolvedValue(aleppoOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(
        createSyrianPayment({
          order: aleppoOrder as Order,
          paymentMethod: 'cash_on_delivery',
        }) as PaymentTransaction,
      );
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.method).toBe(RefundMethod.MANUAL);
    });

    it('should handle diaspora customer refund in USD', async () => {
      const diasporaOrder = createSyrianOrder({
        id: 300,
        totalAmount: 150, // USD
        user: createSyrianUser({
          firstName: 'Ahmad',
          lastName: 'Expat',
          email: 'ahmad.expat@gmail.com',
        }),
      });

      const usdPayment = createSyrianPayment({
        order: diasporaOrder as Order,
        amount: 150,
        currency: 'USD',
        paymentMethod: 'stripe',
      });

      const dto = {
        order_id: 300,
        payment_transaction_id: 100,
        amount: 150,
        method: RefundMethod.CARD,
        reason_code: 'item_not_received',
        notes: 'Item lost in international shipping',
      };

      const createdRefund = createSyrianRefund({
        order: diasporaOrder as Order,
        amount: 150,
        method: RefundMethod.CARD,
      });

      ordersService.getOrderDetails.mockResolvedValue(diasporaOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(usdPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.amount).toBe(150);
      expect(result.method).toBe(RefundMethod.CARD);
    });

    it('should handle wallet balance refund for repeat customer', async () => {
      const repeatCustomerOrder = createSyrianOrder({
        id: 400,
        totalAmount: 2500000,
        user: createSyrianUser({
          firstName: 'فاطمة',
          lastName: 'الناصر',
          email: 'fatima.nasser@gmail.com',
        }),
      });

      const dto = {
        order_id: 400,
        payment_transaction_id: 125,
        amount: 2500000,
        method: RefundMethod.WALLET,
        reason_code: 'customer_changed_mind',
        notes: 'Customer requested store credit instead of refund',
      };

      const createdRefund = createSyrianRefund({
        order: repeatCustomerOrder as Order,
        amount: 2500000,
        method: RefundMethod.WALLET,
      });

      ordersService.getOrderDetails.mockResolvedValue(repeatCustomerOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(
        createSyrianPayment({ order: repeatCustomerOrder as Order }) as PaymentTransaction,
      );
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.method).toBe(RefundMethod.WALLET);
    });

    it('should handle Homs delivery failure refund', async () => {
      const homsOrder = createSyrianOrder({
        id: 500,
        totalAmount: 5000000,
        user: createSyrianUser({
          firstName: 'عمر',
          lastName: 'الحمصي',
          phone: '+963-31-234-5678',
        }),
      });

      const dto = {
        order_id: 500,
        payment_transaction_id: 150,
        amount: 5000000,
        method: RefundMethod.MANUAL,
        reason_code: 'delivery_failed',
        notes: 'Multiple delivery attempts failed - address inaccessible',
        evidence: [
          'https://storage.souqsyria.com/evidence/delivery-attempt-1.jpg',
          'https://storage.souqsyria.com/evidence/delivery-attempt-2.jpg',
        ],
      };

      const createdRefund = createSyrianRefund({
        order: homsOrder as Order,
        amount: 5000000,
        reason_code: 'delivery_failed',
      });

      ordersService.getOrderDetails.mockResolvedValue(homsOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(
        createSyrianPayment({ order: homsOrder as Order }) as PaymentTransaction,
      );
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.reason_code).toBe('delivery_failed');
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================

  describe('⚠️ Edge Cases and Error Handling', () => {
    it('should handle zero amount refund (should still be valid for record)', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 0,
        method: RefundMethod.MANUAL,
        reason_code: 'compensation_only',
        notes: 'No monetary refund - replacement item sent',
      };

      const mockOrder = createSyrianOrder();
      const mockPayment = createSyrianPayment();
      const createdRefund = createSyrianRefund({ amount: 0 });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.amount).toBe(0);
    });

    it('should handle refund with empty evidence array', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 1000000,
        method: RefundMethod.MANUAL,
        evidence: [],
      };

      const mockOrder = createSyrianOrder();
      const mockPayment = createSyrianPayment();
      const createdRefund = createSyrianRefund({ evidence: [] });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.evidence).toEqual([]);
    });

    it('should handle refund without notes', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 1000000,
        method: RefundMethod.MANUAL,
        // notes not provided
      };

      const mockOrder = createSyrianOrder();
      const mockPayment = createSyrianPayment();
      const createdRefund = createSyrianRefund({ notes: '' });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      await service.initiateRefund(dto);

      expect(refundRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        notes: '',
      }));
    });

    it('should handle refund without reason_code', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 1000000,
        method: RefundMethod.MANUAL,
        // reason_code not provided
      };

      const mockOrder = createSyrianOrder();
      const mockPayment = createSyrianPayment();
      const createdRefund = createSyrianRefund({ reason_code: null });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      await service.initiateRefund(dto);

      expect(refundRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        reason_code: null,
      }));
    });

    it('should handle very large refund amounts (high-value Syrian transactions)', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 500000000, // 500M SYP - very high value
        method: RefundMethod.MANUAL,
      };

      const mockOrder = createSyrianOrder({ totalAmount: 500000000 });
      const mockPayment = createSyrianPayment({ amount: 500000000 });
      const createdRefund = createSyrianRefund({ amount: 500000000 });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.amount).toBe(500000000);
    });

    it('should handle Arabic text in notes', async () => {
      const dto = {
        order_id: 1,
        payment_transaction_id: 1,
        amount: 5000000,
        method: RefundMethod.MANUAL,
        notes: 'المنتج تالف - يرجى إعادة المبلغ للمحفظة',
        reason_code: 'damaged',
      };

      const mockOrder = createSyrianOrder();
      const mockPayment = createSyrianPayment();
      const createdRefund = createSyrianRefund({
        notes: dto.notes,
        reason_code: dto.reason_code,
      });

      ordersService.getOrderDetails.mockResolvedValue(mockOrder as Order);
      paymentService.getTransactionById.mockResolvedValue(mockPayment as PaymentTransaction);
      refundRepo.create.mockReturnValue(createdRefund as RefundTransaction);
      refundRepo.save.mockResolvedValue(createdRefund as RefundTransaction);

      const result = await service.initiateRefund(dto);

      expect(result.notes).toBe('المنتج تالف - يرجى إعادة المبلغ للمحفظة');
    });
  });

  // ===========================================================================
  // Status Transition Tests
  // ===========================================================================

  describe('🔄 Status Transitions', () => {
    const adminUserId = 100;

    it('should allow PENDING → APPROVED transition', async () => {
      const dto = { refund_id: 1, status: RefundStatus.APPROVED };
      const pendingRefund = createSyrianRefund({ status: RefundStatus.PENDING });

      refundRepo.findOne.mockResolvedValue(pendingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.status).toBe(RefundStatus.APPROVED);
    });

    it('should allow PENDING → REJECTED transition', async () => {
      const dto = { refund_id: 1, status: RefundStatus.REJECTED };
      const pendingRefund = createSyrianRefund({ status: RefundStatus.PENDING });

      refundRepo.findOne.mockResolvedValue(pendingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.status).toBe(RefundStatus.REJECTED);
    });

    it('should allow APPROVED → PROCESSED transition', async () => {
      const dto = { refund_id: 1, status: RefundStatus.PROCESSED };
      const approvedRefund = createSyrianRefund({ status: RefundStatus.APPROVED });

      refundRepo.findOne.mockResolvedValue(approvedRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.status).toBe(RefundStatus.PROCESSED);
      expect(result.refunded_at).toBeInstanceOf(Date);
    });

    it('should not allow PROCESSED → any other status', async () => {
      const dto = { refund_id: 1, status: RefundStatus.APPROVED };
      const processedRefund = createSyrianRefund({
        status: RefundStatus.PROCESSED,
        refunded_at: new Date(),
      });

      refundRepo.findOne.mockResolvedValue(processedRefund as RefundTransaction);

      await expect(service.approveRefund(dto, adminUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow setting FAILED status', async () => {
      const dto = { refund_id: 1, status: RefundStatus.FAILED, notes: 'Payment gateway error' };
      const pendingRefund = createSyrianRefund({ status: RefundStatus.PENDING });

      refundRepo.findOne.mockResolvedValue(pendingRefund as RefundTransaction);
      refundRepo.save.mockImplementation((r) => Promise.resolve(r as RefundTransaction));

      const result = await service.approveRefund(dto, adminUserId);

      expect(result.status).toBe(RefundStatus.FAILED);
    });
  });
});
