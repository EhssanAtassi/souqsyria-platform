/**
 * @file kyc-seeder.service.ts
 * @description Comprehensive seeder service for Syrian KYC system
 *
 * FEATURES:
 * - Seeds KYC documents with 8-state workflow scenarios
 * - Creates realistic Syrian regulatory compliance test data
 * - Supports bulk seeding operations for performance testing
 * - Handles all Syrian document types with Arabic localization
 * - Complete audit trails and compliance tracking
 * - Enterprise-grade SLA monitoring and escalation scenarios
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { SyrianKycDocumentEntity } from '../entities/syrian-kyc-document.entity';
import { SyrianKycStatusLog } from '../entities/syrian-kyc-status-log.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

import {
  SAMPLE_KYC_DOCUMENTS_SEED,
  SAMPLE_KYC_STATUS_LOGS_SEED,
  BULK_KYC_GENERATION_CONFIG,
} from './kyc-seeds.data';

import {
  SyrianKycStatus,
  SyrianKycVerificationLevel,
  SyrianKycDocumentType,
  SyrianGovernorateCode,
} from '../enums/syrian-kyc.enums';

/**
 * Seeding configuration interface
 */
export interface KycSeedingConfig {
  sampleDocuments: boolean;
  statusLogs: boolean;
  bulkDocuments?: number; // Number of bulk documents to create
  performanceTest?: boolean;
  allWorkflowStates?: boolean; // Create documents in all 8 workflow states
}

/**
 * Seeding statistics and results
 */
export interface KycSeedingStats {
  documentsCreated: number;
  statusLogsCreated: number;
  workflowStatesCreated: number;
  totalExecutionTime: number;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class KycSeederService {
  private readonly logger = new Logger(KycSeederService.name);

  constructor(
    @InjectRepository(SyrianKycDocumentEntity)
    private readonly kycDocumentRepository: Repository<SyrianKycDocumentEntity>,

    @InjectRepository(SyrianKycStatusLog)
    private readonly kycStatusLogRepository: Repository<SyrianKycStatusLog>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(SyrianGovernorateEntity)
    private readonly governorateRepository: Repository<SyrianGovernorateEntity>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Seed all KYC-related data
   */
  async seedAll(config: Partial<KycSeedingConfig> = {}): Promise<KycSeedingStats> {
    const startTime = Date.now();
    const stats: KycSeedingStats = {
      documentsCreated: 0,
      statusLogsCreated: 0,
      workflowStatesCreated: 0,
      totalExecutionTime: 0,
      errors: [],
      warnings: [],
    };

    const finalConfig: KycSeedingConfig = {
      sampleDocuments: true,
      statusLogs: true,
      bulkDocuments: 0,
      performanceTest: false,
      allWorkflowStates: true,
      ...config,
    };

    this.logger.log('🚀 Starting comprehensive KYC system seeding...');

    try {
      // Use transaction for data consistency
      await this.dataSource.transaction(async (manager) => {
        // 1. Seed sample KYC documents
        if (finalConfig.sampleDocuments) {
          stats.documentsCreated = await this.seedSampleKycDocuments(manager);
        }

        // 2. Seed status logs for workflow tracking
        if (finalConfig.statusLogs && stats.documentsCreated > 0) {
          stats.statusLogsCreated = await this.seedKycStatusLogs(manager);
        }

        // 3. Create documents in all workflow states
        if (finalConfig.allWorkflowStates) {
          stats.workflowStatesCreated = await this.seedAllWorkflowStates(manager);
        }

        // 4. Bulk document seeding for performance testing
        if (finalConfig.bulkDocuments && finalConfig.bulkDocuments > 0) {
          const bulkCreated = await this.seedBulkKycDocuments(
            manager,
            finalConfig.bulkDocuments,
          );
          stats.documentsCreated += bulkCreated;
        }
      });

      stats.totalExecutionTime = Date.now() - startTime;

      this.logger.log('✅ KYC seeding completed successfully!');
      this.logger.log(`📊 Statistics:`, {
        ...stats,
        executionTimeMs: stats.totalExecutionTime,
      });

      return stats;
    } catch (error: unknown) {
      stats.errors.push(`Seeding failed: ${(error as Error).message}`);
      stats.totalExecutionTime = Date.now() - startTime;

      this.logger.error('❌ KYC seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed sample KYC documents with realistic scenarios
   */
  private async seedSampleKycDocuments(manager: any): Promise<number> {
    this.logger.log('📋 Seeding sample KYC documents...');

    // Get test users for document assignment
    const users = await manager.find(User, { 
      take: 5,
      order: { id: 'ASC' },
    });

    if (users.length === 0) {
      this.logger.warn('⚠️ No users found for KYC document assignment');
      return 0;
    }

    // Get Syrian governorates
    const governorates = await manager.find(SyrianGovernorateEntity, {
      take: 3,
      order: { id: 'ASC' },
    });

    let created = 0;
    for (let i = 0; i < SAMPLE_KYC_DOCUMENTS_SEED.length; i++) {
      const documentData = SAMPLE_KYC_DOCUMENTS_SEED[i];

      try {
        // Check if document already exists
        const existing = await manager.findOne(SyrianKycDocumentEntity, {
          where: { 
            documentType: documentData.documentType,
            status: documentData.status,
          },
        });

        if (!existing) {
          // Get reviewer for approved/rejected documents
          let reviewedBy: User | null = null;
          if (documentData.status === SyrianKycStatus.APPROVED || 
              documentData.status === SyrianKycStatus.REJECTED ||
              documentData.status === SyrianKycStatus.REQUIRES_CLARIFICATION) {
            reviewedBy = users[Math.floor(Math.random() * users.length)];
          }

          const documentToCreate = {
            ...documentData,
            user: users[i % users.length],
            reviewedBy: reviewedBy,
            governorate: governorates.length > 0 ? governorates[i % governorates.length] : null,
          };

          const kycDocument = manager.create(SyrianKycDocumentEntity, documentToCreate);
          await manager.save(kycDocument);
          created++;

          this.logger.debug(`✅ Created KYC document: ${documentData.titleEn} (${documentData.status})`);
        } else {
          this.logger.debug(`⚠️ KYC document already exists: ${documentData.titleEn}`);
        }
      } catch (error: unknown) {
        this.logger.error(`❌ Failed to create KYC document ${documentData.titleEn}:`, error);
      }
    }

    this.logger.log(`✅ Created ${created} sample KYC documents`);
    return created;
  }

  /**
   * Seed KYC status logs for workflow tracking
   */
  private async seedKycStatusLogs(manager: any): Promise<number> {
    this.logger.log('📝 Seeding KYC status logs...');

    // Get first KYC document for log assignment
    const kycDocument = await manager.findOne(SyrianKycDocumentEntity, {
      where: { status: SyrianKycStatus.APPROVED },
      relations: ['user'],
    });

    if (!kycDocument) {
      this.logger.warn('⚠️ No KYC document found for status log assignment');
      return 0;
    }

    let created = 0;
    for (const logData of SAMPLE_KYC_STATUS_LOGS_SEED) {
      try {
        const statusLog = manager.create(SyrianKycStatusLog, {
          ...logData,
          kycDocument: kycDocument,
          createdByUser: kycDocument.user,
        });

        await manager.save(statusLog);
        created++;

        this.logger.debug(`✅ Created status log: ${logData.newStatus}`);
      } catch (error: unknown) {
        this.logger.error(`❌ Failed to create status log ${logData.newStatus}:`, error);
      }
    }

    this.logger.log(`✅ Created ${created} KYC status logs`);
    return created;
  }

  /**
   * Create KYC documents in all 8 workflow states
   */
  private async seedAllWorkflowStates(manager: any): Promise<number> {
    this.logger.log('🔄 Seeding KYC documents for all workflow states...');

    const users = await manager.find(User, { 
      take: 3,
      order: { id: 'ASC' },
    });

    if (users.length === 0) {
      this.logger.warn('⚠️ No users found for workflow state documents');
      return 0;
    }

    const workflowStates = [
      SyrianKycStatus.DRAFT,
      SyrianKycStatus.SUBMITTED,
      SyrianKycStatus.UNDER_REVIEW,
      SyrianKycStatus.REQUIRES_CLARIFICATION,
      SyrianKycStatus.APPROVED,
      SyrianKycStatus.REJECTED,
      SyrianKycStatus.EXPIRED,
      SyrianKycStatus.SUSPENDED,
    ];

    let created = 0;
    for (let i = 0; i < workflowStates.length; i++) {
      const status = workflowStates[i];

      try {
        // Check if document in this state already exists
        const existing = await manager.findOne(SyrianKycDocumentEntity, {
          where: { status },
        });

        if (!existing) {
          const documentData = {
            documentType: SyrianKycDocumentType.SYRIAN_ID,
            titleEn: `Syrian ID - ${status.toUpperCase()} State`,
            titleAr: `البطاقة السورية - حالة ${this.getArabicStatus(status)}`,
            status,
            verificationLevel: SyrianKycVerificationLevel.BASIC,
            user: users[i % users.length],
            fileDetails: {
              originalUrl: `https://storage.souqsyria.com/kyc/workflow_${status}_${i}.jpg`,
              thumbnailUrl: `https://storage.souqsyria.com/kyc/thumb_${status}_${i}.jpg`,
              fileName: `workflow_${status}_${i}.jpg`,
              fileSize: Math.floor(Math.random() * 3000000) + 500000,
              mimeType: 'image/jpeg',
              uploadedAt: new Date(),
              checksum: `sha256:workflow_${status}_${Math.random().toString(36)}`,
            },
            documentData: {
              documentNumber: `WF-${status.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
              fullName: `Test User ${i + 1}`,
              fullNameEn: `Test User ${i + 1}`,
              dateOfBirth: '1990-01-01',
              nationality: 'Syrian',
              nationalityAr: 'سوري',
            },
            validationResults: {
              isValid: status === SyrianKycStatus.APPROVED,
              validationScore: Math.floor(Math.random() * 50) + (status === SyrianKycStatus.APPROVED ? 50 : 0),
              complianceLevel: 'MEDIUM' as const,
              ocrConfidence: Math.floor(Math.random() * 30) + 70,
              riskScore: Math.floor(Math.random() * 50),
              validationChecks: {
                formatValid: true,
                checksumValid: status !== SyrianKycStatus.REJECTED,
                expDateValid: status !== SyrianKycStatus.EXPIRED,
                issuerValid: true,
                duplicateCheck: false,
              },
            },
            slaTracking: {
              slaHours: 72,
              expectedReviewTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
              isOverdue: status === SyrianKycStatus.REQUIRES_CLARIFICATION,
              hoursOverdue: status === SyrianKycStatus.REQUIRES_CLARIFICATION ? 12 : 0,
              escalationLevel: status === SyrianKycStatus.REQUIRES_CLARIFICATION ? 1 : 0,
              onTimeProcessing: status === SyrianKycStatus.APPROVED,
              delayReasons: status === SyrianKycStatus.REQUIRES_CLARIFICATION ? ['CLARIFICATION_NEEDED'] : [],
            },
            priority: this.getRandomPriority(),
            isActive: status !== SyrianKycStatus.SUSPENDED,
            clientIp: '192.168.1.200',
            userAgent: 'SouqSyria Test Seeder v1.0.0',
          };

          const kycDocument = manager.create(SyrianKycDocumentEntity, documentData);
          await manager.save(kycDocument);
          created++;

          this.logger.debug(`✅ Created workflow state document: ${status}`);
        } else {
          this.logger.debug(`⚠️ Workflow state document already exists: ${status}`);
        }
      } catch (error: unknown) {
        this.logger.error(`❌ Failed to create workflow state document ${status}:`, error);
      }
    }

    this.logger.log(`✅ Created ${created} workflow state documents`);
    return created;
  }

  /**
   * Seed bulk KYC documents for performance testing
   */
  private async seedBulkKycDocuments(manager: any, count: number): Promise<number> {
    this.logger.log(`📈 Seeding ${count} bulk KYC documents for performance testing...`);

    const users = await manager.find(User, { 
      take: 10,
      order: { id: 'ASC' },
    });

    if (users.length === 0) {
      this.logger.warn('⚠️ No users found for bulk KYC document assignment');
      return 0;
    }

    const documents: Partial<SyrianKycDocumentEntity>[] = [];

    for (let i = 0; i < count; i++) {
      const config = BULK_KYC_GENERATION_CONFIG;
      const randomDocType = config.documentTypes[Math.floor(Math.random() * config.documentTypes.length)];
      const randomStatus = config.statuses[Math.floor(Math.random() * config.statuses.length)];
      const randomLevel = config.verificationLevels[Math.floor(Math.random() * config.verificationLevels.length)];
      const randomPriority = config.priorities[Math.floor(Math.random() * config.priorities.length)];

      documents.push({
        documentType: randomDocType,
        titleEn: `Bulk Document ${i + 1} - ${randomDocType}`,
        titleAr: `وثيقة مجمعة ${i + 1} - ${this.getArabicDocumentType(randomDocType)}`,
        status: randomStatus,
        verificationLevel: randomLevel,
        user: users[Math.floor(Math.random() * users.length)],
        fileDetails: {
          originalUrl: `https://storage.souqsyria.com/kyc/bulk_${i + 1}.jpg`,
          thumbnailUrl: `https://storage.souqsyria.com/kyc/thumb_bulk_${i + 1}.jpg`,
          fileName: `bulk_document_${i + 1}.jpg`,
          fileSize: Math.floor(Math.random() * 5000000) + 500000,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
          checksum: `sha256:bulk_${i}_${Math.random().toString(36).substr(2, 9)}`,
        },
        documentData: {
          documentNumber: `BULK-${String(i + 1).padStart(6, '0')}`,
          fullName: `Bulk Test User ${i + 1}`,
          fullNameEn: `Bulk Test User ${i + 1}`,
          dateOfBirth: this.getRandomDate(),
          nationality: 'Syrian',
          nationalityAr: 'سوري',
        },
        validationResults: {
          isValid: Math.random() > 0.3, // 70% valid
          validationScore: Math.floor(Math.random() * 100),
          complianceLevel: this.getRandomComplianceLevel(),
          ocrConfidence: Math.floor(Math.random() * 40) + 60,
          riskScore: Math.floor(Math.random() * 100),
          validationChecks: {
            formatValid: Math.random() > 0.1,
            checksumValid: Math.random() > 0.15,
            expDateValid: Math.random() > 0.05,
            issuerValid: Math.random() > 0.05,
            duplicateCheck: Math.random() < 0.02,
          },
        },
        slaTracking: {
          slaHours: Math.floor(Math.random() * 120) + 24, // 24-144 hours
          expectedReviewTime: new Date(Date.now() + (Math.floor(Math.random() * 120) + 24) * 60 * 60 * 1000),
          isOverdue: Math.random() < 0.1, // 10% overdue
          hoursOverdue: Math.random() < 0.1 ? Math.floor(Math.random() * 24) : 0,
          escalationLevel: Math.floor(Math.random() * 3),
          onTimeProcessing: Math.random() > 0.2, // 80% on time
          delayReasons: [],
        },
        priority: randomPriority,
        isActive: Math.random() > 0.02, // 98% active
        clientIp: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        userAgent: 'Bulk Seeder Agent v1.0.0',
      });
    }

    try {
      // Use chunked inserts for better performance
      const chunkSize = 100;
      let created = 0;

      for (let i = 0; i < documents.length; i += chunkSize) {
        const chunk = documents.slice(i, i + chunkSize);
        const entities = chunk.map((data) => manager.create(SyrianKycDocumentEntity, data));
        await manager.save(entities);
        created += entities.length;

        this.logger.debug(`📋 Bulk created ${entities.length} KYC documents (${created}/${count})`);
      }

      this.logger.log(`✅ Created ${created} bulk KYC documents for performance testing`);
      return created;
    } catch (error: unknown) {
      this.logger.error('❌ Failed to create bulk KYC documents:', error);
      return 0;
    }
  }

  /**
   * Clear all KYC data (use with caution!)
   */
  async clearAllData(): Promise<void> {
    this.logger.warn('🧹 Clearing all KYC data...');

    try {
      await this.dataSource.transaction(async (manager) => {
        // Delete in correct order to avoid foreign key constraints
        await manager.delete(SyrianKycStatusLog, {});
        await manager.delete(SyrianKycDocumentEntity, {});
      });

      this.logger.log('✅ All KYC data cleared successfully');
    } catch (error: unknown) {
      this.logger.error('❌ Failed to clear KYC data:', error);
      throw error;
    }
  }

  /**
   * Get seeding statistics and current data counts
   */
  async getSeedingStats(): Promise<any> {
    const [documentsCount, statusLogsCount] = await Promise.all([
      this.kycDocumentRepository.count(),
      this.kycStatusLogRepository.count(),
    ]);

    // Get documents by status
    const documentsByStatus = await this.kycDocumentRepository
      .createQueryBuilder('doc')
      .select('doc.status, COUNT(*) as count')
      .groupBy('doc.status')
      .getRawMany();

    // Get documents by verification level
    const documentsByLevel = await this.kycDocumentRepository
      .createQueryBuilder('doc')
      .select('doc.verificationLevel, COUNT(*) as count')
      .groupBy('doc.verificationLevel')
      .getRawMany();

    // Get documents by type
    const documentsByType = await this.kycDocumentRepository
      .createQueryBuilder('doc')
      .select('doc.documentType, COUNT(*) as count')
      .groupBy('doc.documentType')
      .getRawMany();

    return {
      overview: {
        totalDocuments: documentsCount,
        statusLogs: statusLogsCount,
      },
      documentsByStatus: documentsByStatus.reduce(
        (acc, item) => {
          acc[item.doc_status] = parseInt(item.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
      documentsByLevel: documentsByLevel.reduce(
        (acc, item) => {
          acc[item.doc_verificationLevel] = parseInt(item.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
      documentsByType: documentsByType.reduce(
        (acc, item) => {
          acc[item.doc_documentType] = parseInt(item.count);
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
      // Check for orphaned status logs
      const orphanedLogs = await this.kycStatusLogRepository
        .createQueryBuilder('log')
        .leftJoin('log.kycDocument', 'doc')
        .where('doc.id IS NULL')
        .getCount();

      if (orphanedLogs > 0) {
        issues.push(`Found ${orphanedLogs} status logs without associated KYC documents`);
      }

      // Check for documents without users
      const documentsWithoutUsers = await this.kycDocumentRepository
        .createQueryBuilder('doc')
        .leftJoin('doc.user', 'user')
        .where('user.id IS NULL')
        .getCount();

      if (documentsWithoutUsers > 0) {
        issues.push(`Found ${documentsWithoutUsers} KYC documents without assigned users`);
      }

      // Check for invalid status transitions
      const invalidStatusDocs = await this.kycDocumentRepository
        .createQueryBuilder('doc')
        .where('doc.status IS NULL')
        .getCount();

      if (invalidStatusDocs > 0) {
        issues.push(`Found ${invalidStatusDocs} KYC documents with invalid status`);
      }

      const summary = await this.getSeedingStats();

      return {
        isValid: issues.length === 0,
        issues,
        summary,
      };
    } catch (error: unknown) {
      issues.push(`Integrity check failed: ${(error as Error).message}`);
      return {
        isValid: false,
        issues,
        summary: null,
      };
    }
  }

  // Helper methods
  private getArabicStatus(status: SyrianKycStatus): string {
    const statusMap = {
      [SyrianKycStatus.DRAFT]: 'المسودة',
      [SyrianKycStatus.SUBMITTED]: 'مُقدم',
      [SyrianKycStatus.UNDER_REVIEW]: 'قيد المراجعة',
      [SyrianKycStatus.REQUIRES_CLARIFICATION]: 'يحتاج توضيح',
      [SyrianKycStatus.APPROVED]: 'موافق عليه',
      [SyrianKycStatus.REJECTED]: 'مرفوض',
      [SyrianKycStatus.EXPIRED]: 'منتهي الصلاحية',
      [SyrianKycStatus.SUSPENDED]: 'معلق',
    };
    return statusMap[status] || status;
  }

  private getArabicDocumentType(type: SyrianKycDocumentType): string {
    const typeMap = {
      [SyrianKycDocumentType.SYRIAN_ID]: 'البطاقة الشخصية',
      [SyrianKycDocumentType.BUSINESS_LICENSE]: 'رخصة العمل',
      [SyrianKycDocumentType.TAX_CERTIFICATE]: 'شهادة ضريبية',
      [SyrianKycDocumentType.CHAMBER_OF_COMMERCE]: 'شهادة غرفة التجارة',
      [SyrianKycDocumentType.BANK_STATEMENT]: 'كشف حساب',
    };
    return typeMap[type] || type;
  }

  private getRandomPriority(): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  private getRandomComplianceLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | 'PREMIUM' {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'PREMIUM'] as const;
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private getRandomDate(): string {
    const start = new Date(1970, 0, 1);
    const end = new Date(2005, 0, 1);
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0];
  }
}