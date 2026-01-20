/**
 * @file activity-log.entity.ts
 * @description Entity representing logged activities done by admin/staff users.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  action: string; // Example: CREATE_PRODUCT, DELETE_ORDER, UPDATE_VENDOR_STATUS

  @Column({ nullable: true })
  targetTable: string; // products, orders, users...

  @Column({ nullable: true })
  targetId: number;

  @Column({ default: true })
  success: boolean;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
