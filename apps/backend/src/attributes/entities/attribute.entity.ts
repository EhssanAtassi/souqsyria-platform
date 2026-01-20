/**
 * @file attribute.entity.ts
 * @description Production-ready Attribute entity with localization, soft delete, and audit support
 *
 * Defines configurable product options like Color, Size, Storage, etc.
 * Supports Arabic/English localization and enterprise features.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { AttributeValue } from './attribute-value.entity';
import { AttributeType } from './attribute-types.enum';

@Entity('attributes')
@Index(['isActive', 'displayOrder']) // Performance optimization
export class Attribute {
  @PrimaryGeneratedColumn()
  id: number;

  // Multi-language support for Syrian market
  @Column({ length: 100 })
  nameEn: string; // English name (e.g., "Color")

  @Column({ length: 100 })
  nameAr: string; // Arabic name (e.g., "اللون")

  @Column({ type: 'text', nullable: true })
  descriptionEn: string; // English description

  @Column({ type: 'text', nullable: true })
  descriptionAr: string; // Arabic description

  // Attribute configuration
  @Column({
    type: 'enum',
    enum: AttributeType,
    default: AttributeType.SELECT,
  })
  type: AttributeType;

  // Display configuration
  @Column({ default: 0 })
  displayOrder: number; // Order in product forms/filters

  @Column({ default: true })
  isRequired: boolean; // Required for product creation

  @Column({ default: true })
  isFilterable: boolean; // Show in product filters

  @Column({ default: true })
  isSearchable: boolean; // Include in search

  @Column({ default: true })
  isActive: boolean; // Soft disable without delete

  // Validation rules (JSON configuration)
  @Column({ type: 'json', nullable: true })
  validationRules: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customValidation?: string;
  };

  // Relationships
  @OneToMany(() => AttributeValue, (value) => value.attribute, {
    cascade: true,
    eager: false, // Prevent N+1 queries
  })
  values: AttributeValue[];

  // Audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date; // Soft delete support

  @Column({ name: 'created_by', nullable: true })
  createdBy: number; // Admin user who created this

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number; // Last admin who updated this

  // Computed properties for API responses
  get name(): string {
    // Return Arabic for RTL, English for LTR (based on request context)
    return this.nameEn; // Default to English, can be overridden in service
  }

  get description(): string {
    return this.descriptionEn; // Default to English
  }
}
