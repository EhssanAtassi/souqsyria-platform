/**
 * @file permission.entity.ts
 * @description Entity representing available permissions in the system.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // Example: manage_products, view_orders

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true })
  category?: string; // Example: products, orders, users, admin, etc.

  @CreateDateColumn()
  createdAt: Date;
}
