/**
 * @file variants.service.ts
 * @description Handles creation, update, listing, and deletion of product variants.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { StockService } from '../../stock/stock.service';
import { GetProductVariantsDto } from './dto/get-variants.dto';

@Injectable()
export class VariantsService {
  private readonly logger = new Logger(VariantsService.name);

  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly stockService: StockService,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  /**
   * Create a new variant for a given product.
   * @param productId Product ID to attach the variant to
   * @param dto Variant details (variantData, price, sku, etc.)
   */
  async create(productId: number, dto: CreateProductVariantDto) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // ✅ Enforce unique SKU
    if (dto.sku) {
      const existingSku = await this.variantRepo.findOne({
        where: { sku: dto.sku },
      });
      if (existingSku) throw new Error(`SKU "${dto.sku}" is already used`);
    }

    // ✅ Enforce unique slug
    if (dto.slug) {
      const existingSlug = await this.variantRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existingSlug) throw new Error(`Slug "${dto.slug}" is already used`);
    }

    const variant = this.variantRepo.create({ ...dto, product });
    const saved = await this.variantRepo.save(variant);
    this.logger.log(`Created variant ID ${saved.id} for product ${productId}`);
    // ✅ Optional: Initialize stock in selected warehouse
    const warehouseId = dto.warehouseId ?? 1; // fallback to default
    try {
      await this.stockService.adjustStock(
        saved.id,
        warehouseId,
        0,
        'in',
        'Init stock on variant creation',
      );
      this.logger.debug(
        `Initialized stock record for variant #${saved.id} in warehouse #${warehouseId}`,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Could not init stock for variant ${saved.id} in warehouse ${warehouseId}: ${(err as Error).message}`,
      );
    }
    return saved;
  }

  /**
   * Update an existing variant by ID.
   * @param id Variant ID
   * @param dto Fields to update (partial)
   */
  async update(id: number, dto: UpdateProductVariantDto) {
    const variant = await this.variantRepo.findOne({ where: { id } })!;
    if (!variant) throw new NotFoundException('Variant not found');
    // ✅ If SKU changed, ensure it's not duplicated
    if (dto.sku && dto.sku !== variant.sku) {
      const existingSku = await this.variantRepo.findOne({
        where: { sku: dto.sku },
      });
      if (existingSku) throw new Error(`SKU "${dto.sku}" is already used`);
    }

    // ✅ If slug changed, ensure it's not duplicated
    if (dto.slug && dto.slug !== variant.slug) {
      const existingSlug = await this.variantRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existingSlug) throw new Error(`Slug "${dto.slug}" is already used`);
    }
    Object.assign(variant, dto);
    const updated = await this.variantRepo.save(variant);

    this.logger.log(`Updated variant ID ${updated.id}`);
    return updated;
  }

  /**
   * @method findByProduct
   * @description List all variants for a product with optional isActive filter.
   * Includes total stock per variant from StockService.
   *
   * @param productId - ID of the parent product
   * @param filters - Optional filters (e.g., isActive)
   * @returns List of ProductVariant + stock quantity
   */
  async findByProduct(productId: number, filters: GetProductVariantsDto) {
    const query = this.variantRepo
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('variant.product_id = :productId', { productId });

    if (filters?.isActive !== undefined) {
      query.andWhere('variant.isActive = :isActive', {
        isActive: filters.isActive === 'true',
      });
    }

    const variants = await query.getMany();

    // 🟡 Add stock quantity to each result
    const enriched = await Promise.all(
      variants.map(async (variant) => {
        const quantity = await this.stockService.getStock(variant.id);
        return { ...variant, stockQuantity: quantity };
      }),
    );

    this.logger.log(
      `Listed ${enriched.length} variants for product #${productId} (activeOnly=${filters?.isActive})`,
    );

    return enriched;
  }

  /**
   * Delete a specific variant by ID.
   * @param id Variant ID
   */
  async delete(id: number) {
    const variant = await this.variantRepo.findOne({ where: { id } })!;
    if (!variant) throw new NotFoundException('Variant not found');

    await this.variantRepo.remove(variant);
    this.logger.warn(`Deleted variant ID ${id}`);
    return { message: 'Variant deleted' };
  }

  /**
   * @method remove
   * @description Deactivates a product variant (soft delete).
   * Marks the variant as inactive instead of removing it from the DB.
   * This is important for preserving historical sales/stock records.
   *
   * @param {number} id - Variant ID to deactivate
   * @returns {Promise<{ message: string }>} Success message
   * @throws NotFoundException if variant doesn't exist
   */
  async remove(id: number): Promise<{ message: string }> {
    const variant = await this.variantRepo.findOne({ where: { id } })!;
    if (!variant) throw new NotFoundException('Variant not found');

    variant.isActive = false;
    await this.variantRepo.save(variant);

    this.logger.warn(`Variant #${id} deactivated`);
    return { message: `Variant #${id} deactivated` };
  }
}
