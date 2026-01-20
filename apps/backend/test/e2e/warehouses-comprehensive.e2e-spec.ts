/**
 * @file warehouses-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Syrian Warehouses management system
 *
 * COMPREHENSIVE TESTING COVERAGE:
 * - Warehouse seeding with comprehensive Syrian multi-location data validation
 * - Geographic distribution across Syrian governorates and strategic locations
 * - Warehouse capacity management and inventory allocation optimization
 * - Multi-warehouse inventory tracking and stock distribution analytics
 * - Syrian logistics optimization and shipping route calculation
 * - Warehouse performance metrics and operational efficiency tracking
 * - Integration with stock management and order fulfillment systems
 * - Bulk warehouse operations with performance validation
 * - Geographic optimization for Syrian market and cross-border logistics
 * - Warehouse security and access control validation
 * - Data integrity verification and comprehensive error handling
 * - System performance under load and concurrent operations
 *
 * @author SouqSyria Development Team
 * @since 2025-08-21
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

// Core modules
import { AppModule } from '../../src/app.module';
import { WarehousesModule } from '../../src/warehouses/warehouses.module';

// Services and Controllers
import { WarehouseSeederService } from '../../src/warehouses/seeds/warehouse-seeder.service';
import { WarehousesService } from '../../src/warehouses/warehouses.service';

// Entities
import { Warehouse } from '../../src/warehouses/entities/warehouse.entity';

// Test utilities
import { TestDataHelper } from '../helpers/test-data-helper';
import { ValidationHelper } from '../helpers/validation-helper';

describe('Warehouses System - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let warehouseSeederService: WarehouseSeederService;
  let warehousesService: WarehousesService;
  let testDataHelper: TestDataHelper;
  let validationHelper: ValidationHelper;

  // Test configuration
  const TEST_CONFIG = {
    PERFORMANCE_THRESHOLDS: {
      SEED_GENERATION_TIME: 25000, // 25 seconds
      API_RESPONSE_TIME: 3000, // 3 seconds
      BULK_OPERATION_TIME: 10000, // 10 seconds
      SEARCH_RESPONSE_TIME: 2000, // 2 seconds
      ANALYTICS_RESPONSE_TIME: 4000, // 4 seconds
    },
    VALIDATION_RULES: {
      MIN_WAREHOUSES: 15, // Minimum number of warehouses across Syria
      MIN_SYRIAN_GOVERNORATES: 8, // Should cover at least 8 governorates
      MIN_WAREHOUSE_CAPACITY: 1000, // Minimum capacity in cubic meters
      MAX_WAREHOUSE_CAPACITY: 50000, // Maximum capacity in cubic meters
      REQUIRED_FIELDS: ['name', 'code', 'address', 'status', 'type'],
      WAREHOUSE_TYPES: ['main', 'regional', 'local', 'distribution', 'storage'],
      WAREHOUSE_STATUSES: ['active', 'inactive', 'maintenance', 'planned'],
    },
    SYRIAN_VALIDATION: {
      MAJOR_CITIES: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'],
      BORDER_AREAS: ['Daraa', 'Qamishli', 'Al-Hasakah'],
      STRATEGIC_LOCATIONS: ['Damascus Airport', 'Latakia Port', 'Aleppo Industrial'],
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, WarehousesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services and dependencies
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    warehouseSeederService = moduleFixture.get<WarehouseSeederService>(WarehouseSeederService);
    warehousesService = moduleFixture.get<WarehousesService>(WarehousesService);

    // Initialize test helpers
    testDataHelper = new TestDataHelper(dataSource);
    validationHelper = new ValidationHelper();

    // Clear existing test data
    await testDataHelper.clearWarehouseData();
  });

  afterAll(async () => {
    await testDataHelper.clearWarehouseData();
    await app.close();
  });

  describe('Warehouse Seeding System', () => {
    it('should seed comprehensive Syrian warehouse network within performance threshold', async () => {
      const startTime = Date.now();

      const result = await request(app.getHttpServer())
        .post('/warehouses/seed')
        .expect(201);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance validation
      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEED_GENERATION_TIME);

      // Validate response structure
      expect(result.body).toHaveProperty('success', true);
      expect(result.body).toHaveProperty('warehouses_created');
      expect(result.body).toHaveProperty('governorates_covered');
      expect(result.body).toHaveProperty('total_capacity');
      expect(result.body).toHaveProperty('warehouse_types_distribution');

      // Validate minimum data requirements
      expect(result.body.warehouses_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_WAREHOUSES);
      expect(result.body.governorates_covered).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SYRIAN_GOVERNORATES);
      expect(result.body.total_capacity).toBeGreaterThan(0);
    });

    it('should validate warehouse data structure and Syrian geographic distribution', async () => {
      const warehouses = await dataSource.getRepository(Warehouse).find();

      expect(warehouses.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_WAREHOUSES);

      // Track geographic distribution
      const governoratesFound = new Set();
      const citiesFound = new Set();
      const warehouseTypeCount = {};

      for (const warehouse of warehouses) {
        // Required fields validation
        TEST_CONFIG.VALIDATION_RULES.REQUIRED_FIELDS.forEach(field => {
          expect(warehouse[field]).toBeDefined();
          expect(warehouse[field]).not.toBeNull();
        });

        // Warehouse code validation (should be unique)
        expect(warehouse.code).toMatch(/^WH-[A-Z0-9]{4,8}$/);

        // Warehouse type validation
        expect(TEST_CONFIG.VALIDATION_RULES.WAREHOUSE_TYPES).toContain(warehouse.type);
        warehouseTypeCount[warehouse.type] = (warehouseTypeCount[warehouse.type] || 0) + 1;

        // Status validation
        expect(TEST_CONFIG.VALIDATION_RULES.WAREHOUSE_STATUSES).toContain(warehouse.status);

        // Capacity validation
        if (warehouse.capacity_cubic_meters) {
          expect(warehouse.capacity_cubic_meters).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_WAREHOUSE_CAPACITY);
          expect(warehouse.capacity_cubic_meters).toBeLessThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MAX_WAREHOUSE_CAPACITY);
        }

        // Geographic validation
        expect(warehouse.address).toBeDefined();
        expect(warehouse.city).toBeDefined();
        expect(warehouse.governorate).toBeDefined();

        governoratesFound.add(warehouse.governorate);
        citiesFound.add(warehouse.city);

        // Coordinates validation (if present)
        if (warehouse.latitude && warehouse.longitude) {
          // Syria latitude range: approximately 32°-37° N
          expect(warehouse.latitude).toBeGreaterThanOrEqual(32);
          expect(warehouse.latitude).toBeLessThanOrEqual(37);
          
          // Syria longitude range: approximately 35°-42° E
          expect(warehouse.longitude).toBeGreaterThanOrEqual(35);
          expect(warehouse.longitude).toBeLessThanOrEqual(42);
        }

        // Contact information validation
        if (warehouse.phone) {
          expect(warehouse.phone).toMatch(/^\+963\d{8,9}$/); // Syrian phone format
        }

        if (warehouse.email) {
          expect(warehouse.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        }
      }

      // Validate geographic coverage
      expect(governoratesFound.size).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SYRIAN_GOVERNORATES);

      // Validate presence of major Syrian cities
      const majorCitiesFound = TEST_CONFIG.SYRIAN_VALIDATION.MAJOR_CITIES.filter(city => 
        citiesFound.has(city)
      );
      expect(majorCitiesFound.length).toBeGreaterThanOrEqual(3);

      // Validate warehouse type distribution
      expect(Object.keys(warehouseTypeCount).length).toBeGreaterThanOrEqual(3);
      expect(warehouseTypeCount.main).toBeGreaterThanOrEqual(1); // At least one main warehouse
    });

    it('should validate strategic warehouse locations for Syrian logistics', async () => {
      const warehouses = await dataSource.getRepository(Warehouse).find();

      // Check for strategic locations
      const strategicWarehouses = warehouses.filter(warehouse => 
        TEST_CONFIG.SYRIAN_VALIDATION.STRATEGIC_LOCATIONS.some(location => 
          warehouse.name.includes(location.split(' ')[0]) || 
          warehouse.address.includes(location.split(' ')[0])
        )
      );

      expect(strategicWarehouses.length).toBeGreaterThanOrEqual(2);

      // Validate border area coverage for cross-border trade
      const borderWarehouses = warehouses.filter(warehouse =>
        TEST_CONFIG.SYRIAN_VALIDATION.BORDER_AREAS.some(area =>
          warehouse.city.includes(area) || warehouse.governorate.includes(area)
        )
      );

      expect(borderWarehouses.length).toBeGreaterThanOrEqual(1);

      // Validate main distribution centers in major cities
      const mainWarehouses = warehouses.filter(warehouse => 
        warehouse.type === 'main' && 
        TEST_CONFIG.SYRIAN_VALIDATION.MAJOR_CITIES.some(city => 
          warehouse.city.includes(city)
        )
      );

      expect(mainWarehouses.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Warehouse API Endpoints', () => {
    beforeEach(async () => {
      await warehouseSeederService.seedWarehouses();
    });

    it('should retrieve all warehouses with filtering and pagination', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/warehouses')
        .query({ 
          page: 1, 
          limit: 20,
          status: 'active',
          type: 'main'
        })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);

      // Validate response structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(20);

      // Validate warehouse data structure
      response.body.data.forEach(warehouse => {
        expect(warehouse).toHaveProperty('id');
        expect(warehouse).toHaveProperty('name');
        expect(warehouse).toHaveProperty('code');
        expect(warehouse).toHaveProperty('status', 'active');
        expect(warehouse).toHaveProperty('type', 'main');
        expect(warehouse).toHaveProperty('address');
        expect(warehouse).toHaveProperty('city');
        expect(warehouse).toHaveProperty('governorate');
      });
    });

    it('should search warehouses by location and capabilities', async () => {
      const response = await request(app.getHttpServer())
        .get('/warehouses/search')
        .query({
          city: 'Damascus',
          governorate: 'Damascus',
          type: 'regional',
          min_capacity: 5000,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      response.body.forEach(warehouse => {
        expect(warehouse.city).toContain('Damascus');
        expect(warehouse.governorate).toContain('Damascus');
        expect(warehouse.type).toBe('regional');
        if (warehouse.capacity_cubic_meters) {
          expect(warehouse.capacity_cubic_meters).toBeGreaterThanOrEqual(5000);
        }
      });
    });

    it('should retrieve warehouse details with inventory information', async () => {
      // Get a warehouse to test with
      const warehouses = await dataSource.getRepository(Warehouse).find({ take: 1 });
      expect(warehouses.length).toBeGreaterThan(0);

      const warehouse = warehouses[0];

      const response = await request(app.getHttpServer())
        .get(`/warehouses/${warehouse.id}`)
        .query({ include_inventory: true })
        .expect(200);

      expect(response.body).toHaveProperty('id', warehouse.id);
      expect(response.body).toHaveProperty('name', warehouse.name);
      expect(response.body).toHaveProperty('code', warehouse.code);
      expect(response.body).toHaveProperty('inventory_summary');
      expect(response.body).toHaveProperty('utilization_rate');
    });

    it('should provide warehouse capacity and utilization analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/warehouses/analytics/capacity')
        .expect(200);

      expect(response.body).toHaveProperty('total_warehouses');
      expect(response.body).toHaveProperty('total_capacity');
      expect(response.body).toHaveProperty('utilized_capacity');
      expect(response.body).toHaveProperty('utilization_percentage');
      expect(response.body).toHaveProperty('capacity_by_governorate');
      expect(response.body).toHaveProperty('capacity_by_type');

      // Validate analytics data
      expect(response.body.total_warehouses).toBeGreaterThan(0);
      expect(response.body.total_capacity).toBeGreaterThan(0);
      expect(response.body.utilization_percentage).toBeGreaterThanOrEqual(0);
      expect(response.body.utilization_percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Warehouse Geographic Operations', () => {
    beforeEach(async () => {
      await warehouseSeederService.seedWarehouses();
    });

    it('should find nearest warehouses to a given location', async () => {
      const response = await request(app.getHttpServer())
        .get('/warehouses/nearest')
        .query({
          latitude: 33.5138,  // Damascus coordinates
          longitude: 36.2765,
          radius_km: 50,
          limit: 5,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);

      response.body.forEach(warehouse => {
        expect(warehouse).toHaveProperty('id');
        expect(warehouse).toHaveProperty('name');
        expect(warehouse).toHaveProperty('distance_km');
        expect(warehouse.distance_km).toBeLessThanOrEqual(50);
      });

      // Validate sorting by distance
      for (let i = 1; i < response.body.length; i++) {
        expect(response.body[i].distance_km).toBeGreaterThanOrEqual(response.body[i-1].distance_km);
      }
    });

    it('should provide delivery route optimization', async () => {
      const response = await request(app.getHttpServer())
        .post('/warehouses/optimize-routes')
        .send({
          origin_warehouse_id: 1,
          destinations: [
            { latitude: 33.5138, longitude: 36.2765, address: 'Damascus Center' },
            { latitude: 36.2021, longitude: 37.1343, address: 'Aleppo Center' },
            { latitude: 34.7394, longitude: 36.7163, address: 'Homs Center' },
          ],
          vehicle_type: 'truck',
          optimization_goal: 'shortest_time',
        })
        .expect(200);

      expect(response.body).toHaveProperty('optimized_route');
      expect(response.body).toHaveProperty('total_distance_km');
      expect(response.body).toHaveProperty('estimated_time_hours');
      expect(response.body).toHaveProperty('route_segments');

      expect(Array.isArray(response.body.optimized_route)).toBe(true);
      expect(Array.isArray(response.body.route_segments)).toBe(true);
      expect(response.body.total_distance_km).toBeGreaterThan(0);
      expect(response.body.estimated_time_hours).toBeGreaterThan(0);
    });

    it('should handle governorate-based warehouse distribution analysis', async () => {
      const response = await request(app.getHttpServer())
        .get('/warehouses/analytics/distribution')
        .expect(200);

      expect(response.body).toHaveProperty('governorate_distribution');
      expect(response.body).toHaveProperty('coverage_analysis');
      expect(response.body).toHaveProperty('optimization_recommendations');

      expect(Array.isArray(response.body.governorate_distribution)).toBe(true);
      
      response.body.governorate_distribution.forEach(govDistribution => {
        expect(govDistribution).toHaveProperty('governorate');
        expect(govDistribution).toHaveProperty('warehouse_count');
        expect(govDistribution).toHaveProperty('total_capacity');
        expect(govDistribution.warehouse_count).toBeGreaterThanOrEqual(0);
        expect(govDistribution.total_capacity).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Warehouse Operations and Management', () => {
    beforeEach(async () => {
      await warehouseSeederService.seedWarehouses();
    });

    it('should handle warehouse status updates and transitions', async () => {
      // Get an active warehouse
      const warehouse = await dataSource.getRepository(Warehouse).findOne({
        where: { status: 'active' },
      });

      expect(warehouse).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/warehouses/${warehouse.id}/status`)
        .send({
          status: 'maintenance',
          reason: 'Scheduled maintenance for equipment upgrade',
          expected_duration_hours: 24,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('previous_status', 'active');
      expect(response.body).toHaveProperty('new_status', 'maintenance');

      // Verify status change in database
      const updatedWarehouse = await dataSource.getRepository(Warehouse).findOne({
        where: { id: warehouse.id },
      });

      expect(updatedWarehouse.status).toBe('maintenance');
    });

    it('should manage warehouse capacity and utilization', async () => {
      const warehouse = await dataSource.getRepository(Warehouse).findOne({
        where: { status: 'active' },
      });

      const response = await request(app.getHttpServer())
        .put(`/warehouses/${warehouse.id}/capacity`)
        .send({
          capacity_cubic_meters: 15000,
          capacity_weight_kg: 5000000, // 5000 tons
          number_of_zones: 8,
          special_storage_areas: ['refrigerated', 'hazardous', 'electronics'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('capacity_updated', true);
      expect(response.body).toHaveProperty('new_capacity', 15000);
    });

    it('should handle bulk warehouse operations efficiently', async () => {
      const startTime = Date.now();

      const warehouseIds = [1, 2, 3, 4, 5];

      const response = await request(app.getHttpServer())
        .patch('/warehouses/bulk/update')
        .send({
          warehouse_ids: warehouseIds,
          updates: {
            operational_hours: '08:00-18:00',
            security_level: 'high',
            insurance_coverage: true,
          },
        })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('updated_count');
      expect(response.body.updated_count).toBeLessThanOrEqual(warehouseIds.length);
    });
  });

  describe('Integration with Stock Management', () => {
    beforeEach(async () => {
      await warehouseSeederService.seedWarehouses();
    });

    it('should provide warehouse stock allocation recommendations', async () => {
      const response = await request(app.getHttpServer())
        .post('/warehouses/stock/allocate')
        .send({
          products: [
            { product_id: 1, variant_id: 1, quantity: 100 },
            { product_id: 2, variant_id: 2, quantity: 50 },
          ],
          target_governorates: ['Damascus', 'Aleppo', 'Homs'],
          allocation_strategy: 'balanced_distribution',
        })
        .expect(200);

      expect(response.body).toHaveProperty('allocation_plan');
      expect(response.body).toHaveProperty('warehouse_assignments');
      expect(response.body).toHaveProperty('efficiency_score');

      expect(Array.isArray(response.body.allocation_plan)).toBe(true);
      expect(Array.isArray(response.body.warehouse_assignments)).toBe(true);

      response.body.warehouse_assignments.forEach(assignment => {
        expect(assignment).toHaveProperty('warehouse_id');
        expect(assignment).toHaveProperty('product_allocations');
        expect(assignment).toHaveProperty('total_volume');
        expect(assignment).toHaveProperty('capacity_utilization');
      });
    });

    it('should handle inventory transfer between warehouses', async () => {
      const response = await request(app.getHttpServer())
        .post('/warehouses/transfer')
        .send({
          from_warehouse_id: 1,
          to_warehouse_id: 2,
          items: [
            { product_id: 1, variant_id: 1, quantity: 20 },
            { product_id: 2, variant_id: 2, quantity: 15 },
          ],
          transfer_reason: 'Stock rebalancing',
          priority: 'normal',
        })
        .expect(201);

      expect(response.body).toHaveProperty('transfer_id');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('estimated_completion');
      expect(response.body).toHaveProperty('tracking_number');
    });
  });

  describe('Data Integrity and Business Rules', () => {
    it('should maintain warehouse code uniqueness', async () => {
      const warehouses = await dataSource.getRepository(Warehouse).find();

      const warehouseCodes = warehouses.map(warehouse => warehouse.code);
      const uniqueCodes = new Set(warehouseCodes);

      expect(warehouseCodes.length).toBe(uniqueCodes.size);
    });

    it('should validate warehouse capacity constraints', async () => {
      const warehouses = await dataSource.getRepository(Warehouse).find();

      for (const warehouse of warehouses) {
        // Capacity should be reasonable
        if (warehouse.capacity_cubic_meters) {
          expect(warehouse.capacity_cubic_meters).toBeGreaterThan(0);
          expect(warehouse.capacity_cubic_meters).toBeLessThan(100000); // 100k cubic meters max
        }

        // Weight capacity should align with volume capacity
        if (warehouse.capacity_weight_kg && warehouse.capacity_cubic_meters) {
          const densityRatio = warehouse.capacity_weight_kg / warehouse.capacity_cubic_meters;
          expect(densityRatio).toBeGreaterThan(10); // At least 10kg per cubic meter
          expect(densityRatio).toBeLessThan(1000); // At most 1000kg per cubic meter
        }

        // Coordinates should be within Syria if specified
        if (warehouse.latitude && warehouse.longitude) {
          expect(warehouse.latitude).toBeGreaterThanOrEqual(32);
          expect(warehouse.latitude).toBeLessThanOrEqual(37);
          expect(warehouse.longitude).toBeGreaterThanOrEqual(35);
          expect(warehouse.longitude).toBeLessThanOrEqual(42);
        }
      }
    });

    it('should validate warehouse operational hours format', async () => {
      const warehouses = await dataSource.getRepository(Warehouse).find();

      for (const warehouse of warehouses) {
        if (warehouse.operational_hours) {
          // Should be in format "HH:MM-HH:MM"
          expect(warehouse.operational_hours).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid warehouse ID gracefully', async () => {
      await request(app.getHttpServer())
        .get('/warehouses/99999')
        .expect(404);
    });

    it('should handle invalid geographic coordinates', async () => {
      await request(app.getHttpServer())
        .get('/warehouses/nearest')
        .query({
          latitude: 999, // Invalid latitude
          longitude: 999, // Invalid longitude
          radius_km: 50,
        })
        .expect(400);
    });

    it('should handle warehouse capacity overflow scenarios', async () => {
      const warehouse = await dataSource.getRepository(Warehouse).findOne({
        where: { status: 'active' },
      });

      await request(app.getHttpServer())
        .put(`/warehouses/${warehouse.id}/capacity`)
        .send({
          capacity_cubic_meters: -1000, // Negative capacity
        })
        .expect(400);
    });

    it('should handle concurrent warehouse operations', async () => {
      const warehouse = await dataSource.getRepository(Warehouse).findOne({
        where: { status: 'active' },
      });

      const promises = Array(5).fill(0).map(() =>
        request(app.getHttpServer())
          .patch(`/warehouses/${warehouse.id}/status`)
          .send({
            status: 'maintenance',
            reason: 'Concurrent test',
          })
      );

      const results = await Promise.all(promises);
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('System Performance Under Load', () => {
    it('should maintain performance under concurrent warehouse lookups', async () => {
      const startTime = Date.now();

      const promises = Array(20).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/warehouses')
          .query({ page: 1, limit: 10 })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 3);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should handle high-volume warehouse analytics efficiently', async () => {
      const startTime = Date.now();

      const promises = [
        request(app.getHttpServer()).get('/warehouses/analytics/capacity'),
        request(app.getHttpServer()).get('/warehouses/analytics/distribution'),
        request(app.getHttpServer()).get('/warehouses/analytics/utilization'),
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should optimize warehouse search performance', async () => {
      const searchQueries = [
        { city: 'Damascus' },
        { governorate: 'Aleppo' },
        { type: 'regional' },
        { status: 'active' },
        { min_capacity: 10000 },
      ];
      
      const startTime = Date.now();

      const promises = searchQueries.map(query =>
        request(app.getHttpServer())
          .get('/warehouses/search')
          .query(query)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME * searchQueries.length);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });
});