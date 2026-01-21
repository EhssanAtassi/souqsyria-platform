/**
 * 📦 OrderItem Entity
 *
 * Represents a single product variant in an order.
 * Includes price and quantity at time of purchase.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';

/**
 * PERF-C01: Database indexes for optimized queries
 * - order: JOINs with order table (order items lookup)
 * - variant: JOINs with product_variant table (product sales analytics)
 */
@Entity('order_items')
@Index(['order'])
@Index(['variant'])
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;
}
