/**
 * @file warehouse-seeds.data.ts
 * @description Comprehensive warehouse seed data for SouqSyria platform
 * Includes strategic locations across Syria with accurate coordinates and regional coverage
 */

export interface WarehouseSeedData {
  name: string;
  nameAr: string;
  city: string;
  cityAr: string;
  address: string;
  addressAr: string;
  latitude: number;
  longitude: number;
  governorate: string;
  governorateAr: string;
  warehouseType: 'main_hub' | 'regional_center' | 'local_depot' | 'specialized';
  capacity: number; // in cubic meters
  features: string[];
  featuresAr: string[];
  operationalHours: string;
  operationalHoursAr: string;
  contactPhone: string;
  managerName: string;
  managerNameAr: string;
  specializedFor?: string[]; // product categories
  priorityLevel: 'high' | 'medium' | 'low';
  establishedYear: number;
  servesRegions: string[]; // governorates served
  servesRegionsAr: string[];
}

/**
 * Damascus Region Warehouses
 * Strategic locations in the capital and surrounding areas
 */
export const DAMASCUS_WAREHOUSES: WarehouseSeedData[] = [
  {
    name: 'Damascus Central Distribution Hub',
    nameAr: 'مركز دمشق المركزي للتوزيع',
    city: 'Damascus',
    cityAr: 'دمشق',
    address: 'Industrial Zone, Adra District, Damascus',
    addressAr: 'المنطقة الصناعية، منطقة عدرا، دمشق',
    latitude: 33.5138,
    longitude: 36.2765,
    governorate: 'Damascus',
    governorateAr: 'دمشق',
    warehouseType: 'main_hub',
    capacity: 15000,
    features: [
      'Temperature-controlled storage',
      'Advanced security systems',
      'Loading docks for 20+ trucks',
      'Automated inventory management',
      'Cross-docking facilities',
      '24/7 operations',
    ],
    featuresAr: [
      'تخزين مع تحكم بدرجة الحرارة',
      'أنظمة أمان متطورة',
      'أرصفة تحميل لأكثر من 20 شاحنة',
      'إدارة مخزون آلية',
      'مرافق النقل المباشر',
      'عمليات على مدار الساعة',
    ],
    operationalHours: '24/7',
    operationalHoursAr: '24/7',
    contactPhone: '+963-11-234-5678',
    managerName: 'Ahmad Al-Shamsi',
    managerNameAr: 'أحمد الشمسي',
    specializedFor: [
      'electronics',
      'fashion',
      'home-garden',
      'books-education',
    ],
    priorityLevel: 'high',
    establishedYear: 2018,
    servesRegions: ['Damascus', 'Rif Dimashq', 'Quneitra', 'As-Suwayda'],
    servesRegionsAr: ['دمشق', 'ريف دمشق', 'القنيطرة', 'السويداء'],
  },
  {
    name: 'Rif Dimashq Regional Center',
    nameAr: 'مركز ريف دمشق الإقليمي',
    city: 'Douma',
    cityAr: 'دوما',
    address: 'Eastern Ghouta Business Park, Douma',
    addressAr: 'حديقة الغوطة الشرقية التجارية، دوما',
    latitude: 33.5722,
    longitude: 36.4028,
    governorate: 'Rif Dimashq',
    governorateAr: 'ريف دمشق',
    warehouseType: 'regional_center',
    capacity: 8000,
    features: [
      'Climate-controlled zones',
      'Food-grade storage areas',
      'Direct highway access',
      'Packaging facilities',
      'Quality control labs',
    ],
    featuresAr: [
      'مناطق مع تحكم مناخي',
      'مناطق تخزين صالحة للطعام',
      'وصول مباشر للطريق السريع',
      'مرافق التعبئة والتغليف',
      'مختبرات مراقبة الجودة',
    ],
    operationalHours: '6:00 AM - 10:00 PM',
    operationalHoursAr: '6:00 صباحاً - 10:00 مساءً',
    contactPhone: '+963-11-345-6789',
    managerName: 'Fatima Al-Zahra',
    managerNameAr: 'فاطمة الزهراء',
    specializedFor: ['food-beverages', 'home-garden'],
    priorityLevel: 'high',
    establishedYear: 2019,
    servesRegions: ['Rif Dimashq', 'Damascus'],
    servesRegionsAr: ['ريف دمشق', 'دمشق'],
  },
];

/**
 * Aleppo Region Warehouses
 * Northern Syria's economic hub with specialized facilities
 */
export const ALEPPO_WAREHOUSES: WarehouseSeedData[] = [
  {
    name: 'Aleppo Northern Distribution Center',
    nameAr: 'مركز حلب الشمالي للتوزيع',
    city: 'Aleppo',
    cityAr: 'حلب',
    address: 'Sheikh Najjar Industrial City, Aleppo',
    addressAr: 'مدينة الشيخ نجار الصناعية، حلب',
    latitude: 36.2021,
    longitude: 37.1343,
    governorate: 'Aleppo',
    governorateAr: 'حلب',
    warehouseType: 'main_hub',
    capacity: 12000,
    features: [
      'Multi-temperature zones',
      'Textile storage facilities',
      'Heavy machinery storage',
      'Rail access connection',
      'International shipping prep',
      'Craft workshop space',
    ],
    featuresAr: [
      'مناطق متعددة الحرارة',
      'مرافق تخزين المنسوجات',
      'تخزين الآلات الثقيلة',
      'اتصال بالسكك الحديدية',
      'تحضير الشحن الدولي',
      'مساحة ورش الحرف',
    ],
    operationalHours: '6:00 AM - 11:00 PM',
    operationalHoursAr: '6:00 صباحاً - 11:00 مساءً',
    contactPhone: '+963-21-456-7890',
    managerName: 'Omar Al-Halabi',
    managerNameAr: 'عمر الحلبي',
    specializedFor: ['fashion', 'electronics', 'home-garden'],
    priorityLevel: 'high',
    establishedYear: 2017,
    servesRegions: ['Aleppo', 'Idlib', 'Ar-Raqqa'],
    servesRegionsAr: ['حلب', 'إدلب', 'الرقة'],
  },
];

/**
 * Latakia Region Warehouses
 * Coastal distribution with port connectivity
 */
export const LATAKIA_WAREHOUSES: WarehouseSeedData[] = [
  {
    name: 'Latakia Port Logistics Center',
    nameAr: 'مركز اللاذقية اللوجستي',
    city: 'Latakia',
    cityAr: 'اللاذقية',
    address: 'Port Industrial Zone, Latakia',
    addressAr: 'المنطقة الصناعية بالميناء، اللاذقية',
    latitude: 35.5208,
    longitude: 35.7925,
    governorate: 'Latakia',
    governorateAr: 'اللاذقية',
    warehouseType: 'specialized',
    capacity: 10000,
    features: [
      'Port connectivity',
      'Import/export processing',
      'Customs bonded storage',
      'Container handling',
      'Marine insurance facilities',
      'International shipping coordination',
    ],
    featuresAr: [
      'اتصال بالميناء',
      'معالجة الاستيراد والتصدير',
      'تخزين جمركي مرتبط',
      'معالجة الحاويات',
      'مرافق التأمين البحري',
      'تنسيق الشحن الدولي',
    ],
    operationalHours: '5:00 AM - 8:00 PM',
    operationalHoursAr: '5:00 صباحاً - 8:00 مساءً',
    contactPhone: '+963-41-567-8901',
    managerName: 'Layla Al-Sahlani',
    managerNameAr: 'ليلى الساحلاني',
    specializedFor: ['electronics', 'fashion', 'food-beverages'],
    priorityLevel: 'high',
    establishedYear: 2020,
    servesRegions: ['Latakia', 'Tartus', 'Hama'],
    servesRegionsAr: ['اللاذقية', 'طرطوس', 'حماة'],
  },
];

/**
 * Homs Region Warehouses
 * Central Syria strategic location
 */
export const HOMS_WAREHOUSES: WarehouseSeedData[] = [
  {
    name: 'Homs Central Logistics Hub',
    nameAr: 'مركز حمص اللوجستي المركزي',
    city: 'Homs',
    cityAr: 'حمص',
    address: 'Homs Industrial Zone, Al-Qusour District',
    addressAr: 'المنطقة الصناعية، منطقة القصور، حمص',
    latitude: 34.7267,
    longitude: 36.7073,
    governorate: 'Homs',
    governorateAr: 'حمص',
    warehouseType: 'regional_center',
    capacity: 9000,
    features: [
      'Cross-country distribution',
      'Agricultural product storage',
      'Temperature-controlled sections',
      'Packaging and labeling',
      'Quality inspection facilities',
    ],
    featuresAr: [
      'توزيع عبر البلاد',
      'تخزين المنتجات الزراعية',
      'أقسام مع تحكم بالحرارة',
      'التعبئة والوسم',
      'مرافق فحص الجودة',
    ],
    operationalHours: '6:00 AM - 9:00 PM',
    operationalHoursAr: '6:00 صباحاً - 9:00 مساءً',
    contactPhone: '+963-31-678-9012',
    managerName: 'Mahmoud Al-Homsi',
    managerNameAr: 'محمود الحمصي',
    specializedFor: ['food-beverages', 'home-garden', 'books-education'],
    priorityLevel: 'medium',
    establishedYear: 2019,
    servesRegions: ['Homs', 'Hama', 'Deir ez-Zor'],
    servesRegionsAr: ['حمص', 'حماة', 'دير الزور'],
  },
];

/**
 * Daraa Region Warehouses
 * Southern border distribution
 */
export const DARAA_WAREHOUSES: WarehouseSeedData[] = [
  {
    name: 'Daraa Southern Gateway Depot',
    nameAr: 'مستودع درعا البوابة الجنوبية',
    city: 'Daraa',
    cityAr: 'درعا',
    address: 'Nasib Border Commercial Zone, Daraa',
    addressAr: 'المنطقة التجارية لحدود نصيب، درعا',
    latitude: 32.6189,
    longitude: 36.1021,
    governorate: 'Daraa',
    governorateAr: 'درعا',
    warehouseType: 'regional_center',
    capacity: 6000,
    features: [
      'Border trade facilitation',
      'Agricultural storage',
      'Cross-border logistics',
      'Inspection facilities',
      'Regional distribution',
    ],
    featuresAr: [
      'تسهيل التجارة الحدودية',
      'تخزين زراعي',
      'لوجستيات عبر الحدود',
      'مرافق التفتيش',
      'التوزيع الإقليمي',
    ],
    operationalHours: '7:00 AM - 7:00 PM',
    operationalHoursAr: '7:00 صباحاً - 7:00 مساءً',
    contactPhone: '+963-15-789-0123',
    managerName: 'Khaled Al-Hourani',
    managerNameAr: 'خالد الحوراني',
    specializedFor: ['food-beverages', 'home-garden'],
    priorityLevel: 'medium',
    establishedYear: 2021,
    servesRegions: ['Daraa', 'As-Suwayda', 'Quneitra'],
    servesRegionsAr: ['درعا', 'السويداء', 'القنيطرة'],
  },
];

/**
 * Specialized Local Depots
 * Smaller facilities for specific regions or purposes
 */
export const LOCAL_DEPOTS: WarehouseSeedData[] = [
  {
    name: 'Tartus Coastal Depot',
    nameAr: 'مستودع طرطوس الساحلي',
    city: 'Tartus',
    cityAr: 'طرطوس',
    address: 'Tartus Port Area, Corniche Street',
    addressAr: 'منطقة ميناء طرطوس، شارع الكورنيش',
    latitude: 34.8897,
    longitude: 35.8869,
    governorate: 'Tartus',
    governorateAr: 'طرطوس',
    warehouseType: 'local_depot',
    capacity: 3000,
    features: [
      'Coastal storage',
      'Fresh goods handling',
      'Tourist area supply',
      'Local distribution',
    ],
    featuresAr: [
      'تخزين ساحلي',
      'معالجة البضائع الطازجة',
      'تزويد المناطق السياحية',
      'التوزيع المحلي',
    ],
    operationalHours: '6:00 AM - 8:00 PM',
    operationalHoursAr: '6:00 صباحاً - 8:00 مساءً',
    contactPhone: '+963-43-890-1234',
    managerName: 'Nour Al-Tartusi',
    managerNameAr: 'نور الطرطوسي',
    specializedFor: ['food-beverages', 'fashion'],
    priorityLevel: 'low',
    establishedYear: 2020,
    servesRegions: ['Tartus'],
    servesRegionsAr: ['طرطوس'],
  },
  {
    name: 'Quneitra Border Facility',
    nameAr: 'مرفق القنيطرة الحدودي',
    city: 'Quneitra',
    cityAr: 'القنيطرة',
    address: 'Quneitra Commercial District',
    addressAr: 'المنطقة التجارية، القنيطرة',
    latitude: 33.1264,
    longitude: 35.8244,
    governorate: 'Quneitra',
    governorateAr: 'القنيطرة',
    warehouseType: 'local_depot',
    capacity: 2500,
    features: [
      'Border logistics',
      'Small-scale storage',
      'Agricultural products',
      'Regional connectivity',
    ],
    featuresAr: [
      'لوجستيات حدودية',
      'تخزين صغير النطاق',
      'منتجات زراعية',
      'اتصال إقليمي',
    ],
    operationalHours: '8:00 AM - 6:00 PM',
    operationalHoursAr: '8:00 صباحاً - 6:00 مساءً',
    contactPhone: '+963-14-901-2345',
    managerName: 'Samir Al-Quneitri',
    managerNameAr: 'سمير القنيطري',
    specializedFor: ['food-beverages', 'home-garden'],
    priorityLevel: 'low',
    establishedYear: 2022,
    servesRegions: ['Quneitra', 'Damascus'],
    servesRegionsAr: ['القنيطرة', 'دمشق'],
  },
];

/**
 * All warehouse seed data combined
 */
export const ALL_WAREHOUSE_SEEDS: WarehouseSeedData[] = [
  ...DAMASCUS_WAREHOUSES,
  ...ALEPPO_WAREHOUSES,
  ...LATAKIA_WAREHOUSES,
  ...HOMS_WAREHOUSES,
  ...DARAA_WAREHOUSES,
  ...LOCAL_DEPOTS,
];

/**
 * Warehouse statistics for reference
 */
export const WAREHOUSE_STATISTICS = {
  total: ALL_WAREHOUSE_SEEDS.length,
  damascus: DAMASCUS_WAREHOUSES.length,
  aleppo: ALEPPO_WAREHOUSES.length,
  latakia: LATAKIA_WAREHOUSES.length,
  homs: HOMS_WAREHOUSES.length,
  daraa: DARAA_WAREHOUSES.length,
  localDepots: LOCAL_DEPOTS.length,
  byType: {
    main_hub: ALL_WAREHOUSE_SEEDS.filter((w) => w.warehouseType === 'main_hub')
      .length,
    regional_center: ALL_WAREHOUSE_SEEDS.filter(
      (w) => w.warehouseType === 'regional_center',
    ).length,
    local_depot: ALL_WAREHOUSE_SEEDS.filter(
      (w) => w.warehouseType === 'local_depot',
    ).length,
    specialized: ALL_WAREHOUSE_SEEDS.filter(
      (w) => w.warehouseType === 'specialized',
    ).length,
  },
  totalCapacity: ALL_WAREHOUSE_SEEDS.reduce((sum, w) => sum + w.capacity, 0),
  averageCapacity: Math.round(
    ALL_WAREHOUSE_SEEDS.reduce((sum, w) => sum + w.capacity, 0) /
      ALL_WAREHOUSE_SEEDS.length,
  ),
  governoratesCovered: [
    ...new Set(ALL_WAREHOUSE_SEEDS.map((w) => w.governorate)),
  ].length,
  priorityDistribution: {
    high: ALL_WAREHOUSE_SEEDS.filter((w) => w.priorityLevel === 'high').length,
    medium: ALL_WAREHOUSE_SEEDS.filter((w) => w.priorityLevel === 'medium')
      .length,
    low: ALL_WAREHOUSE_SEEDS.filter((w) => w.priorityLevel === 'low').length,
  },
};
