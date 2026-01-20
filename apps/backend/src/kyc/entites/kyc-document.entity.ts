/**
 * @file kyc-document.entity.ts
 * @description KYC Documents uploaded by vendors for verification. Stored in MySQL.
 * Links to users' table and tracks upload status.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('kyc_documents')
export class KycDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'doc_type' })
  docType: string; // e.g., 'national_id', 'business_license'

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string; // Firebase Storage URL

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
