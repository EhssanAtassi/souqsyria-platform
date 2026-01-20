/**
 * 🛒 CartItem Entity (Enhanced)
 *
 * Represents a product variant added to a user's cart.
 * Stores quantity, original price, optional discount, selected attributes,
 * and metadata like expiration and campaign source.
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

  /**
   * Check if price lock has expired (7 days from added_at)
   * Price lock guarantees the add-to-cart price for 7 days
   *
   * @returns boolean - True if price lock expired
   */
  isLockExpired(): boolean {
    if (!this.locked_until) return true;
    return new Date() > this.locked_until;
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
    const currentPrice = this.variant?.price || this.price_at_add;

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

    const currentPrice = this.variant?.price || this.price_at_add;
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
}
