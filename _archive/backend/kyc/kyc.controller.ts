/**
 * @file kyc.controller.ts
 * @description API Controller for vendors to submit and check KYC documents.
 * Protected by FirebaseAuthGuard. Uses clean logging.
 */
import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { KycService } from './kyc.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('VendorEntity KYC')
@ApiBearerAuth()
@Controller('kyc')
@UseGuards(FirebaseAuthGuard)
export class KycController {
  private readonly logger = new Logger(KycController.name);
  constructor(
    private readonly kycService: KycService,
    private readonly usersService: UsersService,
  ) {}
  /**
   * @route POST /kyc/submit
   * @description VendorEntity submits a KYC document (docType + fileUrl)
   */
  @ApiOperation({ summary: 'Submit a KYC document for verification' })
  @Post('submit')
  async submitKyc(
    @CurrentUser() firebaseUser: { uid: string },
    @Body() body: SubmitKycDto,
  ) {
    this.logger.log(`KYC submit request from UID: ${firebaseUser.uid}`);

    const user =
      await this.usersService.findOrCreateByFirebaseUid(firebaseUser);
    this.logger.log(`User ID: ${user.id}`);

    const hasActive = await this.kycService.hasActiveKyc(user.id);
    if (hasActive) {
      this.logger.warn(
        `User ID: ${user.id} already has an active KYC (pending or approved).`,
      );
      return {
        success: false,
        message:
          'You cannot submit a new KYC while you have a pending or approved document.',
      };
    }
    this.logger.log(`User ID: ${user.id} has no pending KYC`);
    const savedKyc = await this.kycService.submitKycDocument(
      user,
      body.docType,
      body.fileUrl,
    );

    return {
      success: true,
      message: 'KYC document submitted successfully',
      document: {
        id: savedKyc.id,
        type: savedKyc.docType,
        status: savedKyc.status,
        fileUrl: savedKyc.fileUrl,
      },
    };
  }
  /**
   * @route GET /kyc/status
   * @description VendorEntity checks submitted KYC document statuses
   */
  @ApiOperation({ summary: 'Check status of submitted KYC documents' })
  @Get('status')
  async getKycStatus(@CurrentUser() firebaseUser: { uid: string }) {
    this.logger.log(`KYC status request from UID: ${firebaseUser.uid}`);

    const user =
      await this.usersService.findOrCreateByFirebaseUid(firebaseUser);
    const documents = await this.kycService.getUserKycStatus(user.id);

    return {
      success: true,
      documents: documents.map((doc) => ({
        id: doc.id,
        type: doc.docType,
        status: doc.status,
        fileUrl: doc.fileUrl,
        submittedAt: doc.submittedAt,
      })),
    };
  }
}
