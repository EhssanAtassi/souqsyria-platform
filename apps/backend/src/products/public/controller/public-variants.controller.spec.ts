/**
 * @file public-variants.controller.spec.ts
 * @description Unit tests for PublicVariantsController
 * Tests endpoint responses and parameter passing
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PublicVariantsController } from './public-variants.controller';
import { PublicVariantsService } from '../service/public-variants.service';

describe('PublicVariantsController', () => {
  let controller: PublicVariantsController;
  let service: jest.Mocked<PublicVariantsService>;

  beforeEach(async () => {
    const mockService = {
      getActiveVariants: jest.fn().mockResolvedValue([]),
      getVariantOptions: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicVariantsController],
      providers: [{ provide: PublicVariantsService, useValue: mockService }],
    }).compile();

    controller = module.get<PublicVariantsController>(PublicVariantsController);
    service = module.get(PublicVariantsService);
  });

  describe('GET /products/:productId/variants', () => {
    it('should return data array of active variants', async () => {
      const mockVariants = [
        { id: 1, sku: 'V-001', name: 'Red / M', price: 100000, stockQuantity: 10, stockStatus: 'in_stock', imageUrl: null, variantData: { Color: 'Red' } },
      ];
      service.getActiveVariants.mockResolvedValue(mockVariants as any);

      const result = await controller.getActiveVariants(1);

      expect(result).toEqual({ data: mockVariants });
      expect(service.getActiveVariants).toHaveBeenCalledWith(1);
    });

    it('should return empty data array for product with no variants', async () => {
      service.getActiveVariants.mockResolvedValue([]);

      const result = await controller.getActiveVariants(999);

      expect(result).toEqual({ data: [] });
    });
  });

  describe('GET /products/:productId/variants/options', () => {
    it('should return data array of option groups', async () => {
      const mockGroups = [
        {
          optionName: 'Color',
          optionNameAr: 'اللون',
          type: 'color',
          values: [{ value: 'Red', valueAr: 'أحمر', colorHex: '#FF0000', displayOrder: 1 }],
        },
      ];
      service.getVariantOptions.mockResolvedValue(mockGroups as any);

      const result = await controller.getVariantOptions(1);

      expect(result).toEqual({ data: mockGroups });
      expect(service.getVariantOptions).toHaveBeenCalledWith(1);
    });

    it('should pass productId to service', async () => {
      await controller.getVariantOptions(42);
      expect(service.getVariantOptions).toHaveBeenCalledWith(42);
    });
  });
});
