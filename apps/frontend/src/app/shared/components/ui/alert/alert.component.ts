import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Alert Type Enumeration
 */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * Alert/Toast Notification Component
 *
 * Displays contextual alert messages with auto-dismiss functionality.
 * Supports success (green), error (red), warning (golden), and info (blue) variants.
 *
 * @swagger
 * components:
 *   schemas:
 *     AlertComponent:
 *       type: object
 *       description: Contextual notification alert with auto-dismiss
 *       properties:
 *         type:
 *           type: string
 *           enum: [success, error, warning, info]
 *           description: Alert variant with semantic color
 *         message:
 *           type: string
 *           description: Alert message text
 *         messageArabic:
 *           type: string
 *           description: Alert message in Arabic (optional)
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Current display language
 *         dismissible:
 *           type: boolean
 *           description: Show close button
 *         autoDismiss:
 *           type: boolean
 *           description: Auto-close after duration
 *         duration:
 *           type: number
 *           description: Auto-dismiss duration in ms (default 5000)
 *         dismissed:
 *           type: event
 *           description: Emitted when alert is dismissed
 *
 * @example
 * ```html
 * <!-- Success alert -->
 * <app-alert
 *   type="success"
 *   message="Product added to cart!"
 *   messageArabic="تمت إضافة المنتج إلى السلة!"
 *   [language]="currentLang">
 * </app-alert>
 *
 * <!-- Auto-dismissing warning -->
 * <app-alert
 *   type="warning"
 *   message="Low stock: Only 3 items left"
 *   [autoDismiss]="true"
 *   [duration]="3000">
 * </app-alert>
 * ```
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent implements OnInit {
  /**
   * Alert type (determines color and icon)
   */
  @Input() type: AlertType = 'info';

  /**
   * Alert message text (English)
   */
  @Input() message: string = '';

  /**
   * Alert message text (Arabic, optional)
   */
  @Input() messageArabic?: string;

  /**
   * Current language for message display
   */
  @Input() language: 'en' | 'ar' = 'en';

  /**
   * Show close button
   */
  @Input() dismissible: boolean = true;

  /**
   * Auto-dismiss after duration
   */
  @Input() autoDismiss: boolean = true;

  /**
   * Auto-dismiss duration in milliseconds
   */
  @Input() duration: number = 5000;

  /**
   * Event emitted when alert is dismissed
   */
  @Output() dismissed = new EventEmitter<void>();

  /**
   * Internal visibility state
   */
  isVisible: boolean = true;

  /**
   * Auto-dismiss timer reference
   */
  private dismissTimer?: number;

  /**
   * DestroyRef for automatic cleanup
   */
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.autoDismiss) {
      this.startAutoDismissTimer();
    }

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.clearAutoDismissTimer();
    });
  }

  /**
   * Start auto-dismiss countdown
   */
  private startAutoDismissTimer(): void {
    this.dismissTimer = window.setTimeout(() => {
      this.dismiss();
    }, this.duration);
  }

  /**
   * Clear auto-dismiss timer
   */
  private clearAutoDismissTimer(): void {
    if (this.dismissTimer) {
      window.clearTimeout(this.dismissTimer);
      this.dismissTimer = undefined;
    }
  }

  /**
   * Dismiss alert
   */
  dismiss(): void {
    this.isVisible = false;
    this.clearAutoDismissTimer();
    this.dismissed.emit();
  }

  /**
   * Get display message based on language
   */
  get displayMessage(): string {
    return this.language === 'ar' && this.messageArabic ? this.messageArabic : this.message;
  }

  /**
   * Get icon SVG path based on alert type
   */
  get iconPath(): string {
    const icons = {
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // Check circle
      error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', // X circle
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', // Triangle exclamation
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' // Info circle
    };
    return icons[this.type];
  }
}
