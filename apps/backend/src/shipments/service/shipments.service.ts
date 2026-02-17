/**
 * 🚚 ShipmentsService
 *
 * Manages the full shipment lifecycle:
 * - Partial order shipments
 * - Assignment to shipping company
 * - Status updates (created → delivered)
 * - Delivery confirmation with proof
 * - SLA & delay tracking
 * - Shipment status logs
 */
import { Shipment } from '../entities/shipment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ShipmentItem } from '../entities/shipment-item.entity';
import { ShippingCompany } from '../entities/shipping-company.entity';
import { ShipmentStatusLog } from '../entities/shipment-status-log.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { User } from '../../users/entities/user.entity';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { ConfirmDeliveryDto } from '../dto/confirm-delivery.dto';
import { FilterShipmentsDto } from '../dto/filter-shipments.dto';
import { AramexProvider } from '../providers/aramex.provider';
import { DhlProvider } from '../providers/dhl.provider';
import { ShipmentProvider } from '../providers/shipment-provider.interface';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    @InjectRepository(Shipment)
    private shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentItem)
    private shipmentItemRepo: Repository<ShipmentItem>,
    @InjectRepository(ShippingCompany)
    private companyRepo: Repository<ShippingCompany>,
    @InjectRepository(ShipmentStatusLog)
    private logRepo: Repository<ShipmentStatusLog>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private aramexProvider: AramexProvider,
    private dhlProvider: DhlProvider,
  ) {}

  /**
   * 📦 Creates a new shipment for selected order items.
   */
  async createShipment(
    user: UserFromToken,
    dto: CreateShipmentDto,
  ): Promise<Shipment> {
    this.logger.log(`Creating shipment for order #${dto.order_id}`);

    const order = await this.orderRepo.findOne({
      where: { id: dto.order_id },
    })!;
    if (!order) throw new NotFoundException('Order not found');

    const items = await this.orderItemRepo.findByIds(dto.order_item_ids);
    if (items.length !== dto.order_item_ids.length) {
      throw new BadRequestException('Some order items were not found.');
    }

    const company = await this.companyRepo.findOne({
      where: { id: dto.shipping_company_id },
    });
    if (!company) throw new NotFoundException('Shipping company not found');

    const shipment = this.shipmentRepo.create({
      order,
      shippingCompany: company,
      status: 'CREATED' as any,
      estimated_delivery_at: dto.estimated_delivery_at
        ? new Date(dto.estimated_delivery_at)
        : null,
    });

    await this.shipmentRepo.save(shipment);

    for (const item of items) {
      const shipmentItem = this.shipmentItemRepo.create({
        shipment,
        orderItem: item,
      });
      await this.shipmentItemRepo.save(shipmentItem);
    }

    await this.logRepo.save({
      shipment,
      changedBy: { id: user.id } as any,
      from_status: 'none',
      to_status: 'created',
    });

    const provider = this.getProvider(company.name);
    if (provider) {
      try {
        const res = await provider.registerShipment(shipment);
        shipment.tracking_code = res.trackingCode;
        shipment.tracking_url = res.trackingUrl;
        shipment.external_status = res.status;
        await this.shipmentRepo.save(shipment);
      } catch (e: unknown) {
        this.logger.error(
          `Failed to register shipment with carrier: ${(e as Error).message}`,
        );
      }
    }

    return this.shipmentRepo.findOne({
      where: { id: shipment.id },
      relations: ['items', 'order', 'shippingCompany'],
    });
  }

  /**
   * 🚦 Updates the status of a shipment and logs the transition.
   */
  async updateShipmentStatus(
    user: UserFromToken,
    dto: UpdateShipmentStatusDto,
  ) {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: dto.shipment_id },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const from = shipment.status;
    shipment.status = dto.new_status as any;

    if (dto.new_status === 'delivered') {
      shipment.delivered_at = new Date();
    }

    await this.shipmentRepo.save(shipment);

    await this.logRepo.save({
      shipment,
      changedBy: { id: user.id } as any,
      from_status: from,
      to_status: dto.new_status,
    });

    return shipment;
  }

  private getProvider(name?: string): ShipmentProvider | undefined {
    if (!name) return undefined;
    const key = name.toLowerCase();
    if (key.includes('aramex')) return this.aramexProvider;
    if (key.includes('dhl')) return this.dhlProvider;
    return undefined;
  }

  async getTrackingInfo(id: number) {
    const shipment = await this.shipmentRepo.findOne({
      where: { id },
      relations: ['statusLogs'],
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return {
      tracking_code: shipment.tracking_code,
      tracking_url: shipment.tracking_url,
      external_status: shipment.external_status,
      logs: shipment.statusLogs,
    };
  }

  /**
   * ✅ Confirms delivery of a shipment with proof (photo, signature, OTP).
   */
  async confirmDelivery(user: UserFromToken, dto: ConfirmDeliveryDto) {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: dto.shipment_id },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');

    shipment.proof_type = dto.proof_type;
    shipment.proof_data = dto.proof_data as any;
    shipment.status = 'DELIVERED' as any;
    shipment.delivered_at = new Date();

    await this.shipmentRepo.save(shipment);
    await this.logRepo.save({
      shipment,
      changedBy: { id: user.id } as any,
      from_status: 'out_for_delivery',
      to_status: 'delivered',
    });

    return shipment;
  }

  async getMyShipments(user: UserFromToken): Promise<Shipment[]> {
    this.logger.log(`User ${user.id} fetching their own shipments`);
    return this.shipmentRepo.find({
      where: { order: { user: { id: user.id } } },
      relations: ['items', 'order', 'shippingCompany'],
      order: { created_at: 'DESC' },
    });
  }

  async listAllShipments(filters: FilterShipmentsDto): Promise<Shipment[]> {
    const qb = this.shipmentRepo
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.order', 'order')
      .leftJoinAndSelect('shipment.items', 'items')
      .leftJoinAndSelect('shipment.shippingCompany', 'shippingCompany')
      .orderBy('shipment.created_at', 'DESC');

    if (filters.status) {
      qb.andWhere('shipment.status = :status', { status: filters.status });
    }

    if (filters.order_id) {
      qb.andWhere('shipment.order.id = :orderId', {
        orderId: filters.order_id,
      });
    }

    if (filters.shipping_company_id) {
      qb.andWhere('shipment.shippingCompany.id = :companyId', {
        companyId: filters.shipping_company_id,
      });
    }

    return qb.getMany();
  }
  async createShipmentForOrder(order: Order): Promise<Shipment> {
    // Only create a shipment if one doesn't exist yet for this order
    const existing = await this.shipmentRepo.findOne({
      where: { order: { id: order.id } },
    });
    if (existing) {
      this.logger.warn(`Shipment for order ${order.id} already exists.`);
      return existing;
    }

    // Create the shipment
    const shipment = this.shipmentRepo.create({
      order,
      deliveryAgent: order.user, // or assign to a delivery agent later
      status: 'CREATED' as any,
    });
    await this.shipmentRepo.save(shipment);

    this.logger.log(`Shipment ${shipment.id} created for order ${order.id}`);
    return shipment;
  }
}
