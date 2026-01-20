/**
 * @file wishlist.entity.ts
 * @description Wishlist items for users (customer-facing).
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

import { ProductEntity } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity'; // Or ProductVariant if you want variant-level

@Entity('wishlists')
@Unique(['user', 'product'])
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.wishlist, { eager: false })
  user: User;

  @ManyToOne(() => ProductEntity, { eager: false })
  product: ProductEntity;

  // For variant-level wishlists (optional):
  @ManyToOne(() => ProductVariant, { nullable: true })
  productVariant: ProductVariant;

  @Column({ nullable: true })
  shareToken?: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date; // Softly delete if you want to support undo
}
