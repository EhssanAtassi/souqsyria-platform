import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Shipment } from '../entities/shipment.entity';
import { ShipmentStatusLog } from '../entities/shipment-status-log.entity';
import { AramexProvider } from '../providers/aramex.provider';
import { DhlProvider } from '../providers/dhl.provider';
import { ShipmentProvider } from '../providers/shipment-provider.interface';

@Injectable()
export class ShipmentTrackingService {
  private readonly logger = new Logger(ShipmentTrackingService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentStatusLog)
    private readonly logRepo: Repository<ShipmentStatusLog>,
    private readonly aramex: AramexProvider,
    private readonly dhl: DhlProvider,
  ) {}

  private getProvider(name?: string): ShipmentProvider | undefined {
    if (!name) return undefined;
    const key = name.toLowerCase();
    if (key.includes('aramex')) return this.aramex;
    if (key.includes('dhl')) return this.dhl;
    return undefined;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async pollCarriers() {
    const shipments = await this.shipmentRepo.find({
      where: { tracking_code: Not(IsNull()), shippingCompany: Not(IsNull()) },
      relations: ['shippingCompany'],
    });

    for (const shipment of shipments) {
      const provider = this.getProvider(shipment.shippingCompany?.name);
      if (!provider) continue;
      try {
        const res = await provider.getStatus(shipment.tracking_code!);
        if (res.status && res.status !== shipment.external_status) {
          const prev = shipment.external_status || 'unknown';
          shipment.external_status = res.status;
          shipment.tracking_url = res.trackingUrl || shipment.tracking_url;
          await this.shipmentRepo.save(shipment);
          await this.logRepo.save({
            shipment,
            from_status: prev,
            to_status: res.status,
            changedBy: null,
          });
        }
      } catch (e: unknown) {
        this.logger.error(
          `Failed to poll carrier for shipment ${shipment.id}: ${(e as Error).message}`,
        );
      }
    }
  }
}
