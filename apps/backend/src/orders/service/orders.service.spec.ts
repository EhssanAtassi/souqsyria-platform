/**
 * @file orders.service.spec.ts
 * @description Unit tests for OrdersService
 *
 * Tests comprehensive order management business logic including:
 * - Order creation and validation
 * - Status management and transitions
 * - Return and refund processing
 * - Syrian market specific features
 * - Multi-vendor order handling
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusLog } from '../entities/order-status-log.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { ReturnRequest } from '../entities/return-request.entity';
import { User } from '../../users/entities/user.entity';
import { StockService } from '../../stock/stock.service';
import { ShipmentsService } from '../../shipments/service/shipments.service';
import { RefundService } from '../../refund/services/refund.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let statusLogRepository: jest.Mocked<Repository<OrderStatusLog>>;
  let variantRepository: jest.Mocked<Repository<ProductVariant>>;
  let returnRequestRepository: jest.Mocked<Repository<ReturnRequest>>;
  let stockService: jest.Mocked<StockService>;
  let shipmentsService: jest.Mocked<ShipmentsService>;
  let refundService: jest.Mocked<RefundService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          }),
        },
        {
          provide: getRepositoryToken(OrderItem),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(OrderStatusLog),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useFactory: () => ({
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ReturnRequest),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: StockService,
          useFactory: () => ({
            getStock: jest.fn(),
          }),
        },
        {
          provide: ShipmentsService,
          useFactory: () => ({
            createShipment: jest.fn(),
          }),
        },
        {
          provide: RefundService,
          useFactory: () => ({
            initiateRefund: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    statusLogRepository = module.get(getRepositoryToken(OrderStatusLog));
    variantRepository = module.get(getRepositoryToken(ProductVariant));
    returnRequestRepository = module.get(getRepositoryToken(ReturnRequest));
    stockService = module.get(StockService);
    shipmentsService = module.get(ShipmentsService);
    refundService = module.get(RefundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('📦 Order Creation', () => {
    it('should create order successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const createOrderDto = {
        items: [{ variant_id: 1, quantity: 2, price: 50000 }],
        payment_method: 'cash_on_delivery',
        buyer_note: 'Test order',
      };

      const mockVariant = {
        id: 1,
        price: 50000,
        product: { id: 1, name_en: 'Test Product' },
      };

      const mockOrder = {
        id: 1,
        user: mockUser,
        payment_method: 'cash_on_delivery',
        status: 'pending',
        total_amount: 100000,
        items: [],
      };

      variantRepository.find.mockResolvedValue([mockVariant] as any);
      stockService.getStock.mockResolvedValue(10);
      orderRepository.create.mockReturnValue(mockOrder as any);
      orderRepository.save.mockResolvedValue(mockOrder as any);
      orderItemRepository.create.mockReturnValue({} as any);
      statusLogRepository.create.mockReturnValue({} as any);
      statusLogRepository.save.mockResolvedValue({} as any);
      shipmentsService.createShipment.mockResolvedValue({} as any);

      const result = await service.createOrder(
        mockUser as any,
        createOrderDto as any,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(orderRepository.save).toHaveBeenCalled();
      expect(statusLogRepository.save).toHaveBeenCalled();
      expect(shipmentsService.createShipment).toHaveBeenCalled();
    });

    it('should throw error for insufficient stock', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const createOrderDto = {
        items: [{ variant_id: 1, quantity: 10, price: 50000 }],
        payment_method: 'cash_on_delivery',
      };

      const mockVariant = { id: 1, price: 50000 };

      variantRepository.find.mockResolvedValue([mockVariant] as any);
      stockService.getStock.mockResolvedValue(5); // Insufficient stock

      await expect(
        service.createOrder(mockUser as any, createOrderDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for missing variants', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const createOrderDto = {
        items: [{ variant_id: 1, quantity: 1, price: 50000 }],
        payment_method: 'cash_on_delivery',
      };

      variantRepository.find.mockResolvedValue([]); // No variants found

      await expect(
        service.createOrder(mockUser as any, createOrderDto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('📋 Order Retrieval', () => {
    it('should get user orders', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockOrders = [
        {
          id: 1,
          status: 'pending',
          total_amount: 100000,
          user: mockUser,
        },
      ];

      orderRepository.find.mockResolvedValue(mockOrders as any);

      const result = await service.getMyOrders(mockUser as any);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(orderRepository.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
        relations: ['items', 'items.variant', 'status_logs'],
        order: { created_at: 'DESC' },
      });
    });

    it('should get order details', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending',
        total_amount: 100000,
        user: { id: 1 },
        items: [],
        status_logs: [],
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      const result = await service.getOrderDetails(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'user',
          'status_logs',
        ],
      });
    });

    it('should throw error for non-existent order', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrderDetails(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('🔄 Order Status Updates', () => {
    it('should update order status', async () => {
      const mockUser = { id: 1, email: 'admin@example.com' };
      const mockOrder = {
        id: 1,
        status: 'pending',
        items: [],
      };

      const updateDto = {
        order_id: 1,
        new_status: 'confirmed',
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: 'confirmed',
      } as any);
      statusLogRepository.create.mockReturnValue({} as any);
      statusLogRepository.save.mockResolvedValue({} as any);

      await service.updateOrderStatus(mockUser as any, updateDto as any);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'confirmed' }),
      );
      expect(statusLogRepository.save).toHaveBeenCalled();
    });

    it('should throw error for non-existent order', async () => {
      const mockUser = { id: 1, email: 'admin@example.com' };
      const updateDto = {
        order_id: 999,
        new_status: 'confirmed',
      };

      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(mockUser as any, updateDto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('↩️ Return Processing', () => {
    it('should process return request', async () => {
      const mockUser = { id: 1, email: 'customer@example.com' };
      const mockOrder = {
        id: 1,
        status: 'delivered',
        user: { id: 1 },
        updated_at: new Date(),
      };

      const returnDto = {
        order_id: 1,
        reason: 'Product damaged',
        evidence_images: ['image1.jpg'],
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      returnRequestRepository.create.mockReturnValue({
        id: 1,
        status: 'pending',
      } as any);
      returnRequestRepository.save.mockResolvedValue({} as any);

      const result = await service.requestReturn(
        mockUser as any,
        returnDto as any,
      );

      expect(result).toContain('Return request submitted');
      expect(returnRequestRepository.save).toHaveBeenCalled();
    });

    it('should throw error for unauthorized return', async () => {
      const mockUser = { id: 1, email: 'customer@example.com' };
      const mockOrder = {
        id: 1,
        status: 'delivered',
        user: { id: 2 }, // Different user
        updated_at: new Date(),
      };

      const returnDto = {
        order_id: 1,
        reason: 'Product damaged',
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      await expect(
        service.requestReturn(mockUser as any, returnDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error for expired return window', async () => {
      const mockUser = { id: 1, email: 'customer@example.com' };
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      const mockOrder = {
        id: 1,
        status: 'delivered',
        user: { id: 1 },
        updated_at: oldDate,
      };

      const returnDto = {
        order_id: 1,
        reason: 'Product damaged',
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      await expect(
        service.requestReturn(mockUser as any, returnDto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('💰 Refund Processing', () => {
    it('should process refund request', async () => {
      const mockAdmin = { id: 1, email: 'admin@example.com' };
      const refundDto = {
        order_id: 1,
        amount: 50000,
        reason: 'Partial return',
        reason_code: 'PARTIAL_RETURN',
      };

      const mockRefund = {
        id: 1,
        amount: 50000,
        status: 'pending',
      };

      refundService.initiateRefund.mockResolvedValue(mockRefund as any);

      const result = await service.requestRefund(
        mockAdmin as any,
        refundDto as any,
      );

      expect(result).toContain('Refund recorded and processed');
      expect(refundService.initiateRefund).toHaveBeenCalledWith({
        ...refundDto,
        notes: 'PARTIAL_RETURN',
      });
    });
  });

  describe('🏪 Vendor Orders', () => {
    it('should get vendor orders', async () => {
      const mockOrders = [
        {
          id: 1,
          status: 'pending',
          items: [{ variant: { product: { vendor_id: 1 } } }],
        },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getVendorOrders(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'product.vendor_id = :vendorId',
        { vendorId: 1 },
      );
    });
  });

  describe('📊 Admin Order Management', () => {
    it('should get all orders with filters', async () => {
      const mockOrders = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'confirmed' },
      ];

      const filterDto = {
        status: 'pending',
        user_id: 1,
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getAllOrders(filterDto as any);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.status = :status',
        { status: 'pending' },
      );
    });
  });

  describe('✅ Order Payment', () => {
    it('should mark order as paid', async () => {
      const mockOrder = {
        id: 1,
        status: 'confirmed',
        items: [],
        user: { id: 1 },
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: 'paid',
      } as any);
      statusLogRepository.save.mockResolvedValue({} as any);
      shipmentsService.createShipmentForOrder = jest.fn().mockResolvedValue({});

      await service.setOrderPaid(1);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'paid' }),
      );
      expect(statusLogRepository.save).toHaveBeenCalled();
    });

    it('should not update already paid order', async () => {
      const mockOrder = {
        id: 1,
        status: 'paid',
        items: [],
        user: { id: 1 },
      };

      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      await service.setOrderPaid(1);

      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent order', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.setOrderPaid(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
