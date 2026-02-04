/**
 * @file stock.controller.ts
 * @description Admin stock endpoints secured with PermissionsGuard and variant-based logic.
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Logger,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GetStockAlertsDto } from './dto/get-stock-alerts.dto';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/stock')
export class StockController {
  private readonly logger = new Logger(StockController.name);

  constructor(private readonly stockService: StockService) {}

  @Get('variant/:id/total')
  @ApiOperation({
    summary: 'Get total stock for a product variant across all warehouses',
  })
  async getVariantStockTotal(@Param('id', ParseIntPipe) id: number) {
    this.logger.verbose(`GET total stock for variant #${id}`);
    return this.stockService.getStock(id);
  }

  @Get('variant/:id/warehouse/:wid')
  @ApiOperation({
    summary: 'Get stock for variant in specific warehouse',
  })
  async getVariantStockAtWarehouse(
    @Param('id', ParseIntPipe) id: number,
    @Param('wid', ParseIntPipe) wid: number,
  ) {
    this.logger.verbose(`GET stock for variant #${id} in warehouse #${wid}`);
    return this.stockService.getStock(id, wid);
  }

  @Post('adjust')
  @ApiOperation({
    summary: 'Adjust variant stock in/out for a warehouse',
  })
  async adjust(@Body() dto: AdjustStockDto) {
    this.logger.verbose(
      `POST adjust: variant #${dto.variant_id}, warehouse #${dto.warehouse_id}, qty ${dto.quantity}, type ${dto.type}`,
    );
    return this.stockService.adjustStock(
      dto.variant_id,
      dto.warehouse_id,
      dto.quantity,
      dto.type,
      dto.note,
    );
  }

  @Post('transfer')
  @ApiOperation({
    summary: 'Transfer variant stock between warehouses',
  })
  async transfer(@Body() dto: TransferStockDto) {
    this.logger.verbose(
      `POST transfer: variant #${dto.variant_id}, from #${dto.from_warehouse_id} to #${dto.to_warehouse_id}, qty ${dto.quantity}`,
    );
    return this.stockService.transferStock(
      dto.variant_id,
      dto.from_warehouse_id,
      dto.to_warehouse_id,
      dto.quantity,
      dto.note,
    );
  }
  @Get('product/:id/total')
  @ApiOperation({
    summary: 'Get total stock for a product (sum of all variant stock)',
  })
  async getTotalProductStock(@Param('id', ParseIntPipe) id: number) {
    this.logger.verbose(`GET total stock for product #${id}`);
    const total = await this.stockService.getTotalProductStock(id);
    return { product_id: id, total_stock: total };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'List stock alerts with optional filters' })
  @ApiQuery({ name: 'warehouse_id', required: false, type: Number })
  @ApiQuery({ name: 'variant_id', required: false, type: Number })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['low_stock', 'critical_stock'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of stock alerts' })
  async getAlerts(@Query() filters: GetStockAlertsDto) {
    this.logger.verbose('GET stock alerts list');
    return this.stockService.getAlerts(filters);
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: 'Get a single stock alert by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Single stock alert object' })
  async getAlert(@Param('id', ParseIntPipe) id: number) {
    this.logger.verbose(`GET stock alert #${id}`);
    return this.stockService.getAlertById(id);
  }

  @Get('alerts/summary')
  @ApiOperation({ summary: 'Get overall stock alert summary (by type)' })
  @ApiResponse({ status: 200, description: 'Alert counts by type' })
  async getStockAlertSummary() {
    this.logger.verbose('GET stock alert summary');
    return this.stockService.getStockAlertSummary();
  }

  /**
   * GET /admin/stock/variant/:variantId
   * Returns stock levels for the given variant across all warehouses
   */
  @Get('variant/:variantId')
  @ApiOperation({ summary: 'View stock per warehouse for a variant' })
  async getVariantStock(@Param('variantId') variantId: number) {
    const stockList =
      await this.stockService.getVariantStockAcrossWarehouses(+variantId);
    if (!stockList.length)
      throw new NotFoundException('No stock found for this variant');
    return stockList;
  }
}
