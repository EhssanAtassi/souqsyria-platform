import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
  signal, computed, ElementRef, DestroyRef, inject
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { fromEvent, filter } from 'rxjs';
import { CartItem } from '../../../../interfaces/cart.interface';
import { CartQuery } from '../../../../../store/cart/cart.query';
import { MiniCartDropdownComponent } from '../../../mini-cart-dropdown/mini-cart-dropdown.component';

/**
 * Cart Button Component
 *
 * @description Standalone golden cart button with mini-cart dropdown on desktop.
 * On mobile (< 768px), clicking navigates to /cart. On desktop, clicking toggles
 * a MiniCartDropdownComponent below the button.
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
 *         items:
 *           type: array
 *           description: Cart items for dropdown preview
 *         subtotal:
 *           type: number
 *           description: Cart subtotal for dropdown
 *
 * @example
 * ```html
 * <app-cart-button
 *   [itemCount]="3"
 *   [items]="cartItems"
 *   [subtotal]="5000"
 *   (cartClick)="onCartClick()">
 * </app-cart-button>
 * ```
 */
@Component({
  selector: 'app-cart-button',
  standalone: true,
  imports: [CommonModule, RouterModule, MiniCartDropdownComponent],
  templateUrl: './cart-button.component.html',
  styleUrl: './cart-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartButtonComponent {
  private el = inject(ElementRef);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cartQuery = inject(CartQuery);

  /** Cart items from Akita store (populates mini-cart dropdown directly) */
  readonly storeItems = toSignal(this.cartQuery.items$, { initialValue: [] as CartItem[] });

  /** Cart subtotal from Akita store */
  readonly storeSubtotal = toSignal(this.cartQuery.subtotal$, { initialValue: 0 });

  /** Cart item count from Akita store */
  readonly storeItemCount = toSignal(this.cartQuery.itemCount$, { initialValue: 0 });

  /**
   * Effective items: prefer store data over @Input (store is always fresh)
   * Falls back to @Input items if store is empty (SSR/testing scenarios)
   */
  readonly effectiveItems = computed(() => {
    const store = this.storeItems();
    return store.length > 0 ? store : this.items;
  });

  /** Effective subtotal from store or @Input fallback */
  readonly effectiveSubtotal = computed(() => this.storeSubtotal() || this.subtotal);

  /** Effective item count from store or @Input fallback */
  readonly effectiveItemCount = computed(() => this.storeItemCount() || this.itemCount);

  constructor() {
    // Click-outside handler: close dropdown when clicking outside the component
    fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(() => this.isDropdownOpen()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        if (!this.el.nativeElement.contains(event.target)) {
          this.isDropdownOpen.set(false);
        }
      });

    // Escape key handler: close dropdown (WCAG 2.1.1 keyboard accessibility)
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(e => e.key === 'Escape' && this.isDropdownOpen()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.closeDropdown());
  }

  /** Number of items in cart for badge display */
  @Input() itemCount = 0;

  /** Current language for label text */
  @Input() language: 'en' | 'ar' = 'en';

  /** Cart items for the mini-cart dropdown preview */
  @Input() items: CartItem[] = [];

  /** Cart subtotal for dropdown display */
  @Input() subtotal = 0;

  /** Emitted when the cart button is clicked */
  @Output() cartClick = new EventEmitter<void>();

  /** Emitted when user removes an item via dropdown */
  @Output() removeItem = new EventEmitter<CartItem>();

  /** Controls dropdown open/close state */
  isDropdownOpen = signal(false);

  /** Get localized button label */
  get label(): string {
    return this.language === 'ar' ? 'السلة' : 'My Cart';
  }

  /** Get accessible aria label */
  get ariaLabel(): string {
    const count = this.effectiveItemCount();
    return this.language === 'ar'
      ? `سلة التسوق (${count} منتج)`
      : `Shopping cart (${count} items)`;
  }

  /**
   * Handle button click: toggle dropdown on desktop, navigate on mobile
   */
  onButtonClick(event: Event): void {
    if (this.isMobile()) {
      this.router.navigate(['/cart']);
    } else {
      event.preventDefault();
      event.stopPropagation();
      this.isDropdownOpen.update(v => !v);
    }
    this.cartClick.emit();
  }

  /** Navigate to full cart page from dropdown */
  onViewCart(): void {
    this.isDropdownOpen.set(false);
    this.router.navigate(['/cart']);
  }

  /** Navigate to checkout from dropdown */
  onCheckout(): void {
    this.isDropdownOpen.set(false);
    this.router.navigate(['/checkout']);
  }

  /** Handle item removal from dropdown */
  onRemoveItem(item: CartItem): void {
    this.removeItem.emit(item);
  }

  /** Close dropdown */
  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  /** Check if viewport is mobile-sized (< 768px) */
  private isMobile(): boolean {
    return window.innerWidth < 768;
  }
}
