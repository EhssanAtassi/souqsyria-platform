import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { GetPublicProductsDto } from './get-public-products.dto';

describe('GetPublicProductsDto', () => {
  /**
   * Test suite for cross-field validation of price range.
   * Ensures minPrice <= maxPrice when both are provided.
   */
  describe('Price range validation', () => {
    /**
     * Test case: Valid price range where minPrice <= maxPrice.
     * Should pass validation without errors.
     */
    it('should pass validation when minPrice <= maxPrice', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        minPrice: 100,
        maxPrice: 500,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    /**
     * Test case: Equal price bounds.
     * Should pass validation when minPrice === maxPrice.
     */
    it('should pass validation when minPrice === maxPrice', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        minPrice: 200,
        maxPrice: 200,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    /**
     * Test case: Invalid price range where minPrice > maxPrice.
     * Should fail validation with appropriate error message.
     */
    it('should fail validation when minPrice > maxPrice', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        minPrice: 500,
        maxPrice: 100,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('maxPrice');
      expect(errors[0].constraints).toHaveProperty('isPriceRangeValid');
      expect(errors[0].constraints?.isPriceRangeValid).toBe(
        'minPrice must be less than or equal to maxPrice',
      );
    });

    /**
     * Test case: Only minPrice provided.
     * Should pass validation as cross-field validation only applies when both are present.
     */
    it('should pass validation when only minPrice is provided', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        minPrice: 100,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    /**
     * Test case: Only maxPrice provided.
     * Should pass validation as cross-field validation only applies when both are present.
     */
    it('should pass validation when only maxPrice is provided', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        maxPrice: 500,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    /**
     * Test case: Neither price field provided.
     * Should pass validation as price filters are optional.
     */
    it('should pass validation when neither price is provided', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        page: 1,
        limit: 20,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  /**
   * Test suite for individual field validations.
   * Ensures all field constraints work correctly.
   */
  describe('Individual field validation', () => {
    /**
     * Test case: Negative minPrice.
     * Should fail validation as price cannot be negative.
     */
    it('should fail validation when minPrice is negative', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        minPrice: -100,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('minPrice');
    });

    /**
     * Test case: Negative maxPrice.
     * Should fail validation as price cannot be negative.
     */
    it('should fail validation when maxPrice is negative', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        maxPrice: -500,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('maxPrice');
    });

    /**
     * Test case: Non-integer minPrice.
     * Should fail validation as prices must be integers.
     */
    it('should fail validation when minPrice is not an integer', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        minPrice: 99.99,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('minPrice');
    });

    /**
     * Test case: Valid full DTO with all optional fields.
     * Should pass validation when all fields are correctly provided.
     */
    it('should pass validation with all valid optional fields', async () => {
      const dto = plainToClass(GetPublicProductsDto, {
        search: 'Damascus Steel',
        categoryId: 1,
        manufacturerId: 2,
        minPrice: 50000,
        maxPrice: 500000,
        page: 2,
        limit: 50,
        sortBy: 'price_asc',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
