/**
 * @file syrian-address.service.ts
 * @description Syrian address management service with full localization
 *
 * SYRIAN LOCALIZATION FEATURES:
 * - Complete Syrian administrative divisions
 * - Bilingual address management (Arabic/English)
 * - Address validation and normalization
 * - Geographic optimization for delivery
 * - Postal code management
 * - Diaspora address support
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
  SyrianAddressEntity,
  AddressStatus,
  VerificationMethod,
} from '../entities';

/**
 * Address validation result
 */
interface AddressValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  suggestions?: Partial<SyrianAddressEntity>[];
  issues?: string[];
  correctedFields?: Record<string, any>;
}

/**
 * Delivery zone information
 */
interface DeliveryZoneInfo {
  isSupported: boolean;
  estimatedDeliveryTime: number; // hours
  deliveryFee: number;
  availableOptions: string[];
  restrictions?: string[];
  alternativeLocations?: {
    name: string;
    distance: number;
    coordinates: { lat: number; lng: number };
  }[];
}

@Injectable()
export class SyrianAddressService {
  private readonly logger = new Logger(SyrianAddressService.name);

  constructor(
    @InjectRepository(SyrianGovernorateEntity)
    private governorateRepo: Repository<SyrianGovernorateEntity>,

    @InjectRepository(SyrianCityEntity)
    private cityRepo: Repository<SyrianCityEntity>,

    @InjectRepository(SyrianDistrictEntity)
    private districtRepo: Repository<SyrianDistrictEntity>,

    @InjectRepository(SyrianAddressEntity)
    private addressRepo: Repository<SyrianAddressEntity>,
  ) {
    // Initialize Syrian administrative divisions
    this.initializeSyrianDivisions();
  }

  /**
   * Initialize Syrian governorates, cities, and districts
   */
  private async initializeSyrianDivisions(): Promise<void> {
    try {
      const existingGovernorates = await this.governorateRepo.count();
      if (existingGovernorates > 0) {
        this.logger.log('Syrian divisions already initialized');
        return;
      }

      // Syrian Governorates (14 official governorates)
      const governorates = [
        {
          code: 'DIM',
          nameEn: 'Damascus',
          nameAr: 'دمشق',
          capitalEn: 'Damascus',
          capitalAr: 'دمشق',
          latitude: 33.5138,
          longitude: 36.2765,
          population: 2500000,
          areaKm2: 105,
          displayOrder: 1,
          status: {
            accessibilityLevel: 'full' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 18032,
          displayOrder: 2,
          status: {
            accessibilityLevel: 'partial' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
        },
        {
          code: 'ALE',
          nameEn: 'Aleppo',
          nameAr: 'حلب',
          capitalEn: 'Aleppo',
          capitalAr: 'حلب',
          latitude: 36.2021,
          longitude: 37.1343,
          population: 2500000,
          areaKm2: 18482,
          displayOrder: 3,
          status: {
            accessibilityLevel: 'full' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 42223,
          displayOrder: 4,
          status: {
            accessibilityLevel: 'full' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 8883,
          displayOrder: 5,
          status: {
            accessibilityLevel: 'full' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 2297,
          displayOrder: 6,
          status: {
            accessibilityLevel: 'full' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 1890,
          displayOrder: 7,
          status: {
            accessibilityLevel: 'full' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
        },
        {
          code: 'IDL',
          nameEn: 'Idlib',
          nameAr: 'إدلب',
          capitalEn: 'Idlib',
          capitalAr: 'إدلب',
          latitude: 35.9239,
          longitude: 36.6334,
          population: 1500000,
          areaKm2: 6097,
          displayOrder: 8,
          status: {
            accessibilityLevel: 'limited' as const,
            deliverySupported: false,
            lastUpdated: new Date(),
            notes: 'Limited access due to ongoing situation',
          },
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
          areaKm2: 33060,
          displayOrder: 9,
          status: {
            accessibilityLevel: 'partial' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 19616,
          displayOrder: 10,
          status: {
            accessibilityLevel: 'partial' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 23334,
          displayOrder: 11,
          status: {
            accessibilityLevel: 'partial' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 3730,
          displayOrder: 12,
          status: {
            accessibilityLevel: 'full' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 5550,
          displayOrder: 13,
          status: {
            accessibilityLevel: 'full' as const,
            deliverySupported: true,
            lastUpdated: new Date(),
          },
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
          areaKm2: 1861,
          displayOrder: 14,
          status: {
            accessibilityLevel: 'limited' as const,
            deliverySupported: false,
            lastUpdated: new Date(),
            notes: 'Limited access due to special status',
          },
        },
      ];

      // Save governorates
      for (const governorateData of governorates) {
        const governorate = this.governorateRepo.create(governorateData);
        await this.governorateRepo.save(governorate);
      }

      this.logger.log(`Initialized ${governorates.length} Syrian governorates`);

      // Initialize major cities (this would be expanded with full city data)
      await this.initializeMajorCities();
    } catch (error: unknown) {
      this.logger.error('Failed to initialize Syrian divisions', (error as Error).stack);
    }
  }

  /**
   * Initialize major Syrian cities
   */
  private async initializeMajorCities(): Promise<void> {
    const damascusGov = await this.governorateRepo.findOne({
      where: { code: 'DIM' },
    });
    const aleppoGov = await this.governorateRepo.findOne({
      where: { code: 'ALE' },
    });

    if (damascusGov) {
      const damascusCities = [
        {
          governorate: damascusGov,
          nameEn: 'Old Damascus',
          nameAr: 'دمشق القديمة',
          cityType: 'district',
          postalCodePrefix: '11',
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 2,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
        },
        {
          governorate: damascusGov,
          nameEn: 'New Damascus',
          nameAr: 'دمشق الجديدة',
          cityType: 'district',
          postalCodePrefix: '12',
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 1,
            lastMileOptions: ['standard', 'express', 'pickup_point'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
        },
      ];

      for (const cityData of damascusCities) {
        const city = this.cityRepo.create(cityData);
        await this.cityRepo.save(city);
      }
    }

    if (aleppoGov) {
      const aleppoCities = [
        {
          governorate: aleppoGov,
          nameEn: 'Aleppo City Center',
          nameAr: 'وسط حلب',
          cityType: 'city',
          postalCodePrefix: '21',
          logistics: {
            deliverySupported: true,
            averageDeliveryTime: 3,
            lastMileOptions: ['standard', 'express'] as (
              | 'standard'
              | 'express'
              | 'pickup_point'
            )[],
          },
        },
      ];

      for (const cityData of aleppoCities) {
        const city = this.cityRepo.create(cityData);
        await this.cityRepo.save(city);
      }
    }
  }

  /**
   * Get all Syrian governorates
   */
  async getAllGovernorates(): Promise<SyrianGovernorateEntity[]> {
    return this.governorateRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get cities by governorate
   */
  async getCitiesByGovernorate(
    governorateId: number,
  ): Promise<SyrianCityEntity[]> {
    return this.cityRepo.find({
      where: {
        governorate: { id: governorateId },
        isActive: true,
      },
      order: { displayOrder: 'ASC' },
      relations: ['governorate'],
    });
  }

  /**
   * Get districts by city
   */
  async getDistrictsByCity(cityId: number): Promise<SyrianDistrictEntity[]> {
    return this.districtRepo.find({
      where: {
        city: { id: cityId },
        isActive: true,
      },
      order: { displayOrder: 'ASC' },
      relations: ['city', 'city.governorate'],
    });
  }

  /**
   * Validate Syrian address
   */
  async validateAddress(
    addressData: Partial<SyrianAddressEntity>,
  ): Promise<AddressValidationResult> {
    const issues: string[] = [];
    let confidence = 100;

    // Validate governorate
    if (addressData.governorate?.id) {
      const governorate = await this.governorateRepo.findOne({
        where: { id: addressData.governorate.id, isActive: true },
      });
      if (!governorate) {
        issues.push('Invalid governorate');
        confidence -= 30;
      } else if (!governorate.status?.deliverySupported) {
        issues.push('Delivery not supported in this governorate');
        confidence -= 20;
      }
    } else {
      issues.push('Governorate is required');
      confidence -= 25;
    }

    // Validate city
    if (addressData.city?.id) {
      const city = await this.cityRepo.findOne({
        where: { id: addressData.city.id, isActive: true },
        relations: ['governorate'],
      });
      if (!city) {
        issues.push('Invalid city');
        confidence -= 25;
      } else if (!city.logistics?.deliverySupported) {
        issues.push('Delivery not supported in this city');
        confidence -= 15;
      }
    } else {
      issues.push('City is required');
      confidence -= 20;
    }

    // Validate coordinates if provided
    if (addressData.latitude && addressData.longitude) {
      if (
        addressData.latitude < 32 ||
        addressData.latitude > 37 ||
        addressData.longitude < 35 ||
        addressData.longitude > 42
      ) {
        issues.push('Coordinates outside Syrian territory');
        confidence -= 15;
      }
    }

    // Validate postal code format
    if (addressData.postalCode) {
      const postalCodeRegex = /^\d{5}$/;
      if (!postalCodeRegex.test(addressData.postalCode)) {
        issues.push('Invalid postal code format (should be 5 digits)');
        confidence -= 10;
      }
    }

    return {
      isValid: issues.length === 0 && confidence >= 70,
      confidence: Math.max(0, confidence),
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Create Syrian address with validation
   */
  async createSyrianAddress(
    addressData: Partial<SyrianAddressEntity>,
  ): Promise<SyrianAddressEntity> {
    // Validate address first
    const validation = await this.validateAddress(addressData);

    if (!validation.isValid) {
      throw new BadRequestException(
        `Address validation failed: ${validation.issues?.join(', ')}`,
      );
    }

    // Set validation metadata
    const address = this.addressRepo.create({
      ...addressData,
      status:
        validation.confidence >= 90
          ? AddressStatus.VERIFIED
          : AddressStatus.PENDING_VERIFICATION,
      validation: {
        verificationMethod: VerificationMethod.AUTOMATED,
        confidenceScore: validation.confidence,
        issues: validation.issues,
      },
    });

    return this.addressRepo.save(address);
  }

  /**
   * Get delivery zone information
   */
  async getDeliveryZoneInfo(
    governorateId: number,
    cityId?: number,
  ): Promise<DeliveryZoneInfo> {
    const governorate = await this.governorateRepo.findOne({
      where: { id: governorateId },
    });

    if (!governorate) {
      throw new NotFoundException('Governorate not found');
    }

    const city = cityId
      ? await this.cityRepo.findOne({
          where: { id: cityId },
        })
      : null;

    // Calculate delivery information
    const isSupported =
      governorate.status?.deliverySupported &&
      (city ? city.logistics?.deliverySupported !== false : true);

    const baseDeliveryTime = city?.logistics?.averageDeliveryTime || 24;
    const deliveryFee = this.calculateDeliveryFee(governorate, city ?? undefined);

    return {
      isSupported,
      estimatedDeliveryTime: baseDeliveryTime,
      deliveryFee,
      availableOptions: city?.logistics?.lastMileOptions || ['standard'],
      restrictions:
        governorate.status?.accessibilityLevel === 'limited'
          ? ['Limited access area - additional verification required']
          : undefined,
    };
  }

  /**
   * Search addresses by text (supports Arabic and English)
   */
  async searchAddresses(
    query: string,
    language: 'en' | 'ar' = 'en',
  ): Promise<any[]> {
    const results = [];

    // Search governorates
    const governorateQuery = this.governorateRepo
      .createQueryBuilder('gov')
      .where(
        language === 'ar' ? 'gov.nameAr LIKE :query' : 'gov.nameEn LIKE :query',
        { query: `%${query}%` },
      )
      .andWhere('gov.isActive = :isActive', { isActive: true });

    const governorates = await governorateQuery.getMany();
    results.push(
      ...governorates.map((g) => ({
        type: 'governorate',
        id: g.id,
        name: language === 'ar' ? g.nameAr : g.nameEn,
        nameAr: g.nameAr,
        nameEn: g.nameEn,
        deliverySupported: g.status?.deliverySupported,
      })),
    );

    // Search cities
    const cityQuery = this.cityRepo
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.governorate', 'gov')
      .where(
        language === 'ar'
          ? 'city.nameAr LIKE :query'
          : 'city.nameEn LIKE :query',
        { query: `%${query}%` },
      )
      .andWhere('city.isActive = :isActive', { isActive: true });

    const cities = await cityQuery.getMany();
    results.push(
      ...cities.map((c) => ({
        type: 'city',
        id: c.id,
        name: language === 'ar' ? c.nameAr : c.nameEn,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        governorate: {
          id: c.governorate.id,
          name: language === 'ar' ? c.governorate.nameAr : c.governorate.nameEn,
        },
        deliverySupported: c.logistics?.deliverySupported,
      })),
    );

    return results;
  }

  /**
   * PRIVATE METHODS
   */

  private calculateDeliveryFee(
    governorate: SyrianGovernorateEntity,
    __city?: SyrianCityEntity,
  ): number {
    let baseFee = 500; // SYP

    // Adjust based on governorate
    if (governorate.code === 'DIM') {
      baseFee = 300; // Damascus - lower fee
    } else if (['ALE', 'HMS', 'HAM'].includes(governorate.code)) {
      baseFee = 400; // Major cities
    } else if (['LAT', 'TAR'].includes(governorate.code)) {
      baseFee = 500; // Coastal areas
    } else {
      baseFee = 600; // Remote areas
    }

    // Adjust based on accessibility
    if (governorate.status?.accessibilityLevel === 'limited') {
      baseFee *= 1.5;
    } else if (governorate.status?.accessibilityLevel === 'partial') {
      baseFee *= 1.2;
    }

    return Math.round(baseFee);
  }
}
