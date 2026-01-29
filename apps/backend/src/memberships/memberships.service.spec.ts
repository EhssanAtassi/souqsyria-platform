/**
 * @file memberships.service.spec.ts
 * @description Comprehensive unit tests for MembershipsService with real Syrian market data
 *
 * TEST COVERAGE:
 * - Membership tier retrieval
 * - Syrian vendor membership plans
 * - Bilingual content (Arabic/English)
 * - Syrian business features validation
 * - Multi-currency pricing (SYP/USD)
 *
 * REAL DATA INTEGRATION:
 * - Authentic Syrian membership plans
 * - Real SYP/USD pricing
 * - Syrian business feature configurations
 * - Governorate and diaspora features
 *
 * @author SouqSyria Development Team
 * @since 2026-01-29
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipsService } from './memberships.service';
import { Membership } from './entities/membership.entity';

// =============================================================================
// SYRIAN MEMBERSHIP DATA FACTORIES
// =============================================================================

/**
 * Real Syrian Membership Plan Factory
 * Creates authentic Syrian vendor membership tiers
 */
const createSyrianMembership = (overrides?: Partial<Membership>): Partial<Membership> => ({
  id: 1,
  name: 'Basic',
  nameAr: 'أساسي',
  description: 'Perfect for individual Syrian sellers starting their journey',
  descriptionAr: 'مثالي للبائعين السوريين الأفراد الذين يبدأون رحلتهم',
  price: 50000, // 50,000 SYP per month
  priceUSD: 4.17, // ~$4.17 USD equivalent
  durationInDays: 30,
  maxProducts: 50,
  maxImagesPerProduct: 5,
  prioritySupport: false,
  commissionDiscount: 0,
  isPopular: false,
  isActive: true,
  sortOrder: 1,
  targetAudience: 'Individual sellers and small vendors in Syria',
  targetAudienceAr: 'البائعين الأفراد والتجار الصغار في سوريا',
  businessType: 'individual',
  renewalDiscount: 5,
  upgradeDiscount: 10,
  // Syrian Business Features
  taxReporting: false,
  governorateAnalytics: false,
  multiCurrencySupport: false,
  diasporaCustomerTools: false,
  localShippingIntegration: true,
  arabicCustomization: true,
  bulkImportTools: false,
  advancedAnalytics: false,
  apiAccess: false,
  whiteLabel: false,
  features: [
    'List up to 50 products',
    'Basic analytics dashboard',
    'Standard customer support',
    'Arabic storefront',
  ],
  featuresAr: [
    'إدراج حتى 50 منتج',
    'لوحة تحليلات أساسية',
    'دعم العملاء العادي',
    'واجهة متجر عربية',
  ],
  limitations: {
    categoryLimit: 3,
    monthlyOrderLimit: 100,
    storageGB: 1,
    apiCallsPerMonth: 0,
    customBrandingElements: 0,
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Real Syrian Membership Tiers
 * Authentic Syrian marketplace membership plans
 */
const syrianMembershipTiers = {
  // Basic tier for individual sellers
  basic: createSyrianMembership({
    id: 1,
    name: 'Basic',
    nameAr: 'أساسي',
    price: 50000,
    priceUSD: 4.17,
    maxProducts: 50,
    businessType: 'individual',
    sortOrder: 1,
  }),

  // Premium tier for small businesses
  premium: createSyrianMembership({
    id: 2,
    name: 'Premium',
    nameAr: 'متميز',
    description: 'Ideal for growing Syrian small businesses',
    descriptionAr: 'مثالي للشركات السورية الصغيرة النامية',
    price: 150000, // 150,000 SYP
    priceUSD: 12.50,
    durationInDays: 30,
    maxProducts: 200,
    maxImagesPerProduct: 10,
    prioritySupport: true,
    commissionDiscount: 2.5,
    isPopular: true, // Mark as recommended
    businessType: 'small_business',
    sortOrder: 2,
    taxReporting: true,
    governorateAnalytics: true,
    multiCurrencySupport: true,
    diasporaCustomerTools: true,
    bulkImportTools: true,
    advancedAnalytics: true,
    features: [
      'List up to 200 products',
      'Advanced analytics with governorate breakdown',
      'Priority customer support',
      'Multi-currency pricing (SYP/USD)',
      'Syrian diaspora customer tools',
      'Bulk product import',
    ],
    featuresAr: [
      'إدراج حتى 200 منتج',
      'تحليلات متقدمة مع تفصيل المحافظات',
      'دعم العملاء ذو الأولوية',
      'تسعير متعدد العملات (ليرة/دولار)',
      'أدوات عملاء المغتربين السوريين',
      'استيراد المنتجات بالجملة',
    ],
    limitations: {
      categoryLimit: 10,
      monthlyOrderLimit: 500,
      storageGB: 5,
      apiCallsPerMonth: 1000,
      customBrandingElements: 3,
    },
  }),

  // VIP tier for medium businesses
  vip: createSyrianMembership({
    id: 3,
    name: 'VIP',
    nameAr: 'كبار التجار',
    description: 'For established Syrian medium-sized businesses',
    descriptionAr: 'للشركات السورية المتوسطة الراسخة',
    price: 350000, // 350,000 SYP
    priceUSD: 29.17,
    durationInDays: 30,
    maxProducts: 1000,
    maxImagesPerProduct: 20,
    prioritySupport: true,
    commissionDiscount: 5.0,
    businessType: 'medium_business',
    sortOrder: 3,
    taxReporting: true,
    governorateAnalytics: true,
    multiCurrencySupport: true,
    diasporaCustomerTools: true,
    bulkImportTools: true,
    advancedAnalytics: true,
    apiAccess: true,
    features: [
      'List up to 1000 products',
      'Full analytics suite',
      'Dedicated account manager',
      'API access for integrations',
      'Custom storefront branding',
      'Priority shipping rates',
    ],
    featuresAr: [
      'إدراج حتى 1000 منتج',
      'مجموعة تحليلات كاملة',
      'مدير حساب مخصص',
      'وصول API للتكاملات',
      'تخصيص العلامة التجارية للمتجر',
      'أسعار شحن ذات أولوية',
    ],
    limitations: {
      categoryLimit: -1, // Unlimited
      monthlyOrderLimit: 2000,
      storageGB: 20,
      apiCallsPerMonth: 10000,
      customBrandingElements: 10,
    },
  }),

  // Enterprise tier for large businesses
  enterprise: createSyrianMembership({
    id: 4,
    name: 'Enterprise',
    nameAr: 'مؤسسات',
    description: 'Complete solution for large Syrian enterprises',
    descriptionAr: 'حل متكامل للمؤسسات السورية الكبيرة',
    price: 750000, // 750,000 SYP
    priceUSD: 62.50,
    durationInDays: 30,
    maxProducts: -1, // Unlimited
    maxImagesPerProduct: 50,
    prioritySupport: true,
    commissionDiscount: 10.0,
    businessType: 'enterprise',
    sortOrder: 4,
    taxReporting: true,
    governorateAnalytics: true,
    multiCurrencySupport: true,
    diasporaCustomerTools: true,
    bulkImportTools: true,
    advancedAnalytics: true,
    apiAccess: true,
    whiteLabel: true,
    features: [
      'Unlimited products',
      'White-label storefront',
      'Dedicated support team',
      'Custom API integrations',
      'Multi-warehouse support',
      'Advanced fraud protection',
    ],
    featuresAr: [
      'منتجات غير محدودة',
      'متجر بعلامة تجارية خاصة',
      'فريق دعم مخصص',
      'تكاملات API مخصصة',
      'دعم متعدد المستودعات',
      'حماية متقدمة من الاحتيال',
    ],
    limitations: {
      categoryLimit: -1,
      monthlyOrderLimit: -1,
      storageGB: 100,
      apiCallsPerMonth: -1,
      customBrandingElements: -1,
    },
  }),

  // Inactive legacy tier
  legacy: createSyrianMembership({
    id: 5,
    name: 'Legacy Starter',
    nameAr: 'البداية القديمة',
    price: 25000,
    priceUSD: 2.08,
    maxProducts: 20,
    isActive: false, // No longer available
    businessType: 'individual',
    sortOrder: 99,
  }),
};

// =============================================================================
// TEST SUITE
// =============================================================================

describe('MembershipsService', () => {
  let service: MembershipsService;
  let membershipRepository: jest.Mocked<Repository<Membership>>;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<Membership>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        {
          provide: getRepositoryToken(Membership),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
    membershipRepository = module.get(getRepositoryToken(Membership));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // SERVICE INITIALIZATION TESTS
  // ===========================================================================

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have membership repository injected', () => {
      expect(membershipRepository).toBeDefined();
    });
  });

  // ===========================================================================
  // FIND ALL MEMBERSHIPS TESTS
  // ===========================================================================

  describe('findAll', () => {
    /**
     * Test: Should return all Syrian membership tiers
     * Validates: Complete tier listing for Syrian marketplace
     */
    it('should return all Syrian membership tiers', async () => {
      const allMemberships = [
        syrianMembershipTiers.basic,
        syrianMembershipTiers.premium,
        syrianMembershipTiers.vip,
        syrianMembershipTiers.enterprise,
      ];

      membershipRepository.find.mockResolvedValue(allMemberships as Membership[]);

      const result = await service.findAll();

      expect(membershipRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(4);
    });

    /**
     * Test: Should return memberships with Arabic names
     * Validates: Bilingual content support
     */
    it('should return memberships with Arabic names', async () => {
      const memberships = [
        syrianMembershipTiers.basic,
        syrianMembershipTiers.premium,
      ];

      membershipRepository.find.mockResolvedValue(memberships as Membership[]);

      const result = await service.findAll();

      expect(result[0].nameAr).toBe('أساسي');
      expect(result[1].nameAr).toBe('متميز');
    });

    /**
     * Test: Should return memberships with SYP and USD pricing
     * Validates: Multi-currency support for Syrian marketplace
     */
    it('should return memberships with SYP and USD pricing', async () => {
      const memberships = [syrianMembershipTiers.premium];

      membershipRepository.find.mockResolvedValue(memberships as Membership[]);

      const result = await service.findAll();

      expect(result[0].price).toBe(150000); // SYP
      expect(result[0].priceUSD).toBe(12.50); // USD
    });

    /**
     * Test: Should return memberships with Syrian business features
     * Validates: Syrian-specific feature flags
     */
    it('should return memberships with Syrian business features', async () => {
      const memberships = [syrianMembershipTiers.vip];

      membershipRepository.find.mockResolvedValue(memberships as Membership[]);

      const result = await service.findAll();

      expect(result[0].governorateAnalytics).toBe(true);
      expect(result[0].diasporaCustomerTools).toBe(true);
      expect(result[0].localShippingIntegration).toBe(true);
      expect(result[0].taxReporting).toBe(true);
    });

    /**
     * Test: Should handle empty membership list
     * Validates: Empty result handling
     */
    it('should handle empty membership list', async () => {
      membershipRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    /**
     * Test: Should return inactive memberships if requested
     * Validates: Legacy tier handling
     */
    it('should return both active and inactive memberships', async () => {
      const allMemberships = [
        syrianMembershipTiers.basic,
        syrianMembershipTiers.legacy, // isActive: false
      ];

      membershipRepository.find.mockResolvedValue(allMemberships as Membership[]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[1].isActive).toBe(false);
    });
  });

  // ===========================================================================
  // FIND ONE MEMBERSHIP TESTS
  // ===========================================================================

  describe('findOne', () => {
    /**
     * Test: Should find Syrian membership by ID
     * Validates: Single membership retrieval
     */
    it('should find Syrian membership by ID', async () => {
      const membership = syrianMembershipTiers.premium;

      membershipRepository.findOne.mockResolvedValue(membership as Membership);

      const result = await service.findOne(2);

      expect(membershipRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(result.name).toBe('Premium');
      expect(result.nameAr).toBe('متميز');
    });

    /**
     * Test: Should return null for non-existent membership
     * Validates: Not found handling
     */
    it('should return null for non-existent membership', async () => {
      membershipRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(99999);

      expect(result).toBeNull();
    });

    /**
     * Test: Should find enterprise tier with unlimited features
     * Validates: Unlimited feature configuration
     */
    it('should find enterprise tier with unlimited features', async () => {
      const enterprise = syrianMembershipTiers.enterprise;

      membershipRepository.findOne.mockResolvedValue(enterprise as Membership);

      const result = await service.findOne(4);

      expect(result.maxProducts).toBe(-1); // Unlimited
      expect(result.limitations.categoryLimit).toBe(-1); // Unlimited
      expect(result.whiteLabel).toBe(true);
    });

    /**
     * Test: Should find membership with full feature list
     * Validates: Feature array retrieval
     */
    it('should find membership with full feature list', async () => {
      const premium = syrianMembershipTiers.premium;

      membershipRepository.findOne.mockResolvedValue(premium as Membership);

      const result = await service.findOne(2);

      expect(result.features).toContain('List up to 200 products');
      expect(result.featuresAr).toContain('إدراج حتى 200 منتج');
    });
  });

  // ===========================================================================
  // REAL SYRIAN MARKET SCENARIOS
  // ===========================================================================

  describe('Real Syrian Market Scenarios', () => {
    /**
     * Test: Should return membership for Damascus small vendor
     * Validates: Small business tier selection
     */
    it('should return appropriate membership for Damascus small vendor', async () => {
      const smallBusinessMembership = syrianMembershipTiers.premium;

      membershipRepository.findOne.mockResolvedValue(smallBusinessMembership as Membership);

      const result = await service.findOne(2);

      expect(result.businessType).toBe('small_business');
      expect(result.governorateAnalytics).toBe(true);
      expect(result.price).toBe(150000); // SYP
    });

    /**
     * Test: Should return membership for Aleppo enterprise vendor
     * Validates: Enterprise tier features
     */
    it('should return membership for Aleppo enterprise vendor', async () => {
      const enterpriseMembership = syrianMembershipTiers.enterprise;

      membershipRepository.findOne.mockResolvedValue(enterpriseMembership as Membership);

      const result = await service.findOne(4);

      expect(result.businessType).toBe('enterprise');
      expect(result.apiAccess).toBe(true);
      expect(result.whiteLabel).toBe(true);
      expect(result.commissionDiscount).toBe(10.0);
    });

    /**
     * Test: Should return membership with diaspora customer tools
     * Validates: Syrian diaspora support features
     */
    it('should return membership with diaspora customer tools', async () => {
      const diasporaFriendlyMembership = syrianMembershipTiers.vip;

      membershipRepository.findOne.mockResolvedValue(diasporaFriendlyMembership as Membership);

      const result = await service.findOne(3);

      expect(result.diasporaCustomerTools).toBe(true);
      expect(result.multiCurrencySupport).toBe(true);
      expect(result.priceUSD).toBeDefined();
    });

    /**
     * Test: Should return popular membership tier
     * Validates: Marketing recommendation flag
     */
    it('should return popular membership tier', async () => {
      const popularMembership = syrianMembershipTiers.premium;

      membershipRepository.findOne.mockResolvedValue(popularMembership as Membership);

      const result = await service.findOne(2);

      expect(result.isPopular).toBe(true);
    });

    /**
     * Test: Should handle individual Syrian seller tier
     * Validates: Basic tier for individual vendors
     */
    it('should handle individual Syrian seller tier', async () => {
      const basicMembership = syrianMembershipTiers.basic;

      membershipRepository.findOne.mockResolvedValue(basicMembership as Membership);

      const result = await service.findOne(1);

      expect(result.businessType).toBe('individual');
      expect(result.maxProducts).toBe(50);
      expect(result.price).toBe(50000); // Affordable for individual sellers
      expect(result.localShippingIntegration).toBe(true);
      expect(result.arabicCustomization).toBe(true);
    });
  });

  // ===========================================================================
  // MEMBERSHIP PRICING TESTS
  // ===========================================================================

  describe('Membership Pricing', () => {
    /**
     * Test: Should return correct SYP prices for all tiers
     * Validates: Syrian Pound pricing
     */
    it('should return correct SYP prices for all tiers', async () => {
      const allMemberships = [
        syrianMembershipTiers.basic,
        syrianMembershipTiers.premium,
        syrianMembershipTiers.vip,
        syrianMembershipTiers.enterprise,
      ];

      membershipRepository.find.mockResolvedValue(allMemberships as Membership[]);

      const result = await service.findAll();

      expect(result[0].price).toBe(50000);    // Basic: 50K SYP
      expect(result[1].price).toBe(150000);   // Premium: 150K SYP
      expect(result[2].price).toBe(350000);   // VIP: 350K SYP
      expect(result[3].price).toBe(750000);   // Enterprise: 750K SYP
    });

    /**
     * Test: Should return USD prices for diaspora customers
     * Validates: Dollar pricing for overseas Syrians
     */
    it('should return USD prices for diaspora customers', async () => {
      const allMemberships = [
        syrianMembershipTiers.basic,
        syrianMembershipTiers.premium,
      ];

      membershipRepository.find.mockResolvedValue(allMemberships as Membership[]);

      const result = await service.findAll();

      expect(result[0].priceUSD).toBe(4.17);   // ~$4 USD
      expect(result[1].priceUSD).toBe(12.50);  // ~$12.50 USD
    });

    /**
     * Test: Should return commission discounts by tier
     * Validates: Vendor commission savings
     */
    it('should return commission discounts by tier', async () => {
      const allMemberships = [
        syrianMembershipTiers.basic,
        syrianMembershipTiers.premium,
        syrianMembershipTiers.vip,
        syrianMembershipTiers.enterprise,
      ];

      membershipRepository.find.mockResolvedValue(allMemberships as Membership[]);

      const result = await service.findAll();

      expect(result[0].commissionDiscount).toBe(0);     // Basic: No discount
      expect(result[1].commissionDiscount).toBe(2.5);   // Premium: 2.5%
      expect(result[2].commissionDiscount).toBe(5.0);   // VIP: 5%
      expect(result[3].commissionDiscount).toBe(10.0);  // Enterprise: 10%
    });
  });

  // ===========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ===========================================================================

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test: Should handle membership with null optional fields
     * Validates: Nullable field handling
     */
    it('should handle membership with null optional fields', async () => {
      const minimalMembership = createSyrianMembership({
        id: 10,
        name: 'Minimal',
        nameAr: null,
        description: null,
        descriptionAr: null,
        priceUSD: null,
        limitations: null,
      });

      membershipRepository.findOne.mockResolvedValue(minimalMembership as Membership);

      const result = await service.findOne(10);

      expect(result).toBeDefined();
      expect(result.nameAr).toBeNull();
      expect(result.priceUSD).toBeNull();
    });

    /**
     * Test: Should handle membership with maximum values
     * Validates: Large number handling
     */
    it('should handle membership with maximum values', async () => {
      const maxMembership = createSyrianMembership({
        id: 99,
        price: 10000000, // 10M SYP
        maxProducts: 100000,
        limitations: {
          storageGB: 1000,
          apiCallsPerMonth: 1000000,
        },
      });

      membershipRepository.findOne.mockResolvedValue(maxMembership as Membership);

      const result = await service.findOne(99);

      expect(result.price).toBe(10000000);
      expect(result.maxProducts).toBe(100000);
    });

    /**
     * Test: Should handle membership with special Arabic characters
     * Validates: Unicode and special character handling
     */
    it('should handle membership with special Arabic characters', async () => {
      const arabicMembership = createSyrianMembership({
        id: 100,
        nameAr: 'باقة "التاجر المميز" - خصم 20%',
        descriptionAr: 'للتجار السوريين الكبار & المؤسسات (حلب، دمشق)',
      });

      membershipRepository.findOne.mockResolvedValue(arabicMembership as Membership);

      const result = await service.findOne(100);

      expect(result.nameAr).toContain('التاجر المميز');
      expect(result.descriptionAr).toContain('&');
    });
  });
});
