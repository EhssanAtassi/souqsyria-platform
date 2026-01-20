import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { ProductEntity } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';

@Entity('membership-discount')
export class MembershipDiscountEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Primary key' })
  id: number;

  @Column('decimal', { precision: 5, scale: 2 })
  @ApiProperty({ description: 'Commission percentage (e.g., 7.5)' })
  percentage: number;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({
    description: 'Start date for time-based commission (nullable)',
  })
  valid_from: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'End date for time-based commission (nullable)' })
  valid_to: Date;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Optional note explaining override reason' })
  note: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  @ApiProperty({ description: 'Admin who created this rule' })
  createdBy: User;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ManyToOne(() => VendorEntity, { eager: true })
  @JoinColumn({ name: 'vendor_id' })
  @ApiProperty({ description: 'Target vendor' })
  vendor: VendorEntity;
}
