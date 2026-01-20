import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MobileOrdersService } from '../services/mobile-orders.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

/**
 * Mobile Orders Controller
 *
 * Provides order management optimized for mobile applications
 */
@ApiTags('📱 Mobile Orders API v1')
@Controller('api/mobile/v1/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MobileOrdersController {
  constructor(private readonly mobileOrdersService: MobileOrdersService) {}

  /**
   * GET /api/mobile/v1/orders
   * Get user orders optimized for mobile
   */
  @Get()
  @ApiOperation({
    summary: 'Get mobile user orders',
    description: 'Retrieves user orders optimized for mobile display',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  async getMobileOrders(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    return await this.mobileOrdersService.getMobileOrders(
      userId,
      page || 1,
      limit || 10,
    );
  }

  /**
   * GET /api/mobile/v1/orders/:orderId
   * Get order details
   */
  @Get(':orderId')
  @ApiOperation({
    summary: 'Get mobile order details',
    description: 'Retrieves detailed order information for mobile',
  })
  async getMobileOrderDetails(
    @Request() req,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const userId = req.user.id;
    return await this.mobileOrdersService.getMobileOrderDetails(
      userId,
      orderId,
    );
  }

  /**
   * GET /api/mobile/v1/orders/track/:orderNumber
   * Track order status
   */
  @Get('track/:orderNumber')
  @ApiOperation({
    summary: 'Track order status',
    description: 'Track order delivery status and progress',
  })
  async trackOrder(@Request() req, @Param('orderNumber') orderNumber: string) {
    const userId = req.user.id;
    return await this.mobileOrdersService.trackOrder(userId, orderNumber);
  }
}
