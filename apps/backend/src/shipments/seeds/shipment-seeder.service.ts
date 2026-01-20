/**
 * @file shipment-seeder.service.ts
 * @description Comprehensive seeder service for Syrian shipment system
 *
 * FEATURES:
 * - Seeds Syrian shipping companies with full localization
 * - Creates realistic shipment test data with enterprise workflows
 * - Supports bulk seeding operations for performance testing
 * - Handles all 15-state shipment workflows
 * - Multi-currency support (SYP primary)
 * - Complete audit trails and status logs
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { SyrianShippingCompanyEntity } from '../entities/syrian-shipping-company.entity';
import { ShippingCompany } from '../entities/shipping-company.entity';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { ShipmentStatusLog } from '../entities/shipment-status-log.entity';
import { ShipmentItem } from '../entities/shipment-item.entity';

import {
  SYRIAN_SHIPPING_COMPANIES_SEED,
  LEGACY_SHIPPING_COMPANIES_SEED,
  SAMPLE_SHIPMENTS_SEED,
  SHIPMENT_STATUS_LOGS_SEED,
} from './shipment-seeds.data';

/**
 * Seeding configuration interface
 */
export interface ShipmentSeedingConfig {
  syrianCompanies: boolean;
  legacyCompanies: boolean;
  sampleShipments: boolean;
  statusLogs: boolean;
  bulkShipments?: number; // Number of bulk shipments to create
  performanceTest?: boolean;
}

/**
 * Seeding statistics and results
 */
export interface SeedingStats {
  syrianCompaniesCreated: number;
  legacyCompaniesCreated: number;
  shipmentsCreated: number;
  statusLogsCreated: number;
  totalExecutionTime: number;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ShipmentSeederService {
  private readonly logger = new Logger(ShipmentSeederService.name);

  constructor(
    @InjectRepository(SyrianShippingCompanyEntity)
    private readonly syrianShippingCompanyRepository: Repository<SyrianShippingCompanyEntity>,

    @InjectRepository(ShippingCompany)
    private readonly shippingCompanyRepository: Repository<ShippingCompany>,

    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,

    @InjectRepository(ShipmentStatusLog)
    private readonly shipmentStatusLogRepository: Repository<ShipmentStatusLog>,

    @InjectRepository(ShipmentItem)
    private readonly shipmentItemRepository: Repository<ShipmentItem>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Seed all shipment-related data
   */
  async seedAll(
    config: Partial<ShipmentSeedingConfig> = {},
  ): Promise<SeedingStats> {
    const startTime = Date.now();
    const stats: SeedingStats = {
      syrianCompaniesCreated: 0,
      legacyCompaniesCreated: 0,
      shipmentsCreated: 0,
      statusLogsCreated: 0,
      totalExecutionTime: 0,
      errors: [],
      warnings: [],
    };

    const finalConfig: ShipmentSeedingConfig = {
      syrianCompanies: true,
      legacyCompanies: true,
      sampleShipments: true,
      statusLogs: true,
      bulkShipments: 0,
      performanceTest: false,
      ...config,
    };

    this.logger.log('🚀 Starting comprehensive shipment system seeding...');

    try {
      // Use transaction for data consistency
      await this.dataSource.transaction(async (manager) => {
        // 1. Seed Syrian shipping companies
        if (finalConfig.syrianCompanies) {
          stats.syrianCompaniesCreated =
            await this.seedSyrianShippingCompanies(manager);
        }

        // 2. Seed legacy shipping companies
        if (finalConfig.legacyCompanies) {
          stats.legacyCompaniesCreated =
            await this.seedLegacyShippingCompanies(manager);
        }

        // 3. Seed sample shipments
        if (finalConfig.sampleShipments) {
          stats.shipmentsCreated = await this.seedSampleShipments(manager);
        }

        // 4. Seed status logs
        if (finalConfig.statusLogs && stats.shipmentsCreated > 0) {
          stats.statusLogsCreated = await this.seedStatusLogs(manager);
        }

        // 5. Bulk shipment seeding for performance testing
        if (finalConfig.bulkShipments && finalConfig.bulkShipments > 0) {
          const bulkCreated = await this.seedBulkShipments(
            manager,
            finalConfig.bulkShipments,
          );
          stats.shipmentsCreated += bulkCreated;
        }
      });

      stats.totalExecutionTime = Date.now() - startTime;

      this.logger.log('✅ Shipment seeding completed successfully!');
      this.logger.log(`📊 Statistics:`, {
        ...stats,
        executionTimeMs: stats.totalExecutionTime,
      });

      return stats;
    } catch (error) {
      stats.errors.push(`Seeding failed: ${error.message}`);
      stats.totalExecutionTime = Date.now() - startTime;

      this.logger.error('❌ Shipment seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed Syrian shipping companies with full localization
   */
  private async seedSyrianShippingCompanies(manager: any): Promise<number> {
    this.logger.log('🏢 Seeding Syrian shipping companies...');

    let created = 0;
    for (const companyData of SYRIAN_SHIPPING_COMPANIES_SEED) {
      try {
        // Check if company already exists
        const existing = await manager.findOne(SyrianShippingCompanyEntity, {
          where: { nameEn: companyData.nameEn },
        });

        if (!existing) {
          const company = manager.create(
            SyrianShippingCompanyEntity,
            companyData,
          );
          await manager.save(company);
          created++;

          this.logger.debug(
            `✅ Created Syrian shipping company: ${companyData.nameEn}`,
          );
        } else {
          this.logger.debug(
            `⚠️ Syrian shipping company already exists: ${companyData.nameEn}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `❌ Failed to create company ${companyData.nameEn}:`,
          error,
        );
      }
    }

    this.logger.log(`✅ Created ${created} Syrian shipping companies`);
    return created;
  }

  /**
   * Seed legacy shipping companies for backward compatibility
   */
  private async seedLegacyShippingCompanies(manager: any): Promise<number> {
    this.logger.log('🏬 Seeding legacy shipping companies...');

    let created = 0;
    for (const companyData of LEGACY_SHIPPING_COMPANIES_SEED) {
      try {
        // Check if company already exists
        const existing = await manager.findOne(ShippingCompany, {
          where: { name: companyData.name },
        });

        if (!existing) {
          const company = manager.create(ShippingCompany, companyData);
          await manager.save(company);
          created++;

          this.logger.debug(
            `✅ Created legacy shipping company: ${companyData.name}`,
          );
        } else {
          this.logger.debug(
            `⚠️ Legacy shipping company already exists: ${companyData.name}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `❌ Failed to create legacy company ${companyData.name}:`,
          error,
        );
      }
    }

    this.logger.log(`✅ Created ${created} legacy shipping companies`);
    return created;
  }

  /**
   * Seed sample shipments with realistic workflow data
   */
  private async seedSampleShipments(manager: any): Promise<number> {
    this.logger.log('📦 Seeding sample shipments...');

    let created = 0;
    for (const shipmentData of SAMPLE_SHIPMENTS_SEED) {
      try {
        // Check if shipment already exists
        const existing = await manager.findOne(Shipment, {
          where: { tracking_code: shipmentData.tracking_code },
        });

        if (!existing) {
          // Get first Syrian shipping company for assignment
          const syrianCompany = await manager.findOne(
            SyrianShippingCompanyEntity,
            {
              where: { isActive: true },
            },
          );

          if (syrianCompany) {
            const shipmentToCreate = {
              ...shipmentData,
              syrianShippingCompany: syrianCompany,
            };

            const shipment = manager.create(Shipment, shipmentToCreate);
            await manager.save(shipment);
            created++;

            this.logger.debug(
              `✅ Created sample shipment: ${shipmentData.tracking_code}`,
            );
          } else {
            this.logger.warn(
              '⚠️ No Syrian shipping company found for shipment assignment',
            );
          }
        } else {
          this.logger.debug(
            `⚠️ Sample shipment already exists: ${shipmentData.tracking_code}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `❌ Failed to create shipment ${shipmentData.tracking_code}:`,
          error,
        );
      }
    }

    this.logger.log(`✅ Created ${created} sample shipments`);
    return created;
  }

  /**
   * Seed shipment status logs for workflow tracking
   */
  private async seedStatusLogs(manager: any): Promise<number> {
    this.logger.log('📋 Seeding shipment status logs...');

    // Get first shipment for log assignment
    const shipment = await manager.findOne(Shipment, {
      where: { status: ShipmentStatus.OUT_FOR_DELIVERY },
    });

    if (!shipment) {
      this.logger.warn('⚠️ No shipment found for status log assignment');
      return 0;
    }

    let created = 0;
    for (const logData of SHIPMENT_STATUS_LOGS_SEED) {
      try {
        const statusLog = manager.create(ShipmentStatusLog, {
          ...logData,
          shipment: shipment,
        });

        await manager.save(statusLog);
        created++;

        this.logger.debug(`✅ Created status log: ${logData.status}`);
      } catch (error) {
        this.logger.error(
          `❌ Failed to create status log ${logData.status}:`,
          error,
        );
      }
    }

    this.logger.log(`✅ Created ${created} status logs`);
    return created;
  }

  /**
   * Seed bulk shipments for performance testing
   */
  private async seedBulkShipments(
    manager: any,
    count: number,
  ): Promise<number> {
    this.logger.log(
      `📈 Seeding ${count} bulk shipments for performance testing...`,
    );

    // Get Syrian shipping company for assignment
    const syrianCompany = await manager.findOne(SyrianShippingCompanyEntity, {
      where: { isActive: true },
    });

    if (!syrianCompany) {
      this.logger.warn(
        '⚠️ No Syrian shipping company found for bulk shipment assignment',
      );
      return 0;
    }

    const shipments: Partial<Shipment>[] = [];
    const statuses = [
      ShipmentStatus.CREATED,
      ShipmentStatus.ASSIGNED_COMPANY,
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_WAREHOUSE,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ];

    for (let i = 0; i < count; i++) {
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];
      const trackingCode = `SY-BULK-2025-${String(i + 1).padStart(6, '0')}`;

      shipments.push({
        status: randomStatus,
        tracking_code: trackingCode,
        external_tracking_ref: `BULK-${Date.now()}-${i}`,
        syrianShippingCompany: syrianCompany,
        total_cost_syp: Math.floor(Math.random() * 10000) + 1000, // Random cost 1000-11000 SYP
        package_details: {
          weightKg: Math.round((Math.random() * 10 + 0.5) * 100) / 100, // 0.5-10.5 kg
          dimensions: {
            length: Math.floor(Math.random() * 50) + 10, // 10-60 cm
            width: Math.floor(Math.random() * 40) + 10, // 10-50 cm
            height: Math.floor(Math.random() * 30) + 5, // 5-35 cm
          },
          declaredValue: Math.floor(Math.random() * 500000) + 50000, // 50k-550k SYP
          isFragile: Math.random() < 0.3, // 30% fragile
          requiresColdStorage: false,
          contents: [
            {
              item: `Test Product ${i + 1}`,
              itemAr: `منتج تجريبي ${i + 1}`,
              quantity: Math.floor(Math.random() * 5) + 1,
              value: Math.floor(Math.random() * 100000) + 10000,
            },
          ],
        },
        service_options: {
          serviceType: Math.random() < 0.5 ? 'standard' : 'express',
          isExpress: Math.random() < 0.4, // 40% express
          requiresSignature: Math.random() < 0.7, // 70% require signature
          cashOnDelivery: Math.random() < 0.8, // 80% COD
          codAmount: Math.floor(Math.random() * 300000) + 50000,
          insuranceRequired: Math.random() < 0.5, // 50% insured
          callBeforeDelivery: Math.random() < 0.6, // 60% call before
          smsNotifications: true,
          whatsappNotifications: Math.random() < 0.4, // 40% WhatsApp
        },
        internal_notes: `Bulk test shipment ${i + 1}`,
        internal_notes_ar: `شحنة تجريبية مجمعة ${i + 1}`,
      });
    }

    try {
      // Use chunked inserts for better performance
      const chunkSize = 100;
      let created = 0;

      for (let i = 0; i < shipments.length; i += chunkSize) {
        const chunk = shipments.slice(i, i + chunkSize);
        const entities = chunk.map((data) => manager.create(Shipment, data));
        await manager.save(entities);
        created += entities.length;

        this.logger.debug(
          `📦 Bulk created ${entities.length} shipments (${created}/${count})`,
        );
      }

      this.logger.log(
        `✅ Created ${created} bulk shipments for performance testing`,
      );
      return created;
    } catch (error) {
      this.logger.error('❌ Failed to create bulk shipments:', error);
      return 0;
    }
  }

  /**
   * Clear all shipment data (use with caution!)
   */
  async clearAllData(): Promise<void> {
    this.logger.warn('🧹 Clearing all shipment data...');

    try {
      await this.dataSource.transaction(async (manager) => {
        // Delete in correct order to avoid foreign key constraints
        await manager.delete(ShipmentStatusLog, {});
        await manager.delete(ShipmentItem, {});
        await manager.delete(Shipment, {});
        await manager.delete(SyrianShippingCompanyEntity, {});
        await manager.delete(ShippingCompany, {});
      });

      this.logger.log('✅ All shipment data cleared successfully');
    } catch (error) {
      this.logger.error('❌ Failed to clear shipment data:', error);
      throw error;
    }
  }

  /**
   * Get seeding statistics and current data counts
   */
  async getSeedingStats(): Promise<any> {
    const [
      syrianCompaniesCount,
      legacyCompaniesCount,
      shipmentsCount,
      statusLogsCount,
    ] = await Promise.all([
      this.syrianShippingCompanyRepository.count(),
      this.shippingCompanyRepository.count(),
      this.shipmentRepository.count(),
      this.shipmentStatusLogRepository.count(),
    ]);

    // Get shipments by status
    const shipmentsByStatus = await this.shipmentRepository
      .createQueryBuilder('shipment')
      .select('shipment.status, COUNT(*) as count')
      .groupBy('shipment.status')
      .getRawMany();

    return {
      overview: {
        syrianShippingCompanies: syrianCompaniesCount,
        legacyShippingCompanies: legacyCompaniesCount,
        totalShipments: shipmentsCount,
        statusLogs: statusLogsCount,
      },
      shipmentsByStatus: shipmentsByStatus.reduce(
        (acc, item) => {
          acc[item.shipment_status] = parseInt(item.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Verify data integrity after seeding
   */
  async verifyDataIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    summary: any;
  }> {
    const issues: string[] = [];

    try {
      // Check for orphaned shipments
      const orphanedShipments = await this.shipmentRepository
        .createQueryBuilder('shipment')
        .leftJoin('shipment.syrianShippingCompany', 'syrianCompany')
        .leftJoin('shipment.shippingCompany', 'legacyCompany')
        .where('syrianCompany.id IS NULL AND legacyCompany.id IS NULL')
        .getCount();

      if (orphanedShipments > 0) {
        issues.push(
          `Found ${orphanedShipments} shipments without assigned shipping company`,
        );
      }

      // Check for invalid tracking codes
      const invalidTrackingCodes = await this.shipmentRepository
        .createQueryBuilder('shipment')
        .where('shipment.tracking_code IS NULL OR shipment.tracking_code = ""')
        .getCount();

      if (invalidTrackingCodes > 0) {
        issues.push(
          `Found ${invalidTrackingCodes} shipments with invalid tracking codes`,
        );
      }

      // Check for shipments without cost data
      const noCostShipments = await this.shipmentRepository
        .createQueryBuilder('shipment')
        .where('shipment.total_cost_syp IS NULL')
        .getCount();

      if (noCostShipments > 0) {
        issues.push(
          `Found ${noCostShipments} shipments without cost information`,
        );
      }

      const summary = await this.getSeedingStats();

      return {
        isValid: issues.length === 0,
        issues,
        summary,
      };
    } catch (error) {
      issues.push(`Integrity check failed: ${error.message}`);
      return {
        isValid: false,
        issues,
        summary: null,
      };
    }
  }
}
