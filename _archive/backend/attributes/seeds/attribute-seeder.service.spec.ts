/**
 * @file attribute-seeder.service.spec.ts
 * @description Unit tests for AttributeSeederService
 *
 * Tests the seeding logic, validation, and error handling
 * without requiring database connectivity for faster testing.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeSeederService } from './attribute-seeder.service';
import { Attribute } from '../entities/attribute.entity';
import { AttributeValue } from '../entities/attribute-value.entity';
import { AttributeType } from '../entities/attribute-types.enum';

describe('AttributeSeederService', () => {
  let service: AttributeSeederService;
  let attributeRepository: jest.Mocked<Repository<Attribute>>;
  let attributeValueRepository: jest.Mocked<Repository<AttributeValue>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributeSeederService,
        {
          provide: getRepositoryToken(Attribute),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(AttributeValue),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<AttributeSeederService>(AttributeSeederService);
    attributeRepository = module.get(getRepositoryToken(Attribute));
    attributeValueRepository = module.get(getRepositoryToken(AttributeValue));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🌱 Attribute Seeding', () => {
    it('should seed new attributes successfully', async () => {
      // Mock empty database (no existing attributes)
      attributeRepository.findOne.mockResolvedValue(null);
      attributeRepository.create.mockImplementation(
        (data) => data as Attribute,
      );
      attributeRepository.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 } as Attribute),
      );

      attributeValueRepository.findOne.mockResolvedValue(null);
      attributeValueRepository.create.mockImplementation(
        (data) => data as AttributeValue,
      );
      attributeValueRepository.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 } as AttributeValue),
      );

      const result = await service.seedAttributes();

      expect(result.success).toBe(true);
      expect(result.attributesCreated).toBeGreaterThan(0);
      expect(result.valuesCreated).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);

      // Verify that create and save were called
      expect(attributeRepository.create).toHaveBeenCalled();
      expect(attributeRepository.save).toHaveBeenCalled();
      expect(attributeValueRepository.create).toHaveBeenCalled();
      expect(attributeValueRepository.save).toHaveBeenCalled();
    });

    it('should handle existing attributes gracefully', async () => {
      // Mock existing attribute
      const existingAttribute = {
        id: 1,
        nameEn: 'Color',
        nameAr: 'اللون',
        type: AttributeType.COLOR,
        values: [],
      } as Attribute;

      attributeRepository.findOne.mockResolvedValue(existingAttribute);
      attributeRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      attributeValueRepository.findOne.mockResolvedValue(null);
      attributeValueRepository.create.mockImplementation(
        (data) => data as AttributeValue,
      );
      attributeValueRepository.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 } as AttributeValue),
      );

      const result = await service.seedAttributes();

      expect(result.success).toBe(true);
      expect(result.attributesCreated).toBe(0); // No new attributes created
      expect(result.valuesCreated).toBeGreaterThan(0); // Values still created
      expect(attributeRepository.update).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      attributeRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.seedAttributes();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Database connection failed');
    });
  });

  describe('📊 Statistics', () => {
    it('should return accurate statistics', async () => {
      // Mock statistics data
      attributeRepository.count.mockResolvedValueOnce(10); // total attributes
      attributeValueRepository.count.mockResolvedValue(52); // total values
      attributeRepository.count.mockResolvedValueOnce(10); // active attributes

      // Mock type breakdown query
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: 'select', count: '6' },
          { type: 'color', count: '1' },
          { type: 'multiselect', count: '1' },
          { type: 'number', count: '1' },
          { type: 'boolean', count: '1' },
        ]),
      };

      attributeRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const stats = await service.getStatistics();

      expect(stats.totalAttributes).toBe(10);
      expect(stats.totalValues).toBe(52);
      expect(stats.activeAttributes).toBe(10);
      expect(stats.attributesByType).toBeDefined();
      expect(stats.attributesByType.select).toBe(6);
      expect(stats.attributesByType.color).toBe(1);
    });
  });

  describe('✅ Data Validation', () => {
    it('should validate data integrity successfully', async () => {
      // Mock no validation issues
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };

      attributeRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const validation = await service.validateSeededData();

      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
      expect(validation.recommendations.length).toBe(0);
    });

    it('should detect validation issues', async () => {
      // Mock validation issues
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, nameEn: 'Test' }]), // Attribute without values
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ nameEn: 'Duplicate', count: '2' }]), // Duplicate names
        getCount: jest.fn().mockResolvedValue(1), // Missing translations
      };

      attributeRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const validation = await service.validateSeededData();

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('🧹 Cleanup Operations', () => {
    it('should cleanup attributes successfully', async () => {
      // Mock successful cleanup
      attributeValueRepository.delete.mockResolvedValue({
        affected: 52,
        raw: [],
      });
      attributeRepository.delete.mockResolvedValue({ affected: 10, raw: [] });

      const result = await service.cleanupAttributes();

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(10);
      expect(attributeValueRepository.delete).toHaveBeenCalledWith({});
      expect(attributeRepository.delete).toHaveBeenCalledWith({});
    });

    it('should handle cleanup errors gracefully', async () => {
      // Mock cleanup error
      attributeValueRepository.delete.mockRejectedValue(
        new Error('Foreign key constraint'),
      );

      const result = await service.cleanupAttributes();

      expect(result.success).toBe(false);
      expect(result.deleted).toBe(0);
    });
  });

  describe('🔍 Data Structure Validation', () => {
    it('should have proper seed data structure', () => {
      // Access private method through service instance
      const seedData = (service as any).getAttributeSeedData();

      expect(Array.isArray(seedData)).toBe(true);
      expect(seedData.length).toBeGreaterThan(0);

      // Validate each attribute has required fields
      seedData.forEach((attr) => {
        expect(attr.nameEn).toBeDefined();
        expect(attr.nameAr).toBeDefined();
        expect(attr.descriptionEn).toBeDefined();
        expect(attr.descriptionAr).toBeDefined();
        expect(attr.type).toBeDefined();
        expect(typeof attr.displayOrder).toBe('number');
        expect(typeof attr.isRequired).toBe('boolean');
        expect(typeof attr.isFilterable).toBe('boolean');
        expect(typeof attr.isSearchable).toBe('boolean');
        expect(Array.isArray(attr.values)).toBe(true);

        // Validate attribute values
        attr.values.forEach((value) => {
          expect(value.valueEn).toBeDefined();
          expect(value.valueAr).toBeDefined();
          expect(typeof value.displayOrder).toBe('number');
        });
      });
    });

    it('should include all required attribute types', () => {
      const seedData = (service as any).getAttributeSeedData();
      const types = seedData.map((attr) => attr.type);

      expect(types).toContain(AttributeType.COLOR);
      expect(types).toContain(AttributeType.SELECT);
      expect(types).toContain(AttributeType.MULTISELECT);
      expect(types).toContain(AttributeType.NUMBER);
    });

    it('should have proper Arabic translations', () => {
      const seedData = (service as any).getAttributeSeedData();

      seedData.forEach((attr) => {
        expect(attr.nameAr).not.toBe('');
        expect(attr.descriptionAr).not.toBe('');

        attr.values.forEach((value) => {
          expect(value.valueAr).not.toBe('');
        });
      });
    });

    it('should have color hex codes for color attributes', () => {
      const seedData = (service as any).getAttributeSeedData();
      const colorAttribute = seedData.find(
        (attr) => attr.type === AttributeType.COLOR,
      );

      expect(colorAttribute).toBeDefined();
      colorAttribute.values.forEach((value) => {
        expect(value.colorHex).toBeDefined();
        expect(value.colorHex).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});
