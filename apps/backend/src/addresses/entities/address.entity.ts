import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Region } from '../region/entities/region.entity';
import { Country } from '../country/entities/country.entity';
import { City } from '../city/entities/city.entity';

/**
 * @file address.entity.ts
 * @description Stores user addresses (shipping, billing) for SouqSyria.
 * Supports multi-address, default, notes, GPS, and lookup tables.
 */
@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The user this address belongs to
   */
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Human-readable label (e.g., "Home", "Work")
   */
  @Column({ nullable: true })
  label: string;

  /**
   * Type: "shipping" or "billing" (could be enum)
   */
  @Column({ default: 'shipping' })
  addressType: 'shipping' | 'billing';

  /**
   * Country relation (normalized)
   */
  @ManyToOne(() => Country, { nullable: false })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  /**
   * Region/State relation (normalized)
   */
  @ManyToOne(() => Region, { nullable: true })
  @JoinColumn({ name: 'region_id' })
  region: Region;

  /**
   * City relation (normalized)
   */
  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City;

  /**
   * Main address line (street, building, etc.)
   */
  @Column()
  addressLine1: string;

  /**
   * Optional address line (apartment, suite, etc.)
   */
  @Column({ nullable: true })
  addressLine2: string;

  /**
   * Zip or postal code
   */
  @Column({ nullable: true })
  postalCode: string;

  /**
   * Contact phone for delivery
   */
  @Column()
  phone: string;

  /**
   * Extra notes (e.g., "Ring the bell", "Leave at reception")
   */
  @Column({ nullable: true })
  notes: string;

  /**
   * Is this the user's default address? (per type)
   */
  @Column({ default: false })
  isDefault: boolean;

  /**
   * Latitude for GPS (nullable)
   */
  @Column('decimal', { nullable: true, precision: 10, scale: 7 })
  latitude: number;

  /**
   * Longitude for GPS (nullable)
   */
  @Column('decimal', { nullable: true, precision: 10, scale: 7 })
  longitude: number;

  /**
   * Soft delete column
   */
  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  /**
   * Timestamps
   */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
