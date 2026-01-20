import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../entities/product.entity';
import { Repository } from 'typeorm';
import { GetProductsDto } from './dto/get-products.dto';
import { ToggleProductStatusDto } from './dto/toggle-status.dto';
import { BulkProductStatusDto } from './dto/bulk-status.dto';
import { StockService } from '../../stock/stock.service';
import { Category } from '../../categories/entities/category.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { ManufacturerEntity } from '../../manufacturers/entities/manufacturer.entity';
import { ProductDescriptionEntity } from '../entities/product-description.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductAttribute } from '../entities/product-attribute.entity/product-attribute.entity';
import { ProductFeatureEntity } from '../../features/entities/product-feature.entity';
import { ProductVariant } from '../variants/entities/product-variant.entity';

@Injectable()
export class AdminProductsService {
  private logger = new Logger('AdminProductsService');
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly stockService: StockService,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(VendorEntity)
    private readonly vendorRepo: Repository<VendorEntity>,

    @InjectRepository(ManufacturerEntity)
    private readonly manufacturerRepo: Repository<ManufacturerEntity>,

    @InjectRepository(ProductDescriptionEntity)
    private readonly descriptionRepo: Repository<ProductDescriptionEntity>,

    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,

    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepo: Repository<ProductAttribute>,

    @InjectRepository(ProductFeatureEntity)
    private readonly productFeatureRepo: Repository<ProductFeatureEntity>,

    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  async findAllPaginated(filters: GetProductsDto) {
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .leftJoinAndSelect('product.manufacturer', 'manufacturer')
      .where('product.is_deleted = false');

    if (filters.categoryId)
      query.andWhere('product.category_id = :catId', {
        catId: parseInt(filters.categoryId),
      });

    if (filters.vendorId)
      query.andWhere('product.vendor_id = :vendorId', {
        vendorId: parseInt(filters.vendorId),
      });

    if (filters.isActive !== undefined)
      query.andWhere('product.isActive = :isActive', {
        isActive: filters.isActive === 'true',
      });

    if (filters.isPublished !== undefined)
      query.andWhere('product.isPublished = :isPublished', {
        isPublished: filters.isPublished === 'true',
      });

    if (filters.search)
      query.andWhere('product.nameEn LIKE :search', {
        search: `%${filters.search}%`,
      });

    const [data, total] = await query
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async toggleStatus(id: number, dto: ToggleProductStatusDto) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    if (dto.isPublished !== undefined) product.isPublished = dto.isPublished;

    await this.productRepo.save(product);
    return { message: `Product #${id} updated` };
  }

  async bulkToggleStatus(dto: BulkProductStatusDto) {
    const products = await this.productRepo.findByIds(dto.ids);

    if (!products.length) throw new NotFoundException('No products found');

    for (const product of products) {
      if (dto.isActive !== undefined) product.isActive = dto.isActive;
      if (dto.isPublished !== undefined) product.isPublished = dto.isPublished;
    }

    await this.productRepo.save(products);

    return {
      updated: products.length,
      message: `Updated ${products.length} products`,
    };
  }

  /**
   * @method getFullAdminView
   * @description Safely loads all related data for a product admin view,
   * including stock, descriptions, variants, attributes, features, images.
   * Handles null vendor/category/manufacturer and logs warnings if missing.
   */
  async getFullAdminView(productId: number) {
    this.logger.verbose(`Loading full admin view for product #${productId}`);

    // Step 1: Load the base product with direct relations (safe left joins)
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['vendor', 'category', 'manufacturer'], // auto left joins
    });

    if (!product) throw new NotFoundException('Product not found');

    // Log warnings if key relations are missing (optional)
    if (!product.category)
      this.logger.warn(`Product #${productId} has no category`);
    if (!product.vendor)
      this.logger.verbose(`Product #${productId} is admin-owned`);
    if (!product.manufacturer)
      this.logger.debug(`Product #${productId} has no manufacturer`);

    // Step 2: Load other relations in parallel (modular, indexed)
    const [descriptions, images, attributes, features, variants, totalStock] =
      await Promise.all([
        this.descriptionRepo.find({
          where: { product: { id: productId } },
          order: { language: 'ASC' },
        }),

        this.imageRepo.find({
          where: { product: { id: productId } },
          order: { sortOrder: 'ASC' },
        }),

        this.productAttributeRepo.find({
          where: { product: { id: productId } },
          relations: ['attribute', 'value'],
        }),

        this.productFeatureRepo.find({
          where: { product: { id: productId } },
          relations: ['feature'],
        }),

        this.variantRepo.find({
          where: { product: { id: productId } },
          order: { createdAt: 'DESC' },
        }),

        this.stockService.getTotalProductStock(productId),
      ]);

    // Step 2.5: Load pricing information (OneToOne)
    const pricing = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .where('product.id = :id', { id: productId })
      .select([
        'product.id',
        'pricing.basePrice',
        'pricing.discountPrice',
        'pricing.commissionRate',
        'pricing.vendorReceives',
        'pricing.currency',
        'pricing.isActive',
      ])
      .getOne()
      .then((res) => res?.pricing ?? null); // Null-safe fallback
    if (!pricing)
      this.logger.warn(`Product #${productId} has no pricing configured`);

    // Step 3: Return enriched response
    return {
      ...product,
      vendor: product.vendor ?? null,
      category: product.category ?? null,
      manufacturer: product.manufacturer ?? null,
      descriptions,
      images,
      attributes,
      features,
      variants,
      totalStock,
      pricing,
      finalPrice: pricing?.discountPrice ?? pricing?.basePrice ?? null,
      vendorReceives: pricing?.vendorReceives ?? null,
      meta: {
        variantCount: variants.length,
        imageCount: images.length,
        langCount: descriptions.length,
        attributeCount: attributes.length,
      },
    };
  }
}
