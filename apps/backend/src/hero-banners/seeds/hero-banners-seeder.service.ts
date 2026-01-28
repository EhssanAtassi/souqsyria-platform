/**
 * @file hero-banners-seeder.service.ts
 * @description Enterprise-grade seeding service for Syrian hero banners and campaigns
 *
 * Features:
 * - Comprehensive banner generation with Syrian market focus
 * - Damascus/Aleppo themed campaigns with cultural sensitivity
 * - Seasonal campaigns (Ramadan, Eid, Independence Day)
 * - Diaspora-targeted content with international reach
 * - Performance analytics and real-time tracking
 * - Bulk operations for enterprise banner testing
 * - Arabic and English localization support
 * - Syrian cultural events and heritage integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { HeroBanner } from '../entities/hero-banner.entity';
import { heroBannersSeedData } from './hero-banners-seeds.data';

/**
 * Interface for hero banners analytics data
 */
export interface HeroBannersAnalytics {
  totalBanners: number;
  bannersByType: Array<{ type: string; count: number }>;
  bannersByRegion: Array<{ region: string; count: number }>;
  activeBanners: number;
  seasonalBanners: number;
  performanceMetrics: {
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    totalRevenue: number;
  };
  syrianMarketMetrics: {
    damascusBanners: number;
    aleppoBanners: number;
    seasonalCampaigns: number;
    unescoRecognized: number;
    diasporaTargeted: number;
  };
  approvalStatus: {
    approved: number;
    pending: number;
    draft: number;
    rejected: number;
  };
}

/**
 * Interface for bulk operations results
 */
export interface HeroBannersBulkResults {
  created: number;
  failed: number;
  errors: string[];
}

/**
 * Comprehensive hero banners seeding service
 *
 * Provides enterprise-ready banner data generation for the SouqSyria platform
 * with Syrian market focus and cultural localization
 */
@Injectable()
export class HeroBannersSeederService {
  private readonly logger = new Logger(HeroBannersSeederService.name);

  constructor(
    @InjectRepository(HeroBanner)
    private readonly heroBannerRepository: Repository<HeroBanner>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Seeds all hero banners from seed data
   *
   * Creates 20+ banners with realistic Syrian market patterns
   * @returns Promise<{ success: boolean; count: number; message: string }>
   */
  async seedAll(): Promise<{ success: boolean; count: number; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('🎨 Starting comprehensive Syrian hero banners seeding...');

      let createdCount = 0;

      // Seed all banners from data file
      for (const bannerData of heroBannersSeedData) {
        try {
          // Check if banner already exists
          const existingBanner = await queryRunner.manager.findOne(HeroBanner, {
            where: { nameEn: bannerData.nameEn },
          });

          if (!existingBanner) {
            const newBanner = queryRunner.manager.create(HeroBanner, bannerData as any);
            await queryRunner.manager.save(newBanner);
            createdCount++;
          }
        } catch (error: unknown) {
          this.logger.warn(`Failed to create banner ${bannerData.nameEn}: ${(error as Error).message}`);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(`✅ Hero banners seeding completed: ${createdCount} banners created`);

      return {
        success: true,
        count: createdCount,
        message: `Successfully seeded ${createdCount} hero banners`
      };

    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.logger.error('❌ Hero banners seeding failed:', error);
      return {
        success: false,
        count: 0,
        message: `Hero banners seeding failed: ${(error as Error).message}`
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Seeds random selection of hero banners
   *
   * @param count Number of random banners to seed
   * @returns Promise<{ success: boolean; count: number; message: string }>
   */
  async seedRandom(count: number = 5): Promise<{ success: boolean; count: number; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`🎲 Seeding ${count} random hero banners...`);

      // Shuffle and take random banners
      const shuffled = [...heroBannersSeedData].sort(() => 0.5 - Math.random());
      const randomBanners = shuffled.slice(0, count);

      let createdCount = 0;

      for (const bannerData of randomBanners) {
        try {
          const existingBanner = await queryRunner.manager.findOne(HeroBanner, {
            where: { nameEn: bannerData.nameEn },
          });

          if (!existingBanner) {
            const newBanner = queryRunner.manager.create(HeroBanner, bannerData as any);
            await queryRunner.manager.save(newBanner);
            createdCount++;
          }
        } catch (error: unknown) {
          this.logger.warn(`Failed to create banner: ${(error as Error).message}`);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(`✅ Random banners seeding completed: ${createdCount} banners created`);

      return {
        success: true,
        count: createdCount,
        message: `Successfully seeded ${createdCount} random hero banners`
      };

    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.logger.error('❌ Random banners seeding failed:', error);
      return {
        success: false,
        count: 0,
        message: `Random banners seeding failed: ${(error as Error).message}`
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Seeds Damascus-themed hero banners
   *
   * @returns Promise<{ success: boolean; count: number; message: string }>
   */
  async seedByType(type: 'damascus' | 'aleppo' | 'seasonal' | 'diaspora'): Promise<{ success: boolean; count: number; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`🏛️ Seeding ${type} hero banners...`);

      let filteredBanners: any[] = [];

      switch (type) {
        case 'damascus':
          filteredBanners = heroBannersSeedData.filter(b => b.syrianRegion === 'Damascus');
          break;
        case 'aleppo':
          filteredBanners = heroBannersSeedData.filter(b => b.syrianRegion === 'Aleppo');
          break;
        case 'seasonal':
          filteredBanners = heroBannersSeedData.filter(b => b.type === 'seasonal');
          break;
        case 'diaspora':
          filteredBanners = heroBannersSeedData.filter(b =>
            b.nameEn.toLowerCase().includes('diaspora') ||
            b.nameEn.toLowerCase().includes('worldwide') ||
            b.nameEn.toLowerCase().includes('international')
          );
          break;
      }

      let createdCount = 0;

      for (const bannerData of filteredBanners) {
        try {
          const existingBanner = await queryRunner.manager.findOne(HeroBanner, {
            where: { nameEn: bannerData.nameEn },
          });

          if (!existingBanner) {
            const newBanner = queryRunner.manager.create(HeroBanner, bannerData as any);
            await queryRunner.manager.save(newBanner);
            createdCount++;
          }
        } catch (error: unknown) {
          this.logger.warn(`Failed to create banner: ${(error as Error).message}`);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(`✅ ${type} banners seeding completed: ${createdCount} banners created`);

      return {
        success: true,
        count: createdCount,
        message: `Successfully seeded ${createdCount} ${type} hero banners`
      };

    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ ${type} banners seeding failed:`, error);
      return {
        success: false,
        count: 0,
        message: `${type} banners seeding failed: ${(error as Error).message}`
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Clears all seeded hero banners data
   *
   * @returns Promise<object> Cleanup results
   */
  async cleanAll(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      this.logger.log('🧹 Clearing seeded hero banners data...');

      const result = await this.heroBannerRepository.delete({});
      const totalDeleted = result.affected || 0;

      this.logger.log(`✅ Cleared ${totalDeleted} hero banners`);

      return {
        success: true,
        deletedCount: totalDeleted,
        message: `Successfully cleared ${totalDeleted} hero banners`
      };

    } catch (error: unknown) {
      this.logger.error('❌ Failed to clear hero banners:', error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to clear hero banners: ${(error as Error).message}`
      };
    }
  }

  /**
   * Gets comprehensive hero banners analytics
   *
   * @returns Promise<HeroBannersAnalytics> Analytics data
   */
  async getStats(): Promise<HeroBannersAnalytics | { error: string }> {
    try {
      const totalBanners = await this.heroBannerRepository.count();

      // Get banner distribution by type
      const bannersByType = await this.heroBannerRepository
        .createQueryBuilder('banner')
        .select('banner.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('banner.type')
        .getRawMany();

      // Get banner distribution by region
      const bannersByRegion = await this.heroBannerRepository
        .createQueryBuilder('banner')
        .select('banner.syrian_region', 'region')
        .addSelect('COUNT(*)', 'count')
        .where('banner.syrian_region IS NOT NULL')
        .groupBy('banner.syrian_region')
        .getRawMany();

      // Get active banners count
      const activeBanners = await this.heroBannerRepository.count({
        where: { isActive: true, approvalStatus: 'approved' }
      });

      // Get seasonal banners count
      const seasonalBanners = await this.heroBannerRepository.count({
        where: { type: 'seasonal' }
      });

      // Calculate performance metrics
      const performanceResult = await this.heroBannerRepository
        .createQueryBuilder('banner')
        .select('SUM(banner.impressions)', 'totalImpressions')
        .addSelect('SUM(banner.clicks)', 'totalClicks')
        .addSelect('AVG(banner.click_through_rate)', 'averageCTR')
        .addSelect('SUM(banner.revenue)', 'totalRevenue')
        .getRawOne();

      // Count Damascus banners
      const damascusBanners = await this.heroBannerRepository.count({
        where: { syrianRegion: 'Damascus' }
      });

      // Count Aleppo banners
      const aleppoBanners = await this.heroBannerRepository.count({
        where: { syrianRegion: 'Aleppo' }
      });

      // Count UNESCO recognized
      const unescoRecognized = await this.heroBannerRepository.count({
        where: { unescoRecognition: true }
      });

      // Count diaspora targeted (approximate based on naming patterns)
      const diasporaTargeted = await this.heroBannerRepository
        .createQueryBuilder('banner')
        .where("banner.name_en LIKE '%diaspora%' OR banner.name_en LIKE '%worldwide%' OR banner.name_en LIKE '%international%'")
        .getCount();

      // Get approval status breakdown
      const approvalStatusBreakdown = await this.heroBannerRepository
        .createQueryBuilder('banner')
        .select('banner.approval_status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('banner.approval_status')
        .getRawMany();

      const approvalStatus = {
        approved: approvalStatusBreakdown.find(s => s.status === 'approved')?.count || 0,
        pending: approvalStatusBreakdown.find(s => s.status === 'pending')?.count || 0,
        draft: approvalStatusBreakdown.find(s => s.status === 'draft')?.count || 0,
        rejected: approvalStatusBreakdown.find(s => s.status === 'rejected')?.count || 0,
      };

      return {
        totalBanners,
        bannersByType: bannersByType.map(item => ({
          type: item.type,
          count: parseInt(item.count)
        })),
        bannersByRegion: bannersByRegion.map(item => ({
          region: item.region || 'Other',
          count: parseInt(item.count)
        })),
        activeBanners,
        seasonalBanners,
        performanceMetrics: {
          totalImpressions: parseInt(performanceResult?.totalImpressions) || 0,
          totalClicks: parseInt(performanceResult?.totalClicks) || 0,
          averageCTR: parseFloat(performanceResult?.averageCTR) || 0,
          totalRevenue: parseFloat(performanceResult?.totalRevenue) || 0,
        },
        syrianMarketMetrics: {
          damascusBanners,
          aleppoBanners,
          seasonalCampaigns: seasonalBanners,
          unescoRecognized,
          diasporaTargeted,
        },
        approvalStatus,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to get hero banners analytics:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * Bulk hero banners operations for enterprise testing
   *
   * @param operations Array of operations to perform
   * @returns Promise<HeroBannersBulkResults> Results of bulk operations
   */
  async bulkOperations(operations: any[]): Promise<HeroBannersBulkResults> {
    const results: HeroBannersBulkResults = {
      created: 0,
      failed: 0,
      errors: []
    };

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'create_banner':
            await this.createBulkBanner(operation.data);
            results.created++;
            break;
          case 'update_banner':
            await this.updateBulkBanner(operation.data);
            results.created++;
            break;
          default:
            results.errors.push(`Unknown operation type: ${operation.type}`);
            results.failed++;
        }
      } catch (error: unknown) {
        results.errors.push(`${operation.type} failed: ${(error as Error).message}`);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Creates bulk banner entries
   */
  private async createBulkBanner(bannerData: any): Promise<HeroBanner> {
    const banner = this.heroBannerRepository.create({
      nameEn: bannerData.nameEn || 'Bulk Banner',
      nameAr: bannerData.nameAr || 'لافتة مجمعة',
      headlineEn: bannerData.headlineEn || 'Bulk Headline',
      headlineAr: bannerData.headlineAr || 'عنوان مجمع',
      imageUrlDesktop: bannerData.imageUrlDesktop || 'https://cdn.souqsyria.com/hero/default.jpg',
      imageAltEn: bannerData.imageAltEn || 'Banner',
      imageAltAr: bannerData.imageAltAr || 'لافتة',
      ctaTextEn: bannerData.ctaTextEn || 'Shop Now',
      ctaTextAr: bannerData.ctaTextAr || 'تسوق الآن',
      targetType: bannerData.targetType || 'page',
      targetUrl: bannerData.targetUrl || '/',
      type: bannerData.type || 'product_spotlight',
      scheduleStart: bannerData.scheduleStart || new Date(),
      scheduleEnd: bannerData.scheduleEnd || new Date(new Date().setMonth(new Date().getMonth() + 3)),
      approvalStatus: bannerData.approvalStatus || 'draft',
      isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    });

    return await this.heroBannerRepository.save(banner);
  }

  /**
   * Updates bulk banner entries
   */
  private async updateBulkBanner(bannerData: any): Promise<void> {
    if (!bannerData.id) {
      throw new Error('Banner ID is required for update operation');
    }

    await this.heroBannerRepository.update(bannerData.id, bannerData);
  }
}
