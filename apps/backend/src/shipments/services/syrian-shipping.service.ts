/**
 * @file syrian-shipping.service.ts
 * @description Syrian shipping companies management and integration service
 *
 * BUSINESS LOGIC:
 * - Manage Syrian shipping companies and their services
 * - Calculate shipping costs in SYP based on distance and weight
 * - Select optimal shipping company for delivery
 * - Handle Arabic/English localization
 * - Integrate with Syrian address system
 * - Performance tracking and analytics
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 1.0.0
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import {
  SyrianShippingCompanyEntity,
  SyrianShippingType,
  DeliveryService,
} from '../entities/syrian-shipping-company.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';
import { SyrianCityEntity } from '../../addresses/entities/syrian-city.entity';
import { SyrianAddressEntity } from '../../addresses/entities/syrian-address.entity';

/**
 * DTOs for Syrian Shipping Service
 */
export interface CreateSyrianShippingCompanyDto {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  companyType: SyrianShippingType;
  contactInfo: any;
  coverageAreas: any[];
  services: DeliveryService[];
  pricing: any;
  schedule: any;
  capabilities: any;
}

export interface ShippingCostCalculationDto {
  fromAddress: {
    governorateId: number;
    cityId: number;
    coordinates?: { lat: number; lng: number };
  };
  toAddress: {
    governorateId: number;
    cityId: number;
    coordinates?: { lat: number; lng: number };
  };
  packageDetails: {
    weightKg: number;
    dimensions: {
      length: number; // cm
      width: number; // cm
      height: number; // cm
    };
    value: number; // SYP
    isFragile: boolean;
    requiresSignature: boolean;
    codAmount?: number; // SYP
  };
  deliveryOptions: {
    serviceType?: string;
    isExpress: boolean;
    isWeekend: boolean;
    deliveryDate?: Date;
  };
}

export interface ShippingQuote {
  company: SyrianShippingCompanyEntity;
  service: DeliveryService;
  totalCostSYP: number;
  breakdown: {
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    expressFee?: number;
    weekendFee?: number;
    codFee?: number;
    insuranceFee?: number;
    fuelSurcharge?: number;
  };
  estimatedDeliveryTime: {
    hours: number;
    deliveryDate: Date;
    businessDaysOnly: boolean;
  };
  trackingAvailable: boolean;
  requiresPickup: boolean;
}

export interface ShippingCompanySelection {
  availableCompanies: ShippingQuote[];
  recommendedCompany: ShippingQuote;
  cheapestOption: ShippingQuote;
  fastestOption: ShippingQuote;
  metadata: {
    searchDate: Date;
    fromLocation: string;
    toLocation: string;
    packageWeight: number;
    totalOptions: number;
  };
}

@Injectable()
export class SyrianShippingService {
  private readonly logger = new Logger(SyrianShippingService.name);

  constructor(
    @InjectRepository(SyrianShippingCompanyEntity)
    private readonly shippingCompanyRepository: Repository<SyrianShippingCompanyEntity>,

    @InjectRepository(SyrianGovernorateEntity)
    private readonly governorateRepository: Repository<SyrianGovernorateEntity>,

    @InjectRepository(SyrianCityEntity)
    private readonly cityRepository: Repository<SyrianCityEntity>,

    @InjectRepository(SyrianAddressEntity)
    private readonly addressRepository: Repository<SyrianAddressEntity>,
  ) {
    this.initializeSyrianShippingCompanies();
  }

  /**
   * Initialize default Syrian shipping companies
   */
  private async initializeSyrianShippingCompanies(): Promise<void> {
    try {
      const existingCount = await this.shippingCompanyRepository.count();
      if (existingCount > 0) {
        this.logger.log('Syrian shipping companies already initialized');
        return;
      }

      const defaultCompanies = [
        {
          nameEn: 'Damascus Express Delivery',
          nameAr: 'شركة دمشق للتوصيل السريع',
          descriptionEn:
            'Fast and reliable delivery service across Damascus and surrounding areas',
          descriptionAr: 'خدمة توصيل سريعة وموثوقة في دمشق والمناطق المحيطة',
          companyType: SyrianShippingType.EXPRESS_DELIVERY,
          contactInfo: {
            phone: '+963-11-1234567',
            mobile: '+963-987-654321',
            whatsapp: '+963-987-654321',
            email: 'info@damascusexpress.sy',
            address: 'Damascus, Mazzeh District',
            addressAr: 'دمشق، حي المزة',
          },
          coverageAreas: [
            {
              governorateId: 1,
              governorateName: 'Damascus',
              governorateNameAr: 'دمشق',
              cities: [
                {
                  cityId: 1,
                  cityName: 'Damascus City',
                  cityNameAr: 'مدينة دمشق',
                  deliveryFee: 2000,
                  estimatedHours: 2,
                  isActive: true,
                },
              ],
              baseFee: 1500,
              isActive: true,
            },
          ],
          services: [
            {
              id: 'same_day',
              nameEn: 'Same Day Delivery',
              nameAr: 'التوصيل في نفس اليوم',
              description: 'Delivery within the same day',
              descriptionAr: 'التوصيل في نفس اليوم',
              baseCostSYP: 3000,
              costPerKmSYP: 500,
              estimatedDeliveryHours: 6,
              maxWeightKg: 10,
              isActive: true,
              workingHours: {
                start: '09:00',
                end: '18:00',
                days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
              },
            },
            {
              id: 'next_day',
              nameEn: 'Next Day Delivery',
              nameAr: 'التوصيل في اليوم التالي',
              description: 'Delivery by next business day',
              descriptionAr: 'التوصيل في يوم العمل التالي',
              baseCostSYP: 2000,
              costPerKmSYP: 300,
              estimatedDeliveryHours: 24,
              maxWeightKg: 25,
              isActive: true,
              workingHours: {
                start: '09:00',
                end: '18:00',
                days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
              },
            },
          ],
          pricing: {
            baseFee: 1500,
            perKmRate: 300,
            weightRates: [
              { maxKg: 5, rateSYP: 0 },
              { maxKg: 10, rateSYP: 500 },
              { maxKg: 20, rateSYP: 1500 },
            ],
            expressFee: 2000,
            weekendFee: 1000,
            codFee: 500,
            insuranceFee: 200,
            fuelSurcharge: 300,
          },
          schedule: {
            workingDays: [
              'sunday',
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
            ],
            workingHours: { start: '09:00', end: '18:00' },
            breakTime: { start: '13:00', end: '14:00' },
            weekendService: true,
            holidayService: false,
            emergencyService: true,
            timeZone: 'Asia/Damascus',
          },
          performanceMetrics: {
            deliverySuccessRate: 96.5,
            averageDeliveryTime: 4.2,
            customerRating: 4.7,
            totalDeliveries: 15420,
            onTimeDeliveries: 14890,
            lastUpdated: new Date(),
            monthlyStats: [],
          },
          capabilities: {
            codSupported: true,
            signatureRequired: true,
            photoProofAvailable: true,
            trackingAvailable: true,
            smsNotifications: true,
            whatsappNotifications: true,
            specialHandling: ['fragile', 'electronics', 'documents'],
            vehicleTypes: ['motorcycle', 'car', 'van'],
            maxWeight: 50,
            maxDimensions: { length: 100, width: 80, height: 60 },
          },
          companyStatus: {
            isVerified: true,
            verificationDate: new Date('2025-01-15'),
            licenseNumber: 'SY-SHIP-2025-001',
            insuranceValid: true,
            contractStatus: 'active',
            paymentTerms: 'monthly',
            commission: 8.5,
          },
          isActive: true,
          displayPriority: 10,
        },
        {
          nameEn: 'Aleppo Speed Courier',
          nameAr: 'ساعي حلب السريع',
          descriptionEn:
            'Specialized courier service for Aleppo and northern Syria',
          descriptionAr: 'خدمة توصيل متخصصة لحلب وشمال سوريا',
          companyType: SyrianShippingType.LOCAL_COURIER,
          contactInfo: {
            phone: '+963-21-2345678',
            mobile: '+963-988-765432',
            whatsapp: '+963-988-765432',
            email: 'info@aleppospeed.sy',
            address: 'Aleppo, Al-Aziziyah District',
            addressAr: 'حلب، حي العزيزية',
          },
          coverageAreas: [
            {
              governorateId: 2,
              governorateName: 'Aleppo',
              governorateNameAr: 'حلب',
              cities: [
                {
                  cityId: 2,
                  cityName: 'Aleppo City',
                  cityNameAr: 'مدينة حلب',
                  deliveryFee: 1800,
                  estimatedHours: 3,
                  isActive: true,
                },
              ],
              baseFee: 1200,
              isActive: true,
            },
          ],
          services: [
            {
              id: 'standard',
              nameEn: 'Standard Delivery',
              nameAr: 'التوصيل العادي',
              description: 'Standard delivery within 1-2 days',
              descriptionAr: 'التوصيل العادي خلال 1-2 أيام',
              baseCostSYP: 1500,
              costPerKmSYP: 250,
              estimatedDeliveryHours: 48,
              maxWeightKg: 20,
              isActive: true,
              workingHours: {
                start: '08:00',
                end: '17:00',
                days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
              },
            },
          ],
          pricing: {
            baseFee: 1200,
            perKmRate: 250,
            weightRates: [
              { maxKg: 5, rateSYP: 0 },
              { maxKg: 15, rateSYP: 700 },
              { maxKg: 30, rateSYP: 1800 },
            ],
            expressFee: 1500,
            weekendFee: 800,
            codFee: 400,
            insuranceFee: 150,
            fuelSurcharge: 250,
          },
          schedule: {
            workingDays: [
              'sunday',
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
            ],
            workingHours: { start: '08:00', end: '17:00' },
            weekendService: true,
            holidayService: false,
            emergencyService: false,
            timeZone: 'Asia/Damascus',
          },
          performanceMetrics: {
            deliverySuccessRate: 94.2,
            averageDeliveryTime: 6.8,
            customerRating: 4.3,
            totalDeliveries: 8930,
            onTimeDeliveries: 8410,
            lastUpdated: new Date(),
            monthlyStats: [],
          },
          capabilities: {
            codSupported: true,
            signatureRequired: false,
            photoProofAvailable: true,
            trackingAvailable: false,
            smsNotifications: true,
            whatsappNotifications: true,
            specialHandling: ['documents'],
            vehicleTypes: ['motorcycle', 'car'],
            maxWeight: 30,
            maxDimensions: { length: 80, width: 60, height: 50 },
          },
          companyStatus: {
            isVerified: true,
            verificationDate: new Date('2025-02-01'),
            licenseNumber: 'SY-SHIP-2025-002',
            insuranceValid: true,
            contractStatus: 'active',
            paymentTerms: 'monthly',
            commission: 9.0,
          },
          isActive: true,
          displayPriority: 20,
        },
      ];

      for (const companyData of defaultCompanies) {
        const company = this.shippingCompanyRepository.create(companyData);
        await this.shippingCompanyRepository.save(company);
      }

      this.logger.log(
        `Initialized ${defaultCompanies.length} Syrian shipping companies`,
      );
    } catch (error: unknown) {
      this.logger.error(
        'Failed to initialize Syrian shipping companies',
        (error as Error).stack,
      );
    }
  }

  /**
   * Get all active Syrian shipping companies
   */
  async getAllActiveCompanies(): Promise<SyrianShippingCompanyEntity[]> {
    return this.shippingCompanyRepository.find({
      where: { isActive: true },
      order: { displayPriority: 'ASC', nameEn: 'ASC' },
    });
  }

  /**
   * Get shipping companies by governorate
   */
  async getCompaniesByGovernorate(
    governorateId: number,
  ): Promise<SyrianShippingCompanyEntity[]> {
    const companies = await this.shippingCompanyRepository.find({
      where: { isActive: true },
      order: { displayPriority: 'ASC' },
    });

    return companies.filter((company) =>
      company.coverageAreas.some(
        (area) => area.governorateId === governorateId && area.isActive,
      ),
    );
  }

  /**
   * Calculate shipping costs and get quotes
   */
  async calculateShippingCosts(
    calculationDto: ShippingCostCalculationDto,
  ): Promise<ShippingCompanySelection> {
    const { fromAddress, toAddress, packageDetails, deliveryOptions } =
      calculationDto;

    // Get available companies for destination
    const availableCompanies = await this.getCompaniesByGovernorate(
      toAddress.governorateId,
    );

    if (availableCompanies.length === 0) {
      throw new NotFoundException(
        `No shipping companies available for governorate ${toAddress.governorateId}`,
      );
    }

    // Calculate distance (simplified - in real world, use mapping API)
    const estimatedDistance = await this.calculateDistance(
      fromAddress,
      toAddress,
    );

    const quotes: ShippingQuote[] = [];

    for (const company of availableCompanies) {
      for (const service of company.services.filter((s) => s.isActive)) {
        // Check if service can handle the package
        if (packageDetails.weightKg > service.maxWeightKg) {
          continue;
        }

        // Find coverage area for destination
        const coverageArea = company.coverageAreas.find(
          (area) =>
            area.governorateId === toAddress.governorateId && area.isActive,
        );

        if (!coverageArea) continue;

        const cityInfo = coverageArea.cities.find(
          (city) => city.cityId === toAddress.cityId && city.isActive,
        );

        if (!cityInfo) continue;

        // Calculate costs
        const breakdown = this.calculateCostBreakdown(
          company,
          service,
          estimatedDistance,
          packageDetails,
          deliveryOptions,
          coverageArea,
          cityInfo,
        );

        const totalCostSYP = Object.values(breakdown).reduce(
          (sum, cost) => sum + (cost || 0),
          0,
        );

        // Calculate delivery time
        const deliveryTime = this.calculateDeliveryTime(
          service,
          estimatedDistance,
          deliveryOptions,
          company.schedule,
        );

        const quote: ShippingQuote = {
          company,
          service,
          totalCostSYP: Math.round(totalCostSYP),
          breakdown,
          estimatedDeliveryTime: deliveryTime,
          trackingAvailable: company.capabilities.trackingAvailable,
          requiresPickup: false, // Simplified
        };

        quotes.push(quote);
      }
    }

    if (quotes.length === 0) {
      throw new NotFoundException(
        'No suitable shipping options found for this delivery',
      );
    }

    // Sort and select best options
    const sortedByPrice = [...quotes].sort(
      (a, b) => a.totalCostSYP - b.totalCostSYP,
    );
    const sortedBySpeed = [...quotes].sort(
      (a, b) => a.estimatedDeliveryTime.hours - b.estimatedDeliveryTime.hours,
    );
    const sortedByRating = [...quotes].sort(
      (a, b) =>
        b.company.performanceMetrics.customerRating -
        a.company.performanceMetrics.customerRating,
    );

    return {
      availableCompanies: quotes,
      recommendedCompany: sortedByRating[0],
      cheapestOption: sortedByPrice[0],
      fastestOption: sortedBySpeed[0],
      metadata: {
        searchDate: new Date(),
        fromLocation: `Governorate ${fromAddress.governorateId}`,
        toLocation: `Governorate ${toAddress.governorateId}`,
        packageWeight: packageDetails.weightKg,
        totalOptions: quotes.length,
      },
    };
  }

  /**
   * Get shipping company by ID
   */
  async getCompanyById(id: number): Promise<SyrianShippingCompanyEntity> {
    const company = await this.shippingCompanyRepository.findOne({
      where: { id, isActive: true },
    });

    if (!company) {
      throw new NotFoundException(`Shipping company ${id} not found`);
    }

    return company;
  }

  /**
   * Create new shipping company
   */
  async createShippingCompany(
    createDto: CreateSyrianShippingCompanyDto,
  ): Promise<SyrianShippingCompanyEntity> {
    // Validate required fields
    if (!createDto.nameEn || !createDto.nameAr) {
      throw new BadRequestException(
        'Company name in both English and Arabic is required',
      );
    }

    // Set default performance metrics
    const defaultMetrics = {
      deliverySuccessRate: 0,
      averageDeliveryTime: 0,
      customerRating: 0,
      totalDeliveries: 0,
      onTimeDeliveries: 0,
      lastUpdated: new Date(),
      monthlyStats: [],
    };

    const company = this.shippingCompanyRepository.create({
      ...createDto,
      performanceMetrics: defaultMetrics,
      isActive: true,
      displayPriority: 100,
    });

    const savedCompany = await this.shippingCompanyRepository.save(company);
    this.logger.log(
      `Created new Syrian shipping company: ${savedCompany.nameEn}`,
    );

    return savedCompany;
  }

  /**
   * Update shipping company performance metrics
   */
  async updatePerformanceMetrics(
    companyId: number,
    deliveryResult: {
      wasSuccessful: boolean;
      wasOnTime: boolean;
      actualDeliveryTime: number; // hours
      customerRating?: number;
    },
  ): Promise<void> {
    const company = await this.getCompanyById(companyId);
    const metrics = company.performanceMetrics;

    // Update counters
    metrics.totalDeliveries += 1;
    if (deliveryResult.wasSuccessful) {
      if (deliveryResult.wasOnTime) {
        metrics.onTimeDeliveries += 1;
      }
    }

    // Calculate new success rate
    metrics.deliverySuccessRate =
      (metrics.onTimeDeliveries / metrics.totalDeliveries) * 100;

    // Update average delivery time
    metrics.averageDeliveryTime =
      (metrics.averageDeliveryTime * (metrics.totalDeliveries - 1) +
        deliveryResult.actualDeliveryTime) /
      metrics.totalDeliveries;

    // Update customer rating if provided
    if (deliveryResult.customerRating) {
      metrics.customerRating =
        (metrics.customerRating * (metrics.totalDeliveries - 1) +
          deliveryResult.customerRating) /
        metrics.totalDeliveries;
    }

    metrics.lastUpdated = new Date();

    await this.shippingCompanyRepository.update(companyId, {
      performanceMetrics: metrics,
    });

    this.logger.log(`Updated performance metrics for company ${companyId}`);
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private async calculateDistance(
    fromAddress: any,
    toAddress: any,
  ): Promise<number> {
    // Simplified distance calculation
    // In real implementation, use Google Maps API or similar

    if (fromAddress.governorateId === toAddress.governorateId) {
      if (fromAddress.cityId === toAddress.cityId) {
        return 5; // Same city - 5km average
      }
      return 25; // Same governorate - 25km average
    }

    // Different governorates - estimate based on governorate pairs
    const governorateDistances = {
      '1-2': 350, // Damascus to Aleppo
      '1-3': 165, // Damascus to Homs
      '1-4': 210, // Damascus to Hama
      '2-3': 180, // Aleppo to Homs
      '2-4': 120, // Aleppo to Hama
      '3-4': 45, // Homs to Hama
    };

    const key = [fromAddress.governorateId, toAddress.governorateId]
      .sort()
      .join('-');
    return governorateDistances[key] || 200; // Default 200km
  }

  private calculateCostBreakdown(
    company: SyrianShippingCompanyEntity,
    service: DeliveryService,
    distance: number,
    packageDetails: any,
    deliveryOptions: any,
    coverageArea: any,
    cityInfo: any,
  ): ShippingQuote['breakdown'] {
    const pricing = company.pricing;

    // Base fees
    const baseFee = coverageArea.baseFee || pricing.baseFee;
    const distanceFee = distance * pricing.perKmRate;

    // Weight-based pricing
    let weightFee = 0;
    const applicableWeightRate = pricing.weightRates.find(
      (rate) => packageDetails.weightKg <= rate.maxKg,
    );
    if (applicableWeightRate) {
      weightFee = applicableWeightRate.rateSYP;
    }

    // Additional fees
    const expressFee = deliveryOptions.isExpress ? pricing.expressFee : 0;
    const weekendFee = deliveryOptions.isWeekend ? pricing.weekendFee : 0;
    const codFee = packageDetails.codAmount ? pricing.codFee : 0;

    // Insurance fee (per 100,000 SYP of value)
    const insuranceFee =
      Math.ceil(packageDetails.value / 100000) * (pricing.insuranceFee || 0);

    const fuelSurcharge = pricing.fuelSurcharge || 0;

    return {
      baseFee,
      distanceFee,
      weightFee,
      expressFee,
      weekendFee,
      codFee,
      insuranceFee,
      fuelSurcharge,
    };
  }

  private calculateDeliveryTime(
    service: DeliveryService,
    distance: number,
    deliveryOptions: any,
    schedule: any,
  ): ShippingQuote['estimatedDeliveryTime'] {
    let baseHours = service.estimatedDeliveryHours;

    // Add time for long distances
    if (distance > 100) {
      baseHours += Math.ceil(distance / 100) * 2;
    }

    // Express delivery reduces time
    if (deliveryOptions.isExpress) {
      baseHours = Math.max(2, baseHours * 0.5);
    }

    // Weekend delivery might add time if not working weekends
    if (deliveryOptions.isWeekend && !schedule.weekendService) {
      baseHours += 48; // Add 2 days if no weekend service
    }

    const deliveryDate = new Date();
    deliveryDate.setHours(deliveryDate.getHours() + baseHours);

    return {
      hours: baseHours,
      deliveryDate,
      businessDaysOnly: !schedule.weekendService,
    };
  }
}
