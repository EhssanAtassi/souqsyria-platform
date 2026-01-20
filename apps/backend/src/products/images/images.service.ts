import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductEntity } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  /**
   * Replace all images for a product
   * - Deletes previous ones
   * - Saves new ones
   */
  async replaceImages(
    productId: number,
    images: { image_url: string; order: number }[],
  ) {
    this.logger.log(`Replacing images for product #${productId}`);

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Remove old images
    await this.productImageRepo.delete({ product: { id: productId } });

    // Insert new images
    const newImages = images.map((img) => ({
      image_url: img.image_url,
      order: img.order,
      product,
    }));

    const saved = await this.productImageRepo.save(newImages);
    this.logger.debug(`Saved ${saved.length} product images`);
    return saved;
  }

  /**
   * Replace all images for a given product ID.
   * Deletes old images and saves new ones.
   */
  async replaceImagesByProduct(
    product: ProductEntity,
    images: { imageUrl: string; sortOrder: number }[],
  ): Promise<ProductImage[]> {
    this.logger.log(`Replacing product images for product #${product.id}`);
    // ✅ Enforce max 8 images
    if (images.length > 8) {
      this.logger.warn(
        `Rejected image update for product #${product.id}: too many images`,
      );
      throw new BadRequestException('Maximum of 8 images per product allowed');
    }
    await this.productImageRepo.delete({ product: { id: product.id } });

    const entities = images.map((img) => {
      const entity = new ProductImage();
      entity.product = product;
      entity.imageUrl = img.imageUrl;
      entity.sortOrder = img.sortOrder || 0;
      return entity;
    });

    const saved = await this.productImageRepo.save(entities);
    this.logger.debug(
      `Saved ${saved.length} images for product #${product.id}`,
    );
    return saved;
  }

  /**
   * Get all images for a product, ordered by sortOrder.
   */
  async getImagesByProduct(productId: number): Promise<ProductImage[]> {
    this.logger.log(`Fetching images for product #${productId}`);

    return this.productImageRepo.find({
      where: { product: { id: productId } },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Delete a specific image by its ID and product ID
   */
  async deleteImageById(
    imageId: number,
    productId: number,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Attempting to delete image #${imageId} for product #${productId}`,
    );

    const image = await this.productImageRepo.findOne({
      where: {
        id: imageId,
        product: { id: productId },
      },
    });

    if (!image) {
      this.logger.warn(`Image #${imageId} not found for product #${productId}`);
      throw new NotFoundException('Image not found for this product');
    }
    image.isDeleted = true;
    image.deletedAt = new Date();
    await this.productImageRepo.save(image);
    // await this.productImageRepo.remove(image);

    this.logger.log(`Deleted image #${imageId} from product #${productId}`);
    return { message: `Image #${imageId} deleted` };
  }

  /**
   * Update sortOrder of a specific image
   */
  async updateImageSortOrder(
    imageId: number,
    productId: number,
    sortOrder: number,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Updating sortOrder of image #${imageId} on product #${productId}`,
    );

    const image = await this.productImageRepo.findOne({
      where: { id: imageId, product: { id: productId } },
    });

    if (!image) {
      this.logger.warn(`Image #${imageId} not found for product #${productId}`);
      throw new NotFoundException('Image not found for this product');
    }

    // ✅ Business rule: If setting this to 0, demote all others to >0
    if (sortOrder === 0) {
      await this.productImageRepo
        .createQueryBuilder()
        .update()
        .set({ sortOrder: 1 })
        .where('product_id = :productId AND id != :imageId', {
          productId,
          imageId,
        })
        .execute();

      this.logger.log(
        `Demoted other images of product #${productId} to non-main`,
      );
    }

    // ✅ Now update the selected image
    image.sortOrder = sortOrder;
    await this.productImageRepo.save(image);

    this.logger.log(`Updated image #${imageId} sortOrder to ${sortOrder}`);
    return { message: `Image #${imageId} sortOrder updated` };
  }
}
