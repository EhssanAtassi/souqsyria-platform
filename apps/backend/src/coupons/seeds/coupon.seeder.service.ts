/**
 * @file coupon.seeder.service.ts
 * @description Professional coupon seeding service for SouqSyria platform
 *
 * Provides comprehensive seeding capabilities for:
 * - Syrian market promotional coupons
 * - Seasonal and cultural event coupons
 * - User tier and category-specific coupons
 * - Testing and development coupons
 * - Performance optimization and validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CouponEntity,
  CouponType,
  CouponStatus,
  UserTier,
} from '../../promotions/entities/coupon.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';

export interface CouponSeedResult {
  success: boolean;
  couponsCreated: number;
  seasonalCouponsCreated: number;
  categorySpecificCreated: number;
  userTierCouponsCreated: number;
  errors: string[];
}

interface CouponSeedData {
  generalCoupons: Array<{
    code: string;
    title_en: string;
    title_ar: string;
    description_en: string;
    description_ar: string;
    coupon_type: CouponType;
    discount_value: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    valid_days_from_now: number;
    duration_days: number;
    usage_limit: number;
    usage_limit_per_user: number;
    allowed_user_tiers?: UserTier[];
    syrian_market_config?: any;
  }>;
  seasonalCoupons: Array<{
    code: string;
    title_en: string;
    title_ar: string;
    description_en: string;
    description_ar: string;
    coupon_type: CouponType;
    discount_value: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    valid_days_from_now: number;
    duration_days: number;
    usage_limit: number;
    usage_limit_per_user: number;
    syrian_market_config?: any;
  }>;
  categorySpecificCoupons: Array<{
    code: string;
    title_en: string;
    title_ar: string;
    description_en: string;
    description_ar: string;
    coupon_type: CouponType;
    discount_value: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    valid_days_from_now: number;
    duration_days: number;
    usage_limit: number;
    usage_limit_per_user: number;
    category_name: string;
  }>;
  userTierCoupons: Array<{
    code: string;
    title_en: string;
    title_ar: string;
    description_en: string;
    description_ar: string;
    coupon_type: CouponType;
    discount_value: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    valid_days_from_now: number;
    duration_days: number;
    usage_limit: number;
    usage_limit_per_user: number;
    allowed_user_tiers: UserTier[];
  }>;
}

@Injectable()
export class CouponSeederService {
  private readonly logger = new Logger(CouponSeederService.name);

  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,
  ) {}

  /**
   * Comprehensive coupon seed data for SouqSyria platform
   */
  private getCouponSeedData(): CouponSeedData {
    return {
      // General promotional coupons
      generalCoupons: [
        {
          code: 'WELCOME2025',
          title_en: 'Welcome to SouqSyria',
          title_ar: 'أهلاً بك في سوق سوريا',
          description_en:
            'Get 15% off your first order on SouqSyria marketplace',
          description_ar: 'احصل على خصم 15% على طلبك الأول في سوق سوريا',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 15,
          max_discount_amount: 75000, // 75,000 SYP max discount
          min_order_amount: 50000, // 50,000 SYP minimum order
          valid_days_from_now: 0,
          duration_days: 365,
          usage_limit: 1000,
          usage_limit_per_user: 1,
          allowed_user_tiers: [UserTier.STANDARD],
          syrian_market_config: {
            diaspora_customers_eligible: true,
            allowed_governorates: [], // All governorates
          },
        },
        {
          code: 'SYRIA50K',
          title_en: 'Syria Strong - 50K Discount',
          title_ar: 'سوريا قوية - خصم 50 ألف',
          description_en:
            'Fixed 50,000 SYP discount on orders above 300,000 SYP',
          description_ar:
            'خصم ثابت 50 ألف ليرة سورية على الطلبات فوق 300 ألف ليرة',
          coupon_type: CouponType.FIXED_AMOUNT,
          discount_value: 50000,
          min_order_amount: 300000,
          valid_days_from_now: 0,
          duration_days: 180,
          usage_limit: 500,
          usage_limit_per_user: 1,
        },
        {
          code: 'FREESHIP2025',
          title_en: 'Free Shipping Everywhere',
          title_ar: 'شحن مجاني في كل مكان',
          description_en: 'Free shipping to all Syrian governorates',
          description_ar: 'شحن مجاني لجميع المحافظات السورية',
          coupon_type: CouponType.FREE_SHIPPING,
          discount_value: 0,
          min_order_amount: 25000,
          valid_days_from_now: 0,
          duration_days: 90,
          usage_limit: 2000,
          usage_limit_per_user: 3,
        },
      ],

      // Syrian seasonal and cultural coupons
      seasonalCoupons: [
        {
          code: 'RAMADAN2025',
          title_en: 'Blessed Ramadan Sale',
          title_ar: 'تخفيضات رمضان المبارك',
          description_en: '20% off during the holy month of Ramadan',
          description_ar: 'خصم 20% خلال شهر رمضان الكريم',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 20,
          max_discount_amount: 100000,
          min_order_amount: 75000,
          valid_days_from_now: 30, // Starts in 30 days
          duration_days: 30, // Lasts for 30 days
          usage_limit: 10000,
          usage_limit_per_user: 2,
          syrian_market_config: {
            ramadan_special: true,
            diaspora_customers_eligible: true,
          },
        },
        {
          code: 'EID2025',
          title_en: 'Eid Celebration Discount',
          title_ar: 'خصم عيد الفطر',
          description_en: 'Celebrate Eid with 25% off selected items',
          description_ar: 'احتفل بالعيد مع خصم 25% على المنتجات المختارة',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 25,
          max_discount_amount: 150000,
          min_order_amount: 100000,
          valid_days_from_now: 60,
          duration_days: 7,
          usage_limit: 5000,
          usage_limit_per_user: 1,
          syrian_market_config: {
            eid_special: true,
          },
        },
        {
          code: 'INDEPENDENCE2025',
          title_en: 'Syria Independence Day',
          title_ar: 'عيد الاستقلال السوري',
          description_en: 'Celebrate Syrian independence with 17% discount',
          description_ar: 'احتفل بعيد الاستقلال السوري مع خصم 17%',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 17,
          max_discount_amount: 85000,
          min_order_amount: 60000,
          valid_days_from_now: 240, // April 17th
          duration_days: 3,
          usage_limit: 1000,
          usage_limit_per_user: 1,
        },
      ],

      // Category-specific coupons
      categorySpecificCoupons: [
        {
          code: 'ELECTRONICS20',
          title_en: 'Electronics Mega Sale',
          title_ar: 'تخفيضات الإلكترونيات الكبرى',
          description_en: '20% off all electronics and gadgets',
          description_ar: 'خصم 20% على جميع الإلكترونيات والأجهزة',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 20,
          max_discount_amount: 200000,
          min_order_amount: 100000,
          valid_days_from_now: 0,
          duration_days: 60,
          usage_limit: 1000,
          usage_limit_per_user: 1,
          category_name: 'Electronics',
        },
        {
          code: 'FASHION15',
          title_en: 'Fashion Week Special',
          title_ar: 'خصم أسبوع الموضة',
          description_en: '15% off fashion and clothing items',
          description_ar: 'خصم 15% على الأزياء والملابس',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 15,
          max_discount_amount: 50000,
          min_order_amount: 30000,
          valid_days_from_now: 0,
          duration_days: 45,
          usage_limit: 2000,
          usage_limit_per_user: 2,
          category_name: 'Fashion & Clothing',
        },
        {
          code: 'BOOKS10',
          title_en: 'Knowledge is Power',
          title_ar: 'المعرفة قوة',
          description_en: '10% off all books and educational materials',
          description_ar: 'خصم 10% على جميع الكتب والمواد التعليمية',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 10,
          max_discount_amount: 25000,
          min_order_amount: 15000,
          valid_days_from_now: 0,
          duration_days: 120,
          usage_limit: 3000,
          usage_limit_per_user: 5,
          category_name: 'Books & Media',
        },
      ],

      // User tier specific coupons
      userTierCoupons: [
        {
          code: 'VIP_DIAMOND_30',
          title_en: 'VIP Diamond Exclusive',
          title_ar: 'حصري لعضوية الماس',
          description_en: 'Exclusive 30% discount for VIP Diamond members',
          description_ar: 'خصم حصري 30% لأعضاء الماس المميزين',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 30,
          max_discount_amount: 300000,
          min_order_amount: 200000,
          valid_days_from_now: 0,
          duration_days: 365,
          usage_limit: 100,
          usage_limit_per_user: 3,
          allowed_user_tiers: [UserTier.VIP_DIAMOND],
        },
        {
          code: 'VIP_GOLD_25',
          title_en: 'VIP Gold Member Bonus',
          title_ar: 'مكافأة عضوية الذهب',
          description_en: 'Special 25% discount for VIP Gold members',
          description_ar: 'خصم خاص 25% لأعضاء الذهب المميزين',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 25,
          max_discount_amount: 200000,
          min_order_amount: 150000,
          valid_days_from_now: 0,
          duration_days: 365,
          usage_limit: 300,
          usage_limit_per_user: 2,
          allowed_user_tiers: [UserTier.VIP_GOLD],
        },
        {
          code: 'PREMIUM_20',
          title_en: 'Premium Member Benefit',
          title_ar: 'مزايا العضوية المميزة',
          description_en: '20% discount for Premium members',
          description_ar: 'خصم 20% لأعضاء العضوية المميزة',
          coupon_type: CouponType.PERCENTAGE,
          discount_value: 20,
          max_discount_amount: 100000,
          min_order_amount: 75000,
          valid_days_from_now: 0,
          duration_days: 365,
          usage_limit: 1000,
          usage_limit_per_user: 3,
          allowed_user_tiers: [UserTier.PREMIUM],
        },
      ],
    };
  }

  /**
   * Seed comprehensive coupon system
   */
  async seedCoupons(): Promise<CouponSeedResult> {
    this.logger.log('🎟️ Starting coupon system seeding...');

    const results: CouponSeedResult = {
      success: true,
      couponsCreated: 0,
      seasonalCouponsCreated: 0,
      categorySpecificCreated: 0,
      userTierCouponsCreated: 0,
      errors: [],
    };

    try {
      const seedData = this.getCouponSeedData();

      // Find a system admin user for creating coupons
      const adminUser = await this.userRepository.findOne({
        where: {}, // Get any user, in production you'd filter for admin role
      });

      if (!adminUser) {
        this.logger.warn(
          'No admin user found, creating coupons without created_by',
        );
      }

      // Seed general coupons
      await this.seedGeneralCoupons(
        seedData.generalCoupons,
        adminUser,
        results,
      );

      // Seed seasonal coupons
      await this.seedSeasonalCoupons(
        seedData.seasonalCoupons,
        adminUser,
        results,
      );

      // Seed category-specific coupons
      await this.seedCategorySpecificCoupons(
        seedData.categorySpecificCoupons,
        adminUser,
        results,
      );

      // Seed user tier coupons
      await this.seedUserTierCoupons(
        seedData.userTierCoupons,
        adminUser,
        results,
      );

      this.logger.log(
        `✅ Coupon seeding completed: ${results.couponsCreated} general, ` +
          `${results.seasonalCouponsCreated} seasonal, ${results.categorySpecificCreated} category, ` +
          `${results.userTierCouponsCreated} tier-specific coupons created`,
      );
    } catch (error) {
      this.logger.error('❌ Coupon seeding failed:', error);
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Seed general promotional coupons
   */
  private async seedGeneralCoupons(
    generalCoupons: any[],
    adminUser: User,
    results: CouponSeedResult,
  ): Promise<void> {
    for (const couponData of generalCoupons) {
      try {
        const existingCoupon = await this.couponRepository.findOne({
          where: { code: couponData.code },
        });

        if (!existingCoupon) {
          const coupon = this.couponRepository.create({
            ...couponData,
            valid_from: new Date(
              Date.now() + couponData.valid_days_from_now * 24 * 60 * 60 * 1000,
            ),
            valid_to: new Date(
              Date.now() +
                (couponData.valid_days_from_now + couponData.duration_days) *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
            status: CouponStatus.ACTIVE,
            usage_count: 0,
            created_by: adminUser,
            is_public: true,
            is_stackable: false,
          });

          await this.couponRepository.save(coupon);
          results.couponsCreated++;

          this.logger.log(`✨ Created general coupon: ${couponData.code}`);
        } else {
          this.logger.log(
            `📝 General coupon ${couponData.code} already exists`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to seed general coupon ${couponData.code}: ${error.message}`;
        this.logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.success = false;
      }
    }
  }

  /**
   * Seed seasonal promotional coupons
   */
  private async seedSeasonalCoupons(
    seasonalCoupons: any[],
    adminUser: User,
    results: CouponSeedResult,
  ): Promise<void> {
    for (const couponData of seasonalCoupons) {
      try {
        const existingCoupon = await this.couponRepository.findOne({
          where: { code: couponData.code },
        });

        if (!existingCoupon) {
          const coupon = this.couponRepository.create({
            ...couponData,
            valid_from: new Date(
              Date.now() + couponData.valid_days_from_now * 24 * 60 * 60 * 1000,
            ),
            valid_to: new Date(
              Date.now() +
                (couponData.valid_days_from_now + couponData.duration_days) *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
            status:
              couponData.valid_days_from_now > 0
                ? CouponStatus.DRAFT
                : CouponStatus.ACTIVE,
            usage_count: 0,
            created_by: adminUser,
            is_public: true,
            is_stackable: false,
          });

          await this.couponRepository.save(coupon);
          results.seasonalCouponsCreated++;

          this.logger.log(`✨ Created seasonal coupon: ${couponData.code}`);
        } else {
          this.logger.log(
            `📝 Seasonal coupon ${couponData.code} already exists`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to seed seasonal coupon ${couponData.code}: ${error.message}`;
        this.logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.success = false;
      }
    }
  }

  /**
   * Seed category-specific coupons
   */
  private async seedCategorySpecificCoupons(
    categorySpecificCoupons: any[],
    adminUser: User,
    results: CouponSeedResult,
  ): Promise<void> {
    for (const couponData of categorySpecificCoupons) {
      try {
        const existingCoupon = await this.couponRepository.findOne({
          where: { code: couponData.code },
        });

        if (!existingCoupon) {
          // Find the category
          const category = await this.categoryRepository.findOne({
            where: { nameEn: couponData.category_name },
          });

          const coupon = this.couponRepository.create({
            code: couponData.code,
            title_en: couponData.title_en,
            title_ar: couponData.title_ar,
            description_en: couponData.description_en,
            description_ar: couponData.description_ar,
            coupon_type: couponData.coupon_type,
            discount_value: couponData.discount_value,
            max_discount_amount: couponData.max_discount_amount,
            min_order_amount: couponData.min_order_amount,
            valid_from: new Date(
              Date.now() + couponData.valid_days_from_now * 24 * 60 * 60 * 1000,
            ),
            valid_to: new Date(
              Date.now() +
                (couponData.valid_days_from_now + couponData.duration_days) *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
            usage_limit: couponData.usage_limit,
            usage_limit_per_user: couponData.usage_limit_per_user,
            status: CouponStatus.ACTIVE,
            usage_count: 0,
            created_by: adminUser,
            category: category, // Will be null if category not found
            is_public: true,
            is_stackable: false,
          });

          await this.couponRepository.save(coupon);
          results.categorySpecificCreated++;

          this.logger.log(
            `✨ Created category coupon: ${couponData.code} for ${couponData.category_name}`,
          );
        } else {
          this.logger.log(
            `📝 Category coupon ${couponData.code} already exists`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to seed category coupon ${couponData.code}: ${error.message}`;
        this.logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.success = false;
      }
    }
  }

  /**
   * Seed user tier specific coupons
   */
  private async seedUserTierCoupons(
    userTierCoupons: any[],
    adminUser: User,
    results: CouponSeedResult,
  ): Promise<void> {
    for (const couponData of userTierCoupons) {
      try {
        const existingCoupon = await this.couponRepository.findOne({
          where: { code: couponData.code },
        });

        if (!existingCoupon) {
          const coupon = this.couponRepository.create({
            ...couponData,
            valid_from: new Date(
              Date.now() + couponData.valid_days_from_now * 24 * 60 * 60 * 1000,
            ),
            valid_to: new Date(
              Date.now() +
                (couponData.valid_days_from_now + couponData.duration_days) *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
            status: CouponStatus.ACTIVE,
            usage_count: 0,
            created_by: adminUser,
            is_public: false, // Tier-specific coupons are not public
            is_stackable: false,
          });

          await this.couponRepository.save(coupon);
          results.userTierCouponsCreated++;

          this.logger.log(
            `✨ Created tier coupon: ${couponData.code} for ${couponData.allowed_user_tiers.join(', ')}`,
          );
        } else {
          this.logger.log(`📝 Tier coupon ${couponData.code} already exists`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed tier coupon ${couponData.code}: ${error.message}`;
        this.logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.success = false;
      }
    }
  }

  /**
   * Clean up coupon data (for testing)
   */
  async cleanupCoupons(): Promise<{ success: boolean; deleted: number }> {
    this.logger.log('🧹 Cleaning up coupon data...');

    try {
      const deleteResult = await this.couponRepository.delete({});

      const totalDeleted = deleteResult.affected || 0;

      this.logger.log(
        `✅ Cleanup completed: ${totalDeleted} coupon records deleted`,
      );

      return {
        success: true,
        deleted: totalDeleted,
      };
    } catch (error) {
      this.logger.error('❌ Cleanup failed:', error);
      return {
        success: false,
        deleted: 0,
      };
    }
  }

  /**
   * Get coupon seeding statistics
   */
  async getStatistics(): Promise<{
    totalCoupons: number;
    activeCoupons: number;
    expiredCoupons: number;
    draftCoupons: number;
    totalUsage: number;
    averageDiscountValue: number;
  }> {
    const [totalCoupons, activeCoupons, expiredCoupons, draftCoupons] =
      await Promise.all([
        this.couponRepository.count(),
        this.couponRepository.count({ where: { status: CouponStatus.ACTIVE } }),
        this.couponRepository.count({
          where: { status: CouponStatus.EXPIRED },
        }),
        this.couponRepository.count({ where: { status: CouponStatus.DRAFT } }),
      ]);

    // Calculate total usage and average discount
    const coupons = await this.couponRepository.find();
    const totalUsage = coupons.reduce(
      (sum, coupon) => sum + coupon.usage_count,
      0,
    );
    const averageDiscountValue =
      coupons.length > 0
        ? coupons.reduce((sum, coupon) => sum + coupon.discount_value, 0) /
          coupons.length
        : 0;

    return {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      draftCoupons,
      totalUsage,
      averageDiscountValue: Math.round(averageDiscountValue * 100) / 100,
    };
  }
}
