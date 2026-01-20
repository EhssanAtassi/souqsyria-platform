/**
 * 📜 ShipmentStatusLog
 *
 * Logs all status transitions for shipment tracking and audit.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('shipment_status_logs')
export class ShipmentStatusLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedBy: User;

  @Column({ length: 20 })
  from_status: string;

  @Column({ length: 20 })
  to_status: string;

  @CreateDateColumn()
  changed_at: Date;
}
