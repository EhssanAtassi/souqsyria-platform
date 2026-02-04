import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { RefundService } from '../services/refund.service';
import { RefundRequestDto } from '../dto/refund-request.dto';
import { RefundApproveDto } from '../dto/refund-approve.dto';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';

@ApiTags('Refunds')
@ApiBearerAuth()
@Controller('refund')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  /**
   * 💵 Admin or system triggers refund request.
   */
  @Post('initiate')
  @ApiOperation({ summary: 'Initiate refund request' })
  @ApiResponse({ status: 201, description: 'Refund transaction created' })
  async initiateRefund(@Body() dto: RefundRequestDto) {
    return this.refundService.initiateRefund(dto);
  }

  /**
   * ✅ Admin approves or rejects the refund.
   */
  @Put('approve')
  @ApiOperation({ summary: 'Approve or reject refund (Admin only)' })
  @ApiResponse({ status: 200, description: 'Refund updated' })
  async approveRefund(@Body() dto: RefundApproveDto, @Req() req) {
    const adminId = req.user.id;
    return this.refundService.approveRefund(dto, adminId);
  }

  /**
   * 🔍 Get refund status by order ID.
   */
  @Get('status/:orderId')
  @ApiOperation({ summary: 'Get refund status for an order' })
  @ApiResponse({ status: 200, description: 'Refund status returned' })
  async getStatus(@Param('orderId') orderId: number) {
    return this.refundService.getRefundStatusByOrder(orderId);
  }
}
