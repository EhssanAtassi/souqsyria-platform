/**
 * @file syrian-kyc.service.ts
 * @description Enterprise Syrian KYC Service with Regulatory Compliance
 *
 * BUSINESS LOGIC:
 * - Comprehensive KYC document management
 * - Syrian regulatory compliance validation
 * - Arabic/English localization support
 * - Performance optimized queries
 * - Integration with workflow engine
 * - Advanced search and filtering
 * - Analytics and reporting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In } from 'typeorm';

import { SyrianKycDocumentEntity } from '../entities/syrian-kyc-document.entity';
import {
  SyrianKycDocumentType,
  SyrianKycStatus,
  SyrianKycVerificationLevel,
} from '../enums/syrian-kyc.enums';
import { SyrianKycStatusLog } from '../entities/syrian-kyc-status-log.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

import {
  SubmitSyrianKycDto,
  ReviewSyrianKycDto,
  KycDocumentQueryDto,
} from '../dto/submit-syrian-kyc.dto';
import { SyrianKycWorkflowService } from './syrian-kyc-workflow.service';

/**
 * Paginated KYC documents response
 */
export interface PaginatedKycDocuments {
  documents: SyrianKycDocumentEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * KYC compliance summary
 */
export interface KycComplianceSummary {
  userId: number;
  overallStatus: 'INCOMPLETE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationLevel: SyrianKycVerificationLevel;
  documentsRequired: number;
  documentsSubmitted: number;
  documentsApproved: number;
  complianceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastUpdate: Date;
  expiryDate?: Date;
  requiredActions: string[];
  requiredActionsAr: string[];
}

@Injectable()
export class SyrianKycService {
  private readonly logger = new Logger(SyrianKycService.name);

  constructor(
    @InjectRepository(SyrianKycDocumentEntity)
    private readonly kycDocumentRepository: Repository<SyrianKycDocumentEntity>,

    @InjectRepository(SyrianKycStatusLog)
    private readonly statusLogRepository: Repository<SyrianKycStatusLog>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(SyrianGovernorateEntity)
    private readonly governorateRepository: Repository<SyrianGovernorateEntity>,

    private readonly workflowService: SyrianKycWorkflowService,
  ) {}

  /**
   * Submit a new KYC document
   */
  async submitKycDocument(
    user: User,
    submitDto: SubmitSyrianKycDto,
    clientIp?: string,
    userAgent?: string,
  ): Promise<SyrianKycDocumentEntity> {
    this.logger.log(
      `User ${user.id} submitting KYC document type: ${submitDto.documentType}`,
    );

    // Check if user already has an active document of this type
    const existingDoc = await this.kycDocumentRepository.findOne({
      where: {
        user: { id: user.id },
        documentType: submitDto.documentType,
        status: In([
          SyrianKycStatus.SUBMITTED,
          SyrianKycStatus.UNDER_REVIEW,
          SyrianKycStatus.APPROVED,
        ]),
        isActive: true,
      },
    });

    if (existingDoc) {
      throw new ConflictException(
        `You already have an active ${submitDto.documentType} document. Please wait for review completion or contact support.`,
      );
    }

    // Validate file details
    await this.validateFileDetails(submitDto.fileDetails);

    // Get governorate if provided
    let governorate: SyrianGovernorateEntity | undefined;
    if (submitDto.governorateId) {
      governorate = await this.governorateRepository.findOne({
        where: { id: submitDto.governorateId },
      });

      if (!governorate) {
        throw new BadRequestException(
          `Syrian governorate ${submitDto.governorateId} not found`,
        );
      }
    }

    // Create the KYC document
    const kycDocument = this.kycDocumentRepository.create({
      user,
      documentType: submitDto.documentType,
      titleEn: submitDto.titleEn,
      titleAr: submitDto.titleAr,
      verificationLevel: submitDto.verificationLevel,
      status: SyrianKycStatus.DRAFT,
      fileDetails: {
        ...submitDto.fileDetails,
        uploadedAt: new Date(),
      },
      documentData: submitDto.documentData,
      addressInfo: submitDto.addressInfo,
      governorate,
      priority: submitDto.priority || 'NORMAL',
      clientIp,
      userAgent,
      isActive: true,
    });

    const savedDocument = await this.kycDocumentRepository.save(kycDocument);

    // Initialize workflow
    await this.workflowService.initializeKycWorkflow(savedDocument.id);

    this.logger.log(`KYC document ${savedDocument.id} submitted successfully`);
    return savedDocument;
  }

  /**
   * Get user's KYC documents
   */
  async getUserKycDocuments(
    userId: number,
    includeInactive: boolean = false,
  ): Promise<SyrianKycDocumentEntity[]> {
    const whereConditions: FindOptionsWhere<SyrianKycDocumentEntity> = {
      user: { id: userId },
    };

    if (!includeInactive) {
      whereConditions.isActive = true;
    }

    return this.kycDocumentRepository.find({
      where: whereConditions,
      relations: ['governorate', 'reviewedBy', 'statusLogs'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get KYC document by ID
   */
  async getKycDocumentById(
    id: number,
    includeInactive: boolean = false,
  ): Promise<SyrianKycDocumentEntity> {
    const whereConditions: FindOptionsWhere<SyrianKycDocumentEntity> = { id };

    if (!includeInactive) {
      whereConditions.isActive = true;
    }

    const document = await this.kycDocumentRepository.findOne({
      where: whereConditions,
      relations: ['user', 'governorate', 'reviewedBy', 'statusLogs'],
    });

    if (!document) {
      throw new NotFoundException(`KYC document ${id} not found`);
    }

    return document;
  }

  /**
   * Search and filter KYC documents (admin function)
   */
  async searchKycDocuments(
    queryDto: KycDocumentQueryDto,
  ): Promise<PaginatedKycDocuments> {
    const queryBuilder = this.kycDocumentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.user', 'user')
      .leftJoinAndSelect('document.governorate', 'governorate')
      .leftJoinAndSelect('document.reviewedBy', 'reviewedBy')
      .where('document.isActive = :isActive', { isActive: true });

    // Apply filters
    if (queryDto.documentType) {
      queryBuilder.andWhere('document.documentType = :documentType', {
        documentType: queryDto.documentType,
      });
    }

    if (queryDto.status) {
      queryBuilder.andWhere('document.status = :status', {
        status: queryDto.status,
      });
    }

    if (queryDto.verificationLevel) {
      queryBuilder.andWhere('document.verificationLevel = :verificationLevel', {
        verificationLevel: queryDto.verificationLevel,
      });
    }

    if (queryDto.governorateId) {
      queryBuilder.andWhere('document.governorate.id = :governorateId', {
        governorateId: queryDto.governorateId,
      });
    }

    if (queryDto.priority) {
      queryBuilder.andWhere('document.priority = :priority', {
        priority: queryDto.priority,
      });
    }

    if (queryDto.overdueOnly) {
      // Add overdue logic - documents that exceed their SLA
      const overdueDate = new Date();
      overdueDate.setHours(overdueDate.getHours() - 72); // 72 hours SLA

      queryBuilder
        .andWhere('document.updatedAt < :overdueDate', { overdueDate })
        .andWhere('document.status IN (:...pendingStatuses)', {
          pendingStatuses: [
            SyrianKycStatus.SUBMITTED,
            SyrianKycStatus.UNDER_REVIEW,
            SyrianKycStatus.REQUIRES_CLARIFICATION,
          ],
        });
    }

    // Count total before pagination
    const total = await queryBuilder.getCount();

    // Apply sorting
    queryBuilder.orderBy(`document.${queryDto.sortBy}`, queryDto.sortOrder);

    // Apply pagination
    const offset = (queryDto.page - 1) * queryDto.limit;
    queryBuilder.skip(offset).take(queryDto.limit);

    const documents = await queryBuilder.getMany();

    return {
      documents,
      total,
      page: queryDto.page,
      limit: queryDto.limit,
      totalPages: Math.ceil(total / queryDto.limit),
    };
  }

  /**
   * Review KYC document (approve/reject)
   */
  async reviewKycDocument(
    documentId: number,
    reviewDto: ReviewSyrianKycDto,
    reviewerId: number,
  ): Promise<SyrianKycDocumentEntity> {
    this.logger.log(
      `Admin ${reviewerId} reviewing KYC document ${documentId} - ${reviewDto.status}`,
    );

    const document = await this.getKycDocumentById(documentId);

    // Validate current status allows review
    if (
      ![SyrianKycStatus.SUBMITTED, SyrianKycStatus.UNDER_REVIEW].includes(
        document.status,
      )
    ) {
      throw new BadRequestException(
        `Cannot review document in ${document.status} status`,
      );
    }

    // Transition to new status using workflow service
    const updatedDocument = await this.workflowService.transitionStatus(
      documentId,
      reviewDto.status,
      reviewerId,
      reviewDto.reviewNotes,
      reviewDto.reviewNotesAr,
      {
        reviewNotes: reviewDto.reviewNotes,
        reviewNotesAr: reviewDto.reviewNotesAr,
        sendNotification: reviewDto.sendNotification,
      },
    );

    this.logger.log(`KYC document ${documentId} reviewed: ${reviewDto.status}`);
    return updatedDocument;
  }

  /**
   * Get user's KYC compliance summary
   */
  async getUserKycComplianceSummary(
    userId: number,
  ): Promise<KycComplianceSummary> {
    const userDocuments = await this.getUserKycDocuments(userId, false);

    // Define required documents for different verification levels
    const requiredDocuments = this.getRequiredDocumentsForUser(userId); // Simplified

    const documentsRequired = requiredDocuments.length;
    const documentsSubmitted = userDocuments.length;
    const documentsApproved = userDocuments.filter(
      (d) => d.status === SyrianKycStatus.APPROVED,
    ).length;

    // Calculate compliance score
    const complianceScore =
      documentsRequired > 0
        ? Math.round((documentsApproved / documentsRequired) * 100)
        : 0;

    // Determine overall status
    let overallStatus: KycComplianceSummary['overallStatus'] = 'INCOMPLETE';
    if (userDocuments.some((d) => d.status === SyrianKycStatus.EXPIRED)) {
      overallStatus = 'EXPIRED';
    } else if (
      userDocuments.some((d) => d.status === SyrianKycStatus.REJECTED)
    ) {
      overallStatus = 'REJECTED';
    } else if (
      documentsApproved === documentsRequired &&
      documentsRequired > 0
    ) {
      overallStatus = 'APPROVED';
    } else if (
      userDocuments.some((d) =>
        [SyrianKycStatus.SUBMITTED, SyrianKycStatus.UNDER_REVIEW].includes(
          d.status,
        ),
      )
    ) {
      overallStatus = 'PENDING';
    }

    // Determine risk level
    const riskLevel: KycComplianceSummary['riskLevel'] =
      complianceScore >= 90
        ? 'LOW'
        : complianceScore >= 70
          ? 'MEDIUM'
          : complianceScore >= 50
            ? 'HIGH'
            : 'CRITICAL';

    // Required actions
    const requiredActions: string[] = [];
    const requiredActionsAr: string[] = [];

    if (documentsApproved < documentsRequired) {
      requiredActions.push('Complete missing KYC documents');
      requiredActionsAr.push('أكمل الوثائق المطلوبة للتحقق');
    }

    // Check for expired documents
    const expiredDocs = userDocuments.filter(
      (d) => d.expiresAt && new Date(d.expiresAt) < new Date(),
    );
    if (expiredDocs.length > 0) {
      requiredActions.push('Renew expired documents');
      requiredActionsAr.push('جدد الوثائق منتهية الصلاحية');
    }

    return {
      userId,
      overallStatus,
      verificationLevel: SyrianKycVerificationLevel.BASIC, // Simplified
      documentsRequired,
      documentsSubmitted,
      documentsApproved,
      complianceScore,
      riskLevel,
      lastUpdate: userDocuments[0]?.updatedAt || new Date(),
      requiredActions,
      requiredActionsAr,
    };
  }

  /**
   * Get pending KYC documents for admin review
   */
  async getPendingKycDocuments(): Promise<SyrianKycDocumentEntity[]> {
    return this.kycDocumentRepository.find({
      where: {
        status: In([SyrianKycStatus.SUBMITTED, SyrianKycStatus.UNDER_REVIEW]),
        isActive: true,
      },
      relations: ['user', 'governorate'],
      order: { priority: 'ASC', createdAt: 'ASC' }, // Priority first, then FIFO
    });
  }

  /**
   * Soft delete KYC document
   */
  async deleteKycDocument(documentId: number, userId: number): Promise<void> {
    const document = await this.getKycDocumentById(documentId);

    // Check if user owns the document or is admin
    if (document.user.id !== userId) {
      // TODO: Check if user is admin
      throw new BadRequestException(
        'You can only delete your own KYC documents',
      );
    }

    // Cannot delete approved documents
    if (document.status === SyrianKycStatus.APPROVED) {
      throw new BadRequestException('Cannot delete approved KYC documents');
    }

    document.isActive = false;
    document.deletedAt = new Date();
    await this.kycDocumentRepository.save(document);

    this.logger.log(
      `KYC document ${documentId} soft deleted by user ${userId}`,
    );
  }

  /**
   * Get KYC analytics for admin dashboard
   */
  async getKycAnalytics(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const metrics = await this.workflowService.getWorkflowMetrics(
      startDate,
      endDate,
    );

    // Additional analytics
    const recentDocuments = await this.kycDocumentRepository
      .createQueryBuilder('document')
      .where('document.createdAt >= :startDate', { startDate })
      .andWhere('document.isActive = :isActive', { isActive: true })
      .getCount();

    const approvalRate =
      metrics.totalDocuments > 0
        ? ((metrics.statusDistribution[SyrianKycStatus.APPROVED] || 0) /
            metrics.totalDocuments) *
          100
        : 0;

    return {
      ...metrics,
      recentDocuments,
      approvalRate,
      period: {
        startDate,
        endDate,
        days,
      },
    };
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private async validateFileDetails(fileDetails: any): Promise<void> {
    // Validate file size (max 50MB)
    if (fileDetails.fileSize > 50 * 1024 * 1024) {
      throw new BadRequestException('File size cannot exceed 50MB');
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(fileDetails.mimeType)) {
      throw new BadRequestException(
        `File type ${fileDetails.mimeType} is not supported. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validate URL accessibility (simplified)
    if (!fileDetails.originalUrl.startsWith('https://')) {
      throw new BadRequestException('File URL must use HTTPS');
    }
  }

  private getRequiredDocumentsForUser(userId: number): SyrianKycDocumentType[] {
    // Simplified logic - in real app, this would be more complex based on user type, business requirements, etc.
    return [
      SyrianKycDocumentType.SYRIAN_ID,
      SyrianKycDocumentType.BUSINESS_LICENSE,
    ];
  }
}
