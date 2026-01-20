/**
 * ✅ This will let us link any product to things like:
 *
 * Waterproof: Yes
 * 5G Support: Yes
 * Wireless Charging: Yes
 * */
/**
 * @file feature.entity.ts
 * @description Defines possible features a product can have (e.g., Waterproof, 5G).
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('features')
export class FeatureEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g., "Waterproof", "Wireless Charging"

  @Column({ type: 'enum', enum: ['boolean', 'text'], default: 'boolean' })
  type: 'boolean' | 'text'; // Controls the format of the value

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
