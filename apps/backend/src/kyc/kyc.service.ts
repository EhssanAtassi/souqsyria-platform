/**
 * @file kyc.service.ts
 * @description Handles uploading and management of KYC documents for vendors.
 * Uses Logger for structured logging.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDocument } from './entites/kyc-document.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycDocument)
    private readonly kycRepository: Repository<KycDocument>,
  ) {}

  /**
   * @method submitKycDocument
   * @param user User entity who is submitting KYC
   * @param docType Type of document (e.g., 'national_id', 'business_license')
   * @param fileUrl URL where the document is stored (Firebase Storage)
   * @returns Created KycDocument
   */
  async submitKycDocument(
    user: User,
    docType: string,
    fileUrl: string,
  ): Promise<KycDocument> {
    this.logger.log(
      `Submitting KYC document for User ID: ${user.id}, Type: ${docType}`,
    );

    const kycDoc = this.kycRepository.create({
      user,
      docType,
      fileUrl,
      status: 'pending',
    });

    const savedDoc = await this.kycRepository.save(kycDoc);

    this.logger.log(
      `KYC document submitted successfully with ID: ${savedDoc.id}`,
    );
    return savedDoc;
  }

  /**
   * @method getUserKycStatus
   * @param userId number
   * @returns List of KYC documents and their status
   */
  async getUserKycStatus(userId: number): Promise<KycDocument[]> {
    this.logger.log(`Fetching KYC documents for User ID: ${userId}`);
    return this.kycRepository.find({
      where: { user: { id: userId } },
      order: { submittedAt: 'DESC' },
    });
  }
  /**
   * @method checkPendingKyc
   * @param userId number
   * @returns boolean
   */
  async hasPendingKyc(userId: number): Promise<boolean> {
    const pendingDoc = await this.kycRepository.findOne({
      where: { user: { id: userId }, status: 'pending' },
    });
    return !!pendingDoc; // true if exists
  }
  /**
   * @method hasActiveKyc
   * @description Checks if the user has any pending or approved KYC (not rejected).
   * @param userId number
   * @returns boolean
   */
  async hasActiveKyc(userId: number): Promise<boolean> {
    const activeDoc = await this.kycRepository.findOne({
      where: [
        { user: { id: userId }, status: 'pending' },
        { user: { id: userId }, status: 'approved' },
      ],
    });
    return !!activeDoc; // true if found
  }

  /**
   * @method getPendingKycSubmissions
   * @returns List of pending KYC documents
   */
  async getPendingKycSubmissions(): Promise<KycDocument[]> {
    this.logger.log(`Fetching all pending KYC submissions`);
    return this.kycRepository.find({
      where: { status: 'pending' },
      relations: ['user'],
      order: { submittedAt: 'ASC' },
    });
  }

  /**
   * @method approveKycDocument
   * @description Approve KYC and upgrade user to 'vendor_approved'
   */
  async approveKycDocument(kycId: number): Promise<void> {
    const doc = await this.kycRepository.findOne({
      where: { id: kycId },
      relations: ['user'],
    });

    if (!doc) throw new Error('KYC document not found');
    if (doc.status !== 'pending') throw new Error('KYC is not pending');

    doc.status = 'approved';
    await this.kycRepository.save(doc);

    await this.upgradeVendorRole(doc.user.id);
    this.logger.log(`KYC approved and user promoted. User ID: ${doc.user.id}`);
  }

  /**
   * @method rejectKycDocument
   * @description Reject KYC document
   */
  async rejectKycDocument(kycId: number): Promise<void> {
    const doc = await this.kycRepository.findOne({
      where: { id: kycId },
      relations: ['user'],
    });

    if (!doc) throw new Error('KYC document not found');
    if (doc.status !== 'pending') throw new Error('KYC is not pending');

    doc.status = 'rejected';
    await this.kycRepository.save(doc);
    this.logger.log(`KYC rejected for User ID: ${doc.user.id}`);
  }

  /**
   * @method upgradeVendorRole
   * @description Promotes vendor to 'vendor_approved' role after KYC approval
   */
  private async upgradeVendorRole(userId: number): Promise<void> {
    const user = await this.kycRepository.manager.findOne(User, {
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) throw new Error('User not found');

    const approvedRole = await this.kycRepository.manager.findOne(Role, {
      where: { name: 'vendor_approved' },
    });

    if (!approvedRole) throw new Error('VendorEntity Approved role not found');

    user.role = approvedRole;
    await this.kycRepository.manager.save(user);
    this.logger.log(`User ID: ${userId} upgraded to vendor_approved`);
  }
}
