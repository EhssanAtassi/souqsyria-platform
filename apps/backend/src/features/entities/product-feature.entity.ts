/**
 * @file product-feature.entity.ts
 * @description Join table linking a product to a specific feature and value.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ProductEntity } from '../../products/entities/product.entity';
import { FeatureEntity } from './feature.entity';

@Entity('product_features')
export class ProductFeatureEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductEntity, (product) => product.features, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @ManyToOne(() => FeatureEntity)
  @JoinColumn({ name: 'feature_id' })
  feature: FeatureEntity;

  @Column({ nullable: true })
  value: string;
  // e.g., "Yes", "No", or "Snapdragon 8 Gen 2"

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
