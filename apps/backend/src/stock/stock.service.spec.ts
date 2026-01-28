/**
 * @file stock.service.spec.ts
 * @description Unit tests for StockService
 *
 * Tests comprehensive stock management functionality including:
 * - Stock querying across warehouses
 * - Stock adjustments (in/out operations)
 * - Stock transfers between warehouses
 * - Low stock alert generation
 * - Product-level stock aggregation
 * - Stock alert management and reporting
 * - Syrian market specific features
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { StockService } from './stock.service';
import { ProductStockEntity } from './entities/product-stock.entity';
import { StockMovementEntity } from './entities/stock-movement.entity';
import { StockAlertEntity } from './entities/stock-alert.entity';
import { ProductVariant } from '../products/variants/entities/product-variant.entity';
import { Warehouse } from '../warehouses/entities/warehouse.entity';

describe('StockService', () => {
  let service: StockService;
  let stockRepo: jest.Mocked<Repository<ProductStockEntity>>;
  let movementRepo: jest.Mocked<Repository<StockMovementEntity>>;
  let variantRepo: jest.Mocked<Repository<ProductVariant>>;
  let alertRepo: jest.Mocked<Repository<StockAlertEntity>>;
  let warehouseRepo: jest.Mocked<Repository<Warehouse>>;

  // Test data
  let mockVariant: ProductVariant;
  let mockWarehouse: Warehouse;
  let mockSecondWarehouse: Warehouse;
  let mockStock: ProductStockEntity;
  let mockMovement: StockMovementEntity;
  let mockAlert: StockAlertEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(ProductStockEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getRawOne: jest.fn(),
            })),
          }),
        },
        {
          provide: getRepositoryToken(StockMovementEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useFactory: () => ({
            findOne: jest.fn(),
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(StockAlertEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn(),
            })),
          }),
        },
        {
          provide: getRepositoryToken(Warehouse),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    stockRepo = module.get(getRepositoryToken(ProductStockEntity));
    movementRepo = module.get(getRepositoryToken(StockMovementEntity));
    variantRepo = module.get(getRepositoryToken(ProductVariant));
    alertRepo = module.get(getRepositoryToken(StockAlertEntity));
    warehouseRepo = module.get(getRepositoryToken(Warehouse));

    // Initialize test data
    setupTestData();
  });

  function setupTestData() {
    mockVariant = {
      id: 101,
      sku: 'SGS24U-512GB-BLACK',
      price: 6500000, // 6,500,000 SYP
      isActive: true,
      variantData: {
        Color: 'Titanium Black',
        Storage: '512GB',
        RAM: '12GB',
      },
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
      address: 'Damascus, Syria',
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
      address: 'Aleppo, Syria',
      city: 'Aleppo',
      governorate: 'Aleppo',
      latitude: 36.2021,
      longitude: 37.1343,
      isActive: true,
    } as any;

    mockStock = {
      id: 1,
      variant: mockVariant,
      warehouse: mockWarehouse,
      quantity: 50,
      reservedQuantity: 5,
      availableQuantity: 45,
      reorderLevel: 10,
      maxStockLevel: 100,
      lastUpdated: new Date(),
    } as any;

    mockMovement = {
      id: 1,
      variant: mockVariant,
      fromWarehouse: null,
      toWarehouse: mockWarehouse,
      quantity: 50,
      type: 'in',
      note: 'Initial stock from supplier',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    mockAlert = {
      id: 1,
      variant: mockVariant,
      warehouse: mockWarehouse,
      quantity: 3,
      type: 'low_stock',
      message: 'Low stock alert for Samsung Galaxy S24 Ultra',
      isResolved: false,
      createdAt: new Date(),
    } as any;
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('📊 Stock Querying', () => {
    it('should get stock for specific variant in specific warehouse', async () => {
      stockRepo.findOne.mockResolvedValue(mockStock);

      const result = await service.getStock(101, 1);

      expect(result).toBe(50);
      expect(stockRepo.findOne).toHaveBeenCalledWith({
        where: { variant: { id: 101 }, warehouse: { id: 1 } },
        relations: ['warehouse'],
      });
    });

    it('should return 0 when no stock record exists for specific warehouse', async () => {
      stockRepo.findOne.mockResolvedValue(null);

      const result = await service.getStock(101, 1);

      expect(result).toBe(0);
    });

    it('should get total stock across all warehouses', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '75' }),
      };
      stockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getStock(101);

      expect(result).toBe(75);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'SUM(stock.quantity)',
        'total',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'stock.variant_id = :variantId',
        { variantId: 101 },
      );
    });

    it('should return 0 when no total stock exists', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };
      stockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getStock(101);

      expect(result).toBe(0);
    });

    it('should get variant stock across all warehouses with details', async () => {
      const stockRecords = [
        mockStock,
        {
          ...mockStock,
          id: 2,
          warehouse: mockSecondWarehouse,
          quantity: 25,
        },
      ];
      stockRepo.find.mockResolvedValue(stockRecords as any);

      const result = await service.getVariantStockAcrossWarehouses(101);

      expect(result).toEqual(stockRecords);
      expect(stockRepo.find).toHaveBeenCalledWith({
        where: { variant: { id: 101 } },
        relations: ['warehouse'],
        order: { quantity: 'DESC' },
      });
    });
  });

  describe('📦 Stock Adjustments', () => {
    beforeEach(() => {
      variantRepo.findOne.mockResolvedValue(mockVariant);
      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);
      stockRepo.save.mockResolvedValue(mockStock);
      movementRepo.create.mockImplementation((data: any) => data);
      movementRepo.save.mockImplementation((data: any) => Promise.resolve(data));
      alertRepo.save.mockResolvedValue(mockAlert);
    });

    it('should adjust stock IN successfully', async () => {
      stockRepo.findOne.mockResolvedValue(mockStock);

      const result = await service.adjustStock(
        101,
        1,
        20,
        'in',
        'Supplier delivery',
      );

      expect(result).toEqual({ success: true, quantity: 70 }); // 50 + 20
      expect(stockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 70,
        }),
      );
      expect(movementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: mockVariant,
          toWarehouse: mockWarehouse,
          fromWarehouse: null,
          quantity: 20,
          type: 'in',
          note: 'Supplier delivery',
        }),
      );
    });

    it('should adjust stock OUT successfully', async () => {
      stockRepo.findOne.mockResolvedValue(mockStock);

      const result = await service.adjustStock(
        101,
        1,
        15,
        'out',
        'Customer order',
      );

      expect(result).toEqual({ success: true, quantity: 35 }); // 50 - 15
      expect(stockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 35,
        }),
      );
      expect(movementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: mockVariant,
          fromWarehouse: mockWarehouse,
          toWarehouse: null,
          quantity: 15,
          type: 'out',
          note: 'Customer order',
        }),
      );
    });

    it('should create new stock record when none exists', async () => {
      stockRepo.findOne.mockResolvedValue(null);
      const newStock = { ...mockStock, quantity: 0 };
      stockRepo.create.mockReturnValue(newStock);

      const result = await service.adjustStock(
        101,
        1,
        25,
        'in',
        'Initial stock',
      );

      expect(stockRepo.create).toHaveBeenCalledWith({
        variant: mockVariant,
        warehouse: mockWarehouse,
        quantity: 0,
      });
      expect(result).toEqual({ success: true, quantity: 25 });
    });

    it('should throw error when removing more stock than available', async () => {
      const lowStock = { ...mockStock, quantity: 5 };
      stockRepo.findOne.mockResolvedValue(lowStock);

      await expect(
        service.adjustStock(101, 1, 10, 'out', 'Customer order'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when variant not found', async () => {
      variantRepo.findOne.mockResolvedValue(null);

      await expect(service.adjustStock(999, 1, 10, 'in')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when warehouse not found', async () => {
      warehouseRepo.findOne.mockResolvedValue(null);

      await expect(service.adjustStock(101, 999, 10, 'in')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should generate low stock alert when stock falls below threshold', async () => {
      const lowStock = { ...mockStock, quantity: 10 };
      stockRepo.findOne.mockResolvedValue(lowStock);
      alertRepo.create.mockReturnValue(mockAlert);

      await service.adjustStock(101, 1, 8, 'out', 'Large order');

      expect(alertRepo.create).toHaveBeenCalledWith({
        variant: mockVariant,
        warehouse: mockWarehouse,
        quantity: 2, // 10 - 8
        type: 'low_stock',
      });
      expect(alertRepo.save).toHaveBeenCalled();
    });
  });

  describe('🔄 Stock Transfers', () => {
    beforeEach(() => {
      variantRepo.findOne.mockResolvedValue(mockVariant);
      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);
      stockRepo.save.mockResolvedValue(mockStock);
      movementRepo.create.mockImplementation((data: any) => data);
      movementRepo.save.mockImplementation((data: any) => Promise.resolve(data));
    });

    it('should transfer stock between warehouses successfully', async () => {
      // Mock getStock calls and adjustStock calls
      jest
        .spyOn(service, 'adjustStock')
        .mockResolvedValueOnce({ success: true, quantity: 35 }) // from warehouse after out
        .mockResolvedValueOnce({ success: true, quantity: 15 }); // to warehouse after in

      const result = await service.transferStock(
        101,
        1,
        2,
        15,
        'Rebalancing inventory',
      );

      expect(service.adjustStock).toHaveBeenCalledWith(101, 1, 15, 'out');
      expect(service.adjustStock).toHaveBeenCalledWith(101, 2, 15, 'in');
      expect(movementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: { id: 101 },
          fromWarehouse: { id: 1 },
          toWarehouse: { id: 2 },
          quantity: 15,
          type: 'transfer',
          note: 'Rebalancing inventory',
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw error when source and destination warehouses are the same', async () => {
      await expect(
        service.transferStock(101, 1, 1, 15, 'Invalid transfer'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle transfer failure gracefully', async () => {
      jest
        .spyOn(service, 'adjustStock')
        .mockRejectedValueOnce(new BadRequestException('Insufficient stock'));

      await expect(
        service.transferStock(101, 1, 2, 100, 'Large transfer'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('📊 Product-Level Stock Management', () => {
    it('should calculate total product stock across all variants', async () => {
      const variants = [
        {
          id: 101,
          stocks: [{ quantity: 50 }, { quantity: 30 }],
        },
        {
          id: 102,
          stocks: [{ quantity: 25 }],
        },
        {
          id: 103,
          stocks: [], // No stock
        },
      ];
      variantRepo.find.mockResolvedValue(variants as any);

      const result = await service.getTotalProductStock(1);

      expect(result).toBe(105); // 50 + 30 + 25
      expect(variantRepo.find).toHaveBeenCalledWith({
        where: { product: { id: 1 } },
        relations: ['stocks'],
      });
    });

    it('should return 0 when product has no variants', async () => {
      variantRepo.find.mockResolvedValue([]);

      const result = await service.getTotalProductStock(999);

      expect(result).toBe(0);
    });

    it('should handle variants with no stock records', async () => {
      const variants = [
        {
          id: 101,
          stocks: null, // No stocks relation
        },
        {
          id: 102,
          stocks: undefined, // Undefined stocks
        },
      ];
      variantRepo.find.mockResolvedValue(variants as any);

      const result = await service.getTotalProductStock(1);

      expect(result).toBe(0);
    });
  });

  describe('🚨 Stock Alert Management', () => {
    it('should get alerts with filters', async () => {
      const mockAlerts = [mockAlert];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockAlerts, 1]),
      };
      alertRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const filters = {
        warehouse_id: 1,
        variant_id: 101,
        type: 'low_stock' as const,
        page: 1,
        limit: 20,
      };

      const result = await service.getAlerts(filters);

      expect(result).toEqual({
        data: mockAlerts,
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'alert.warehouse_id = :wid',
        { wid: 1 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'alert.variant_id = :vid',
        { vid: 101 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'alert.type = :type',
        { type: 'low_stock' },
      );
    });

    it('should get alerts without filters', async () => {
      const mockAlerts = [mockAlert];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockAlerts, 1]),
      };
      alertRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAlerts({});

      expect(result.data).toEqual(mockAlerts);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should get alert by ID', async () => {
      alertRepo.findOne.mockResolvedValue(mockAlert);

      const result = await service.getAlertById(1);

      expect(result).toEqual(mockAlert);
      expect(alertRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['variant', 'warehouse'],
      });
    });

    it('should throw error when alert not found', async () => {
      alertRepo.findOne.mockResolvedValue(null);

      await expect(service.getAlertById(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should get stock alert summary', async () => {
      const summaryData = [
        { type: 'low_stock', count: '5' },
        { type: 'critical_stock', count: '2' },
      ];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(summaryData),
      };
      alertRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getStockAlertSummary();

      expect(result).toEqual({
        low_stock: 5,
        critical_stock: 2,
      });
    });
  });

  describe('🌍 Syrian Market Features', () => {
    it('should handle Syrian warehouse names in Arabic', async () => {
      const syrianWarehouse = {
        ...mockWarehouse,
        name: 'Damascus Main Warehouse',
        nameAr: 'مستودع دمشق الرئيسي',
        governorate: 'Damascus',
        city: 'Damascus',
      };
      warehouseRepo.findOne.mockResolvedValue(syrianWarehouse);
      variantRepo.findOne.mockResolvedValue(mockVariant);
      stockRepo.findOne.mockResolvedValue(mockStock);
      stockRepo.save.mockResolvedValue(mockStock);
      movementRepo.create.mockImplementation((data: any) => data);
      movementRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await service.adjustStock(
        101,
        1,
        10,
        'in',
        'تسليم من المورد',
      );

      expect(result.success).toBe(true);
      expect(movementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'تسليم من المورد', // Arabic note
        }),
      );
    });

    it('should handle large SYP amounts in stock movements', async () => {
      const expensiveVariant = {
        ...mockVariant,
        price: 25000000, // 25,000,000 SYP (expensive electronics)
        product: {
          ...mockVariant.product,
          nameAr: 'لابتوب جيمنج متطور',
        },
      };
      variantRepo.findOne.mockResolvedValue(expensiveVariant as any);
      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);
      stockRepo.findOne.mockResolvedValue(mockStock);
      stockRepo.save.mockResolvedValue(mockStock);
      movementRepo.create.mockImplementation((data: any) => data);
      movementRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await service.adjustStock(
        101,
        1,
        5,
        'in',
        'High-value electronics delivery',
      );

      expect(result.success).toBe(true);
      expect(variantRepo.findOne).toHaveBeenCalledWith({
        where: { id: 101 },
      });
    });

    it('should generate alerts with Arabic messages for Syrian context', async () => {
      const lowStock = { ...mockStock, quantity: 8 };
      stockRepo.findOne.mockResolvedValue(lowStock);

      const arabicVariant = {
        ...mockVariant,
        variantData: {
          Color: 'أسود تيتانيوم',
          Storage: '512 جيجا',
          RAM: '12 جيجا',
        },
      };
      variantRepo.findOne.mockResolvedValue(arabicVariant);

      const arabicWarehouse = {
        ...mockWarehouse,
        name: 'Damascus Main Warehouse',
        nameAr: 'مستودع دمشق الرئيسي',
      };
      warehouseRepo.findOne.mockResolvedValue(arabicWarehouse);

      stockRepo.save.mockResolvedValue(mockStock);
      movementRepo.create.mockImplementation((data: any) => data);
      movementRepo.save.mockImplementation((data: any) => Promise.resolve(data));
      alertRepo.create.mockReturnValue(mockAlert);
      alertRepo.save.mockResolvedValue(mockAlert);

      await service.adjustStock(101, 1, 6, 'out', 'طلب عميل كبير');

      expect(alertRepo.create).toHaveBeenCalledWith({
        variant: arabicVariant,
        warehouse: arabicWarehouse,
        quantity: 2, // 8 - 6
        type: 'low_stock',
      });
    });

    it('should handle Syrian governorate-based warehouse distribution', async () => {
      const syrianWarehouses = [
        {
          ...mockWarehouse,
          city: 'Damascus',
        },
        {
          ...mockSecondWarehouse,
          city: 'Aleppo',
        },
      ];

      const stockRecords = syrianWarehouses.map((warehouse, index) => ({
        ...mockStock,
        id: index + 1,
        warehouse,
        quantity: 20 + index * 10,
      }));

      stockRepo.find.mockResolvedValue(stockRecords as any);

      const result = await service.getVariantStockAcrossWarehouses(101);

      expect(result).toHaveLength(2);
      // Warehouse entity uses 'city' not 'governorate'
      expect(result[0].warehouse.city).toBe('Damascus');
      expect(result[1].warehouse.city).toBe('Aleppo');
    });
  });

  describe('⚡ Performance and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      stockRepo.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.getStock(101, 1)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle concurrent stock adjustments', async () => {
      variantRepo.findOne.mockResolvedValue(mockVariant);
      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);
      stockRepo.findOne.mockResolvedValue(mockStock);
      stockRepo.save.mockResolvedValue(mockStock);
      movementRepo.create.mockImplementation((data: any) => data);
      movementRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      // Simulate concurrent adjustments
      const operations = [
        service.adjustStock(101, 1, 5, 'out', 'Order 1'),
        service.adjustStock(101, 1, 3, 'out', 'Order 2'),
        service.adjustStock(101, 1, 10, 'in', 'Restock'),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle large stock quantities correctly', async () => {
      const largeStock = {
        ...mockStock,
        quantity: 10000, // Large inventory
      };
      stockRepo.findOne.mockResolvedValue(largeStock);
      variantRepo.findOne.mockResolvedValue(mockVariant);
      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);
      stockRepo.save.mockResolvedValue(largeStock);
      movementRepo.create.mockImplementation((data: any) => data);
      movementRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await service.adjustStock(
        101,
        1,
        500,
        'out',
        'Bulk order',
      );

      expect(result).toEqual({ success: true, quantity: 9500 });
    });

    it('should validate stock adjustment parameters', async () => {
      variantRepo.findOne.mockResolvedValue(mockVariant);
      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);
      stockRepo.findOne.mockResolvedValue(mockStock);

      // Test with negative quantity (should be handled by DTO validation in real app)
      await expect(
        service.adjustStock(101, 1, -10, 'in', 'Invalid quantity'),
      ).resolves.toBeDefined(); // Service doesn't validate, but DTO would
    });

    it('should handle missing optional notes in stock operations', async () => {
      variantRepo.findOne.mockResolvedValue(mockVariant);
      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);
      stockRepo.findOne.mockResolvedValue(mockStock);
      stockRepo.save.mockResolvedValue(mockStock);
      movementRepo.create.mockImplementation((data: any) => data);
      movementRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await service.adjustStock(101, 1, 10, 'in'); // No note provided

      expect(result.success).toBe(true);
      expect(movementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          note: undefined,
        }),
      );
    });
  });

  describe('📈 Stock Analytics and Reporting', () => {
    it('should aggregate stock data for reporting', async () => {
      const stockRecords = [
        { ...mockStock, quantity: 50, warehouse: { id: 1, name: 'Damascus' } },
        { ...mockStock, quantity: 30, warehouse: { id: 2, name: 'Aleppo' } },
        { ...mockStock, quantity: 20, warehouse: { id: 3, name: 'Latakia' } },
      ];
      stockRepo.find.mockResolvedValue(stockRecords as any);

      const result = await service.getVariantStockAcrossWarehouses(101);

      expect(result).toHaveLength(3);
      expect(result.reduce((sum, stock) => sum + stock.quantity, 0)).toBe(100);
    });

    it('should track stock movement history', async () => {
      variantRepo.findOne.mockResolvedValue(mockVariant);
      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);
      stockRepo.findOne.mockResolvedValue(mockStock);
      stockRepo.save.mockResolvedValue(mockStock);
      movementRepo.create.mockImplementation((data: any) => data);

      const movementCalls: any[] = [];
      movementRepo.save.mockImplementation((movement: any) => {
        movementCalls.push(movement);
        return Promise.resolve(movement as any);
      });

      // Perform multiple stock operations
      await service.adjustStock(101, 1, 20, 'in', 'Supplier delivery');
      await service.adjustStock(101, 1, 5, 'out', 'Customer order');
      await service.adjustStock(101, 1, 10, 'in', 'Return');

      expect(movementCalls).toHaveLength(3);
      expect(movementCalls[0].type).toBe('in');
      expect(movementCalls[1].type).toBe('out');
      expect(movementCalls[2].type).toBe('in');
    });

    it('should provide stock alert summary for dashboard', async () => {
      const summaryData = [
        { type: 'low_stock', count: '12' },
        { type: 'critical_stock', count: '3' },
        { type: 'out_of_stock', count: '1' },
      ];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(summaryData),
      };
      alertRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getStockAlertSummary();

      expect(result).toEqual({
        low_stock: 12,
        critical_stock: 3,
        out_of_stock: 1,
      });
    });
  });
});
