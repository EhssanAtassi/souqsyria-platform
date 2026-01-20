/**
 * 📦 ShipmentItem
 *
 * Maps a shipment to one or more order items.
 */

import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Shipment } from './shipment.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity('shipment_items')
export class ShipmentItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @ManyToOne(() => OrderItem)
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;
}
