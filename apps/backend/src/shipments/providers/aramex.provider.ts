import { Injectable } from '@nestjs/common';
import { Shipment } from '../entities/shipment.entity';
import { ShipmentProvider } from './shipment-provider.interface';

@Injectable()
export class AramexProvider implements ShipmentProvider {
  async registerShipment(shipment: Shipment) {
    const trackingCode = `ARX-${Date.now()}`;
    return {
      trackingCode,
      trackingUrl: `https://tracking.aramex.com/${trackingCode}`,
      status: 'registered',
    };
  }

  async getStatus(trackingCode: string) {
    return {
      status: 'in_transit',
      trackingUrl: `https://tracking.aramex.com/${trackingCode}`,
    };
  }
}
