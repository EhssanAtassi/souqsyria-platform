/**
 * @file stock-alert.entity.ts
 * @description Logs low stock and other inventory alerts for dashboard analytics and vendor visibility.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

@Entity('stock_alerts')
export class StockAlertEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  variant_id: number;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column()
  warehouse_id: number;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  quantity: number;

  @Column({
    type: 'enum',
    enum: ['low_stock', 'critical_stock'],
    default: 'low_stock',
  })
  type: 'low_stock' | 'critical_stock';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
