import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  SyrianGovernorate,
  SyrianRegion,
  SyrianTraditionalCategory,
  ShippingZone,
  Holiday,
  SyrianBusinessHours,
  WeeklySchedule,
  DaySchedule
} from '../interfaces/syrian-data.interface';

/**
 * Syrian Data Service
 *
 * Provides comprehensive Syrian geographical, cultural, and business data
 * Handles governorates, regions, traditional categories, shipping zones, and business hours
 * Supports bilingual Arabic/English content with cultural authenticity
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianDataService:
 *       type: object
 *       description: Service for Syrian marketplace cultural and geographical data
 *       properties:
 *         governorates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SyrianGovernorate'
 *         traditionalCategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SyrianTraditionalCategory'
 *         shippingZones:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShippingZone'
 */
@Injectable({
  providedIn: 'root'
})
export class SyrianDataService {

  private currentLanguage$ = new BehaviorSubject<'ar' | 'en'>('en');

  constructor() {}

  /**
   * Get all Syrian governorates with regions and shipping information
   * Returns comprehensive list of Syrian administrative divisions
   *
   * @returns Observable<SyrianGovernorate[]> List of all governorates
   *
   * @swagger
   * /api/syrian/governorates:
   *   get:
   *     tags: [Syrian Data]
   *     summary: Get Syrian governorates
   *     description: Retrieve all Syrian governorates with regions and shipping data
   *     responses:
   *       200:
   *         description: Governorates retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/SyrianGovernorate'
   */
  getSyrianGovernorates(): Observable<SyrianGovernorate[]> {
    const governorates: SyrianGovernorate[] = [
      {
        id: 'damascus',
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        regions: [
          {
            id: 'old_damascus',
            nameEn: 'Old Damascus',
            nameAr: 'دمشق القديمة',
            governorateId: 'damascus',
            postalCode: '11111',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 33.5138, longitude: 36.2765 },
            population: 250000
          },
          {
            id: 'new_damascus',
            nameEn: 'New Damascus',
            nameAr: 'دمشق الجديدة',
            governorateId: 'damascus',
            postalCode: '11112',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 33.5024, longitude: 36.2988 },
            population: 800000
          },
          {
            id: 'sayyida_zeinab',
            nameEn: 'Sayyida Zeinab',
            nameAr: 'السيدة زينب',
            governorateId: 'damascus',
            postalCode: '11113',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 33.4745, longitude: 36.2897 },
            population: 350000
          }
        ],
        shippingZone: 1,
        deliveryTime: '1-2 days',
        coordinates: { latitude: 33.5138, longitude: 36.2765 },
        population: 1750000,
        area: 105,
        isActive: true,
        heritage: true,
        specialInstructions: 'Capital city - priority delivery available'
      },
      {
        id: 'aleppo',
        nameEn: 'Aleppo',
        nameAr: 'حلب',
        regions: [
          {
            id: 'old_aleppo',
            nameEn: 'Old Aleppo',
            nameAr: 'حلب القديمة',
            governorateId: 'aleppo',
            postalCode: '21111',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 36.2021, longitude: 37.1343 },
            population: 400000
          },
          {
            id: 'new_aleppo',
            nameEn: 'New Aleppo',
            nameAr: 'حلب الجديدة',
            governorateId: 'aleppo',
            postalCode: '21112',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 36.2310, longitude: 37.1650 },
            population: 600000
          },
          {
            id: 'sheikh_maqsoud',
            nameEn: 'Sheikh Maqsoud',
            nameAr: 'الشيخ مقصود',
            governorateId: 'aleppo',
            postalCode: '21113',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 36.2156, longitude: 37.1289 },
            population: 200000
          }
        ],
        shippingZone: 2,
        deliveryTime: '2-3 days',
        coordinates: { latitude: 36.2021, longitude: 37.1343 },
        population: 2132000,
        area: 18500,
        isActive: true,
        heritage: true,
        specialInstructions: 'Second largest city - artisan crafts hub'
      },
      {
        id: 'homs',
        nameEn: 'Homs',
        nameAr: 'حمص',
        regions: [
          {
            id: 'homs_center',
            nameEn: 'City Center',
            nameAr: 'وسط المدينة',
            governorateId: 'homs',
            postalCode: '31111',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 34.7333, longitude: 36.7167 },
            population: 300000
          },
          {
            id: 'al_waer',
            nameEn: 'Al-Waer',
            nameAr: 'الوعر',
            governorateId: 'homs',
            postalCode: '31112',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 34.7156, longitude: 36.6889 },
            population: 450000
          },
          {
            id: 'al_qusour',
            nameEn: 'Al-Qusour',
            nameAr: 'القصور',
            governorateId: 'homs',
            postalCode: '31113',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 34.7445, longitude: 36.7378 },
            population: 180000
          }
        ],
        shippingZone: 2,
        deliveryTime: '2-3 days',
        coordinates: { latitude: 34.7333, longitude: 36.7167 },
        population: 1641000,
        area: 42226,
        isActive: true,
        heritage: false,
        specialInstructions: 'Industrial hub - bulk orders welcome'
      },
      {
        id: 'latakia',
        nameEn: 'Latakia',
        nameAr: 'اللاذقية',
        regions: [
          {
            id: 'latakia_port',
            nameEn: 'Port Area',
            nameAr: 'منطقة المرفأ',
            governorateId: 'latakia',
            postalCode: '41111',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 35.5167, longitude: 35.7833 },
            population: 200000
          },
          {
            id: 'salma',
            nameEn: 'Salma',
            nameAr: 'سلمى',
            governorateId: 'latakia',
            postalCode: '41112',
            isUrban: false,
            deliveryAvailable: true,
            coordinates: { latitude: 35.6333, longitude: 36.0167 },
            population: 50000
          },
          {
            id: 'jableh',
            nameEn: 'Jableh',
            nameAr: 'جبلة',
            governorateId: 'latakia',
            postalCode: '41113',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 35.3667, longitude: 35.9333 },
            population: 80000
          }
        ],
        shippingZone: 3,
        deliveryTime: '3-4 days',
        coordinates: { latitude: 35.5167, longitude: 35.7833 },
        population: 1008000,
        area: 2297,
        isActive: true,
        heritage: false,
        specialInstructions: 'Coastal region - humidity-sensitive products require special packaging'
      },
      {
        id: 'hama',
        nameEn: 'Hama',
        nameAr: 'حماة',
        regions: [
          {
            id: 'hama_center',
            nameEn: 'Hama Center',
            nameAr: 'وسط حماة',
            governorateId: 'hama',
            postalCode: '33111',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 35.1333, longitude: 36.75 },
            population: 350000
          },
          {
            id: 'masyaf',
            nameEn: 'Masyaf',
            nameAr: 'مصياف',
            governorateId: 'hama',
            postalCode: '33112',
            isUrban: false,
            deliveryAvailable: true,
            coordinates: { latitude: 35.0667, longitude: 36.3833 },
            population: 45000
          }
        ],
        shippingZone: 2,
        deliveryTime: '2-3 days',
        coordinates: { latitude: 35.1333, longitude: 36.75 },
        population: 1628000,
        area: 8883,
        isActive: true,
        heritage: true,
        specialInstructions: 'Historical waterwheels region - cultural significance'
      },
      {
        id: 'deir_ez_zor',
        nameEn: 'Deir ez-Zor',
        nameAr: 'دير الزور',
        regions: [
          {
            id: 'deir_ez_zor_center',
            nameEn: 'Deir ez-Zor Center',
            nameAr: 'وسط دير الزور',
            governorateId: 'deir_ez_zor',
            postalCode: '35111',
            isUrban: true,
            deliveryAvailable: true,
            coordinates: { latitude: 35.3333, longitude: 40.1333 },
            population: 250000
          }
        ],
        shippingZone: 4,
        deliveryTime: '4-5 days',
        coordinates: { latitude: 35.3333, longitude: 40.1333 },
        population: 1239000,
        area: 33060,
        isActive: true,
        heritage: false,
        specialInstructions: 'Eastern region - extended delivery time due to distance'
      }
    ];

    return of(governorates).pipe(delay(500));
  }

  /**
   * Get regions for a specific governorate
   * Returns list of regions within the specified governorate
   *
   * @param governorateId - The governorate identifier
   * @returns Observable<SyrianRegion[]> List of regions
   */
  getRegionsByGovernorate(governorateId: string): Observable<SyrianRegion[]> {
    return this.getSyrianGovernorates().pipe(
      map(governorates => {
        const governorate = governorates.find(g => g.id === governorateId);
        return governorate ? governorate.regions : [];
      })
    );
  }

  /**
   * Get traditional Syrian categories with heritage information
   * Returns categories representing authentic Syrian crafts and products
   *
   * @returns Observable<SyrianTraditionalCategory[]> Traditional categories
   *
   * @swagger
   * /api/syrian/categories/traditional:
   *   get:
   *     tags: [Syrian Data]
   *     summary: Get traditional Syrian categories
   *     description: Retrieve traditional Syrian craft categories with heritage data
   *     responses:
   *       200:
   *         description: Traditional categories retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/SyrianTraditionalCategory'
   */
  getTraditionalCategories(): Observable<SyrianTraditionalCategory[]> {
    const categories: SyrianTraditionalCategory[] = [
      {
        id: 'damascus_steel',
        nameAr: 'الفولاذ الدمشقي',
        nameEn: 'Damascus Steel',
        description: 'Traditional Syrian steel craftsmanship with distinctive watered patterns',
        heritage: true,
        unesco: true,
        artisanCount: 45,
        averagePrice: 2500000, // SYP
        popularityScore: 95,
        seasonality: ['year-round'],
        relatedCategories: ['knives', 'swords', 'decorative_items'],
        authenticityCriteria: [
          'Folded steel construction',
          'Visible Damascus pattern',
          'Traditional Syrian craftsmanship',
          'Artisan certification'
        ]
      },
      {
        id: 'aleppo_soap',
        nameAr: 'صابون الغار الحلبي',
        nameEn: 'Aleppo Laurel Soap',
        description: 'Traditional Syrian olive oil soap with laurel berry oil',
        heritage: true,
        unesco: false,
        artisanCount: 120,
        averagePrice: 85000, // SYP
        popularityScore: 88,
        seasonality: ['year-round'],
        relatedCategories: ['beauty', 'wellness', 'natural_products'],
        authenticityCriteria: [
          'Olive oil base',
          'Laurel berry oil content',
          'Traditional aging process',
          'Aleppo origin certification'
        ]
      },
      {
        id: 'syrian_brocade',
        nameAr: 'البروكار السوري',
        nameEn: 'Syrian Brocade',
        description: 'Traditional Syrian textile art with gold and silver threads',
        heritage: true,
        unesco: true,
        artisanCount: 78,
        averagePrice: 1800000, // SYP
        popularityScore: 82,
        seasonality: ['fall', 'winter', 'spring'],
        relatedCategories: ['textiles', 'fashion', 'home_decor'],
        authenticityCriteria: [
          'Hand-woven construction',
          'Metallic thread integration',
          'Traditional Syrian patterns',
          'Artisan guild certification'
        ]
      },
      {
        id: 'syrian_inlay',
        nameAr: 'الصدف والخشب المطعم',
        nameEn: 'Syrian Mother-of-Pearl Inlay',
        description: 'Traditional Syrian woodwork with mother-of-pearl and bone inlay',
        heritage: true,
        unesco: true,
        artisanCount: 156,
        averagePrice: 950000, // SYP
        popularityScore: 76,
        seasonality: ['year-round'],
        relatedCategories: ['furniture', 'decorative_items', 'gifts'],
        authenticityCriteria: [
          'Mother-of-pearl inlay work',
          'Traditional geometric patterns',
          'Syrian craftsmanship techniques',
          'Artisan workshop certification'
        ]
      },
      {
        id: 'seven_spice',
        nameAr: 'بهار السبع دمشقي',
        nameEn: 'Damascus Seven Spice Mix',
        description: 'Traditional Syrian spice blend with seven aromatic spices',
        heritage: true,
        unesco: false,
        artisanCount: 89,
        averagePrice: 45000, // SYP
        popularityScore: 91,
        seasonality: ['year-round'],
        relatedCategories: ['spices', 'food', 'cooking'],
        authenticityCriteria: [
          'Seven traditional spices',
          'Traditional grinding methods',
          'Syrian spice market sourcing',
          'Family recipe certification'
        ]
      },
      {
        id: 'syrian_oud',
        nameAr: 'العود السوري',
        nameEn: 'Syrian Oud Perfume',
        description: 'Traditional Syrian oud oil extracted from agarwood',
        heritage: true,
        unesco: false,
        artisanCount: 34,
        averagePrice: 1200000, // SYP
        popularityScore: 79,
        seasonality: ['fall', 'winter'],
        relatedCategories: ['perfume', 'luxury', 'traditional_scents'],
        authenticityCriteria: [
          'Pure agarwood extraction',
          'Traditional distillation methods',
          'Syrian sourcing',
          'Perfumer certification'
        ]
      },
      {
        id: 'syrian_sweets',
        nameAr: 'الحلويات الشرقية السورية',
        nameEn: 'Traditional Syrian Sweets',
        description: 'Authentic Syrian confections including baklava, maamoul, and halaweh',
        heritage: true,
        unesco: false,
        artisanCount: 267,
        averagePrice: 125000, // SYP
        popularityScore: 94,
        seasonality: ['eid', 'ramadan', 'year-round'],
        relatedCategories: ['sweets', 'desserts', 'gifts', 'celebrations'],
        authenticityCriteria: [
          'Traditional recipes',
          'Syrian pastry techniques',
          'Quality ingredients',
          'Master confectioner preparation'
        ]
      },
      {
        id: 'syrian_walnut_crafts',
        nameAr: 'الحرف اليدوية من خشب الجوز',
        nameEn: 'Syrian Walnut Wood Crafts',
        description: 'Traditional Syrian woodworking using local walnut wood',
        heritage: true,
        unesco: false,
        artisanCount: 92,
        averagePrice: 650000, // SYP
        popularityScore: 68,
        seasonality: ['year-round'],
        relatedCategories: ['woodwork', 'furniture', 'decorative_items'],
        authenticityCriteria: [
          'Syrian walnut wood',
          'Traditional carving techniques',
          'Hand-crafted construction',
          'Artisan workshop certification'
        ]
      }
    ];

    return of(categories).pipe(delay(400));
  }

  /**
   * Get shipping zones for Syrian marketplace
   * Returns shipping zones for domestic and international delivery
   *
   * @returns Observable<ShippingZone[]> Shipping zones configuration
   */
  getShippingZones(): Observable<ShippingZone[]> {
    const zones: ShippingZone[] = [
      {
        id: 1,
        name: 'Damascus Metro',
        nameAr: 'منطقة دمشق الكبرى',
        countries: ['Syria'],
        governorates: ['damascus'],
        baseRate: 15000, // SYP
        baseRateUSD: 6,
        deliveryTime: '1-2 days',
        isActive: true,
        requiresDocuments: false,
        maxWeight: 50,
        restrictions: []
      },
      {
        id: 2,
        name: 'Major Syrian Cities',
        nameAr: 'المدن السورية الرئيسية',
        countries: ['Syria'],
        governorates: ['aleppo', 'homs', 'hama'],
        baseRate: 25000, // SYP
        baseRateUSD: 10,
        deliveryTime: '2-3 days',
        isActive: true,
        requiresDocuments: false,
        maxWeight: 50,
        restrictions: []
      },
      {
        id: 3,
        name: 'Syrian Coastal & Rural',
        nameAr: 'الساحل والمناطق الريفية',
        countries: ['Syria'],
        governorates: ['latakia', 'tartus', 'sweida', 'quneitra'],
        baseRate: 35000, // SYP
        baseRateUSD: 14,
        deliveryTime: '3-4 days',
        isActive: true,
        requiresDocuments: false,
        maxWeight: 30,
        restrictions: ['fragile_items_extra_packaging']
      },
      {
        id: 4,
        name: 'Eastern Syria',
        nameAr: 'شرق سوريا',
        countries: ['Syria'],
        governorates: ['deir_ez_zor', 'raqqa', 'hasaka'],
        baseRate: 45000, // SYP
        baseRateUSD: 18,
        deliveryTime: '4-5 days',
        isActive: true,
        requiresDocuments: false,
        maxWeight: 25,
        restrictions: ['extended_delivery_time', 'weather_dependent']
      },
      {
        id: 5,
        name: 'GCC Countries',
        nameAr: 'دول مجلس التعاون الخليجي',
        countries: ['UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'],
        governorates: [],
        baseRate: 125000, // SYP
        baseRateUSD: 50,
        deliveryTime: '5-7 days',
        isActive: true,
        requiresDocuments: true,
        maxWeight: 20,
        restrictions: ['customs_clearance', 'prohibited_items_list']
      },
      {
        id: 6,
        name: 'Levant & Jordan',
        nameAr: 'بلاد الشام والأردن',
        countries: ['Jordan', 'Lebanon', 'Palestine'],
        governorates: [],
        baseRate: 85000, // SYP
        baseRateUSD: 34,
        deliveryTime: '4-6 days',
        isActive: true,
        requiresDocuments: true,
        maxWeight: 25,
        restrictions: ['border_processing_time']
      },
      {
        id: 7,
        name: 'Turkey',
        nameAr: 'تركيا',
        countries: ['Turkey'],
        governorates: [],
        baseRate: 95000, // SYP
        baseRateUSD: 38,
        deliveryTime: '6-8 days',
        isActive: true,
        requiresDocuments: true,
        maxWeight: 20,
        restrictions: ['customs_inspection', 'turkish_import_regulations']
      },
      {
        id: 8,
        name: 'Europe',
        nameAr: 'أوروبا',
        countries: ['Germany', 'France', 'UK', 'Netherlands', 'Sweden', 'Austria'],
        governorates: [],
        baseRate: 185000, // SYP
        baseRateUSD: 74,
        deliveryTime: '10-14 days',
        isActive: true,
        requiresDocuments: true,
        maxWeight: 15,
        restrictions: ['eu_customs', 'vat_applicable', 'heritage_item_certification']
      },
      {
        id: 9,
        name: 'North America',
        nameAr: 'أمريكا الشمالية',
        countries: ['USA', 'Canada'],
        governorates: [],
        baseRate: 235000, // SYP
        baseRateUSD: 94,
        deliveryTime: '12-18 days',
        isActive: true,
        requiresDocuments: true,
        maxWeight: 15,
        restrictions: ['us_customs', 'cultural_artifact_documentation', 'extended_processing']
      }
    ];

    return of(zones).pipe(delay(300));
  }

  /**
   * Get Syrian holidays and cultural events
   * Returns list of holidays affecting business operations and shipping
   *
   * @param year - Year for holiday calendar
   * @returns Observable<Holiday[]> List of holidays
   */
  getSyrianHolidays(year: number = new Date().getFullYear()): Observable<Holiday[]> {
    const holidays: Holiday[] = [
      {
        id: 'new_year',
        nameEn: 'New Year\'s Day',
        nameAr: 'رأس السنة الميلادية',
        date: new Date(year, 0, 1),
        isNationalHoliday: true,
        isReligiousHoliday: false,
        affectsShipping: true
      },
      {
        id: 'revolution_day',
        nameEn: 'Revolution Day',
        nameAr: 'يوم الثورة',
        date: new Date(year, 2, 8),
        isNationalHoliday: true,
        isReligiousHoliday: false,
        affectsShipping: true
      },
      {
        id: 'mothers_day',
        nameEn: 'Mother\'s Day',
        nameAr: 'عيد الأم',
        date: new Date(year, 2, 21),
        isNationalHoliday: true,
        isReligiousHoliday: false,
        affectsShipping: false
      },
      {
        id: 'independence_day',
        nameEn: 'Independence Day',
        nameAr: 'عيد الاستقلال',
        date: new Date(year, 3, 17),
        isNationalHoliday: true,
        isReligiousHoliday: false,
        affectsShipping: true
      },
      {
        id: 'labour_day',
        nameEn: 'Labour Day',
        nameAr: 'عيد العمال',
        date: new Date(year, 4, 1),
        isNationalHoliday: true,
        isReligiousHoliday: false,
        affectsShipping: true
      },
      {
        id: 'martyrs_day',
        nameEn: 'Martyrs\' Day',
        nameAr: 'يوم الشهداء',
        date: new Date(year, 4, 6),
        isNationalHoliday: true,
        isReligiousHoliday: false,
        affectsShipping: true
      },
      {
        id: 'eid_al_fitr',
        nameEn: 'Eid al-Fitr',
        nameAr: 'عيد الفطر',
        date: new Date(year, 3, 10), // Approximate - varies by lunar calendar
        isNationalHoliday: true,
        isReligiousHoliday: true,
        affectsShipping: true
      },
      {
        id: 'eid_al_adha',
        nameEn: 'Eid al-Adha',
        nameAr: 'عيد الأضحى',
        date: new Date(year, 5, 16), // Approximate - varies by lunar calendar
        isNationalHoliday: true,
        isReligiousHoliday: true,
        affectsShipping: true
      },
      {
        id: 'islamic_new_year',
        nameEn: 'Islamic New Year',
        nameAr: 'رأس السنة الهجرية',
        date: new Date(year, 6, 7), // Approximate - varies by lunar calendar
        isNationalHoliday: false,
        isReligiousHoliday: true,
        affectsShipping: false
      },
      {
        id: 'mawlid',
        nameEn: 'Prophet\'s Birthday',
        nameAr: 'المولد النبوي',
        date: new Date(year, 8, 15), // Approximate - varies by lunar calendar
        isNationalHoliday: true,
        isReligiousHoliday: true,
        affectsShipping: true
      },
      {
        id: 'christmas',
        nameEn: 'Christmas',
        nameAr: 'عيد الميلاد',
        date: new Date(year, 11, 25),
        isNationalHoliday: true,
        isReligiousHoliday: true,
        affectsShipping: true
      }
    ];

    return of(holidays).pipe(delay(200));
  }

  /**
   * Get Syrian business hours configuration
   * Returns business hours with cultural considerations
   *
   * @returns Observable<SyrianBusinessHours> Business hours configuration
   */
  getSyrianBusinessHours(): Observable<SyrianBusinessHours> {
    const standardSchedule: WeeklySchedule = {
      sunday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      friday: {
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
        breaks: [
          { startTime: '12:00', endTime: '14:00', reason: 'Friday Prayer Break' }
        ]
      },
      saturday: { isOpen: true, openTime: '10:00', closeTime: '17:00' }
    };

    const ramadanSchedule: WeeklySchedule = {
      sunday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
      monday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
      tuesday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
      wednesday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
      thursday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
      friday: {
        isOpen: true,
        openTime: '10:00',
        closeTime: '15:00',
        breaks: [
          { startTime: '12:00', endTime: '14:00', reason: 'Friday Prayer Break' }
        ]
      },
      saturday: { isOpen: true, openTime: '11:00', closeTime: '16:00' }
    };

    const businessHours: SyrianBusinessHours = {
      standard: standardSchedule,
      ramadan: ramadanSchedule,
      holidays: [],
      timezone: 'Asia/Damascus',
      culturalNotes: 'Business hours adjusted for prayer times and cultural considerations'
    };

    return of(businessHours).pipe(delay(150));
  }

  /**
   * Search governorates and regions by name
   * Returns filtered list based on search query
   *
   * @param query - Search query (Arabic or English)
   * @returns Observable<any[]> Search results
   */
  searchLocations(query: string): Observable<any[]> {
    return this.getSyrianGovernorates().pipe(
      map(governorates => {
        const results: any[] = [];
        const searchTerm = query.toLowerCase();

        governorates.forEach(gov => {
          // Check governorate match
          if (gov.nameEn.toLowerCase().includes(searchTerm) ||
              gov.nameAr.includes(searchTerm)) {
            results.push({
              type: 'governorate',
              id: gov.id,
              nameEn: gov.nameEn,
              nameAr: gov.nameAr,
              shippingZone: gov.shippingZone,
              deliveryTime: gov.deliveryTime
            });
          }

          // Check region matches
          gov.regions.forEach(region => {
            if (region.nameEn.toLowerCase().includes(searchTerm) ||
                region.nameAr.includes(searchTerm)) {
              results.push({
                type: 'region',
                id: region.id,
                nameEn: region.nameEn,
                nameAr: region.nameAr,
                governorate: gov.nameEn,
                governorateAr: gov.nameAr,
                shippingZone: gov.shippingZone
              });
            }
          });
        });

        return results;
      })
    );
  }

  /**
   * Get current language setting
   * Returns the currently selected language
   *
   * @returns Observable<'ar' | 'en'> Current language
   */
  getCurrentLanguage(): Observable<'ar' | 'en'> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Set current language
   * Updates the current language setting
   *
   * @param language - Language to set
   */
  setCurrentLanguage(language: 'ar' | 'en'): void {
    this.currentLanguage$.next(language);
  }

  /**
   * Get shipping zone by governorate
   * Returns shipping zone information for a specific governorate
   *
   * @param governorateId - Governorate identifier
   * @returns Observable<number> Shipping zone number
   */
  getShippingZoneByGovernorate(governorateId: string): Observable<number> {
    return this.getSyrianGovernorates().pipe(
      map(governorates => {
        const governorate = governorates.find(g => g.id === governorateId);
        return governorate ? governorate.shippingZone : 1;
      })
    );
  }

  /**
   * Get heritage categories only
   * Returns only categories marked as heritage items
   *
   * @returns Observable<SyrianTraditionalCategory[]> Heritage categories
   */
  getHeritageCategories(): Observable<SyrianTraditionalCategory[]> {
    return this.getTraditionalCategories().pipe(
      map(categories => categories.filter(cat => cat.heritage))
    );
  }

  /**
   * Get UNESCO recognized categories
   * Returns only categories recognized by UNESCO
   *
   * @returns Observable<SyrianTraditionalCategory[]> UNESCO categories
   */
  getUNESCOCategories(): Observable<SyrianTraditionalCategory[]> {
    return this.getTraditionalCategories().pipe(
      map(categories => categories.filter(cat => cat.unesco))
    );
  }
}