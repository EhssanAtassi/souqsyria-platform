/**
 * @file attribute-value.entity.ts
 * @description Production-ready AttributeValue entity with localization and display control
 *
 * Represents specific values under each Attribute (e.g., Red, Blue, 128GB, XL)
 * Supports Arabic/English localization and ordering.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Attribute } from './attribute.entity';

@Entity('attribute_values')
@Index(['attribute', 'isActive', 'displayOrder']) // Performance optimization
export class AttributeValue {
  @PrimaryGeneratedColumn()
  id: number;

  // Foreign key relationship
  @ManyToOne(() => Attribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute: Attribute;

  @Column({ name: 'attribute_id' })
  attributeId: number; // Explicit FK for queries

  // Multi-language value support
  @Column({ length: 200 })
  valueEn: string; // English value (e.g., "Red", "128GB", "Extra Large")

  @Column({ length: 200 })
  valueAr: string; // Arabic value (e.g., "أحمر", "128 جيجابايت", "كبير جداً")

  // Display configuration
  @Column({ default: 0 })
  displayOrder: number; // Order in dropdowns/filters

  @Column({ default: true })
  isActive: boolean; // Soft disable without delete

  // Visual representation (for colors, images, etc.)
  @Column({ nullable: true, length: 7 })
  colorHex: string; // For color attributes (#FF0000)

  @Column({ nullable: true })
  iconUrl: string; // Icon/image URL for visual representation

  @Column({ nullable: true })
  cssClass: string; // CSS class for styling

  // Additional metadata (JSON for flexibility)
  @Column({ type: 'json', nullable: true })
  metadata: {
    weight?: number; // For size/weight calculations
    price_modifier?: number; // Price adjustment for this option
    sku_suffix?: string; // SKU modification
    stock_impact?: number; // Stock adjustment
    custom_fields?: Record<string, any>;
  };

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
  get value(): string {
    // Return Arabic for RTL, English for LTR (based on request context)
    return this.valueEn; // Default to English, can be overridden in service
  }

  // Utility methods
  isColor(): boolean {
    return this.attribute?.type === 'color' || !!this.colorHex;
  }

  hasIcon(): boolean {
    return !!this.iconUrl;
  }

  getPriceModifier(): number {
    return this.metadata?.price_modifier || 0;
  }
}
