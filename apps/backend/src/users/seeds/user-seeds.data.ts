/**
 * @file user-seeds.data.ts
 * @description Comprehensive seed data for Syrian e-commerce users
 * Includes diverse user profiles representing Syrian demographics and diaspora
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

export interface UserSeedData {
  firebaseUid: string;
  email: string;
  phone?: string;
  fullName: string;
  passwordHash?: string;
  isVerified: boolean;
  roleName: string; // Will be resolved to role ID during seeding
  assignedRoleName?: string; // For staff roles
  lastLoginAt?: Date;
  isBanned: boolean;
  isSuspended: boolean;
  metadata?: Record<string, any>;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  passwordChangedAt?: Date;
  lastActivityAt?: Date;
  banReason?: string;
  bannedUntil?: Date;
  userType: 'customer' | 'vendor' | 'admin' | 'staff' | 'system';
  location: string; // Syrian governorate or diaspora country
  preferredLanguage: 'ar' | 'en' | 'both';
  accountTier: 'basic' | 'premium' | 'vip' | 'enterprise';
}

/**
 * ADMIN USERS: System administrators and staff
 */
export const ADMIN_USERS: UserSeedData[] = [
  // Super Admin
  {
    firebaseUid: 'admin-superuser-001',
    email: 'admin@souqsyria.com',
    phone: '+963-11-1234567',
    fullName: 'محمد العلي - Mohammed Al-Ali',
    passwordHash: '$2b$10$example.hash.for.development', // Will be properly hashed during seeding
    isVerified: true,
    roleName: 'super_admin',
    lastLoginAt: new Date('2025-08-14T08:00:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      department: 'IT',
      employeeId: 'EMP001',
      accessLevel: 'full',
      canManageUsers: true,
      canManageOrders: true,
      canAccessFinancials: true,
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-08-01T10:00:00Z'),
    lastActivityAt: new Date('2025-08-14T08:30:00Z'),
    userType: 'admin',
    location: 'Damascus',
    preferredLanguage: 'both',
    accountTier: 'enterprise',
  },

  // Marketing Manager
  {
    firebaseUid: 'staff-marketing-001',
    email: 'marketing@souqsyria.com',
    phone: '+963-21-9876543',
    fullName: 'فاطمة الشامي - Fatima Al-Shami',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'staff',
    assignedRoleName: 'marketing_manager',
    lastLoginAt: new Date('2025-08-14T09:15:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      department: 'Marketing',
      employeeId: 'EMP002',
      accessLevel: 'marketing',
      canManageCampaigns: true,
      canViewAnalytics: true,
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-07-15T14:00:00Z'),
    lastActivityAt: new Date('2025-08-14T09:45:00Z'),
    userType: 'staff',
    location: 'Aleppo',
    preferredLanguage: 'both',
    accountTier: 'premium',
  },

  // Customer Support
  {
    firebaseUid: 'staff-support-001',
    email: 'support@souqsyria.com',
    phone: '+963-31-5555555',
    fullName: 'أحمد حمود - Ahmad Hammoud',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'staff',
    assignedRoleName: 'customer_support',
    lastLoginAt: new Date('2025-08-14T07:30:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      department: 'Customer Support',
      employeeId: 'EMP003',
      accessLevel: 'support',
      canViewOrders: true,
      canProcessRefunds: true,
      languageSkills: ['Arabic', 'English'],
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-07-20T09:00:00Z'),
    lastActivityAt: new Date('2025-08-14T10:00:00Z'),
    userType: 'staff',
    location: 'Homs',
    preferredLanguage: 'both',
    accountTier: 'premium',
  },
];

/**
 * VENDOR USERS: Business owners and sellers
 */
export const VENDOR_USERS: UserSeedData[] = [
  // Electronics Vendor
  {
    firebaseUid: 'vendor-electronics-001',
    email: 'vendor.electronics@souqsyria.com',
    phone: '+963-11-2345678',
    fullName: 'سامر التقني - Samer Al-Taqani',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'vendor',
    lastLoginAt: new Date('2025-08-14T08:45:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      businessName: 'تقني سوريا للإلكترونيات - Tech Syria Electronics',
      businessType: 'electronics',
      taxId: 'SY-TAX-12345',
      commercialLicense: 'CL-DMG-001',
      bankAccount: 'SY-BANK-001234567890',
      monthlyRevenue: 5000000, // SYP
      productCategories: ['smartphones', 'laptops', 'accessories'],
      rating: 4.8,
      totalSales: 1250,
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-07-10T12:00:00Z'),
    lastActivityAt: new Date('2025-08-14T09:00:00Z'),
    userType: 'vendor',
    location: 'Damascus',
    preferredLanguage: 'both',
    accountTier: 'premium',
  },

  // Fashion Vendor
  {
    firebaseUid: 'vendor-fashion-001',
    email: 'vendor.fashion@souqsyria.com',
    phone: '+963-21-3456789',
    fullName: 'ليلى الأزياء - Layla Al-Azyaa',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'vendor',
    lastLoginAt: new Date('2025-08-14T10:20:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      businessName: 'أزياء الشام التقليدية - Traditional Levantine Fashion',
      businessType: 'fashion',
      taxId: 'SY-TAX-67890',
      commercialLicense: 'CL-ALP-002',
      bankAccount: 'SY-BANK-001234567891',
      monthlyRevenue: 3500000, // SYP
      productCategories: ['traditional-wear', 'womens-fashion', 'accessories'],
      rating: 4.9,
      totalSales: 890,
      specialties: [
        'Syrian traditional clothing',
        'Damascus fabric',
        'Handwoven textiles',
      ],
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-07-25T16:00:00Z'),
    lastActivityAt: new Date('2025-08-14T10:30:00Z'),
    userType: 'vendor',
    location: 'Aleppo',
    preferredLanguage: 'both',
    accountTier: 'premium',
  },

  // Food Vendor
  {
    firebaseUid: 'vendor-food-001',
    email: 'vendor.food@souqsyria.com',
    phone: '+963-51-4567890',
    fullName: 'خالد الطعام - Khaled Al-Taam',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'vendor',
    lastLoginAt: new Date('2025-08-14T07:00:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      businessName: 'خيرات الشام - Khayrat Al-Sham',
      businessType: 'food',
      taxId: 'SY-TAX-11111',
      commercialLicense: 'CL-LAT-003',
      bankAccount: 'SY-BANK-001234567892',
      monthlyRevenue: 2800000, // SYP
      productCategories: [
        'syrian-specialties',
        'fresh-produce',
        'pantry-essentials',
      ],
      rating: 4.7,
      totalSales: 2340,
      certifications: ['Halal Certificate', 'Food Safety License'],
      specialties: ['Aleppo spices', 'Damascus sweets', 'Organic olive oil'],
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-08-05T11:00:00Z'),
    lastActivityAt: new Date('2025-08-14T07:15:00Z'),
    userType: 'vendor',
    location: 'Lattakia',
    preferredLanguage: 'ar',
    accountTier: 'premium',
  },

  // Crafts Vendor
  {
    firebaseUid: 'vendor-crafts-001',
    email: 'vendor.crafts@souqsyria.com',
    phone: '+963-22-5678901',
    fullName: 'عبد الرحمن الحرفي - Abdul Rahman Al-Harafi',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'vendor',
    lastLoginAt: new Date('2025-08-14T06:30:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      businessName: 'حرف دمشق الأصيلة - Authentic Damascus Crafts',
      businessType: 'handicrafts',
      taxId: 'SY-TAX-22222',
      commercialLicense: 'CL-DMG-004',
      bankAccount: 'SY-BANK-001234567893',
      monthlyRevenue: 1800000, // SYP
      productCategories: ['traditional-crafts', 'home-decor', 'jewelry'],
      rating: 4.9,
      totalSales: 567,
      certifications: ['Artisan Certificate', 'Heritage Craft License'],
      specialties: [
        'Damascene inlay work',
        'Hand-woven textiles',
        'Copper engravings',
      ],
      workshopLocation: 'Old Damascus Souk',
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-07-01T10:00:00Z'),
    lastActivityAt: new Date('2025-08-14T06:45:00Z'),
    userType: 'vendor',
    location: 'Damascus',
    preferredLanguage: 'ar',
    accountTier: 'basic',
  },
];

/**
 * CUSTOMER USERS: Regular buyers from Syria and diaspora
 */
export const CUSTOMER_USERS: UserSeedData[] = [
  // Damascus Customer
  {
    firebaseUid: 'customer-damascus-001',
    email: 'customer.damascus@example.com',
    phone: '+963-11-7777777',
    fullName: 'نور الهدى محمد - Nour Al-Huda Mohammed',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'customer',
    lastLoginAt: new Date('2025-08-14T11:00:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      dateOfBirth: '1990-03-15',
      gender: 'female',
      occupation: 'Teacher',
      interests: ['books', 'traditional-crafts', 'home-decor'],
      totalOrders: 24,
      totalSpent: 1450000, // SYP
      favoriteCategories: [
        'books-education',
        'traditional-crafts',
        'health-beauty',
      ],
      preferredPaymentMethod: 'cash_on_delivery',
      loyaltyPoints: 2400,
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-06-15T10:00:00Z'),
    lastActivityAt: new Date('2025-08-14T11:15:00Z'),
    userType: 'customer',
    location: 'Damascus',
    preferredLanguage: 'ar',
    accountTier: 'basic',
  },

  // Aleppo Customer
  {
    firebaseUid: 'customer-aleppo-001',
    email: 'customer.aleppo@example.com',
    phone: '+963-21-8888888',
    fullName: 'عمار السوري - Ammar Al-Souri',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'customer',
    lastLoginAt: new Date('2025-08-14T09:30:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      dateOfBirth: '1985-07-22',
      gender: 'male',
      occupation: 'Engineer',
      interests: ['electronics', 'automotive', 'books'],
      totalOrders: 18,
      totalSpent: 3200000, // SYP
      favoriteCategories: ['electronics', 'automotive', 'books-education'],
      preferredPaymentMethod: 'bank_transfer',
      loyaltyPoints: 1800,
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-07-01T14:00:00Z'),
    lastActivityAt: new Date('2025-08-14T09:45:00Z'),
    userType: 'customer',
    location: 'Aleppo',
    preferredLanguage: 'both',
    accountTier: 'premium',
  },

  // Diaspora Customer - Germany
  {
    firebaseUid: 'customer-diaspora-de-001',
    email: 'customer.germany@example.com',
    phone: '+49-30-12345678',
    fullName: 'سارة الألمانية - Sara Al-Almaniya',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'customer',
    lastLoginAt: new Date('2025-08-14T12:00:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      dateOfBirth: '1992-11-08',
      gender: 'female',
      occupation: 'Software Developer',
      interests: ['traditional-crafts', 'food', 'fashion'],
      totalOrders: 12,
      totalSpent: 850000, // SYP equivalent
      favoriteCategories: ['traditional-crafts', 'food-groceries', 'fashion'],
      preferredPaymentMethod: 'international_card',
      loyaltyPoints: 1200,
      shippingPreference: 'international_express',
      diasporaCountry: 'Germany',
      diasporaCity: 'Berlin',
      yearsAbroad: 5,
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-05-20T16:00:00Z'),
    lastActivityAt: new Date('2025-08-14T12:15:00Z'),
    userType: 'customer',
    location: 'Germany',
    preferredLanguage: 'both',
    accountTier: 'premium',
  },

  // Diaspora Customer - USA
  {
    firebaseUid: 'customer-diaspora-us-001',
    email: 'customer.usa@example.com',
    phone: '+1-555-123-4567',
    fullName: 'يوسف الأمريكي - Youssef Al-Ameriki',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'customer',
    lastLoginAt: new Date('2025-08-14T16:00:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      dateOfBirth: '1988-04-12',
      gender: 'male',
      occupation: 'Doctor',
      interests: ['traditional-crafts', 'food', 'books'],
      totalOrders: 8,
      totalSpent: 1200000, // SYP equivalent
      favoriteCategories: [
        'traditional-crafts',
        'food-groceries',
        'books-education',
      ],
      preferredPaymentMethod: 'international_card',
      loyaltyPoints: 800,
      shippingPreference: 'international_standard',
      diasporaCountry: 'USA',
      diasporaCity: 'New York',
      yearsAbroad: 8,
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-06-01T12:00:00Z'),
    lastActivityAt: new Date('2025-08-14T16:30:00Z'),
    userType: 'customer',
    location: 'USA',
    preferredLanguage: 'en',
    accountTier: 'vip',
  },

  // Young Customer
  {
    firebaseUid: 'customer-young-001',
    email: 'customer.young@example.com',
    phone: '+963-94-9999999',
    fullName: 'ريم الشابة - Reem Al-Shabba',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'customer',
    lastLoginAt: new Date('2025-08-14T13:45:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      dateOfBirth: '2002-12-03',
      gender: 'female',
      occupation: 'University Student',
      interests: ['fashion', 'electronics', 'books'],
      totalOrders: 6,
      totalSpent: 320000, // SYP
      favoriteCategories: ['fashion', 'electronics', 'books-education'],
      preferredPaymentMethod: 'mobile_payment',
      loyaltyPoints: 600,
      studentDiscount: true,
      university: 'Damascus University',
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-07-15T18:00:00Z'),
    lastActivityAt: new Date('2025-08-14T14:00:00Z'),
    userType: 'customer',
    location: 'Damascus',
    preferredLanguage: 'both',
    accountTier: 'basic',
  },

  // Coastal Customer
  {
    firebaseUid: 'customer-coastal-001',
    email: 'customer.coastal@example.com',
    phone: '+963-41-6666666',
    fullName: 'محمد الساحلي - Mohammed Al-Saheli',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'customer',
    lastLoginAt: new Date('2025-08-14T08:20:00Z'),
    isBanned: false,
    isSuspended: false,
    metadata: {
      dateOfBirth: '1980-01-25',
      gender: 'male',
      occupation: 'Businessman',
      interests: ['home-living', 'electronics', 'automotive'],
      totalOrders: 31,
      totalSpent: 4500000, // SYP
      favoriteCategories: ['home-living', 'electronics', 'automotive'],
      preferredPaymentMethod: 'bank_transfer',
      loyaltyPoints: 3100,
      businessAccount: true,
      bulkOrderDiscount: true,
    },
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-05-10T09:00:00Z'),
    lastActivityAt: new Date('2025-08-14T08:35:00Z'),
    userType: 'customer',
    location: 'Tartous',
    preferredLanguage: 'ar',
    accountTier: 'vip',
  },
];

/**
 * SYSTEM USERS: Bot accounts and system processes
 */
export const SYSTEM_USERS: UserSeedData[] = [
  // System Bot
  {
    firebaseUid: 'system-bot-001',
    email: 'system@souqsyria.com',
    fullName: 'SouqSyria System Bot',
    isVerified: true,
    roleName: 'system',
    isBanned: false,
    isSuspended: false,
    metadata: {
      type: 'system_bot',
      purpose: 'Automated system operations',
      canProcessPayments: true,
      canSendNotifications: true,
      canUpdateInventory: true,
    },
    failedLoginAttempts: 0,
    userType: 'system',
    location: 'System',
    preferredLanguage: 'both',
    accountTier: 'enterprise',
  },

  // Analytics Bot
  {
    firebaseUid: 'analytics-bot-001',
    email: 'analytics@souqsyria.com',
    fullName: 'SouqSyria Analytics Bot',
    isVerified: true,
    roleName: 'system',
    isBanned: false,
    isSuspended: false,
    metadata: {
      type: 'analytics_bot',
      purpose: 'Data collection and analysis',
      canAccessAnalytics: true,
      canGenerateReports: true,
    },
    failedLoginAttempts: 0,
    userType: 'system',
    location: 'System',
    preferredLanguage: 'both',
    accountTier: 'enterprise',
  },
];

/**
 * SPECIAL SCENARIO USERS: Edge cases and testing scenarios
 */
export const SPECIAL_USERS: UserSeedData[] = [
  // Suspended User
  {
    firebaseUid: 'user-suspended-001',
    email: 'suspended.user@example.com',
    phone: '+963-11-0000001',
    fullName: 'المستخدم المعلق - Suspended User',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'customer',
    lastLoginAt: new Date('2025-08-10T10:00:00Z'),
    isBanned: false,
    isSuspended: true,
    metadata: {
      suspensionReason: 'Multiple policy violations',
      suspendedAt: '2025-08-12T14:00:00Z',
      suspendedBy: 'admin@souqsyria.com',
    },
    banReason: 'Repeated violations of terms of service',
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-07-01T10:00:00Z'),
    lastActivityAt: new Date('2025-08-10T10:30:00Z'),
    userType: 'customer',
    location: 'Damascus',
    preferredLanguage: 'ar',
    accountTier: 'basic',
  },

  // Temporarily Banned User
  {
    firebaseUid: 'user-tempbanned-001',
    email: 'tempbanned.user@example.com',
    phone: '+963-11-0000002',
    fullName: 'المستخدم المحظور مؤقتاً - Temp Banned User',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: true,
    roleName: 'customer',
    lastLoginAt: new Date('2025-08-11T15:00:00Z'),
    isBanned: true,
    isSuspended: false,
    metadata: {
      banReason: 'Spam behavior',
      bannedAt: '2025-08-13T09:00:00Z',
      bannedBy: 'admin@souqsyria.com',
    },
    banReason: 'Posting spam content and fake reviews',
    bannedUntil: new Date('2025-08-20T09:00:00Z'), // 7-day ban
    failedLoginAttempts: 0,
    passwordChangedAt: new Date('2025-06-15T12:00:00Z'),
    lastActivityAt: new Date('2025-08-11T15:15:00Z'),
    userType: 'customer',
    location: 'Aleppo',
    preferredLanguage: 'ar',
    accountTier: 'basic',
  },

  // Unverified User
  {
    firebaseUid: 'user-unverified-001',
    email: 'unverified.user@example.com',
    phone: '+963-11-0000003',
    fullName: 'المستخدم غير المؤكد - Unverified User',
    passwordHash: '$2b$10$example.hash.for.development',
    isVerified: false,
    roleName: 'customer',
    isBanned: false,
    isSuspended: false,
    metadata: {
      registrationDate: '2025-08-14T12:00:00Z',
      verificationAttempts: 2,
      lastVerificationAttempt: '2025-08-14T12:30:00Z',
    },
    failedLoginAttempts: 1,
    userType: 'customer',
    location: 'Homs',
    preferredLanguage: 'ar',
    accountTier: 'basic',
  },
];

/**
 * ALL USERS: Combined array of all user seed data
 */
export const ALL_USER_SEEDS: UserSeedData[] = [
  ...ADMIN_USERS,
  ...VENDOR_USERS,
  ...CUSTOMER_USERS,
  ...SYSTEM_USERS,
  ...SPECIAL_USERS,
];

/**
 * UTILITY FUNCTIONS
 */

/**
 * Get users by type
 */
export const getUsersByType = (userType: string): UserSeedData[] => {
  return ALL_USER_SEEDS.filter((user) => user.userType === userType);
};

/**
 * Get users by location
 */
export const getUsersByLocation = (location: string): UserSeedData[] => {
  return ALL_USER_SEEDS.filter((user) => user.location === location);
};

/**
 * Get verified users only
 */
export const getVerifiedUsers = (): UserSeedData[] => {
  return ALL_USER_SEEDS.filter((user) => user.isVerified);
};

/**
 * Get active users (not banned or suspended)
 */
export const getActiveUsers = (): UserSeedData[] => {
  return ALL_USER_SEEDS.filter((user) => !user.isBanned && !user.isSuspended);
};

/**
 * Get users by account tier
 */
export const getUsersByTier = (tier: string): UserSeedData[] => {
  return ALL_USER_SEEDS.filter((user) => user.accountTier === tier);
};

/**
 * Get diaspora users only
 */
export const getDiasporaUsers = (): UserSeedData[] => {
  const syrianGovernorates = [
    'Damascus',
    'Aleppo',
    'Homs',
    'Hama',
    'Lattakia',
    'Tartous',
    'Daraa',
    'As-Suwayda',
    'Quneitra',
    'Idlib',
    'Ar-Raqqa',
    'Deir ez-Zor',
    'Al-Hasakah',
    'Rif Dimashq',
  ];
  return ALL_USER_SEEDS.filter(
    (user) =>
      !syrianGovernorates.includes(user.location) && user.location !== 'System',
  );
};

/**
 * Get users by preferred language
 */
export const getUsersByLanguage = (language: string): UserSeedData[] => {
  return ALL_USER_SEEDS.filter((user) => user.preferredLanguage === language);
};

/**
 * STATISTICS
 */
export const USER_STATISTICS = {
  total: ALL_USER_SEEDS.length,
  admins: getUsersByType('admin').length,
  staff: getUsersByType('staff').length,
  vendors: getUsersByType('vendor').length,
  customers: getUsersByType('customer').length,
  system: getUsersByType('system').length,
  verified: getVerifiedUsers().length,
  active: getActiveUsers().length,
  banned: ALL_USER_SEEDS.filter((user) => user.isBanned).length,
  suspended: ALL_USER_SEEDS.filter((user) => user.isSuspended).length,
  diaspora: getDiasporaUsers().length,
  syrian: ALL_USER_SEEDS.filter((user) => {
    const syrianGovernorates = [
      'Damascus',
      'Aleppo',
      'Homs',
      'Hama',
      'Lattakia',
      'Tartous',
      'Daraa',
      'As-Suwayda',
      'Quneitra',
      'Idlib',
      'Ar-Raqqa',
      'Deir ez-Zor',
      'Al-Hasakah',
      'Rif Dimashq',
    ];
    return syrianGovernorates.includes(user.location);
  }).length,
  preferArabic: getUsersByLanguage('ar').length,
  preferEnglish: getUsersByLanguage('en').length,
  preferBoth: getUsersByLanguage('both').length,
  basicTier: getUsersByTier('basic').length,
  premiumTier: getUsersByTier('premium').length,
  vipTier: getUsersByTier('vip').length,
  enterpriseTier: getUsersByTier('enterprise').length,
};
