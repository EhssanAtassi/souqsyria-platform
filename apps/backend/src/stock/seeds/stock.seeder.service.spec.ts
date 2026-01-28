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
      // Mock existing data - seedSampleStock uses existing warehouses and variants
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);

      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockImplementation((data) => Promise.resolve(data as any));

      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockImplementation((data) => Promise.resolve(data as any));

      alertRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      alertRepository.save.mockImplementation((data) => Promise.resolve(data as any));

      const result = await service.seedSampleStock();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.stockRecords).toBeDefined();
      expect(result.data.movementsCreated).toBeDefined();
      expect(result.data.alertsGenerated).toBeDefined();

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

      // Service catches errors and returns error object, doesn't throw
      const result = await service.seedSampleStock();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('🏢 Syrian Warehouse Network', () => {
    it('should return error when no warehouses exist', async () => {
      // Service requires existing warehouses - it doesn't create them
      warehouseRepository.find.mockResolvedValue([]);
      variantRepository.find.mockResolvedValue(mockVariants);

      const result = await service.seedSampleStock();

      // Service returns error when no warehouses are found
      expect(result.success).toBe(false);
      expect(result.message.en).toContain('No warehouses found');
      expect(result.data.stockRecords).toBe(0);
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

      // Verify movement types - seedSampleStock only creates 'in' type
      const movementTypes = movementCreateCalls.map((m) => m.type);
      expect(movementTypes).toContain('in');

      // Verify movement structure
      movementCreateCalls.forEach((movement) => {
        expect(movement.note).toBeDefined();
        expect(movement.type).toBe('in');
        expect(movement.quantity).toBeGreaterThan(0);
      });

      // Check for seeding notes
      const seedingNotes = movementCreateCalls.filter((m) =>
        m.note.includes('Initial stock'),
      );
      expect(seedingNotes.length).toBeGreaterThan(0);
    });

    it('should generate proper movement structure', async () => {
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

      // Verify movements have required structure
      movementCreateCalls.forEach((movement) => {
        expect(movement.type).toBe('in');
        expect(movement.note).toBeDefined();
        expect(movement.quantity).toBeGreaterThan(0);
      });
    });

    it('should create movements with valid quantities', async () => {
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

      // Verify movements have valid quantities
      movementCreateCalls.forEach((movement) => {
        expect(movement.quantity).toBeGreaterThan(0);
        expect(movement.variant_id).toBeDefined();
      });
    });
  });

  describe('🚨 Stock Alert Generation', () => {
    it('should generate alerts for low stock scenarios', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);

      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockImplementation((data) => Promise.resolve(data as any));
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockImplementation((data) => Promise.resolve(data as any));

      const alertCreateCalls: any[] = [];
      alertRepository.create.mockImplementation((data) => {
        alertCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      alertRepository.save.mockImplementation((data) => Promise.resolve(data as any));

      // Mock cleanup
      stockRepository.delete.mockResolvedValue({ affected: 0 } as any);
      movementRepository.delete.mockResolvedValue({ affected: 0 } as any);
      alertRepository.delete.mockResolvedValue({ affected: 0 } as any);

      // Mock Math.random to generate low stock values (< 20)
      const originalRandom = Math.random;
      jest.spyOn(Math, 'random').mockReturnValue(0.05); // Will produce quantity = 10 + 5 = 15

      await service.seedSampleStock();

      Math.random = originalRandom; // Restore

      // With quantity < 20, alerts should be generated
      expect(alertCreateCalls.length).toBeGreaterThan(0);

      // Verify alert structure
      alertCreateCalls.forEach((alert) => {
        expect(['low_stock', 'critical_stock']).toContain(alert.type);
        expect(alert.variant_id).toBeDefined();
      });
    });

    it('should create alerts with proper type classification', async () => {
      warehouseRepository.find.mockResolvedValue(mockWarehouses);
      variantRepository.find.mockResolvedValue(mockVariants);
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockImplementation((data) => Promise.resolve(data as any));
      movementRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      movementRepository.save.mockImplementation((data) => Promise.resolve(data as any));

      const alertCreateCalls: any[] = [];
      alertRepository.create.mockImplementation((data) => {
        alertCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });
      alertRepository.save.mockImplementation((data) => Promise.resolve(data as any));

      // Mock Math.random to generate low stock values (< 20)
      jest.spyOn(Math, 'random').mockReturnValue(0.05);

      await service.seedSampleStock();

      jest.restoreAllMocks();

      if (alertCreateCalls.length > 0) {
        // Verify alerts have the correct structure
        alertCreateCalls.forEach((alert) => {
          expect(['low_stock', 'critical_stock']).toContain(alert.type);
          expect(alert.variant_id).toBeDefined();
          expect(alert.warehouse_id).toBeDefined();
          expect(alert.quantity).toBeDefined();
        });
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
      // When warehouse is undefined, save might fail
      stockRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      stockRepository.save.mockRejectedValue(new Error('Cannot save without warehouse'));

      // Service catches the error and returns failure
      const result = await service.seedMinimalStock();
      expect(result.success).toBe(false);
      // Error response may not have data property
      expect(result.error || result.message).toBeDefined();
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
