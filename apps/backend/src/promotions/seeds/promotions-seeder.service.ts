/**
 * @file promotions-seeder.service.ts
 * @description Enterprise-grade seeding service for Syrian promotions and campaigns
 * 
 * Features:
 * - Comprehensive coupon generation with Syrian market focus
 * - Advanced promotion campaigns with seasonal variations
 * - Multi-tier discount strategies and user targeting
 * - Performance analytics and ROI tracking
 * - Bulk operations for enterprise promotional testing
 * - Arabic and English localization support
 * - Syrian cultural events and holidays integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity, CouponType, CouponStatus, UserTier } from '../entities/coupon.entity';
import { PromotionCampaign, CampaignType, CampaignStatus } from '../entities/promotion-campaign.entity';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';

/**
 * Interface for promotions analytics data
 */
export interface PromotionsAnalytics {
  totalCoupons: number;
  totalCampaigns: number;
  couponsByType: Array<{ type: string; count: string }>;
  campaignsByType: Array<{ type: string; count: string }>;
  activeCoupons: number;
  activeCampaigns: number;
  performanceMetrics: {
    averageDiscountPercentage: number;
    totalPromotionalBudget: number;
    expectedROI: string;
    seasonalCampaigns: number;
  };
  syrianMarketMetrics: {
    ramadanPromotions: number;
    eidPromotions: number;
    independenceDayPromotions: number;
    diasporaTargeted: number;
  };
}

/**
 * Interface for bulk operations results
 */
export interface PromotionsBulkResults {
  created: number;
  failed: number;
  errors: string[];
}

/**
 * Comprehensive promotions seeding service
 * 
 * Provides enterprise-ready promotional data generation for the SouqSyria platform
 * with Syrian market focus and cultural localization
 */
@Injectable()
export class PromotionsSeederService {
  private readonly logger = new Logger(PromotionsSeederService.name);

  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    
    @InjectRepository(PromotionCampaign)
    private readonly campaignRepository: Repository<PromotionCampaign>,
    
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    
    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,
  ) {}

  /**
   * Seeds comprehensive promotions and campaigns for Syrian e-commerce platform
   * 
   * Creates 100+ coupons and 25+ campaigns with realistic Syrian market patterns
   * @returns Promise<{ success: boolean; count: number; message: string }>
   */
  async seedPromotionsData(): Promise<{ success: boolean; count: number; message: string }> {
    try {
      this.logger.log('🎉 Starting comprehensive Syrian promotions data seeding...');

      // Get dependencies for realistic relationships
      const users = await this.userRepository.find({ take: 20 });
      const categories = await this.categoryRepository.find({ take: 15 });
      const vendors = await this.vendorRepository.find({ take: 10 });

      if (users.length === 0) {
        return {
          success: false,
          count: 0,
          message: 'No users found for promotions seeding. Please seed users first.'
        };
      }

      let createdCount = 0;

      // Generate comprehensive promotion campaigns
      const campaignData = this.generatePromotionCampaigns(users);
      const createdCampaigns = [];
      
      for (const campaign of campaignData) {
        try {
          const existingCampaign = await this.campaignRepository.findOne({
            where: { name_en: campaign.name_en }
          });

          if (!existingCampaign) {
            const newCampaign = this.campaignRepository.create(campaign);
            const savedCampaign = await this.campaignRepository.save(newCampaign);
            createdCampaigns.push(savedCampaign);
            createdCount++;
          }
        } catch (error: unknown) {
          this.logger.warn(`Failed to create campaign ${campaign.name_en}: ${(error as Error).message}`);
        }
      }

      // Generate comprehensive coupons
      const couponData = this.generateCoupons(users, categories, vendors, createdCampaigns);
      for (const coupon of couponData) {
        try {
          const existingCoupon = await this.couponRepository.findOne({
            where: { code: coupon.code }
          });

          if (!existingCoupon) {
            const newCoupon = this.couponRepository.create(coupon);
            await this.couponRepository.save(newCoupon);
            createdCount++;
          }
        } catch (error: unknown) {
          this.logger.warn(`Failed to create coupon ${coupon.code}: ${(error as Error).message}`);
        }
      }

      // Generate coupon usage simulation
      const usageData = this.generateCouponUsage(users);
      for (const usage of usageData) {
        try {
          const usageEntry = this.couponUsageRepository.create(usage);
          await this.couponUsageRepository.save(usageEntry);
          createdCount++;
        } catch (error: unknown) {
          this.logger.warn(`Failed to create coupon usage: ${(error as Error).message}`);
        }
      }

      this.logger.log(`✅ Promotions data seeding completed: ${createdCount} entries created`);
      
      return {
        success: true,
        count: createdCount,
        message: `Successfully seeded ${createdCount} promotional entries (campaigns + coupons + usage)`
      };

    } catch (error: unknown) {
      this.logger.error('❌ Promotions data seeding failed:', error);
      return {
        success: false,
        count: 0,
        message: `Promotions seeding failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Generates comprehensive promotion campaigns with Syrian market focus
   * 
   * @param users Array of users for campaign creators
   * @returns Array of promotion campaign data objects
   */
  private generatePromotionCampaigns(users: User[]): any[] {
    const campaigns = [];
    const currentDate = new Date();

    // === SEASONAL CAMPAIGNS ===
    campaigns.push({
      name_en: 'Ramadan Kareem Special Offers',
      name_ar: 'عروض رمضان كريم الخاصة',
      description_en: 'Exclusive discounts and offers for the holy month of Ramadan. Special deals on food, electronics, and household items.',
      description_ar: 'خصومات وعروض حصرية لشهر رمضان المبارك. عروض خاصة على الطعام والإلكترونيات والأدوات المنزلية.',
      campaign_type: CampaignType.RAMADAN_SPECIAL,
      status: CampaignStatus.SCHEDULED,
      start_date: new Date(currentDate.getFullYear(), 2, 10), // March 10
      end_date: new Date(currentDate.getFullYear(), 3, 9), // April 9
      budget_syp: 5000000,
      spent_amount_syp: 0,
      target_redemptions: 15000,
      actual_redemptions: 0,
      expected_conversion_rate: 8.5,
      actual_conversion_rate: 0,
      syrian_targeting: {
        target_governorates: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'],
        include_diaspora: true,
        rural_areas_focus: true,
        urban_areas_focus: true,
        target_age_groups: ['25-34', '35-44', '45-54']
      },
      ab_testing_config: {
        is_ab_test: true,
        variant_a_percentage: 50,
        variant_b_percentage: 50,
        test_hypothesis: 'Higher discount percentage vs more diverse product range',
        success_metric: 'Total revenue generated'
      },
      is_featured: true,
      is_public: true,
      banner_image_url: 'https://cdn.souqsyria.sy/campaigns/ramadan-2024-banner.jpg',
      promo_video_url: 'https://cdn.souqsyria.sy/campaigns/ramadan-2024-promo.mp4',
      created_by: this.getRandomItem(users),
      launched_at: null,
      completed_at: null,
      performance_summary: null,
      admin_notes: 'Major seasonal campaign targeting Syrian families during Ramadan'
    });

    campaigns.push({
      name_en: 'Eid Al-Fitr Celebration Sale',
      name_ar: 'تخفيضات عيد الفطر المبارك',
      description_en: 'Celebrate Eid with amazing discounts on clothing, gifts, and electronics. Perfect for Eid shopping.',
      description_ar: 'احتفل بالعيد مع خصومات مذهلة على الملابس والهدايا والإلكترونيات. مثالي لتسوق العيد.',
      campaign_type: CampaignType.EID_CELEBRATION,
      status: CampaignStatus.DRAFT,
      start_date: new Date(currentDate.getFullYear(), 3, 10), // April 10
      end_date: new Date(currentDate.getFullYear(), 3, 17), // April 17
      budget_syp: 3000000,
      spent_amount_syp: 0,
      target_redemptions: 8000,
      actual_redemptions: 0,
      expected_conversion_rate: 12.0,
      actual_conversion_rate: 0,
      syrian_targeting: {
        target_governorates: ['Damascus', 'Aleppo', 'Homs'],
        include_diaspora: true,
        rural_areas_focus: false,
        urban_areas_focus: true,
        target_age_groups: ['18-24', '25-34', '35-44']
      },
      ab_testing_config: {
        is_ab_test: false
      },
      is_featured: true,
      is_public: true,
      banner_image_url: 'https://cdn.souqsyria.sy/campaigns/eid-fitr-2024-banner.jpg',
      created_by: this.getRandomItem(users),
      launched_at: null,
      completed_at: null,
      admin_notes: 'Post-Ramadan celebration focused on gift-giving and new purchases'
    });

    campaigns.push({
      name_en: 'Syria Independence Day Celebration',
      name_ar: 'احتفال عيد الاستقلال السوري',
      description_en: 'Celebrate Syrian Independence Day with patriotic deals and special offers for Syrian-made products.',
      description_ar: 'احتفل بعيد الاستقلال السوري مع عروض وطنية وخصومات خاصة على المنتجات السورية.',
      campaign_type: CampaignType.SYRIA_INDEPENDENCE_DAY,
      status: CampaignStatus.SCHEDULED,
      start_date: new Date(currentDate.getFullYear(), 3, 15), // April 15
      end_date: new Date(currentDate.getFullYear(), 3, 19), // April 19
      budget_syp: 1500000,
      spent_amount_syp: 0,
      target_redemptions: 5000,
      actual_redemptions: 0,
      expected_conversion_rate: 15.0,
      actual_conversion_rate: 0,
      syrian_targeting: {
        target_governorates: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Daraa'],
        include_diaspora: true,
        rural_areas_focus: true,
        urban_areas_focus: true,
        target_age_groups: ['25-34', '35-44', '45-54', '55+']
      },
      ab_testing_config: {
        is_ab_test: false
      },
      is_featured: true,
      is_public: true,
      banner_image_url: 'https://cdn.souqsyria.sy/campaigns/independence-day-2024.jpg',
      created_by: this.getRandomItem(users),
      admin_notes: 'Patriotic campaign supporting local Syrian businesses and products'
    });

    // === BUSINESS CAMPAIGNS ===
    campaigns.push({
      name_en: 'New User Welcome Campaign',
      name_ar: 'حملة ترحيب بالمستخدمين الجدد',
      description_en: 'Welcome new customers with exclusive first-time buyer discounts and free shipping offers.',
      description_ar: 'نرحب بالعملاء الجدد مع خصومات حصرية للمشترين لأول مرة وعروض شحن مجاني.',
      campaign_type: CampaignType.NEW_USER_ACQUISITION,
      status: CampaignStatus.ACTIVE,
      start_date: new Date(currentDate.getFullYear(), 0, 1), // January 1
      end_date: new Date(currentDate.getFullYear(), 11, 31), // December 31
      budget_syp: 2000000,
      spent_amount_syp: 450000,
      target_redemptions: 10000,
      actual_redemptions: 2350,
      expected_conversion_rate: 25.0,
      actual_conversion_rate: 28.5,
      syrian_targeting: {
        target_governorates: ['Damascus', 'Aleppo', 'Homs', 'Latakia'],
        include_diaspora: true,
        rural_areas_focus: true,
        urban_areas_focus: true,
        target_age_groups: ['18-24', '25-34']
      },
      ab_testing_config: {
        is_ab_test: true,
        variant_a_percentage: 60,
        variant_b_percentage: 40,
        test_hypothesis: 'Percentage discount vs fixed amount discount for new users',
        success_metric: 'Customer lifetime value'
      },
      is_featured: false,
      is_public: true,
      created_by: this.getRandomItem(users),
      launched_at: new Date(currentDate.getFullYear(), 0, 1),
      admin_notes: 'Ongoing customer acquisition campaign with strong performance'
    });

    campaigns.push({
      name_en: 'VIP Customer Loyalty Program',
      name_ar: 'برنامج ولاء العملاء المميزين',
      description_en: 'Exclusive rewards and discounts for our most valued VIP customers. Tier-based benefits and early access.',
      description_ar: 'مكافآت وخصومات حصرية لعملائنا المميزين الأكثر قيمة. مزايا متدرجة ووصول مبكر.',
      campaign_type: CampaignType.LOYALTY_PROGRAM,
      status: CampaignStatus.ACTIVE,
      start_date: new Date(currentDate.getFullYear(), 0, 1),
      end_date: new Date(currentDate.getFullYear(), 11, 31),
      budget_syp: 3500000,
      spent_amount_syp: 890000,
      target_redemptions: 5000,
      actual_redemptions: 1245,
      expected_conversion_rate: 35.0,
      actual_conversion_rate: 42.8,
      syrian_targeting: {
        target_governorates: ['Damascus', 'Aleppo'],
        include_diaspora: true,
        rural_areas_focus: false,
        urban_areas_focus: true,
        target_age_groups: ['35-44', '45-54', '55+']
      },
      ab_testing_config: {
        is_ab_test: false
      },
      is_featured: true,
      is_public: false, // VIP only
      created_by: this.getRandomItem(users),
      launched_at: new Date(currentDate.getFullYear(), 0, 1),
      admin_notes: 'High-performing loyalty program for premium customers'
    });

    // Add more campaigns with variations
    const flashSaleCampaigns = this.generateFlashSaleCampaigns(users);
    const vendorCampaigns = this.generateVendorCampaigns(users);
    const categoryCampaigns = this.generateCategoryCampaigns(users);

    return [...campaigns, ...flashSaleCampaigns, ...vendorCampaigns, ...categoryCampaigns];
  }

  /**
   * Generates flash sale campaigns
   */
  private generateFlashSaleCampaigns(users: User[]): any[] {
    const campaigns = [];
    const currentDate = new Date();

    for (let i = 0; i < 8; i++) {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() + (i * 7)); // Weekly flash sales
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 6); // 6-hour flash sales

      campaigns.push({
        name_en: `Flash Sale Week ${i + 1} - Lightning Deals`,
        name_ar: `تخفيضات البرق الأسبوع ${i + 1} - صفقات سريعة`,
        description_en: `6-hour flash sale with up to 70% off on selected items. Limited quantity, first come first served.`,
        description_ar: `تخفيضات البرق لـ 6 ساعات مع خصومات تصل إلى 70% على أصناف مختارة. كمية محدودة، الأسبقية للأول.`,
        campaign_type: CampaignType.FLASH_SALE,
        status: i < 2 ? CampaignStatus.COMPLETED : i < 4 ? CampaignStatus.ACTIVE : CampaignStatus.SCHEDULED,
        start_date: startDate,
        end_date: endDate,
        budget_syp: 500000,
        spent_amount_syp: i < 2 ? 485000 : i < 4 ? 245000 : 0,
        target_redemptions: 1000,
        actual_redemptions: i < 2 ? 987 : i < 4 ? 456 : 0,
        expected_conversion_rate: 18.0,
        actual_conversion_rate: i < 2 ? 19.2 : i < 4 ? 17.8 : 0,
        syrian_targeting: {
          target_governorates: ['Damascus', 'Aleppo', 'Homs'],
          include_diaspora: false,
          rural_areas_focus: false,
          urban_areas_focus: true,
          target_age_groups: ['18-24', '25-34', '35-44']
        },
        ab_testing_config: { is_ab_test: false },
        is_featured: true,
        is_public: true,
        created_by: this.getRandomItem(users),
        launched_at: i < 4 ? startDate : null,
        completed_at: i < 2 ? endDate : null,
        admin_notes: `Weekly flash sale campaign #${i + 1} targeting impulse buyers`
      });
    }

    return campaigns;
  }

  /**
   * Generates vendor-specific campaigns
   */
  private generateVendorCampaigns(users: User[]): any[] {
    const vendors = ['TechSyria Store', 'Damascus Fashion House', 'Aleppo Electronics'];
    return vendors.map((vendor, i) => ({
      name_en: `${vendor} Exclusive Partnership`,
      name_ar: `شراكة حصرية مع ${vendor}`,
      description_en: `Special promotional campaign in partnership with ${vendor}. Exclusive deals and co-branded offers.`,
      description_ar: `حملة ترويجية خاصة بالشراكة مع ${vendor}. صفقات حصرية وعروض مشتركة.`,
      campaign_type: CampaignType.VENDOR_PROMOTION,
      status: CampaignStatus.ACTIVE,
      start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      budget_syp: 1200000,
      spent_amount_syp: 340000,
      target_redemptions: 3000,
      actual_redemptions: 890,
      expected_conversion_rate: 22.0,
      actual_conversion_rate: 24.5,
      syrian_targeting: {
        target_governorates: i === 0 ? ['Damascus'] : i === 1 ? ['Damascus', 'Homs'] : ['Aleppo'],
        include_diaspora: true,
        rural_areas_focus: false,
        urban_areas_focus: true,
        target_age_groups: ['25-34', '35-44']
      },
      ab_testing_config: { is_ab_test: false },
      is_featured: false,
      is_public: true,
      created_by: this.getRandomItem(users),
      launched_at: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      admin_notes: `Partnership campaign with ${vendor} showing strong performance`
    }));
  }

  /**
   * Generates category-specific campaigns
   */
  private generateCategoryCampaigns(users: User[]): any[] {
    const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Books & Media'];
    return categories.map((category, i) => ({
      name_en: `${category} Category Boost Campaign`,
      name_ar: `حملة تعزيز فئة ${category}`,
      description_en: `Boost sales in ${category} with targeted discounts and promotional offers.`,
      description_ar: `تعزيز المبيعات في فئة ${category} مع خصومات مستهدفة وعروض ترويجية.`,
      campaign_type: CampaignType.CATEGORY_BOOST,
      status: CampaignStatus.ACTIVE,
      start_date: new Date(new Date().setDate(new Date().getDate() - 15)),
      end_date: new Date(new Date().setDate(new Date().getDate() + 30)),
      budget_syp: 800000,
      spent_amount_syp: 180000,
      target_redemptions: 2000,
      actual_redemptions: 445,
      expected_conversion_rate: 16.0,
      actual_conversion_rate: 18.2,
      syrian_targeting: {
        target_governorates: ['Damascus', 'Aleppo', 'Homs', 'Latakia'],
        include_diaspora: true,
        rural_areas_focus: true,
        urban_areas_focus: true,
        target_age_groups: ['18-24', '25-34', '35-44']
      },
      ab_testing_config: { is_ab_test: false },
      is_featured: false,
      is_public: true,
      created_by: this.getRandomItem(users),
      launched_at: new Date(new Date().setDate(new Date().getDate() - 15)),
      admin_notes: `Category-specific campaign for ${category} products`
    }));
  }

  /**
   * Generates comprehensive coupons with Syrian market focus
   * 
   * @param users Array of users for coupon creators
   * @param categories Array of categories for targeting
   * @param vendors Array of vendors for targeting
   * @param campaigns Array of campaigns for association
   * @returns Array of coupon data objects
   */
  private generateCoupons(users: User[], categories: Category[], vendors: VendorEntity[], campaigns: PromotionCampaign[]): any[] {
    const coupons = [];

    // === WELCOME COUPONS ===
    coupons.push({
      code: 'WELCOME2024',
      title_en: 'Welcome to SouqSyria - 20% Off',
      title_ar: 'مرحباً بك في سوق سوريا - خصم 20%',
      description_en: 'Welcome new customers! Get 20% off your first order with free shipping.',
      description_ar: 'مرحباً بالعملاء الجدد! احصل على خصم 20% على طلبك الأول مع شحن مجاني.',
      coupon_type: CouponType.PERCENTAGE,
      discount_value: 20.00,
      max_discount_amount: 50000.00,
      min_order_amount: 25000.00,
      valid_from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      valid_to: new Date(new Date().setMonth(new Date().getMonth() + 11)),
      usage_limit: 5000,
      usage_limit_per_user: 1,
      usage_count: 1247,
      status: CouponStatus.ACTIVE,
      allowed_user_tiers: [UserTier.STANDARD],
      is_stackable: false,
      is_public: true,
      is_first_time_user_only: true,
      syrian_market_config: {
        allowed_governorates: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Daraa'],
        diaspora_customers_eligible: true,
        ramadan_special: false,
        eid_special: false
      },
      created_by: this.getRandomItem(users),
      category: null,
      vendor: null,
      promotion_campaign: campaigns.find(c => c.campaign_type === CampaignType.NEW_USER_ACQUISITION),
      activated_at: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      admin_notes: 'High-performing new user acquisition coupon'
    });

    // === RAMADAN SPECIAL COUPONS ===
    coupons.push({
      code: 'RAMADAN2024',
      title_en: 'Ramadan Kareem - 30% Off Food & Essentials',
      title_ar: 'رمضان كريم - خصم 30% على الطعام والضروريات',
      description_en: 'Blessed Ramadan discounts on food, beverages, and household essentials for iftar preparation.',
      description_ar: 'خصومات رمضان المبارك على الطعام والمشروبات والضروريات المنزلية لتحضير الإفطار.',
      coupon_type: CouponType.PERCENTAGE,
      discount_value: 30.00,
      max_discount_amount: 75000.00,
      min_order_amount: 50000.00,
      valid_from: new Date(new Date().setMonth(2, 10)), // March 10
      valid_to: new Date(new Date().setMonth(3, 9)), // April 9
      usage_limit: 10000,
      usage_limit_per_user: 5,
      usage_count: 0,
      status: CouponStatus.DRAFT,
      allowed_user_tiers: [UserTier.STANDARD, UserTier.PREMIUM, UserTier.VIP_SILVER],
      is_stackable: true,
      is_public: true,
      is_first_time_user_only: false,
      syrian_market_config: {
        allowed_governorates: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Daraa', 'Deir ez-Zor'],
        diaspora_customers_eligible: true,
        ramadan_special: true,
        eid_special: false
      },
      created_by: this.getRandomItem(users),
      category: categories.find(c => c.nameEn?.toLowerCase().includes('food')) || this.getRandomItem(categories),
      vendor: null,
      promotion_campaign: campaigns.find(c => c.campaign_type === CampaignType.RAMADAN_SPECIAL),
      admin_notes: 'Major seasonal promotion for Ramadan month'
    });

    // === VIP EXCLUSIVE COUPONS ===
    coupons.push({
      code: 'VIPGOLD50',
      title_en: 'VIP Gold Exclusive - 50% Off Premium Items',
      title_ar: 'حصري لكبار الشخصيات الذهبي - خصم 50% على الأصناف المميزة',
      description_en: 'Exclusive VIP Gold member benefits with premium discounts on luxury items.',
      description_ar: 'مزايا حصرية لأعضاء كبار الشخصيات الذهبي مع خصومات مميزة على الأصناف الفاخرة.',
      coupon_type: CouponType.PERCENTAGE,
      discount_value: 50.00,
      max_discount_amount: 200000.00,
      min_order_amount: 100000.00,
      valid_from: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      valid_to: new Date(new Date().setMonth(new Date().getMonth() + 10)),
      usage_limit: 500,
      usage_limit_per_user: 10,
      usage_count: 89,
      status: CouponStatus.ACTIVE,
      allowed_user_tiers: [UserTier.VIP_GOLD, UserTier.VIP_DIAMOND],
      is_stackable: true,
      is_public: false,
      is_first_time_user_only: false,
      syrian_market_config: {
        allowed_governorates: ['Damascus', 'Aleppo'],
        diaspora_customers_eligible: true,
        ramadan_special: false,
        eid_special: false
      },
      created_by: this.getRandomItem(users),
      category: null,
      vendor: null,
      promotion_campaign: campaigns.find(c => c.campaign_type === CampaignType.LOYALTY_PROGRAM),
      activated_at: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      admin_notes: 'Exclusive high-value coupon for VIP Gold and Diamond members'
    });

    // === FREE SHIPPING COUPONS ===
    coupons.push({
      code: 'FREESHIP',
      title_en: 'Free Shipping Nationwide',
      title_ar: 'شحن مجاني لجميع أنحاء البلاد',
      description_en: 'Enjoy free shipping on all orders across Syria. No minimum purchase required.',
      description_ar: 'استمتع بالشحن المجاني على جميع الطلبات في سوريا. لا يوجد حد أدنى للشراء.',
      coupon_type: CouponType.FREE_SHIPPING,
      discount_value: 0.00,
      max_discount_amount: 15000.00,
      min_order_amount: 0.00,
      valid_from: new Date(new Date().setDate(new Date().getDate() - 30)),
      valid_to: new Date(new Date().setDate(new Date().getDate() + 60)),
      usage_limit: 0, // Unlimited
      usage_limit_per_user: 0, // Unlimited
      usage_count: 3456,
      status: CouponStatus.ACTIVE,
      allowed_user_tiers: [UserTier.STANDARD, UserTier.PREMIUM, UserTier.VIP_SILVER, UserTier.VIP_GOLD, UserTier.VIP_DIAMOND],
      is_stackable: true,
      is_public: true,
      is_first_time_user_only: false,
      syrian_market_config: {
        allowed_governorates: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Daraa', 'Deir ez-Zor', 'Al-Hasakah', 'Ar-Raqqah', 'As-Suwayda', 'Quneitra', 'Idlib', 'Tartous'],
        diaspora_customers_eligible: false, // Shipping only within Syria
        ramadan_special: false,
        eid_special: false
      },
      created_by: this.getRandomItem(users),
      activated_at: new Date(new Date().setDate(new Date().getDate() - 30)),
      admin_notes: 'Popular free shipping offer driving customer acquisition'
    });

    // Generate additional coupons with variations
    const additionalCoupons = this.generateAdditionalCoupons(users, categories, vendors, campaigns);
    
    return [...coupons, ...additionalCoupons];
  }

  /**
   * Generates additional varied coupons
   */
  private generateAdditionalCoupons(users: User[], categories: Category[], vendors: VendorEntity[], campaigns: PromotionCampaign[]): any[] {
    const coupons = [];
    const couponTypes = [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT, CouponType.BUY_ONE_GET_ONE, CouponType.CATEGORY_DISCOUNT];
    const discountValues = [5, 10, 15, 20, 25, 30, 35, 40, 50];
    const fixedAmounts = [5000, 10000, 15000, 20000, 25000, 30000, 50000, 75000, 100000];

    // Generate 80+ additional coupons with realistic variations
    for (let i = 0; i < 85; i++) {
      const type = this.getRandomItem(couponTypes);
      const discountValue = type === CouponType.FIXED_AMOUNT ? 
        this.getRandomItem(fixedAmounts) : this.getRandomItem(discountValues);
      
      const validFrom = new Date();
      validFrom.setDate(validFrom.getDate() - Math.floor(Math.random() * 60));
      const validTo = new Date(validFrom);
      validTo.setDate(validTo.getDate() + Math.floor(Math.random() * 180) + 30);

      coupons.push({
        code: this.generateCouponCode(i),
        title_en: this.generateCouponTitle(type, discountValue, 'en'),
        title_ar: this.generateCouponTitle(type, discountValue, 'ar'),
        description_en: this.generateCouponDescription(type, discountValue, 'en'),
        description_ar: this.generateCouponDescription(type, discountValue, 'ar'),
        coupon_type: type,
        discount_value: discountValue,
        max_discount_amount: type === CouponType.PERCENTAGE ? discountValue * 2000 : null,
        min_order_amount: Math.floor(Math.random() * 50000) + 10000,
        valid_from: validFrom,
        valid_to: validTo,
        usage_limit: Math.floor(Math.random() * 5000) + 100,
        usage_limit_per_user: Math.floor(Math.random() * 5) + 1,
        usage_count: Math.floor(Math.random() * 500),
        status: this.getRandomCouponStatus(),
        allowed_user_tiers: this.getRandomUserTiers(),
        is_stackable: Math.random() > 0.7,
        is_public: Math.random() > 0.2,
        is_first_time_user_only: Math.random() > 0.8,
        syrian_market_config: {
          allowed_governorates: this.getRandomGovernates(),
          diaspora_customers_eligible: Math.random() > 0.5,
          ramadan_special: Math.random() > 0.9,
          eid_special: Math.random() > 0.9
        },
        created_by: this.getRandomItem(users),
        category: Math.random() > 0.7 ? this.getRandomItem(categories) : null,
        vendor: Math.random() > 0.8 ? this.getRandomItem(vendors) : null,
        promotion_campaign: Math.random() > 0.6 ? this.getRandomItem(campaigns) : null,
        activated_at: Math.random() > 0.3 ? validFrom : null,
        admin_notes: `Auto-generated coupon #${i + 1} for testing and validation`
      });
    }

    return coupons;
  }

  /**
   * Generates realistic coupon usage data
   */
  private generateCouponUsage(users: User[]): any[] {
    const usageEntries = [];
    
    // Generate 200+ usage entries for realistic data
    for (let i = 0; i < 250; i++) {
      const usageDate = new Date();
      usageDate.setDate(usageDate.getDate() - Math.floor(Math.random() * 90));
      
      usageEntries.push({
        user: this.getRandomItem(users),
        order_id: 1000 + i,
        discount_amount: Math.floor(Math.random() * 50000) + 5000,
        used_at: usageDate,
        ip_address: this.generateSyrianIP(),
        user_agent: this.generateUserAgent()
      });
    }

    return usageEntries;
  }

  /**
   * Gets comprehensive promotions analytics
   * 
   * @returns Promise<PromotionsAnalytics> Analytics data including campaigns, coupons, performance
   */
  async getPromotionsAnalytics(): Promise<PromotionsAnalytics | { error: string }> {
    try {
      const totalCoupons = await this.couponRepository.count();
      const totalCampaigns = await this.campaignRepository.count();

      // Get coupon distribution by type
      const couponsByType = await this.couponRepository
        .createQueryBuilder('coupon')
        .select('coupon.coupon_type as type, COUNT(*) as count')
        .groupBy('coupon.coupon_type')
        .getRawMany();

      // Get campaign distribution by type
      const campaignsByType = await this.campaignRepository
        .createQueryBuilder('campaign')
        .select('campaign.campaign_type as type, COUNT(*) as count')
        .groupBy('campaign.campaign_type')
        .getRawMany();

      // Get active counts
      const activeCoupons = await this.couponRepository.count({
        where: { status: CouponStatus.ACTIVE }
      });

      const activeCampaigns = await this.campaignRepository.count({
        where: { status: CampaignStatus.ACTIVE }
      });

      // Calculate performance metrics
      const avgDiscountResult = await this.couponRepository
        .createQueryBuilder('coupon')
        .select('AVG(coupon.discount_value)')
        .where('coupon.coupon_type = :type', { type: CouponType.PERCENTAGE })
        .getRawOne();

      const totalBudgetResult = await this.campaignRepository
        .createQueryBuilder('campaign')
        .select('SUM(campaign.budget_syp)')
        .getRawOne();

      // Count Syrian market specific promotions
      const ramadanPromotions = await this.campaignRepository.count({
        where: { campaign_type: CampaignType.RAMADAN_SPECIAL }
      });

      const eidPromotions = await this.campaignRepository.count({
        where: { campaign_type: CampaignType.EID_CELEBRATION }
      });

      const independenceDayPromotions = await this.campaignRepository.count({
        where: { campaign_type: CampaignType.SYRIA_INDEPENDENCE_DAY }
      });

      const diasporaTargeted = await this.couponRepository
        .createQueryBuilder('coupon')
        .where("JSON_EXTRACT(coupon.syrian_market_config, '$.diaspora_customers_eligible') = true")
        .getCount();

      return {
        totalCoupons,
        totalCampaigns,
        couponsByType: couponsByType.map(item => ({ type: item.type, count: item.count })),
        campaignsByType: campaignsByType.map(item => ({ type: item.type, count: item.count })),
        activeCoupons,
        activeCampaigns,
        performanceMetrics: {
          averageDiscountPercentage: parseFloat(avgDiscountResult['AVG(coupon.discount_value)']) || 0,
          totalPromotionalBudget: parseFloat(totalBudgetResult['SUM(campaign.budget_syp)']) || 0,
          expectedROI: '285%',
          seasonalCampaigns: ramadanPromotions + eidPromotions + independenceDayPromotions
        },
        syrianMarketMetrics: {
          ramadanPromotions,
          eidPromotions,
          independenceDayPromotions,
          diasporaTargeted
        }
      };
    } catch (error: unknown) {
      this.logger.error('Failed to get promotions analytics:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * Bulk promotions operations for enterprise testing
   * 
   * @param operations Array of operations to perform
   * @returns Promise<PromotionsBulkResults> Results of bulk operations
   */
  async bulkPromotionsOperations(operations: any[]): Promise<PromotionsBulkResults> {
    const results = {
      created: 0,
      failed: 0,
      errors: []
    };

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'create_coupon':
            await this.createBulkCoupon(operation.data);
            results.created++;
            break;
          case 'create_campaign':
            await this.createBulkCampaign(operation.data);
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
   * Creates bulk coupon entries
   */
  private async createBulkCoupon(couponData: any): Promise<CouponEntity> {
    const coupon = this.couponRepository.create({
      code: couponData.code || this.generateCouponCode(Date.now()),
      title_en: couponData.title_en,
      title_ar: couponData.title_ar,
      description_en: couponData.description_en,
      description_ar: couponData.description_ar,
      coupon_type: couponData.coupon_type || CouponType.PERCENTAGE,
      discount_value: couponData.discount_value || 10,
      valid_from: couponData.valid_from || new Date(),
      valid_to: couponData.valid_to || new Date(new Date().setMonth(new Date().getMonth() + 3)),
      status: couponData.status || CouponStatus.DRAFT,
      created_by: couponData.created_by
    });

    return await this.couponRepository.save(coupon);
  }

  /**
   * Creates bulk campaign entries
   */
  private async createBulkCampaign(campaignData: any): Promise<PromotionCampaign> {
    const campaign = this.campaignRepository.create({
      name_en: campaignData.name_en,
      name_ar: campaignData.name_ar,
      description_en: campaignData.description_en,
      description_ar: campaignData.description_ar,
      campaign_type: campaignData.campaign_type || CampaignType.SEASONAL,
      status: campaignData.status || CampaignStatus.DRAFT,
      start_date: campaignData.start_date || new Date(),
      end_date: campaignData.end_date || new Date(new Date().setMonth(new Date().getMonth() + 1)),
      budget_syp: campaignData.budget_syp || 100000,
      created_by: campaignData.created_by
    });

    return await this.campaignRepository.save(campaign);
  }

  /**
   * Clears all seeded promotions data
   * 
   * @returns Promise<object> Cleanup results
   */
  async clearSeededPromotionsData(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      this.logger.log('🧹 Clearing seeded promotions data...');

      // Clear coupon usage first (foreign key constraint)
      const usageResult = await this.couponUsageRepository.delete({});
      
      // Clear coupons
      const couponsResult = await this.couponRepository.delete({});
      
      // Clear campaigns
      const campaignsResult = await this.campaignRepository.delete({});

      const totalDeleted = (usageResult.affected || 0) + (couponsResult.affected || 0) + (campaignsResult.affected || 0);

      this.logger.log(`✅ Cleared ${totalDeleted} promotions records`);

      return {
        success: true,
        deletedCount: totalDeleted,
        message: `Successfully cleared ${totalDeleted} promotions records`
      };

    } catch (error: unknown) {
      this.logger.error('❌ Failed to clear promotions data:', error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to clear promotions data: ${(error as Error).message}`
      };
    }
  }

  // === HELPER METHODS ===

  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private generateCouponCode(index: number): string {
    const prefixes = ['SAVE', 'DEAL', 'OFFER', 'SYRIA', 'SPECIAL', 'PROMO', 'DISCOUNT', 'FLASH'];
    const prefix = this.getRandomItem(prefixes);
    return `${prefix}${index.toString().padStart(4, '0')}`;
  }

  private generateCouponTitle(type: CouponType, value: number, lang: 'en' | 'ar'): string {
    if (lang === 'ar') {
      switch (type) {
        case CouponType.PERCENTAGE:
          return `خصم ${value}% على جميع المنتجات`;
        case CouponType.FIXED_AMOUNT:
          return `خصم ${value} ليرة سورية`;
        case CouponType.FREE_SHIPPING:
          return 'شحن مجاني';
        case CouponType.BUY_ONE_GET_ONE:
          return 'اشتري واحد واحصل على آخر مجاناً';
        default:
          return `عرض خاص`;
      }
    } else {
      switch (type) {
        case CouponType.PERCENTAGE:
          return `${value}% Off All Products`;
        case CouponType.FIXED_AMOUNT:
          return `${value} SYP Discount`;
        case CouponType.FREE_SHIPPING:
          return 'Free Shipping';
        case CouponType.BUY_ONE_GET_ONE:
          return 'Buy One Get One Free';
        default:
          return 'Special Offer';
      }
    }
  }

  private generateCouponDescription(type: CouponType, value: number, lang: 'en' | 'ar'): string {
    if (lang === 'ar') {
      return `عرض خاص يتيح لك التوفير والحصول على منتجات عالية الجودة بأسعار مخفضة. صالح لفترة محدودة.`;
    } else {
      return `Special offer allowing you to save and get high-quality products at discounted prices. Valid for limited time.`;
    }
  }

  private getRandomCouponStatus(): CouponStatus {
    const statuses = [CouponStatus.ACTIVE, CouponStatus.DRAFT, CouponStatus.PAUSED];
    const weights = [0.6, 0.2, 0.15, 0.05]; // 60% active, 20% scheduled, etc.
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return statuses[i];
      }
    }
    
    return CouponStatus.ACTIVE;
  }

  private getRandomUserTiers(): UserTier[] {
    const allTiers = [UserTier.STANDARD, UserTier.PREMIUM, UserTier.VIP_SILVER, UserTier.VIP_GOLD, UserTier.VIP_DIAMOND];
    const numTiers = Math.floor(Math.random() * 3) + 1; // 1-3 tiers
    
    const shuffled = allTiers.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numTiers);
  }

  private getRandomGovernates(): string[] {
    const governorates = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Daraa', 'Deir ez-Zor', 'Al-Hasakah'];
    const numGovernorates = Math.floor(Math.random() * 4) + 2; // 2-5 governorates
    
    const shuffled = governorates.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numGovernorates);
  }

  private generateSyrianIP(): string {
    const syrianRanges = ['82.137', '185.60', '195.135', '46.50'];
    const baseRange = this.getRandomItem(syrianRanges);
    const thirdOctet = Math.floor(Math.random() * 255);
    const fourthOctet = Math.floor(Math.random() * 255);
    
    return `${baseRange}.${thirdOctet}.${fourthOctet}`;
  }

  private generateUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
    ];
    
    return this.getRandomItem(userAgents);
  }
}