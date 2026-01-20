import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Button Variant Type
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Button Size Type
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Button Component
 *
 * Golden Wheat themed button with multiple variants and sizes.
 * Supports loading state, icon support, and full-width option.
 *
 * @swagger
 * components:
 *   schemas:
 *     ButtonComponent:
 *       type: object
 *       description: Golden Wheat styled button component
 *       properties:
 *         variant:
 *           type: string
 *           enum: [primary, secondary, outline, ghost, danger]
 *           description: Button visual variant
 *         size:
 *           type: string
 *           enum: [small, medium, large]
 *           description: Button size
 *         disabled:
 *           type: boolean
 *           description: Disabled state
 *         loading:
 *           type: boolean
 *           description: Loading state with spinner
 *         fullWidth:
 *           type: boolean
 *           description: Full width button
 *         type:
 *           type: string
 *           enum: [button, submit, reset]
 *           description: HTML button type
 *
 * @example
 * ```html
 * <!-- Primary Button -->
 * <app-button variant="primary" size="medium">
 *   Add to Cart
 * </app-button>
 *
 * <!-- Loading Button -->
 * <app-button variant="primary" [loading]="isLoading">
 *   Submit Order
 * </app-button>
 *
 * <!-- Full Width Button -->
 * <app-button variant="primary" [fullWidth]="true">
 *   Checkout
 * </app-button>
 * ```
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  /**
   * Button visual variant
   * - primary: Golden wheat filled (main CTAs)
   * - secondary: Forest green filled (secondary actions)
   * - outline: Bordered with transparent background
   * - ghost: Text only, no background
   * - danger: Red for destructive actions
   */
  @Input() variant: ButtonVariant = 'primary';

  /**
   * Button size
   * - small: Compact (32px height)
   * - medium: Standard (40px height)
   * - large: Prominent (48px height)
   */
  @Input() size: ButtonSize = 'medium';

  /**
   * Disabled state
   */
  @Input() disabled: boolean = false;

  /**
   * Loading state (shows spinner, disables interaction)
   */
  @Input() loading: boolean = false;

  /**
   * Full width button (100% of container)
   */
  @Input() fullWidth: boolean = false;

  /**
   * HTML button type attribute
   */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Icon position (left or right of text)
   */
  @Input() iconPosition: 'left' | 'right' = 'left';

  /**
   * Check if button should be disabled (disabled or loading)
   */
  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }
}
