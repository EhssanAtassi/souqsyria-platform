import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';

@Entity('payment_methods')
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  type: string; // 'credit_card', 'bank_transfer', 'cod', 'digital_wallet'

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'processor_config', type: 'json', nullable: true })
  processorConfig: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({
    name: 'min_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  minAmount: number;

  @Column({
    name: 'max_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxAmount: number;

  @OneToMany(
    () => PaymentTransaction,
    (transaction) => transaction.paymentMethod,
  )
  transactions: PaymentTransaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
