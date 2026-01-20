/**
 * @file seeding.config.ts
 * @description Configuration for Database Seeding Operations
 *
 * SEEDING CONFIG FEATURES:
 * - Environment-specific configurations
 * - Seed data quantities and options
 * - Performance testing parameters
 * - Syrian localization settings
 *
 * @author SouqSyria Development Team
 * @since 2025-08-11
 */

export interface SeedingConfiguration {
  users: number;
  products: number;
  orders: number;
  categories: number;
  clearExisting: boolean;
  includeSyrianData: boolean;
  includeRoles: boolean;
  batchSize: number;
}

export interface PerformanceTestConfiguration {
  loadTestUsers: number;
  bulkProducts: number;
  concurrentOrders: number;
  stressTestDuration: number;
  batchSize: number;
  enableMetrics: boolean;
}

export interface SyrianDataConfiguration {
  includeGovernorates: boolean;
  includeCities: boolean;
  includeDistricts: boolean;
  includeBanks: boolean;
  includePaymentMethods: boolean;
  includeShippingCompanies: boolean;
  enableBilingualData: boolean;
}

/**
 * Default seeding configurations for different environments
 */
export const SeedingConfigurations = {
  development: {
    basic: {
      users: 25,
      products: 50,
      orders: 100,
      categories: 15,
      clearExisting: false,
      includeSyrianData: true,
      includeRoles: true,
      batchSize: 50,
    } as SeedingConfiguration,

    full: {
      users: 100,
      products: 250,
      orders: 500,
      categories: 25,
      clearExisting: true,
      includeSyrianData: true,
      includeRoles: true,
      batchSize: 100,
    } as SeedingConfiguration,

    performance: {
      loadTestUsers: 1000,
      bulkProducts: 2000,
      concurrentOrders: 500,
      stressTestDuration: 15, // 15 minutes for development
      batchSize: 100,
      enableMetrics: true,
    } as PerformanceTestConfiguration,
  },

  testing: {
    basic: {
      users: 10,
      products: 20,
      orders: 30,
      categories: 8,
      clearExisting: true,
      includeSyrianData: false,
      includeRoles: true,
      batchSize: 25,
    } as SeedingConfiguration,

    full: {
      users: 50,
      products: 100,
      orders: 150,
      categories: 15,
      clearExisting: true,
      includeSyrianData: true,
      includeRoles: true,
      batchSize: 50,
    } as SeedingConfiguration,

    performance: {
      loadTestUsers: 500,
      bulkProducts: 1000,
      concurrentOrders: 200,
      stressTestDuration: 5, // 5 minutes for testing
      batchSize: 50,
      enableMetrics: false,
    } as PerformanceTestConfiguration,
  },

  production: {
    basic: {
      users: 200,
      products: 500,
      orders: 1000,
      categories: 50,
      clearExisting: false,
      includeSyrianData: true,
      includeRoles: true,
      batchSize: 200,
    } as SeedingConfiguration,

    full: {
      users: 1000,
      products: 2500,
      orders: 5000,
      categories: 100,
      clearExisting: false, // Never clear in production
      includeSyrianData: true,
      includeRoles: true,
      batchSize: 500,
    } as SeedingConfiguration,

    performance: {
      loadTestUsers: 10000,
      bulkProducts: 25000,
      concurrentOrders: 5000,
      stressTestDuration: 60, // 1 hour for production testing
      batchSize: 1000,
      enableMetrics: true,
    } as PerformanceTestConfiguration,
  },
};

/**
 * Syrian-specific data configuration
 */
export const SyrianDataConfig: SyrianDataConfiguration = {
  includeGovernorates: true,
  includeCities: true,
  includeDistricts: true,
  includeBanks: true,
  includePaymentMethods: true,
  includeShippingCompanies: true,
  enableBilingualData: true,
};

/**
 * Syrian governorates data for seeding
 */
export const SyrianGovernorates = [
  { nameEn: 'Damascus', nameAr: 'دمشق', code: 'DM' },
  { nameEn: 'Aleppo', nameAr: 'حلب', code: 'AL' },
  { nameEn: 'Homs', nameAr: 'حمص', code: 'HO' },
  { nameEn: 'Hama', nameAr: 'حماة', code: 'HA' },
  { nameEn: 'Latakia', nameAr: 'اللاذقية', code: 'LA' },
  { nameEn: 'Tartus', nameAr: 'طرطوس', code: 'TA' },
  { nameEn: 'Daraa', nameAr: 'درعا', code: 'DA' },
  { nameEn: 'Deir ez-Zor', nameAr: 'دير الزور', code: 'DE' },
  { nameEn: 'As-Suwayda', nameAr: 'السويداء', code: 'SU' },
  { nameEn: 'Quneitra', nameAr: 'القنيطرة', code: 'QU' },
  { nameEn: 'Idlib', nameAr: 'إدلب', code: 'ID' },
  { nameEn: 'Al-Hasakah', nameAr: 'الحسكة', code: 'HS' },
  { nameEn: 'Ar-Raqqah', nameAr: 'الرقة', code: 'RQ' },
  { nameEn: 'Damascus Countryside', nameAr: 'ريف دمشق', code: 'DR' },
];

/**
 * Syrian banks data for seeding
 */
export const SyrianBanks = [
  {
    nameEn: 'Central Bank of Syria',
    nameAr: 'مصرف سوريا المركزي',
    code: 'CBS',
    swiftCode: 'CBSYSY2A',
  },
  {
    nameEn: 'Commercial Bank of Syria',
    nameAr: 'المصرف التجاري السوري',
    code: 'CMS',
    swiftCode: 'CMBLSY2A',
  },
  {
    nameEn: 'Popular Credit Bank',
    nameAr: 'مصرف التسليف الشعبي',
    code: 'PCB',
    swiftCode: 'PCBLSY2A',
  },
  {
    nameEn: 'Agricultural Cooperative Bank',
    nameAr: 'المصرف الزراعي التعاوني',
    code: 'ACB',
    swiftCode: 'ACBLSY2A',
  },
  {
    nameEn: 'Real Estate Bank',
    nameAr: 'المصرف العقاري',
    code: 'REB',
    swiftCode: 'REBLSY2A',
  },
  {
    nameEn: 'Industrial Bank',
    nameAr: 'المصرف الصناعي',
    code: 'INB',
    swiftCode: 'INBLSY2A',
  },
  {
    nameEn: 'Bemo Saudi Fransi Bank',
    nameAr: 'بنك بيمو السعودي الفرنسي',
    code: 'BSF',
    swiftCode: 'BSFBSY2A',
  },
  {
    nameEn: 'International Bank for Trade and Finance',
    nameAr: 'المصرف الدولي للتجارة والتمويل',
    code: 'IBT',
    swiftCode: 'IBTFSY2A',
  },
];

/**
 * Default user roles for seeding
 */
export const DefaultRoles = [
  {
    name: 'admin',
    nameAr: 'مدير',
    description: 'System administrator with full access',
    descriptionAr: 'مدير النظام مع صلاحية كاملة',
    permissions: ['*'], // All permissions
  },
  {
    name: 'vendor',
    nameAr: 'بائع',
    description: 'Vendor user with product management access',
    descriptionAr: 'مستخدم بائع مع صلاحية إدارة المنتجات',
    permissions: [
      'products:create',
      'products:read',
      'products:update',
      'orders:read',
    ],
  },
  {
    name: 'customer',
    nameAr: 'عميل',
    description: 'Regular customer user',
    descriptionAr: 'مستخدم عميل عادي',
    permissions: [
      'products:read',
      'orders:create',
      'orders:read',
      'cart:manage',
    ],
  },
  {
    name: 'moderator',
    nameAr: 'مراقب',
    description: 'Content moderator with review permissions',
    descriptionAr: 'مراقب المحتوى مع صلاحيات المراجعة',
    permissions: [
      'products:read',
      'products:approve',
      'users:read',
      'reports:read',
    ],
  },
];

/**
 * Performance testing scenarios
 */
export const PerformanceScenarios = {
  'high-traffic': {
    name: 'High Traffic Simulation',
    description: 'Simulate high concurrent user traffic',
    users: 2000,
    products: 1000,
    concurrentOrders: 500,
    duration: 30, // minutes
  },
  'inventory-stress': {
    name: 'Inventory Stress Test',
    description: 'Test inventory management under stress',
    users: 500,
    products: 5000,
    concurrentOrders: 1000,
    duration: 45, // minutes
  },
  'payment-testing': {
    name: 'Payment System Testing',
    description: 'Test various payment methods and amounts',
    users: 300,
    products: 200,
    concurrentOrders: 200,
    duration: 20, // minutes
  },
  'multi-vendor': {
    name: 'Multi-Vendor Scenario',
    description: 'Test multi-vendor marketplace features',
    users: 100, // vendors
    products: 2000, // products per vendor
    concurrentOrders: 300,
    duration: 25, // minutes
  },
};

/**
 * Get configuration based on environment
 */
export function getConfiguration(environment: string = 'development') {
  const env = environment.toLowerCase();

  if (SeedingConfigurations[env]) {
    return SeedingConfigurations[env];
  }

  console.warn(
    `⚠️ Unknown environment: ${env}. Using development configuration.`,
  );
  return SeedingConfigurations.development;
}

/**
 * Get performance scenario configuration
 */
export function getScenarioConfiguration(scenarioName: string) {
  if (PerformanceScenarios[scenarioName]) {
    return PerformanceScenarios[scenarioName];
  }

  console.warn(`⚠️ Unknown scenario: ${scenarioName}`);
  return null;
}
