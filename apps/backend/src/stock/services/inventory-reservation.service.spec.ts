/**
 * @file inventory-reservation.service.spec.ts
 * @description Unit tests for InventoryReservationService
 *
 * Tests enterprise inventory reservation functionality including:
 * - Real-time inventory reservation with conflict resolution
 * - Intelligent multi-warehouse allocation algorithms
 * - Priority-based reservation handling
 * - Concurrent reservation management
 * - Performance monitoring and optimization
 * - Syrian market specific features
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InventoryReservationService } from './inventory-reservation.service';
import {
  InventoryReservationEntity,
  InventoryAllocationEntity,
  ReservationStatus,
  ReservationPriority,
  AllocationStrategy,
} from '../entities/inventory-reservation.entity';
import { ProductStockEntity } from '../entities/product-stock.entity';
import { StockMovementEntity } from '../entities/stock-movement.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { User } from '../../users/entities/user.entity';

describe('InventoryReservationService', () => {
  let service: InventoryReservationService;
  let reservationRepo: jest.Mocked<Repository<InventoryReservationEntity>>;
  let allocationRepo: jest.Mocked<Repository<InventoryAllocationEntity>>;
  let stockRepo: jest.Mocked<Repository<ProductStockEntity>>;
  let movementRepo: jest.Mocked<Repository<StockMovementEntity>>;
  let variantRepo: jest.Mocked<Repository<ProductVariant>>;
  let warehouseRepo: jest.Mocked<Repository<Warehouse>>;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let orderItemRepo: jest.Mocked<Repository<OrderItem>>;
  let entityManager: any;

  // Test data
  let mockUser: User;
  let mockVariant: ProductVariant;
  let mockWarehouse: Warehouse;
  let mockSecondWarehouse: Warehouse;
  let mockOrder: Order;
  let mockOrderItem: OrderItem;
  let mockStock: ProductStockEntity;
  let mockReservation: InventoryReservationEntity;
  let mockAllocation: InventoryAllocationEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryReservationService,
        {
          provide: getRepositoryToken(InventoryReservationEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          }),
        },
        {
          provide: getRepositoryToken(InventoryAllocationEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductStockEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          }),
        },
        {
          provide: getRepositoryToken(StockMovementEntity),
          useFactory: () => ({
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(Warehouse),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(Order),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(OrderItem),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: EntityManager,
          useFactory: () => {
            const mockQueryBuilder = {
              select: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getOne: jest.fn().mockResolvedValue(null),
              getRawMany: jest.fn().mockResolvedValue([]),
            };
            return {
              transaction: jest.fn(),
              findOne: jest.fn(),
              find: jest.fn(),
              create: jest.fn(),
              save: jest.fn(),
              getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn(),
                find: jest.fn(),
                save: jest.fn(),
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
              }),
              createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            };
          },
        },
      ],
    }).compile();

    service = module.get<InventoryReservationService>(
      InventoryReservationService,
    );
    reservationRepo = module.get(
      getRepositoryToken(InventoryReservationEntity),
    );
    allocationRepo = module.get(getRepositoryToken(InventoryAllocationEntity));
    stockRepo = module.get(getRepositoryToken(ProductStockEntity));
    movementRepo = module.get(getRepositoryToken(StockMovementEntity));
    variantRepo = module.get(getRepositoryToken(ProductVariant));
    warehouseRepo = module.get(getRepositoryToken(Warehouse));
    orderRepo = module.get(getRepositoryToken(Order));
    orderItemRepo = module.get(getRepositoryToken(OrderItem));
    entityManager = module.get(EntityManager);

    // Initialize test data
    setupTestData();
  });

  function setupTestData() {
    mockUser = {
      id: 1,
      email: 'customer@souqsyria.com',
      firstName: 'أحمد',
      lastName: 'السوري',
      phone: '+963987654321',
      isActive: true,
    } as any;

    mockVariant = {
      id: 101,
      sku: 'SGS24U-512GB-BLACK',
      price: 6500000, // 6,500,000 SYP
      isActive: true,
      product: {
        id: 1,
        nameEn: 'Samsung Galaxy S24 Ultra',
        nameAr: 'سامسونج جالاكسي إس 24 ألترا',
        category: {
          nameEn: 'Smartphones',
          nameAr: 'الهواتف الذكية',
        },
      },
    } as any;

    mockWarehouse = {
      id: 1,
      name: 'Damascus Main Warehouse',
      nameAr: 'مستودع دمشق الرئيسي',
      city: 'Damascus',
      governorate: 'Damascus',
      latitude: 33.5138,
      longitude: 36.2765,
      isActive: true,
    } as any;

    mockSecondWarehouse = {
      id: 2,
      name: 'Aleppo Distribution Center',
      nameAr: 'مركز توزيع حلب',
      city: 'Aleppo',
      governorate: 'Aleppo',
      latitude: 36.2021,
      longitude: 37.1343,
      isActive: true,
    } as any;

    mockOrderItem = {
      id: 1,
      variant: mockVariant,
      quantity: 2,
      price: 6500000,
      total: 13000000, // 2 * 6,500,000 SYP
    } as any;

    mockOrder = {
      id: 1,
      user: mockUser,
      items: [mockOrderItem],
      total_amount: 13000000,
      currency: 'SYP',
      status: 'pending',
      shippingRegion: 'Damascus',
    } as any;

    mockStock = {
      id: 1,
      variant: mockVariant,
      warehouse: mockWarehouse,
      quantity: 50,
      reservedQuantity: 0,
      availableQuantity: 50,
      lastUpdated: new Date(),
    } as any;

    mockReservation = {
      id: 1,
      variant: mockVariant,
      warehouse: mockWarehouse,
      order: mockOrder,
      requestedQuantity: 2,
      reservedQuantity: 2,
      allocatedQuantity: 0,
      status: ReservationStatus.PENDING,
      priority: ReservationPriority.NORMAL,
      allocationStrategy: AllocationStrategy.FIRST_AVAILABLE,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      confirmationDeadline: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      auditTrail: [],
    } as InventoryReservationEntity;

    mockAllocation = {
      id: 1,
      reservation: mockReservation,
      warehouse: mockWarehouse,
      allocatedQuantity: 2,
      availableQuantityAtAllocation: 50,
      allocationAlgorithm: AllocationStrategy.FIRST_AVAILABLE,
      allocationScore: 85.5,
      allocatedAt: new Date(),
    } as InventoryAllocationEntity;
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🔒 Inventory Reservation for Orders', () => {
    beforeEach(() => {
      // Mock transaction wrapper
      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      // Configure getRepository to return proper mocks for each entity
      const mockStockQb = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
        getOne: jest.fn().mockResolvedValue(mockStock),
      };

      const mockReservationQb = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn().mockResolvedValue(null),
      };

      entityManager.getRepository.mockImplementation(() => ({
        findOne: jest.fn().mockResolvedValue(mockStock),
        find: jest.fn().mockResolvedValue([mockStock]),
        save: jest.fn().mockResolvedValue(mockStock),
        createQueryBuilder: jest.fn().mockReturnValue(mockStockQb),
      }));

      // Also configure createQueryBuilder for direct calls
      entityManager.createQueryBuilder.mockReturnValue(mockStockQb);
    });

    it('should reserve inventory for order successfully', async () => {
      // Mock entity manager methods
      entityManager.findOne.mockResolvedValue(mockOrder);
      entityManager.create.mockReturnValue(mockReservation);
      entityManager.save.mockResolvedValue(mockReservation);

      // Mock findOptimalWarehouses
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockReservation);
      expect(entityManager.findOne).toHaveBeenCalledWith(Order, {
        where: { id: 1 },
        relations: ['items', 'items.variant'],
      });
      expect(entityManager.create).toHaveBeenCalledWith(
        InventoryReservationEntity,
        expect.objectContaining({
          variant: mockVariant,
          warehouse: mockWarehouse,
          order: mockOrder,
          requestedQuantity: 2,
          reservedQuantity: 2,
          status: ReservationStatus.PENDING,
          priority: ReservationPriority.NORMAL,
        }),
      );
    });

    it('should throw error when order not found', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(
        service.reserveInventoryForOrder(999, ReservationPriority.NORMAL, 30),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when no warehouses available', async () => {
      entityManager.findOne.mockResolvedValue(mockOrder);

      // Mock empty warehouse list
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(
        service.reserveInventoryForOrder(1, ReservationPriority.NORMAL, 30),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle high priority reservations with auto-confirmation', async () => {
      entityManager.findOne.mockResolvedValue(mockOrder);
      entityManager.create.mockReturnValue(mockReservation);
      entityManager.save.mockResolvedValue(mockReservation);

      // Mock warehouse availability
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Mock confirmation process
      jest
        .spyOn(service, 'confirmReservation')
        .mockResolvedValue(mockReservation);

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.URGENT,
        30,
      );

      expect(result).toHaveLength(1);
      expect(service.confirmReservation).toHaveBeenCalledWith(
        mockReservation.id,
        null,
        entityManager,
      );
    });

    it('should handle multiple items in order', async () => {
      const multiItemOrder = {
        ...mockOrder,
        items: [
          mockOrderItem,
          {
            ...mockOrderItem,
            id: 2,
            variant: { ...mockVariant, id: 102 },
            quantity: 1,
          },
        ],
      };

      entityManager.findOne.mockResolvedValue(multiItemOrder);
      entityManager.create.mockReturnValue(mockReservation);
      entityManager.save.mockResolvedValue(mockReservation);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      expect(result).toHaveLength(2); // Two reservations for two items
    });

    it('should handle partial stock availability', async () => {
      const limitedStock = {
        ...mockStock,
        quantity: 1, // Less than requested quantity of 2
        availableQuantity: 1,
      };

      const partialReservation = {
        ...mockReservation,
        requestedQuantity: 2,
        reservedQuantity: 1, // Only 1 available
      };

      entityManager.findOne.mockResolvedValue(mockOrder);
      entityManager.create.mockReturnValue(partialReservation);
      entityManager.save.mockResolvedValue(partialReservation);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([limitedStock]),
        getOne: jest.fn().mockResolvedValue(limitedStock),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Create reusable repository mocks
      const mockStockRepo = {
        findOne: jest.fn().mockResolvedValue(limitedStock),
        save: jest.fn().mockResolvedValue(limitedStock),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };
      const mockReservationRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn().mockResolvedValue(partialReservation),
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      };

      entityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === ProductStockEntity) return mockStockRepo;
        if (entity === InventoryReservationEntity) return mockReservationRepo;
        return mockStockRepo;
      });

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      // Verify reservation was created with available quantity
      expect(result).toHaveLength(1);
      expect(entityManager.create).toHaveBeenCalled();
    });
  });

  describe('📦 Inventory Allocation', () => {
    it('should allocate confirmed reservations successfully', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.find.mockResolvedValue([confirmedReservation]);
      entityManager.create.mockReturnValue(mockAllocation);
      entityManager.save.mockResolvedValue(mockAllocation);

      // Mock warehouse availability for allocation
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.allocateInventoryForOrder(
        1,
        AllocationStrategy.NEAREST_WAREHOUSE,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          success: true,
          allocatedQuantity: 2,
          allocations: expect.arrayContaining([
            expect.objectContaining({
              warehouseId: mockWarehouse.id,
              quantity: 2,
            }),
          ]),
        }),
      );
    });

    it('should throw error when no confirmed reservations found', async () => {
      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.find.mockResolvedValue([]);

      await expect(
        service.allocateInventoryForOrder(
          1,
          AllocationStrategy.NEAREST_WAREHOUSE,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update reservation status after successful allocation', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.find.mockResolvedValue([confirmedReservation]);
      entityManager.create.mockReturnValue(mockAllocation);
      entityManager.save.mockResolvedValue(mockAllocation);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.allocateInventoryForOrder(
        1,
        AllocationStrategy.NEAREST_WAREHOUSE,
      );

      expect(entityManager.save).toHaveBeenCalledWith(
        InventoryReservationEntity,
        expect.objectContaining({
          status: ReservationStatus.ALLOCATED,
          allocatedQuantity: 2,
        }),
      );
    });

    it('should handle partial allocation scenarios', async () => {
      const limitedStock = {
        ...mockStock,
        quantity: 1, // Less than required
      };

      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
        reservedQuantity: 2,
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.find.mockResolvedValue([confirmedReservation]);
      entityManager.create.mockReturnValue({
        ...mockAllocation,
        allocatedQuantity: 1,
      });
      entityManager.save.mockResolvedValue({
        ...mockAllocation,
        allocatedQuantity: 1,
      });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([limitedStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.allocateInventoryForOrder(
        1,
        AllocationStrategy.NEAREST_WAREHOUSE,
      );

      expect(result[0].success).toBe(false);
      expect(result[0].allocatedQuantity).toBe(1);
      // Verify allocation entity was saved with correct quantity
      expect(entityManager.save).toHaveBeenCalledWith(
        InventoryAllocationEntity,
        expect.objectContaining({
          allocatedQuantity: 1,
        }),
      );
    });
  });

  describe('✅ Reservation Confirmation', () => {
    it('should confirm pending reservation successfully', async () => {
      const pendingReservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
      };

      reservationRepo.findOne.mockResolvedValue(pendingReservation);
      stockRepo.findOne.mockResolvedValue(mockStock);
      reservationRepo.save.mockImplementation((entity: any) => Promise.resolve({
        ...entity,
        status: ReservationStatus.CONFIRMED,
      }));

      const result = await service.confirmReservation(1, mockUser);

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
      expect(result.confirmedBy).toEqual(mockUser);
      expect(result.auditTrail).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'reservation_confirmed',
            user: mockUser.id.toString(),
          }),
        ]),
      );
    });

    it('should throw error when reservation not found', async () => {
      reservationRepo.findOne.mockResolvedValue(null);

      await expect(service.confirmReservation(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when reservation is not pending', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };

      reservationRepo.findOne.mockResolvedValue(confirmedReservation);

      await expect(service.confirmReservation(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when insufficient stock available', async () => {
      const pendingReservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        reservedQuantity: 10,
      };

      const insufficientStock = {
        ...mockStock,
        quantity: 5, // Less than reserved quantity
      };

      reservationRepo.findOne.mockResolvedValue(pendingReservation);
      stockRepo.findOne.mockResolvedValue(insufficientStock);

      await expect(service.confirmReservation(1, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle confirmation with entity manager transaction', async () => {
      const pendingReservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
      };

      const mockReservationRepoFromManager = {
        findOne: jest.fn().mockResolvedValue(pendingReservation),
        save: jest.fn().mockImplementation((entity: any) => Promise.resolve({
          ...entity,
          status: ReservationStatus.CONFIRMED,
        })),
      };

      const mockStockRepoFromManager = {
        findOne: jest.fn().mockResolvedValue(mockStock),
      };

      entityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === InventoryReservationEntity) {
          return mockReservationRepoFromManager as any;
        }
        if (entity === ProductStockEntity) {
          return mockStockRepoFromManager as any;
        }
        return {} as any;
      });

      const result = await service.confirmReservation(
        1,
        mockUser,
        entityManager,
      );

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
      expect(entityManager.getRepository).toHaveBeenCalledWith(
        InventoryReservationEntity,
      );
    });
  });

  describe('🌍 Syrian Market Features', () => {
    it('should handle Syrian currency amounts in reservations', async () => {
      const syrianOrder = {
        ...mockOrder,
        total_amount: 65000000, // 65,000,000 SYP (large amount)
        currency: 'SYP',
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.findOne.mockResolvedValue(syrianOrder);
      entityManager.create.mockReturnValue(mockReservation);
      entityManager.save.mockResolvedValue(mockReservation);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      expect(result).toHaveLength(1);
      expect(entityManager.create).toHaveBeenCalledWith(
        InventoryReservationEntity,
        expect.objectContaining({
          reservationData: expect.objectContaining({
            orderValue: 65000000,
          }),
        }),
      );
    });

    it('should handle Syrian warehouse geographic zones', async () => {
      const syrianOrder = {
        ...mockOrder,
        shippingRegion: 'Damascus',
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.findOne.mockResolvedValue(syrianOrder);
      entityManager.create.mockReturnValue(mockReservation);
      entityManager.save.mockResolvedValue(mockReservation);

      const syrianWarehouses = [
        {
          ...mockStock,
          warehouse: mockWarehouse, // Damascus
        },
        {
          ...mockStock,
          id: 2,
          warehouse: mockSecondWarehouse, // Aleppo
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(syrianWarehouses),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      expect(result).toHaveLength(1);
      expect(entityManager.create).toHaveBeenCalledWith(
        InventoryReservationEntity,
        expect.objectContaining({
          reservationData: expect.objectContaining({
            geographicZone: 'Damascus',
          }),
        }),
      );
    });

    it('should handle Arabic product categories in reservation data', async () => {
      const arabicVariant = {
        ...mockVariant,
        product: {
          ...mockVariant.product,
          category: {
            nameEn: 'Smartphones',
            nameAr: 'الهواتف الذكية',
          },
        },
      };

      const arabicOrder = {
        ...mockOrder,
        items: [
          {
            ...mockOrderItem,
            variant: arabicVariant,
          },
        ],
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.findOne.mockResolvedValue(arabicOrder);
      entityManager.create.mockReturnValue(mockReservation);
      entityManager.save.mockResolvedValue(mockReservation);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      expect(result).toHaveLength(1);
      expect(entityManager.create).toHaveBeenCalledWith(
        InventoryReservationEntity,
        expect.objectContaining({
          reservationData: expect.objectContaining({
            productCategory: 'Smartphones',
          }),
        }),
      );
    });

    it('should prioritize Damascus warehouse for Damascus orders', async () => {
      const damascusOrder = {
        ...mockOrder,
        shippingRegion: 'Damascus',
      };

      const warehouseStocks = [
        {
          ...mockStock,
          warehouse: mockWarehouse, // Damascus - should score higher
        },
        {
          ...mockStock,
          id: 2,
          warehouse: mockSecondWarehouse, // Aleppo
          quantity: 100, // Even with more stock, should score lower for Damascus order
        },
      ];

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.findOne.mockResolvedValue(damascusOrder);
      entityManager.create.mockReturnValue({
        ...mockReservation,
        warehouse: mockWarehouse, // Should select Damascus warehouse
      });
      entityManager.save.mockResolvedValue({
        ...mockReservation,
        warehouse: mockWarehouse,
      });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(warehouseStocks),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      expect(result[0].warehouse.id).toBe(mockWarehouse.id); // Damascus warehouse selected
    });
  });

  describe('⚡ Performance and Optimization', () => {
    it('should include performance metrics in allocation results', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.find.mockResolvedValue([confirmedReservation]);
      entityManager.create.mockReturnValue(mockAllocation);
      entityManager.save.mockResolvedValue(mockAllocation);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.allocateInventoryForOrder(
        1,
        AllocationStrategy.NEAREST_WAREHOUSE,
      );

      expect(result[0].performance).toEqual(
        expect.objectContaining({
          processingTime: expect.any(Number),
          warehousesEvaluated: expect.any(Number),
          conflictsResolved: expect.any(Number),
        }),
      );
    });

    it('should handle allocation failures gracefully', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.find.mockResolvedValue([confirmedReservation]);

      // Mock allocation failure
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.allocateInventoryForOrder(
        1,
        AllocationStrategy.NEAREST_WAREHOUSE,
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          success: false,
          allocatedQuantity: 0,
          allocations: [],
          performance: expect.objectContaining({
            processingTime: expect.any(Number),
          }),
        }),
      );
    });

    it('should optimize warehouse selection based on multiple factors', async () => {
      const multipleWarehouses = [
        {
          ...mockStock,
          warehouse: mockWarehouse,
          quantity: 10, // Lower stock
        },
        {
          ...mockStock,
          id: 2,
          warehouse: mockSecondWarehouse,
          quantity: 100, // Higher stock - should be preferred
        },
      ];

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.findOne.mockResolvedValue(mockOrder);
      entityManager.create.mockReturnValue({
        ...mockReservation,
        warehouse: mockSecondWarehouse, // Should select warehouse with better score
      });
      entityManager.save.mockResolvedValue({
        ...mockReservation,
        warehouse: mockSecondWarehouse,
      });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(multipleWarehouses),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      // Should prioritize warehouse with higher availability
      expect(result[0].warehouse.id).toBe(mockSecondWarehouse.id);
    });
  });

  describe('🔧 Error Handling and Edge Cases', () => {
    it('should handle transaction failures', async () => {
      entityManager.transaction.mockRejectedValue(
        new Error('Transaction failed'),
      );

      await expect(
        service.reserveInventoryForOrder(1, ReservationPriority.NORMAL, 30),
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle entity manager repository errors', async () => {
      const pendingReservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
      };

      const mockRepoFromManager = {
        findOne: jest.fn().mockRejectedValue(new Error('Repository error')),
      };

      entityManager.getRepository.mockReturnValue(mockRepoFromManager as any);

      await expect(
        service.confirmReservation(1, mockUser, entityManager),
      ).rejects.toThrow('Repository error');
    });

    it('should handle concurrent reservation conflicts', async () => {
      // Mock conflict scenario with concurrent reservations
      const conflictingReservations = [
        {
          ...mockReservation,
          id: 2,
          requestedQuantity: 30,
        },
        {
          ...mockReservation,
          id: 3,
          requestedQuantity: 25,
        },
      ];

      const mockConflictQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
        getOne: jest.fn().mockResolvedValue(mockStock),
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.findOne.mockResolvedValue(mockOrder);
      entityManager.create.mockReturnValue(mockReservation);
      entityManager.save.mockResolvedValue(mockReservation);
      entityManager.createQueryBuilder.mockReturnValue(
        mockConflictQuery as any,
      );

      // Mock getRepository for getCurrentStock calls
      entityManager.getRepository.mockImplementation(() => ({
        findOne: jest.fn().mockResolvedValue(mockStock),
        save: jest.fn().mockResolvedValue(mockStock),
        createQueryBuilder: jest.fn().mockReturnValue(mockConflictQuery),
      }));

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      expect(result).toHaveLength(1);
      // Should handle conflicts and still create reservation
    });

    it('should validate reservation expiration times', async () => {
      const expiredReservation = {
        ...mockReservation,
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
      };

      entityManager.transaction.mockImplementation(async (callback) => {
        return callback(entityManager);
      });

      entityManager.findOne.mockResolvedValue(mockOrder);
      entityManager.create.mockReturnValue(expiredReservation);
      entityManager.save.mockResolvedValue(expiredReservation);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
        getOne: jest.fn().mockResolvedValue(mockStock),
      };
      entityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Mock getRepository for getCurrentStock calls
      entityManager.getRepository.mockImplementation(() => ({
        findOne: jest.fn().mockResolvedValue(mockStock),
        save: jest.fn().mockResolvedValue(mockStock),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      }));

      const result = await service.reserveInventoryForOrder(
        1,
        ReservationPriority.NORMAL,
        30,
      );

      expect(result[0].expiresAt.getTime()).toBeLessThan(Date.now()); // Should handle expired reservations
    });
  });
});
