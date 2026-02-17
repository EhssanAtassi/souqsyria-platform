/**
 * @file products.service.ts
 * @description Handles core product logic: create, update, find, delete.
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from '../categories/entities/category.entity';
import { ManufacturerEntity } from '../manufacturers/entities/manufacturer.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { ProductDescriptionEntity } from './entities/product-description.entity';
import { ProductAttribute } from './entities/product-attribute.entity/product-attribute.entity';
import { ProductImage } from './entities/product-image.entity';
import { ImagesService } from './images/images.service';
import { DescriptionsService } from './descriptions/descriptions.service';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { PricingService } from './pricing/service/pricing.service';
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly descriptionsService: DescriptionsService,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly imagesService: ImagesService,
    @InjectRepository(ManufacturerEntity)
    private readonly manufacturerRepo: Repository<ManufacturerEntity>,

    @InjectRepository(VendorEntity)
    private readonly vendorRepo: Repository<VendorEntity>,
    @InjectRepository(ProductDescriptionEntity)
    private readonly productDescriptionRepo: Repository<ProductDescriptionEntity>,

    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
    private readonly pricingService: PricingService,
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepo: Repository<ProductAttribute>,
  ) {}

  async create(
    createDto: CreateProductDto,
    vendorId?: number,
  ): Promise<ProductEntity> {
    const category = await this.categoryRepo.findOne({
      where: { id: createDto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const product = this.productRepo.create(createDto);
    product.category = category;

    if (createDto.manufacturerId) {
      const manufacturer = await this.manufacturerRepo.findOne({
        where: { id: createDto.manufacturerId },
      });
      if (!manufacturer) throw new NotFoundException('Manufacturer not found');
      product.manufacturer = manufacturer;
    }

    if (vendorId) {
      const vendor = await this.vendorRepo.findOne({
        where: { id: vendorId },
      })!;
      if (!vendor) throw new NotFoundException('Vendor not found');
      product.vendor = vendor;
    }

    const saved = await this.productRepo.save(product);
    this.logger.log(`Product created: ${saved.nameEn} [ID ${saved.id}]`);
    return saved;
  }

  async findAll(): Promise<ProductEntity[]> {
    return this.productRepo.find({
      where: { is_deleted: false },
      relations: ['vendor', 'category', 'manufacturer', 'pricing'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ProductEntity> {
    const product = await this.productRepo.findOne({
      where: { id, is_deleted: false },
      relations: ['vendor', 'category', 'manufacturer', 'pricing'], // ✅ New: preload pricing object
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
  /**
   * Update a product and all related entities:
   * - Basic fields
   * - Descriptions
   * - Images
   * - Attributes
   */
  async update(
    id: number,
    updateDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    this.logger.log(`Updating product #${id}...`);

    // Step 1: Fetch the product or fail
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['vendor', 'category', 'manufacturer'],
    });
    if (!product) {
      this.logger.warn(`Product #${id} not found`);
      throw new NotFoundException('Product not found');
    }

    // Step 2: Update main fields
    Object.assign(product, updateDto);

    // Step 3: Relational updates (category, manufacturer)
    if (updateDto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: updateDto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      product.category = category;
    }

    if (updateDto.manufacturerId) {
      const manufacturer = await this.manufacturerRepo.findOne({
        where: { id: updateDto.manufacturerId },
      });
      if (!manufacturer) throw new NotFoundException('Manufacturer not found');
      product.manufacturer = manufacturer;
    }

    // Step 4: Save the main product
    const saved = await this.productRepo.save(product);
    this.logger.log(`Product updated: ${saved.nameEn} [ID ${saved.id}]`);

    // Step 5: Update Descriptions
    if (updateDto.descriptions?.length) {
      await this.descriptionsService.replaceDescriptions(
        saved.id,
        updateDto.descriptions,
      );
      this.logger.debug(
        `Updated ${updateDto.descriptions.length} descriptions`,
      );
    }

    // Step 6: Update Images
    if (updateDto.images?.length) {
      // ✅ Map DTO to entity format expected by ImagesService
      const mappedImages = updateDto.images.map((img) => ({
        imageUrl: img.image_url,
        sortOrder: img.order,
      }));
      await this.imagesService.replaceImagesByProduct(saved, mappedImages);
    }

    // Step 7: Update Attributes
    if (updateDto.attributes?.length) {
      await this.productAttributeRepo.delete({ product: { id: saved.id } });
      const attrEntities = updateDto.attributes.map((attr) => ({
        ...attr,
        product: saved, // ✅ Use a full relation object
      }));
      await this.productAttributeRepo.save(attrEntities);
      this.logger.debug(`Updated ${attrEntities.length} attributes`);
    }

    // ✅ Done
    this.logger.log(`Finished updating product #${saved.id}`);
    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.findOne(id); // will throw if not found
    product.is_deleted = true;
    await this.productRepo.save(product);
    this.logger.warn(`Soft-deleted product: [ID ${id}]`);
    return { message: `Product #${id} moved to archive` };
  }

  /**
   * @method updateStatus
   * @description Toggle product active/published status flags
   */
  async updateStatus(
    id: number,
    dto: UpdateProductStatusDto,
  ): Promise<ProductEntity> {
    const product = await this.productRepo.findOne({ where: { id } })!;
    if (!product) throw new NotFoundException('Product not found');

    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    if (dto.isPublished !== undefined) product.isPublished = dto.isPublished;

    const updated = await this.productRepo.save(product);
    this.logger.log(
      `Product #${id} status updated (active=${updated.isActive}, published=${updated.isPublished})`,
    );
    return updated;
  }
}
