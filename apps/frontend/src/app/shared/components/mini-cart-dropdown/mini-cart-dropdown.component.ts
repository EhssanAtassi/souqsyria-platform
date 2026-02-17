import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CartItem } from '../../interfaces/cart.interface';

/**
 * Mini Cart Dropdown Component
 *
 * @description Compact cart preview that appears on hover/click of the header cart button.
 * Shows up to 5 items with an overflow indicator, subtotal, and quick-action buttons.
 * Hidden on mobile (< 768px) where the cart button routes directly to /cart.
 *
 * @swagger
 * components:
 *   schemas:
 *     MiniCartDropdownProps:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         subtotal:
 *           type: number
 *           description: Cart subtotal for display
 *         itemCount:
 *           type: number
 *           description: Total number of items in cart
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         isOpen:
 *           type: boolean
 *           description: Controls dropdown visibility
 *
 * @example
 * ```html
 * <app-mini-cart-dropdown
 *   [items]="cartItems"
 *   [subtotal]="1500"
 *   [itemCount]="3"
 *   [isOpen]="true"
 *   (removeItem)="onRemove($event)"
 *   (viewCart)="goToCart()"
 *   (checkout)="goToCheckout()"
 *   (closed)="closeDropdown()">
 * </app-mini-cart-dropdown>
 * ```
 */
@Component({
  selector: 'app-mini-cart-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mini-cart-dropdown.component.html',
  styleUrls: ['./mini-cart-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    /** Fade + slide-down animation for dropdown open/close */
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px) scale(0.95)' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateY(-8px) scale(0.95)' }))
      ])
    ]),
    /** Slide-out animation for removed items */
    trigger('itemAnimation', [
      transition(':leave', [
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateX(-100%)', height: 0, padding: 0, margin: 0 }))
      ])
    ])
  ]
})
export class MiniCartDropdownComponent {
  /** Cart items to display (max 5 shown) */
  @Input() items: CartItem[] = [];

  /** Cart subtotal amount */
  @Input() subtotal = 0;

  /** Total item count in cart */
  @Input() itemCount = 0;

  /** Display language */
  @Input() language: 'en' | 'ar' = 'en';

  /** Controls dropdown visibility */
  @Input() isOpen = false;

  /** Emitted when user clicks remove on an item */
  @Output() removeItem = new EventEmitter<CartItem>();

  /** Emitted when user clicks "View Cart" */
  @Output() viewCart = new EventEmitter<void>();

  /** Emitted when user clicks "Checkout" */
  @Output() checkout = new EventEmitter<void>();

  /** Emitted when dropdown should close */
  @Output() closed = new EventEmitter<void>();

  /** Detects prefers-reduced-motion to disable Angular animations (WCAG 2.3.3) */
  readonly prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Maximum items to display before showing overflow indicator */
  readonly MAX_VISIBLE_ITEMS = 5;

  /** Get visible items (capped at MAX_VISIBLE_ITEMS) */
  get visibleItems(): CartItem[] {
    return this.items.slice(0, this.MAX_VISIBLE_ITEMS);
  }

  /** Get count of items not shown */
  get overflowCount(): number {
    return Math.max(0, this.items.length - this.MAX_VISIBLE_ITEMS);
  }

  /** Whether the cart is empty */
  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Format price for SYP display
   * @param amount - Price amount
   * @returns Formatted price string
   */
  formatPrice(amount: number): string {
    return `£S\u00A0${new Intl.NumberFormat('ar-SY').format(amount)}`;
  }

  /**
   * TrackBy function for ngFor performance
   * @param index - Item index
   * @param item - Cart item
   * @returns Unique item identifier
   */
  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }
}
