/**
 * 📡 ShipmentsController
 *
 * Exposes shipment creation, status tracking, delivery confirmation,
 * and assignment logic for internal and external shipping workflows.
 */

import {
  Controller,
  Post,
  Put,
  Body,
  UseGuards,
  Logger,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ShipmentsService } from '../service/shipments.service';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { ConfirmDeliveryDto } from '../dto/confirm-delivery.dto';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { FilterShipmentsDto } from '../dto/filter-shipments.dto';

@ApiTags('Shipments')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('shipments')
export class ShipmentsController {
  private readonly logger = new Logger(ShipmentsController.name);

  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new shipment for order items (admin only)',
  })
  async createShipment(
    @CurrentUser() user: UserFromToken,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.shipmentsService.createShipment(user, dto);
  }

  @Put('status')
  @ApiOperation({ summary: 'Update shipment status (admin or delivery)' })
  async updateStatus(
    @CurrentUser() user: UserFromToken,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.shipmentsService.updateShipmentStatus(user, dto);
  }

  @Put('confirm-delivery')
  @ApiOperation({ summary: 'Confirm delivery with proof (delivery agent)' })
  async confirmDelivery(
    @CurrentUser() user: UserFromToken,
    @Body() dto: ConfirmDeliveryDto,
  ) {
    return this.shipmentsService.confirmDelivery(user, dto);
  }

  // Optional: Add getMyShipments(), getAllShipments() in next phase
  /**
   * 📦 Buyer/Delivery Agent: View own shipments (based on order or delivery assignment)
   */
  @Get('my-shipments')
  @ApiOperation({
    summary: 'Get shipments for current user (buyer or delivery)',
  })
  async getMyShipments(@CurrentUser() user: UserFromToken) {
    return this.shipmentsService.getMyShipments(user);
  }

  /**
   * 🧾 Admin: View all shipments with optional filters (status, company, order ID)
   */
  @Get('admin')
  @ApiOperation({ summary: 'List all shipments with filters (admin only)' })
  async listAllShipments(@Query() filters: FilterShipmentsDto) {
    return this.shipmentsService.listAllShipments(filters);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get tracking information for shipment' })
  async getTracking(@Param('id') id: number) {
    return this.shipmentsService.getTrackingInfo(Number(id));
  }
}
