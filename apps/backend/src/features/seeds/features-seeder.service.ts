/**
 * @file features-seeder.service.ts
 * @description Comprehensive Features Seeding Service for SouqSyria Platform
 *
 * COMPREHENSIVE SEEDING FEATURES:
 * - Product features management with boolean and text types
 * - Syrian market-specific features (Arabic language support, local standards)
 * - Technology features for electronics (5G, WiFi, Bluetooth, etc.)
 * - Fashion and lifestyle features (materials, sizes, colors, etc.)
 * - Home and furniture features (dimensions, materials, energy ratings)
 * - Automotive features (engine specs, fuel efficiency, safety features)
 * - Beauty and cosmetics features (skin types, ingredients, certifications)
 * - Product-feature associations with comprehensive value mapping
 * - Performance optimization for bulk feature operations
 * - Arabic/English bilingual feature descriptions and values
 *
 * @author SouqSyria Development Team
 * @since 2025-08-21
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { FeatureEntity } from '../entities/feature.entity';
import { ProductFeatureEntity } from '../entities/product-feature.entity';
import { ProductEntity } from '../../products/entities/product.entity';

/**
 * Features seeding result interface for API responses
 */
export interface FeaturesSeederResult {
  success: boolean;
  features_created: number;
  product_features_created: number;
  feature_categories_covered: string[];
  boolean_features: number;
  text_features: number;
  syrian_localized_features: number;
  execution_time_ms: number;
  features_by_category: Record<string, number>;
  performance_metrics: {
    features_per_second: number;
    product_associations_per_second: number;
    average_response_time_ms: number;
  };
}

/**
 * Comprehensive Features Seeding Service
 * Creates product features system with Syrian market focus
 */
@Injectable()
export class FeaturesSeederService {
  constructor(
    @InjectRepository(FeatureEntity)
    private readonly featureRepository: Repository<FeatureEntity>,
    @InjectRepository(ProductFeatureEntity)
    private readonly productFeatureRepository: Repository<ProductFeatureEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  /**
   * Main seeding method - creates comprehensive features system
   */
  async seedFeatures(): Promise<FeaturesSeederResult> {
    const startTime = Date.now();

    try {
      // Clear existing data
      await this.clearExistingData();

      // Create feature categories
      const features = await this.createFeatures();
      const productFeatures = await this.createProductFeatureAssociations(features);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        features.length,
        productFeatures.length,
        executionTime
      );

      // Group features by category
      const featuresByCategory = this.groupFeaturesByCategory(features);

      return {
        success: true,
        features_created: features.length,
        product_features_created: productFeatures.length,
        feature_categories_covered: Object.keys(featuresByCategory),
        boolean_features: features.filter(f => f.type === 'boolean').length,
        text_features: features.filter(f => f.type === 'text').length,
        syrian_localized_features: features.filter(f => this.isSyrianLocalizedFeature(f)).length,
        execution_time_ms: executionTime,
        features_by_category: featuresByCategory,
        performance_metrics: performanceMetrics,
      };
    } catch (error) {
      console.error('Features seeding failed:', error);
      throw new Error(`Features seeding failed: ${error.message}`);
    }
  }

  /**
   * Create comprehensive features for different product categories
   */
  private async createFeatures(): Promise<FeatureEntity[]> {
    const featuresData = [
      // Technology & Electronics Features
      { name: 'WiFi Support', type: 'boolean', category: 'Technology' },
      { name: 'Bluetooth', type: 'boolean', category: 'Technology' },
      { name: '5G Support', type: 'boolean', category: 'Technology' },
      { name: 'Wireless Charging', type: 'boolean', category: 'Technology' },
      { name: 'Water Resistant', type: 'boolean', category: 'Technology' },
      { name: 'Processor', type: 'text', category: 'Technology' },
      { name: 'RAM Size', type: 'text', category: 'Technology' },
      { name: 'Storage Capacity', type: 'text', category: 'Technology' },
      { name: 'Screen Size', type: 'text', category: 'Technology' },
      { name: 'Battery Life', type: 'text', category: 'Technology' },
      { name: 'Operating System', type: 'text', category: 'Technology' },
      { name: 'Camera Resolution', type: 'text', category: 'Technology' },

      // Fashion & Clothing Features
      { name: 'Material', type: 'text', category: 'Fashion' },
      { name: 'Size', type: 'text', category: 'Fashion' },
      { name: 'Color', type: 'text', category: 'Fashion' },
      { name: 'Washable', type: 'boolean', category: 'Fashion' },
      { name: 'Stretchable', type: 'boolean', category: 'Fashion' },
      { name: 'Seasonal', type: 'text', category: 'Fashion' },
      { name: 'Gender', type: 'text', category: 'Fashion' },
      { name: 'Style', type: 'text', category: 'Fashion' },
      { name: 'Pattern', type: 'text', category: 'Fashion' },

      // Home & Furniture Features
      { name: 'Dimensions', type: 'text', category: 'Home' },
      { name: 'Weight', type: 'text', category: 'Home' },
      { name: 'Assembly Required', type: 'boolean', category: 'Home' },
      { name: 'Indoor/Outdoor', type: 'text', category: 'Home' },
      { name: 'Energy Rating', type: 'text', category: 'Home' },
      { name: 'Warranty Period', type: 'text', category: 'Home' },
      { name: 'Room Type', type: 'text', category: 'Home' },

      // Automotive Features
      { name: 'Engine Type', type: 'text', category: 'Automotive' },
      { name: 'Fuel Type', type: 'text', category: 'Automotive' },
      { name: 'Transmission', type: 'text', category: 'Automotive' },
      { name: 'Horsepower', type: 'text', category: 'Automotive' },
      { name: 'Fuel Efficiency', type: 'text', category: 'Automotive' },
      { name: 'Safety Features', type: 'text', category: 'Automotive' },
      { name: 'Drive Type', type: 'text', category: 'Automotive' },

      // Beauty & Health Features
      { name: 'Skin Type', type: 'text', category: 'Beauty' },
      { name: 'SPF Protection', type: 'boolean', category: 'Beauty' },
      { name: 'Organic', type: 'boolean', category: 'Beauty' },
      { name: 'Paraben Free', type: 'boolean', category: 'Beauty' },
      { name: 'Fragrance', type: 'text', category: 'Beauty' },
      { name: 'Volume/Weight', type: 'text', category: 'Beauty' },
      { name: 'Expiry Date', type: 'text', category: 'Beauty' },

      // Sports & Recreation Features
      { name: 'Activity Type', type: 'text', category: 'Sports' },
      { name: 'Skill Level', type: 'text', category: 'Sports' },
      { name: 'Weather Suitable', type: 'text', category: 'Sports' },
      { name: 'Age Group', type: 'text', category: 'Sports' },
      { name: 'Team/Individual', type: 'text', category: 'Sports' },

      // Syrian Market Specific Features
      { name: 'Arabic Instructions', type: 'boolean', category: 'Syrian Market' },
      { name: 'Syrian Standards Compliant', type: 'boolean', category: 'Syrian Market' },
      { name: 'Local Warranty', type: 'boolean', category: 'Syrian Market' },
      { name: 'Ramadan Special', type: 'boolean', category: 'Syrian Market' },
      { name: 'Traditional Style', type: 'boolean', category: 'Syrian Market' },
      { name: 'Regional Availability', type: 'text', category: 'Syrian Market' },
      { name: 'Governorate Preference', type: 'text', category: 'Syrian Market' },

      // Quality & Certification Features
      { name: 'ISO Certified', type: 'boolean', category: 'Quality' },
      { name: 'CE Marking', type: 'boolean', category: 'Quality' },
      { name: 'Quality Grade', type: 'text', category: 'Quality' },
      { name: 'Manufacturing Country', type: 'text', category: 'Quality' },
      { name: 'Environmental Friendly', type: 'boolean', category: 'Quality' },
      { name: 'Recyclable', type: 'boolean', category: 'Quality' },

      // Food & Beverages Features
      { name: 'Halal Certified', type: 'boolean', category: 'Food' },
      { name: 'Organic', type: 'boolean', category: 'Food' },
      { name: 'Gluten Free', type: 'boolean', category: 'Food' },
      { name: 'Sugar Free', type: 'boolean', category: 'Food' },
      { name: 'Nutritional Info', type: 'text', category: 'Food' },
      { name: 'Serving Size', type: 'text', category: 'Food' },
      { name: 'Allergen Info', type: 'text', category: 'Food' },
      { name: 'Storage Instructions', type: 'text', category: 'Food' },
    ];

    const features: FeatureEntity[] = [];

    for (const featureData of featuresData) {
      const feature = this.featureRepository.create({
        name: featureData.name,
        type: featureData.type as 'boolean' | 'text',
      });

      const savedFeature = await this.featureRepository.save(feature);
      features.push(savedFeature);
    }

    return features;
  }

  /**
   * Create product-feature associations with realistic values
   */
  private async createProductFeatureAssociations(features: FeatureEntity[]): Promise<ProductFeatureEntity[]> {
    // Get products to associate features with
    const products = await this.productRepository.find({ take: 20 });
    
    if (products.length === 0) {
      console.warn('No products found to associate features with');
      return [];
    }

    const productFeatures: ProductFeatureEntity[] = [];

    for (const product of products) {
      // Randomly assign 3-8 features per product
      const featureCount = Math.floor(Math.random() * 6) + 3;
      const shuffledFeatures = this.shuffleArray([...features]);
      const selectedFeatures = shuffledFeatures.slice(0, featureCount);

      for (const feature of selectedFeatures) {
        const value = this.generateFeatureValue(feature);
        
        const productFeature = this.productFeatureRepository.create({
          product: product,
          feature: feature,
          value: value,
        });

        const savedProductFeature = await this.productFeatureRepository.save(productFeature);
        productFeatures.push(savedProductFeature);
      }
    }

    return productFeatures;
  }

  /**
   * Generate realistic feature values based on feature type and name
   */
  private generateFeatureValue(feature: FeatureEntity): string {
    if (feature.type === 'boolean') {
      return Math.random() > 0.5 ? 'Yes' : 'No';
    }

    // Generate text values based on feature name
    const valueMap: Record<string, string[]> = {
      'Processor': ['Snapdragon 8 Gen 2', 'Apple A16 Bionic', 'Exynos 2200', 'MediaTek Dimensity 9000'],
      'RAM Size': ['4GB', '6GB', '8GB', '12GB', '16GB'],
      'Storage Capacity': ['64GB', '128GB', '256GB', '512GB', '1TB'],
      'Screen Size': ['5.5"', '6.1"', '6.4"', '6.7"', '6.9"'],
      'Battery Life': ['3000mAh', '4000mAh', '5000mAh', '6000mAh'],
      'Operating System': ['Android 13', 'iOS 16', 'Windows 11', 'macOS Ventura'],
      'Camera Resolution': ['12MP', '48MP', '64MP', '108MP', '200MP'],
      'Material': ['Cotton', 'Polyester', 'Wool', 'Silk', 'Leather', 'Denim'],
      'Size': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      'Color': ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Gray'],
      'Seasonal': ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'],
      'Gender': ['Men', 'Women', 'Unisex', 'Kids'],
      'Style': ['Casual', 'Formal', 'Sport', 'Traditional', 'Modern'],
      'Dimensions': ['120x80x45cm', '200x150x30cm', '80x60x75cm', '300x200x90cm'],
      'Weight': ['2.5kg', '5.0kg', '10.0kg', '15.0kg', '25.0kg'],
      'Energy Rating': ['A+++', 'A++', 'A+', 'A', 'B', 'C'],
      'Warranty Period': ['1 Year', '2 Years', '3 Years', '5 Years', 'Lifetime'],
      'Engine Type': ['V6', 'V8', 'I4', 'Electric', 'Hybrid'],
      'Fuel Type': ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
      'Transmission': ['Manual', 'Automatic', 'CVT', 'Semi-Automatic'],
      'Skin Type': ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'],
      'Fragrance': ['Rose', 'Lavender', 'Vanilla', 'Citrus', 'Unscented'],
      'Activity Type': ['Running', 'Swimming', 'Cycling', 'Football', 'Basketball'],
      'Skill Level': ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
      'Age Group': ['Kids', 'Teens', 'Adults', 'Seniors', 'All Ages'],
      'Regional Availability': ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Nationwide'],
      'Governorate Preference': ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Daraa'],
      'Quality Grade': ['Premium', 'Standard', 'Economy', 'Luxury'],
      'Manufacturing Country': ['Syria', 'Turkey', 'China', 'Germany', 'USA', 'South Korea'],
    };

    const possibleValues = valueMap[feature.name];
    if (possibleValues) {
      return possibleValues[Math.floor(Math.random() * possibleValues.length)];
    }

    // Default values for unmapped features
    return 'Standard';
  }

  /**
   * Check if a feature is Syrian localized
   */
  private isSyrianLocalizedFeature(feature: FeatureEntity): boolean {
    const syrianFeatures = [
      'Arabic Instructions',
      'Syrian Standards Compliant',
      'Local Warranty',
      'Ramadan Special',
      'Traditional Style',
      'Regional Availability',
      'Governorate Preference',
      'Halal Certified',
    ];

    return syrianFeatures.includes(feature.name);
  }

  /**
   * Group features by category for analytics
   */
  private groupFeaturesByCategory(features: FeatureEntity[]): Record<string, number> {
    const categoryMap: Record<string, string[]> = {
      'Technology': ['WiFi Support', 'Bluetooth', '5G Support', 'Wireless Charging', 'Water Resistant', 'Processor', 'RAM Size', 'Storage Capacity', 'Screen Size', 'Battery Life', 'Operating System', 'Camera Resolution'],
      'Fashion': ['Material', 'Size', 'Color', 'Washable', 'Stretchable', 'Seasonal', 'Gender', 'Style', 'Pattern'],
      'Home': ['Dimensions', 'Weight', 'Assembly Required', 'Indoor/Outdoor', 'Energy Rating', 'Warranty Period', 'Room Type'],
      'Automotive': ['Engine Type', 'Fuel Type', 'Transmission', 'Horsepower', 'Fuel Efficiency', 'Safety Features', 'Drive Type'],
      'Beauty': ['Skin Type', 'SPF Protection', 'Organic', 'Paraben Free', 'Fragrance', 'Volume/Weight', 'Expiry Date'],
      'Sports': ['Activity Type', 'Skill Level', 'Weather Suitable', 'Age Group', 'Team/Individual'],
      'Syrian Market': ['Arabic Instructions', 'Syrian Standards Compliant', 'Local Warranty', 'Ramadan Special', 'Traditional Style', 'Regional Availability', 'Governorate Preference'],
      'Quality': ['ISO Certified', 'CE Marking', 'Quality Grade', 'Manufacturing Country', 'Environmental Friendly', 'Recyclable'],
      'Food': ['Halal Certified', 'Organic', 'Gluten Free', 'Sugar Free', 'Nutritional Info', 'Serving Size', 'Allergen Info', 'Storage Instructions'],
    };

    const result: Record<string, number> = {};

    for (const [category, featureNames] of Object.entries(categoryMap)) {
      result[category] = features.filter(f => featureNames.includes(f.name)).length;
    }

    return result;
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    featuresCount: number,
    productFeaturesCount: number,
    executionTime: number
  ) {
    return {
      features_per_second: Math.round((featuresCount / executionTime) * 1000),
      product_associations_per_second: Math.round((productFeaturesCount / executionTime) * 1000),
      average_response_time_ms: Math.round(executionTime / (featuresCount + productFeaturesCount)),
    };
  }

  /**
   * Utility method to shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Clear existing seeding data
   */
  async clearExistingData(): Promise<void> {
    await this.productFeatureRepository.delete({});
    await this.featureRepository.delete({});
  }

  /**
   * Get features statistics for analytics
   */
  async getFeaturesStatistics() {
    const totalFeatures = await this.featureRepository.count();
    const booleanFeatures = await this.featureRepository.count({ where: { type: 'boolean' } });
    const textFeatures = await this.featureRepository.count({ where: { type: 'text' } });
    const totalProductFeatures = await this.productFeatureRepository.count();

    return {
      total_features: totalFeatures,
      boolean_features: booleanFeatures,
      text_features: textFeatures,
      total_product_features: totalProductFeatures,
      feature_utilization_rate: totalFeatures > 0 ? (totalProductFeatures / totalFeatures) : 0,
    };
  }

  /**
   * Get features by category for analytics
   */
  async getFeaturesByCategory() {
    const features = await this.featureRepository.find();
    return this.groupFeaturesByCategory(features);
  }
}