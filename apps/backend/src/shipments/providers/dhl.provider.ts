import { Injectable } from '@nestjs/common';
import { Shipment } from '../entities/shipment.entity';
import { ShipmentProvider } from './shipment-provider.interface';

@Injectable()
export class DhlProvider implements ShipmentProvider {
  async registerShipment(shipment: Shipment) {
    const trackingCode = `DHL-${Date.now()}`;
    return {
      trackingCode,
      trackingUrl: `https://www.dhl.com/track/${trackingCode}`,
      status: 'registered',
    };
  }

  async getStatus(trackingCode: string) {
    return {
      status: 'in_transit',
      trackingUrl: `https://www.dhl.com/track/${trackingCode}`,
    };
  }
}
