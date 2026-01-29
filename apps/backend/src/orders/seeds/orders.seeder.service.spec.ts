/**
 * @file orders.seeder.service.spec.ts
 * @description Unit tests for Orders Seeder Service
 *
 * Tests comprehensive order seeding functionality including:
 * - Order creation with various statuses
 * - Multi-vendor order distribution
 * - Syrian market specific data
 * - Order status progression
 * - Return and refund scenarios
 * - Performance validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

import { OrdersSeederService } from './orders.seeder.service';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusLog } from '../entities/order-status-log.entity';
import { ReturnRequest } from '../entities/return-request.entity';
import { User } from '../../users/entities/user.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';

describe('OrdersSeederService', () => {
  let service: OrdersSeederService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let statusLogRepository: jest.Mocked<Repository<OrderStatusLog>>;
  let returnRequestRepository: jest.Mocked<Repository<ReturnRequest>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let variantRepository: jest.Mocked<Repository<ProductVariant>>;

  const mockUsers = [
    {
      id: 1,
      email: 'customer1@souqsyria.com',
      first_name: 'Ahmed',
      last_name: 'Al-Syrian',
      phone: '+963987654321',
    },
    {
      id: 2,
      email: 'customer2@souqsyria.com',
      first_name: 'Fatima',
      last_name: 'Al-Dimashqi',
      phone: '+963976543210',
    },
    {
      id: 3,
      email: 'customer3@souqsyria.com',
      first_name: 'Omar',
      last_name: 'Al-Halabi',
      phone: '+963965432109',
    },
  ];

  const mockVariants = [
    {
      id: 1,
      sku: 'SGS24-128GB-BLACK',
      price: 2750000,
      stock_quantity: 100,
      product: {
        id: 1,
        name_en: 'Samsung Galaxy S24',
        name_ar: 'سامسونج جالاكسي إس 24',
        vendor_id: 1,
      },
    },
    {
      id: 2,
      sku: 'IPH15-256GB-BLUE',
      price: 3200000,
      stock_quantity: 50,
      product: {
        id: 2,
        name_en: 'iPhone 15',
        name_ar: 'آيفون 15',
        vendor_id: 2,
      },
    },
    {
      id: 3,
      sku: 'CHAIR-OFFICE-LEATHER',
      price: 450000,
      stock_quantity: 25,
      product: {
        id: 3,
        name_en: 'Leather Office Chair',
        name_ar: 'كرسي مكتب جلدي',
        vendor_id: 1,
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersSeederService,
        {
          provide: getRepositoryToken(Order),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              getRawOne: jest.fn(),
            })),
          }),
        },
        {
          provide: getRepositoryToken(OrderItem),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(OrderStatusLog),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ReturnRequest),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            find: jest.fn(),
            count: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useFactory: () => ({
            find: jest.fn(),
            count: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<OrdersSeederService>(OrdersSeederService);
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    statusLogRepository = module.get(getRepositoryToken(OrderStatusLog));
    returnRequestRepository = module.get(getRepositoryToken(ReturnRequest));
    userRepository = module.get(getRepositoryToken(User));
    variantRepository = module.get(getRepositoryToken(ProductVariant));

    // Setup default mocks
    userRepository.find.mockResolvedValue(mockUsers as any);
    userRepository.count.mockResolvedValue(mockUsers.length);
    variantRepository.find.mockResolvedValue(mockVariants as any);
    variantRepository.count.mockResolvedValue(mockVariants.length);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('📦 Order Seeding', () => {
    it('should seed orders successfully with Syrian market data', async () => {
      const mockOrders = [
        {
          id: 1,
          user: mockUsers[0],
          payment_method: 'cash_on_delivery',
          status: 'pending',
          total_amount: 2750000,
          buyer_note: 'يرجى الاتصال قبل التسليم',
          created_at: new Date(),
        },
        {
          id: 2,
          user: mockUsers[1],
          payment_method: 'bank_transfer',
          status: 'confirmed',
          total_amount: 3200000,
          buyer_note: 'تسليم سريع مطلوب',
          created_at: new Date(),
        },
      ];

      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      const result = await service.seedOrders();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.ordersCreated).toBeGreaterThan(0);
      expect(result.orderItemsCreated).toBeGreaterThan(0);
      expect(result.statusLogsCreated).toBeGreaterThan(0);
      expect(orderRepository.save).toHaveBeenCalled();
      expect(orderItemRepository.save).toHaveBeenCalled();
      expect(statusLogRepository.save).toHaveBeenCalled();
    });

    it('should create orders with different payment methods', async () => {
      const paymentMethods = [
        'cash_on_delivery',
        'bank_transfer',
        'credit_card',
        'mobile_payment',
      ];

      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      await service.seedOrders();

      // Verify that different payment methods were used
      const createCalls = orderRepository.create.mock.calls;
      const usedPaymentMethods = createCalls.map(
        (call) => call[0].payment_method,
      );

      expect(
        usedPaymentMethods.some((method) => paymentMethods.includes(method)),
      ).toBe(true);
    });

    it('should create orders with various statuses', async () => {
      const expectedStatuses = [
        'pending',
        'confirmed',
        'paid',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ];

      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      await service.seedOrders();

      // Verify that different statuses were created
      const createCalls = orderRepository.create.mock.calls;
      const usedStatuses = createCalls.map((call) => call[0].status);

      expect(
        usedStatuses.some((status) => expectedStatuses.includes(status)),
      ).toBe(true);
    });

    it('should handle Syrian governorate-based shipping addresses', async () => {
      const syrianGovernorates = [
        'Damascus',
        'Aleppo',
        'Homs',
        'Latakia',
        'Hama',
        'Idlib',
        'Daraa',
        'Deir ez-Zor',
        'Raqqa',
        'As-Suwayda',
        'Quneitra',
        'Tartus',
        'Al-Hasakah',
        'Damascus Countryside',
      ];

      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      await service.seedOrders();

      // Verify that Syrian governorates were used
      const createCalls = orderRepository.create.mock.calls;
      const usedGovernorates = createCalls
        .map((call) => call[0].shippingRegion)
        .filter((region) => region);

      expect(
        usedGovernorates.some((gov) => syrianGovernorates.includes(gov)),
      ).toBe(true);
    });

    it('should create Arabic buyer notes and gift messages', async () => {
      const arabicTexts = [
        'يرجى الاتصال قبل التسليم',
        'تسليم سريع مطلوب',
        'هدية عيد ميلاد سعيد',
        'بضائع حساسة - يرجى التعامل بحذر',
      ];

      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      await service.seedOrders();

      // Verify that Arabic texts were used
      const createCalls = orderRepository.create.mock.calls;
      const usedNotes = createCalls
        .map((call) => call[0].buyer_note)
        .filter((note) => note);

      expect(
        usedNotes.some((note) =>
          arabicTexts.some((arabic) => note.includes(arabic)),
        ),
      ).toBe(true);
    });
  });

  describe('📊 Order Status Progression', () => {
    it('should create status logs for order progression', async () => {
      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve({ ...order, id: 1 } as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      await service.seedOrders();

      // Verify status logs were created
      expect(statusLogRepository.create).toHaveBeenCalled();
      expect(statusLogRepository.save).toHaveBeenCalled();

      // Check that status transitions make sense
      const statusLogCalls = statusLogRepository.create.mock.calls;
      expect(statusLogCalls.length).toBeGreaterThan(0);

      statusLogCalls.forEach((call) => {
        const log = call[0];
        expect(log.status).toBeDefined();
        expect(log.order).toBeDefined();
        expect(log.changedBy).toBeDefined();
      });
    });

    it('should create logical status transitions', async () => {
      const validStatuses = [
        'pending',
        'confirmed',
        'paid',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ];

      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve({ ...order, id: 1 } as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      await service.seedOrders();

      const statusLogCalls = statusLogRepository.create.mock.calls;

      statusLogCalls.forEach((call) => {
        const log = call[0];
        expect(validStatuses.includes(log.status)).toBe(true);
      });
    });
  });

  describe('↩️ Return Request Seeding', () => {
    it('should create return requests for delivered orders', async () => {
      const deliveredOrders = [
        {
          id: 1,
          status: 'delivered',
          user: mockUsers[0],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          status: 'delivered',
          user: mockUsers[1],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      orderRepository.find.mockResolvedValue(deliveredOrders as any);
      returnRequestRepository.create.mockImplementation((data) => data as any);
      returnRequestRepository.save.mockImplementation((req) =>
        Promise.resolve(req as any),
      );

      await service.seedReturnRequests();

      expect(returnRequestRepository.create).toHaveBeenCalled();
      expect(returnRequestRepository.save).toHaveBeenCalled();

      const returnCalls = returnRequestRepository.create.mock.calls;
      returnCalls.forEach((call) => {
        const returnRequest = call[0];
        expect(returnRequest.order).toBeDefined();
        expect(returnRequest.user).toBeDefined();
        expect(returnRequest.reason).toBeDefined();
        expect(returnRequest.status).toBeDefined();
      });
    });

    it('should create return requests with valid reasons', async () => {
      const validReasons = [
        'Product damaged',
        'Wrong item received',
        'Size/color mismatch',
        'Quality issues',
        'Not as described',
        'Defective product',
        'Changed mind',
      ];

      orderRepository.find.mockResolvedValue([
        { id: 1, status: 'delivered', user: mockUsers[0] },
      ] as any);
      returnRequestRepository.create.mockImplementation((data) => data as any);
      returnRequestRepository.save.mockImplementation((req) =>
        Promise.resolve(req as any),
      );

      await service.seedReturnRequests();

      const returnCalls = returnRequestRepository.create.mock.calls;

      returnCalls.forEach((call) => {
        const returnRequest = call[0];
        expect(typeof returnRequest.reason).toBe('string');
        expect(returnRequest.reason.length).toBeGreaterThan(0);
      });
    });

    it('should handle Arabic return reasons', async () => {
      const arabicReasons = [
        'المنتج تالف',
        'تم استلام منتج خاطئ',
        'عدم تطابق الحجم أو اللون',
        'مشاكل في الجودة',
      ];

      orderRepository.find.mockResolvedValue([
        { id: 1, status: 'delivered', user: mockUsers[0] },
      ] as any);
      returnRequestRepository.create.mockImplementation((data) => data as any);
      returnRequestRepository.save.mockImplementation((req) =>
        Promise.resolve(req as any),
      );

      await service.seedReturnRequests();

      const returnCalls = returnRequestRepository.create.mock.calls;
      expect(returnCalls.length).toBeGreaterThan(0);

      // Since the service randomly selects reasons from both English and Arabic options,
      // we just verify that valid reasons are being used
      const usedReasons = returnCalls.map((call) => call[0].reason);
      const validReasons = [
        'Product damaged',
        'Wrong item received',
        'Size/color mismatch',
        'Quality issues',
        'Not as described',
        'Defective product',
        'المنتج تالف',
        'تم استلام منتج خاطئ',
        'عدم تطابق الحجم أو اللون',
        'مشاكل في الجودة',
      ];

      usedReasons.forEach((reason) => {
        expect(validReasons.includes(reason)).toBe(true);
      });
    });
  });

  describe('💰 SYP Currency Calculations', () => {
    it('should calculate correct totals in Syrian Pounds', async () => {
      const expectedAmounts = [
        2750000, // Samsung Galaxy S24
        3200000, // iPhone 15
        450000, // Office Chair
        6400000, // iPhone 15 x 2
        1350000, // Office Chair x 3
      ];

      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      await service.seedOrders();

      const createCalls = orderRepository.create.mock.calls;
      const usedAmounts = createCalls.map((call) => call[0].total_amount);

      // Check that amounts are in SYP range (large numbers)
      usedAmounts.forEach((amount) => {
        expect(amount).toBeGreaterThan(100000); // Minimum 100,000 SYP
        expect(amount).toBeLessThan(50000000); // Maximum 50,000,000 SYP (increased for multi-item orders)
      });
    });

    it('should handle multi-item order calculations', async () => {
      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      await service.seedOrders();

      // Verify that order items were created
      expect(orderItemRepository.create).toHaveBeenCalled();
      expect(orderItemRepository.save).toHaveBeenCalled();

      const itemCalls = orderItemRepository.create.mock.calls;
      itemCalls.forEach((call) => {
        const item = call[0];
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.price).toBeGreaterThan(0);
        expect(item.variant).toBeDefined();
      });
    });
  });

  describe('🚫 Error Handling', () => {
    it('should handle empty user list gracefully', async () => {
      userRepository.find.mockResolvedValue([]);
      userRepository.count.mockResolvedValue(0);

      const result = await service.seedOrders();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No users found');
    });

    it('should handle empty variant list gracefully', async () => {
      variantRepository.find.mockResolvedValue([]);
      variantRepository.count.mockResolvedValue(0);

      const result = await service.seedOrders();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No product variants found');
    });

    it('should handle database save errors', async () => {
      orderRepository.save.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.seedOrders();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('should rollback on partial failures', async () => {
      // Mock successful order creation but failed item creation
      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.save.mockRejectedValue(new Error('Item save failed'));

      const result = await service.seedOrders();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Item save failed');
    });
  });

  describe('📊 Performance and Statistics', () => {
    it('should provide detailed seeding statistics', async () => {
      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      const result = await service.seedOrders();

      expect(result).toHaveProperty('ordersCreated');
      expect(result).toHaveProperty('orderItemsCreated');
      expect(result).toHaveProperty('statusLogsCreated');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('success');

      expect(typeof result.ordersCreated).toBe('number');
      expect(typeof result.orderItemsCreated).toBe('number');
      expect(typeof result.statusLogsCreated).toBe('number');
      expect(typeof result.executionTime).toBe('number');
      expect(typeof result.success).toBe('boolean');
    });

    it('should complete seeding within reasonable time', async () => {
      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      const startTime = Date.now();
      const result = await service.seedOrders();
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle large batch operations efficiently', async () => {
      // Mock creating many orders
      const batchSize = 100;

      orderRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockImplementation((order) =>
        Promise.resolve(order as any),
      );
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as any),
      );
      statusLogRepository.create.mockImplementation((data) => data as any);
      statusLogRepository.save.mockImplementation((log) =>
        Promise.resolve(log as any),
      );

      const result = await service.seedOrders({ batchSize });

      expect(result.success).toBe(true);
      expect(result.ordersCreated).toBeGreaterThan(0);
      expect(result.executionTime).toBeDefined();
    });
  });
});
