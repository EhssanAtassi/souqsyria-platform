/**
 * 🛒 CartItem Entity (Enhanced with Inventory Reservation - Week 4)
 *
 * Represents a product variant added to a user's cart with enterprise-grade
 * inventory reservation system to prevent overselling during high traffic.
 *
 * FEATURES:
 * - 💰 Price Lock: 7-day price guarantee (customer protection)
 * - 🏭 Inventory Reservation: 15-minute timeout (prevents overselling)
 * - 📊 Campaign Tracking: Source attribution for marketing analytics
 * - 🎯 Attribute Selection: Product variant configurations (size, color, etc.)
 * - ⏰ Expiration Handling: Flash sales and limited-time offers support
 *
 * DUAL-LOCKING MECHANISM:
 * 1. Price Lock (7 days): Protects customer from price increases during checkout
 * 2. Inventory Reservation (15 min): Reserves stock to prevent race conditions
 *
 * These locks operate independently with different timeouts optimized for
 * their respective business needs (customer satisfaction vs inventory efficiency).
 *
 * @version 4.0.0 - Week 4 Enterprise Features
 * @author SouqSyria Development Team
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { ReservationStatus } from '../../stock/entities/inventory-reservation.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ManyToOne(() => ProductVariant, { eager: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ type: 'int' })
  quantity: number;

  // 💰 Snapshot of original price when item was added
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_at_add: number;

  // 🏷️ Optional discounted price if part of promotion at the time
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_discounted: number;

  // 📅 Timestamp when item was added to cart (for price lock tracking)
  @Column({ type: 'datetime', nullable: true })
  added_at?: Date;

  // 🔒 Price lock expiration timestamp (added_at + 7 days)
  @Column({ type: 'datetime', nullable: true })
  locked_until?: Date;

  // 🎯 Attributes selected during add-to-cart (e.g., color, size)
  @Column({ type: 'json', nullable: true })
  selected_attributes: Record<string, any>;

  // 🛡️ Validity flag — auto-marked false if product/price changes
  @Column({ default: true })
  valid: boolean;

  // ⏰ Optional expiration (e.g., for limited offers, flash sales, sessions)
  @Column({ type: 'datetime', nullable: true })
  expires_at?: Date;

  // 📊 Optional campaign/tracking reference
  @Column({ type: 'varchar', length: 100, nullable: true })
  added_from_campaign?: string;

  // 🗑️ Soft-delete timestamp for undo-remove feature (5-second undo window)
  @Column({ type: 'datetime', nullable: true })
  removed_at?: Date;

  // ══════════════════════════════════════════════════════════════════════════
  // 🏭 INVENTORY RESERVATION (Week 4 Enterprise Feature)
  // ══════════════════════════════════════════════════════════════════════════
  // Prevents overselling during high traffic by reserving inventory when item
  // is added to cart. Reservation automatically expires after timeout (default: 15 min).

  // 🎫 Unique reservation identifier linking cart item to inventory reservation
  @Column({ type: 'varchar', length: 100, nullable: true })
  reservationId?: string;

  // ⏰ Reservation expiration timestamp (auto-release after timeout)
  @Column({ type: 'datetime', nullable: true })
  reservedUntil?: Date;

  // 📊 Current reservation status (active, expired, released, converted)
  @Column({ type: 'enum', enum: ReservationStatus, nullable: true })
  reservationStatus?: ReservationStatus;

  /**
   * Check if price lock has expired (7 days from added_at)
   * Price lock guarantees the add-to-cart price for 7 days
   *
   * @returns boolean - True if price lock expired
   */
  isLockExpired(): boolean {
    if (!this.locked_until) return true;
    return new Date() >= this.locked_until;
  }

  /**
   * Get effective price - returns lower of locked price or current price
   * If lock expired, returns current price
   * If lock active and current price lower, returns current price (customer benefit)
   * If lock active and current price higher, returns locked price (customer protection)
   *
   * @returns number - Effective price to charge customer
   */
  effectivePrice(): number {
    const currentPrice = this.variant?.price ?? this.price_at_add;

    // If lock expired, use current price
    if (this.isLockExpired()) {
      return currentPrice;
    }

    // Lock active: return minimum of locked price and current price
    // This ensures customer always gets best price
    return Math.min(this.price_at_add, currentPrice);
  }

  /**
   * Calculate price savings if current price is lower than locked price
   *
   * @returns number - Amount saved (0 if no savings)
   */
  priceSavings(): number {
    if (this.isLockExpired()) return 0;

    const currentPrice = this.variant?.price ?? this.price_at_add;
    const savings = this.price_at_add - currentPrice;

    return savings > 0 ? savings : 0;
  }

  /**
   * Get days remaining until price lock expiration
   *
   * @returns number - Days remaining (0 if expired)
   */
  daysUntilLockExpires(): number {
    if (!this.locked_until) return 0;

    const now = new Date();
    const expiryDate = new Date(this.locked_until);

    if (now > expiryDate) return 0;

    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 🏭 INVENTORY RESERVATION METHODS (Week 4 Enterprise Feature)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Check if inventory reservation has expired
   * Reservation timeout prevents indefinite inventory holds
   *
   * @returns boolean - True if reservation expired or not reserved
   */
  isReservationExpired(): boolean {
    if (!this.reservedUntil || !this.reservationId) return true;
    return new Date() > this.reservedUntil;
  }

  /**
   * Check if inventory is actively reserved for this cart item
   * Active reservation means inventory is held and checkout can proceed
   *
   * @returns boolean - True if reservation is active and not expired
   */
  hasActiveReservation(): boolean {
    return (
      !!this.reservationId &&
      !!this.reservedUntil &&
      !this.isReservationExpired() &&
      (this.reservationStatus === ReservationStatus.CONFIRMED ||
        this.reservationStatus === ReservationStatus.ALLOCATED)
    );
  }

  /**
   * Get minutes remaining until reservation expires
   * Used to display reservation countdown to users
   *
   * @returns number - Minutes remaining (0 if expired or no reservation)
   */
  minutesUntilReservationExpires(): number {
    if (!this.reservedUntil || this.isReservationExpired()) return 0;

    const now = new Date();
    const expiryDate = new Date(this.reservedUntil);

    const diffTime = expiryDate.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    return Math.max(0, diffMinutes);
  }

  /**
   * Check if reservation needs extension
   * Returns true if reservation is about to expire (< 5 minutes remaining)
   *
   * @returns boolean - True if reservation needs extension
   */
  needsReservationExtension(): boolean {
    if (!this.hasActiveReservation()) return false;

    const minutesRemaining = this.minutesUntilReservationExpires();
    return minutesRemaining > 0 && minutesRemaining < 5;
  }

  /**
   * Get human-readable reservation status message
   * Used for displaying reservation info to customers
   *
   * @returns string - User-friendly status message
   */
  getReservationStatusMessage(): string {
    if (!this.reservationId) {
      return 'Not reserved';
    }

    if (this.isReservationExpired()) {
      return 'Reservation expired';
    }

    const minutes = this.minutesUntilReservationExpires();

    if (minutes === 0) {
      return 'Reservation expiring';
    }

    if (minutes < 5) {
      return `Reserved for ${minutes} more minute${minutes !== 1 ? 's' : ''} (expiring soon)`;
    }

    return `Reserved for ${minutes} more minute${minutes !== 1 ? 's' : ''}`;
  }
}
