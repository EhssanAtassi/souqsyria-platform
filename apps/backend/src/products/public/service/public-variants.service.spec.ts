/**
 * @file public-variants.service.spec.ts
 * @description Unit tests for PublicVariantsService
 * Tests active variant retrieval, stock status computation, and option group enrichment
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PublicVariantsService } from './public-variants.service';
import { ProductVariant } from '../../variants/entities/product-variant.entity';
import { Attribute } from '../../../attributes/entities/attribute.entity';
import { AttributeValue } from '../../../attributes/entities/attribute-value.entity';

describe('PublicVariantsService', () => {
  let service: PublicVariantsService;
  let variantRepo: any;
  let attributeRepo: any;
  let attributeValueRepo: any;

  /** Helper to create a mock variant */
  const createMockVariant = (overrides: Partial<ProductVariant> = {}) => ({
    id: 1,
    sku: 'TEST-001',
    price: 100000,
    variantData: { Color: 'Red', Size: 'M' },
    imageUrl: 'https://example.com/red-m.jpg',
    isActive: true,
    stocks: [],
    ...overrides,
  });

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    variantRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    attributeRepo = { findOne: jest.fn().mockResolvedValue(null) };
    attributeValueRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicVariantsService,
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
        { provide: getRepositoryToken(Attribute), useValue: attributeRepo },
        { provide: getRepositoryToken(AttributeValue), useValue: attributeValueRepo },
      ],
    }).compile();

    service = module.get<PublicVariantsService>(PublicVariantsService);
  });

  describe('getActiveVariants', () => {
    it('should return only active variants sorted by price', async () => {
      const variants = [
        createMockVariant({ id: 1, price: 200000, stocks: [{ quantity: 10 }] as any }),
        createMockVariant({ id: 2, price: 100000, stocks: [{ quantity: 3 }] as any }),
      ];

      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue(variants);

      const result = await service.getActiveVariants(1);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should return empty array for product with no variants', async () => {
      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue([]);

      const result = await service.getActiveVariants(999);
      expect(result).toEqual([]);
    });

    it('should compute in_stock status when stock > 5', async () => {
      const variants = [
        createMockVariant({
          stocks: [{ quantity: 10 }, { quantity: 5 }] as any,
        }),
      ];

      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue(variants);

      const result = await service.getActiveVariants(1);
      expect(result[0].stockStatus).toBe('in_stock');
      expect(result[0].stockQuantity).toBe(15);
    });

    it('should compute low_stock status when stock is 1-5', async () => {
      const variants = [
        createMockVariant({
          stocks: [{ quantity: 3 }] as any,
        }),
      ];

      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue(variants);

      const result = await service.getActiveVariants(1);
      expect(result[0].stockStatus).toBe('low_stock');
    });

    it('should compute out_of_stock status when stock is 0', async () => {
      const variants = [
        createMockVariant({
          stocks: [{ quantity: 0 }] as any,
        }),
      ];

      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue(variants);

      const result = await service.getActiveVariants(1);
      expect(result[0].stockStatus).toBe('out_of_stock');
      expect(result[0].stockQuantity).toBe(0);
    });

    it('should derive variant name from variantData', async () => {
      const variants = [
        createMockVariant({ variantData: { Color: 'Blue', Storage: '256GB' } }),
      ];

      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue(variants);

      const result = await service.getActiveVariants(1);
      expect(result[0].name).toBe('Blue / 256GB');
    });
  });

  describe('getVariantOptions', () => {
    it('should derive option groups from variant data', async () => {
      const variants = [
        createMockVariant({ variantData: { Color: 'Red' } }),
        createMockVariant({ id: 2, variantData: { Color: 'Blue' } }),
      ];

      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue(variants);

      const result = await service.getVariantOptions(1);

      expect(result).toHaveLength(1);
      expect(result[0].optionName).toBe('Color');
      expect(result[0].values).toHaveLength(2);
    });

    it('should enrich with colorHex from AttributeValue', async () => {
      const variants = [
        createMockVariant({ variantData: { Color: 'Red' } }),
      ];

      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue(variants);

      attributeRepo.findOne.mockResolvedValue({
        id: 1,
        nameEn: 'Color',
        nameAr: 'اللون',
        type: 'color',
      });

      attributeValueRepo.find.mockResolvedValue([
        { valueEn: 'Red', valueAr: 'أحمر', colorHex: '#FF0000', displayOrder: 1, isActive: true },
      ]);

      const result = await service.getVariantOptions(1);

      expect(result[0].optionNameAr).toBe('اللون');
      expect(result[0].type).toBe('color');
      expect(result[0].values[0].colorHex).toBe('#FF0000');
      expect(result[0].values[0].valueAr).toBe('أحمر');
    });

    it('should return Arabic names for option groups', async () => {
      const variants = [
        createMockVariant({ variantData: { Size: 'XL' } }),
      ];

      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue(variants);

      attributeRepo.findOne.mockResolvedValue({
        id: 2,
        nameEn: 'Size',
        nameAr: 'المقاس',
        type: 'select',
      });

      attributeValueRepo.find.mockResolvedValue([
        { valueEn: 'XL', valueAr: 'كبير جداً', colorHex: null, displayOrder: 3, isActive: true },
      ]);

      const result = await service.getVariantOptions(1);

      expect(result[0].optionNameAr).toBe('المقاس');
      expect(result[0].values[0].valueAr).toBe('كبير جداً');
    });

    it('should return empty array for product with no active variants', async () => {
      const qb = variantRepo.createQueryBuilder();
      qb.getMany.mockResolvedValue([]);

      const result = await service.getVariantOptions(1);
      expect(result).toEqual([]);
    });
  });
});
