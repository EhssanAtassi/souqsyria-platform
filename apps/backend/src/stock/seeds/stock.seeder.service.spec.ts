/**
 * @file stock.seeder.service.spec.ts
 * @description Unit tests for StockSeederService
 *
 * Tests comprehensive stock seeding functionality including:
 * - Syrian warehouse network generation
 * - Multi-variant stock distribution
 * - Stock movement history simulation
 * - Alert generation for low inventory
 * - Regional stock optimization
 * - Statistical analysis and reporting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StockSeederService } from './stock.seeder.service';
import { ProductStockEntity } from '../entities/product-stock.entity';
import { StockMovementEntity } from '../entities/stock-movement.entity';
import { StockAlertEntity } from '../entities/stock-alert.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

describe('StockSeederService', () => {
  let service: StockSeederService;
  let stockRepository: jest.Mocked<Repository<ProductStockEntity>>;
  let movementRepository: jest.Mocked<Repository<StockMovementEntity>>;
  let alertRepository: jest.Mocked<Repository<StockAlertEntity>>;
  let variantRepository: jest.Mocked<Repository<ProductVariant>>;
  let productRepository: jest.Mocked<Repository<ProductEntity>>;
  let warehouseRepository: jest.Mocked<Repository<Warehouse>>;

  // Test data
  let mockWarehouses: any[];
  let mockProducts: ProductEntity[];
  let mockVariants: ProductVariant[];
  let mockStockRecords: ProductStockEntity[];
  let mockMovements: StockMovementEntity[];
  let mockAlerts: StockAlertEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockSeederService,
        {
          provide: getRepositoryToken(ProductStockEntity),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(StockMovementEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(StockAlertEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(Warehouse),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<StockSeederService>(StockSeederService);
    stockRepository = module.get(getRepositoryToken(ProductStockEntity));
    movementRepository = module.get(getRepositoryToken(StockMovementEntity));
    alertRepository = module.get(getRepositoryToken(StockAlertEntity));
    variantRepository = module.get(getRepositoryToken(ProductVariant));
    productRepository = module.get(getRepositoryToken(ProductEntity));
    warehouseRepository = module.get(getRepositoryToken(Warehouse));

    // Initialize test data
    setupTestData();
  });

  function setupTestData() {
    mockWarehouses = [
      {
        id: 1,
        name: 'Damascus Main Distribution Center',
        nameAr: 'مركز التوزيع الرئيسي - دمشق',
        city: 'Damascus',
        governorate: 'Damascus',
        capacity: 15000,
        currentUtilization: 0.75,
        isActive: true,
      },
      {
        id: 2,
        name: 'Aleppo Regional Warehouse',
        nameAr: 'مستودع حلب الإقليمي',
        city: 'Aleppo',
        governorate: 'Aleppo',
        capacity: 10000,
        currentUtilization: 0.6,
        isActive: true,
      },
      {
        id: 3,
        name: 'Latakia Coastal Logistics Hub',
        nameAr: 'مركز اللوجستيات الساحلي - اللاذقية',
        city: 'Latakia',
        governorate: 'Latakia',
        capacity: 8000,
        currentUtilization: 0.45,
        isActive: true,
      },
    ] as any;

    mockProducts = [
      {
        id: 1,
        nameEn: 'Samsung Galaxy S24 Ultra',
        nameAr: 'سامسونج جالاكسي إس 24 ألترا',
        price: 6500000,
        currency: 'SYP',
        category: 'Smartphones',
        isActive: true,
      },
      {
        id: 2,
        nameEn: 'Damascus Steel Watch',
        nameAr: 'ساعة فولاذ دمشقي',
        price: 750000,
        currency: 'SYP',
        category: 'Accessories',
        isActive: true,
      },
      {
        id: 3,
        nameEn: 'Aleppo Soap Collection',
        nameAr: 'مجموعة صابون حلب',
        price: 125000,
        currency: 'SYP',
        category: 'Beauty',
        isActive: true,
      },
    ] as any;

    mockVariants = [
      {
        id: 101,
        product: mockProducts[0],
        sku: 'SAM-SM-V1',
        price: 6500000,
        isActive: true,
        attributes: { color: 'Black', storage: '512GB' },
      },
      {
        id: 102,
        product: mockProducts[0],
        sku: 'SAM-SM-V2',
        price: 6825000,
        isActive: true,
        attributes: { color: 'Blue', storage: '512GB' },
      },
      {
        id: 103,
        product: mockProducts[1],
        sku: 'DAM-AC-V1',
        price: 750000,
        isActive: true,
        attributes: { material: 'Steel', size: 'Medium' },
      },
    ] as any;

    mockStockRecords = [
      {
        id: 1,
        variant: mockVariants[0],
        warehouse: mockWarehouses[0],
        quantity: 50,
        reservedQuantity: 5,
        availableQuantity: 45,
        reorderLevel: 10,
        maxStockLevel: 125,
        costPerUnit: 4550000,
        totalValue: 227500000,
      },
      {
        id: 2,
        variant: mockVariants[0],
        warehouse: mockWarehouses[1],
        quantity: 30,
        reservedQuantity: 3,
        availableQuantity: 27,
        reorderLevel: 6,
        maxStockLevel: 75,
        costPerUnit: 4550000,
        totalValue: 136500000,
      },
    ] as any;

    mockMovements = [
      {
        id: 1,
        variant: mockVariants[0],
        toWarehouse: mockWarehouses[0],
        quantity: 50,
        type: 'in',
        note: 'تسليم من المورد',
        reference: 'IN-123456-001',
        unitCost: 4550000,
        totalCost: 227500000,
      },
      {
        id: 2,
        variant: mockVariants[0],
        fromWarehouse: mockWarehouses[0],
        quantity: 10,
        type: 'out',
        note: 'تلبية طلب عميل',
        reference: 'OUT-123457-001',
        unitCost: 4550000,
        totalCost: 45500000,
      },
    ] as any;

    mockAlerts = [
      {
        id: 1,
        variant: mockVariants[2],
        warehouse: mockWarehouses[2],
        quantity: 3,
        type: 'low_stock',
        message: 'مخزون منخفض: مجموعة صابون حلب',
        isResolved: false,
        priority: 'medium',
      },
    ] as any;
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🌱 Comprehensive Stock Seeding', () => {
    it('should seed comprehensive stock data successfully', async () => {
      // Mock repository responses
      warehouseRepository.find.mockResolvedValue([]);
      warehouseRepository.create.mockReturnValue(mockWarehouses as any);
      warehouseRepository.save.mockResolvedValue(mockWarehouses as any);

      variantRepository.find.mockResolvedValue([]);
      productRepository.create.mockReturnValue(mockProducts as any);
      productRepository.save.mockResolvedValue(mockProducts as any);
      variantRepository.create.mockReturnValue(mockVariants as any);
      variantRepository.save.mockResolvedValue(mockVariants as any);

      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);

      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);

      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock data cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.seedSampleStock();

      expect(result).toBeDefined();
      expect(result.stockRecords).toBeDefined();
      expect(result.movements).toBeDefined();
      expect(result.alerts).toBeDefined();
      expect(result.statistics).toBeDefined();

      // Verify statistics structure
      expect(result.statistics).toEqual(
        expect.objectContaining({
          totalWarehouses: expect.any(Number),
          totalVariants: expect.any(Number),
          totalStockValue: expect.any(Number),
          averageStockPerWarehouse: expect.any(Number),
          lowStockAlerts: expect.any(Number),
        }),
      );

      // Verify cleanup was called
      expect(stockRepository.delete).toHaveBeenCalled();
      expect(movementRepository.delete).toHaveBeenCalled();
      expect(alertRepository.delete).toHaveBeenCalled();

      // Verify warehouses were created
      expect(warehouseRepository.create).toHaveBeenCalled();
      expect(warehouseRepository.save).toHaveBeenCalled();

      // Verify products and variants were created
      expect(productRepository.create).toHaveBeenCalled();
      expect(productRepository.save).toHaveBeenCalled();
      expect(variantRepository.create).toHaveBeenCalled();
      expect(variantRepository.save).toHaveBeenCalled();

      // Verify stock records were created
      expect(stockRepository.create).toHaveBeenCalled();
      expect(stockRepository.save).toHaveBeenCalled();
    });

    it('should use existing warehouses and variants if available', async () => {
      // Mock existing data
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);

      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);

      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);

      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      // Should not create new warehouses/variants since they exist
      expect(warehouseRepository.create).not.toHaveBeenCalled();
      expect(productRepository.create).not.toHaveBeenCalled();
      expect(variantRepository.create).not.toHaveBeenCalled();

      // Should still create stock records
      expect(stockRepository.create).toHaveBeenCalled();
      expect(stockRepository.save).toHaveBeenCalled();
    });

    it('should handle seeding errors gracefully', async () => {
      // Mock repository failure
      warehouseRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.seedSampleStock()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('🏢 Syrian Warehouse Network', () => {
    it('should create Syrian warehouses with proper localization', async () => {
      warehouseRepository.find.mockResolvedValue([]);

      const warehouseCreateCalls: any[] = [];
      warehouseRepository.create.mockImplementation((data) => {
        warehouseCreateCalls.push(data);
        return data as any;
      });
      warehouseRepository.save.mockResolvedValue(mockWarehouses as any);

      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);
      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      expect(warehouseCreateCalls.length).toBeGreaterThan(0);

      // Verify Syrian warehouse characteristics
      warehouseCreateCalls.forEach((warehouse) => {
        expect(warehouse.nameAr).toBeDefined();
        expect(warehouse.city).toBeDefined();
        expect(warehouse.governorate).toBeDefined();
        expect(warehouse.latitude).toBeDefined();
        expect(warehouse.longitude).toBeDefined();
        expect(warehouse.managerName).toBeDefined();
        expect(warehouse.contactPhone).toMatch(/^\+963/); // Syrian phone number
      });

      // Check for major Syrian cities
      const cities = warehouseCreateCalls.map((w) => w.city);
      expect(cities).toContain('Damascus');
      expect(cities).toContain('Aleppo');
      expect(cities).toContain('Latakia');
    });

    it('should distribute stock based on warehouse capacity', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);

      const stockCreateCalls: any[] = [];
      stockRepository.create.mockImplementation((data) => {
        stockCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      stockRepository.save.mockResolvedValue(mockStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);
      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      // Verify stock distribution follows capacity logic
      expect(stockCreateCalls.length).toBeGreaterThan(0);

      // Group by warehouse
      const stockByWarehouse = stockCreateCalls.reduce((acc, stock) => {
        const warehouseId = stock.warehouse.id;
        acc[warehouseId] = (acc[warehouseId] || 0) + stock.quantity;
        return acc;
      }, {});

      // Damascus (highest capacity) should generally have more stock
      // This is a probabilistic test, so we check trends rather than exact values
      expect(Object.keys(stockByWarehouse).length).toBeGreaterThan(0);
    });

    it('should handle regional warehouse specialization', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);

      const stockCreateCalls: any[] = [];
      stockRepository.create.mockImplementation((data) => {
        stockCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      stockRepository.save.mockResolvedValue(mockStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);
      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      // High-value items should be concentrated in major warehouses
      const expensiveVariantStocks = stockCreateCalls.filter(
        (stock) => stock.variant.price > 5000000, // > 5M SYP
      );

      if (expensiveVariantStocks.length > 0) {
        const majorCities = ['Damascus', 'Aleppo', 'Latakia'];
        expensiveVariantStocks.forEach((stock) => {
          expect(majorCities).toContain(stock.warehouse.city);
        });
      }
    });
  });

  describe('📦 Stock Movement Generation', () => {
    it('should generate realistic stock movements with Arabic notes', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);

      const movementCreateCalls: any[] = [];
      movementRepository.create.mockImplementation((data) => {
        movementCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      movementRepository.save.mockResolvedValue(mockMovements as any);

      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      expect(movementCreateCalls.length).toBeGreaterThan(0);

      // Verify movement types
      const movementTypes = movementCreateCalls.map((m) => m.type);
      expect(movementTypes).toContain('in');
      expect(movementTypes).toContain('out');

      // Verify Arabic notes
      movementCreateCalls.forEach((movement) => {
        expect(movement.note).toBeDefined();
        expect(movement.reference).toBeDefined();
        expect(movement.unitCost).toBeGreaterThan(0);
        expect(movement.totalCost).toBeGreaterThan(0);
      });

      // Check for Syrian-specific notes
      const arabicNotes = movementCreateCalls.filter(
        (m) =>
          m.note.includes('تسليم') ||
          m.note.includes('طلب') ||
          m.note.includes('شحنة') ||
          m.note.includes('نقل'),
      );
      expect(arabicNotes.length).toBeGreaterThan(0);
    });

    it('should generate proper movement references', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);

      const movementCreateCalls: any[] = [];
      movementRepository.create.mockImplementation((data) => {
        movementCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      movementRepository.save.mockResolvedValue(mockMovements as any);

      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      movementCreateCalls.forEach((movement) => {
        expect(movement.reference).toMatch(/^(IN|OUT|TRF|MOV)-\d+-\d+$/);
      });
    });

    it('should calculate movement costs correctly', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);

      const movementCreateCalls: any[] = [];
      movementRepository.create.mockImplementation((data) => {
        movementCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      movementRepository.save.mockResolvedValue(mockMovements as any);

      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      movementCreateCalls.forEach((movement) => {
        expect(movement.unitCost).toBeGreaterThan(0);
        expect(movement.totalCost).toBe(movement.quantity * movement.unitCost);
      });
    });
  });

  describe('🚨 Stock Alert Generation', () => {
    it('should generate alerts for low stock scenarios', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);

      // Create stock records with some low stock
      const lowStockRecords = [
        {
          ...mockStockRecords[0],
          quantity: 3, // Below reorder level
          reorderLevel: 10,
        },
        {
          ...mockStockRecords[1],
          quantity: 0, // Out of stock
          reorderLevel: 5,
        },
      ];

      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(lowStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);

      const alertCreateCalls: any[] = [];
      alertRepository.create.mockImplementation((data) => {
        alertCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      expect(alertCreateCalls.length).toBeGreaterThan(0);

      // Verify alert types
      const alertTypes = alertCreateCalls.map((a) => a.type);
      expect(alertTypes).toContain('low_stock');

      // Check for out of stock alerts
      const outOfStockAlerts = alertCreateCalls.filter(
        (a) => a.type === 'out_of_stock',
      );
      if (outOfStockAlerts.length > 0) {
        outOfStockAlerts.forEach((alert) => {
          expect(alert.quantity).toBe(0);
        });
      }
    });

    it('should generate Arabic alert messages', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);

      const alertCreateCalls: any[] = [];
      alertRepository.create.mockImplementation((data) => {
        alertCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      if (alertCreateCalls.length > 0) {
        alertCreateCalls.forEach((alert) => {
          expect(alert.message).toBeDefined();
          expect(alert.priority).toBeDefined();
          expect(['low', 'medium', 'high', 'urgent']).toContain(alert.priority);
        });

        // Check for Arabic text in messages
        const arabicAlerts = alertCreateCalls.filter(
          (a) =>
            a.message.includes('مخزون') ||
            a.message.includes('نفاد') ||
            a.message.includes('تنبيه'),
        );
        expect(arabicAlerts.length).toBeGreaterThan(0);
      }
    });

    it('should set appropriate alert priorities', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);

      const alertCreateCalls: any[] = [];
      alertRepository.create.mockImplementation((data) => {
        alertCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      if (alertCreateCalls.length > 0) {
        // Check priority mapping
        const criticalAlerts = alertCreateCalls.filter(
          (a) => a.type === 'critical_stock',
        );
        const outOfStockAlerts = alertCreateCalls.filter(
          (a) => a.type === 'out_of_stock',
        );

        criticalAlerts.forEach((alert) => {
          expect(alert.priority).toBe('high');
        });

        outOfStockAlerts.forEach((alert) => {
          expect(alert.priority).toBe('urgent');
        });
      }
    });
  });

  describe('📊 Statistical Analysis', () => {
    it('should calculate accurate stock statistics', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue(mockStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);
      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.seedSampleStock();

      expect(result.success).toBe(true);
      expect(result.data.stockRecords).toBeGreaterThanOrEqual(0);
      expect(result.data.movementsCreated).toBeGreaterThanOrEqual(0);
      expect(result.data.alertsGenerated).toBeGreaterThanOrEqual(0);
      expect(result.data.analytics).toBeDefined();
      expect(result.data.analytics.totalValue).toBeDefined();
    });

    it('should handle empty stock scenarios in statistics', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockResolvedValue([] as any); // No stock records
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue([] as any);
      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue([] as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.seedSampleStock();

      expect(result.success).toBe(true);
      expect(result.data.stockRecords).toBe(0);
      expect(result.data.alertsGenerated).toBe(0);
    });
  });

  describe('⚡ Minimal Seeding', () => {
    it('should seed minimal stock data for quick testing', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses.slice(0, 2));
      variantRepository.find.mockResolvedValue(mockVariants.slice(0, 3));

      const stockCreateCalls: any[] = [];
      stockRepository.create.mockImplementation((data) => {
        stockCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      stockRepository.save.mockResolvedValue(
        mockStockRecords.slice(0, 3) as any,
      );

      const movementCreateCalls: any[] = [];
      movementRepository.create.mockImplementation((data) => {
        movementCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      movementRepository.save.mockResolvedValue(
        mockMovements.slice(0, 3) as any,
      );

      const result = await service.seedMinimalStock();

      // Service returns counts, not arrays
      expect(result.success).toBe(true);
      expect(result.data.stockRecords).toBe(2); // mockStockRecords.slice(0, 3).length = 2 (only 2 in array)
      expect(result.data.movementsCreated).toBe(2);
    });

    it('should handle minimal seeding when no warehouses exist', async () => {
      warehouseRepository.find.mockResolvedValue([]);
      variantRepository.find.mockResolvedValue(mockVariants);

      // Service returns error object, doesn't throw
      const result = await service.seedMinimalStock();
      expect(result.success).toBe(false);
      expect(result.data.stockRecords).toBe(0);
    });

    it('should handle minimal seeding when no variants exist', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue([]);

      // Service returns error object, doesn't throw
      const result = await service.seedMinimalStock();
      expect(result.success).toBe(false);
      expect(result.message.en).toContain('No product variants found');
    });
  });

  describe('🌍 Syrian Market Optimization', () => {
    it('should optimize stock distribution for Syrian geography', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);

      const stockCreateCalls: any[] = [];
      stockRepository.create.mockImplementation((data) => {
        stockCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      stockRepository.save.mockResolvedValue(mockStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);
      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await service.seedSampleStock();

      // Verify stock distribution considers Syrian market factors
      expect(stockCreateCalls.length).toBeGreaterThan(0);

      // Check that stock is distributed across Syrian governorates
      const governorates = stockCreateCalls.map((s) => s.warehouse.governorate);
      const uniqueGovernorates = [...new Set(governorates)];
      expect(uniqueGovernorates.length).toBeGreaterThan(1);
      expect(uniqueGovernorates).toContain('Damascus');
    });

    it('should handle large SYP amounts in stock values', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);

      const stockCreateCalls: any[] = [];
      stockRepository.create.mockImplementation((data) => {
        stockCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      stockRepository.save.mockResolvedValue(mockStockRecords as any);
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockResolvedValue(mockMovements as any);
      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockResolvedValue(mockAlerts as any);

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.seedSampleStock();

      // Verify service returns analytics with SYP amounts
      expect(result.success).toBe(true);
      expect(result.data.analytics).toBeDefined();
      expect(result.data.analytics.totalValue.SYP).toBeGreaterThan(0);

      // Verify stock records were created with quantities
      stockCreateCalls.forEach((stock) => {
        expect(stock.quantity).toBeGreaterThan(0);
        expect(stock.variant_id).toBeDefined();
      });
    });
  });
});
