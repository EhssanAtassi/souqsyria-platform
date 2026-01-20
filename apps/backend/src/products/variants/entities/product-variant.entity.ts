/**
 * @file product-variant.entity.ts
 * @description Entity for product variant combinations (e.g., Color + Size + Storage).
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProductEntity } from '../../entities/product.entity';
import { ProductStockEntity } from '../../../stock/entities/product-stock.entity';
import { IsInt, IsOptional } from 'class-validator';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductEntity, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'variant_data', type: 'json' })
  variantData: Record<string, string>;
  // Example: { "Color": "Red", "Size": "XL" }
  @OneToMany(() => ProductStockEntity, (stock) => stock.variant)
  stocks: ProductStockEntity[];
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  sku: string;
  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true, unique: true })
  slug: string;

  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  weight: number;
  @Column({
    name: 'volume_cm3',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  volume: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
