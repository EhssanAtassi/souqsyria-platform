import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Syrian Marketplace Loading Spinner Component
 *
 * Features Golden Wheat themed animated loader with Syrian cultural pattern.
 * Supports multiple sizes and optional overlay background for modal loading states.
 *
 * @swagger
 * components:
 *   schemas:
 *     LoaderComponent:
 *       type: object
 *       description: Animated loading spinner with Syrian cultural design
 *       properties:
 *         size:
 *           type: string
 *           enum: [small, medium, large]
 *           description: Size variant - small (24px), medium (48px), large (72px)
 *         message:
 *           type: string
 *           description: Optional loading message to display below spinner
 *         overlay:
 *           type: boolean
 *           description: Show full-screen overlay backdrop with blur effect
 *
 * @example
 * ```html
 * <!-- Simple loader -->
 * <app-loader size="medium"></app-loader>
 *
 * <!-- Loader with message -->
 * <app-loader size="large" message="جاري تحميل المنتجات..."></app-loader>
 *
 * <!-- Full-screen overlay loader -->
 * <app-loader [overlay]="true" message="Loading your cart..."></app-loader>
 * ```
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoaderComponent {
  /**
   * Loader size variant
   * - small: 24px diameter (inline usage)
   * - medium: 48px diameter (default, section loading)
   * - large: 72px diameter (page loading)
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Loading message to display below spinner
   * Supports both English and Arabic text
   */
  @Input() message?: string;

  /**
   * Show full-screen overlay background
   * Enables backdrop blur and centers loader
   */
  @Input() overlay: boolean = false;
}
