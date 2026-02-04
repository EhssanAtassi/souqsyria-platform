/**
 * @file admin-kyc.controller.ts
 * @description API Controller for admins to review, approve, and reject KYC documents.
 * Only accessible by users with 'admin' role.
 */
import { Controller, Get, Param, Put, UseGuards, Logger } from '@nestjs/common';
import { KycService } from './kyc.service';
import { UsersService } from '../users/users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guards';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('Admin KYC')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('admin/kyc')
export class AdminKycController {
  private readonly logger = new Logger(AdminKycController.name);
  constructor(
    private readonly kycService: KycService,
    private readonly usersService: UsersService,
  ) {}
  /**
   * @route GET /admin/kyc/pending
   * @description List all pending KYC submissions
   */
  @ApiOperation({ summary: 'List all pending KYC submissions' })
  @Get('pending')
  @Roles('admin')
  async getPendingKyc(@CurrentUser() adminUser: { uid: string }) {
    this.logger.log(`Admin UID: ${adminUser.uid} requesting pending KYC list`);

    const pendingDocs = await this.kycService.getPendingKycSubmissions();
    return {
      success: true,
      pending: pendingDocs.map((doc) => ({
        id: doc.id,
        userId: doc.user.id,
        email: doc.user.email,
        docType: doc.docType,
        fileUrl: doc.fileUrl,
        submittedAt: doc.submittedAt,
      })),
    };
  }

  /**
   * @route PUT /admin/kyc/approve/:kycId
   * @description Approve a KYC document and upgrade vendor
   */
  @ApiOperation({ summary: 'Approve a KYC document' })
  @Put('approve/:kycId')
  @Roles('admin')
  async approveKyc(
    @CurrentUser() adminUser: { uid: string },
    @Param('kycId') kycId: number,
  ) {
    this.logger.log(`Admin UID: ${adminUser.uid} approving KYC ID: ${kycId}`);

    await this.kycService.approveKycDocument(kycId);

    return {
      success: true,
      message: `KYC document ${kycId} approved successfully`,
    };
  }

  /**
   * @route PUT /admin/kyc/reject/:kycId
   * @description Reject a KYC document
   */
  @ApiOperation({ summary: 'Reject a KYC document' })
  @Put('reject/:kycId')
  @Roles('admin')
  async rejectKyc(
    @CurrentUser() adminUser: { uid: string },
    @Param('kycId') kycId: number,
  ) {
    this.logger.log(`Admin UID: ${adminUser.uid} rejecting KYC ID: ${kycId}`);

    await this.kycService.rejectKycDocument(kycId);

    return {
      success: true,
      message: `KYC document ${kycId} rejected successfully`,
    };
  }
}
