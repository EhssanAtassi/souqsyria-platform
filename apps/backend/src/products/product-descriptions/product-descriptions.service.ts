import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductDescriptionEntity } from '../entities/product-description.entity';
import { ProductEntity } from '../entities/product.entity';
import { CreateProductDescriptionDto } from '../descriptions/dto/create-product-description.dto';
import { UpdateProductDescriptionDto } from '../descriptions/dto/update-product-description.dto';

@Injectable()
export class ProductDescriptionsService {
  constructor(
    @InjectRepository(ProductDescriptionEntity)
    private readonly descRepo: Repository<ProductDescriptionEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async create(productId: number, dto: CreateProductDescriptionDto) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const desc = this.descRepo.create({ ...dto, product });
    return this.descRepo.save(desc);
  }

  async update(id: number, dto: UpdateProductDescriptionDto) {
    const desc = await this.descRepo.findOne({ where: { id } })!;
    if (!desc) throw new NotFoundException('Description not found');
    Object.assign(desc, dto);
    return this.descRepo.save(desc);
  }

  async findByProduct(productId: number) {
    return this.descRepo.find({
      where: { product: { id: productId } },
      order: { language: 'ASC' },
    });
  }

  async delete(id: number) {
    const desc = await this.descRepo.findOne({ where: { id } })!;
    if (!desc) throw new NotFoundException('Description not found');
    return this.descRepo.remove(desc);
  }
}
