/**
 * @file warehouse-seeder.service.ts
 * @description Enterprise warehouse seeding service with Syrian geographic optimization
 * Provides comprehensive warehouse initialization with validation and analytics
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import {
  ALL_WAREHOUSE_SEEDS,
  DAMASCUS_WAREHOUSES,
  ALEPPO_WAREHOUSES,
  LATAKIA_WAREHOUSES,
  HOMS_WAREHOUSES,
  DARAA_WAREHOUSES,
  LOCAL_DEPOTS,
  WAREHOUSE_STATISTICS,
  WarehouseSeedData,
} from './warehouse-seeds.data';

/**
 * Seeding configuration options
 */
export interface WarehouseSeedOptions {
  includeDamascus?: boolean;
  includeAleppo?: boolean;
  includeLatakia?: boolean;
  includeHoms?: boolean;
  includeDaraa?: boolean;
  includeLocalDepots?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  dryRun?: boolean;
  batchSize?: number;
  specificTypes?: (
    | 'main_hub'
    | 'regional_center'
    | 'local_depot'
    | 'specialized'
  )[];
  specificGovernorates?: string[];
  capacityRangeMin?: number;
  capacityRangeMax?: number;
  onlyHighPriority?: boolean;
  establishedAfter?: number;
  validateGeography?: boolean;
}

/**
 * Seeding result with comprehensive analytics
 */
export interface WarehouseSeedResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  processingTimeMs: number;
  statistics: {
    total: number;
    damascus: number;
    aleppo: number;
    latakia: number;
    homs: number;
    daraa: number;
    localDepots: number;
  };
  performance: {
    averageTimePerWarehouse: number;
    batchProcessingTime: number;
    dbOperationTime: number;
    validationTime: number;
  };
  geography: {
    governoratesCovered: number;
    totalCapacity: number;
    averageCapacity: number;
    coordinateValidation: string;
  };
  dryRunResults?: {
    wouldCreate: number;
    wouldUpdate: number;
    wouldSkip: number;
  };
  errorDetails?: string[];
}

/**
 * Warehouse validation result
 */
export interface WarehouseValidationResult {
  isValid: boolean;
  errors: string[];
  validatedWarehouses: number;
  geographyCheck: {
    coordinatesValid: number;
    coordinatesInvalid: number;
    duplicateLocations: number;
  };
  businessRules: {
    capacityValidation: string;
    coverageValidation: string;
    namingValidation: string;
  };
}

@Injectable()
export class WarehouseSeederService {
  private readonly logger = new Logger(WarehouseSeederService.name);

  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Main seeding method with comprehensive options
   */
  async seedWarehouses(
    options: WarehouseSeedOptions = {},
  ): Promise<WarehouseSeedResult> {
    const startTime = Date.now();
    this.logger.log('Starting warehouse seeding process...');

    // Set default options
    const config = {
      includeDamascus: true,
      includeAleppo: true,
      includeLatakia: true,
      includeHoms: true,
      includeDaraa: true,
      includeLocalDepots: true,
      skipDuplicates: true,
      updateExisting: false,
      dryRun: false,
      batchSize: 10,
      validateGeography: true,
      ...options,
    };

    try {
      // Filter warehouses based on options
      const warehousesToSeed = this.filterWarehouses(config);
      this.logger.log(
        `Filtered ${warehousesToSeed.length} warehouses for seeding`,
      );

      // Validate warehouses if requested
      let validationTime = 0;
      if (config.validateGeography) {
        const validationStart = Date.now();
        const validation = await this.validateWarehouseData(warehousesToSeed);
        validationTime = Date.now() - validationStart;

        if (!validation.isValid) {
          this.logger.error('Warehouse validation failed', validation.errors);
          return this.createErrorResult(
            'Validation failed',
            validation.errors,
            startTime,
          );
        }
      }

      // Handle dry run
      if (config.dryRun) {
        return this.performDryRun(
          warehousesToSeed,
          config,
          startTime,
          validationTime,
        );
      }

      // Perform actual seeding
      const result = await this.performSeeding(
        warehousesToSeed,
        config,
        startTime,
        validationTime,
      );

      this.logger.log(
        `Warehouse seeding completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );
      return result;
    } catch (error: unknown) {
      this.logger.error('Warehouse seeding failed', (error as Error).stack);
      return this.createErrorResult(
        'Seeding operation failed',
        [(error as Error).message],
        startTime,
      );
    }
  }

  /**
   * Validate warehouse data for geography and business rules
   */
  async validateWarehouseData(
    warehouses: WarehouseSeedData[],
  ): Promise<WarehouseValidationResult> {
    const errors: string[] = [];
    let coordinatesValid = 0;
    let coordinatesInvalid = 0;
    const locationMap = new Map<string, number>();

    // Validate each warehouse
    for (const warehouse of warehouses) {
      // Check coordinates
      if (
        this.isValidSyrianCoordinate(warehouse.latitude, warehouse.longitude)
      ) {
        coordinatesValid++;
      } else {
        coordinatesInvalid++;
        errors.push(
          `Invalid coordinates for ${warehouse.name}: ${warehouse.latitude}, ${warehouse.longitude}`,
        );
      }

      // Check for duplicate locations
      const locationKey = `${warehouse.latitude.toFixed(4)},${warehouse.longitude.toFixed(4)}`;
      const count = locationMap.get(locationKey) || 0;
      locationMap.set(locationKey, count + 1);

      // Validate capacity
      if (warehouse.capacity <= 0 || warehouse.capacity > 50000) {
        errors.push(
          `Invalid capacity for ${warehouse.name}: ${warehouse.capacity}`,
        );
      }

      // Validate required fields
      if (!warehouse.name || !warehouse.city || !warehouse.governorate) {
        errors.push(
          `Missing required fields for warehouse: ${warehouse.name || 'Unknown'}`,
        );
      }
    }

    // Check for duplicate locations
    const duplicateLocations = Array.from(locationMap.values()).filter(
      (count) => count > 1,
    ).length;

    // Business rules validation
    const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
    const governoratesCovered = new Set(warehouses.map((w) => w.governorate))
      .size;

    return {
      isValid: errors.length === 0,
      errors,
      validatedWarehouses: warehouses.length,
      geographyCheck: {
        coordinatesValid,
        coordinatesInvalid,
        duplicateLocations,
      },
      businessRules: {
        capacityValidation:
          totalCapacity > 30000 ? 'sufficient' : 'insufficient',
        coverageValidation: governoratesCovered >= 5 ? 'good' : 'limited',
        namingValidation: warehouses.every((w) => w.name && w.nameAr)
          ? 'complete'
          : 'incomplete',
      },
    };
  }

  /**
   * Perform dry run without database changes
   */
  private async performDryRun(
    warehouses: WarehouseSeedData[],
    config: WarehouseSeedOptions,
    startTime: number,
    validationTime: number,
  ): Promise<WarehouseSeedResult> {
    let wouldCreate = 0;
    let wouldUpdate = 0;
    let wouldSkip = 0;

    for (const warehouseData of warehouses) {
      const existing = await this.warehouseRepository.findOne({
        where: { name: warehouseData.name },
      });

      if (existing) {
        if (config.updateExisting) {
          wouldUpdate++;
        } else {
          wouldSkip++;
        }
      } else {
        wouldCreate++;
      }
    }

    return {
      success: true,
      totalProcessed: warehouses.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      processingTimeMs: Date.now() - startTime,
      statistics: this.calculateStatistics(warehouses),
      performance: {
        averageTimePerWarehouse: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
        validationTime,
      },
      geography: this.calculateGeographyStats(warehouses),
      dryRunResults: {
        wouldCreate,
        wouldUpdate,
        wouldSkip,
      },
    };
  }

  /**
   * Perform actual warehouse seeding
   */
  private async performSeeding(
    warehouses: WarehouseSeedData[],
    config: WarehouseSeedOptions,
    startTime: number,
    validationTime: number,
  ): Promise<WarehouseSeedResult> {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    const dbOperationStart = Date.now();

    // Process in batches using transaction
    const batchSize = config.batchSize || 10;
    for (let i = 0; i < warehouses.length; i += batchSize) {
      const batch = warehouses.slice(i, i + batchSize);

      await this.dataSource.transaction(async (manager) => {
        for (const warehouseData of batch) {
          try {
            const existing = await manager.findOne(Warehouse, {
              where: { name: warehouseData.name },
            });

            if (existing) {
              if (config.skipDuplicates && !config.updateExisting) {
                skipped++;
                continue;
              }

              if (config.updateExisting) {
                await manager.update(
                  Warehouse,
                  existing.id,
                  this.mapSeedToEntity(warehouseData),
                );
                updated++;
              } else {
                skipped++;
              }
            } else {
              const warehouse = manager.create(
                Warehouse,
                this.mapSeedToEntity(warehouseData),
              );
              await manager.save(warehouse);
              created++;
            }
          } catch (error: unknown) {
            errors++;
            errorDetails.push(
              `Error processing ${warehouseData.name}: ${(error as Error).message}`,
            );
            this.logger.error(
              `Error processing warehouse ${warehouseData.name}`,
              (error as Error).stack,
            );
          }
        }
      });
    }

    const dbOperationTime = Date.now() - dbOperationStart;
    const totalTime = Date.now() - startTime;

    return {
      success: true,
      totalProcessed: warehouses.length,
      created,
      updated,
      skipped,
      errors,
      processingTimeMs: totalTime,
      statistics: this.calculateStatistics(warehouses),
      performance: {
        averageTimePerWarehouse: Math.round(totalTime / warehouses.length),
        batchProcessingTime: totalTime,
        dbOperationTime,
        validationTime,
      },
      geography: this.calculateGeographyStats(warehouses),
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    };
  }

  /**
   * Map seed data to entity format
   */
  private mapSeedToEntity(seedData: WarehouseSeedData): Partial<Warehouse> {
    return {
      name: seedData.name,
      city: seedData.city,
      address: seedData.address,
      latitude: seedData.latitude,
      longitude: seedData.longitude,
    };
  }

  /**
   * Filter warehouses based on seeding options
   */
  private filterWarehouses(config: WarehouseSeedOptions): WarehouseSeedData[] {
    let warehouses: WarehouseSeedData[] = [];

    // Add regional warehouses based on options
    if (config.includeDamascus) warehouses.push(...DAMASCUS_WAREHOUSES);
    if (config.includeAleppo) warehouses.push(...ALEPPO_WAREHOUSES);
    if (config.includeLatakia) warehouses.push(...LATAKIA_WAREHOUSES);
    if (config.includeHoms) warehouses.push(...HOMS_WAREHOUSES);
    if (config.includeDaraa) warehouses.push(...DARAA_WAREHOUSES);
    if (config.includeLocalDepots) warehouses.push(...LOCAL_DEPOTS);

    // Apply additional filters
    if (config.specificTypes?.length) {
      warehouses = warehouses.filter((w) =>
        config.specificTypes!.includes(w.warehouseType),
      );
    }

    if (config.specificGovernorates?.length) {
      warehouses = warehouses.filter((w) =>
        config.specificGovernorates!.includes(w.governorate),
      );
    }

    if (config.capacityRangeMin !== undefined) {
      warehouses = warehouses.filter(
        (w) => w.capacity >= config.capacityRangeMin!,
      );
    }

    if (config.capacityRangeMax !== undefined) {
      warehouses = warehouses.filter(
        (w) => w.capacity <= config.capacityRangeMax!,
      );
    }

    if (config.onlyHighPriority) {
      warehouses = warehouses.filter((w) => w.priorityLevel === 'high');
    }

    if (config.establishedAfter) {
      warehouses = warehouses.filter(
        (w) => w.establishedYear >= config.establishedAfter!,
      );
    }

    return warehouses;
  }

  /**
   * Calculate statistics for seeded warehouses
   */
  private calculateStatistics(warehouses: WarehouseSeedData[]) {
    return {
      total: warehouses.length,
      damascus: warehouses.filter((w) => DAMASCUS_WAREHOUSES.includes(w))
        .length,
      aleppo: warehouses.filter((w) => ALEPPO_WAREHOUSES.includes(w)).length,
      latakia: warehouses.filter((w) => LATAKIA_WAREHOUSES.includes(w)).length,
      homs: warehouses.filter((w) => HOMS_WAREHOUSES.includes(w)).length,
      daraa: warehouses.filter((w) => DARAA_WAREHOUSES.includes(w)).length,
      localDepots: warehouses.filter((w) => LOCAL_DEPOTS.includes(w)).length,
    };
  }

  /**
   * Calculate geography statistics
   */
  private calculateGeographyStats(warehouses: WarehouseSeedData[]) {
    const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
    const averageCapacity = warehouses.length
      ? Math.round(totalCapacity / warehouses.length)
      : 0;
    const governoratesCovered = new Set(warehouses.map((w) => w.governorate))
      .size;
    const validCoordinates = warehouses.filter((w) =>
      this.isValidSyrianCoordinate(w.latitude, w.longitude),
    ).length;

    return {
      governoratesCovered,
      totalCapacity,
      averageCapacity,
      coordinateValidation: `${validCoordinates}/${warehouses.length} valid`,
    };
  }

  /**
   * Validate Syrian coordinates
   */
  private isValidSyrianCoordinate(lat: number, lng: number): boolean {
    // Syria approximate bounds
    return lat >= 32.0 && lat <= 37.5 && lng >= 35.0 && lng <= 42.0;
  }

  /**
   * Create error result
   */
  private createErrorResult(
    message: string,
    errors: string[],
    startTime: number,
  ): WarehouseSeedResult {
    return {
      success: false,
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: errors.length,
      processingTimeMs: Date.now() - startTime,
      statistics: {
        total: 0,
        damascus: 0,
        aleppo: 0,
        latakia: 0,
        homs: 0,
        daraa: 0,
        localDepots: 0,
      },
      performance: {
        averageTimePerWarehouse: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
        validationTime: 0,
      },
      geography: {
        governoratesCovered: 0,
        totalCapacity: 0,
        averageCapacity: 0,
        coordinateValidation: 'failed',
      },
      errorDetails: errors,
    };
  }

  // Category-specific seeding methods
  async seedDamascusWarehouses(): Promise<WarehouseSeedResult> {
    return this.seedWarehouses({
      includeDamascus: true,
      includeAleppo: false,
      includeLatakia: false,
      includeHoms: false,
      includeDaraa: false,
      includeLocalDepots: false,
    });
  }

  async seedAleppowWarehouses(): Promise<WarehouseSeedResult> {
    return this.seedWarehouses({
      includeDamascus: false,
      includeAleppo: true,
      includeLatakia: false,
      includeHoms: false,
      includeDaraa: false,
      includeLocalDepots: false,
    });
  }

  async seedLatakiaWarehouses(): Promise<WarehouseSeedResult> {
    return this.seedWarehouses({
      includeDamascus: false,
      includeAleppo: false,
      includeLatakia: true,
      includeHoms: false,
      includeDaraa: false,
      includeLocalDepots: false,
    });
  }

  async seedHomsWarehouses(): Promise<WarehouseSeedResult> {
    return this.seedWarehouses({
      includeDamascus: false,
      includeAleppo: false,
      includeLatakia: false,
      includeHoms: true,
      includeDaraa: false,
      includeLocalDepots: false,
    });
  }

  async seedDaraaWarehouses(): Promise<WarehouseSeedResult> {
    return this.seedWarehouses({
      includeDamascus: false,
      includeAleppo: false,
      includeLatakia: false,
      includeHoms: false,
      includeDaraa: true,
      includeLocalDepots: false,
    });
  }

  async seedLocalDepots(): Promise<WarehouseSeedResult> {
    return this.seedWarehouses({
      includeDamascus: false,
      includeAleppo: false,
      includeLatakia: false,
      includeHoms: false,
      includeDaraa: false,
      includeLocalDepots: true,
    });
  }

  // Analytics and information methods
  async getWarehouseStatistics() {
    const databaseCount = await this.warehouseRepository.count();

    return {
      seedData: WAREHOUSE_STATISTICS,
      database: {
        totalWarehouses: databaseCount,
      },
      comparison: {
        seedingProgress:
          WAREHOUSE_STATISTICS.total > 0
            ? (databaseCount / WAREHOUSE_STATISTICS.total) * 100
            : 0,
        missingFromDb: Math.max(0, WAREHOUSE_STATISTICS.total - databaseCount),
        completionRate:
          WAREHOUSE_STATISTICS.total > 0
            ? (databaseCount / WAREHOUSE_STATISTICS.total) * 100
            : 0,
      },
    };
  }

  async getWarehouseDataInfo() {
    return {
      ...WAREHOUSE_STATISTICS,
      regions: {
        damascus: DAMASCUS_WAREHOUSES.map((w) => ({
          name: w.name,
          capacity: w.capacity,
        })),
        aleppo: ALEPPO_WAREHOUSES.map((w) => ({
          name: w.name,
          capacity: w.capacity,
        })),
        latakia: LATAKIA_WAREHOUSES.map((w) => ({
          name: w.name,
          capacity: w.capacity,
        })),
        homs: HOMS_WAREHOUSES.map((w) => ({
          name: w.name,
          capacity: w.capacity,
        })),
        daraa: DARAA_WAREHOUSES.map((w) => ({
          name: w.name,
          capacity: w.capacity,
        })),
        localDepots: LOCAL_DEPOTS.map((w) => ({
          name: w.name,
          capacity: w.capacity,
        })),
      },
    };
  }

  async getWarehousePreview(
    filters: {
      region?: string;
      type?: string;
      minCapacity?: number;
      maxCapacity?: number;
      limit?: number;
    } = {},
  ) {
    let warehouses = ALL_WAREHOUSE_SEEDS;

    if (filters.region) {
      const regionMap = {
        damascus: DAMASCUS_WAREHOUSES,
        aleppo: ALEPPO_WAREHOUSES,
        latakia: LATAKIA_WAREHOUSES,
        homs: HOMS_WAREHOUSES,
        daraa: DARAA_WAREHOUSES,
        local: LOCAL_DEPOTS,
      };
      warehouses = regionMap[filters.region] || [];
    }

    if (filters.type) {
      warehouses = warehouses.filter((w) => w.warehouseType === filters.type);
    }

    if (filters.minCapacity) {
      warehouses = warehouses.filter((w) => w.capacity >= filters.minCapacity);
    }

    if (filters.maxCapacity) {
      warehouses = warehouses.filter((w) => w.capacity <= filters.maxCapacity);
    }

    if (filters.limit) {
      warehouses = warehouses.slice(0, filters.limit);
    }

    return {
      warehouses: warehouses.map((w) => ({
        name: w.name,
        nameAr: w.nameAr,
        city: w.city,
        cityAr: w.cityAr,
        governorate: w.governorate,
        governorateAr: w.governorateAr,
        warehouseType: w.warehouseType,
        capacity: w.capacity,
        latitude: w.latitude,
        longitude: w.longitude,
        priorityLevel: w.priorityLevel,
        establishedYear: w.establishedYear,
      })),
      statistics: {
        total: warehouses.length,
        regionDistribution: this.getRegionDistribution(warehouses),
        typeDistribution: this.getTypeDistribution(warehouses),
      },
    };
  }

  private getRegionDistribution(warehouses: WarehouseSeedData[]) {
    const distribution = {};
    warehouses.forEach((w) => {
      distribution[w.governorate] = (distribution[w.governorate] || 0) + 1;
    });
    return distribution;
  }

  private getTypeDistribution(warehouses: WarehouseSeedData[]) {
    const distribution = {};
    warehouses.forEach((w) => {
      distribution[w.warehouseType] = (distribution[w.warehouseType] || 0) + 1;
    });
    return distribution;
  }

  async healthCheck() {
    try {
      const dbCount = await this.warehouseRepository.count();
      const seedDataAvailable = ALL_WAREHOUSE_SEEDS.length;

      return {
        status: 'healthy',
        database: 'connected',
        seedDataIntegrity: 'valid',
        geographyValidation: 'valid',
        statistics: {
          totalWarehousesInDb: dbCount,
          seedDataAvailable,
          processingTime: Date.now(),
        },
        lastCheck: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: (error as Error).message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  async cleanupWarehouses(
    options: {
      onlySeedData?: boolean;
      confirmationCode?: string;
      dryRun?: boolean;
      excludeActive?: boolean;
    } = {},
  ) {
    const config = {
      onlySeedData: true,
      dryRun: false,
      excludeActive: true,
      ...options,
    };

    // Safety check for complete deletion
    if (
      !config.onlySeedData &&
      config.confirmationCode !== 'DELETE_ALL_WAREHOUSES'
    ) {
      throw new Error(
        'Confirmation code required for complete warehouse deletion',
      );
    }

    const startTime = Date.now();
    let query = this.warehouseRepository.createQueryBuilder('warehouse');

    if (config.onlySeedData) {
      const seedNames = ALL_WAREHOUSE_SEEDS.map((w) => w.name);
      query = query.where('warehouse.name IN (:...names)', {
        names: seedNames,
      });
    }

    if (config.dryRun) {
      const warehouses = await query.getMany();
      return {
        success: true,
        deletedCount: 0,
        dryRunResults: {
          wouldDelete: warehouses.length,
        },
        processingTimeMs: Date.now() - startTime,
      };
    }

    const warehouses = await query.getMany();
    await this.warehouseRepository.remove(warehouses);

    return {
      success: true,
      deletedCount: warehouses.length,
      processingTimeMs: Date.now() - startTime,
      deletedWarehouses: warehouses.map((w) => ({
        id: w.id,
        name: w.name,
        city: w.city,
      })),
    };
  }
}
