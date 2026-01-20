/**
 * @file vendor.seeder.service.ts
 * @description Vendor Seeding Service for SouqSyria E-commerce Platform
 *
 * Generates realistic vendor test data for:
 * - Syrian vendor profiles with Arabic/English localization
 * - Various business types and categories
 * - Complete verification workflow states
 * - Performance metrics and quality scores
 * - Syrian governorate distribution
 * - Business compliance documentation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SyrianVendorEntity,
  SyrianVendorVerificationStatus,
  SyrianBusinessType,
  SyrianVendorCategory,
} from '../entities/syrian-vendor.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

@Injectable()
export class VendorSeederService {
  private readonly logger = new Logger(VendorSeederService.name);

  constructor(
    @InjectRepository(SyrianVendorEntity)
    private vendorRepository: Repository<SyrianVendorEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SyrianGovernorateEntity)
    private governorateRepository: Repository<SyrianGovernorateEntity>,
  ) {}

  /**
   * Seeds comprehensive vendor test data for Syrian e-commerce platform
   */
  async seedVendors(): Promise<{
    vendors: SyrianVendorEntity[];
    statistics: {
      totalVendors: number;
      verifiedVendors: number;
      activeVendors: number;
      averageQualityScore: number;
      businessTypeDistribution: Record<string, number>;
      governorateDistribution: Record<string, number>;
    };
  }> {
    this.logger.log('🏪 Starting comprehensive vendor seeding process...');
    const startTime = Date.now();

    try {
      // Clear existing vendor data
      await this.clearExistingData();

      // Create test users if they don't exist
      const users = await this.createTestUsers();
      
      // Create test governorates if they don't exist
      const governorates = await this.createTestGovernorates();

      // Generate diverse vendor profiles
      const vendors = await this.generateSyrianVendors(users, governorates);

      // Calculate statistics
      const statistics = await this.calculateVendorStatistics();

      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ Vendor seeding completed in ${processingTime}ms`);
      this.logger.log(`📊 Generated ${vendors.length} Syrian vendors with full business profiles`);

      return {
        vendors,
        statistics,
      };
    } catch (error) {
      this.logger.error(`❌ Vendor seeding failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Creates test users for vendor profiles
   */
  private async createTestUsers(): Promise<User[]> {
    const existingUsers = await this.userRepository.find();
    if (existingUsers.length >= 20) {
      return existingUsers.slice(0, 20);
    }

    const syrianUsers = [
      {
        email: 'ahmad.damascus@souqsyria.com',
        fullName: 'أحمد التاجر الدمشقي',
        phone: '+963987654321',
        isVerified: true,
      },
      {
        email: 'fatima.aleppo@souqsyria.com',
        fullName: 'فاطمة الحرفية الحلبية',
        phone: '+963988123456',
        isVerified: true,
      },
      {
        email: 'omar.homs@souqsyria.com',
        fullName: 'عمر تاجر حمص',
        phone: '+963989987654',
        isVerified: true,
      },
      {
        email: 'layla.lattakia@souqsyria.com',
        fullName: 'ليلى تاجرة اللاذقية',
        phone: '+963985432109',
        isVerified: true,
      },
      {
        email: 'khalil.tartous@souqsyria.com',
        fullName: 'خليل صانع طرطوس',
        phone: '+963984567890',
        isVerified: true,
      },
      {
        email: 'nour.damascus.tech@souqsyria.com',
        fullName: 'نور مهندس التقنية',
        phone: '+963987111222',
        isVerified: true,
      },
      {
        email: 'sara.businesswoman@souqsyria.com',
        fullName: 'سارة رائدة الأعمال',
        phone: '+963986789012',
        isVerified: true,
      },
      {
        email: 'hussein.manufacturer@souqsyria.com',
        fullName: 'حسين المصنع السوري',
        phone: '+963983456789',
        isVerified: true,
      },
      {
        email: 'rania.exporter@souqsyria.com',
        fullName: 'رانيا المصدرة',
        phone: '+963982345678',
        isVerified: true,
      },
      {
        email: 'marwan.wholesaler@souqsyria.com',
        fullName: 'مروان تاجر الجملة',
        phone: '+963981234567',
        isVerified: true,
      },
      {
        email: 'zeina.craftswoman@souqsyria.com',
        fullName: 'زينة الحرفية التراثية',
        phone: '+963987333444',
        isVerified: true,
      },
      {
        email: 'hassan.foodproducer@souqsyria.com',
        fullName: 'حسن منتج الأغذية',
        phone: '+963987555666',
        isVerified: true,
      },
      {
        email: 'aya.textiles@souqsyria.com',
        fullName: 'آية صناعة النسيج',
        phone: '+963987777888',
        isVerified: true,
      },
      {
        email: 'karim.electronics@souqsyria.com',
        fullName: 'كريم الإلكترونيات',
        phone: '+963987999000',
        isVerified: true,
      },
      {
        email: 'dina.cosmetics@souqsyria.com',
        fullName: 'دينا مستحضرات التجميل',
        phone: '+963987222111',
        isVerified: true,
      },
      {
        email: 'yussef.automotive@souqsyria.com',
        fullName: 'يوسف قطع السيارات',
        phone: '+963987444333',
        isVerified: true,
      },
      {
        email: 'lina.jewelry@souqsyria.com',
        fullName: 'لينا المجوهرات الذهبية',
        phone: '+963987666555',
        isVerified: true,
      },
      {
        email: 'sami.construction@souqsyria.com',
        fullName: 'سامي مواد البناء',
        phone: '+963987888777',
        isVerified: true,
      },
      {
        email: 'maya.books@souqsyria.com',
        fullName: 'مايا دار الكتب',
        phone: '+963987000999',
        isVerified: true,
      },
      {
        email: 'tariq.furniture@souqsyria.com',
        fullName: 'طارق الأثاث الدمشقي',
        phone: '+963987123321',
        isVerified: true,
      },
    ];

    const newUsers = this.userRepository.create(syrianUsers as any);
    return await this.userRepository.save(newUsers);
  }

  /**
   * Creates test Syrian governorates
   */
  private async createTestGovernorates(): Promise<SyrianGovernorateEntity[]> {
    const existingGovernorates = await this.governorateRepository.find();
    if (existingGovernorates.length >= 14) {
      return existingGovernorates;
    }

    const syrianGovernorates = [
      { nameEn: 'Damascus', nameAr: 'دمشق', code: 'DM', isActive: true },
      { nameEn: 'Aleppo', nameAr: 'حلب', code: 'AL', isActive: true },
      { nameEn: 'Homs', nameAr: 'حمص', code: 'HO', isActive: true },
      { nameEn: 'Hama', nameAr: 'حماة', code: 'HA', isActive: true },
      { nameEn: 'Lattakia', nameAr: 'اللاذقية', code: 'LA', isActive: true },
      { nameEn: 'Tartous', nameAr: 'طرطوس', code: 'TA', isActive: true },
      { nameEn: 'Daraa', nameAr: 'درعا', code: 'DA', isActive: true },
      { nameEn: 'As-Suwayda', nameAr: 'السويداء', code: 'SW', isActive: true },
      { nameEn: 'Quneitra', nameAr: 'القنيطرة', code: 'QU', isActive: true },
      { nameEn: 'Idlib', nameAr: 'إدلب', code: 'ID', isActive: true },
      { nameEn: 'Al-Hasakah', nameAr: 'الحسكة', code: 'HS', isActive: true },
      { nameEn: 'Ar-Raqqa', nameAr: 'الرقة', code: 'RA', isActive: true },
      { nameEn: 'Deir ez-Zor', nameAr: 'دير الزور', code: 'DE', isActive: true },
      { nameEn: 'Damascus Countryside', nameAr: 'ريف دمشق', code: 'RD', isActive: true },
    ];

    const newGovernorates = this.governorateRepository.create(syrianGovernorates as any);
    return await this.governorateRepository.save(newGovernorates);
  }

  /**
   * Generates diverse Syrian vendor profiles
   */
  private async generateSyrianVendors(
    users: User[],
    governorates: SyrianGovernorateEntity[],
  ): Promise<SyrianVendorEntity[]> {
    const vendors: SyrianVendorEntity[] = [];
    const vendorProfiles = this.getSyrianVendorProfiles();

    for (let i = 0; i < users.length && i < vendorProfiles.length; i++) {
      const user = users[i];
      const profile = vendorProfiles[i];
      const governorate = governorates[i % governorates.length];

      const vendorData = this.vendorRepository.create({
        userId: user.id,
        user,
        governorateId: governorate.id,
        governorate,
        ...profile,
        qualityScore: this.calculateQualityScore(profile),
        isActive: this.determineActiveStatus(profile.verificationStatus),
        workflowPriority: this.determineWorkflowPriority(profile),
        escalationLevel: this.determineEscalationLevel(profile.verificationStatus),
        createdAt: this.generateCreatedDate(),
        updatedAt: new Date(),
        verificationSubmittedAt: this.generateVerificationDate(profile.verificationStatus, 'submitted'),
        verificationReviewedAt: this.generateVerificationDate(profile.verificationStatus, 'reviewed'),
        verificationCompletedAt: this.generateVerificationDate(profile.verificationStatus, 'completed'),
        nextReviewDate: this.generateNextReviewDate(profile.verificationStatus),
        lastPerformanceReviewAt: this.generatePerformanceReviewDate(profile.verificationStatus),
      });

      const vendor = Array.isArray(vendorData) ? vendorData[0] : vendorData;
      vendors.push(vendor);
    }

    return await this.vendorRepository.save(vendors);
  }

  /**
   * Gets predefined Syrian vendor profiles with realistic data
   */
  private getSyrianVendorProfiles(): any[] {
    return [
      {
        storeNameEn: 'Damascus Electronics Hub',
        storeNameAr: 'مركز دمشق للإلكترونيات',
        storeDescriptionEn: 'Leading electronics retailer in Damascus specializing in smartphones, laptops, and smart home devices',
        storeDescriptionAr: 'أفضل متجر إلكترونيات في دمشق متخصص في الهواتف الذكية والحاسوب والأجهزة الذكية',
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.RETAILER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        contactPhone: '+963987654321',
        contactEmail: 'damascus.electronics@souqsyria.com',
        address: 'شارع الثورة، دمشق، سوريا',
        websiteUrl: 'https://damascus-electronics.sy',
        commercialRegisterNumber: 'CR-DM-2024-001',
        taxIdNumber: 'TAX-123456789',
        industrialLicenseNumber: 'IL-DM-2024-001',
        totalRevenueSyp: 850000000, // 850 million SYP
        totalOrders: 2500,
        customerSatisfactionRating: 4.5,
        fulfillmentRate: 96.8,
        returnRate: 2.1,
        responseTimeHours: 3,
        averageOrderValueSyp: 340000,
        socialMediaLinks: {
          facebook: 'https://facebook.com/damascus.electronics',
          instagram: '@damascus_electronics',
          telegram: '@damascus_electronics_sy',
        },
      },
      {
        storeNameEn: 'Aleppo Traditional Crafts',
        storeNameAr: 'الحرف التقليدية الحلبية',
        storeDescriptionEn: 'Authentic handmade Syrian crafts, traditional textiles, and Aleppo soap',
        storeDescriptionAr: 'حرف يدوية سورية أصيلة ومنسوجات تقليدية وصابون حلبي',
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        contactPhone: '+963988123456',
        contactEmail: 'aleppo.crafts@souqsyria.com',
        address: 'سوق المدينة، حلب، سوريا',
        websiteUrl: 'https://aleppo-crafts.sy',
        commercialRegisterNumber: 'CR-AL-2024-002',
        taxIdNumber: 'TAX-987654321',
        totalRevenueSyp: 125000000, // 125 million SYP
        totalOrders: 800,
        customerSatisfactionRating: 4.8,
        fulfillmentRate: 94.2,
        returnRate: 1.5,
        responseTimeHours: 6,
        averageOrderValueSyp: 156250,
        socialMediaLinks: {
          facebook: 'https://facebook.com/aleppo.crafts',
          instagram: '@aleppo_traditional_crafts',
        },
      },
      {
        storeNameEn: 'Homs Food Products Co.',
        storeNameAr: 'شركة منتجات حمص الغذائية',
        storeDescriptionEn: 'Premium Syrian food products, olive oil, and traditional preserves',
        storeDescriptionAr: 'منتجات غذائية سورية فاخرة وزيت زيتون ومخللات تقليدية',
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        contactPhone: '+963989987654',
        contactEmail: 'homs.food@souqsyria.com',
        address: 'المنطقة الصناعية، حمص، سوريا',
        websiteUrl: 'https://homs-food.sy',
        commercialRegisterNumber: 'CR-HO-2024-003',
        taxIdNumber: 'TAX-456789123',
        industrialLicenseNumber: 'IL-HO-2024-002',
        totalRevenueSyp: 450000000, // 450 million SYP
        totalOrders: 1500,
        customerSatisfactionRating: 4.3,
        fulfillmentRate: 97.5,
        returnRate: 1.8,
        responseTimeHours: 4,
        averageOrderValueSyp: 300000,
      },
      {
        storeNameEn: 'Lattakia Textiles Factory',
        storeNameAr: 'مصنع اللاذقية للنسيج',
        storeDescriptionEn: 'Syrian textile manufacturer specializing in cotton fabrics and traditional garments',
        storeDescriptionAr: 'مصنع نسيج سوري متخصص في الأقمشة القطنية والملابس التقليدية',
        businessType: SyrianBusinessType.JOINT_STOCK,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
        contactPhone: '+963985432109',
        contactEmail: 'lattakia.textiles@souqsyria.com',
        address: 'المنطقة الصناعية، اللاذقية، سوريا',
        websiteUrl: 'https://lattakia-textiles.sy',
        commercialRegisterNumber: 'CR-LA-2024-004',
        taxIdNumber: 'TAX-789123456',
        industrialLicenseNumber: 'IL-LA-2024-003',
        totalRevenueSyp: 320000000,
        totalOrders: 1200,
        customerSatisfactionRating: 4.1,
        fulfillmentRate: 92.3,
        returnRate: 3.2,
        responseTimeHours: 8,
        averageOrderValueSyp: 266667,
      },
      {
        storeNameEn: 'Tartous Furniture Workshop',
        storeNameAr: 'ورشة طرطوس للأثاث',
        storeDescriptionEn: 'Custom furniture and woodwork using traditional Syrian craftsmanship',
        storeDescriptionAr: 'أثاث مخصص وأعمال خشبية بالحرفية السورية التقليدية',
        businessType: SyrianBusinessType.PARTNERSHIP,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.SUBMITTED,
        contactPhone: '+963984567890',
        contactEmail: 'tartous.furniture@souqsyria.com',
        address: 'شارع الصناعة، طرطوس، سوريا',
        totalRevenueSyp: 180000000,
        totalOrders: 450,
        customerSatisfactionRating: 4.6,
        fulfillmentRate: 89.5,
        returnRate: 2.8,
        responseTimeHours: 12,
        averageOrderValueSyp: 400000,
      },
      {
        storeNameEn: 'Damascus Tech Solutions',
        storeNameAr: 'حلول دمشق التقنية',
        storeDescriptionEn: 'Software development and IT services for Syrian businesses',
        storeDescriptionAr: 'تطوير البرمجيات وخدمات تقنية المعلومات للأعمال السورية',
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.SERVICE_PROVIDER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        contactPhone: '+963987111222',
        contactEmail: 'damascus.tech@souqsyria.com',
        address: 'منطقة التقنية، دمشق، سوريا',
        websiteUrl: 'https://damascus-tech.sy',
        commercialRegisterNumber: 'CR-DM-2024-005',
        taxIdNumber: 'TAX-321654987',
        totalRevenueSyp: 275000000,
        totalOrders: 180,
        customerSatisfactionRating: 4.7,
        fulfillmentRate: 98.9,
        returnRate: 0.5,
        responseTimeHours: 2,
        averageOrderValueSyp: 1527778,
        socialMediaLinks: {
          linkedin: 'https://linkedin.com/company/damascus-tech',
          facebook: 'https://facebook.com/damascus.tech',
        },
      },
      {
        storeNameEn: 'Syrian Business Empire',
        storeNameAr: 'إمبراطورية الأعمال السورية',
        storeDescriptionEn: 'Multi-category business conglomerate with diverse product lines',
        storeDescriptionAr: 'مجموعة أعمال متعددة الفئات مع خطوط منتجات متنوعة',
        businessType: SyrianBusinessType.JOINT_STOCK,
        vendorCategory: SyrianVendorCategory.WHOLESALER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        contactPhone: '+963986789012',
        contactEmail: 'business.empire@souqsyria.com',
        address: 'المنطقة التجارية المركزية، دمشق، سوريا',
        websiteUrl: 'https://syrian-business-empire.sy',
        commercialRegisterNumber: 'CR-DM-2024-006',
        taxIdNumber: 'TAX-654987321',
        industrialLicenseNumber: 'IL-DM-2024-004',
        totalRevenueSyp: 1200000000, // 1.2 billion SYP
        totalOrders: 5000,
        customerSatisfactionRating: 4.2,
        fulfillmentRate: 95.1,
        returnRate: 2.9,
        responseTimeHours: 5,
        averageOrderValueSyp: 240000,
      },
      {
        storeNameEn: 'Syrian Steel Manufacturing',
        storeNameAr: 'مصنع الحديد السوري',
        storeDescriptionEn: 'Industrial steel production and metal fabrication',
        storeDescriptionAr: 'إنتاج الحديد الصناعي وتصنيع المعادن',
        businessType: SyrianBusinessType.JOINT_STOCK,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        contactPhone: '+963983456789',
        contactEmail: 'steel.manufacturing@souqsyria.com',
        address: 'المنطقة الصناعية الثقيلة، حمص، سوريا',
        websiteUrl: 'https://syrian-steel.sy',
        commercialRegisterNumber: 'CR-HO-2024-007',
        taxIdNumber: 'TAX-147258369',
        industrialLicenseNumber: 'IL-HO-2024-005',
        totalRevenueSyp: 2100000000, // 2.1 billion SYP
        totalOrders: 850,
        customerSatisfactionRating: 4.0,
        fulfillmentRate: 91.8,
        returnRate: 1.2,
        responseTimeHours: 24,
        averageOrderValueSyp: 2470588,
      },
      {
        storeNameEn: 'Export Excellence Syria',
        storeNameAr: 'التميز في التصدير السوري',
        storeDescriptionEn: 'Syrian export company specializing in agricultural products and crafts',
        storeDescriptionAr: 'شركة تصدير سورية متخصصة في المنتجات الزراعية والحرف',
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.EXPORTER,
        verificationStatus: SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
        contactPhone: '+963982345678',
        contactEmail: 'export.excellence@souqsyria.com',
        address: 'منطقة التجارة الدولية، دمشق، سوريا',
        websiteUrl: 'https://export-excellence-syria.sy',
        commercialRegisterNumber: 'CR-DM-2024-008',
        taxIdNumber: 'TAX-963852741',
        totalRevenueSyp: 680000000,
        totalOrders: 320,
        customerSatisfactionRating: 4.4,
        fulfillmentRate: 88.7,
        returnRate: 4.1,
        responseTimeHours: 16,
        averageOrderValueSyp: 2125000,
      },
      {
        storeNameEn: 'Wholesale Market Syria',
        storeNameAr: 'سوق الجملة السوري',
        storeDescriptionEn: 'Bulk trading and wholesale distribution across Syria',
        storeDescriptionAr: 'تجارة بالجملة والتوزيع على نطاق سوريا',
        businessType: SyrianBusinessType.PARTNERSHIP,
        vendorCategory: SyrianVendorCategory.WHOLESALER,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
        contactPhone: '+963981234567',
        contactEmail: 'wholesale.market@souqsyria.com',
        address: 'المنطقة التجارية، حلب، سوريا',
        totalRevenueSyp: 95000000,
        totalOrders: 150,
        customerSatisfactionRating: 3.8,
        fulfillmentRate: 85.2,
        returnRate: 5.8,
        responseTimeHours: 20,
        averageOrderValueSyp: 633333,
      },
      // Add more vendor profiles...
      {
        storeNameEn: 'Damascus Heritage Arts',
        storeNameAr: 'فنون التراث الدمشقي',
        storeDescriptionEn: 'Traditional Damascus arts and crafts including calligraphy and metalwork',
        storeDescriptionAr: 'فنون وحرف دمشقية تقليدية تشمل الخط العربي والأعمال المعدنية',
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        contactPhone: '+963987333444',
        contactEmail: 'damascus.heritage@souqsyria.com',
        address: 'البلدة القديمة، دمشق، سوريا',
        commercialRegisterNumber: 'CR-DM-2024-009',
        taxIdNumber: 'TAX-159753468',
        totalRevenueSyp: 85000000,
        totalOrders: 420,
        customerSatisfactionRating: 4.9,
        fulfillmentRate: 93.8,
        returnRate: 1.1,
        responseTimeHours: 8,
        averageOrderValueSyp: 202381,
      },
      {
        storeNameEn: 'Syrian Gourmet Foods',
        storeNameAr: 'الأطعمة السورية الفاخرة',
        storeDescriptionEn: 'Premium Syrian delicacies, spices, and gourmet food products',
        storeDescriptionAr: 'أطعمة سورية فاخرة وتوابل ومنتجات غذائية راقية',
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.SUSPENDED,
        contactPhone: '+963987555666',
        contactEmail: 'gourmet.foods@souqsyria.com',
        address: 'المنطقة الصناعية الغذائية، حمص، سوريا',
        commercialRegisterNumber: 'CR-HO-2024-010',
        taxIdNumber: 'TAX-753951468',
        totalRevenueSyp: 190000000,
        totalOrders: 750,
        customerSatisfactionRating: 3.2,
        fulfillmentRate: 82.1,
        returnRate: 8.5,
        responseTimeHours: 48,
        averageOrderValueSyp: 253333,
      },
    ];
  }

  /**
   * Calculates quality score based on vendor profile
   */
  private calculateQualityScore(profile: any): number {
    let score = 60; // Base score

    // Business type bonuses
    switch (profile.businessType) {
      case SyrianBusinessType.JOINT_STOCK:
        score += 15;
        break;
      case SyrianBusinessType.LIMITED_LIABILITY:
        score += 10;
        break;
      case SyrianBusinessType.PARTNERSHIP:
        score += 5;
        break;
    }

    // Category bonuses
    switch (profile.vendorCategory) {
      case SyrianVendorCategory.MANUFACTURER:
        score += 8;
        break;
      case SyrianVendorCategory.EXPORTER:
        score += 6;
        break;
      case SyrianVendorCategory.WHOLESALER:
        score += 4;
        break;
    }

    // Performance factors
    if (profile.customerSatisfactionRating >= 4.5) score += 10;
    else if (profile.customerSatisfactionRating >= 4.0) score += 5;
    else if (profile.customerSatisfactionRating < 3.5) score -= 10;

    if (profile.fulfillmentRate >= 95) score += 8;
    else if (profile.fulfillmentRate >= 90) score += 4;
    else if (profile.fulfillmentRate < 85) score -= 8;

    if (profile.returnRate <= 2) score += 5;
    else if (profile.returnRate <= 5) score += 2;
    else if (profile.returnRate > 8) score -= 10;

    // Documentation completeness
    if (profile.commercialRegisterNumber) score += 5;
    if (profile.taxIdNumber) score += 5;
    if (profile.industrialLicenseNumber) score += 3;
    if (profile.websiteUrl) score += 3;
    if (profile.socialMediaLinks) score += 2;

    // Revenue factor (larger businesses get slight bonus)
    if (profile.totalRevenueSyp > 1000000000) score += 5; // > 1 billion SYP
    else if (profile.totalRevenueSyp > 500000000) score += 3; // > 500 million SYP

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determines active status based on verification status
   */
  private determineActiveStatus(status: SyrianVendorVerificationStatus): boolean {
    return status === SyrianVendorVerificationStatus.VERIFIED;
  }

  /**
   * Determines workflow priority based on vendor characteristics
   */
  private determineWorkflowPriority(profile: any): 'low' | 'normal' | 'high' | 'urgent' {
    if (profile.vendorCategory === SyrianVendorCategory.MANUFACTURER) return 'high';
    if (profile.businessType === SyrianBusinessType.JOINT_STOCK) return 'high';
    if (profile.vendorCategory === SyrianVendorCategory.EXPORTER) return 'normal';
    if (profile.totalRevenueSyp > 1000000000) return 'high';
    return 'normal';
  }

  /**
   * Determines escalation level based on status
   */
  private determineEscalationLevel(status: SyrianVendorVerificationStatus): number {
    switch (status) {
      case SyrianVendorVerificationStatus.SUSPENDED:
        return 2;
      case SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Generates realistic creation dates (last 6 months)
   */
  private generateCreatedDate(): Date {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const timeDiff = now.getTime() - sixMonthsAgo.getTime();
    return new Date(sixMonthsAgo.getTime() + Math.random() * timeDiff);
  }

  /**
   * Generates verification dates based on status and type
   */
  private generateVerificationDate(
    status: SyrianVendorVerificationStatus,
    type: 'submitted' | 'reviewed' | 'completed'
  ): Date | null {
    const statusOrder = [
      SyrianVendorVerificationStatus.DRAFT,
      SyrianVendorVerificationStatus.SUBMITTED,
      SyrianVendorVerificationStatus.UNDER_REVIEW,
      SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
      SyrianVendorVerificationStatus.VERIFIED,
      SyrianVendorVerificationStatus.REJECTED,
      SyrianVendorVerificationStatus.SUSPENDED,
    ];

    const currentStatusIndex = statusOrder.indexOf(status);

    // Check if this date type should exist for the current status
    switch (type) {
      case 'submitted':
        if (currentStatusIndex <= 0) return null;
        break;
      case 'reviewed':
        if (currentStatusIndex <= 1) return null;
        break;
      case 'completed':
        if (![SyrianVendorVerificationStatus.VERIFIED, SyrianVendorVerificationStatus.REJECTED].includes(status)) return null;
        break;
    }

    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 90) + 1; // 1-90 days ago
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  }

  /**
   * Generates next review date for pending statuses
   */
  private generateNextReviewDate(status: SyrianVendorVerificationStatus): Date | null {
    const pendingStatuses = [
      SyrianVendorVerificationStatus.SUBMITTED,
      SyrianVendorVerificationStatus.UNDER_REVIEW,
      SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
      SyrianVendorVerificationStatus.PENDING_DOCUMENTS,
      SyrianVendorVerificationStatus.SUSPENDED,
    ];

    if (!pendingStatuses.includes(status)) return null;

    const now = new Date();
    let hoursFromNow;

    switch (status) {
      case SyrianVendorVerificationStatus.SUBMITTED:
        hoursFromNow = 24; // 24 hours SLA
        break;
      case SyrianVendorVerificationStatus.UNDER_REVIEW:
        hoursFromNow = 72; // 72 hours SLA
        break;
      case SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION:
        hoursFromNow = 48; // 48 hours SLA
        break;
      case SyrianVendorVerificationStatus.PENDING_DOCUMENTS:
        hoursFromNow = 168; // 7 days SLA
        break;
      case SyrianVendorVerificationStatus.SUSPENDED:
        hoursFromNow = 24 * 30; // 30 days for review
        break;
      default:
        hoursFromNow = 24;
    }

    // Add some randomization (-50% to +100% of base time)
    const randomFactor = 0.5 + Math.random() * 1.5;
    return new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000 * randomFactor);
  }

  /**
   * Generates performance review dates for verified vendors
   */
  private generatePerformanceReviewDate(status: SyrianVendorVerificationStatus): Date | null {
    if (status !== SyrianVendorVerificationStatus.VERIFIED) return null;

    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 60) + 1; // 1-60 days ago
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  }

  /**
   * Calculates vendor statistics (public method for controller)
   */
  async calculateVendorStatistics() {
    const totalVendors = await this.vendorRepository.count();
    const verifiedVendors = await this.vendorRepository.count({
      where: { verificationStatus: SyrianVendorVerificationStatus.VERIFIED },
    });
    const activeVendors = await this.vendorRepository.count({
      where: { isActive: true },
    });

    const avgQualityResult = await this.vendorRepository
      .createQueryBuilder('vendor')
      .select('AVG(vendor.qualityScore)', 'avgQuality')
      .getRawOne();

    const businessTypeResult = await this.vendorRepository
      .createQueryBuilder('vendor')
      .select('vendor.businessType', 'businessType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vendor.businessType')
      .getRawMany();

    const governorateResult = await this.vendorRepository
      .createQueryBuilder('vendor')
      .leftJoin('vendor.governorate', 'governorate')
      .select('governorate.nameEn', 'governorate')
      .addSelect('COUNT(*)', 'count')
      .groupBy('governorate.nameEn')
      .getRawMany();

    const businessTypeDistribution = businessTypeResult.reduce((acc, item) => {
      acc[item.businessType] = parseInt(item.count);
      return acc;
    }, {});

    const governorateDistribution = governorateResult.reduce((acc, item) => {
      acc[item.governorate] = parseInt(item.count);
      return acc;
    }, {});

    return {
      totalVendors,
      verifiedVendors,
      activeVendors,
      averageQualityScore: parseFloat(avgQualityResult?.avgQuality || '0'),
      businessTypeDistribution,
      governorateDistribution,
    };
  }

  /**
   * Clears existing vendor test data (public method for controller)
   */
  async clearExistingData(): Promise<void> {
    this.logger.log('🧹 Clearing existing vendor test data...');
    await this.vendorRepository.delete({});
    this.logger.log('✅ Existing vendor data cleared');
  }

  /**
   * Seeds minimal vendor data for quick testing
   */
  async seedMinimalVendors(): Promise<{ vendors: SyrianVendorEntity[] }> {
    this.logger.log('🏪 Seeding minimal vendor data...');

    const users = await this.userRepository.find({ take: 3 });
    const governorates = await this.governorateRepository.find({ take: 2 });

    if (users.length === 0 || governorates.length === 0) {
      throw new Error('No users or governorates found. Please seed users and governorates first.');
    }

    const minimalProfiles = [
      {
        storeNameEn: 'Quick Test Store 1',
        storeNameAr: 'متجر اختبار سريع 1',
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        vendorCategory: SyrianVendorCategory.RETAILER,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
        contactPhone: '+963987111111',
        contactEmail: 'quick1@souqsyria.com',
        address: 'عنوان سريع 1',
        qualityScore: 75,
        isActive: false,
      },
      {
        storeNameEn: 'Quick Test Store 2',
        storeNameAr: 'متجر اختبار سريع 2',
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        contactPhone: '+963987222222',
        contactEmail: 'quick2@souqsyria.com',
        address: 'عنوان سريع 2',
        qualityScore: 85,
        isActive: true,
      },
      {
        storeNameEn: 'Quick Test Store 3',
        storeNameAr: 'متجر اختبار سريع 3',
        businessType: SyrianBusinessType.PARTNERSHIP,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
        contactPhone: '+963987333333',
        contactEmail: 'quick3@souqsyria.com',
        address: 'عنوان سريع 3',
        qualityScore: 70,
        isActive: false,
      },
    ];

    const vendors = [];
    for (let i = 0; i < Math.min(users.length, minimalProfiles.length); i++) {
      const vendor = this.vendorRepository.create({
        userId: users[i].id,
        user: users[i],
        governorateId: governorates[i % governorates.length].id,
        governorate: governorates[i % governorates.length],
        ...minimalProfiles[i],
      });
      vendors.push(vendor);
    }

    const savedVendors = await this.vendorRepository.save(vendors);

    this.logger.log(`✅ Minimal vendor seeding completed: ${savedVendors.length} vendors`);

    return {
      vendors: savedVendors,
    };
  }
}