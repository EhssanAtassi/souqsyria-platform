/**
 * @file sample-addresses.seed.ts
 * @description Sample address data for testing and development
 *
 * This file contains realistic sample addresses for major Syrian cities
 * to support development, testing, and demonstration of the address system.
 * Includes various address types, formats, and Syrian-specific features.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

export interface SampleAddressSeedData {
  label: string;
  addressType: 'shipping' | 'billing';
  governorateCode: string;
  cityName: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
  phone: string;
  notes?: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
  addressCategory:
    | 'residential'
    | 'commercial'
    | 'industrial'
    | 'government'
    | 'educational';
}

/**
 * Comprehensive sample addresses across major Syrian cities
 * Includes various types: residential, commercial, government, educational
 */
export const SAMPLE_ADDRESSES_SEEDS: SampleAddressSeedData[] = [
  // DAMASCUS ADDRESSES
  {
    label: 'منزل العائلة', // Family Home
    addressType: 'shipping',
    governorateCode: 'DMS',
    cityName: 'Old City Damascus',
    addressLine1: 'الشارع المستقيم، بناء رقم 15، الطابق الثاني',
    addressLine2: 'بالقرب من الجامع الأموي',
    postalCode: '11001',
    phone: '+963-11-231-4567',
    notes: 'الرجاء الطرق على الباب بقوة، الجرس لا يعمل',
    isDefault: true,
    latitude: 33.5102,
    longitude: 36.3068,
    addressCategory: 'residential',
  },
  {
    label: 'Damascus Business Center',
    addressType: 'billing',
    governorateCode: 'DMS',
    cityName: 'Mezzeh',
    addressLine1: 'Mezzeh Autostrad, Building 45, Floor 3',
    addressLine2: 'Office 302, Next to Central Bank',
    postalCode: '11002',
    phone: '+963-11-612-3456',
    notes: 'Business hours: 8AM-5PM, Closed Fridays',
    isDefault: false,
    latitude: 33.5005,
    longitude: 36.2308,
    addressCategory: 'commercial',
  },
  {
    label: 'Damascus University',
    addressType: 'shipping',
    governorateCode: 'DMS',
    cityName: 'Damascus',
    addressLine1: 'جامعة دمشق، كلية الهندسة المعلوماتية',
    addressLine2: 'مبنى الكلية الجديد، الطابق الثالث',
    postalCode: '11003',
    phone: '+963-11-213-1234',
    notes: 'يرجى الاتصال عند الوصول، الحارس سيوجهكم',
    isDefault: false,
    latitude: 33.5225,
    longitude: 36.2929,
    addressCategory: 'educational',
  },

  // ALEPPO ADDRESSES
  {
    label: 'Aleppo Family House',
    addressType: 'shipping',
    governorateCode: 'ALP',
    cityName: 'Aleppo',
    addressLine1: 'حي العزيزية، شارع النيل، بناء رقم 23',
    addressLine2: 'الطابق الأول، شقة 3',
    postalCode: '21001',
    phone: '+963-21-245-7890',
    notes: 'يفضل التسليم بعد الساعة 2 ظهراً',
    isDefault: true,
    latitude: 36.2045,
    longitude: 37.1298,
    addressCategory: 'residential',
  },
  {
    label: 'Aleppo Commercial Complex',
    addressType: 'billing',
    governorateCode: 'ALP',
    cityName: 'Aleppo',
    addressLine1: 'شارع الملك فيصل، المجمع التجاري الجديد',
    addressLine2: 'الطابق الأرضي، محل رقم 15',
    postalCode: '21002',
    phone: '+963-21-222-3456',
    notes: 'مفتوح من 9 صباحاً حتى 8 مساءً',
    isDefault: false,
    latitude: 36.2021,
    longitude: 37.1343,
    addressCategory: 'commercial',
  },
  {
    label: 'Aleppo Textile Factory',
    addressType: 'shipping',
    governorateCode: 'ALP',
    cityName: 'Aleppo',
    addressLine1: 'المنطقة الصناعية الشيخ نجار، قطعة رقم 125',
    addressLine2: 'مصنع الغزل والنسيج الحديث',
    postalCode: '21101',
    phone: '+963-21-456-7890',
    notes: 'مدخل المعمل الرئيسي، اسأل عن قسم الاستلام',
    isDefault: false,
    latitude: 36.25,
    longitude: 37.2,
    addressCategory: 'industrial',
  },

  // HOMS ADDRESSES
  {
    label: 'Homs City Center',
    addressType: 'shipping',
    governorateCode: 'HMS',
    cityName: 'Homs',
    addressLine1: 'شارع الحضارة، عمارة البلدية، الطابق الخامس',
    addressLine2: 'شقة 15، بالقرب من ساعة الحميدية',
    postalCode: '31001',
    phone: '+963-31-234-5678',
    notes: 'يرجى الصعود بالمصعد، المبنى قديم',
    isDefault: true,
    latitude: 34.7329,
    longitude: 36.7194,
    addressCategory: 'residential',
  },
  {
    label: 'Homs Refinery Office',
    addressType: 'billing',
    governorateCode: 'HMS',
    cityName: 'Homs',
    addressLine1: 'مصفاة حمص، المكاتب الإدارية',
    addressLine2: 'مبنى الإدارة الرئيسية، الطابق الثاني',
    postalCode: '31101',
    phone: '+963-31-345-6789',
    notes: 'يتطلب تصريح دخول، يرجى الاتصال مسبقاً',
    isDefault: false,
    latitude: 34.75,
    longitude: 36.75,
    addressCategory: 'industrial',
  },

  // LATTAKIA ADDRESSES
  {
    label: 'Lattakia Beach Resort',
    addressType: 'shipping',
    governorateCode: 'LAT',
    cityName: 'Lattakia',
    addressLine1: 'الكورنيش الشمالي، فندق الشاطئ الأزرق',
    addressLine2: 'الطابق الثالث، جناح 305',
    postalCode: '41001',
    phone: '+963-41-456-7890',
    notes: 'استقبال الفندق سيوصل الطرود للغرف',
    isDefault: false,
    latitude: 35.5309,
    longitude: 35.7908,
    addressCategory: 'commercial',
  },
  {
    label: 'Lattakia Port Authority',
    addressType: 'billing',
    governorateCode: 'LAT',
    cityName: 'Lattakia',
    addressLine1: 'ميناء اللاذقية، إدارة الجمارك',
    addressLine2: 'مبنى الإدارة المركزية، الطابق الأول',
    postalCode: '41002',
    phone: '+963-41-234-5678',
    notes: 'ساعات العمل الرسمية فقط، مطلوب هوية',
    isDefault: false,
    latitude: 35.52,
    longitude: 35.77,
    addressCategory: 'government',
  },
  {
    label: 'Mediterranean Villa',
    addressType: 'shipping',
    governorateCode: 'LAT',
    cityName: 'Lattakia',
    addressLine1: 'منطقة الرمل الشمالي، فيلا رقم 42',
    addressLine2: 'شارع البحر المتوسط',
    postalCode: '41003',
    phone: '+963-41-567-8901',
    notes: 'فيلا بيضاء مع حديقة كبيرة، بوابة زرقاء',
    isDefault: true,
    latitude: 35.54,
    longitude: 35.8,
    addressCategory: 'residential',
  },

  // TARTUS ADDRESSES
  {
    label: 'Tartus Port Complex',
    addressType: 'shipping',
    governorateCode: 'TAR',
    cityName: 'Tartus',
    addressLine1: 'ميناء طرطوس التجاري، المستودع رقم 15',
    addressLine2: 'قسم البضائع الواردة',
    postalCode: '43001',
    phone: '+963-43-345-6789',
    notes: 'يتطلب تنسيق مسبق مع إدارة المستودعات',
    isDefault: false,
    latitude: 34.885,
    longitude: 35.8852,
    addressCategory: 'commercial',
  },
  {
    label: 'Tartus Old City Home',
    addressType: 'shipping',
    governorateCode: 'TAR',
    cityName: 'Tartus',
    addressLine1: 'البلدة القديمة، شارع الكنيسة، منزل رقم 8',
    addressLine2: 'بالقرب من الكاتدرائية القديمة',
    postalCode: '43002',
    phone: '+963-43-123-4567',
    notes: 'منزل حجري قديم، باب خشبي كبير',
    isDefault: true,
    latitude: 34.89,
    longitude: 35.89,
    addressCategory: 'residential',
  },

  // HAMA ADDRESSES
  {
    label: 'Hama Traditional House',
    addressType: 'shipping',
    governorateCode: 'HAM',
    cityName: 'Hama',
    addressLine1: 'حي النواعير، شارع العاصي، منزل رقم 12',
    addressLine2: 'بيت شامي تراثي، بالقرب من الناعورة الكبيرة',
    postalCode: '33001',
    phone: '+963-33-234-5678',
    notes: 'صوت النواعير مميز، سهل العثور على المكان',
    isDefault: true,
    latitude: 35.135,
    longitude: 36.7548,
    addressCategory: 'residential',
  },
  {
    label: 'Hama Agricultural Cooperative',
    addressType: 'billing',
    governorateCode: 'HAM',
    cityName: 'Hama',
    addressLine1: 'التعاونية الزراعية المركزية، طريق دمشق',
    addressLine2: 'مكتب المدير العام',
    postalCode: '33002',
    phone: '+963-33-345-6789',
    notes: 'موسم الحصاد قد يؤثر على أوقات العمل',
    isDefault: false,
    latitude: 35.13,
    longitude: 36.76,
    addressCategory: 'commercial',
  },

  // DER EZZOR ADDRESSES
  {
    label: 'Der Ezzor City Center',
    addressType: 'shipping',
    governorateCode: 'DER',
    cityName: 'Der Ezzor',
    addressLine1: 'شارع الفرات، عمارة الضباط، الطابق الرابع',
    addressLine2: 'شقة 16، مطل على نهر الفرات',
    postalCode: '51001',
    phone: '+963-51-234-5678',
    notes: 'منظر رائع للنهر، مبنى أصفر اللون',
    isDefault: true,
    latitude: 35.3444,
    longitude: 40.1464,
    addressCategory: 'residential',
  },
  {
    label: 'Der Ezzor Oil Field Office',
    addressType: 'billing',
    governorateCode: 'DER',
    cityName: 'Der Ezzor',
    addressLine1: 'حقول النفط الشرقية، المجمع الإداري',
    addressLine2: 'مكتب العمليات الرئيسي',
    postalCode: '51101',
    phone: '+963-51-456-7890',
    notes: 'منطقة محمية، يتطلب تصاريح خاصة',
    isDefault: false,
    latitude: 35.35,
    longitude: 40.2,
    addressCategory: 'industrial',
  },

  // DARAA ADDRESSES
  {
    label: 'Daraa Border House',
    addressType: 'shipping',
    governorateCode: 'DAR',
    cityName: 'Daraa',
    addressLine1: 'حي البلد، شارع الوحدة، منزل رقم 25',
    addressLine2: 'بالقرب من المركز الحدودي',
    postalCode: '61001',
    phone: '+963-15-234-5678',
    notes: 'قريب من الحدود الأردنية، حركة تجارية كثيفة',
    isDefault: true,
    latitude: 32.6189,
    longitude: 36.1022,
    addressCategory: 'residential',
  },
  {
    label: 'Daraa Agricultural Center',
    addressType: 'billing',
    governorateCode: 'DAR',
    cityName: 'Daraa',
    addressLine1: 'مركز الأبحاث الزراعية، طريق دمشق',
    addressLine2: 'قسم بحوث الحبوب والبقوليات',
    postalCode: '61002',
    phone: '+963-15-345-6789',
    notes: 'مركز متخصص في الزراعة الجنوبية',
    isDefault: false,
    latitude: 32.63,
    longitude: 36.11,
    addressCategory: 'educational',
  },

  // AS-SUWAYDA ADDRESSES
  {
    label: 'Sweida Mountain Villa',
    addressType: 'shipping',
    governorateCode: 'SWD',
    cityName: 'As-Suwayda',
    addressLine1: 'جبل العرب، قرية عتيل، فيلا الأرز',
    addressLine2: 'على الطريق الرئيسي للقرية',
    postalCode: '63001',
    phone: '+963-16-234-5678',
    notes: 'منطقة جبلية، قد تحتاج سيارة دفع رباعي في الشتاء',
    isDefault: true,
    latitude: 32.7094,
    longitude: 36.5619,
    addressCategory: 'residential',
  },
  {
    label: 'Sweida Wine Cooperative',
    addressType: 'billing',
    governorateCode: 'SWD',
    cityName: 'As-Suwayda',
    addressLine1: 'التعاونية الزراعية للعنب والنبيذ',
    addressLine2: 'مركز تجميع وتصنيع العنب',
    postalCode: '63002',
    phone: '+963-16-345-6789',
    notes: 'موسم القطاف من أغسطس إلى أكتوبر',
    isDefault: false,
    latitude: 32.72,
    longitude: 36.57,
    addressCategory: 'commercial',
  },

  // AL-HASAKAH ADDRESSES
  {
    label: 'Hasaka Oil Worker Housing',
    addressType: 'shipping',
    governorateCode: 'HAS',
    cityName: 'Al-Hasakah',
    addressLine1: 'مجمع عمال النفط، البلوك رقم 5',
    addressLine2: 'شقة 23، الطابق الثاني',
    postalCode: '53001',
    phone: '+963-52-234-5678',
    notes: 'مجمع سكني للعاملين في قطاع النفط',
    isDefault: true,
    latitude: 36.5004,
    longitude: 40.7478,
    addressCategory: 'residential',
  },
  {
    label: 'Qamishli Border Office',
    addressType: 'billing',
    governorateCode: 'HAS',
    cityName: 'Qamishli',
    addressLine1: 'المركز الحدودي، مبنى الجمارك',
    addressLine2: 'قسم التجارة الخارجية',
    postalCode: '53101',
    phone: '+963-52-345-6789',
    notes: 'معبر حدودي مع تركيا، إجراءات خاصة',
    isDefault: false,
    latitude: 37.0575,
    longitude: 41.2308,
    addressCategory: 'government',
  },
];

/**
 * Get addresses by governorate
 */
export function getAddressesByGovernorate(
  governorateCode: string,
): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter(
    (addr) => addr.governorateCode === governorateCode,
  );
}

/**
 * Get addresses by type
 */
export function getAddressesByType(
  addressType: 'shipping' | 'billing',
): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter(
    (addr) => addr.addressType === addressType,
  );
}

/**
 * Get addresses by category
 */
export function getAddressesByCategory(
  category:
    | 'residential'
    | 'commercial'
    | 'industrial'
    | 'government'
    | 'educational',
): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter(
    (addr) => addr.addressCategory === category,
  );
}

/**
 * Get default addresses
 */
export function getDefaultAddresses(): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter((addr) => addr.isDefault);
}

/**
 * Get addresses with coordinates
 */
export function getAddressesWithCoordinates(): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter(
    (addr) => addr.latitude && addr.longitude,
  );
}

/**
 * Get commercial addresses (business addresses)
 */
export function getBusinessAddresses(): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter((addr) =>
    ['commercial', 'industrial', 'government', 'educational'].includes(
      addr.addressCategory,
    ),
  );
}

/**
 * Get residential addresses only
 */
export function getResidentialAddresses(): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter(
    (addr) => addr.addressCategory === 'residential',
  );
}

/**
 * Get addresses with Arabic text
 */
export function getArabicAddresses(): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter(
    (addr) =>
      /[\u0600-\u06FF]/.test(addr.addressLine1) ||
      /[\u0600-\u06FF]/.test(addr.label),
  );
}

/**
 * Get addresses with postal codes
 */
export function getAddressesWithPostalCodes(): SampleAddressSeedData[] {
  return SAMPLE_ADDRESSES_SEEDS.filter((addr) => addr.postalCode);
}
