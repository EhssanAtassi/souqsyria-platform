/**
 * @file stock.service.ts
 * @description Handles stock adjustments, transfers, and queries per variant in warehouse.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockEntity } from './entities/product-stock.entity';
import { StockMovementEntity } from './entities/stock-movement.entity';

import { Warehouse } from '../warehouses/entities/warehouse.entity';
import { StockAlertEntity } from './entities/stock-alert.entity';
import { GetStockAlertsDto } from './dto/get-stock-alerts.dto';
import { ProductVariant } from '../products/variants/entities/product-variant.entity';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectRepository(ProductStockEntity)
    private readonly stockRepo: Repository<ProductStockEntity>,

    @InjectRepository(StockMovementEntity)
    private readonly movementRepo: Repository<StockMovementEntity>,

    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,

    @InjectRepository(StockAlertEntity)
    private readonly alertRepo: Repository<StockAlertEntity>,

    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
  ) {}

  async getStock(variantId: number, warehouseId?: number) {
    if (warehouseId) {
      const record = await this.stockRepo.findOne({
        where: { variant: { id: variantId }, warehouse: { id: warehouseId } },
        relations: ['warehouse'],
      });
      return record?.quantity || 0;
    }

    const sum = await this.stockRepo
      .createQueryBuilder('stock')
      .select('SUM(stock.quantity)', 'total')
      .where('stock.variant_id = :variantId', { variantId })
      .getRawOne();

    return Number(sum.total || 0);
  }

  async adjustStock(
    variantId: number,
    warehouseId: number,
    quantity: number,
    type: 'in' | 'out',
    note?: string,
  ) {
    const variant = await this.variantRepo.findOne({
      where: { id: variantId },
    });
    const warehouse = await this.warehouseRepo.findOne({
      where: { id: warehouseId },
    });

    if (!variant) throw new NotFoundException('Variant not found');
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    let stock = await this.stockRepo.findOne({
      where: { variant: { id: variantId }, warehouse: { id: warehouseId } },
      relations: ['variant', 'warehouse'],
    });

    if (!stock) {
      stock = this.stockRepo.create({
        variant,
        warehouse,
        quantity: 0,
      });
    }

    if (type === 'out' && stock.quantity < quantity) {
      throw new BadRequestException('Insufficient stock for removal');
    }

    stock.quantity += type === 'in' ? quantity : -quantity;
    await this.stockRepo.save(stock);

    await this.movementRepo.save(
      this.movementRepo.create({
        variant,
        fromWarehouse: type === 'out' ? warehouse : null,
        toWarehouse: type === 'in' ? warehouse : null,
        quantity,
        type,
        note,
      }),
    );

    this.logger.log(
      `${type.toUpperCase()} ${quantity} units for variant #${variantId} in warehouse #${warehouseId}`,
    );

    const threshold = 5; // later make configurable per product/vendor

    if (type === 'out' && stock.quantity < threshold) {
      this.logger.warn(
        `LOW STOCK ALERT: Variant #${variantId} now at ${stock.quantity} units`,
      );

      // TODO: Push notification to vendor
      await this.sendLowStockAlert(variant, warehouse, stock.quantity);
    }
    return { success: true, quantity: stock.quantity };
  }

  async transferStock(
    variantId: number,
    fromWarehouseId: number,
    toWarehouseId: number,
    quantity: number,
    note?: string,
  ) {
    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException(
        'Source and target warehouse cannot be the same',
      );
    }

    await this.adjustStock(variantId, fromWarehouseId, quantity, 'out');
    await this.adjustStock(variantId, toWarehouseId, quantity, 'in');

    await this.movementRepo.save(
      this.movementRepo.create({
        variant: { id: variantId },
        fromWarehouse: { id: fromWarehouseId },
        toWarehouse: { id: toWarehouseId },
        quantity,
        type: 'transfer',
        note,
      }),
    );

    this.logger.log(
      `Transferred ${quantity} units of variant #${variantId} from warehouse #${fromWarehouseId} → #${toWarehouseId}`,
    );

    return { success: true };
  }
  private async sendLowStockAlert(
    variant: ProductVariant,
    warehouse: Warehouse,
    quantity: number,
  ) {
    // 🟡 Later: Load vendor contact info or FirebaseToken
    const message = `⚠️ Low Stock: ${variant.variantData?.Color || ''} - ${variant.variantData?.Size || ''} is down to ${quantity} in ${warehouse.name}`;

    // 🧾 Log to DB
    await this.alertRepo.save(
      this.alertRepo.create({
        variant,
        warehouse,
        quantity,
        type: 'low_stock',
      }),
    );
    // TODO: Use FCM Service
    this.logger.log(`[FCM] Would notify vendor: ${message}`);
  }

  async getTotalProductStock(productId: number): Promise<number> {
    const variants = await this.variantRepo.find({
      where: { product: { id: productId } },
      relations: ['stocks'],
    });

    return variants.reduce((sum, variant) => {
      const vSum =
        variant.stocks?.reduce((s, stock) => s + stock.quantity, 0) || 0;
      return sum + vSum;
    }, 0);
  }

  /**
   * API endpoints to list and view stock alerts, so your admin or vendor dashboard can:
   *
   * View all low-stock situations
   *
   * Filter by product, warehouse, type
   *
   * Sort or paginate recent alerts
   */
  async getAlerts(filters: GetStockAlertsDto) {
    const { warehouse_id, variant_id, type, page = 1, limit = 20 } = filters;

    const query = this.alertRepo
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.variant', 'variant')
      .leftJoinAndSelect('alert.warehouse', 'warehouse');

    if (warehouse_id)
      query.andWhere('alert.warehouse_id = :wid', { wid: warehouse_id });
    if (variant_id)
      query.andWhere('alert.variant_id = :vid', { vid: variant_id });
    if (type) query.andWhere('alert.type = :type', { type });

    query.orderBy('alert.created_at', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async getAlertById(id: number) {
    const alert = await this.alertRepo.findOne({
      where: { id },
      relations: ['variant', 'warehouse'],
    });
    if (!alert) throw new NotFoundException('Stock alert not found');
    return alert;
  }

  /**Show a quick overview
   * of how many low stock / critical alerts
   * exist system-wide — useful for
   * dashboard indicators.
   * **/
  async getStockAlertSummary() {
    const result = await this.alertRepo
      .createQueryBuilder('alert')
      .select('alert.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.type')
      .getRawMany();

    const summary: Record<string, number> = {};
    result.forEach((row) => {
      summary[row.type] = Number(row.count);
    });

    return summary;
  }

  /**
   * Returns all stock entries for a specific product variant
   * across all warehouses (with quantity info).
   */
  async getVariantStockAcrossWarehouses(variantId: number) {
    return this.stockRepo.find({
      where: { variant: { id: variantId } },
      relations: ['warehouse'],
      order: { quantity: 'DESC' },
    });
  }
}
