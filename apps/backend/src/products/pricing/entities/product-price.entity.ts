/**
 * @file product-price.entity.ts
 * @description Represents the pricing logic per product including commission.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from '../../entities/product.entity';

@Entity('product_prices')
export class ProductPriceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => ProductEntity, (product) => product.pricing, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({
    name: 'discount_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  discountPrice?: number;

  @Column({ type: 'enum', enum: ['SYP', 'USD', 'TRY'], default: 'SYP' })
  currency: 'SYP' | 'USD' | 'TRY';

  @Column({
    name: 'commission_rate',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 0.1,
  })
  commissionRate: number; // Example: 0.15 = 15%

  @Column({ name: 'vendor_receives', type: 'decimal', precision: 10, scale: 2 })
  vendorReceives: number; // Computed in service

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
