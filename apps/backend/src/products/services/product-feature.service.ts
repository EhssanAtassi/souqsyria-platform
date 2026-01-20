import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FeatureEntity } from '../../features/entities/feature.entity';
import { ProductEntity } from '../entities/product.entity';
import { SetProductFeaturesDto } from '../dto/set-product-features.dto';
import { ProductFeatureEntity } from '../../features/entities/product-feature.entity';

@Injectable()
export class ProductFeatureService {
  private readonly logger = new Logger(ProductFeatureService.name);

  constructor(
    @InjectRepository(ProductFeatureEntity)
    private readonly productFeatureRepo: Repository<ProductFeatureEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(FeatureEntity)
    private readonly featureRepo: Repository<FeatureEntity>,
  ) {}

  /**
   * Replace all features for a product with a new list of feature IDs
   */
  async setFeatures(productId: number, dto: SetProductFeaturesDto) {
    this.logger.log(`Setting features for product #${productId}`);

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new Error('Product not found');

    // Step 1: Remove old
    await this.productFeatureRepo.delete({ product: { id: productId } });

    // Step 2: Add new
    const features = await this.featureRepo.findByIds(dto.featureIds);
    const relations = features.map((f) => ({
      product,
      feature: f,
    }));

    const saved = await this.productFeatureRepo.save(relations);
    this.logger.debug(`Saved ${saved.length} features`);
    return saved;
  }
}
