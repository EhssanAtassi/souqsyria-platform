import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { SearchProductsDto } from '../dto/search.dto';

@Injectable()
export class ProductsSearchService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async search(filters: SearchProductsDto) {
    const {
      keyword,
      categoryId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .where(
        'product.isActive = true AND product.isPublished = true AND product.is_deleted = false',
      )
      .andWhere('pricing.isActive = true');

    if (keyword) {
      query.andWhere(
        '(product.nameEn LIKE :keyword OR product.nameAr LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId });
    }

    if (minPrice) {
      query.andWhere(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice >= :minPrice) OR (pricing.discountPrice IS NULL AND pricing.basePrice >= :minPrice)',
        { minPrice },
      );
    }

    if (maxPrice) {
      query.andWhere(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice <= :maxPrice) OR (pricing.discountPrice IS NULL AND pricing.basePrice <= :maxPrice)',
        { maxPrice },
      );
    }

    if (sortBy === 'price') {
      query.orderBy('pricing.discountPrice', sortOrder);
    } else if (sortBy === 'name') {
      query.orderBy('product.nameEn', sortOrder);
    } else {
      query.orderBy(`product.${sortBy}`, sortOrder);
    }

    const [data, total] = await query.skip(skip).take(take).getManyAndCount();

    return {
      data,
      total,
      page,
      limit: take,
    };
  }
}
