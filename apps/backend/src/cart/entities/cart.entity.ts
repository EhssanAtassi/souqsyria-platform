/**
 * @file cart.entity.ts
 * @description Enhanced Cart Entity for SouqSyria E-commerce Platform
 *
 * FEATURES:
 * - Single shopping cart per user with session management
 * - Optimistic locking for concurrent cart operations
 * - Multi-currency support for Syrian market (SYP, USD, EUR, TRY)
 * - Cart status tracking (active, abandoned, converting, expired)
 * - Performance optimization with cached totals
 * - Activity tracking for abandonment detection
 *
 * @author SouqSyria Development Team
 * @since 2025-07-02
 * @version 2.0.0
 */

import {
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';
import { GuestSession } from './guest-session.entity';

/**
 * Cart Entity - Represents a shopping cart for SouqSyria customers
 */
@Entity('carts')
export class Cart {
  /**
   * Primary key - Auto-incrementing cart identifier
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Cart owner - User who owns this shopping cart
   * NULLABLE: Guest carts don't have user association
   */
  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  /**
   * User ID - Foreign key reference for performance
   * NULLABLE: Guest carts use sessionId instead
   */
  @Column({ name: 'user_id', type: 'int', nullable: true })
  @Index()
  userId?: number;

  /**
   * Guest Session ID - UUID reference for guest cart persistence
   * NULLABLE: Authenticated user carts don't have session
   * VALIDATION: Cart MUST have either userId OR sessionId (not both, not neither)
   */
  @Column({ name: 'session_id', type: 'varchar', length: 36, nullable: true })
  @Index()
  sessionId?: string;

  /**
   * Guest Session - OneToOne relationship for guest cart management
   * Used for 30-day cart persistence for anonymous users
   */
  @OneToOne(() => GuestSession, (session) => session.cart, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  guestSession?: GuestSession;

  /**
   * Cart Items - Collection of products in the cart
   */
  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: false,
  })
  items: CartItem[];

  /**
   * Optimistic Locking Version - Prevents concurrent modification conflicts
   */
  @VersionColumn()
  version: number;

  /**
   * Cart Status - Current lifecycle state of the cart
   */
  @Column({
    type: 'enum',
    enum: ['active', 'abandoned', 'converting', 'expired'],
    default: 'active',
  })
  @Index()
  status: 'active' | 'abandoned' | 'converting' | 'expired';

  /**
   * Currency Code - Currency for all prices in this cart
   */
  @Column({
    type: 'varchar',
    length: 3,
    default: 'SYP',
  })
  @Index()
  currency: string;

  /**
   * Total Items Count - Cached count of all items in cart
   */
  @Column({
    name: 'total_items',
    type: 'int',
    default: 0,
  })
  totalItems: number;

  /**
   * Total Amount - Cached final cart total including taxes and shipping
   */
  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  /**
   * Last Activity Timestamp - When cart was last modified
   */
  @Column({
    name: 'last_activity_at',
    type: 'datetime',
    nullable: true,
  })
  @Index()
  lastActivityAt?: Date;

  /**
   * Cart Expiration Timestamp - When cart automatically expires
   */
  @Column({
    name: 'expires_at',
    type: 'datetime',
    nullable: true,
  })
  @Index()
  expiresAt?: Date;

  /**
   * Creation Timestamp - When cart was first created
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  created_at: Date;

  /**
   * Last Update Timestamp - When cart was last modified
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updated_at: Date;

  /**
   * Before Update Hook - Automatically update activity timestamp
   */
  @BeforeUpdate()
  updateActivityTimestamp(): void {
    this.lastActivityAt = new Date();
    this.updated_at = new Date();
  }

  /**
   * Check if cart has expired based on expiration timestamp
   * Used for 30-day inactive cart cleanup
   */
  isExpired(): boolean {
    if (!this.updated_at) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.updated_at < thirtyDaysAgo;
  }

  /**
   * Check if cart is considered abandoned (inactive > 24 hours)
   * Used for abandoned cart recovery campaigns
   */
  isAbandoned(): boolean {
    if (!this.updated_at) return false;
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return this.updated_at < twentyFourHoursAgo && this.status === 'active';
  }

  /**
   * Get cart summary for API responses and quick access
   * Returns complete cart information including totals and items
   */
  getSummary(): {
    id: number;
    userId?: number;
    sessionId?: string;
    totalItems: number;
    totalAmount: number;
    currency: string;
    status: string;
    lastUpdated: Date;
  } {
    const totalItems = this.items?.reduce((sum, item) => sum + item.quantity, 0) || this.totalItems;
    const totalAmount = this.items?.reduce((sum, item) => {
      const price = item.effectivePrice ? item.effectivePrice() : item.price_at_add;
      return sum + (price * item.quantity);
    }, 0) || this.totalAmount;

    return {
      id: this.id,
      userId: this.userId,
      sessionId: this.sessionId,
      totalItems,
      totalAmount,
      currency: this.currency || 'SYP',
      status: this.status,
      lastUpdated: this.updated_at,
    };
  }
}
