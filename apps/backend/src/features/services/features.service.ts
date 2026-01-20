/**
 * @file features.service.ts
 * @description Service for managing product features and feature-product relationships
 *
 * BUSINESS LOGIC:
 * - Create and manage feature definitions (Waterproof, 5G Support, etc.)
 * - Assign features to products with specific values
 * - Support both boolean and text-based feature values
 * - Bulk operations for feature management
 * - Feature usage analytics and reporting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 1.0.0
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { FeatureEntity } from '../entities/feature.entity';
import { ProductFeatureEntity } from '../entities/product-feature.entity';
import { ProductEntity } from '../../products/entities/product.entity';

/**
 * DTOs for Features Service
 */
export interface CreateFeatureDto {
  name: string;
  type: 'boolean' | 'text';
}

export interface UpdateFeatureDto {
  name?: string;
  type?: 'boolean' | 'text';
}

export interface AssignFeatureToProductDto {
  productId: number;
  featureId: number;
  value: string;
}

export interface BulkAssignFeaturesDto {
  productId: number;
  features: Array<{
    featureId: number;
    value: string;
  }>;
}

export interface FeatureSearchFilters {
  name?: string;
  type?: 'boolean' | 'text';
}

export interface FeatureUsageStats {
  featureId: number;
  featureName: string;
  productCount: number;
  commonValues: Array<{
    value: string;
    count: number;
  }>;
}

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  constructor(
    @InjectRepository(FeatureEntity)
    private readonly featureRepository: Repository<FeatureEntity>,

    @InjectRepository(ProductFeatureEntity)
    private readonly productFeatureRepository: Repository<ProductFeatureEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  /**
   * Create a new feature definition
   */
  async createFeature(
    createFeatureDto: CreateFeatureDto,
  ): Promise<FeatureEntity> {
    this.logger.log(`Creating new feature: ${createFeatureDto.name}`);

    // Check if feature with same name already exists
    const existingFeature = await this.featureRepository.findOne({
      where: { name: createFeatureDto.name },
    });

    if (existingFeature) {
      throw new ConflictException(
        `Feature with name '${createFeatureDto.name}' already exists`,
      );
    }

    // Validate feature type
    if (!['boolean', 'text'].includes(createFeatureDto.type)) {
      throw new BadRequestException(
        'Feature type must be either "boolean" or "text"',
      );
    }

    const feature = this.featureRepository.create({
      name: createFeatureDto.name.trim(),
      type: createFeatureDto.type,
    });

    const savedFeature = await this.featureRepository.save(feature);
    this.logger.log(`Feature created successfully with ID: ${savedFeature.id}`);

    return savedFeature;
  }

  /**
   * Get all features with optional filtering
   */
  async getAllFeatures(
    filters?: FeatureSearchFilters,
  ): Promise<FeatureEntity[]> {
    this.logger.log('Retrieving all features with filters:', filters);

    const queryBuilder = this.featureRepository.createQueryBuilder('feature');

    if (filters?.name) {
      queryBuilder.andWhere('LOWER(feature.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('feature.type = :type', { type: filters.type });
    }

    queryBuilder.orderBy('feature.name', 'ASC');

    const features = await queryBuilder.getMany();
    this.logger.log(`Retrieved ${features.length} features`);

    return features;
  }

  /**
   * Get feature by ID
   */
  async getFeatureById(id: number): Promise<FeatureEntity> {
    this.logger.log(`Retrieving feature with ID: ${id}`);

    const feature = await this.featureRepository.findOne({ where: { id } });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return feature;
  }

  /**
   * Update an existing feature
   */
  async updateFeature(
    id: number,
    updateFeatureDto: UpdateFeatureDto,
  ): Promise<FeatureEntity> {
    this.logger.log(`Updating feature with ID: ${id}`);

    const feature = await this.getFeatureById(id);

    // Check for name conflicts if name is being updated
    if (updateFeatureDto.name && updateFeatureDto.name !== feature.name) {
      const existingFeature = await this.featureRepository.findOne({
        where: { name: updateFeatureDto.name },
      });

      if (existingFeature) {
        throw new ConflictException(
          `Feature with name '${updateFeatureDto.name}' already exists`,
        );
      }
    }

    // Update feature properties
    if (updateFeatureDto.name) {
      feature.name = updateFeatureDto.name.trim();
    }
    if (updateFeatureDto.type) {
      feature.type = updateFeatureDto.type;
    }

    const updatedFeature = await this.featureRepository.save(feature);
    this.logger.log(`Feature updated successfully: ${updatedFeature.id}`);

    return updatedFeature;
  }

  /**
   * Delete a feature (with cascade handling)
   */
  async deleteFeature(
    id: number,
  ): Promise<{ message: string; deletedFeature: FeatureEntity }> {
    this.logger.log(`Deleting feature with ID: ${id}`);

    const feature = await this.getFeatureById(id);

    // Check how many products are using this feature
    const usageCount = await this.productFeatureRepository.count({
      where: { feature: { id } },
    });

    if (usageCount > 0) {
      this.logger.warn(
        `Feature ${id} is used by ${usageCount} products - cascade deletion`,
      );
    }

    await this.featureRepository.remove(feature);
    this.logger.log(`Feature deleted successfully: ${feature.name}`);

    return {
      message: `Feature '${feature.name}' deleted successfully`,
      deletedFeature: feature,
    };
  }

  /**
   * Assign a feature to a product with a specific value
   */
  async assignFeatureToProduct(
    assignDto: AssignFeatureToProductDto,
  ): Promise<ProductFeatureEntity> {
    this.logger.log(
      `Assigning feature ${assignDto.featureId} to product ${assignDto.productId}`,
    );

    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: assignDto.productId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${assignDto.productId} not found`,
      );
    }

    // Validate feature exists
    const feature = await this.getFeatureById(assignDto.featureId);

    // Check if this product-feature combination already exists
    const existingAssignment = await this.productFeatureRepository.findOne({
      where: {
        product: { id: assignDto.productId },
        feature: { id: assignDto.featureId },
      },
    });

    if (existingAssignment) {
      // Update existing assignment
      existingAssignment.value = assignDto.value;
      const updated =
        await this.productFeatureRepository.save(existingAssignment);
      this.logger.log(`Updated existing feature assignment: ${updated.id}`);
      return updated;
    }

    // Validate value format based on feature type
    if (feature.type === 'boolean') {
      const validBooleanValues = ['yes', 'no', 'true', 'false', '1', '0'];
      if (!validBooleanValues.includes(assignDto.value.toLowerCase())) {
        throw new BadRequestException(
          'Boolean feature value must be: yes/no, true/false, or 1/0',
        );
      }
    }

    // Create new assignment
    const productFeature = this.productFeatureRepository.create({
      product: { id: assignDto.productId },
      feature: { id: assignDto.featureId },
      value: assignDto.value,
    });

    const savedAssignment =
      await this.productFeatureRepository.save(productFeature);
    this.logger.log(`Feature assigned successfully: ${savedAssignment.id}`);

    return savedAssignment;
  }

  /**
   * Bulk assign multiple features to a product
   */
  async bulkAssignFeaturesToProduct(
    bulkDto: BulkAssignFeaturesDto,
  ): Promise<ProductFeatureEntity[]> {
    this.logger.log(
      `Bulk assigning ${bulkDto.features.length} features to product ${bulkDto.productId}`,
    );

    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: bulkDto.productId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${bulkDto.productId} not found`,
      );
    }

    // Validate all features exist
    const featureIds = bulkDto.features.map((f) => f.featureId);
    const features = await this.featureRepository.findBy({
      id: In(featureIds),
    });

    if (features.length !== featureIds.length) {
      throw new BadRequestException('One or more feature IDs are invalid');
    }

    // Remove existing assignments for this product
    await this.productFeatureRepository.delete({
      product: { id: bulkDto.productId },
    });

    // Create new assignments
    const assignments = bulkDto.features.map((featureData) =>
      this.productFeatureRepository.create({
        product: { id: bulkDto.productId },
        feature: { id: featureData.featureId },
        value: featureData.value,
      }),
    );

    const savedAssignments =
      await this.productFeatureRepository.save(assignments);
    this.logger.log(
      `Bulk assignment completed: ${savedAssignments.length} features assigned`,
    );

    return savedAssignments;
  }

  /**
   * Get all features assigned to a product
   */
  async getProductFeatures(productId: number): Promise<ProductFeatureEntity[]> {
    this.logger.log(`Retrieving features for product: ${productId}`);

    const productFeatures = await this.productFeatureRepository.find({
      where: { product: { id: productId } },
      relations: ['feature'],
      order: { feature: { name: 'ASC' } },
    });

    this.logger.log(
      `Found ${productFeatures.length} features for product ${productId}`,
    );
    return productFeatures;
  }

  /**
   * Remove a feature from a product
   */
  async removeFeatureFromProduct(
    productId: number,
    featureId: number,
  ): Promise<{ message: string }> {
    this.logger.log(`Removing feature ${featureId} from product ${productId}`);

    const assignment = await this.productFeatureRepository.findOne({
      where: {
        product: { id: productId },
        feature: { id: featureId },
      },
      relations: ['feature'],
    });

    if (!assignment) {
      throw new NotFoundException('Feature assignment not found');
    }

    await this.productFeatureRepository.remove(assignment);
    this.logger.log(
      `Feature '${assignment.feature.name}' removed from product ${productId}`,
    );

    return { message: 'Feature removed from product successfully' };
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsageStats(): Promise<FeatureUsageStats[]> {
    this.logger.log('Calculating feature usage statistics');

    const query = `
      SELECT 
        f.id as featureId,
        f.name as featureName,
        COUNT(pf.id) as productCount,
        JSON_ARRAYAGG(
          JSON_OBJECT('value', pf.value, 'count', 1)
        ) as values
      FROM features f
      LEFT JOIN product_features pf ON f.id = pf.feature_id
      GROUP BY f.id, f.name
      ORDER BY productCount DESC, f.name ASC
    `;

    const results = await this.featureRepository.query(query);

    const stats: FeatureUsageStats[] = results.map((result) => {
      // Process value counts
      const valueMap = new Map<string, number>();
      if (result.values) {
        result.values.forEach((item: any) => {
          if (item.value) {
            valueMap.set(item.value, (valueMap.get(item.value) || 0) + 1);
          }
        });
      }

      const commonValues = Array.from(valueMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 most common values

      return {
        featureId: result.featureId,
        featureName: result.featureName,
        productCount: parseInt(result.productCount) || 0,
        commonValues,
      };
    });

    this.logger.log(`Generated usage statistics for ${stats.length} features`);
    return stats;
  }

  /**
   * Search products by feature criteria
   */
  async searchProductsByFeatures(
    criteria: Array<{
      featureId: number;
      value: string;
    }>,
  ): Promise<ProductEntity[]> {
    this.logger.log(
      `Searching products by ${criteria.length} feature criteria`,
    );

    if (criteria.length === 0) {
      return [];
    }

    let queryBuilder = this.productRepository.createQueryBuilder('product');

    criteria.forEach((criterion, index) => {
      const alias = `pf${index}`;
      queryBuilder = queryBuilder
        .innerJoin('product.features', alias)
        .andWhere(`${alias}.feature_id = :featureId${index}`, {
          [`featureId${index}`]: criterion.featureId,
        })
        .andWhere(`${alias}.value = :value${index}`, {
          [`value${index}`]: criterion.value,
        });
    });

    const products = await queryBuilder
      .orderBy('product.nameEn', 'ASC')
      .getMany();

    this.logger.log(
      `Found ${products.length} products matching feature criteria`,
    );
    return products;
  }
}
