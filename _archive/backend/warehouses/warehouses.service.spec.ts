/**
 * @fileoverview Comprehensive unit tests for WarehousesService
 * @description Tests warehouse retrieval operations for Syrian marketplace
 * 
 * Test Coverage:
 * - Finding all warehouses
 * - Finding warehouse by ID
 * - Syrian geographic warehouse distribution
 * 
 * Syrian Market Context:
 * - 14 governorates for warehouse locations
 * - Major cities: Damascus, Aleppo, Homs, Latakia
 * - Geographic coordinates for Syrian locations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from './entities/warehouse.entity';

// ============================================================================
// Mock Factories - Syrian Warehouse Data
// ============================================================================

/**
 * Syrian warehouse locations with real coordinates
 */
const SYRIAN_WAREHOUSES = [
  {
    id: 1,
    name: 'Damascus Central Warehouse',
    nameAr: 'مستودع دمشق المركزي',
    city: 'Damascus',
    address: 'Industrial Area, Kaboun, Damascus',
    latitude: 33.5138,
    longitude: 36.2765,
  },
  {
    id: 2,
    name: 'Aleppo Distribution Center',
    nameAr: 'مركز توزيع حلب',
    city: 'Aleppo',
    address: 'Al-Hamdaniya Industrial Zone, Aleppo',
    latitude: 36.2021,
    longitude: 37.1343,
  },
  {
    id: 3,
    name: 'Latakia Port Warehouse',
    nameAr: 'مستودع ميناء اللاذقية',
    city: 'Latakia',
    address: 'Port District, Latakia',
    latitude: 35.5317,
    longitude: 35.7919,
  },
  {
    id: 4,
    name: 'Homs Regional Facility',
    nameAr: 'منشأة حمص الإقليمية',
    city: 'Homs',
    address: 'Industrial City, Homs',
    latitude: 34.7324,
    longitude: 36.7137,
  },
  {
    id: 5,
    name: 'Tartus Coastal Hub',
    nameAr: 'مركز طرطوس الساحلي',
    city: 'Tartus',
    address: 'Port Area, Tartus',
    latitude: 34.8894,
    longitude: 35.8867,
  },
];

/**
 * Creates a mock Syrian warehouse
 */
const createMockWarehouse = (overrides = {}): Partial<Warehouse> => ({
  id: 1,
  name: 'Damascus Central Warehouse',
  city: 'Damascus',
  address: 'Industrial Area, Kaboun, Damascus',
  latitude: 33.5138,
  longitude: 36.2765,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// ============================================================================
// Mock Repository Factory
// ============================================================================

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
});

// ============================================================================
// Test Suite
// ============================================================================

describe('WarehousesService', () => {
  let service: WarehousesService;
  let warehouseRepo: MockRepository<Warehouse>;

  beforeEach(async () => {
    warehouseRepo = createMockRepository<Warehouse>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesService,
        {
          provide: getRepositoryToken(Warehouse),
          useValue: warehouseRepo,
        },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Service Initialization
  // ==========================================================================

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==========================================================================
  // findAll() Method Tests
  // ==========================================================================

  describe('findAll()', () => {
    it('should return all warehouses', async () => {
      const mockWarehouses = SYRIAN_WAREHOUSES.map((w) => createMockWarehouse(w));

      warehouseRepo.find.mockResolvedValue(mockWarehouses);

      const result = await service.findAll();

      expect(warehouseRepo.find).toHaveBeenCalled();
      expect(result).toHaveLength(5);
    });

    it('should return empty array when no warehouses exist', async () => {
      warehouseRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return warehouses with all properties', async () => {
      const mockWarehouse = createMockWarehouse();
      warehouseRepo.find.mockResolvedValue([mockWarehouse]);

      const result = await service.findAll();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('city');
      expect(result[0]).toHaveProperty('address');
      expect(result[0]).toHaveProperty('latitude');
      expect(result[0]).toHaveProperty('longitude');
    });

    it('should return warehouses from major Syrian cities', async () => {
      const majorCities = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Tartus'];
      const mockWarehouses = majorCities.map((city, index) =>
        createMockWarehouse({ id: index + 1, city }),
      );

      warehouseRepo.find.mockResolvedValue(mockWarehouses);

      const result = await service.findAll();

      const cities = result.map((w) => w.city);
      majorCities.forEach((city) => {
        expect(cities).toContain(city);
      });
    });
  });

  // ==========================================================================
  // findOne() Method Tests
  // ==========================================================================

  describe('findOne()', () => {
    it('should return a warehouse by ID', async () => {
      const mockWarehouse = createMockWarehouse({ id: 1 });

      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);

      const result = await service.findOne(1);

      expect(warehouseRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result.id).toBe(1);
    });

    it('should return null when warehouse not found', async () => {
      warehouseRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('should return Damascus warehouse correctly', async () => {
      const damascusWarehouse = createMockWarehouse({
        id: 1,
        name: 'Damascus Central Warehouse',
        city: 'Damascus',
        latitude: 33.5138,
        longitude: 36.2765,
      });

      warehouseRepo.findOne.mockResolvedValue(damascusWarehouse);

      const result = await service.findOne(1);

      expect(result.name).toBe('Damascus Central Warehouse');
      expect(result.city).toBe('Damascus');
      expect(result.latitude).toBeCloseTo(33.5138, 4);
      expect(result.longitude).toBeCloseTo(36.2765, 4);
    });

    it('should return Aleppo warehouse correctly', async () => {
      const aleppoWarehouse = createMockWarehouse({
        id: 2,
        name: 'Aleppo Distribution Center',
        city: 'Aleppo',
        latitude: 36.2021,
        longitude: 37.1343,
      });

      warehouseRepo.findOne.mockResolvedValue(aleppoWarehouse);

      const result = await service.findOne(2);

      expect(result.name).toBe('Aleppo Distribution Center');
      expect(result.city).toBe('Aleppo');
    });
  });

  // ==========================================================================
  // Syrian Geographic Coverage Tests
  // ==========================================================================

  describe('Syrian Geographic Coverage', () => {
    it('should cover all 14 Syrian governorates', async () => {
      const governorates = [
        'Damascus', 'Aleppo', 'Homs', 'Hama', 'Latakia',
        'Tartus', 'Daraa', 'Sweida', 'Quneitra', 'Rif Dimashq',
        'Idlib', 'Deir ez-Zor', 'Raqqa', 'Al-Hasakah',
      ];

      const mockWarehouses = governorates.map((city, index) =>
        createMockWarehouse({
          id: index + 1,
          name: `${city} Warehouse`,
          city,
        }),
      );

      warehouseRepo.find.mockResolvedValue(mockWarehouses);

      const result = await service.findAll();

      expect(result).toHaveLength(14);
      const resultCities = result.map((w) => w.city);
      governorates.forEach((gov) => {
        expect(resultCities).toContain(gov);
      });
    });

    it('should have valid Syrian coordinates', async () => {
      // Syria bounding box: roughly 32.3°N to 37.3°N, 35.7°E to 42.4°E
      const mockWarehouses = SYRIAN_WAREHOUSES.map((w) => createMockWarehouse(w));

      warehouseRepo.find.mockResolvedValue(mockWarehouses);

      const result = await service.findAll();

      result.forEach((warehouse) => {
        if (warehouse.latitude && warehouse.longitude) {
          // Latitude should be between 32.3 and 37.3 (Syria bounds)
          expect(warehouse.latitude).toBeGreaterThanOrEqual(32.3);
          expect(warehouse.latitude).toBeLessThanOrEqual(37.3);
          
          // Longitude should be between 35.7 and 42.4 (Syria bounds)
          expect(warehouse.longitude).toBeGreaterThanOrEqual(35.7);
          expect(warehouse.longitude).toBeLessThanOrEqual(42.4);
        }
      });
    });

    it('should support coastal warehouses (Latakia, Tartus)', async () => {
      const coastalWarehouses = [
        createMockWarehouse({
          id: 3,
          name: 'Latakia Port Warehouse',
          city: 'Latakia',
          latitude: 35.5317,
          longitude: 35.7919,
        }),
        createMockWarehouse({
          id: 5,
          name: 'Tartus Coastal Hub',
          city: 'Tartus',
          latitude: 34.8894,
          longitude: 35.8867,
        }),
      ];

      warehouseRepo.find.mockResolvedValue(coastalWarehouses);

      const result = await service.findAll();

      const coastalCities = result.map((w) => w.city);
      expect(coastalCities).toContain('Latakia');
      expect(coastalCities).toContain('Tartus');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle warehouse with missing optional fields', async () => {
      const minimalWarehouse = createMockWarehouse({
        id: 1,
        name: 'Minimal Warehouse',
        city: null,
        address: null,
        latitude: null,
        longitude: null,
      });

      warehouseRepo.findOne.mockResolvedValue(minimalWarehouse);

      const result = await service.findOne(1);

      expect(result.name).toBe('Minimal Warehouse');
      expect(result.city).toBeNull();
    });

    it('should handle warehouse with Arabic characters in name', async () => {
      const arabicWarehouse = createMockWarehouse({
        id: 1,
        name: 'مستودع دمشق المركزي',
        city: 'دمشق',
        address: 'المنطقة الصناعية، كابون، دمشق',
      });

      warehouseRepo.findOne.mockResolvedValue(arabicWarehouse);

      const result = await service.findOne(1);

      expect(result.name).toBe('مستودع دمشق المركزي');
      expect(result.city).toBe('دمشق');
    });

    it('should handle multiple warehouse lookups efficiently', async () => {
      const warehouses = SYRIAN_WAREHOUSES.map((w) => createMockWarehouse(w));
      
      warehouses.forEach((w) => {
        warehouseRepo.findOne.mockResolvedValueOnce(w);
      });

      const startTime = Date.now();
      
      for (let i = 1; i <= 5; i++) {
        await service.findOne(i);
      }
      
      const endTime = Date.now();

      expect(warehouseRepo.findOne).toHaveBeenCalledTimes(5);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  // ==========================================================================
  // Data Integrity Tests
  // ==========================================================================

  describe('Data Integrity', () => {
    it('should return warehouses with valid date fields', async () => {
      const mockWarehouse = createMockWarehouse({
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-15'),
      });

      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);

      const result = await service.findOne(1);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.updatedAt >= result.createdAt).toBe(true);
    });

    it('should return consistent data on repeated calls', async () => {
      const mockWarehouse = createMockWarehouse({ id: 1 });

      warehouseRepo.findOne.mockResolvedValue(mockWarehouse);

      const result1 = await service.findOne(1);
      const result2 = await service.findOne(1);

      expect(result1.id).toBe(result2.id);
      expect(result1.name).toBe(result2.name);
    });
  });
});
