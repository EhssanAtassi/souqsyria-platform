/**
 * @file customer-payment.controller.ts
 * @description Customer Payment Processing Controller for SouqSyria
 *
 * RESPONSIBILITIES:
 * - Customer payment processing and gateway integration
 * - Payment method management (COD, Bank Transfer, Mobile Payments)
 * - Payment status tracking and confirmation
 * - Payment history for customers
 * - Syrian payment method support (COD, Bank Transfer, OMT, etc.)
 * - Integration with order processing workflow
 *
 * ENDPOINTS:
 * - POST /payments/process - Process customer payment
 * - GET /payments/methods - Get available payment methods
 * - GET /payments/status/:id - Check payment status
 * - GET /payments/history - Get user payment history
 * - POST /payments/confirm/:id - Confirm payment completion
 * - POST /payments/cancel/:id - Cancel pending payment
 * - GET /payments/receipt/:id - Get payment receipt
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
  Param,
  Put,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { PaymentService } from '../service/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import {
  PaymentTransaction,
  PaymentStatus,
  PaymentMethod,
} from '../entities/payment-transaction.entity';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { SyrianPaymentMethodsService } from '../services/syrian-payment-methods.service';

@ApiTags('💳 Customer Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class CustomerPaymentController {
  private readonly logger = new Logger(CustomerPaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly syrianPaymentService: SyrianPaymentMethodsService,
  ) {}

  /**
   * PROCESS CUSTOMER PAYMENT
   *
   * Initiates payment processing for an order with Syrian payment methods
   * Supports COD, bank transfer, mobile payments, and international cards
   */
  @Post('process')
  @ApiOperation({
    summary: 'Process customer payment',
    description:
      'Initiates payment processing for an order with support for Syrian payment methods including COD, bank transfers, and mobile payments',
  })
  @ApiBody({
    type: CreatePaymentDto,
    description: 'Payment processing details',
    examples: {
      codPayment: {
        summary: 'Cash on Delivery (COD)',
        value: {
          orderId: 1001,
          method: 'cash',
          amount: 2750000,
          currency: 'SYP',
          channel: 'mobile',
          payment_details: {
            cod_phone: '+963987654321',
            delivery_instructions: 'Please call before delivery',
          },
        },
      },
      bankTransfer: {
        summary: 'Syrian Bank Transfer',
        value: {
          orderId: 1001,
          method: 'bank_transfer',
          amount: 2750000,
          currency: 'SYP',
          channel: 'web',
          payment_details: {
            bank_name: 'Commercial Bank of Syria',
            account_number: 'CBS-12345',
            transfer_reference: 'TXN-20250808-001',
          },
        },
      },
      mobilePayment: {
        summary: 'Mobile Payment (OMT/Syriatel)',
        value: {
          orderId: 1001,
          method: 'mobile_payment',
          amount: 2750000,
          currency: 'SYP',
          channel: 'mobile',
          payment_details: {
            provider: 'syriatel_cash',
            mobile_number: '+963987654321',
            transaction_id: 'SYR-TXN-12345',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Payment processing initiated successfully',
    schema: {
      example: {
        message: 'Payment processing initiated successfully',
        payment: {
          id: 5001,
          order_id: 1001,
          method: 'cash',
          amount: 2750000,
          currency: 'SYP',
          status: 'pending',
          created_at: '2025-08-08T17:30:00.000Z',
          payment_instructions: {
            cod: {
              message: 'Payment will be collected upon delivery',
              delivery_phone: '+963987654321',
              estimated_delivery: '2025-08-12T00:00:00.000Z',
            },
          },
        },
        next_steps: {
          action: 'wait_for_delivery',
          message:
            'Your order will be delivered within 3-5 business days. Payment will be collected upon delivery.',
          tracking_url: 'https://souqsyria.com/track/1001',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid payment data or insufficient funds',
    schema: {
      examples: {
        invalidAmount: {
          summary: 'Invalid amount',
          value: {
            message: 'Payment amount does not match order total',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
        unsupportedMethod: {
          summary: 'Unsupported payment method',
          value: {
            message: 'Payment method not supported for Syrian market',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async processPayment(
    @CurrentUser() user: UserFromToken,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req,
  ) {
    this.logger.log(
      `User ${user.id} initiating payment for order ${createPaymentDto.orderId}`,
    );

    const userEntity = { id: user.id } as User;
    const payment = await this.paymentService.createPayment(
      userEntity,
      createPaymentDto,
      req.ip,
    );

    // Generate payment instructions based on method
    let paymentInstructions = {};
    let nextSteps = {};

    switch (payment.method) {
      case PaymentMethod.CASH:
        paymentInstructions = {
          cod: {
            message: 'Payment will be collected upon delivery',
            delivery_phone:
              createPaymentDto.payment_details?.cod_phone || user.phone,
            estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        };
        nextSteps = {
          action: 'wait_for_delivery',
          message:
            'Your order will be delivered within 3-5 business days. Payment will be collected upon delivery.',
          tracking_url: `https://souqsyria.com/track/${payment.order.id}`,
        };
        break;

      case 'bank_transfer' as PaymentMethod:
        paymentInstructions = {
          bank_transfer: {
            message: 'Please transfer the amount to the following account',
            bank_details: {
              bank_name: 'Commercial Bank of Syria',
              account_name: 'SouqSyria Trading LLC',
              account_number: 'CBS-SOUQ-2025-001',
              swift_code: 'CBSYSYDM',
              iban: 'SY21CBS00000000123456789',
            },
            reference: `ORDER-${payment.order.id}-${payment.id}`,
            amount: payment.amount,
            currency: payment.currency,
          },
        };
        nextSteps = {
          action: 'complete_transfer',
          message:
            'Please complete the bank transfer and upload the receipt to confirm payment.',
          upload_url: `https://souqsyria.com/payments/${payment.id}/receipt`,
        };
        break;

      case 'mobile_payment' as PaymentMethod:
        paymentInstructions = {
          mobile_payment: {
            message: 'Payment will be processed via mobile payment provider',
            provider:
              createPaymentDto.payment_details?.provider || 'syriatel_cash',
            transaction_id: createPaymentDto.payment_details?.transaction_id,
            confirmation_required: true,
          },
        };
        nextSteps = {
          action: 'confirm_mobile_payment',
          message: 'Please confirm the mobile payment transaction.',
          confirmation_url: `https://souqsyria.com/payments/${payment.id}/confirm`,
        };
        break;
    }

    return {
      message: 'Payment processing initiated successfully',
      payment: {
        id: payment.id,
        order_id: payment.order.id,
        method: payment.method,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.createdAt,
        payment_instructions: paymentInstructions,
      },
      next_steps: nextSteps,
    };
  }

  /**
   * GET AVAILABLE PAYMENT METHODS
   *
   * Returns list of payment methods available in the Syrian market
   * with local bank information and mobile payment providers
   */
  @Get('methods')
  @ApiOperation({
    summary: 'Get available payment methods',
    description:
      'Returns payment methods available for Syrian customers including COD, bank transfers, and mobile payments',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: ['SYP', 'USD'],
    description: 'Filter payment methods by currency',
    example: 'SYP',
  })
  @ApiQuery({
    name: 'order_amount',
    required: false,
    type: Number,
    description: 'Order amount to filter applicable payment methods',
    example: 100000,
  })
  @ApiOkResponse({
    description: 'Available payment methods retrieved successfully',
    schema: {
      example: {
        payment_methods: [
          {
            id: 'cod',
            name: 'Cash on Delivery',
            name_ar: 'الدفع عند الاستلام',
            description: 'Pay when your order is delivered to your address',
            description_ar: 'ادفع عند توصيل طلبك إلى عنوانك',
            icon: 'https://souqsyria.com/icons/cod.svg',
            processing_time: 'Upon delivery',
            fee: 0,
            min_amount: 10000,
            max_amount: 5000000,
            supported_currencies: ['SYP'],
            availability: 'All governorates',
          },
          {
            id: 'bank_transfer',
            name: 'Bank Transfer',
            name_ar: 'حوالة مصرفية',
            description: 'Transfer money directly from your bank account',
            description_ar: 'حول الأموال مباشرة من حسابك المصرفي',
            icon: 'https://souqsyria.com/icons/bank.svg',
            processing_time: '1-2 business days',
            fee: 0,
            min_amount: 50000,
            max_amount: 50000000,
            supported_currencies: ['SYP', 'USD'],
            supported_banks: [
              'Commercial Bank of Syria',
              'Real Estate Bank',
              'Agricultural Cooperative Bank',
              'Industrial Bank',
            ],
          },
          {
            id: 'mobile_payment',
            name: 'Mobile Payment',
            name_ar: 'الدفع عبر الهاتف',
            description:
              'Pay using Syriatel Cash or other mobile payment services',
            description_ar:
              'ادفع باستخدام سيرياتل كاش أو خدمات الدفع المحمول الأخرى',
            icon: 'https://souqsyria.com/icons/mobile-pay.svg',
            processing_time: 'Instant',
            fee: 1000,
            min_amount: 5000,
            max_amount: 2000000,
            supported_currencies: ['SYP'],
            providers: [
              {
                id: 'syriatel_cash',
                name: 'Syriatel Cash',
                logo: 'https://souqsyria.com/logos/syriatel.png',
              },
              {
                id: 'mtn_mobile_money',
                name: 'MTN Mobile Money',
                logo: 'https://souqsyria.com/logos/mtn.png',
              },
            ],
          },
        ],
        recommendations: {
          for_small_orders: 'cod',
          for_large_orders: 'bank_transfer',
          fastest: 'mobile_payment',
          most_secure: 'bank_transfer',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getPaymentMethods(
    @CurrentUser() user: UserFromToken,
    @Query('currency') currency?: string,
    @Query('order_amount') orderAmount?: number,
  ) {
    this.logger.log(`User ${user.id} requesting available payment methods`);

    const paymentMethods =
      await this.syrianPaymentService.getAvailablePaymentMethods(
        orderAmount || 100000,
        currency || 'SYP',
      );

    const recommendations = this.generatePaymentRecommendations(
      orderAmount || 100000,
    );

    return {
      payment_methods: paymentMethods,
      recommendations: recommendations,
      currency: currency || 'SYP',
      user_location: 'Syria', // TODO: Get from user profile
      retrieved_at: new Date(),
    };
  }

  /**
   * GET PAYMENT STATUS
   *
   * Check the current status of a specific payment transaction
   * with detailed information and next steps
   */
  @Get('status/:paymentId')
  @ApiOperation({
    summary: 'Get payment status',
    description:
      'Retrieves the current status and details of a specific payment transaction',
  })
  @ApiParam({
    name: 'paymentId',
    description: 'Payment transaction ID',
    example: 5001,
  })
  @ApiOkResponse({
    description: 'Payment status retrieved successfully',
    schema: {
      example: {
        payment: {
          id: 5001,
          order_id: 1001,
          status: 'pending',
          method: 'cash',
          amount: 2750000,
          currency: 'SYP',
          created_at: '2025-08-08T17:30:00.000Z',
          updated_at: '2025-08-08T17:30:00.000Z',
          status_history: [
            {
              status: 'pending',
              timestamp: '2025-08-08T17:30:00.000Z',
              message: 'Payment initiated - awaiting delivery',
            },
          ],
        },
        order: {
          id: 1001,
          status: 'confirmed',
          estimated_delivery: '2025-08-12T00:00:00.000Z',
        },
        current_status: {
          stage: 'payment_pending',
          message:
            'Your order is being prepared for delivery. Payment will be collected upon delivery.',
          next_action: 'wait_for_delivery',
          progress_percentage: 25,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Payment transaction not found',
  })
  @ApiUnauthorizedResponse({
    description:
      'User not authenticated or not authorized to view this payment',
  })
  async getPaymentStatus(
    @CurrentUser() user: UserFromToken,
    @Param('paymentId') paymentId: number,
  ) {
    this.logger.log(`User ${user.id} checking status of payment ${paymentId}`);

    const payment = await this.paymentService.getTransactionById(
      Number(paymentId),
    );

    // Security check: users can only view their own payments
    if (payment.user.id !== user.id) {
      throw new NotFoundException('Payment transaction not found');
    }

    // Generate current status information
    const currentStatus = this.generateStatusInfo(payment);

    return {
      payment: {
        id: payment.id,
        order_id: payment.order.id,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        currency: payment.currency,
        created_at: payment.createdAt,
        updated_at: payment.updatedAt,
        gateway_transaction_id: payment.gatewayTransactionId,
        status_history: [
          {
            status: payment.status,
            timestamp: payment.createdAt,
            message: this.getStatusMessage(payment.status),
          },
        ],
      },
      order: {
        id: payment.order.id,
        status: payment.order.status,
        estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      current_status: currentStatus,
      checked_at: new Date(),
    };
  }

  /**
   * GET PAYMENT HISTORY
   *
   * Retrieves payment history for the authenticated user
   * with filtering and pagination options
   */
  @Get('history')
  @ApiOperation({
    summary: 'Get user payment history',
    description:
      'Retrieves payment transaction history for the authenticated user with filtering options',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
    description: 'Filter payments by status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit number of results (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination (default: 0)',
    example: 0,
  })
  @ApiOkResponse({
    description: 'Payment history retrieved successfully',
    schema: {
      example: {
        payments: [
          {
            id: 5001,
            order_id: 1001,
            method: 'cash',
            amount: 2750000,
            currency: 'SYP',
            status: 'pending',
            created_at: '2025-08-08T17:30:00.000Z',
            order_summary: {
              total_items: 1,
              main_product: 'Samsung Galaxy S24',
            },
          },
          {
            id: 4999,
            order_id: 999,
            method: 'bank_transfer',
            amount: 450000,
            currency: 'SYP',
            status: 'paid',
            created_at: '2025-08-05T14:20:00.000Z',
            order_summary: {
              total_items: 3,
              main_product: 'iPhone Case Set',
            },
          },
        ],
        summary: {
          total_payments: 15,
          total_amount: 12500000,
          successful_payments: 13,
          pending_payments: 2,
          success_rate: 86.7,
        },
        pagination: {
          limit: 20,
          offset: 0,
          has_more: false,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getPaymentHistory(
    @CurrentUser() user: UserFromToken,
    @Query('status') status?: PaymentStatus,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    this.logger.log(`User ${user.id} requesting payment history`);

    const searchDto = {
      userId: user.id,
      status: status,
    };

    const [payments, totalCount] = await this.paymentService.searchPayments(
      searchDto,
      offset,
      Math.min(limit, 50),
    );

    // Calculate summary statistics
    const successfulPayments = payments.filter(
      (p) => p.status === PaymentStatus.PAID,
    ).length;
    const pendingPayments = payments.filter(
      (p) => p.status === PaymentStatus.PENDING,
    ).length;
    const totalAmount = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const successRate =
      payments.length > 0 ? (successfulPayments / payments.length) * 100 : 0;

    // Transform payments for frontend
    const transformedPayments = payments.map((payment) => ({
      id: payment.id,
      order_id: payment.order?.id,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      created_at: payment.createdAt,
      order_summary: {
        total_items: payment.order?.items?.length || 0,
        main_product:
          payment.order?.items?.[0]?.variant?.product?.nameEn ||
          'Unknown Product',
      },
    }));

    return {
      payments: transformedPayments,
      summary: {
        total_payments: totalCount,
        total_amount: totalAmount,
        successful_payments: successfulPayments,
        pending_payments: pendingPayments,
        success_rate: Math.round(successRate * 10) / 10,
      },
      pagination: {
        limit: limit,
        offset: offset,
        has_more: offset + payments.length < totalCount,
      },
      retrieved_at: new Date(),
    };
  }

  /**
   * CONFIRM PAYMENT
   *
   * Confirms payment completion (for bank transfers, mobile payments, etc.)
   * Allows users to mark their payment as completed with proof
   */
  @Put('confirm/:paymentId')
  @ApiOperation({
    summary: 'Confirm payment completion',
    description:
      'Confirms that payment has been completed by the customer (for bank transfers, mobile payments, etc.)',
  })
  @ApiParam({
    name: 'paymentId',
    description: 'Payment transaction ID to confirm',
    example: 5001,
  })
  @ApiBody({
    description: 'Payment confirmation details',
    schema: {
      type: 'object',
      properties: {
        confirmation_code: {
          type: 'string',
          description: 'Bank reference or mobile payment confirmation code',
          example: 'TXN-20250808-12345',
        },
        receipt_url: {
          type: 'string',
          description: 'URL to uploaded receipt/proof of payment',
          example: 'https://souqsyria.com/receipts/payment-5001-receipt.jpg',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the payment',
          example: 'Transferred from CBS account ending in 1234',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Payment confirmation submitted successfully',
    schema: {
      example: {
        message: 'Payment confirmation submitted successfully',
        payment: {
          id: 5001,
          status: 'pending_verification',
          confirmation_submitted: true,
          confirmation_code: 'TXN-20250808-12345',
        },
        next_steps: {
          message:
            'Your payment confirmation has been submitted. We will verify the payment within 2-4 hours and update your order status.',
          estimated_verification_time: '2025-08-08T21:30:00.000Z',
        },
      },
    },
  })
  async confirmPayment(
    @CurrentUser() user: UserFromToken,
    @Param('paymentId') paymentId: number,
    @Body()
    confirmationData: {
      confirmation_code?: string;
      receipt_url?: string;
      notes?: string;
    },
  ) {
    this.logger.log(`User ${user.id} confirming payment ${paymentId}`);

    const payment = await this.paymentService.getTransactionById(
      Number(paymentId),
    );

    // Security check
    if (payment.user.id !== user.id) {
      throw new NotFoundException('Payment transaction not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment has already been confirmed');
    }

    if (
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.FAILED
    ) {
      throw new BadRequestException(
        'Cannot confirm a cancelled or failed payment',
      );
    }

    // Update payment with confirmation details
    const confirmDto: ConfirmPaymentDto = {
      paymentTransactionId: payment.id,
      gatewayTransactionId: confirmationData.confirmation_code,
      gatewayResponse: {
        confirmation_code: confirmationData.confirmation_code,
        receipt_url: confirmationData.receipt_url,
        customer_notes: confirmationData.notes,
        confirmed_by_customer: true,
        confirmed_at: new Date(),
      },
    };

    // For manual confirmation methods, set to pending verification instead of paid
    // Note: Using existing enum values from PaymentMethod
    if (payment.method === PaymentMethod.WALLET) {
      // TODO: Set status to 'pending_verification' and notify admin
      // For now, we'll use the existing confirm method
    }

    const confirmedPayment =
      await this.paymentService.confirmPayment(confirmDto);

    return {
      message: 'Payment confirmation submitted successfully',
      payment: {
        id: confirmedPayment.id,
        status: confirmedPayment.status,
        confirmation_submitted: true,
        confirmation_code: confirmationData.confirmation_code,
        updated_at: confirmedPayment.updatedAt,
      },
      next_steps: {
        message:
          confirmedPayment.status === PaymentStatus.PAID
            ? 'Payment confirmed! Your order is being processed.'
            : 'Your payment confirmation has been submitted. We will verify the payment within 2-4 hours and update your order status.',
        estimated_verification_time: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      },
    };
  }

  // Helper methods

  private generatePaymentRecommendations(orderAmount: number) {
    const recommendations: any = {
      fastest: 'mobile_payment',
      most_secure: 'bank_transfer',
    };

    if (orderAmount < 100000) {
      recommendations.for_small_orders = 'cod';
      recommendations.recommended = 'cod';
    } else if (orderAmount > 1000000) {
      recommendations.for_large_orders = 'bank_transfer';
      recommendations.recommended = 'bank_transfer';
    } else {
      recommendations.recommended = 'mobile_payment';
    }

    return recommendations;
  }

  private generateStatusInfo(payment: PaymentTransaction) {
    let stage = 'payment_pending';
    let message = 'Payment is being processed';
    let nextAction = 'wait';
    let progressPercentage = 25;

    switch (payment.status) {
      case PaymentStatus.PENDING:
        if (payment.method === PaymentMethod.CASH) {
          stage = 'awaiting_delivery';
          message =
            'Your order is being prepared for delivery. Payment will be collected upon delivery.';
          nextAction = 'wait_for_delivery';
          progressPercentage = 25;
        } else {
          stage = 'awaiting_confirmation';
          message =
            'Please complete the payment using the provided instructions.';
          nextAction = 'complete_payment';
          progressPercentage = 10;
        }
        break;
      case PaymentStatus.PAID:
        stage = 'payment_confirmed';
        message =
          'Payment confirmed successfully. Your order is being processed.';
        nextAction = 'track_order';
        progressPercentage = 100;
        break;
      case PaymentStatus.FAILED:
        stage = 'payment_failed';
        message =
          'Payment failed. Please try again or choose a different payment method.';
        nextAction = 'retry_payment';
        progressPercentage = 0;
        break;
      case PaymentStatus.CANCELLED:
        stage = 'payment_cancelled';
        message = 'Payment was cancelled.';
        nextAction = 'none';
        progressPercentage = 0;
        break;
    }

    return {
      stage,
      message,
      next_action: nextAction,
      progress_percentage: progressPercentage,
    };
  }

  private getStatusMessage(status: PaymentStatus): string {
    const messages = {
      [PaymentStatus.PENDING]: 'Payment initiated - awaiting completion',
      [PaymentStatus.PAID]: 'Payment completed successfully',
      [PaymentStatus.FAILED]: 'Payment failed - please try again',
      [PaymentStatus.CANCELLED]: 'Payment was cancelled',
      [PaymentStatus.REFUNDED]: 'Payment has been refunded',
      [PaymentStatus.PARTIAL]: 'Partial payment received',
      [PaymentStatus.EXPIRED]: 'Payment expired - please initiate new payment',
    };

    return messages[status] || 'Unknown status';
  }
}
