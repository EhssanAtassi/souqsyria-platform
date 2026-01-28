/**
 * @file descriptions.service.ts
 * @description Handles all product multi-language descriptions: add, update, list, delete.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductDescriptionEntity } from '../entities/product-description.entity';
import { ProductEntity } from '../entities/product.entity';
import { CreateProductDescriptionDto } from './dto/create-product-description.dto';
import { UpdateProductDescriptionDto } from './dto/update-product-description.dto';

@Injectable()
export class DescriptionsService {
  private readonly logger = new Logger(DescriptionsService.name);

  constructor(
    @InjectRepository(ProductDescriptionEntity)
    private readonly descRepo: Repository<ProductDescriptionEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  /**
   * Add a single product description (for ar/en)
   */
  async create(productId: number, dto: CreateProductDescriptionDto) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const entity = this.descRepo.create({ ...dto, product });
    const saved = await this.descRepo.save(entity);
    this.logger.log(
      `Added ${dto.language} description for product #${productId}`,
    );
    return saved;
  }

  /**
   * Update a single description by ID
   */
  async update(id: number, dto: UpdateProductDescriptionDto) {
    const desc = await this.descRepo.findOne({ where: { id } })!;
    if (!desc) throw new NotFoundException('Description not found');

    Object.assign(desc, dto);
    const saved = await this.descRepo.save(desc);
    this.logger.log(`Updated description #${id}`);
    return saved;
  }

  /**
   * Return all language descriptions for a product
   */
  async findByProduct(productId: number) {
    const descriptions = await this.descRepo.find({
      where: { product: { id: productId } },
      order: { language: 'ASC' },
    });
    this.logger.log(
      `Fetched ${descriptions.length} descriptions for product #${productId}`,
    );
    return descriptions;
  }

  /**
   * Delete a single description by ID
   */
  async delete(id: number) {
    const desc = await this.descRepo.findOne({ where: { id } })!;
    if (!desc) throw new NotFoundException('Description not found');

    await this.descRepo.remove(desc);
    this.logger.warn(`Deleted description #${id}`);
    return { message: `Description #${id} deleted` };
  }

  /**
   * Replace all descriptions (used during full product update)
   */
  async replaceDescriptions(
    productId: number,
    dtos: CreateProductDescriptionDto[],
  ) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.descRepo.delete({ product: { id: productId } });

    const newEntities = dtos.map((dto) =>
      this.descRepo.create({ ...dto, product }),
    );

    const saved = await this.descRepo.save(newEntities);
    this.logger.debug(
      `Replaced with ${saved.length} descriptions for product #${productId}`,
    );
    return saved;
  }
}
