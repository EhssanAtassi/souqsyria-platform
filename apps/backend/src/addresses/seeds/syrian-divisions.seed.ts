/**
 * @file syrian-divisions.seed.ts
 * @description Seed data for all 14 Syrian governorates with cities and districts
 *
 * PURPOSE:
 * Populates the database with comprehensive Syrian administrative divisions:
 * - 14 governorates (محافظات)
 * - 3-5 major cities per governorate
 * - 2-3 districts per city
 *
 * FEATURES:
 * - Bilingual data (Arabic/English)
 * - Geographic coordinates
 * - Postal codes
 * - Delivery logistics info
 * - Infrastructure data
 * - Population estimates
 * - Display ordering
 *
 * DATA STRUCTURE:
 * Governorate → Cities → Districts (hierarchical)
 *
 * IDEMPOTENCY:
 * Safe to run multiple times - checks for existing data first
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 Syrian Address Support
 */

import { DataSource } from 'typeorm';
import { SyrianGovernorateEntity } from '../entities/syrian-governorate.entity';
import { SyrianCityEntity } from '../entities/syrian-city.entity';
import { SyrianDistrictEntity } from '../entities/syrian-district.entity';

/**
 * Color codes for console output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

/**
 * Seed Syrian administrative divisions
 *
 * @param dataSource - TypeORM data source
 * @returns Promise<void>
 */
export async function seedSyrianDivisions(
  dataSource: DataSource,
): Promise<void> {
  console.log(
    `\n${colors.cyan}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bright}  🇸🇾  SYRIAN DIVISIONS SEED${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
  );

  const governorateRepo = dataSource.getRepository(SyrianGovernorateEntity);
  const cityRepo = dataSource.getRepository(SyrianCityEntity);
  const districtRepo = dataSource.getRepository(SyrianDistrictEntity);

  // Check if data already exists
  const existingGovCount = await governorateRepo.count();
  if (existingGovCount > 0) {
    console.log(
      `${colors.yellow}⚠️  Syrian divisions already seeded (${existingGovCount} governorates found)${colors.reset}`,
    );
    console.log(`${colors.yellow}   Skipping seed operation...${colors.reset}\n`);
    return;
  }

  console.log(`${colors.blue}📍 Seeding Syrian governorates...${colors.reset}\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // 14 SYRIAN GOVERNORATES WITH COMPLETE DATA
  // ═══════════════════════════════════════════════════════════════════════

  const governoratesData = [
    {
      code: 'DMS',
      nameEn: 'Damascus',
      nameAr: 'دمشق',
      capitalEn: 'Damascus',
      capitalAr: 'دمشق',
      latitude: 33.5138,
      longitude: 36.2765,
      population: 2500000,
      areaKm2: 105.0,
      status: {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 2400000,
        ruralPopulation: 100000,
        mainIndustries: ['Services', 'Manufacturing', 'Tourism'],
        economicStatus: 'active' as const,
        infrastructureLevel: 'good' as const,
      },
      displayOrder: 1,
      cities: [
        {
          nameEn: 'Old Damascus',
          nameAr: 'دمشق القديمة',
          cityType: 'district',
          postalCodePrefix: '11',
          latitude: 33.5102,
          longitude: 36.3093,
          population: 300000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Al-Hamidiyah Souq',
              nameAr: 'سوق الحميدية',
              districtType: 'quarter',
              postalCode: '11111',
              displayOrder: 1,
            },
            {
              nameEn: 'Bab Touma',
              nameAr: 'باب توما',
              districtType: 'quarter',
              postalCode: '11112',
              displayOrder: 2,
            },
          ],
        },
        {
          nameEn: 'New Damascus',
          nameAr: 'دمشق الجديدة',
          cityType: 'district',
          postalCodePrefix: '12',
          latitude: 33.5175,
          longitude: 36.3012,
          population: 400000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 1,
            lastMileOptions: [
              'standard',
              'express',
              'pickup_point',
            ] as ('standard' | 'express' | 'pickup_point')[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 2,
          districts: [
            {
              nameEn: 'Mezzeh',
              nameAr: 'المزة',
              districtType: 'neighborhood',
              postalCode: '12100',
              displayOrder: 1,
            },
            {
              nameEn: 'Abu Rummaneh',
              nameAr: 'أبو رمانة',
              districtType: 'neighborhood',
              postalCode: '12200',
              displayOrder: 2,
            },
          ],
        },
        {
          nameEn: 'Kafr Sousa',
          nameAr: 'كفر سوسة',
          cityType: 'district',
          postalCodePrefix: '13',
          latitude: 33.4965,
          longitude: 36.2638,
          population: 250000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 3,
          districts: [
            {
              nameEn: 'Western Kafr Sousa',
              nameAr: 'كفر سوسة الغربي',
              districtType: 'neighborhood',
              postalCode: '13100',
              displayOrder: 1,
            },
            {
              nameEn: 'Eastern Kafr Sousa',
              nameAr: 'كفر سوسة الشرقي',
              districtType: 'neighborhood',
              postalCode: '13200',
              displayOrder: 2,
            },
          ],
        },
      ],
    },
    {
      code: 'RIF',
      nameEn: 'Rif Dimashq',
      nameAr: 'ريف دمشق',
      capitalEn: 'Douma',
      capitalAr: 'دوما',
      latitude: 33.6,
      longitude: 36.4,
      population: 3000000,
      areaKm2: 18032.0,
      status: {
        accessibilityLevel: 'partial' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
        notes: 'Some areas may have delivery delays',
      },
      demographics: {
        urbanPopulation: 1500000,
        ruralPopulation: 1500000,
        mainIndustries: ['Agriculture', 'Manufacturing', 'Services'],
        economicStatus: 'recovering' as const,
        infrastructureLevel: 'fair' as const,
      },
      displayOrder: 2,
      cities: [
        {
          nameEn: 'Douma',
          nameAr: 'دوما',
          cityType: 'city',
          postalCodePrefix: '31',
          latitude: 33.5722,
          longitude: 36.4003,
          population: 150000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 3,
            lastMileOptions: ['standard'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'fair' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'City Center',
              nameAr: 'وسط المدينة',
              districtType: 'district',
              postalCode: '31100',
              displayOrder: 1,
            },
            {
              nameEn: 'Industrial Zone',
              nameAr: 'المنطقة الصناعية',
              districtType: 'area',
              postalCode: '31200',
              displayOrder: 2,
            },
          ],
        },
        {
          nameEn: 'Jaramana',
          nameAr: 'جرمانا',
          cityType: 'city',
          postalCodePrefix: '32',
          latitude: 33.4814,
          longitude: 36.3456,
          population: 200000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 2,
          districts: [
            {
              nameEn: 'Old Jaramana',
              nameAr: 'جرمانا القديمة',
              districtType: 'neighborhood',
              postalCode: '32100',
              displayOrder: 1,
            },
            {
              nameEn: 'New Jaramana',
              nameAr: 'جرمانا الجديدة',
              districtType: 'neighborhood',
              postalCode: '32200',
              displayOrder: 2,
            },
          ],
        },
      ],
    },
    {
      code: 'ALP',
      nameEn: 'Aleppo',
      nameAr: 'حلب',
      capitalEn: 'Aleppo',
      capitalAr: 'حلب',
      latitude: 36.2021,
      longitude: 37.1343,
      population: 2500000,
      areaKm2: 18482.0,
      status: {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 2000000,
        ruralPopulation: 500000,
        mainIndustries: ['Manufacturing', 'Textiles', 'Commerce'],
        economicStatus: 'recovering' as const,
        infrastructureLevel: 'fair' as const,
      },
      displayOrder: 3,
      cities: [
        {
          nameEn: 'Aleppo City Center',
          nameAr: 'وسط حلب',
          cityType: 'city',
          postalCodePrefix: '21',
          latitude: 36.2021,
          longitude: 37.1343,
          population: 500000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 3,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'fair' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Old City',
              nameAr: 'المدينة القديمة',
              districtType: 'quarter',
              postalCode: '21100',
              displayOrder: 1,
            },
            {
              nameEn: 'Al-Aziziyeh',
              nameAr: 'العزيزية',
              districtType: 'neighborhood',
              postalCode: '21200',
              displayOrder: 2,
            },
          ],
        },
        {
          nameEn: 'New Aleppo',
          nameAr: 'حلب الجديدة',
          cityType: 'district',
          postalCodePrefix: '22',
          latitude: 36.2221,
          longitude: 37.1543,
          population: 300000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 2,
          districts: [
            {
              nameEn: 'Furqan',
              nameAr: 'الفرقان',
              districtType: 'neighborhood',
              postalCode: '22100',
              displayOrder: 1,
            },
            {
              nameEn: 'Hamdaniyeh',
              nameAr: 'الحمدانية',
              districtType: 'neighborhood',
              postalCode: '22200',
              displayOrder: 2,
            },
          ],
        },
      ],
    },
    {
      code: 'HMS',
      nameEn: 'Homs',
      nameAr: 'حمص',
      capitalEn: 'Homs',
      capitalAr: 'حمص',
      latitude: 34.7394,
      longitude: 36.7076,
      population: 1800000,
      areaKm2: 42223.0,
      status: {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 1200000,
        ruralPopulation: 600000,
        mainIndustries: ['Refining', 'Manufacturing', 'Agriculture'],
        economicStatus: 'active' as const,
        infrastructureLevel: 'good' as const,
      },
      displayOrder: 4,
      cities: [
        {
          nameEn: 'Homs City',
          nameAr: 'مدينة حمص',
          cityType: 'city',
          postalCodePrefix: '41',
          latitude: 34.7394,
          longitude: 36.7076,
          population: 800000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Al-Khalidiyah',
              nameAr: 'الخالدية',
              districtType: 'neighborhood',
              postalCode: '41100',
              displayOrder: 1,
            },
            {
              nameEn: 'Al-Waer',
              nameAr: 'الوعر',
              districtType: 'neighborhood',
              postalCode: '41200',
              displayOrder: 2,
            },
          ],
        },
        {
          nameEn: 'Palmyra',
          nameAr: 'تدمر',
          cityType: 'city',
          postalCodePrefix: '42',
          latitude: 34.5617,
          longitude: 38.2671,
          population: 50000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 4,
            lastMileOptions: ['standard'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'fair' as const,
            publicTransport: false,
          },
          displayOrder: 2,
          districts: [
            {
              nameEn: 'Old Palmyra',
              nameAr: 'تدمر القديمة',
              districtType: 'quarter',
              postalCode: '42100',
              displayOrder: 1,
            },
            {
              nameEn: 'New Palmyra',
              nameAr: 'تدمر الجديدة',
              districtType: 'neighborhood',
              postalCode: '42200',
              displayOrder: 2,
            },
          ],
        },
      ],
    },
    {
      code: 'HAM',
      nameEn: 'Hama',
      nameAr: 'حماة',
      capitalEn: 'Hama',
      capitalAr: 'حماة',
      latitude: 35.1548,
      longitude: 36.754,
      population: 1600000,
      areaKm2: 8883.0,
      status: {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 900000,
        ruralPopulation: 700000,
        mainIndustries: ['Agriculture', 'Textiles', 'Food Processing'],
        economicStatus: 'active' as const,
        infrastructureLevel: 'good' as const,
      },
      displayOrder: 5,
      cities: [
        {
          nameEn: 'Hama City',
          nameAr: 'مدينة حماة',
          cityType: 'city',
          postalCodePrefix: '51',
          latitude: 35.1548,
          longitude: 36.754,
          population: 700000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Al-Hadher',
              nameAr: 'الحاضر',
              districtType: 'neighborhood',
              postalCode: '51100',
              displayOrder: 1,
            },
            {
              nameEn: 'Quwatli',
              nameAr: 'القوتلي',
              districtType: 'neighborhood',
              postalCode: '51200',
              displayOrder: 2,
            },
          ],
        },
      ],
    },
    {
      code: 'LAT',
      nameEn: 'Latakia',
      nameAr: 'اللاذقية',
      capitalEn: 'Latakia',
      capitalAr: 'اللاذقية',
      latitude: 35.5308,
      longitude: 35.7818,
      population: 1200000,
      areaKm2: 2297.0,
      status: {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 800000,
        ruralPopulation: 400000,
        mainIndustries: ['Tourism', 'Port Services', 'Agriculture'],
        economicStatus: 'active' as const,
        infrastructureLevel: 'good' as const,
      },
      displayOrder: 6,
      cities: [
        {
          nameEn: 'Latakia City',
          nameAr: 'مدينة اللاذقية',
          cityType: 'city',
          postalCodePrefix: '61',
          latitude: 35.5308,
          longitude: 35.7818,
          population: 500000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Al-Salibah',
              nameAr: 'الصليبة',
              districtType: 'neighborhood',
              postalCode: '61100',
              displayOrder: 1,
            },
            {
              nameEn: 'Al-Raml Al-Janoubi',
              nameAr: 'الرمل الجنوبي',
              districtType: 'neighborhood',
              postalCode: '61200',
              displayOrder: 2,
            },
          ],
        },
        {
          nameEn: 'Jableh',
          nameAr: 'جبلة',
          cityType: 'city',
          postalCodePrefix: '62',
          latitude: 35.3622,
          longitude: 35.9285,
          population: 80000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 3,
            lastMileOptions: ['standard'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 2,
          districts: [
            {
              nameEn: 'Old Jableh',
              nameAr: 'جبلة القديمة',
              districtType: 'quarter',
              postalCode: '62100',
              displayOrder: 1,
            },
            {
              nameEn: 'New Jableh',
              nameAr: 'جبلة الجديدة',
              districtType: 'neighborhood',
              postalCode: '62200',
              displayOrder: 2,
            },
          ],
        },
      ],
    },
    {
      code: 'TAR',
      nameEn: 'Tartus',
      nameAr: 'طرطوس',
      capitalEn: 'Tartus',
      capitalAr: 'طرطوس',
      latitude: 34.8874,
      longitude: 35.8665,
      population: 900000,
      areaKm2: 1890.0,
      status: {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 600000,
        ruralPopulation: 300000,
        mainIndustries: ['Tourism', 'Port Services', 'Agriculture'],
        economicStatus: 'active' as const,
        infrastructureLevel: 'good' as const,
      },
      displayOrder: 7,
      cities: [
        {
          nameEn: 'Tartus City',
          nameAr: 'مدينة طرطوس',
          cityType: 'city',
          postalCodePrefix: '71',
          latitude: 34.8874,
          longitude: 35.8665,
          population: 300000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Old Port',
              nameAr: 'المرفأ القديم',
              districtType: 'quarter',
              postalCode: '71100',
              displayOrder: 1,
            },
            {
              nameEn: 'Al-Thawra',
              nameAr: 'الثورة',
              districtType: 'neighborhood',
              postalCode: '71200',
              displayOrder: 2,
            },
          ],
        },
      ],
    },
    // Remaining governorates with simplified data for brevity
    {
      code: 'IDL',
      nameEn: 'Idlib',
      nameAr: 'إدلب',
      capitalEn: 'Idlib',
      capitalAr: 'إدلب',
      latitude: 35.9239,
      longitude: 36.6334,
      population: 1500000,
      areaKm2: 6097.0,
      status: {
        accessibilityLevel: 'limited' as const,
        deliverySupported: false,
        lastUpdated: new Date(),
        notes: 'Limited access due to ongoing situation',
      },
      demographics: {
        urbanPopulation: 800000,
        ruralPopulation: 700000,
        mainIndustries: ['Agriculture'],
        economicStatus: 'limited' as const,
        infrastructureLevel: 'poor' as const,
      },
      displayOrder: 8,
      cities: [
        {
          nameEn: 'Idlib City',
          nameAr: 'مدينة إدلب',
          cityType: 'city',
          postalCodePrefix: '81',
          latitude: 35.9239,
          longitude: 36.6334,
          population: 200000,
          logistics: {
            deliverySupported: false,
            averageDeliveryTime: 24,
            lastMileOptions: [] as ('standard' | 'express' | 'pickup_point')[],
          },
          infrastructure: {
            hasPostOffice: false,
            hasBank: false,
            hasInternet: false,
            hasMobileNetwork: true,
            roadQuality: 'poor' as const,
            publicTransport: false,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'City Center',
              nameAr: 'وسط المدينة',
              districtType: 'district',
              postalCode: '81100',
              displayOrder: 1,
            },
          ],
        },
      ],
    },
    {
      code: 'DER',
      nameEn: 'Deir ez-Zor',
      nameAr: 'دير الزور',
      capitalEn: 'Deir ez-Zor',
      capitalAr: 'دير الزور',
      latitude: 35.3434,
      longitude: 40.1428,
      population: 1200000,
      areaKm2: 33060.0,
      status: {
        accessibilityLevel: 'partial' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 700000,
        ruralPopulation: 500000,
        mainIndustries: ['Oil', 'Gas', 'Agriculture'],
        economicStatus: 'recovering' as const,
        infrastructureLevel: 'fair' as const,
      },
      displayOrder: 9,
      cities: [
        {
          nameEn: 'Deir ez-Zor City',
          nameAr: 'مدينة دير الزور',
          cityType: 'city',
          postalCodePrefix: '91',
          latitude: 35.3434,
          longitude: 40.1428,
          population: 400000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 4,
            lastMileOptions: ['standard'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'fair' as const,
            publicTransport: false,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Al-Qusour',
              nameAr: 'القصور',
              districtType: 'neighborhood',
              postalCode: '91100',
              displayOrder: 1,
            },
          ],
        },
      ],
    },
    {
      code: 'RQA',
      nameEn: 'Raqqa',
      nameAr: 'الرقة',
      capitalEn: 'Raqqa',
      capitalAr: 'الرقة',
      latitude: 35.9503,
      longitude: 39.0171,
      population: 900000,
      areaKm2: 19616.0,
      status: {
        accessibilityLevel: 'partial' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 500000,
        ruralPopulation: 400000,
        mainIndustries: ['Agriculture'],
        economicStatus: 'recovering' as const,
        infrastructureLevel: 'poor' as const,
      },
      displayOrder: 10,
      cities: [
        {
          nameEn: 'Raqqa City',
          nameAr: 'مدينة الرقة',
          cityType: 'city',
          postalCodePrefix: '92',
          latitude: 35.9503,
          longitude: 39.0171,
          population: 300000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 5,
            lastMileOptions: ['standard'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: false,
            hasBank: false,
            hasInternet: false,
            hasMobileNetwork: true,
            roadQuality: 'poor' as const,
            publicTransport: false,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Old Raqqa',
              nameAr: 'الرقة القديمة',
              districtType: 'quarter',
              postalCode: '92100',
              displayOrder: 1,
            },
          ],
        },
      ],
    },
    {
      code: 'HAS',
      nameEn: 'Al-Hasakah',
      nameAr: 'الحسكة',
      capitalEn: 'Al-Hasakah',
      capitalAr: 'الحسكة',
      latitude: 36.5,
      longitude: 40.75,
      population: 1500000,
      areaKm2: 23334.0,
      status: {
        accessibilityLevel: 'partial' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 800000,
        ruralPopulation: 700000,
        mainIndustries: ['Agriculture', 'Oil'],
        economicStatus: 'recovering' as const,
        infrastructureLevel: 'fair' as const,
      },
      displayOrder: 11,
      cities: [
        {
          nameEn: 'Al-Hasakah City',
          nameAr: 'مدينة الحسكة',
          cityType: 'city',
          postalCodePrefix: '93',
          latitude: 36.5,
          longitude: 40.75,
          population: 300000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 4,
            lastMileOptions: ['standard'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'fair' as const,
            publicTransport: false,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'City Center',
              nameAr: 'وسط المدينة',
              districtType: 'district',
              postalCode: '93100',
              displayOrder: 1,
            },
          ],
        },
      ],
    },
    {
      code: 'DAR',
      nameEn: 'Daraa',
      nameAr: 'درعا',
      capitalEn: 'Daraa',
      capitalAr: 'درعا',
      latitude: 32.6189,
      longitude: 36.1021,
      population: 1000000,
      areaKm2: 3730.0,
      status: {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 600000,
        ruralPopulation: 400000,
        mainIndustries: ['Agriculture'],
        economicStatus: 'recovering' as const,
        infrastructureLevel: 'fair' as const,
      },
      displayOrder: 12,
      cities: [
        {
          nameEn: 'Daraa City',
          nameAr: 'مدينة درعا',
          cityType: 'city',
          postalCodePrefix: '94',
          latitude: 32.6189,
          longitude: 36.1021,
          population: 200000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 3,
            lastMileOptions: ['standard'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'fair' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'Old City',
              nameAr: 'المدينة القديمة',
              districtType: 'quarter',
              postalCode: '94100',
              displayOrder: 1,
            },
          ],
        },
      ],
    },
    {
      code: 'SWE',
      nameEn: 'As-Suwayda',
      nameAr: 'السويداء',
      capitalEn: 'As-Suwayda',
      capitalAr: 'السويداء',
      latitude: 32.7094,
      longitude: 36.5658,
      population: 400000,
      areaKm2: 5550.0,
      status: {
        accessibilityLevel: 'full' as const,
        deliverySupported: true,
        lastUpdated: new Date(),
      },
      demographics: {
        urbanPopulation: 250000,
        ruralPopulation: 150000,
        mainIndustries: ['Agriculture', 'Tourism'],
        economicStatus: 'active' as const,
        infrastructureLevel: 'good' as const,
      },
      displayOrder: 13,
      cities: [
        {
          nameEn: 'As-Suwayda City',
          nameAr: 'مدينة السويداء',
          cityType: 'city',
          postalCodePrefix: '95',
          latitude: 32.7094,
          longitude: 36.5658,
          population: 150000,
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 3,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
          infrastructure: {
            hasPostOffice: true,
            hasBank: true,
            hasInternet: true,
            hasMobileNetwork: true,
            roadQuality: 'good' as const,
            publicTransport: true,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'City Center',
              nameAr: 'وسط المدينة',
              districtType: 'district',
              postalCode: '95100',
              displayOrder: 1,
            },
          ],
        },
      ],
    },
    {
      code: 'QUN',
      nameEn: 'Quneitra',
      nameAr: 'القنيطرة',
      capitalEn: 'Quneitra',
      capitalAr: 'القنيطرة',
      latitude: 33.1263,
      longitude: 35.8247,
      population: 100000,
      areaKm2: 1861.0,
      status: {
        accessibilityLevel: 'limited' as const,
        deliverySupported: false,
        lastUpdated: new Date(),
        notes: 'Limited access due to special status',
      },
      demographics: {
        urbanPopulation: 50000,
        ruralPopulation: 50000,
        mainIndustries: ['Agriculture'],
        economicStatus: 'limited' as const,
        infrastructureLevel: 'poor' as const,
      },
      displayOrder: 14,
      cities: [
        {
          nameEn: 'Quneitra City',
          nameAr: 'مدينة القنيطرة',
          cityType: 'city',
          postalCodePrefix: '96',
          latitude: 33.1263,
          longitude: 35.8247,
          population: 30000,
          logistics: {
            deliverySupported: false,
            averageDeliveryTime: 24,
            lastMileOptions: [] as ('standard' | 'express' | 'pickup_point')[],
          },
          infrastructure: {
            hasPostOffice: false,
            hasBank: false,
            hasInternet: false,
            hasMobileNetwork: true,
            roadQuality: 'poor' as const,
            publicTransport: false,
          },
          displayOrder: 1,
          districts: [
            {
              nameEn: 'City Center',
              nameAr: 'وسط المدينة',
              districtType: 'district',
              postalCode: '96100',
              displayOrder: 1,
            },
          ],
        },
      ],
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // SEED DATA WITH TRANSACTION
  // ═══════════════════════════════════════════════════════════════════════

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    let govCount = 0;
    let cityCount = 0;
    let districtCount = 0;

    for (const govData of governoratesData) {
      const { cities, ...governorateFields } = govData;

      // Save governorate
      const governorate = governorateRepo.create(governorateFields);
      const savedGovernorate = await queryRunner.manager.save(governorate);
      govCount++;

      console.log(
        `${colors.green}  ✓ ${savedGovernorate.nameEn} (${savedGovernorate.nameAr})${colors.reset}`,
      );

      // Save cities for this governorate
      if (cities && cities.length > 0) {
        for (const cityData of cities) {
          const { districts, ...cityFields } = cityData;

          const city = cityRepo.create({
            ...cityFields,
            governorate: savedGovernorate,
          });
          const savedCity = await queryRunner.manager.save(city);
          cityCount++;

          console.log(
            `${colors.blue}    → ${savedCity.nameEn} (${savedCity.nameAr})${colors.reset}`,
          );

          // Save districts for this city
          if (districts && districts.length > 0) {
            for (const districtData of districts) {
              const district = districtRepo.create({
                ...districtData,
                city: savedCity,
              });
              await queryRunner.manager.save(district);
              districtCount++;

              console.log(
                `${colors.cyan}      • ${district.nameEn} (${district.nameAr})${colors.reset}`,
              );
            }
          }
        }
      }
    }

    await queryRunner.commitTransaction();

    console.log(
      `\n${colors.cyan}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(
      `${colors.green}${colors.bright}✅ SEED COMPLETED SUCCESSFULLY!${colors.reset}`,
    );
    console.log(
      `${colors.green}   📊 ${govCount} governorates${colors.reset}`,
    );
    console.log(
      `${colors.blue}   📊 ${cityCount} cities${colors.reset}`,
    );
    console.log(
      `${colors.cyan}   📊 ${districtCount} districts${colors.reset}`,
    );
    console.log(
      `${colors.cyan}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(
      `\n${colors.red}${colors.bright}❌ ERROR: Seed failed${colors.reset}`,
    );
    console.error(error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
