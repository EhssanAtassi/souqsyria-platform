/**
 * @file vendor.entity.ts
 * @description Entity representing Vendors registered on the platform.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * PERF-C01: Database indexes for optimized queries
 * - user: JOINs with user table (vendor profile lookup)
 * - isVerified + createdAt: Admin queries for vendor verification status
 * - storeName: Store name search queries
 */
@Entity('vendors')
@Index(['user'])
@Index(['isVerified', 'createdAt'])
@Index(['storeName'])
export class VendorEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'store_name', nullable: true })
  storeName: string;

  @Column({ name: 'store_logo_url', nullable: true })
  storeLogoUrl: string;

  @Column({ name: 'store_banner_url', nullable: true })
  storeBannerUrl: string;

  @Column({ name: 'store_description', nullable: true, type: 'text' })
  storeDescription: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
