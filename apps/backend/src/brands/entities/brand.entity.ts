/**
 * @file brand.entity.ts
 * @description Entity representing product Brands (e.g., Apple, Samsung).
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductEntity } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ default: true })
  isActive: boolean;

  // === SYRIAN MARKET & LOCALIZATION ===
  @Column({ name: 'name_ar', nullable: true, length: 200 })
  nameAr?: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr?: string;

  @Column({ name: 'country_of_origin', length: 100, nullable: true })
  countryOfOrigin?: string;

  // === VERIFICATION & ENTERPRISE ===
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: ['unverified', 'pending', 'verified', 'rejected', 'revoked'],
    default: 'unverified',
  })
  verificationStatus:
    | 'unverified'
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'revoked';

  @Column({ name: 'trademark_number', length: 100, nullable: true })
  trademarkNumber?: string;

  @Column({
    name: 'verification_type',
    type: 'enum',
    enum: ['official', 'authorized', 'unverified'],
    default: 'unverified',
  })
  verificationType: 'official' | 'authorized' | 'unverified';

  // === APPROVAL WORKFLOW ===
  @Column({
    name: 'approval_status',
    type: 'enum',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    default: 'draft',
  })
  approvalStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: number;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  // === PERFORMANCE & ANALYTICS ===
  @Column({ name: 'product_count', default: 0 })
  productCount: number;

  @Column({
    name: 'popularity_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  popularityScore: number;

  @Column({
    name: 'total_sales_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalSalesSyp: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt?: Date;

  // === AUDIT & ENTERPRISE ===
  @Column({ name: 'created_by', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: number;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: number;

  @Column({ name: 'organization_id', length: 100, nullable: true })
  organizationId?: string;

  // === RELATIONSHIPS ===
  @OneToMany(() => ProductEntity, (product) => product.brand)
  products: ProductEntity[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // === HELPER METHODS ===

  /**
   * Check if brand is ready for public display
   */
  isPublic(): boolean {
    return this.isActive && this.approvalStatus === 'approved';
  }

  /**
   * Check if brand can be edited
   */
  canBeEdited(): boolean {
    return ['draft', 'rejected'].includes(this.approvalStatus);
  }

  /**
   * Check if brand is Syrian
   */
  isSyrian(): boolean {
    return this.countryOfOrigin === 'Syria';
  }

  /**
   * Get display name based on language preference
   */
  getDisplayName(language: 'en' | 'ar' = 'en'): string {
    if (language === 'ar' && this.nameAr) {
      return this.nameAr;
    }
    return this.name;
  }

  /**
   * Get display description based on language preference
   */
  getDisplayDescription(language: 'en' | 'ar' = 'en'): string {
    if (language === 'ar' && this.descriptionAr) {
      return this.descriptionAr;
    }
    return this.descriptionEn || '';
  }
}
