/**
 * @file product-image.entity.ts
 * @description Entity for product gallery images (up to 8 images per product).
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';
@Index(['product', 'sortOrder'], { unique: true })
@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductEntity, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number; // 0 = main image

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
