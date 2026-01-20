import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttribute } from '../entities/product-attribute.entity/product-attribute.entity';
import { SetProductAttributesDto } from '../dto/set-product-attributes.dto';

/**
 * Service responsible for assigning attribute-value pairs to products.
 * Used when a vendor/admin defines filters like Color = Red, Size = XL, etc.
 */
@Injectable()
export class ProductAttributeService {
  private readonly logger = new Logger(ProductAttributeService.name);

  constructor(
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepo: Repository<ProductAttribute>,
  ) {}

  /**
   * Replace all existing attribute-value pairs for a given product.
   * Called during the attribute assignment step.
   * @param productId - the product to update
   * @param dto - the new attribute-value pairs
   */
  async setAttributes(productId: number, dto: SetProductAttributesDto) {
    this.logger.log(`Updating attributes for product #${productId}`);

    // Step 1: Remove existing mappings
    const deleteResult = await this.productAttributeRepo.delete({
      product_id: productId,
    });
    this.logger.debug(`Removed ${deleteResult.affected} old attributes`);

    // Step 2: Save new mappings
    const mappings = dto.attributes.map((a) => ({
      product_id: productId,
      attribute_id: a.attribute_id,
      value_id: a.value_id,
    }));

    const saved = await this.productAttributeRepo.save(mappings);
    this.logger.log(
      `Saved ${saved.length} new attributes for product #${productId}`,
    );

    return saved;
  }

  /**
   * Fetch all attribute-value pairs for a given product.
   * Used to display product metadata in frontend/admin dashboard.
   */
  async getAttributes(productId: number) {
    this.logger.log(`Fetching attributes for product #${productId}`);

    const result = await this.productAttributeRepo.find({
      where: { product_id: productId },
      relations: ['attribute', 'value'], // eager load for full detail
    });

    this.logger.debug(`Found ${result.length} attributes`);
    return result;
  }
}
