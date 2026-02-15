/**
 * @file session-loading.component.ts
 * @description Session initialization loading component with Material Design spinner
 * Displays during guest session creation/validation with accessibility support
 *
 * @swagger
 * components:
 *   schemas:
 *     SessionLoadingComponent:
 *       type: object
 *       description: Loading indicator for session operations
 *       properties:
 *         isLoading:
 *           type: boolean
 *           description: Whether session initialization is in progress
 *         message:
 *           type: string
 *           description: Optional loading message to display
 */
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

/**
 * SessionLoadingComponent
 *
 * @description Displays Material Design loading indicator during session operations
 * Features:
 * - Material progress bar for global loading
 * - Material spinner for inline loading
 * - Bilingual message support
 * - Accessibility with ARIA attributes
 * - Responsive design
 *
 * @example
 * ```html
 * <!-- Global session loading overlay -->
 * <app-session-loading
 *   *ngIf="isInitializingSession"
 *   [isLoading]="true"
 *   [overlay]="true"
 *   message="Initializing session..."
 * ></app-session-loading>
 *
 * <!-- Inline session loading -->
 * <app-session-loading
 *   [isLoading]="isValidating"
 *   [size]="'medium'"
 * ></app-session-loading>
 * ```
 */
@Component({
  selector: 'app-session-loading',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './session-loading.component.html',
  styleUrls: ['./session-loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionLoadingComponent {
  /**
   * Whether session operation is in progress
   * Controls visibility of loading indicator
   */
  @Input() isLoading: boolean = false;

  /**
   * Loading message to display
   * Supports both English and Arabic text
   * @example "Initializing session..." | "جاري تهيئة الجلسة..."
   */
  @Input() message?: string;

  /**
   * Show full-screen overlay background
   * Enables backdrop blur and centers spinner
   */
  @Input() overlay: boolean = false;

  /**
   * Spinner size variant
   * - small: 24px diameter (inline usage)
   * - medium: 48px diameter (default)
   * - large: 64px diameter (overlay mode)
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Progress bar mode
   * - determinate: Shows specific progress percentage
   * - indeterminate: Shows continuous animation
   */
  @Input() mode: 'determinate' | 'indeterminate' = 'indeterminate';

  /**
   * Progress value for determinate mode (0-100)
   * Only used when mode is 'determinate'
   */
  @Input() progress: number = 0;

  /**
   * Color theme for loading indicator
   * - primary: Blue-800 (#1e3a8a)
   * - accent: Emerald-500 (#10b981)
   * - warn: Red-500 (#ef4444)
   */
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';

  /**
   * Get spinner diameter based on size
   * @returns Diameter in pixels
   */
  get spinnerDiameter(): number {
    switch (this.size) {
      case 'small':
        return 24;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      default:
        return 48;
    }
  }

  /**
   * Get ARIA label for screen readers
   * @returns Accessible label describing loading state
   */
  get ariaLabel(): string {
    if (this.message) {
      return this.message;
    }
    return 'Session is loading, please wait';
  }
}
