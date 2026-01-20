/**
 * @file pricing.service.ts
 * @description Manages product pricing with commission + payout logic.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ProductPriceEntity } from '../entities/product-price.entity';
import { ProductEntity } from '../../entities/product.entity';
import { CreateProductPriceDto } from '../dto/create-product-price.dto';
import { UpdateProductPriceDto } from '../dto/update-product-price.dto';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectRepository(ProductPriceEntity)
    private readonly priceRepo: Repository<ProductPriceEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  /**
   * Create a price record for a product
   */
  async create(productId: number, dto: CreateProductPriceDto) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const vendorReceives = this.calculateVendorReceives(
      dto.basePrice,
      dto.commissionRate,
    );

    const price = this.priceRepo.create({
      ...dto,
      product,
      vendorReceives,
    });

    const saved = await this.priceRepo.save(price);
    this.logger.log(
      `Created price for product #${productId} | ${dto.basePrice} ${dto.currency}`,
    );
    return saved;
  }

  /**
   * Update existing price record
   */
  async update(productId: number, dto: UpdateProductPriceDto) {
    const price = await this.priceRepo.findOne({
      where: { product: { id: productId } },
      relations: ['product'],
    });

    if (!price) throw new NotFoundException('Price record not found');

    if (dto.basePrice !== undefined) price.basePrice = dto.basePrice;
    if (dto.commissionRate !== undefined)
      price.commissionRate = dto.commissionRate;
    if (dto.currency !== undefined) price.currency = dto.currency;
    if (dto.isActive !== undefined) price.isActive = dto.isActive;

    // Recalculate vendor payout
    price.vendorReceives = this.calculateVendorReceives(
      price.basePrice,
      price.commissionRate,
    );

    const updated = await this.priceRepo.save(price);
    this.logger.log(`Updated price for product #${productId}`);
    return updated;
  }

  /**
   * Utility: Calculate vendor payout after commission
   */
  private calculateVendorReceives(base: number, commission: number) {
    return Number((base * (1 - commission)).toFixed(2));
  }

  /**
   * Get price for product
   */
  async getByProduct(productId: number) {
    return this.priceRepo.findOne({
      where: { product: { id: productId } },
    });
  }
}
