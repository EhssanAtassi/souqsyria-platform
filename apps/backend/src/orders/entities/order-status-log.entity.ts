import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from './order.entity';

@Entity('order_status_logs')
export class OrderStatusLog {
  @ApiProperty({ description: 'Primary key ID of this log entry' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Order this log refers to', type: () => Order })
  @ManyToOne(() => Order, { nullable: false })
  order: Order;

  @ApiProperty({ description: 'New status after the change', example: 'paid' })
  @Column()
  status: string;

  @ApiProperty({
    description: 'User who changed the status (nullable for system actions)',
    type: () => User,
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true })
  changedBy: User;

  @ApiProperty({
    description: 'Optional comment or reason for the change',
    required: false,
  })
  @Column({ nullable: true })
  comment: string;

  @ApiProperty({ description: 'Timestamp when the change was made' })
  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
