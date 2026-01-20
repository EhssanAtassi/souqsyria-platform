/**
 * @file syrian-kyc-document.entity.ts
 * @description Enterprise KYC Document Entity with Syrian Regulatory Compliance
 *
 * FEATURES:
 * - Syrian document types (Syrian ID, passport, business license, tax certificate)
 * - Arabic/English localization support
 * - Comprehensive audit trails and compliance tracking
 * - Enterprise workflow integration
 * - Performance optimized with proper indexing
 * - Soft delete functionality for data integrity
 * - Syrian regulatory validation and requirements
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { SyrianKycStatusLog } from './syrian-kyc-status-log.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';
import {
  SyrianKycStatus,
  SyrianKycVerificationLevel,
  SyrianKycDocumentType,
} from '../enums/syrian-kyc.enums';

@Entity('syrian_kyc_documents')
@Index(['status', 'createdAt'])
@Index(['documentType', 'isActive'])
@Index(['verificationLevel'])
export class SyrianKycDocumentEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique KYC document ID' })
  id: number;

  /**
   * Associated user/vendor
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ description: 'User who submitted the document' })
  user: User;

  /**
   * Document type with Syrian classification
   */
  @Column({
    type: 'enum',
    enum: SyrianKycDocumentType,
    nullable: false,
  })
  @Index()
  @ApiProperty({
    description: 'Type of KYC document submitted',
    enum: SyrianKycDocumentType,
    example: SyrianKycDocumentType.SYRIAN_ID,
  })
  documentType: SyrianKycDocumentType;

  /**
   * Document title in English and Arabic
   */
  @Column({ length: 200 })
  @ApiProperty({
    description: 'Document title in English',
    example: 'Syrian National ID Card',
  })
  titleEn: string;

  @Column({ length: 200 })
  @ApiProperty({
    description: 'Document title in Arabic',
    example: 'البطاقة الشخصية السورية',
  })
  titleAr: string;

  /**
   * Current status with workflow integration
   */
  @Column({
    type: 'enum',
    enum: SyrianKycStatus,
    default: SyrianKycStatus.DRAFT,
  })
  @Index()
  @ApiProperty({
    description: 'Current document status',
    enum: SyrianKycStatus,
    example: SyrianKycStatus.UNDER_REVIEW,
  })
  status: SyrianKycStatus;

  /**
   * Verification level for compliance requirements
   */
  @Column({
    type: 'enum',
    enum: SyrianKycVerificationLevel,
    default: SyrianKycVerificationLevel.BASIC,
  })
  @Index()
  @ApiProperty({
    description: 'Required verification level',
    enum: SyrianKycVerificationLevel,
    example: SyrianKycVerificationLevel.BUSINESS,
  })
  verificationLevel: SyrianKycVerificationLevel;

  /**
   * File storage information
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Document file details and storage information',
    example: {
      originalUrl: 'https://storage.souqsyria.com/kyc/syrian_id_123.jpg',
      thumbnailUrl: 'https://storage.souqsyria.com/kyc/thumb_123.jpg',
      fileName: 'syrian_id_123.jpg',
      fileSize: 2048576,
      mimeType: 'image/jpeg',
      uploadedAt: '2025-08-09T10:00:00.000Z',
      checksum: 'sha256:abc123...',
    },
  })
  fileDetails: {
    originalUrl: string;
    thumbnailUrl?: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    checksum?: string;
    encryptionKey?: string;
  };

  /**
   * Document content and validation data
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Extracted document information and validation data',
    example: {
      documentNumber: '12345678901',
      fullName: 'أحمد محمد الأحمد',
      fullNameEn: 'Ahmad Mohammed Al-Ahmad',
      dateOfBirth: '1990-01-15',
      placeOfBirth: 'Damascus',
      placeOfBirthAr: 'دمشق',
      nationality: 'Syrian',
      nationalityAr: 'سوري',
      issueDate: '2020-01-01',
      expiryDate: '2030-01-01',
      issuingAuthority: 'Ministry of Interior',
      issuingAuthorityAr: 'وزارة الداخلية',
    },
  })
  documentData?: {
    documentNumber?: string;
    fullName?: string;
    fullNameEn?: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    placeOfBirthAr?: string;
    nationality?: string;
    nationalityAr?: string;
    gender?: string;
    genderAr?: string;
    issueDate?: string;
    expiryDate?: string;
    issuingAuthority?: string;
    issuingAuthorityAr?: string;
    businessName?: string;
    businessNameAr?: string;
    businessType?: string;
    businessTypeAr?: string;
    registrationNumber?: string;
    taxId?: string;
    chamberNumber?: string;
  };

  /**
   * Syrian address and governorate information
   */
  @ManyToOne(() => SyrianGovernorateEntity, { nullable: true })
  @JoinColumn({ name: 'governorate_id' })
  @ApiProperty({ description: 'Syrian governorate where document was issued' })
  governorate?: SyrianGovernorateEntity;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Address information from document',
    example: {
      addressLine1: 'Damascus, Mazzeh District',
      addressLine1Ar: 'دمشق، حي المزة',
      addressLine2: 'Building 15, Floor 3',
      addressLine2Ar: 'البناء رقم 15، الطابق الثالث',
      postalCode: '12345',
      phone: '+963987654321',
      email: 'ahmad@example.com',
    },
  })
  addressInfo?: {
    addressLine1?: string;
    addressLine1Ar?: string;
    addressLine2?: string;
    addressLine2Ar?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
  };

  /**
   * Validation and compliance information
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Document validation results and compliance scores',
    example: {
      isValid: true,
      validationScore: 95.5,
      complianceLevel: 'HIGH',
      ocrConfidence: 98.2,
      faceMatchScore: 94.1,
      documentAuthenticity: true,
      riskScore: 12.3,
      validationChecks: {
        formatValid: true,
        checksumValid: true,
        expDateValid: true,
        issuerValid: true,
        duplicateCheck: false,
      },
    },
  })
  validationResults?: {
    isValid: boolean;
    validationScore: number;
    complianceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PREMIUM';
    ocrConfidence?: number;
    faceMatchScore?: number;
    documentAuthenticity?: boolean;
    riskScore?: number;
    validationChecks?: {
      formatValid: boolean;
      checksumValid: boolean;
      expDateValid: boolean;
      issuerValid: boolean;
      duplicateCheck: boolean;
    };
    validationErrors?: string[];
    validationWarnings?: string[];
  };

  /**
   * Review and approval information
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  @ApiProperty({ description: 'Admin user who reviewed the document' })
  reviewedBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'When the document was reviewed' })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Review notes in English',
    example: 'Document approved. Clear image quality, all information valid.',
  })
  reviewNotes?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Review notes in Arabic',
    example: 'تمت الموافقة على الوثيقة. جودة صورة واضحة، جميع المعلومات صحيحة.',
  })
  reviewNotesAr?: string;

  /**
   * Expiry and renewal information
   */
  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'When the document expires' })
  expiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'When renewal is required' })
  renewalRequiredAt?: Date;

  @Column({ default: false })
  @ApiProperty({ description: 'Whether renewal notification was sent' })
  renewalNotificationSent: boolean;

  /**
   * Compliance and regulatory information
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Regulatory compliance and risk assessment data',
    example: {
      complianceChecks: {
        sanctionsCheck: 'CLEAR',
        pepsCheck: 'CLEAR',
        amlCheck: 'LOW_RISK',
        kycTier: 'TIER_2',
      },
      riskAssessment: {
        overallRisk: 'LOW',
        riskScore: 15.2,
        riskFactors: ['NEW_CUSTOMER'],
        mitigatingFactors: ['VALID_DOCUMENTS', 'GOOD_REFERENCES'],
      },
      regulatoryFlags: [],
    },
  })
  complianceData?: {
    complianceChecks?: {
      sanctionsCheck: 'CLEAR' | 'FLAGGED' | 'PENDING';
      pepsCheck: 'CLEAR' | 'FLAGGED' | 'PENDING';
      amlCheck: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
      kycTier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
    };
    riskAssessment?: {
      overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      riskScore: number;
      riskFactors: string[];
      mitigatingFactors: string[];
    };
    regulatoryFlags?: string[];
    lastComplianceCheck?: Date;
  };

  /**
   * Workflow and status history
   */
  @OneToMany(() => SyrianKycStatusLog, (log) => log.kycDocument, {
    cascade: true,
  })
  @ApiProperty({ description: 'Status change history for workflow tracking' })
  statusLogs: SyrianKycStatusLog[];

  /**
   * Performance and SLA tracking
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'SLA and performance tracking data',
    example: {
      slaHours: 72,
      expectedReviewTime: '2025-08-12T10:00:00.000Z',
      isOverdue: false,
      hoursOverdue: 0,
      escalationLevel: 0,
      processingTime: 24.5,
      onTimeProcessing: true,
    },
  })
  slaTracking?: {
    slaHours: number;
    expectedReviewTime: Date;
    isOverdue: boolean;
    hoursOverdue: number;
    escalationLevel: number;
    processingTime?: number;
    onTimeProcessing?: boolean;
    delayReasons?: string[];
  };

  /**
   * Active status (soft delete)
   */
  @Column({ default: true })
  @Index()
  @ApiProperty({
    description: 'Whether document is active (soft delete)',
    example: true,
  })
  isActive: boolean;

  /**
   * Priority level for processing
   */
  @Column({
    type: 'enum',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL',
  })
  @ApiProperty({
    description: 'Processing priority level',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    example: 'NORMAL',
  })
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  /**
   * Timestamps with soft delete
   */
  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  @ApiProperty({ description: 'Soft delete timestamp' })
  deletedAt?: Date;

  /**
   * Audit and metadata
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  @ApiProperty({ description: 'IP address of document submission' })
  clientIp?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @ApiProperty({ description: 'User agent of submission' })
  userAgent?: string;

  // Backward compatibility properties
  get submittedAt(): Date {
    return this.createdAt;
  }
  get docType(): string {
    return this.documentType;
  }
  get fileUrl(): string {
    return this.fileDetails?.originalUrl || '';
  }
}
