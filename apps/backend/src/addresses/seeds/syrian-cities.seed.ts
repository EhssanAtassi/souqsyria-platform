/**
 * @file syrian-cities.seed.ts
 * @description Comprehensive seed data for major Syrian cities and towns
 *
 * This file contains data for the most important cities and towns in Syria
 * including major population centers, economic hubs, and strategic locations.
 * Data includes logistics information, infrastructure status, and delivery capabilities.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

export interface SyrianCitiesSeedData {
  governorateCode: string;
  nameEn: string;
  nameAr: string;
  alternativeNames?: {
    en?: string[];
    ar?: string[];
    transliterations?: string[];
    historicalNames?: string[];
  };
  cityType: 'city' | 'town' | 'village' | 'suburb' | 'district';
  latitude: number;
  longitude: number;
  postalCodePrefix?: string;
  population: number;
  logistics: {
    deliverySupported: boolean;
    averageDeliveryTime: number; // hours
    deliveryZones?: string[];
    restrictions?: string[];
    preferredCarriers?: string[];
    lastMileOptions?: ('standard' | 'express' | 'pickup_point')[];
  };
  infrastructure: {
    hasPostOffice: boolean;
    hasBank: boolean;
    hasInternet: boolean;
    hasMobileNetwork: boolean;
    roadQuality: 'good' | 'fair' | 'poor';
    publicTransport: boolean;
  };
  displayOrder: number;
  isActive: boolean;
}

/**
 * Major Syrian cities and towns seed data
 * Organized by governorate with the most important population and commercial centers
 */
export const SYRIAN_CITIES_SEEDS: SyrianCitiesSeedData[] = [
  // DAMASCUS GOVERNORATE
  {
    governorateCode: 'DMS',
    nameEn: 'Old City Damascus',
    nameAr: 'دمشق القديمة',
    alternativeNames: {
      en: ['Damascus Old City', 'Historic Damascus'],
      ar: ['البلدة القديمة', 'دمشق التاريخية'],
      historicalNames: ['Dimashq al-Sham', 'Damascus al-Kubra'],
    },
    cityType: 'district',
    latitude: 33.5102,
    longitude: 36.3068,
    postalCodePrefix: '11001',
    population: 400000,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 2,
      deliveryZones: [
        'Straight Street',
        'Umayyad Mosque Area',
        'Christian Quarter',
        'Jewish Quarter',
      ],
      restrictions: [
        'No large vehicles in narrow streets',
        'Pedestrian zones only',
      ],
      preferredCarriers: ['Damascus Express', 'Old City Couriers'],
      lastMileOptions: ['standard', 'pickup_point'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: true,
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    governorateCode: 'DMS',
    nameEn: 'Mezzeh',
    nameAr: 'المزة',
    alternativeNames: {
      en: ['Mazzeh'],
      ar: ['المزه'],
    },
    cityType: 'district',
    latitude: 33.5005,
    longitude: 36.2308,
    postalCodePrefix: '11002',
    population: 300000,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 1,
      deliveryZones: ['Mezzeh Villas', 'Mezzeh 86', 'Mezzeh Autoostrad'],
      preferredCarriers: ['Damascus Express', 'Capital Delivery'],
      lastMileOptions: ['standard', 'express'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'good',
      publicTransport: true,
    },
    displayOrder: 2,
    isActive: true,
  },

  // RIF DIMASHQ GOVERNORATE
  {
    governorateCode: 'RIF',
    nameEn: 'Douma',
    nameAr: 'دوما',
    alternativeNames: {
      transliterations: ['Duma', 'Doumah'],
    },
    cityType: 'city',
    latitude: 33.5722,
    longitude: 36.4027,
    postalCodePrefix: '12001',
    population: 117000,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 3,
      deliveryZones: ['City Center', 'Industrial Zone', 'Residential Areas'],
      preferredCarriers: ['Damascus Express', 'Rif Delivery'],
      lastMileOptions: ['standard', 'pickup_point'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: true,
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    governorateCode: 'RIF',
    nameEn: 'Zabadani',
    nameAr: 'الزبداني',
    alternativeNames: {
      en: ['Zabdani'],
      transliterations: ['Az-Zabadani'],
    },
    cityType: 'town',
    latitude: 33.7244,
    longitude: 36.1014,
    postalCodePrefix: '12101',
    population: 40000,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 4,
      deliveryZones: ['Town Center', 'Mountain Resort Area'],
      restrictions: ['Mountain weather conditions may affect delivery'],
      preferredCarriers: ['Mountain Express'],
      lastMileOptions: ['standard'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: false,
    },
    displayOrder: 2,
    isActive: true,
  },

  // ALEPPO GOVERNORATE
  {
    governorateCode: 'ALP',
    nameEn: 'Aleppo',
    nameAr: 'حلب',
    alternativeNames: {
      en: ['Haleb', 'Beroea'],
      ar: ['حلب الشهباء'],
      transliterations: ['Halab', 'Halep'],
      historicalNames: ['Beroea', 'Khalep'],
    },
    cityType: 'city',
    latitude: 36.2021,
    longitude: 37.1343,
    postalCodePrefix: '21001',
    population: 2132100,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 4,
      deliveryZones: [
        'Old City',
        'New Aleppo',
        'Sheikh Maqsoud',
        'Salaheddine',
        'Aziziyeh',
      ],
      restrictions: ['Some areas still under reconstruction'],
      preferredCarriers: [
        'Aleppo Express',
        'Northern Delivery',
        'Halab Logistics',
      ],
      lastMileOptions: ['standard', 'express', 'pickup_point'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: true,
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    governorateCode: 'ALP',
    nameEn: 'Afrin',
    nameAr: 'عفرين',
    alternativeNames: {
      transliterations: ['Afrîn'],
    },
    cityType: 'city',
    latitude: 36.5117,
    longitude: 36.8708,
    postalCodePrefix: '21201',
    population: 172000,
    logistics: {
      deliverySupported: false, // Currently restricted
      averageDeliveryTime: 0,
      restrictions: ['Limited accessibility due to security situation'],
    },
    infrastructure: {
      hasPostOffice: false,
      hasBank: false,
      hasInternet: false,
      hasMobileNetwork: true,
      roadQuality: 'poor',
      publicTransport: false,
    },
    displayOrder: 2,
    isActive: false,
  },

  // HOMS GOVERNORATE
  {
    governorateCode: 'HMS',
    nameEn: 'Homs',
    nameAr: 'حمص',
    alternativeNames: {
      en: ['Emesa'],
      historicalNames: ['Emesa'],
    },
    cityType: 'city',
    latitude: 34.7329,
    longitude: 36.7194,
    postalCodePrefix: '31001',
    population: 652609,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 3,
      deliveryZones: [
        'City Center',
        'Industrial Zone',
        'Karm al-Shami',
        'Waer',
        'Akrama',
      ],
      preferredCarriers: ['Homs Express', 'Central Syria Delivery'],
      lastMileOptions: ['standard', 'express', 'pickup_point'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'good',
      publicTransport: true,
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    governorateCode: 'HMS',
    nameEn: 'Palmyra',
    nameAr: 'تدمر',
    alternativeNames: {
      en: ['Tadmur'],
      ar: ['تدمر'],
      historicalNames: ['Ancient Palmyra'],
    },
    cityType: 'city',
    latitude: 34.5553,
    longitude: 38.2842,
    postalCodePrefix: '31201',
    population: 51323,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 6,
      deliveryZones: ['City Center', 'Archaeological Site Area'],
      restrictions: ['Desert location may affect delivery times'],
      preferredCarriers: ['Desert Express'],
      lastMileOptions: ['standard'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: false,
    },
    displayOrder: 2,
    isActive: true,
  },

  // HAMA GOVERNORATE
  {
    governorateCode: 'HAM',
    nameEn: 'Hama',
    nameAr: 'حماة',
    alternativeNames: {
      en: ['Hamath'],
      historicalNames: ['Hamath'],
    },
    cityType: 'city',
    latitude: 35.135,
    longitude: 36.7548,
    postalCodePrefix: '33001',
    population: 312994,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 3,
      deliveryZones: [
        'City Center',
        'Al-Andalus',
        'Al-Hamra',
        'Industrial Zone',
      ],
      preferredCarriers: ['Hama Express', 'Orontes Delivery'],
      lastMileOptions: ['standard', 'express'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'good',
      publicTransport: true,
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    governorateCode: 'HAM',
    nameEn: 'Salamiyah',
    nameAr: 'سلمية',
    alternativeNames: {
      transliterations: ['Salamiyeh'],
    },
    cityType: 'city',
    latitude: 35.0108,
    longitude: 37.0531,
    postalCodePrefix: '33101',
    population: 66724,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 4,
      deliveryZones: ['City Center', 'Agricultural Area'],
      preferredCarriers: ['Hama Express', 'Agricultural Delivery'],
      lastMileOptions: ['standard'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: true,
    },
    displayOrder: 2,
    isActive: true,
  },

  // LATTAKIA GOVERNORATE
  {
    governorateCode: 'LAT',
    nameEn: 'Lattakia',
    nameAr: 'اللاذقية',
    alternativeNames: {
      en: ['Latakia', 'Laodicea'],
      transliterations: ['Al-Ladhiqiyah'],
      historicalNames: ['Laodicea'],
    },
    cityType: 'city',
    latitude: 35.5309,
    longitude: 35.7908,
    postalCodePrefix: '41001',
    population: 383786,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 2,
      deliveryZones: [
        'Port Area',
        'City Center',
        'Al-Raml',
        'Al-Tabiyat',
        'Tourist Zone',
      ],
      preferredCarriers: [
        'Coastal Express',
        'Mediterranean Delivery',
        'Port Logistics',
      ],
      lastMileOptions: ['standard', 'express', 'pickup_point'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'good',
      publicTransport: true,
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    governorateCode: 'LAT',
    nameEn: 'Jableh',
    nameAr: 'جبلة',
    alternativeNames: {
      en: ['Jablah'],
      transliterations: ['Jabala'],
    },
    cityType: 'city',
    latitude: 35.362,
    longitude: 35.9281,
    postalCodePrefix: '41101',
    population: 80000,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 3,
      deliveryZones: ['Historic Center', 'Port Area', 'Beach Resort Area'],
      preferredCarriers: ['Coastal Express'],
      lastMileOptions: ['standard', 'pickup_point'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'good',
      publicTransport: true,
    },
    displayOrder: 2,
    isActive: true,
  },

  // TARTUS GOVERNORATE
  {
    governorateCode: 'TAR',
    nameEn: 'Tartus',
    nameAr: 'طرطوس',
    alternativeNames: {
      en: ['Tartous'],
      historicalNames: ['Tortosa'],
    },
    cityType: 'city',
    latitude: 34.885,
    longitude: 35.8852,
    postalCodePrefix: '43001',
    population: 115769,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 2,
      deliveryZones: [
        'Port Area',
        'City Center',
        'Tourist Zone',
        'Industrial Area',
      ],
      preferredCarriers: ['Tartus Port Express', 'Coastal Delivery'],
      lastMileOptions: ['standard', 'express', 'pickup_point'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'good',
      publicTransport: true,
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    governorateCode: 'TAR',
    nameEn: 'Banias',
    nameAr: 'بانياس',
    alternativeNames: {
      transliterations: ['Baniyas'],
    },
    cityType: 'city',
    latitude: 35.1817,
    longitude: 35.9483,
    postalCodePrefix: '43101',
    population: 43000,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 3,
      deliveryZones: ['Refinery Area', 'City Center', 'Port Zone'],
      preferredCarriers: ['Industrial Express'],
      lastMileOptions: ['standard'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'good',
      publicTransport: true,
    },
    displayOrder: 2,
    isActive: true,
  },

  // DER EZZOR GOVERNORATE
  {
    governorateCode: 'DER',
    nameEn: 'Der Ezzor',
    nameAr: 'دير الزور',
    alternativeNames: {
      en: ['Deir ez-Zor', 'Deir al-Zor'],
      transliterations: ['Dayr az-Zawr'],
    },
    cityType: 'city',
    latitude: 35.3444,
    longitude: 40.1464,
    postalCodePrefix: '51001',
    population: 271800,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 8,
      deliveryZones: ['City Center', 'Al-Joura', 'Al-Qusour'],
      restrictions: ['Remote location affects delivery schedules'],
      preferredCarriers: ['Eastern Express'],
      lastMileOptions: ['standard'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: false,
    },
    displayOrder: 1,
    isActive: true,
  },

  // AL-HASAKAH GOVERNORATE
  {
    governorateCode: 'HAS',
    nameEn: 'Al-Hasakah',
    nameAr: 'الحسكة',
    alternativeNames: {
      en: ['Hasaka', 'Al-Hasaka'],
      transliterations: ['Al-Ḥasaka'],
    },
    cityType: 'city',
    latitude: 36.5004,
    longitude: 40.7478,
    postalCodePrefix: '53001',
    population: 188160,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 10,
      deliveryZones: ['City Center', 'Industrial Area'],
      restrictions: ['Remote northeastern location'],
      preferredCarriers: ['Northeast Delivery'],
      lastMileOptions: ['standard'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: false,
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    governorateCode: 'HAS',
    nameEn: 'Qamishli',
    nameAr: 'القامشلي',
    alternativeNames: {
      en: ['Qamishly'],
      transliterations: ['Al-Qāmishlī'],
    },
    cityType: 'city',
    latitude: 37.0575,
    longitude: 41.2308,
    postalCodePrefix: '53101',
    population: 184231,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 8,
      deliveryZones: ['City Center', 'Border Area'],
      restrictions: ['Border city with special regulations'],
      preferredCarriers: ['Border Express'],
      lastMileOptions: ['standard'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: false,
    },
    displayOrder: 2,
    isActive: true,
  },

  // DARAA GOVERNORATE
  {
    governorateCode: 'DAR',
    nameEn: 'Daraa',
    nameAr: 'درعا',
    alternativeNames: {
      en: ['Deraa'],
      transliterations: ["Dar'ā"],
    },
    cityType: 'city',
    latitude: 32.6189,
    longitude: 36.1022,
    postalCodePrefix: '61001',
    population: 97969,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 4,
      deliveryZones: ['City Center', 'Border Area', 'Old City'],
      restrictions: ['Border city with customs procedures'],
      preferredCarriers: ['Southern Express', 'Border Delivery'],
      lastMileOptions: ['standard', 'pickup_point'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'fair',
      publicTransport: true,
    },
    displayOrder: 1,
    isActive: true,
  },

  // AS-SUWAYDA GOVERNORATE
  {
    governorateCode: 'SWD',
    nameEn: 'As-Suwayda',
    nameAr: 'السويداء',
    alternativeNames: {
      en: ['Sweida', 'Suweida'],
      transliterations: ['As-Suwaydā'],
    },
    cityType: 'city',
    latitude: 32.7094,
    longitude: 36.5619,
    postalCodePrefix: '63001',
    population: 73641,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 4,
      deliveryZones: ['City Center', 'Mountain Villages'],
      restrictions: ['Mountain terrain may affect delivery'],
      preferredCarriers: ['Mountain Express', 'Druze Delivery'],
      lastMileOptions: ['standard'],
    },
    infrastructure: {
      hasPostOffice: true,
      hasBank: true,
      hasInternet: true,
      hasMobileNetwork: true,
      roadQuality: 'good',
      publicTransport: false,
    },
    displayOrder: 1,
    isActive: true,
  },
];

/**
 * Get cities by governorate code
 */
export function getCitiesByGovernorate(
  governorateCode: string,
): SyrianCitiesSeedData[] {
  return SYRIAN_CITIES_SEEDS.filter(
    (city) => city.governorateCode === governorateCode,
  );
}

/**
 * Get cities supporting delivery
 */
export function getDeliveryEnabledCities(): SyrianCitiesSeedData[] {
  return SYRIAN_CITIES_SEEDS.filter((city) => city.logistics.deliverySupported);
}

/**
 * Get active cities only
 */
export function getActiveCities(): SyrianCitiesSeedData[] {
  return SYRIAN_CITIES_SEEDS.filter((city) => city.isActive);
}

/**
 * Get cities by type
 */
export function getCitiesByType(
  type: 'city' | 'town' | 'village' | 'suburb' | 'district',
): SyrianCitiesSeedData[] {
  return SYRIAN_CITIES_SEEDS.filter((city) => city.cityType === type);
}

/**
 * Get major cities (population > 100,000)
 */
export function getMajorCities(): SyrianCitiesSeedData[] {
  return SYRIAN_CITIES_SEEDS.filter((city) => city.population > 100000);
}

/**
 * Get cities with express delivery
 */
export function getCitiesWithExpressDelivery(): SyrianCitiesSeedData[] {
  return SYRIAN_CITIES_SEEDS.filter((city) =>
    city.logistics.lastMileOptions?.includes('express'),
  );
}

/**
 * Get total urban population
 */
export function getTotalUrbanPopulation(): number {
  return SYRIAN_CITIES_SEEDS.reduce(
    (total, city) => total + city.population,
    0,
  );
}
