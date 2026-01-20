/**
 * @file warehouses-seeding-simple.spec.ts
 * @description Simple unit tests for Warehouse Seeding System
 * Tests seed data validation and business logic
 */

import {
  ALL_WAREHOUSE_SEEDS,
  DAMASCUS_WAREHOUSES,
  WAREHOUSE_STATISTICS,
  WarehouseSeedData,
} from './warehouse-seeds.data';

describe('Warehouse Seeding Data Validation', () => {
  describe('Seed Data Structure', () => {
    it('should have valid seed data structure', () => {
      expect(ALL_WAREHOUSE_SEEDS).toBeDefined();
      expect(Array.isArray(ALL_WAREHOUSE_SEEDS)).toBe(true);
      expect(ALL_WAREHOUSE_SEEDS.length).toBe(8);
      expect(WAREHOUSE_STATISTICS.total).toBe(8);
    });

    it('should have consistent statistics', () => {
      expect(WAREHOUSE_STATISTICS.total).toBe(ALL_WAREHOUSE_SEEDS.length);
      expect(WAREHOUSE_STATISTICS.damascus).toBe(2);
      expect(WAREHOUSE_STATISTICS.aleppo).toBe(1);
      expect(WAREHOUSE_STATISTICS.latakia).toBe(1);
      expect(WAREHOUSE_STATISTICS.homs).toBe(1);
      expect(WAREHOUSE_STATISTICS.daraa).toBe(1);
      expect(WAREHOUSE_STATISTICS.localDepots).toBe(2);

      // Check totals add up
      const sum =
        WAREHOUSE_STATISTICS.damascus +
        WAREHOUSE_STATISTICS.aleppo +
        WAREHOUSE_STATISTICS.latakia +
        WAREHOUSE_STATISTICS.homs +
        WAREHOUSE_STATISTICS.daraa +
        WAREHOUSE_STATISTICS.localDepots;
      expect(sum).toBe(WAREHOUSE_STATISTICS.total);
    });

    it('should have correct capacity statistics', () => {
      const actualTotal = ALL_WAREHOUSE_SEEDS.reduce(
        (sum, w) => sum + w.capacity,
        0,
      );
      const actualAverage = Math.round(
        actualTotal / ALL_WAREHOUSE_SEEDS.length,
      );

      expect(WAREHOUSE_STATISTICS.totalCapacity).toBe(actualTotal);
      expect(WAREHOUSE_STATISTICS.averageCapacity).toBe(actualAverage);
      expect(WAREHOUSE_STATISTICS.totalCapacity).toBeGreaterThan(60000); // Should be 65,500+
    });
  });

  describe('Required Fields Validation', () => {
    it('should have all required fields for each warehouse', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse, index) => {
        // Required string fields
        expect(warehouse.name).toBeTruthy();
        expect(warehouse.nameAr).toBeTruthy();
        expect(warehouse.city).toBeTruthy();
        expect(warehouse.cityAr).toBeTruthy();
        expect(warehouse.address).toBeTruthy();
        expect(warehouse.addressAr).toBeTruthy();
        expect(warehouse.governorate).toBeTruthy();
        expect(warehouse.governorateAr).toBeTruthy();

        // Required numeric fields
        expect(warehouse.latitude).toBeDefined();
        expect(warehouse.longitude).toBeDefined();
        expect(warehouse.capacity).toBeGreaterThan(0);
        expect(warehouse.establishedYear).toBeGreaterThan(2015);
        expect(warehouse.establishedYear).toBeLessThanOrEqual(2025);

        // Required enum fields
        expect([
          'main_hub',
          'regional_center',
          'local_depot',
          'specialized',
        ]).toContain(warehouse.warehouseType);
        expect(['high', 'medium', 'low']).toContain(warehouse.priorityLevel);

        // Required array fields
        expect(Array.isArray(warehouse.features)).toBe(true);
        expect(Array.isArray(warehouse.featuresAr)).toBe(true);
        expect(Array.isArray(warehouse.servesRegions)).toBe(true);
        expect(Array.isArray(warehouse.servesRegionsAr)).toBe(true);
        expect(warehouse.features.length).toBeGreaterThan(0);
        expect(warehouse.featuresAr.length).toBeGreaterThan(0);
      });
    });

    it('should have valid contact information', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        expect(warehouse.contactPhone).toBeTruthy();
        expect(warehouse.contactPhone).toMatch(/^\+963/); // Syrian phone numbers
        expect(warehouse.managerName).toBeTruthy();
        expect(warehouse.managerNameAr).toBeTruthy();
        expect(warehouse.operationalHours).toBeTruthy();
        expect(warehouse.operationalHoursAr).toBeTruthy();
      });
    });
  });

  describe('Geographic Validation', () => {
    it('should have valid Syrian coordinates', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        // Syria boundaries: lat 32.0-37.5, lng 35.0-42.0
        expect(warehouse.latitude).toBeGreaterThanOrEqual(32.0);
        expect(warehouse.latitude).toBeLessThanOrEqual(37.5);
        expect(warehouse.longitude).toBeGreaterThanOrEqual(35.0);
        expect(warehouse.longitude).toBeLessThanOrEqual(42.0);
      });
    });

    it('should cover major Syrian governorates', () => {
      const governorates = new Set(
        ALL_WAREHOUSE_SEEDS.map((w) => w.governorate),
      );

      expect(governorates.size).toBeGreaterThanOrEqual(6);
      expect(governorates).toContain('Damascus');
      expect(governorates).toContain('Aleppo');
      expect(governorates).toContain('Latakia');
      expect(governorates).toContain('Homs');
      expect(governorates).toContain('Daraa');
      expect(governorates).toContain('Tartus');
    });

    it('should have realistic coordinates for known cities', () => {
      const damascusWarehouses = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.governorate === 'Damascus',
      );
      const aleppoWarehouses = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.governorate === 'Aleppo',
      );
      const latakiaWarehouses = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.governorate === 'Latakia',
      );

      // Damascus coordinates should be around 33.5138, 36.2765
      damascusWarehouses.forEach((w) => {
        expect(w.latitude).toBeGreaterThan(33.0);
        expect(w.latitude).toBeLessThan(34.0);
        expect(w.longitude).toBeGreaterThan(36.0);
        expect(w.longitude).toBeLessThan(37.0);
      });

      // Aleppo coordinates should be around 36.2021, 37.1343
      aleppoWarehouses.forEach((w) => {
        expect(w.latitude).toBeGreaterThan(36.0);
        expect(w.latitude).toBeLessThan(37.0);
        expect(w.longitude).toBeGreaterThan(37.0);
        expect(w.longitude).toBeLessThan(38.0);
      });

      // Latakia coordinates should be around 35.5208, 35.7925
      latakiaWarehouses.forEach((w) => {
        expect(w.latitude).toBeGreaterThan(35.0);
        expect(w.latitude).toBeLessThan(36.0);
        expect(w.longitude).toBeGreaterThan(35.0);
        expect(w.longitude).toBeLessThan(36.0);
      });
    });
  });

  describe('Warehouse Type Distribution', () => {
    it('should have proper warehouse type distribution', () => {
      const types = ALL_WAREHOUSE_SEEDS.map((w) => w.warehouseType);
      const typeDistribution = {
        main_hub: types.filter((t) => t === 'main_hub').length,
        regional_center: types.filter((t) => t === 'regional_center').length,
        local_depot: types.filter((t) => t === 'local_depot').length,
        specialized: types.filter((t) => t === 'specialized').length,
      };

      expect(typeDistribution.main_hub).toBeGreaterThan(0);
      expect(typeDistribution.regional_center).toBeGreaterThan(0);
      expect(typeDistribution.local_depot).toBeGreaterThan(0);

      // Verify statistics match
      expect(typeDistribution.main_hub).toBe(
        WAREHOUSE_STATISTICS.byType.main_hub,
      );
      expect(typeDistribution.regional_center).toBe(
        WAREHOUSE_STATISTICS.byType.regional_center,
      );
      expect(typeDistribution.local_depot).toBe(
        WAREHOUSE_STATISTICS.byType.local_depot,
      );
      expect(typeDistribution.specialized).toBe(
        WAREHOUSE_STATISTICS.byType.specialized,
      );
    });

    it('should have appropriate capacity for warehouse types', () => {
      const mainHubs = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.warehouseType === 'main_hub',
      );
      const regionalCenters = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.warehouseType === 'regional_center',
      );
      const localDepots = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.warehouseType === 'local_depot',
      );

      // Main hubs should have the largest capacity
      const avgMainHubCapacity =
        mainHubs.reduce((sum, w) => sum + w.capacity, 0) / mainHubs.length;
      const avgRegionalCapacity =
        regionalCenters.reduce((sum, w) => sum + w.capacity, 0) /
        regionalCenters.length;
      const avgLocalCapacity =
        localDepots.reduce((sum, w) => sum + w.capacity, 0) /
        localDepots.length;

      expect(avgMainHubCapacity).toBeGreaterThan(avgRegionalCapacity);
      expect(avgRegionalCapacity).toBeGreaterThan(avgLocalCapacity);
    });
  });

  describe('Priority Level Distribution', () => {
    it('should have balanced priority distribution', () => {
      const priorities = ALL_WAREHOUSE_SEEDS.map((w) => w.priorityLevel);
      const priorityDistribution = {
        high: priorities.filter((p) => p === 'high').length,
        medium: priorities.filter((p) => p === 'medium').length,
        low: priorities.filter((p) => p === 'low').length,
      };

      expect(priorityDistribution.high).toBeGreaterThan(0);
      expect(priorityDistribution.medium).toBeGreaterThan(0);
      expect(priorityDistribution.low).toBeGreaterThan(0);

      // Verify statistics match
      expect(priorityDistribution.high).toBe(
        WAREHOUSE_STATISTICS.priorityDistribution.high,
      );
      expect(priorityDistribution.medium).toBe(
        WAREHOUSE_STATISTICS.priorityDistribution.medium,
      );
      expect(priorityDistribution.low).toBe(
        WAREHOUSE_STATISTICS.priorityDistribution.low,
      );
    });

    it('should assign higher priority to strategic locations', () => {
      const damascusWarehouses = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.governorate === 'Damascus',
      );
      const aleppoWarehouses = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.governorate === 'Aleppo',
      );
      const latakiaWarehouses = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.governorate === 'Latakia',
      );

      // Major cities should have high priority warehouses
      expect(damascusWarehouses.some((w) => w.priorityLevel === 'high')).toBe(
        true,
      );
      expect(aleppoWarehouses.some((w) => w.priorityLevel === 'high')).toBe(
        true,
      );
      expect(latakiaWarehouses.some((w) => w.priorityLevel === 'high')).toBe(
        true,
      );
    });
  });

  describe('Arabic Localization', () => {
    it('should have proper Arabic translations', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        expect(warehouse.nameAr).toBeTruthy();
        expect(warehouse.cityAr).toBeTruthy();
        expect(warehouse.addressAr).toBeTruthy();
        expect(warehouse.governorateAr).toBeTruthy();
        expect(warehouse.managerNameAr).toBeTruthy();
        expect(warehouse.operationalHoursAr).toBeTruthy();

        // Arabic features should match English features count
        expect(warehouse.featuresAr.length).toBe(warehouse.features.length);
        expect(warehouse.servesRegionsAr.length).toBe(
          warehouse.servesRegions.length,
        );
      });
    });

    it('should contain Arabic text in Arabic fields', () => {
      const arabicRegex = /[\u0600-\u06FF]/;

      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        expect(arabicRegex.test(warehouse.nameAr)).toBe(true);
        expect(arabicRegex.test(warehouse.cityAr)).toBe(true);
        expect(arabicRegex.test(warehouse.addressAr)).toBe(true);
        expect(arabicRegex.test(warehouse.governorateAr)).toBe(true);
        expect(arabicRegex.test(warehouse.managerNameAr)).toBe(true);

        // At least some features should have Arabic text
        expect(warehouse.featuresAr.some((f) => arabicRegex.test(f))).toBe(
          true,
        );
        expect(warehouse.servesRegionsAr.some((r) => arabicRegex.test(r))).toBe(
          true,
        );
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should have specialized warehouses for specific categories', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        if (warehouse.specializedFor) {
          expect(Array.isArray(warehouse.specializedFor)).toBe(true);
          expect(warehouse.specializedFor.length).toBeGreaterThan(0);

          // Valid category specializations
          warehouse.specializedFor.forEach((category) => {
            expect([
              'electronics',
              'fashion',
              'food-beverages',
              'home-garden',
              'books-education',
            ]).toContain(category);
          });
        }
      });
    });

    it('should have port connectivity for coastal warehouses', () => {
      const coastalWarehouses = ALL_WAREHOUSE_SEEDS.filter(
        (w) => w.governorate === 'Latakia' || w.governorate === 'Tartus',
      );

      expect(coastalWarehouses.length).toBeGreaterThan(0);

      coastalWarehouses.forEach((warehouse) => {
        const hasPortFeatures = warehouse.features.some(
          (f) =>
            f.toLowerCase().includes('port') ||
            f.toLowerCase().includes('import') ||
            f.toLowerCase().includes('export') ||
            f.toLowerCase().includes('marine') ||
            f.toLowerCase().includes('shipping') ||
            f.toLowerCase().includes('coastal'),
        );

        expect(hasPortFeatures).toBe(true);
      });
    });

    it('should have appropriate serving regions', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        expect(warehouse.servesRegions.length).toBeGreaterThan(0);
        expect(warehouse.servesRegionsAr.length).toBeGreaterThan(0);

        // Warehouse should serve its own governorate
        expect(warehouse.servesRegions).toContain(warehouse.governorate);
        expect(warehouse.servesRegionsAr).toContain(warehouse.governorateAr);
      });
    });

    it('should have realistic establishment years', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        expect(warehouse.establishedYear).toBeGreaterThanOrEqual(2017);
        expect(warehouse.establishedYear).toBeLessThanOrEqual(2022);
      });
    });
  });

  describe('Data Consistency', () => {
    it('should have unique warehouse names', () => {
      const names = ALL_WAREHOUSE_SEEDS.map((w) => w.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have unique Arabic warehouse names', () => {
      const arabicNames = ALL_WAREHOUSE_SEEDS.map((w) => w.nameAr);
      const uniqueArabicNames = new Set(arabicNames);
      expect(uniqueArabicNames.size).toBe(arabicNames.length);
    });

    it('should have unique coordinates', () => {
      const coordinates = ALL_WAREHOUSE_SEEDS.map(
        (w) => `${w.latitude},${w.longitude}`,
      );
      const uniqueCoordinates = new Set(coordinates);
      expect(uniqueCoordinates.size).toBe(coordinates.length);
    });

    it('should have consistent bilingual manager names', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        expect(warehouse.managerName).toBeTruthy();
        expect(warehouse.managerNameAr).toBeTruthy();
        expect(warehouse.managerName).not.toBe(warehouse.managerNameAr);
      });
    });
  });

  describe('Regional Data Consistency', () => {
    it('should have correct Damascus warehouse data', () => {
      expect(DAMASCUS_WAREHOUSES.length).toBe(2);
      // Damascus region includes both Damascus city and Rif Dimashq
      const governorates = DAMASCUS_WAREHOUSES.map((w) => w.governorate);
      expect(governorates).toContain('Damascus');
      expect(governorates).toContain('Rif Dimashq');
    });

    it('should include Damascus warehouses in main dataset', () => {
      DAMASCUS_WAREHOUSES.forEach((damascusWarehouse) => {
        const found = ALL_WAREHOUSE_SEEDS.find(
          (w) => w.name === damascusWarehouse.name,
        );
        expect(found).toBeDefined();
        expect(found).toEqual(damascusWarehouse);
      });
    });
  });
});
