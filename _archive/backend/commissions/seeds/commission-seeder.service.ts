/**
 * @file commission-seeder.service.ts
 * @description Professional commission seeding service for SouqSyria platform
 *
 * Provides comprehensive seeding capabilities for:
 * - Global commission rules and fallbacks
 * - Category-specific commission rates
 * - Vendor tier-based commission structures
 * - Product-specific commission overrides
 * - Membership discount tiers
 * - Performance optimization and validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Core Commission Entities
import { GlobalCommissionEntity } from '../entites/global-commission.entity';
import { CategoryCommissionEntity } from '../entites/category-commission.entity';
import { VendorCommissionEntity } from '../entites/vendor-commission.entity';
import { ProductCommissionEntity } from '../entites/product-commission.entity';
import { MembershipDiscountEntity } from '../entites/membership-discount.entity';

// External Entities
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { ProductEntity } from '../../products/entities/product.entity';

interface CommissionSeedData {
  globalCommissions: Array<{
    percentage: number;
    minimumAmount: number;
    maximumAmount: number;
    isActive: boolean;
    description: string;
    effectiveDate: Date;
  }>;
  categoryCommissions: Array<{
    categoryName: string;
    percentage: number;
    minimumAmount: number;
    maximumAmount: number;
    description: string;
  }>;
  vendorCommissions: Array<{
    vendorTier: string;
    percentage: number;
    minimumAmount: number;
    maximumAmount: number;
    tierDescription: string;
  }>;
  membershipDiscounts: Array<{
    membershipTier: string;
    discountPercentage: number;
    minimumOrderAmount: number;
    description: string;
  }>;
}

@Injectable()
export class CommissionSeederService {
  private readonly logger = new Logger(CommissionSeederService.name);

  constructor(
    @InjectRepository(GlobalCommissionEntity)
    private readonly globalCommissionRepository: Repository<GlobalCommissionEntity>,
    @InjectRepository(CategoryCommissionEntity)
    private readonly categoryCommissionRepository: Repository<CategoryCommissionEntity>,
    @InjectRepository(VendorCommissionEntity)
    private readonly vendorCommissionRepository: Repository<VendorCommissionEntity>,
    @InjectRepository(ProductCommissionEntity)
    private readonly productCommissionRepository: Repository<ProductCommissionEntity>,
    @InjectRepository(MembershipDiscountEntity)
    private readonly membershipDiscountRepository: Repository<MembershipDiscountEntity>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  /**
   * Comprehensive commission seed data for SouqSyria platform
   */
  private getCommissionSeedData(): CommissionSeedData {
    return {
      // Global Commission Rules
      globalCommissions: [
        {
          percentage: 7.0,
          minimumAmount: 5000, // 5,000 SYP minimum
          maximumAmount: 500000, // 500,000 SYP maximum
          isActive: true,
          description: 'Default commission rate for all products',
          effectiveDate: new Date('2025-01-01'),
        },
        {
          percentage: 5.0,
          minimumAmount: 2500,
          maximumAmount: 250000,
          isActive: false,
          description: 'Promotional reduced commission rate',
          effectiveDate: new Date('2025-03-01'),
        },
      ],

      // Category-Specific Commission Rates
      categoryCommissions: [
        {
          categoryName: 'Electronics',
          percentage: 8.5,
          minimumAmount: 10000,
          maximumAmount: 1000000,
          description:
            'Higher commission for electronics due to premium support',
        },
        {
          categoryName: 'Fashion & Clothing',
          percentage: 12.0,
          minimumAmount: 3000,
          maximumAmount: 300000,
          description: 'Fashion category with higher margins',
        },
        {
          categoryName: 'Books & Media',
          percentage: 5.5,
          minimumAmount: 1000,
          maximumAmount: 50000,
          description: 'Lower commission for educational content',
        },
        {
          categoryName: 'Home & Garden',
          percentage: 9.0,
          minimumAmount: 7500,
          maximumAmount: 750000,
          description: 'Standard commission for home improvement',
        },
        {
          categoryName: 'Sports & Recreation',
          percentage: 10.0,
          minimumAmount: 5000,
          maximumAmount: 500000,
          description: 'Sports equipment commission rate',
        },
        {
          categoryName: 'Health & Beauty',
          percentage: 11.5,
          minimumAmount: 2500,
          maximumAmount: 250000,
          description: 'Beauty products with premium positioning',
        },
        {
          categoryName: 'Automotive',
          percentage: 6.5,
          minimumAmount: 15000,
          maximumAmount: 1500000,
          description: 'Automotive parts and accessories',
        },
        {
          categoryName: 'Food & Beverages',
          percentage: 4.5,
          minimumAmount: 1500,
          maximumAmount: 150000,
          description: 'Food products with thin margins',
        },
      ],

      // Vendor Tier-Based Commission Rates
      vendorCommissions: [
        {
          vendorTier: 'Platinum',
          percentage: 5.0,
          minimumAmount: 2500,
          maximumAmount: 2500000,
          tierDescription: 'Premium vendors with highest volume and quality',
        },
        {
          vendorTier: 'Gold',
          percentage: 6.0,
          minimumAmount: 3000,
          maximumAmount: 1500000,
          tierDescription: 'High-performing vendors with excellent ratings',
        },
        {
          vendorTier: 'Silver',
          percentage: 7.5,
          minimumAmount: 4000,
          maximumAmount: 1000000,
          tierDescription: 'Established vendors with good performance',
        },
        {
          vendorTier: 'Bronze',
          percentage: 8.5,
          minimumAmount: 5000,
          maximumAmount: 750000,
          tierDescription: 'Standard vendors meeting basic requirements',
        },
        {
          vendorTier: 'Standard',
          percentage: 10.0,
          minimumAmount: 7500,
          maximumAmount: 500000,
          tierDescription: 'New or basic vendors without tier status',
        },
      ],

      // Membership-Based Discount Tiers
      membershipDiscounts: [
        {
          membershipTier: 'VIP Diamond',
          discountPercentage: 25.0,
          minimumOrderAmount: 100000, // 100,000 SYP minimum
          description: 'Premium VIP members with highest loyalty',
        },
        {
          membershipTier: 'VIP Gold',
          discountPercentage: 20.0,
          minimumOrderAmount: 50000,
          description: 'Gold tier VIP members with high engagement',
        },
        {
          membershipTier: 'VIP Silver',
          discountPercentage: 15.0,
          minimumOrderAmount: 25000,
          description: 'Silver tier VIP members with regular purchases',
        },
        {
          membershipTier: 'Premium',
          discountPercentage: 10.0,
          minimumOrderAmount: 15000,
          description: 'Premium members with consistent activity',
        },
        {
          membershipTier: 'Standard',
          discountPercentage: 5.0,
          minimumOrderAmount: 5000,
          description: 'Standard members with basic benefits',
        },
      ],
    };
  }

  /**
   * Seed commission system with comprehensive data
   */
  async seedCommissions(): Promise<{
    success: boolean;
    globalCommissionsCreated: number;
    categoryCommissionsCreated: number;
    vendorCommissionsCreated: number;
    membershipDiscountsCreated: number;
    errors: string[];
  }> {
    this.logger.log('🌱 Starting commission system seeding...');

    const results = {
      success: true,
      globalCommissionsCreated: 0,
      categoryCommissionsCreated: 0,
      vendorCommissionsCreated: 0,
      membershipDiscountsCreated: 0,
      errors: [],
    };

    try {
      const seedData = this.getCommissionSeedData();

      // Seed Global Commissions
      await this.seedGlobalCommissions(seedData.globalCommissions, results);

      // Seed Category Commissions
      await this.seedCategoryCommissions(seedData.categoryCommissions, results);

      // Seed Vendor Tier Commissions
      await this.seedVendorCommissions(seedData.vendorCommissions, results);

      // Seed Membership Discounts
      await this.seedMembershipDiscounts(seedData.membershipDiscounts, results);

      this.logger.log(
        `✅ Commission seeding completed: ${results.globalCommissionsCreated} global, ` +
          `${results.categoryCommissionsCreated} category, ${results.vendorCommissionsCreated} vendor, ` +
          `${results.membershipDiscountsCreated} membership rules created`,
      );
    } catch (error: unknown) {
      this.logger.error('❌ Commission seeding failed:', error);
      results.success = false;
      results.errors.push((error as Error).message);
    }

    return results;
  }

  /**
   * Seed global commission rules
   */
  private async seedGlobalCommissions(
    globalCommissions: any[],
    results: any,
  ): Promise<void> {
    for (const commissionData of globalCommissions) {
      try {
        // Check if global commission already exists
        const existingCommission =
          await this.globalCommissionRepository.findOne({
            where: {
              percentage: commissionData.percentage,
            },
          });

        if (!existingCommission) {
          const globalCommission = this.globalCommissionRepository.create({
            percentage: commissionData.percentage,
            valid_from: commissionData.effectiveDate,
            note: commissionData.description,
          });

          await this.globalCommissionRepository.save(globalCommission);
          results.globalCommissionsCreated++;

          this.logger.log(
            `✨ Created global commission: ${commissionData.percentage}%`,
          );
        } else {
          this.logger.log(
            `📝 Global commission ${commissionData.percentage}% already exists`,
          );
        }
      } catch (error: unknown) {
        const errorMsg = `Failed to seed global commission ${commissionData.percentage}%: ${(error as Error).message}`;
        this.logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.success = false;
      }
    }
  }

  /**
   * Seed category-specific commission rules
   */
  private async seedCategoryCommissions(
    categoryCommissions: any[],
    results: any,
  ): Promise<void> {
    for (const commissionData of categoryCommissions) {
      try {
        // Find the category by name
        const category = await this.categoryRepository.findOne({
          where: { nameEn: commissionData.categoryName },
        });

        if (!category) {
          this.logger.warn(
            `Category not found: ${commissionData.categoryName}`,
          );
          continue;
        }

        // Check if commission already exists for this category
        const existingCommission =
          await this.categoryCommissionRepository.findOne({
            where: { category: { id: category.id } },
          });

        if (!existingCommission) {
          const categoryCommission = this.categoryCommissionRepository.create({
            category: category,
            percentage: commissionData.percentage,
            note: commissionData.description,
          });

          await this.categoryCommissionRepository.save(categoryCommission);
          results.categoryCommissionsCreated++;

          this.logger.log(
            `✨ Created category commission: ${commissionData.categoryName} - ${commissionData.percentage}%`,
          );
        } else {
          this.logger.log(
            `📝 Category commission for ${commissionData.categoryName} already exists`,
          );
        }
      } catch (error: unknown) {
        const errorMsg = `Failed to seed category commission ${commissionData.categoryName}: ${(error as Error).message}`;
        this.logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.success = false;
      }
    }
  }

  /**
   * Seed vendor tier-based commission rules
   */
  private async seedVendorCommissions(
    vendorCommissions: any[],
    results: any,
  ): Promise<void> {
    // Skip vendor commission seeding for now since it requires specific vendor entities
    // This would be implemented when actual vendors exist
    this.logger.log(
      `📝 Skipping vendor-specific commissions (requires existing vendors)`,
    );
    results.vendorCommissionsCreated = 0;
  }

  /**
   * Seed membership discount tiers
   */
  private async seedMembershipDiscounts(
    membershipDiscounts: any[],
    results: any,
  ): Promise<void> {
    // Skip membership discount seeding for now since it requires specific vendor/membership entities
    // This would be implemented when actual membership system exists
    this.logger.log(
      `📝 Skipping membership discounts (requires existing membership system)`,
    );
    results.membershipDiscountsCreated = 0;
  }

  /**
   * Clean up commission data (for testing)
   */
  async cleanupCommissions(): Promise<{ success: boolean; deleted: number }> {
    this.logger.log('🧹 Cleaning up commission data...');

    try {
      // Delete in reverse dependency order
      const membershipDeleted = await this.membershipDiscountRepository.delete(
        {},
      );
      const productDeleted = await this.productCommissionRepository.delete({});
      const vendorDeleted = await this.vendorCommissionRepository.delete({});
      const categoryDeleted = await this.categoryCommissionRepository.delete(
        {},
      );
      const globalDeleted = await this.globalCommissionRepository.delete({});

      const totalDeleted =
        (membershipDeleted.affected || 0) +
        (productDeleted.affected || 0) +
        (vendorDeleted.affected || 0) +
        (categoryDeleted.affected || 0) +
        (globalDeleted.affected || 0);

      this.logger.log(
        `✅ Cleanup completed: ${totalDeleted} commission records deleted`,
      );

      return {
        success: true,
        deleted: totalDeleted,
      };
    } catch (error: unknown) {
      this.logger.error('❌ Cleanup failed:', error);
      return {
        success: false,
        deleted: 0,
      };
    }
  }

  /**
   * Get commission seeding statistics
   */
  async getStatistics(): Promise<{
    totalGlobalCommissions: number;
    totalCategoryCommissions: number;
    totalVendorCommissions: number;
    totalMembershipDiscounts: number;
    totalProductCommissions: number;
    activeCommissions: number;
    averageCommissionRate: number;
  }> {
    const [
      totalGlobal,
      totalCategory,
      totalVendor,
      totalMembership,
      totalProduct,
      activeGlobal,
    ] = await Promise.all([
      this.globalCommissionRepository.count(),
      this.categoryCommissionRepository.count(),
      this.vendorCommissionRepository.count(),
      this.membershipDiscountRepository.count(),
      this.productCommissionRepository.count(),
      this.globalCommissionRepository.count(),
    ]);

    // Calculate average commission rate from global commissions
    const globalCommissions = await this.globalCommissionRepository.find();
    const averageCommissionRate =
      globalCommissions.length > 0
        ? globalCommissions.reduce((sum, comm) => sum + comm.percentage, 0) /
          globalCommissions.length
        : 0;

    return {
      totalGlobalCommissions: totalGlobal,
      totalCategoryCommissions: totalCategory,
      totalVendorCommissions: totalVendor,
      totalMembershipDiscounts: totalMembership,
      totalProductCommissions: totalProduct,
      activeCommissions: activeGlobal,
      averageCommissionRate: Math.round(averageCommissionRate * 100) / 100,
    };
  }

  /**
   * Validate commission data integrity
   */
  async validateSeededData(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check for global commissions
      const totalGlobalCommissions =
        await this.globalCommissionRepository.count();

      if (totalGlobalCommissions === 0) {
        issues.push('No global commission found');
        recommendations.push(
          'Create at least one global commission as fallback',
        );
      }

      // Check for commission rate consistency
      const globalCommissions = await this.globalCommissionRepository.find();

      if (globalCommissions.length > 1) {
        issues.push(
          `Multiple active global commissions found (${globalCommissions.length})`,
        );
        recommendations.push(
          'Ensure only one global commission is active at a time',
        );
      }

      // Check for reasonable commission rates
      const categoryCommissions =
        await this.categoryCommissionRepository.find();
      const highRateCommissions = categoryCommissions.filter(
        (c) => c.percentage > 20,
      );

      if (highRateCommissions.length > 0) {
        issues.push(
          `${highRateCommissions.length} category commissions have rates above 20%`,
        );
        recommendations.push(
          'Review high commission rates for business impact',
        );
      }

      // Check membership discount validity
      const membershipDiscounts =
        await this.membershipDiscountRepository.find();
      const expiredDiscounts = membershipDiscounts.filter(
        (d) => d.valid_to && d.valid_to < new Date(),
      );

      if (expiredDiscounts.length > 0) {
        issues.push(
          `${expiredDiscounts.length} membership discounts have expired`,
        );
        recommendations.push(
          'Update or deactivate expired membership discounts',
        );
      }
    } catch (error: unknown) {
      issues.push(`Validation failed: ${(error as Error).message}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
