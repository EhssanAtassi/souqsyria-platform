import { Shipment } from '../entities/shipment.entity';

export interface ShipmentProvider {
  registerShipment(shipment: Shipment): Promise<{
    trackingCode: string;
    trackingUrl?: string;
    status?: string;
  }>;

  getStatus(trackingCode: string): Promise<{
    status: string;
    trackingUrl?: string;
  }>;
}
