/**
 * @file address.seeder.service.ts
 * @description Comprehensive Address Seeder Service for SouqSyria Platform
 * Seeds Syrian governorates, cities, districts, and sample addresses
 *
 * Features:
 * - Complete Syrian geographic data seeding
 * - Bilingual support (Arabic/English)
 * - Logistics and infrastructure metadata
 * - Sample addresses for testing and development
 * - Data validation and integrity checks
 * - Performance optimization and bulk operations
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyrianGovernorateEntity } from '../entities/syrian-governorate.entity';
import { SyrianCityEntity } from '../entities/syrian-city.entity';
import { SyrianDistrictEntity } from '../entities/syrian-district.entity';
import { SyrianAddressEntity } from '../entities/syrian-address-main.entity';
import { Address } from '../entities/address.entity';
import { User } from '../../users/entities/user.entity';
import { Country } from '../country/entities/country.entity';
import { Region } from '../region/entities/region.entity';
import { City } from '../city/entities/city.entity';
import { SYRIAN_GOVERNORATES_SEEDS } from './syrian-governorates.seed';
import { SYRIAN_CITIES_SEEDS } from './syrian-cities.seed';
import { SAMPLE_ADDRESSES_SEEDS } from './sample-addresses.seed';

export interface AddressSeedingOptions {
  seedGovernorates?: boolean;
  seedCities?: boolean;
  seedDistricts?: boolean;
  seedSampleAddresses?: boolean;
  createTestUsers?: boolean;
  overwriteExisting?: boolean;
  logLevel?: 'debug' | 'info' | 'warn';
  batchSize?: number;
}

export interface AddressSeedingStats {
  governoratesCreated: number;
  governoratesUpdated: number;
  citiesCreated: number;
  citiesUpdated: number;
  districtsCreated: number;
  districtsUpdated: number;
  addressesCreated: number;
  addressesUpdated: number;
  testUsersCreated: number;
  totalProcessingTime: number;
  errors: string[];
}

@Injectable()
export class AddressSeederService {
  private readonly logger = new Logger(AddressSeederService.name);

  constructor(
    @InjectRepository(SyrianGovernorateEntity)
    private readonly governorateRepository: Repository<SyrianGovernorateEntity>,
    @InjectRepository(SyrianCityEntity)
    private readonly cityRepository: Repository<SyrianCityEntity>,
    @InjectRepository(SyrianDistrictEntity)
    private readonly districtRepository: Repository<SyrianDistrictEntity>,
    @InjectRepository(SyrianAddressEntity)
    private readonly syrianAddressRepository: Repository<SyrianAddressEntity>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
    @InjectRepository(City)
    private readonly cityLegacyRepository: Repository<City>,
  ) {}

  /**
   * Main seeding method that orchestrates the entire address seeding process
   */
  async seedCompleteAddressSystem(
    options: AddressSeedingOptions = {},
  ): Promise<AddressSeedingStats> {
    this.logger.log('🏠 Starting Complete Address System Seeding...');
    const startTime = Date.now();

    const defaultOptions: AddressSeedingOptions = {
      seedGovernorates: true,
      seedCities: true,
      seedDistricts: false, // Will be implemented later
      seedSampleAddresses: true,
      createTestUsers: true,
      overwriteExisting: false,
      logLevel: 'info',
      batchSize: 50,
      ...options,
    };

    const stats: AddressSeedingStats = {
      governoratesCreated: 0,
      governoratesUpdated: 0,
      citiesCreated: 0,
      citiesUpdated: 0,
      districtsCreated: 0,
      districtsUpdated: 0,
      addressesCreated: 0,
      addressesUpdated: 0,
      testUsersCreated: 0,
      totalProcessingTime: 0,
      errors: [],
    };

    try {
      // Step 1: Ensure Syria country exists
      await this.ensureSyriaCountryExists();

      // Step 2: Seed governorates
      if (defaultOptions.seedGovernorates) {
        const governorateStats = await this.seedGovernorates(defaultOptions);
        stats.governoratesCreated = governorateStats.created;
        stats.governoratesUpdated = governorateStats.updated;
      }

      // Step 3: Seed cities
      if (defaultOptions.seedCities) {
        const cityStats = await this.seedCities(defaultOptions);
        stats.citiesCreated = cityStats.created;
        stats.citiesUpdated = cityStats.updated;
      }

      // Step 4: Seed districts (placeholder for future implementation)
      if (defaultOptions.seedDistricts) {
        this.logger.warn('District seeding not yet implemented - skipping');
      }

      // Step 5: Create test users if needed
      if (defaultOptions.createTestUsers) {
        stats.testUsersCreated = await this.createTestUsers(defaultOptions);
      }

      // Step 6: Seed sample addresses
      if (defaultOptions.seedSampleAddresses) {
        const addressStats = await this.seedSampleAddresses(defaultOptions);
        stats.addressesCreated = addressStats.created;
        stats.addressesUpdated = addressStats.updated;
      }

      stats.totalProcessingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Address System Seeding completed successfully in ${stats.totalProcessingTime}ms`,
      );
      this.logSeedingStats(stats);

      return stats;
    } catch (error: unknown) {
      stats.errors.push(`Address System Seeding failed: ${(error as Error).message}`);
      this.logger.error(
        `❌ Address System Seeding failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new Error(`Address System Seeding failed: ${(error as Error).message}`);
    }
  }

  /**
   * Seeds all Syrian governorates
   */
  private async seedGovernorates(
    options: AddressSeedingOptions,
  ): Promise<{ created: number; updated: number }> {
    this.logger.log(
      `🏛️ Seeding ${SYRIAN_GOVERNORATES_SEEDS.length} Syrian governorates...`,
    );

    let created = 0;
    let updated = 0;

    for (const governorateData of SYRIAN_GOVERNORATES_SEEDS) {
      try {
        const existingGovernorate = await this.governorateRepository.findOne({
          where: { code: governorateData.code },
        });

        if (existingGovernorate) {
          if (options.overwriteExisting) {
            await this.governorateRepository.update(existingGovernorate.id, {
              nameEn: governorateData.nameEn,
              nameAr: governorateData.nameAr,
              capitalEn: governorateData.capitalEn,
              capitalAr: governorateData.capitalAr,
              latitude: governorateData.latitude,
              longitude: governorateData.longitude,
              population: governorateData.population,
              areaKm2: governorateData.areaKm2,
              status: governorateData.status,
              demographics: governorateData.demographics,
              displayOrder: governorateData.displayOrder,
              isActive: governorateData.isActive,
            });
            updated++;
            if (options.logLevel === 'debug') {
              this.logger.debug(
                `Updated governorate: ${governorateData.nameEn}`,
              );
            }
          }
        } else {
          const governorate = this.governorateRepository.create({
            code: governorateData.code,
            nameEn: governorateData.nameEn,
            nameAr: governorateData.nameAr,
            capitalEn: governorateData.capitalEn,
            capitalAr: governorateData.capitalAr,
            latitude: governorateData.latitude,
            longitude: governorateData.longitude,
            population: governorateData.population,
            areaKm2: governorateData.areaKm2,
            status: governorateData.status,
            demographics: governorateData.demographics,
            displayOrder: governorateData.displayOrder,
            isActive: governorateData.isActive,
          });

          await this.governorateRepository.save(governorate);
          created++;
          if (options.logLevel === 'debug') {
            this.logger.debug(`Created governorate: ${governorateData.nameEn}`);
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to process governorate ${governorateData.nameEn}: ${(error as Error).message}`,
        );
        throw error;
      }
    }

    this.logger.log(`📊 Governorates: ${created} created, ${updated} updated`);
    return { created, updated };
  }

  /**
   * Seeds Syrian cities
   */
  private async seedCities(
    options: AddressSeedingOptions,
  ): Promise<{ created: number; updated: number }> {
    this.logger.log(
      `🏘️ Seeding ${SYRIAN_CITIES_SEEDS.length} Syrian cities...`,
    );

    let created = 0;
    let updated = 0;

    for (const cityData of SYRIAN_CITIES_SEEDS) {
      try {
        // Find the governorate for this city
        const governorate = await this.governorateRepository.findOne({
          where: { code: cityData.governorateCode },
        });

        if (!governorate) {
          this.logger.warn(
            `Governorate ${cityData.governorateCode} not found for city ${cityData.nameEn}`,
          );
          continue;
        }

        const existingCity = await this.cityRepository.findOne({
          where: {
            nameEn: cityData.nameEn,
            governorate: { id: governorate.id },
          },
        });

        if (existingCity) {
          if (options.overwriteExisting) {
            await this.cityRepository.update(existingCity.id, {
              nameAr: cityData.nameAr,
              alternativeNames: cityData.alternativeNames,
              cityType: cityData.cityType,
              latitude: cityData.latitude,
              longitude: cityData.longitude,
              postalCodePrefix: cityData.postalCodePrefix,
              population: cityData.population,
              logistics: cityData.logistics,
              infrastructure: cityData.infrastructure,
              displayOrder: cityData.displayOrder,
              isActive: cityData.isActive,
            });
            updated++;
            if (options.logLevel === 'debug') {
              this.logger.debug(`Updated city: ${cityData.nameEn}`);
            }
          }
        } else {
          const city = this.cityRepository.create({
            governorate,
            nameEn: cityData.nameEn,
            nameAr: cityData.nameAr,
            alternativeNames: cityData.alternativeNames,
            cityType: cityData.cityType,
            latitude: cityData.latitude,
            longitude: cityData.longitude,
            postalCodePrefix: cityData.postalCodePrefix,
            population: cityData.population,
            logistics: cityData.logistics,
            infrastructure: cityData.infrastructure,
            displayOrder: cityData.displayOrder,
            isActive: cityData.isActive,
          });

          await this.cityRepository.save(city);
          created++;
          if (options.logLevel === 'debug') {
            this.logger.debug(`Created city: ${cityData.nameEn}`);
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to process city ${cityData.nameEn}: ${(error as Error).message}`,
        );
        throw error;
      }
    }

    this.logger.log(`📊 Cities: ${created} created, ${updated} updated`);
    return { created, updated };
  }

  /**
   * Creates test users for sample addresses
   */
  private async createTestUsers(
    options: AddressSeedingOptions,
  ): Promise<number> {
    this.logger.log('👤 Creating test users for sample addresses...');

    const testUsers = [
      {
        email: 'damascus.user@souqsyria.com',
        fullName: 'Ahmad Al-Dimashqi',
        firebaseUid: 'test-damascus-user-001',
        phone: '+963-11-123-4567',
        isVerified: true,
      },
      {
        email: 'aleppo.user@souqsyria.com',
        fullName: 'Fatima Al-Halabiya',
        firebaseUid: 'test-aleppo-user-002',
        phone: '+963-21-234-5678',
        isVerified: true,
      },
      {
        email: 'homs.merchant@souqsyria.com',
        fullName: 'Yusuf Al-Homsi',
        firebaseUid: 'test-homs-merchant-003',
        phone: '+963-31-345-6789',
        isVerified: true,
      },
      {
        email: 'coastal.business@souqsyria.com',
        fullName: 'Layla Al-Sahiliya',
        firebaseUid: 'test-coastal-business-004',
        phone: '+963-41-456-7890',
        isVerified: true,
      },
      {
        email: 'eastern.trader@souqsyria.com',
        fullName: 'Omar Al-Firati',
        firebaseUid: 'test-eastern-trader-005',
        phone: '+963-51-567-8901',
        isVerified: true,
      },
    ];

    let created = 0;

    for (const userData of testUsers) {
      try {
        const existingUser = await this.userRepository.findOne({
          where: { email: userData.email },
        });

        if (!existingUser) {
          const user = this.userRepository.create(userData);
          await this.userRepository.save(user);
          created++;
          if (options.logLevel === 'debug') {
            this.logger.debug(`Created test user: ${userData.email}`);
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to create test user ${userData.email}: ${(error as Error).message}`,
        );
        throw error;
      }
    }

    this.logger.log(`📊 Test users: ${created} created`);
    return created;
  }

  /**
   * Seeds sample addresses
   */
  private async seedSampleAddresses(
    options: AddressSeedingOptions,
  ): Promise<{ created: number; updated: number }> {
    this.logger.log(
      `🏠 Seeding ${SAMPLE_ADDRESSES_SEEDS.length} sample addresses...`,
    );

    let created = 0;
    let updated = 0;

    // Get test users
    const testUsers = await this.userRepository.find({
      where: [
        { email: 'damascus.user@souqsyria.com' },
        { email: 'aleppo.user@souqsyria.com' },
        { email: 'homs.merchant@souqsyria.com' },
        { email: 'coastal.business@souqsyria.com' },
        { email: 'eastern.trader@souqsyria.com' },
      ],
    });

    if (testUsers.length === 0) {
      this.logger.warn(
        'No test users found - sample addresses will be skipped',
      );
      return { created: 0, updated: 0 };
    }

    // Get Syria country
    const syriaCountry = await this.countryRepository.findOne({
      where: { code: 'SY' },
    });

    if (!syriaCountry) {
      this.logger.error(
        'Syria country not found - cannot create sample addresses',
      );
      throw new Error('Syria country not found');
    }

    for (const addressData of SAMPLE_ADDRESSES_SEEDS) {
      try {
        // Assign user based on governorate
        let assignedUser = testUsers[0]; // Default to first user

        switch (addressData.governorateCode) {
          case 'DMS':
          case 'RIF':
            assignedUser =
              testUsers.find((u) => u.email.includes('damascus')) ||
              testUsers[0];
            break;
          case 'ALP':
            assignedUser =
              testUsers.find((u) => u.email.includes('aleppo')) || testUsers[1];
            break;
          case 'HMS':
          case 'HAM':
            assignedUser =
              testUsers.find((u) => u.email.includes('homs')) || testUsers[2];
            break;
          case 'LAT':
          case 'TAR':
            assignedUser =
              testUsers.find((u) => u.email.includes('coastal')) ||
              testUsers[3];
            break;
          case 'DER':
          case 'HAS':
            assignedUser =
              testUsers.find((u) => u.email.includes('eastern')) ||
              testUsers[4];
            break;
          default:
            assignedUser =
              testUsers[Math.floor(Math.random() * testUsers.length)];
        }

        // Find matching governorate
        const governorate = await this.governorateRepository.findOne({
          where: { code: addressData.governorateCode },
        });

        if (!governorate) {
          this.logger.warn(
            `Governorate ${addressData.governorateCode} not found for address`,
          );
          continue;
        }

        // Create legacy region and city for compatibility
        let region = await this.regionRepository.findOne({
          where: { name: governorate.nameEn, country: { id: syriaCountry.id } },
        });

        if (!region) {
          region = this.regionRepository.create({
            name: governorate.nameEn,
            country: syriaCountry,
          });
          await this.regionRepository.save(region);
        }

        let city = await this.cityLegacyRepository.findOne({
          where: { name: addressData.cityName, region: { id: region.id } },
        });

        if (!city) {
          city = this.cityLegacyRepository.create({
            name: addressData.cityName,
            region: region,
          });
          await this.cityLegacyRepository.save(city);
        }

        // Check if address already exists
        const existingAddress = await this.addressRepository.findOne({
          where: {
            user: { id: assignedUser.id },
            addressLine1: addressData.addressLine1,
          },
        });

        if (existingAddress) {
          if (options.overwriteExisting) {
            await this.addressRepository.update(existingAddress.id, {
              label: addressData.label,
              addressType: addressData.addressType,
              addressLine2: addressData.addressLine2,
              postalCode: addressData.postalCode,
              phone: addressData.phone,
              notes: addressData.notes,
              isDefault: addressData.isDefault,
              latitude: addressData.latitude,
              longitude: addressData.longitude,
            });
            updated++;
            if (options.logLevel === 'debug') {
              this.logger.debug(`Updated address: ${addressData.label}`);
            }
          }
        } else {
          const address = this.addressRepository.create({
            user: assignedUser,
            label: addressData.label,
            addressType: addressData.addressType,
            country: syriaCountry,
            region: region,
            city: city,
            addressLine1: addressData.addressLine1,
            addressLine2: addressData.addressLine2,
            postalCode: addressData.postalCode,
            phone: addressData.phone,
            notes: addressData.notes,
            isDefault: addressData.isDefault,
            latitude: addressData.latitude,
            longitude: addressData.longitude,
          });

          await this.addressRepository.save(address);
          created++;
          if (options.logLevel === 'debug') {
            this.logger.debug(`Created address: ${addressData.label}`);
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to process address ${addressData.label}: ${(error as Error).message}`,
        );
        // Continue with other addresses instead of throwing
      }
    }

    this.logger.log(
      `📊 Sample addresses: ${created} created, ${updated} updated`,
    );
    return { created, updated };
  }

  /**
   * Ensures Syria country exists in the database
   */
  private async ensureSyriaCountryExists(): Promise<void> {
    const syriaCountry = await this.countryRepository.findOne({
      where: { code: 'SY' },
    });

    if (!syriaCountry) {
      const syria = this.countryRepository.create({
        name: 'Syria',
        code: 'SY',
      });
      await this.countryRepository.save(syria);
      this.logger.log('Created Syria country entry');
    }
  }

  /**
   * Gets comprehensive seeding statistics
   */
  async getAddressSeedingStats(): Promise<any> {
    const stats = {
      governorates: {
        total: await this.governorateRepository.count(),
        active: await this.governorateRepository.count({
          where: { isActive: true },
        }),
        deliveryEnabled: await this.governorateRepository.count({
          where: { status: { deliverySupported: true } as any },
        }),
      },
      cities: {
        total: await this.cityRepository.count(),
        active: await this.cityRepository.count({ where: { isActive: true } }),
        major: await this.cityRepository.count({
          where: { population: { $gte: 100000 } as any },
        }),
      },
      addresses: {
        total: await this.addressRepository.count(),
        shipping: await this.addressRepository.count({
          where: { addressType: 'shipping' },
        }),
        billing: await this.addressRepository.count({
          where: { addressType: 'billing' },
        }),
        withCoordinates: await this.addressRepository.count({
          where: {
            latitude: { $ne: null } as any,
            longitude: { $ne: null } as any,
          },
        }),
      },
      users: {
        total: await this.userRepository.count(),
        testUsers: await this.userRepository.count({
          where: { email: { $like: '%@souqsyria.com' } as any },
        }),
      },
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `📊 Current Address System Stats: ${JSON.stringify(stats, null, 2)}`,
    );
    return stats;
  }

  /**
   * Validates the address system integrity
   */
  async validateAddressSystemIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check for governorates without cities
      const governoratesWithoutCities = await this.governorateRepository
        .createQueryBuilder('gov')
        .leftJoin('gov.cities', 'city')
        .where('city.id IS NULL')
        .getMany();

      if (governoratesWithoutCities.length > 0) {
        issues.push(
          `Found ${governoratesWithoutCities.length} governorates without cities: ${governoratesWithoutCities.map((g) => g.nameEn).join(', ')}`,
        );
      }

      // Check for inactive cities in active governorates
      const inactiveCitiesInActiveGov = await this.cityRepository
        .createQueryBuilder('city')
        .innerJoin('city.governorate', 'gov')
        .where('city.isActive = false AND gov.isActive = true')
        .getCount();

      if (inactiveCitiesInActiveGov > 0) {
        issues.push(
          `Found ${inactiveCitiesInActiveGov} inactive cities in active governorates`,
        );
      }

      // Check for addresses without coordinates
      const addressesWithoutCoordinates = await this.addressRepository.count({
        where: { latitude: null, longitude: null },
      });

      if (addressesWithoutCoordinates > 0) {
        issues.push(
          `Found ${addressesWithoutCoordinates} addresses without geographic coordinates`,
        );
      }

      // Check for duplicate postal codes
      const duplicatePostalCodes = await this.cityRepository
        .createQueryBuilder('city')
        .select('city.postalCodePrefix')
        .addSelect('COUNT(*)', 'count')
        .where('city.postalCodePrefix IS NOT NULL')
        .groupBy('city.postalCodePrefix')
        .having('COUNT(*) > 1')
        .getRawMany();

      if (duplicatePostalCodes.length > 0) {
        issues.push(
          `Found ${duplicatePostalCodes.length} duplicate postal code prefixes`,
        );
      }

      const valid = issues.length === 0;

      if (valid) {
        this.logger.log('✅ Address system integrity validation passed');
      } else {
        this.logger.warn(
          `⚠️ Address system integrity issues found: ${issues.length}`,
        );
        issues.forEach((issue) => this.logger.warn(`  - ${issue}`));
      }

      return { valid, issues };
    } catch (error: unknown) {
      this.logger.error('❌ Address system validation failed:', (error as Error).stack);
      return {
        valid: false,
        issues: [`Validation failed due to error: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Cleans up all address data (DESTRUCTIVE)
   */
  async cleanupAddressData(): Promise<void> {
    this.logger.warn('🧹 Cleaning up address data... This is destructive!');

    try {
      // Remove in dependency order
      await this.addressRepository.delete({});
      this.logger.log('Removed all addresses');

      await this.cityLegacyRepository.delete({});
      this.logger.log('Removed all legacy cities');

      await this.regionRepository.delete({});
      this.logger.log('Removed all regions');

      await this.cityRepository.delete({});
      this.logger.log('Removed all Syrian cities');

      await this.governorateRepository.delete({});
      this.logger.log('Removed all Syrian governorates');

      // Remove test users
      await this.userRepository.delete({
        email: { $like: '%@souqsyria.com' } as any,
      });
      this.logger.log('Removed test users');

      this.logger.log('✅ Address data cleanup completed');
    } catch (error: unknown) {
      this.logger.error('❌ Address data cleanup failed:', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Logs comprehensive seeding statistics
   */
  private logSeedingStats(stats: AddressSeedingStats): void {
    this.logger.log('📊 Address System Seeding Summary:');
    this.logger.log(
      `   └── Governorates: ${stats.governoratesCreated} created, ${stats.governoratesUpdated} updated`,
    );
    this.logger.log(
      `   └── Cities: ${stats.citiesCreated} created, ${stats.citiesUpdated} updated`,
    );
    this.logger.log(
      `   └── Districts: ${stats.districtsCreated} created, ${stats.districtsUpdated} updated`,
    );
    this.logger.log(
      `   └── Addresses: ${stats.addressesCreated} created, ${stats.addressesUpdated} updated`,
    );
    this.logger.log(`   └── Test Users: ${stats.testUsersCreated} created`);
    this.logger.log(`   └── Total time: ${stats.totalProcessingTime}ms`);

    if (stats.errors.length > 0) {
      this.logger.warn(`   └── Errors: ${stats.errors.length}`);
      stats.errors.forEach((error) => this.logger.warn(`       - ${error}`));
    }
  }
}
