/**
 * 🏢 ShippingCompany Entity
 *
 * Represents internal or external shipping providers.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shipping_companies')
export class ShippingCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  type: 'internal' | 'external';

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  tracking_url_template?: string;

  @Column({ nullable: true })
  contact_info?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
