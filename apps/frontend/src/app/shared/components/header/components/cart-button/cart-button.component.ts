import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Cart Button Component
 *
 * @description Standalone golden cart button matching the prototype.
 * Displays cart icon with white badge count on a primary-400 background.
 *
 * @swagger
 * components:
 *   schemas:
 *     CartButtonProps:
 *       type: object
 *       properties:
 *         itemCount:
 *           type: number
 *           description: Number of items in cart
 *         language:
 *           type: string
 *           enum: [en, ar]
 *
 * @example
 * ```html
 * <app-cart-button [itemCount]="3" (cartClick)="onCartClick()"></app-cart-button>
 * ```
 */
@Component({
  selector: 'app-cart-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-button.component.html',
  styleUrl: './cart-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartButtonComponent {
  /** Number of items in cart for badge display */
  @Input() itemCount = 0;

  /** Current language for label text */
  @Input() language: 'en' | 'ar' = 'en';

  /** Emitted when the cart button is clicked */
  @Output() cartClick = new EventEmitter<void>();

  /** Get localized button label */
  get label(): string {
    return this.language === 'ar' ? 'السلة' : 'My Cart';
  }

  /** Get accessible aria label */
  get ariaLabel(): string {
    return this.language === 'ar'
      ? `سلة التسوق (${this.itemCount} منتج)`
      : `Shopping cart (${this.itemCount} items)`;
  }
}
