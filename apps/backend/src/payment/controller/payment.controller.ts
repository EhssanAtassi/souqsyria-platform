import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentService } from '../service/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { AdminOverridePaymentDto } from '../dto/admin-override-payment.dto';
import { SearchPaymentsDto } from '../dto/search-payments.dto';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Initiate a payment for an order.
   * @route POST /payments/create
   */
  @Post('create')
  @ApiOperation({ summary: 'Create/initiate a payment for an order' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, type: PaymentTransaction })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async createPayment(
    @CurrentUser() user: User,
    @Body() dto: CreatePaymentDto,
    @Req() req,
  ) {
    return this.paymentService.createPayment(user, dto, req.ip);
  }

  /**
   * Confirm a payment (manual or gateway callback).
   * @route POST /payments/confirm
   */
  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a payment (manual/gateway)' })
  @ApiBody({ type: ConfirmPaymentDto })
  @ApiResponse({ status: 200, type: PaymentTransaction })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async confirmPayment(
    @Body() dto: ConfirmPaymentDto,
    // Optionally: pass current user if you want for audit trails
  ) {
    return this.paymentService.confirmPayment(dto);
  }

  /**
   * Request a refund for a payment.
   * @route POST /payments/refund
   */
  @Post('refund')
  @ApiOperation({ summary: 'Request a refund for a payment' })
  @ApiBody({ type: RefundPaymentDto })
  @ApiResponse({ status: 201, type: RefundTransaction })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async refundPayment(
    @CurrentUser() user: User,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentService.refundPayment(dto, user);
  }

  /**
   * Admin override of payment status (dangerous operation!).
   * @route POST /payments/admin/override
   */
  @Post('admin/override')
  @ApiOperation({ summary: 'Admin override of payment status' })
  @ApiBody({ type: AdminOverridePaymentDto })
  @ApiResponse({ status: 200, type: PaymentTransaction })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async adminOverridePayment(
    @CurrentUser() adminUser: User,
    @Body() dto: AdminOverridePaymentDto,
  ) {
    return this.paymentService.adminOverridePayment(dto, adminUser);
  }

  /**
   * Search/filter payments (admin only).
   * @route GET /payments/admin/search
   */
  @Get('admin/search')
  @ApiOperation({ summary: 'Search/filter payments (admin)' })
  @ApiResponse({ status: 200, type: [PaymentTransaction] })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async searchPayments(@Query() dto: SearchPaymentsDto) {
    return this.paymentService.searchPayments(dto);
  }
}
