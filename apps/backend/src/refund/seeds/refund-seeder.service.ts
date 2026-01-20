/**
 * @file refund-seeder.service.ts
 * @description Enterprise Syrian Refund Seeding Service
 *
 * ENTERPRISE FEATURES:
 * - Complete Syrian refund seeding with 10-state workflow
 * - Multi-currency transaction management with banking integration
 * - Performance testing with bulk generation capabilities
 * - Data integrity verification and cleanup operations
 * - Arabic/English localization with cultural formatting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 * @version 2.0.0 - Enterprise Edition
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

// Core Entities
import { SyrianRefundEntity, SyrianRefundStatus } from '../entities/syrian-refund.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

// Seeding Data
import {
  SAMPLE_SYRIAN_REFUNDS,
  REFUND_ANALYTICS_DATA,
  SYRIAN_BANKS_DATA,
  PERFORMANCE_TEST_CONFIG,
} from './refund-seeds.data';

/**
 * Enterprise Syrian Refund Seeding Service
 * Provides comprehensive refund data seeding with Syrian market localization
 */
@Injectable()
export class RefundSeederService {
  private readonly logger = new Logger(RefundSeederService.name);

  constructor(
    @InjectRepository(SyrianRefundEntity)
    private readonly refundRepository: Repository<SyrianRefundEntity>,
    @InjectRepository(SyrianGovernorateEntity)
    private readonly governorateRepository: Repository<SyrianGovernorateEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Seed sample Syrian refunds with comprehensive 10-state workflow data
   * @returns Promise with seeding statistics
   */
  async seedSampleRefunds(): Promise<{
    message: string;
    messageAr: string;
    totalSeeded: number;
    statusDistribution: Record<string, number>;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    this.logger.log('🔄 Starting Syrian refund seeding...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Clear existing sample data
      await queryRunner.manager.delete(SyrianRefundEntity, {});
      this.logger.log('✅ Cleared existing refund data');

      // Verify governorates exist
      const governoratesCount = await this.governorateRepository.count();
      if (governoratesCount === 0) {
        throw new Error('Syrian governorates must be seeded first');
      }

      // Create refund entities with comprehensive data
      const refundEntities = SAMPLE_SYRIAN_REFUNDS.map((refundData) => {
        const refund = new SyrianRefundEntity();
        
        // Core fields
        refund.refundReference = refundData.refundNumber;
        refund.refundStatus = refundData.refundStatus;
        refund.refundMethod = refundData.refundMethod;
        refund.currency = refundData.currency as 'SYP' | 'USD' | 'EUR';
        refund.amountSyp = refundData.amountSyp;
        
        // Reason and category
        refund.reasonCategory = refundData.reasonCategory;
        refund.reasonDescriptionAr = refundData.reasonArabic;
        refund.reasonDescriptionEn = refundData.reasonEnglish;
        
        // Banking information
        refund.bankType = refundData.bankType;
        refund.accountNumber = refundData.bankAccountNumber;
        refund.swiftCode = refundData.bankSwiftCode;
        refund.accountHolderName = refundData.bankAccountHolder;
        
        // Geographic and priority
        refund.governorateId = refundData.governorateId;
        refund.isUrgent = refundData.isUrgent;
        
        // Descriptions
        refund.customerNotes = refundData.description;
        refund.adminNotes = refundData.descriptionEn;
        
        // Mock relationships (will be updated when orders/users are seeded)
        refund.orderId = Math.floor(Math.random() * 1000) + 1;
        refund.paymentTransactionId = Math.floor(Math.random() * 1000) + 1;
        refund.customerId = Math.floor(Math.random() * 100) + 1;
        
        // Workflow timestamps
        if (refundData.submittedAt) {
          refund.submittedAt = refundData.submittedAt;
        }
        if (refundData.reviewStartedAt) {
          refund.reviewStartedAt = refundData.reviewStartedAt;
        }
        if (refundData.approvedAt) {
          refund.approvedAt = refundData.approvedAt;
        }
        // No rejectedAt field in entity - using workflow status instead
        if (refundData.processingStartedAt) {
          refund.processingStartedAt = refundData.processingStartedAt;
        }
        if (refundData.completedAt) {
          refund.completedAt = refundData.completedAt;
        }
        if (refundData.failedAt) {
          refund.failedAt = refundData.failedAt;
        }
        if (refundData.disputedAt) {
          refund.disputeRaisedAt = refundData.disputedAt;
        }
        if (refundData.cancelledAt) {
          refund.cancelledAt = refundData.cancelledAt;
        }
        
        // Status-specific fields - store in admin notes since no specific reason fields
        let additionalNotes = '';
        if (refundData.rejectionReason) {
          additionalNotes += `Rejection: ${refundData.rejectionReason} | `;
        }
        if (refundData.failureReason) {
          additionalNotes += `Failure: ${refundData.failureReason} | `;
        }
        if (refundData.disputeReason) {
          additionalNotes += `Dispute: ${refundData.disputeReason} | `;
        }
        if (refundData.cancellationReason) {
          additionalNotes += `Cancellation: ${refundData.cancellationReason} | `;
        }
        if (additionalNotes) {
          refund.adminNotes = `${refund.adminNotes || ''} ${additionalNotes}`.trim();
        }
        if (refundData.processedById) {
          refund.processedById = refundData.processedById;
        }
        
        return refund;
      });

      // Bulk insert refunds
      await queryRunner.manager.save(SyrianRefundEntity, refundEntities);

      // Calculate status distribution
      const statusDistribution = refundEntities.reduce((acc, refund) => {
        acc[refund.refundStatus] = (acc[refund.refundStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await queryRunner.commitTransaction();

      const processingTime = Date.now() - startTime;
      
      this.logger.log(`✅ Successfully seeded ${refundEntities.length} Syrian refunds`);
      this.logger.log(`📊 Status distribution: ${JSON.stringify(statusDistribution)}`);
      this.logger.log(`⚡ Processing time: ${processingTime}ms`);

      return {
        message: 'Syrian refunds seeded successfully',
        messageAr: 'تم زرع بيانات المرتجعات السورية بنجاح',
        totalSeeded: refundEntities.length,
        statusDistribution,
        processingTimeMs: processingTime,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Error seeding refunds: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get comprehensive refund workflow analytics
   * @returns Promise with detailed analytics data
   */
  async getWorkflowAnalytics(): Promise<{
    message: string;
    messageAr: string;
    totalRefunds: number;
    statusDistribution: any[];
    methodDistribution: any[];
    currencyDistribution: any[];
    reasonDistribution: any[];
    processingTimes: any[];
    slaMetrics: any[];
    monthlyPerformance: any[];
  }> {
    this.logger.log('📊 Generating Syrian refund workflow analytics...');

    const totalRefunds = await this.refundRepository.count();

    // Get actual status distribution from database
    const statusCounts = await this.refundRepository
      .createQueryBuilder('refund')
      .select('refund.refundStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('refund.refundStatus')
      .getRawMany();

    const actualStatusDistribution = statusCounts.map(item => ({
      status: item.status,
      count: parseInt(item.count),
      percentage: totalRefunds > 0 ? (parseInt(item.count) / totalRefunds * 100) : 0,
    }));

    return {
      message: 'Refund workflow analytics generated successfully',
      messageAr: 'تم إنشاء تحليلات سير عمل المرتجعات بنجاح',
      totalRefunds,
      statusDistribution: actualStatusDistribution,
      methodDistribution: REFUND_ANALYTICS_DATA.methodDistribution,
      currencyDistribution: REFUND_ANALYTICS_DATA.currencyDistribution,
      reasonDistribution: REFUND_ANALYTICS_DATA.reasonDistribution,
      processingTimes: REFUND_ANALYTICS_DATA.processingTimes,
      slaMetrics: REFUND_ANALYTICS_DATA.slaMetrics,
      monthlyPerformance: REFUND_ANALYTICS_DATA.monthlyPerformance,
    };
  }

  /**
   * Generate bulk refunds for performance testing
   * @param count Number of refunds to generate
   * @returns Promise with generation statistics
   */
  async generateBulkRefunds(count: number): Promise<{
    message: string;
    messageAr: string;
    totalGenerated: number;
    performanceMetrics: {
      totalTimeMs: number;
      avgTimePerRecord: number;
      recordsPerSecond: number;
    };
  }> {
    const startTime = Date.now();
    this.logger.log(`🚀 Generating ${count} bulk refunds for performance testing...`);

    if (count > PERFORMANCE_TEST_CONFIG.bulkGeneration.stressBatch) {
      throw new Error(`Bulk generation limit exceeded. Max: ${PERFORMANCE_TEST_CONFIG.bulkGeneration.stressBatch}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bulkRefunds: Partial<SyrianRefundEntity>[] = [];

      for (let i = 0; i < count; i++) {
        const templateRefund = SAMPLE_SYRIAN_REFUNDS[i % SAMPLE_SYRIAN_REFUNDS.length];
        const statusOptions = Object.values(SyrianRefundStatus);
        
        const refund = {
          refundReference: `BULK-REF-${Date.now()}-${i.toString().padStart(6, '0')}`,
          refundStatus: statusOptions[Math.floor(Math.random() * statusOptions.length)],
          refundMethod: templateRefund.refundMethod,
          currency: templateRefund.currency as 'SYP' | 'USD' | 'EUR',
          amountSyp: Math.floor(Math.random() * 1000000) + 10000, // 10K-1M SYP
          reasonCategory: templateRefund.reasonCategory,
          reasonDescriptionAr: templateRefund.reasonArabic,
          reasonDescriptionEn: templateRefund.reasonEnglish,
          bankType: templateRefund.bankType,
          accountNumber: `BULK${Math.random().toString().substring(2, 18)}`,
          swiftCode: templateRefund.bankSwiftCode,
          accountHolderName: `${templateRefund.bankAccountHolder} ${i}`,
          governorateId: Math.floor(Math.random() * 14) + 1,
          isUrgent: Math.random() > 0.8,
          orderId: Math.floor(Math.random() * 10000) + 1,
          paymentTransactionId: Math.floor(Math.random() * 10000) + 1,
          customerId: Math.floor(Math.random() * 1000) + 1,
          customerNotes: `${templateRefund.description} - Bulk ${i}`,
          adminNotes: `${templateRefund.descriptionEn} - Bulk ${i}`,
          submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        };

        bulkRefunds.push(refund);
      }

      // Batch insert for performance
      const batchSize = 1000;
      let totalGenerated = 0;

      for (let i = 0; i < bulkRefunds.length; i += batchSize) {
        const batch = bulkRefunds.slice(i, i + batchSize);
        await queryRunner.manager.insert(SyrianRefundEntity, batch);
        totalGenerated += batch.length;
        
        if (totalGenerated % 5000 === 0) {
          this.logger.log(`📈 Generated ${totalGenerated}/${count} refunds...`);
        }
      }

      await queryRunner.commitTransaction();

      const totalTime = Date.now() - startTime;
      const avgTimePerRecord = totalTime / count;
      const recordsPerSecond = Math.round((count / totalTime) * 1000);

      this.logger.log(`✅ Successfully generated ${totalGenerated} bulk refunds`);
      this.logger.log(`⚡ Performance: ${avgTimePerRecord.toFixed(2)}ms per record, ${recordsPerSecond} records/sec`);

      return {
        message: 'Bulk refunds generated successfully',
        messageAr: 'تم إنشاء المرتجعات بالجملة بنجاح',
        totalGenerated,
        performanceMetrics: {
          totalTimeMs: totalTime,
          avgTimePerRecord: parseFloat(avgTimePerRecord.toFixed(2)),
          recordsPerSecond,
        },
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Error generating bulk refunds: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get Syrian banking integration data
   * @returns Promise with banking information
   */
  async getBankingData(): Promise<{
    message: string;
    messageAr: string;
    supportedBanks: any[];
    totalBanks: number;
    activeBanks: number;
  }> {
    this.logger.log('🏦 Retrieving Syrian banking integration data...');

    const activeBanks = SYRIAN_BANKS_DATA.filter(bank => bank.isActive);

    return {
      message: 'Banking data retrieved successfully',
      messageAr: 'تم استرداد البيانات المصرفية بنجاح',
      supportedBanks: SYRIAN_BANKS_DATA,
      totalBanks: SYRIAN_BANKS_DATA.length,
      activeBanks: activeBanks.length,
    };
  }

  /**
   * Validate seeded refund data integrity
   * @returns Promise with validation results
   */
  async validateDataIntegrity(): Promise<{
    message: string;
    messageAr: string;
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    validationErrors: string[];
    performanceMetrics: {
      validationTimeMs: number;
      recordsPerSecond: number;
    };
  }> {
    const startTime = Date.now();
    this.logger.log('🔍 Validating Syrian refund data integrity...');

    const allRefunds = await this.refundRepository.find();
    const validationErrors: string[] = [];
    let validRecords = 0;

    for (const refund of allRefunds) {
      let isValid = true;

      // Validate required fields
      if (!refund.refundReference || !refund.refundStatus || !refund.currency || !refund.amountSyp) {
        validationErrors.push(`Refund ${refund.id}: Missing required fields`);
        isValid = false;
      }

      // Validate amount ranges
      if (refund.amountSyp < PERFORMANCE_TEST_CONFIG.validationRules.minRefundAmount ||
          refund.amountSyp > PERFORMANCE_TEST_CONFIG.validationRules.maxRefundAmount) {
        validationErrors.push(`Refund ${refund.id}: Amount out of valid range`);
        isValid = false;
      }

      // Validate banking information for bank transfers
      if (refund.refundMethod === 'bank_transfer' && (!refund.accountNumber || !refund.swiftCode)) {
        validationErrors.push(`Refund ${refund.id}: Missing banking information for bank transfer`);
        isValid = false;
      }

      if (isValid) {
        validRecords++;
      }
    }

    const validationTime = Date.now() - startTime;
    const recordsPerSecond = Math.round((allRefunds.length / validationTime) * 1000);

    this.logger.log(`✅ Validation complete: ${validRecords}/${allRefunds.length} valid records`);
    if (validationErrors.length > 0) {
      this.logger.warn(`⚠️ Found ${validationErrors.length} validation errors`);
    }

    return {
      message: 'Data integrity validation completed',
      messageAr: 'تم إكمال التحقق من سلامة البيانات',
      totalRecords: allRefunds.length,
      validRecords,
      invalidRecords: allRefunds.length - validRecords,
      validationErrors: validationErrors.slice(0, 10), // Return first 10 errors
      performanceMetrics: {
        validationTimeMs: validationTime,
        recordsPerSecond,
      },
    };
  }

  /**
   * Clean up all seeded refund data
   * @returns Promise with cleanup statistics
   */
  async cleanupSeedData(): Promise<{
    message: string;
    messageAr: string;
    recordsDeleted: number;
    cleanupTimeMs: number;
  }> {
    const startTime = Date.now();
    this.logger.log('🧹 Cleaning up Syrian refund seed data...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.delete(SyrianRefundEntity, {});
      await queryRunner.commitTransaction();

      const cleanupTime = Date.now() - startTime;

      this.logger.log(`✅ Successfully deleted ${result.affected || 0} refund records`);
      this.logger.log(`⚡ Cleanup time: ${cleanupTime}ms`);

      return {
        message: 'Refund seed data cleaned up successfully',
        messageAr: 'تم تنظيف بيانات زرع المرتجعات بنجاح',
        recordsDeleted: result.affected || 0,
        cleanupTimeMs: cleanupTime,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Error cleaning up refund data: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get comprehensive refund seeding statistics
   * @returns Promise with detailed statistics
   */
  async getSeederStatistics(): Promise<{
    message: string;
    messageAr: string;
    overview: {
      totalRefunds: number;
      sampleRefunds: number;
      bulkRefunds: number;
      lastSeededAt: Date | null;
    };
    distribution: {
      byStatus: Record<string, number>;
      byMethod: Record<string, number>;
      byCurrency: Record<string, number>;
      byGovernorate: Record<string, number>;
    };
    performance: {
      avgAmountSyp: number;
      urgentRefundsCount: number;
      completionRate: number;
      avgProcessingTimeHours: number;
    };
  }> {
    this.logger.log('📈 Generating comprehensive refund seeder statistics...');

    const totalRefunds = await this.refundRepository.count();
    
    // Sample refunds (original seed data)
    const sampleRefunds = await this.refundRepository.count({
      where: { refundReference: Like('REF-2025-%') }
    });
    
    const bulkRefunds = totalRefunds - sampleRefunds;

    // Get latest seeded record
    const latestRefund = await this.refundRepository.findOne({
      order: { createdAt: 'DESC' }
    });

    // Status distribution
    const statusDistribution = await this.refundRepository
      .createQueryBuilder('refund')
      .select('refund.refundStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('refund.refundStatus')
      .getRawMany();

    const statusByCount = statusDistribution.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    // Method distribution
    const methodDistribution = await this.refundRepository
      .createQueryBuilder('refund')
      .select('refund.refundMethod', 'method')
      .addSelect('COUNT(*)', 'count')
      .groupBy('refund.refundMethod')
      .getRawMany();

    const methodByCount = methodDistribution.reduce((acc, item) => {
      acc[item.method] = parseInt(item.count);
      return acc;
    }, {});

    // Currency distribution
    const currencyDistribution = await this.refundRepository
      .createQueryBuilder('refund')
      .select('refund.currency', 'currency')
      .addSelect('COUNT(*)', 'count')
      .groupBy('refund.currency')
      .getRawMany();

    const currencyByCount = currencyDistribution.reduce((acc, item) => {
      acc[item.currency] = parseInt(item.count);
      return acc;
    }, {});

    // Governorate distribution
    const governorateDistribution = await this.refundRepository
      .createQueryBuilder('refund')
      .select('refund.governorateId', 'governorate')
      .addSelect('COUNT(*)', 'count')
      .groupBy('refund.governorateId')
      .getRawMany();

    const governorateByCount = governorateDistribution.reduce((acc, item) => {
      acc[`governorate_${item.governorate}`] = parseInt(item.count);
      return acc;
    }, {});

    // Performance metrics
    const { avgAmount } = await this.refundRepository
      .createQueryBuilder('refund')
      .select('AVG(refund.amountSyp)', 'avgAmount')
      .getRawOne();

    const urgentRefundsCount = await this.refundRepository.count({
      where: { isUrgent: true }
    });

    const completedRefundsCount = await this.refundRepository.count({
      where: { refundStatus: SyrianRefundStatus.COMPLETED }
    });

    const completionRate = totalRefunds > 0 ? (completedRefundsCount / totalRefunds * 100) : 0;

    return {
      message: 'Refund seeder statistics generated successfully',
      messageAr: 'تم إنشاء إحصائيات زارع المرتجعات بنجاح',
      overview: {
        totalRefunds,
        sampleRefunds,
        bulkRefunds,
        lastSeededAt: latestRefund?.createdAt || null,
      },
      distribution: {
        byStatus: statusByCount,
        byMethod: methodByCount,
        byCurrency: currencyByCount,
        byGovernorate: governorateByCount,
      },
      performance: {
        avgAmountSyp: parseFloat(avgAmount) || 0,
        urgentRefundsCount,
        completionRate: parseFloat(completionRate.toFixed(2)),
        avgProcessingTimeHours: 64.2, // From analytics data
      },
    };
  }
}

// Import Like operator
import { Like } from 'typeorm';