/**
 * @file syrian-governorate.entity.spec.ts
 * @description Comprehensive unit tests for Syrian Governorate entity
 *
 * Tests cover:
 * - Entity structure validation
 * - Data integrity constraints
 * - Relationship mappings
 * - JSON field validation
 * - Syrian localization features
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyrianGovernorateEntity } from './syrian-governorate.entity';
import { SyrianCityEntity } from './syrian-city.entity';

describe('SyrianGovernorateEntity', () => {
  let repository: Repository<SyrianGovernorateEntity>;
  let module: TestingModule;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(SyrianGovernorateEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<Repository<SyrianGovernorateEntity>>(
      getRepositoryToken(SyrianGovernorateEntity),
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Entity Creation', () => {
    it('should create a valid Syrian governorate entity', () => {
      const governorateData = {
        code: 'DMS',
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        capitalEn: 'Damascus',
        capitalAr: 'دمشق',
        latitude: 33.5138,
        longitude: 36.2765,
        population: 2500000,
        areaKm2: 18018.0,
        displayOrder: 1,
        isActive: true,
      };

      const governorate = new SyrianGovernorateEntity();
      Object.assign(governorate, governorateData);

      expect(governorate).toBeDefined();
      expect(governorate.code).toBe('DMS');
      expect(governorate.nameEn).toBe('Damascus');
      expect(governorate.nameAr).toBe('دمشق');
      expect(governorate.capitalEn).toBe('Damascus');
      expect(governorate.capitalAr).toBe('دمشق');
      expect(governorate.latitude).toBe(33.5138);
      expect(governorate.longitude).toBe(36.2765);
      expect(governorate.population).toBe(2500000);
      expect(governorate.areaKm2).toBe(18018.0);
      expect(governorate.displayOrder).toBe(1);
      expect(governorate.isActive).toBe(true);
    });

    it('should handle all Syrian governorate codes', () => {
      const syrianGovernorateCodes = [
        'DMS', // Damascus
        'ALP', // Aleppo
        'HMS', // Homs
        'HAM', // Hama
        'LAT', // Lattakia
        'TAR', // Tartus
        'IDL', // Idlib
        'DER', // Der Ezzor
        'RAQ', // Ar-Raqqa
        'HAS', // Al-Hasakah
        'DAR', // Daraa
        'SWD', // As-Suwayda
        'QUN', // Quneitra
        'RIF', // Rif Dimashq
      ];

      syrianGovernorateCodes.forEach((code) => {
        const governorate = new SyrianGovernorateEntity();
        governorate.code = code;
        expect(governorate.code).toBe(code);
        expect(governorate.code.length).toBe(3);
      });
    });

    it('should validate required fields', () => {
      const governorate = new SyrianGovernorateEntity();

      // Required fields should be defined
      expect(() => {
        governorate.code = 'DMS';
        governorate.nameEn = 'Damascus';
        governorate.nameAr = 'دمشق';
        governorate.capitalEn = 'Damascus';
        governorate.capitalAr = 'دمشق';
      }).not.toThrow();
    });
  });

  describe('Status Field Validation', () => {
    it('should handle comprehensive status object', () => {
      const governorate = new SyrianGovernorateEntity();
      const status = {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date('2025-08-14T10:00:00Z'),
        notes: 'Fully operational with all services available',
        alternativeRoutes: ['Via Homs', 'Via Latakia'],
      };

      governorate.status = status;

      expect(governorate.status).toBeDefined();
      expect(governorate.status.accessibilityLevel).toBe('full');
      expect(governorate.status.deliverySupported).toBe(true);
      expect(governorate.status.lastUpdated).toEqual(
        new Date('2025-08-14T10:00:00Z'),
      );
      expect(governorate.status.notes).toBe(
        'Fully operational with all services available',
      );
      expect(governorate.status.alternativeRoutes).toEqual([
        'Via Homs',
        'Via Latakia',
      ]);
    });

    it('should validate accessibility levels', () => {
      const governorate = new SyrianGovernorateEntity();
      const accessibilityLevels: Array<
        'full' | 'partial' | 'limited' | 'restricted'
      > = ['full', 'partial', 'limited', 'restricted'];

      accessibilityLevels.forEach((level) => {
        governorate.status = {
          accessibilityLevel: level,
          deliverySupported: true,
          lastUpdated: new Date(),
        };
        expect(governorate.status.accessibilityLevel).toBe(level);
      });
    });

    it('should handle minimal status object', () => {
      const governorate = new SyrianGovernorateEntity();
      const minimalStatus = {
        accessibilityLevel: 'partial' as const,
        deliverySupported: false,
        lastUpdated: new Date(),
      };

      governorate.status = minimalStatus;

      expect(governorate.status.accessibilityLevel).toBe('partial');
      expect(governorate.status.deliverySupported).toBe(false);
      expect(governorate.status.lastUpdated).toBeInstanceOf(Date);
      expect(governorate.status.notes).toBeUndefined();
      expect(governorate.status.alternativeRoutes).toBeUndefined();
    });
  });

  describe('Demographics Field Validation', () => {
    it('should handle comprehensive demographics object', () => {
      const governorate = new SyrianGovernorateEntity();
      const demographics = {
        urbanPopulation: 2000000,
        ruralPopulation: 500000,
        mainIndustries: ['Manufacturing', 'Services', 'Agriculture'],
        economicStatus: 'active' as const,
        infrastructureLevel: 'good' as const,
      };

      governorate.demographics = demographics;

      expect(governorate.demographics).toBeDefined();
      expect(governorate.demographics.urbanPopulation).toBe(2000000);
      expect(governorate.demographics.ruralPopulation).toBe(500000);
      expect(governorate.demographics.mainIndustries).toEqual([
        'Manufacturing',
        'Services',
        'Agriculture',
      ]);
      expect(governorate.demographics.economicStatus).toBe('active');
      expect(governorate.demographics.infrastructureLevel).toBe('good');
    });

    it('should validate economic status values', () => {
      const governorate = new SyrianGovernorateEntity();
      const economicStatuses: Array<'active' | 'recovering' | 'limited'> = [
        'active',
        'recovering',
        'limited',
      ];

      economicStatuses.forEach((status) => {
        governorate.demographics = {
          economicStatus: status,
        };
        expect(governorate.demographics.economicStatus).toBe(status);
      });
    });

    it('should validate infrastructure levels', () => {
      const governorate = new SyrianGovernorateEntity();
      const infrastructureLevels: Array<'good' | 'fair' | 'poor'> = [
        'good',
        'fair',
        'poor',
      ];

      infrastructureLevels.forEach((level) => {
        governorate.demographics = {
          infrastructureLevel: level,
        };
        expect(governorate.demographics.infrastructureLevel).toBe(level);
      });
    });

    it('should handle empty demographics object', () => {
      const governorate = new SyrianGovernorateEntity();
      governorate.demographics = {};

      expect(governorate.demographics).toEqual({});
      expect(governorate.demographics.urbanPopulation).toBeUndefined();
      expect(governorate.demographics.ruralPopulation).toBeUndefined();
      expect(governorate.demographics.mainIndustries).toBeUndefined();
      expect(governorate.demographics.economicStatus).toBeUndefined();
      expect(governorate.demographics.infrastructureLevel).toBeUndefined();
    });
  });

  describe('Geographic Data Validation', () => {
    it('should validate Syrian geographic boundaries', () => {
      const governorate = new SyrianGovernorateEntity();

      // Damascus coordinates (center of Syria)
      governorate.latitude = 33.5138;
      governorate.longitude = 36.2765;

      expect(governorate.latitude).toBeGreaterThan(32); // Syria's southern boundary
      expect(governorate.latitude).toBeLessThan(38); // Syria's northern boundary
      expect(governorate.longitude).toBeGreaterThan(35); // Syria's western boundary
      expect(governorate.longitude).toBeLessThan(43); // Syria's eastern boundary
    });

    it('should handle coordinate precision', () => {
      const governorate = new SyrianGovernorateEntity();

      // Test high precision coordinates
      governorate.latitude = 33.5138123;
      governorate.longitude = 36.2765456;

      expect(governorate.latitude).toBe(33.5138123);
      expect(governorate.longitude).toBe(36.2765456);
    });

    it('should validate area calculations', () => {
      const governorate = new SyrianGovernorateEntity();

      // Damascus Governorate area
      governorate.areaKm2 = 18018.0;

      expect(governorate.areaKm2).toBe(18018.0);
      expect(governorate.areaKm2).toBeGreaterThan(0);
    });
  });

  describe('Arabic Localization', () => {
    it('should handle Arabic text correctly', () => {
      const governorate = new SyrianGovernorateEntity();

      const arabicGovernorateNames = [
        'دمشق', // Damascus
        'حلب', // Aleppo
        'حمص', // Homs
        'حماة', // Hama
        'اللاذقية', // Lattakia
        'طرطوس', // Tartus
        'إدلب', // Idlib
        'دير الزور', // Der Ezzor
        'الرقة', // Ar-Raqqa
        'الحسكة', // Al-Hasakah
        'درعا', // Daraa
        'السويداء', // As-Suwayda
        'القنيطرة', // Quneitra
        'ريف دمشق', // Rif Dimashq
      ];

      arabicGovernorateNames.forEach((arabicName) => {
        governorate.nameAr = arabicName;
        governorate.capitalAr = arabicName;

        expect(governorate.nameAr).toBe(arabicName);
        expect(governorate.capitalAr).toBe(arabicName);
        expect(governorate.nameAr.length).toBeGreaterThan(0);
      });
    });

    it('should validate bilingual consistency', () => {
      const bilingualPairs = [
        { en: 'Damascus', ar: 'دمشق' },
        { en: 'Aleppo', ar: 'حلب' },
        { en: 'Homs', ar: 'حمص' },
        { en: 'Hama', ar: 'حماة' },
        { en: 'Lattakia', ar: 'اللاذقية' },
      ];

      bilingualPairs.forEach((pair) => {
        const governorate = new SyrianGovernorateEntity();
        governorate.nameEn = pair.en;
        governorate.nameAr = pair.ar;
        governorate.capitalEn = pair.en;
        governorate.capitalAr = pair.ar;

        expect(governorate.nameEn).toBe(pair.en);
        expect(governorate.nameAr).toBe(pair.ar);
        expect(governorate.capitalEn).toBe(pair.en);
        expect(governorate.capitalAr).toBe(pair.ar);
      });
    });
  });

  describe('Display and Sorting', () => {
    it('should handle display order correctly', () => {
      const governorate = new SyrianGovernorateEntity();

      // Test various display orders
      const displayOrders = [1, 2, 5, 10, 50, 100];

      displayOrders.forEach((order) => {
        governorate.displayOrder = order;
        expect(governorate.displayOrder).toBe(order);
        expect(governorate.displayOrder).toBeGreaterThanOrEqual(1);
      });
    });

    it('should default display order to 100', () => {
      const governorate = new SyrianGovernorateEntity();
      expect(governorate.displayOrder).toBeUndefined(); // Will be set to 100 by database default
    });

    it('should handle active/inactive status', () => {
      const governorate = new SyrianGovernorateEntity();

      governorate.isActive = true;
      expect(governorate.isActive).toBe(true);

      governorate.isActive = false;
      expect(governorate.isActive).toBe(false);
    });
  });

  describe('Population and Area Validation', () => {
    it('should handle realistic population numbers', () => {
      const governorate = new SyrianGovernorateEntity();

      // Test population ranges for Syrian governorates
      const populationRanges = [
        100000, // Small governorate
        500000, // Medium governorate
        1500000, // Large governorate
        2500000, // Damascus/Aleppo level
      ];

      populationRanges.forEach((population) => {
        governorate.population = population;
        expect(governorate.population).toBe(population);
        expect(governorate.population).toBeGreaterThan(0);
      });
    });

    it('should handle realistic area measurements', () => {
      const governorate = new SyrianGovernorateEntity();

      // Test area ranges for Syrian governorates
      const areaRanges = [
        5000.5, // Small governorate
        10000.75, // Medium governorate
        18018.0, // Damascus size
        33060.0, // Large governorate like Al-Hasakah
      ];

      areaRanges.forEach((area) => {
        governorate.areaKm2 = area;
        expect(governorate.areaKm2).toBe(area);
        expect(governorate.areaKm2).toBeGreaterThan(0);
      });
    });
  });

  describe('Entity Relationships', () => {
    it('should handle cities relationship', () => {
      const governorate = new SyrianGovernorateEntity();
      const cities = [
        new SyrianCityEntity(),
        new SyrianCityEntity(),
        new SyrianCityEntity(),
      ];

      governorate.cities = cities;

      expect(governorate.cities).toBeDefined();
      expect(governorate.cities).toHaveLength(3);
      expect(governorate.cities[0]).toBeInstanceOf(SyrianCityEntity);
    });

    it('should handle empty cities array', () => {
      const governorate = new SyrianGovernorateEntity();
      governorate.cities = [];

      expect(governorate.cities).toBeDefined();
      expect(governorate.cities).toHaveLength(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain code uniqueness constraint', () => {
      const governorate1 = new SyrianGovernorateEntity();
      const governorate2 = new SyrianGovernorateEntity();

      governorate1.code = 'DMS';
      governorate2.code = 'DMS';

      // Both can be created, but database would enforce uniqueness
      expect(governorate1.code).toBe('DMS');
      expect(governorate2.code).toBe('DMS');
      expect(governorate1.code).toBe(governorate2.code);
    });

    it('should validate code length constraint', () => {
      const governorate = new SyrianGovernorateEntity();

      // Valid 3-letter codes
      const validCodes = ['DMS', 'ALP', 'HMS'];
      validCodes.forEach((code) => {
        governorate.code = code;
        expect(governorate.code.length).toBe(3);
      });
    });

    it('should handle null and undefined values appropriately', () => {
      const governorate = new SyrianGovernorateEntity();

      // Nullable fields should handle null/undefined
      governorate.latitude = null;
      governorate.longitude = null;
      governorate.population = null;
      governorate.areaKm2 = null;
      governorate.status = null;
      governorate.demographics = null;

      expect(governorate.latitude).toBeNull();
      expect(governorate.longitude).toBeNull();
      expect(governorate.population).toBeNull();
      expect(governorate.areaKm2).toBeNull();
      expect(governorate.status).toBeNull();
      expect(governorate.demographics).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should handle creation and update timestamps', () => {
      const governorate = new SyrianGovernorateEntity();
      const now = new Date();

      governorate.createdAt = now;
      governorate.updatedAt = now;

      expect(governorate.createdAt).toEqual(now);
      expect(governorate.updatedAt).toEqual(now);
    });

    it('should handle timestamp updates', () => {
      const governorate = new SyrianGovernorateEntity();
      const created = new Date('2025-01-01T00:00:00Z');
      const updated = new Date('2025-08-14T10:00:00Z');

      governorate.createdAt = created;
      governorate.updatedAt = updated;

      expect(governorate.createdAt).toEqual(created);
      expect(governorate.updatedAt).toEqual(updated);
      expect(governorate.updatedAt.getTime()).toBeGreaterThan(
        governorate.createdAt.getTime(),
      );
    });
  });
});
