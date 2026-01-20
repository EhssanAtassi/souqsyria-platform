/**
 * @file vendor-membership.entity.ts
 * @description Entity representing vendor's subscription to membership plans.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VendorEntity } from './vendor.entity';
import { Membership } from '../../memberships/entities/membership.entity';

@Entity('vendor_memberships')
export class VendorMembershipEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VendorEntity)
  vendor: VendorEntity;

  @ManyToOne(() => Membership)
  membership: Membership;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
