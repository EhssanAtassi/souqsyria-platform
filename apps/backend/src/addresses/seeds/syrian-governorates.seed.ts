/**
 * @file syrian-governorates.seed.ts
 * @description Comprehensive seed data for all 14 Syrian governorates
 *
 * This file contains official data for all Syrian governorates including:
 * - Official codes and names (Arabic/English)
 * - Geographic coordinates and area data
 * - Population estimates
 * - Current status and accessibility information
 * - Economic and infrastructure metadata
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

export interface SyrianGovernoratesSeedData {
  code: string;
  nameEn: string;
  nameAr: string;
  capitalEn: string;
  capitalAr: string;
  latitude: number;
  longitude: number;
  population: number;
  areaKm2: number;
  status: {
    accessibilityLevel: 'full' | 'partial' | 'limited' | 'restricted';
    deliverySupported: boolean;
    lastUpdated: Date;
    notes?: string;
    alternativeRoutes?: string[];
  };
  demographics: {
    urbanPopulation: number;
    ruralPopulation: number;
    mainIndustries: string[];
    economicStatus: 'active' | 'recovering' | 'limited';
    infrastructureLevel: 'good' | 'fair' | 'poor';
  };
  displayOrder: number;
  isActive: boolean;
}

/**
 * Complete seed data for all 14 Syrian governorates
 * Data based on official Syrian government statistics and current operational status
 */
export const SYRIAN_GOVERNORATES_SEEDS: SyrianGovernoratesSeedData[] = [
  {
    code: 'DMS',
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    capitalEn: 'Damascus',
    capitalAr: 'دمشق',
    latitude: 33.5138,
    longitude: 36.2765,
    population: 2503000,
    areaKm2: 105.0,
    status: {
      accessibilityLevel: 'full',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Capital city with full services and infrastructure',
      alternativeRoutes: [
        'Via M5 Highway',
        'Via Airport Road',
        'Via Daraa Highway',
      ],
    },
    demographics: {
      urbanPopulation: 2400000,
      ruralPopulation: 103000,
      mainIndustries: [
        'Government Services',
        'Banking',
        'Tourism',
        'Manufacturing',
        'Education',
      ],
      economicStatus: 'active',
      infrastructureLevel: 'good',
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    code: 'RIF',
    nameEn: 'Rif Dimashq',
    nameAr: 'ريف دمشق',
    capitalEn: 'Douma',
    capitalAr: 'دوما',
    latitude: 33.5722,
    longitude: 36.4027,
    population: 3000000,
    areaKm2: 18018.0,
    status: {
      accessibilityLevel: 'partial',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes:
        'Mixed accessibility across different areas, some restrictions in certain zones',
      alternativeRoutes: [
        'Via Damascus Ring Road',
        'Via Zabadani Road',
        'Via Quneitra Highway',
      ],
    },
    demographics: {
      urbanPopulation: 1800000,
      ruralPopulation: 1200000,
      mainIndustries: ['Agriculture', 'Manufacturing', 'Services', 'Tourism'],
      economicStatus: 'recovering',
      infrastructureLevel: 'fair',
    },
    displayOrder: 2,
    isActive: true,
  },
  {
    code: 'ALP',
    nameEn: 'Aleppo',
    nameAr: 'حلب',
    capitalEn: 'Aleppo',
    capitalAr: 'حلب',
    latitude: 36.2021,
    longitude: 37.1343,
    population: 4868000,
    areaKm2: 18482.0,
    status: {
      accessibilityLevel: 'partial',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes:
        'Major commercial hub with ongoing reconstruction, most areas accessible',
      alternativeRoutes: [
        'Via M5 Highway',
        'Via Gaziantep Border',
        'Via Idlib Road',
      ],
    },
    demographics: {
      urbanPopulation: 3200000,
      ruralPopulation: 1668000,
      mainIndustries: [
        'Textiles',
        'Food Processing',
        'Manufacturing',
        'Trade',
        'Agriculture',
      ],
      economicStatus: 'recovering',
      infrastructureLevel: 'fair',
    },
    displayOrder: 3,
    isActive: true,
  },
  {
    code: 'HMS',
    nameEn: 'Homs',
    nameAr: 'حمص',
    capitalEn: 'Homs',
    capitalAr: 'حمص',
    latitude: 34.7329,
    longitude: 36.7194,
    population: 1803000,
    areaKm2: 42226.0,
    status: {
      accessibilityLevel: 'full',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Industrial center with good connectivity and infrastructure',
      alternativeRoutes: [
        'Via M5 Highway',
        'Via Palmyra Road',
        'Via Tartus Highway',
      ],
    },
    demographics: {
      urbanPopulation: 1100000,
      ruralPopulation: 703000,
      mainIndustries: [
        'Oil Refining',
        'Petrochemicals',
        'Manufacturing',
        'Agriculture',
      ],
      economicStatus: 'active',
      infrastructureLevel: 'good',
    },
    displayOrder: 4,
    isActive: true,
  },
  {
    code: 'HAM',
    nameEn: 'Hama',
    nameAr: 'حماة',
    capitalEn: 'Hama',
    capitalAr: 'حماة',
    latitude: 35.135,
    longitude: 36.7548,
    population: 1628000,
    areaKm2: 8883.0,
    status: {
      accessibilityLevel: 'full',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Agricultural center with good road network connectivity',
      alternativeRoutes: [
        'Via M5 Highway',
        'Via Aleppo Road',
        'Via Salamiyah Road',
      ],
    },
    demographics: {
      urbanPopulation: 800000,
      ruralPopulation: 828000,
      mainIndustries: ['Agriculture', 'Food Processing', 'Textiles', 'Tourism'],
      economicStatus: 'active',
      infrastructureLevel: 'good',
    },
    displayOrder: 5,
    isActive: true,
  },
  {
    code: 'LAT',
    nameEn: 'Lattakia',
    nameAr: 'اللاذقية',
    capitalEn: 'Lattakia',
    capitalAr: 'اللاذقية',
    latitude: 35.5309,
    longitude: 35.7908,
    population: 1008000,
    areaKm2: 2297.0,
    status: {
      accessibilityLevel: 'full',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Major port city with excellent connectivity and infrastructure',
      alternativeRoutes: [
        'Via Coastal Highway',
        'Via Tartus Road',
        'Via Turkey Border',
      ],
    },
    demographics: {
      urbanPopulation: 650000,
      ruralPopulation: 358000,
      mainIndustries: [
        'Port Operations',
        'Tourism',
        'Agriculture',
        'Manufacturing',
      ],
      economicStatus: 'active',
      infrastructureLevel: 'good',
    },
    displayOrder: 6,
    isActive: true,
  },
  {
    code: 'TAR',
    nameEn: 'Tartus',
    nameAr: 'طرطوس',
    capitalEn: 'Tartus',
    capitalAr: 'طرطوس',
    latitude: 34.885,
    longitude: 35.8852,
    population: 797000,
    areaKm2: 1892.0,
    status: {
      accessibilityLevel: 'full',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Coastal governorate with port facilities and good infrastructure',
      alternativeRoutes: [
        'Via Coastal Highway',
        'Via Homs Road',
        'Via Lebanon Border',
      ],
    },
    demographics: {
      urbanPopulation: 400000,
      ruralPopulation: 397000,
      mainIndustries: [
        'Port Operations',
        'Oil Refining',
        'Tourism',
        'Agriculture',
      ],
      economicStatus: 'active',
      infrastructureLevel: 'good',
    },
    displayOrder: 7,
    isActive: true,
  },
  {
    code: 'IDL',
    nameEn: 'Idlib',
    nameAr: 'إدلب',
    capitalEn: 'Idlib',
    capitalAr: 'إدلب',
    latitude: 35.9333,
    longitude: 36.6333,
    population: 1501000,
    areaKm2: 6097.0,
    status: {
      accessibilityLevel: 'limited',
      deliverySupported: false,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Limited accessibility due to ongoing security concerns',
      alternativeRoutes: [
        'Via Turkey Border (Limited)',
        'Via Hama Road (Restricted)',
      ],
    },
    demographics: {
      urbanPopulation: 600000,
      ruralPopulation: 901000,
      mainIndustries: ['Agriculture', 'Small Manufacturing', 'Services'],
      economicStatus: 'limited',
      infrastructureLevel: 'poor',
    },
    displayOrder: 8,
    isActive: false, // Temporarily inactive for e-commerce
  },
  {
    code: 'DER',
    nameEn: 'Der Ezzor',
    nameAr: 'دير الزور',
    capitalEn: 'Der Ezzor',
    capitalAr: 'دير الزور',
    latitude: 35.3444,
    longitude: 40.1464,
    population: 1239000,
    areaKm2: 33060.0,
    status: {
      accessibilityLevel: 'partial',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes:
        'Eastern governorate with selective accessibility, mainly urban areas',
      alternativeRoutes: [
        'Via Baghdad Highway',
        'Via Palmyra Road',
        'Via Hassakeh Road',
      ],
    },
    demographics: {
      urbanPopulation: 500000,
      ruralPopulation: 739000,
      mainIndustries: ['Oil & Gas', 'Agriculture', 'Trade'],
      economicStatus: 'recovering',
      infrastructureLevel: 'fair',
    },
    displayOrder: 9,
    isActive: true,
  },
  {
    code: 'RAQ',
    nameEn: 'Ar-Raqqa',
    nameAr: 'الرقة',
    capitalEn: 'Ar-Raqqa',
    capitalAr: 'الرقة',
    latitude: 35.95,
    longitude: 39.0086,
    population: 944000,
    areaKm2: 19616.0,
    status: {
      accessibilityLevel: 'limited',
      deliverySupported: false,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Limited accessibility, reconstruction in progress',
      alternativeRoutes: ['Via Aleppo Road (Limited)', 'Via Hassakeh Road'],
    },
    demographics: {
      urbanPopulation: 300000,
      ruralPopulation: 644000,
      mainIndustries: ['Agriculture', 'Oil & Gas', 'Livestock'],
      economicStatus: 'recovering',
      infrastructureLevel: 'poor',
    },
    displayOrder: 10,
    isActive: false, // Temporarily inactive
  },
  {
    code: 'HAS',
    nameEn: 'Al-Hasakah',
    nameAr: 'الحسكة',
    capitalEn: 'Al-Hasakah',
    capitalAr: 'الحسكة',
    latitude: 36.5004,
    longitude: 40.7478,
    population: 1512000,
    areaKm2: 23334.0,
    status: {
      accessibilityLevel: 'partial',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Northeastern governorate with mixed accessibility',
      alternativeRoutes: [
        'Via Iraq Border',
        'Via Turkey Border',
        'Via Qamishli Road',
      ],
    },
    demographics: {
      urbanPopulation: 700000,
      ruralPopulation: 812000,
      mainIndustries: ['Oil & Gas', 'Agriculture', 'Livestock', 'Trade'],
      economicStatus: 'recovering',
      infrastructureLevel: 'fair',
    },
    displayOrder: 11,
    isActive: true,
  },
  {
    code: 'DAR',
    nameEn: 'Daraa',
    nameAr: 'درعا',
    capitalEn: 'Daraa',
    capitalAr: 'درعا',
    latitude: 32.6189,
    longitude: 36.1022,
    population: 1027000,
    areaKm2: 3730.0,
    status: {
      accessibilityLevel: 'full',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes:
        'Southern governorate with good connectivity to Damascus and Jordan',
      alternativeRoutes: [
        'Via Damascus Highway',
        'Via Jordan Border',
        'Via Sweida Road',
      ],
    },
    demographics: {
      urbanPopulation: 400000,
      ruralPopulation: 627000,
      mainIndustries: ['Agriculture', 'Trade', 'Cross-border Commerce'],
      economicStatus: 'recovering',
      infrastructureLevel: 'fair',
    },
    displayOrder: 12,
    isActive: true,
  },
  {
    code: 'SWD',
    nameEn: 'As-Suwayda',
    nameAr: 'السويداء',
    capitalEn: 'As-Suwayda',
    capitalAr: 'السويداء',
    latitude: 32.7094,
    longitude: 36.5619,
    population: 370000,
    areaKm2: 5550.0,
    status: {
      accessibilityLevel: 'full',
      deliverySupported: true,
      lastUpdated: new Date('2025-08-14'),
      notes: 'Mountain governorate with good security and infrastructure',
      alternativeRoutes: [
        'Via Damascus Highway',
        'Via Daraa Road',
        'Via Jordan Border',
      ],
    },
    demographics: {
      urbanPopulation: 150000,
      ruralPopulation: 220000,
      mainIndustries: [
        'Agriculture',
        'Wine Production',
        'Tourism',
        'Handicrafts',
      ],
      economicStatus: 'active',
      infrastructureLevel: 'good',
    },
    displayOrder: 13,
    isActive: true,
  },
  {
    code: 'QUN',
    nameEn: 'Quneitra',
    nameAr: 'القنيطرة',
    capitalEn: 'Quneitra',
    capitalAr: 'القنيطرة',
    latitude: 33.1264,
    longitude: 35.8244,
    population: 90000,
    areaKm2: 1861.0,
    status: {
      accessibilityLevel: 'restricted',
      deliverySupported: false,
      lastUpdated: new Date('2025-08-14'),
      notes:
        'Border governorate with restricted access due to demilitarized zone',
      alternativeRoutes: ['Via Damascus (Limited)', 'UN Supervision Zone'],
    },
    demographics: {
      urbanPopulation: 30000,
      ruralPopulation: 60000,
      mainIndustries: ['Agriculture', 'Services', 'Cross-border Trade'],
      economicStatus: 'limited',
      infrastructureLevel: 'fair',
    },
    displayOrder: 14,
    isActive: false, // Special status due to demilitarized zone
  },
];

/**
 * Get governorates by accessibility level
 */
export function getGovernoratesByAccessibilityLevel(
  level: 'full' | 'partial' | 'limited' | 'restricted',
): SyrianGovernoratesSeedData[] {
  return SYRIAN_GOVERNORATES_SEEDS.filter(
    (gov) => gov.status.accessibilityLevel === level,
  );
}

/**
 * Get active governorates only
 */
export function getActiveGovernorates(): SyrianGovernoratesSeedData[] {
  return SYRIAN_GOVERNORATES_SEEDS.filter((gov) => gov.isActive);
}

/**
 * Get governorates supporting delivery
 */
export function getDeliveryEnabledGovernorates(): SyrianGovernoratesSeedData[] {
  return SYRIAN_GOVERNORATES_SEEDS.filter(
    (gov) => gov.status.deliverySupported,
  );
}

/**
 * Get governorate by code
 */
export function getGovernorateByCode(
  code: string,
): SyrianGovernoratesSeedData | undefined {
  return SYRIAN_GOVERNORATES_SEEDS.find((gov) => gov.code === code);
}

/**
 * Get governorates by economic status
 */
export function getGovernoratesByEconomicStatus(
  status: 'active' | 'recovering' | 'limited',
): SyrianGovernoratesSeedData[] {
  return SYRIAN_GOVERNORATES_SEEDS.filter(
    (gov) => gov.demographics.economicStatus === status,
  );
}

/**
 * Get total population across all governorates
 */
export function getTotalPopulation(): number {
  return SYRIAN_GOVERNORATES_SEEDS.reduce(
    (total, gov) => total + gov.population,
    0,
  );
}

/**
 * Get total area across all governorates
 */
export function getTotalArea(): number {
  return SYRIAN_GOVERNORATES_SEEDS.reduce(
    (total, gov) => total + gov.areaKm2,
    0,
  );
}
