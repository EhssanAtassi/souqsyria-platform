/**
 * @file public-variants.service.ts
 * @description Service for public variant endpoints — fetches active variants
 * with stock status and option groups enriched with Attribute metadata (colorHex, Arabic names).
 *
 * @swagger
 * tags:
 *   - name: PublicVariantsService
 *     description: Public product variant data retrieval
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../variants/entities/product-variant.entity';
import { Attribute } from '../../../attributes/entities/attribute.entity';
import { AttributeValue } from '../../../attributes/entities/attribute-value.entity';
import {
  VariantResponseDto,
  VariantOptionGroupDto,
  VariantOptionValueDto,
} from '../dto/variant-options-response.dto';

@Injectable()
export class PublicVariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Attribute)
    private readonly attributeRepo: Repository<Attribute>,
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepo: Repository<AttributeValue>,
  ) {}

  /**
   * @description Fetches active variants for a product with computed stock status
   * @param productId - Product ID to fetch variants for
   * @returns Array of VariantResponseDto sorted by price ASC
   * @throws NotFoundException when no product exists with the given ID
   */
  async getActiveVariants(productId: number): Promise<VariantResponseDto[]> {
    const variants = await this.variantRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.stocks', 'stock')
      .innerJoin('v.product', 'product')
      .where('product.id = :productId', { productId })
      .andWhere('v.isActive = :isActive', { isActive: true })
      .orderBy('v.price', 'ASC')
      .getMany();

    return variants.map((variant) => {
      const totalStock = variant.stocks
        ? variant.stocks.reduce((sum, s) => sum + s.quantity, 0)
        : 0;

      return {
        id: variant.id,
        sku: variant.sku || null,
        name: this.deriveVariantName(variant.variantData),
        price: Number(variant.price),
        stockQuantity: totalStock,
        stockStatus: this.computeStockStatus(totalStock),
        imageUrl: variant.imageUrl || null,
        variantData: variant.variantData,
      };
    });
  }

  /**
   * @description Collects unique option groups from active variants, enriched
   * with Attribute metadata (Arabic name, type) and AttributeValue metadata (colorHex, valueAr).
   * @param productId - Product ID to derive option groups for
   * @returns Array of VariantOptionGroupDto
   */
  async getVariantOptions(productId: number): Promise<VariantOptionGroupDto[]> {
    const variants = await this.variantRepo
      .createQueryBuilder('v')
      .innerJoin('v.product', 'product')
      .where('product.id = :productId', { productId })
      .andWhere('v.isActive = :isActive', { isActive: true })
      .getMany();

    // Collect unique keys and values from variantData
    const keyValuesMap = new Map<string, Set<string>>();
    for (const variant of variants) {
      if (!variant.variantData) continue;
      for (const [key, value] of Object.entries(variant.variantData)) {
        if (!keyValuesMap.has(key)) {
          keyValuesMap.set(key, new Set());
        }
        keyValuesMap.get(key)!.add(value);
      }
    }

    const groups: VariantOptionGroupDto[] = [];

    for (const [key, valuesSet] of keyValuesMap) {
      // Look up the Attribute by English name to get Arabic name and type
      const attribute = await this.attributeRepo.findOne({
        where: { nameEn: key },
      });

      // Look up AttributeValues for colorHex and Arabic value names
      const attributeValues = attribute
        ? await this.attributeValueRepo.find({
            where: { attributeId: attribute.id, isActive: true },
            order: { displayOrder: 'ASC' },
          })
        : [];

      const values: VariantOptionValueDto[] = Array.from(valuesSet).map(
        (val) => {
          const attrVal = attributeValues.find((av) => av.valueEn === val);
          return {
            value: val,
            valueAr: attrVal?.valueAr || null,
            colorHex: attrVal?.colorHex || null,
            displayOrder: attrVal?.displayOrder ?? 0,
          };
        },
      );

      // Sort by displayOrder
      values.sort((a, b) => a.displayOrder - b.displayOrder);

      groups.push({
        optionName: key,
        optionNameAr: attribute?.nameAr || null,
        type: attribute?.type || 'select',
        values,
      });
    }

    return groups;
  }

  /**
   * @description Derives a human-readable name from variant data
   * @param variantData - Key-value variant attributes
   * @returns Joined string like "Red / XL"
   */
  private deriveVariantName(variantData: Record<string, string>): string {
    if (!variantData) return '';
    return Object.values(variantData).join(' / ');
  }

  /**
   * @description Computes stock status from total quantity
   * @param totalStock - Aggregate stock across warehouses
   * @returns Stock status string
   */
  private computeStockStatus(
    totalStock: number,
  ): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (totalStock > 5) return 'in_stock';
    if (totalStock >= 1) return 'low_stock';
    return 'out_of_stock';
  }
}
