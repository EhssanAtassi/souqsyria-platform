import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Alert Dialog Data Interface
 *
 * @description
 * Data structure for alert/notification dialog configuration.
 * Supports bilingual content and different alert types (success, error, warning, info).
 *
 * @swagger
 * components:
 *   schemas:
 *     AlertDialogData:
 *       type: object
 *       required:
 *         - title
 *         - message
 *       properties:
 *         title:
 *           type: string
 *           description: Dialog title in English
 *           example: Order Placed Successfully
 *         titleAr:
 *           type: string
 *           description: Dialog title in Arabic (optional)
 *           example: تم تقديم الطلب بنجاح
 *         message:
 *           type: string
 *           description: Dialog message in English
 *           example: Your order has been placed and will be processed shortly.
 *         messageAr:
 *           type: string
 *           description: Dialog message in Arabic (optional)
 *           example: تم تقديم طلبك وسيتم معالجته قريباً.
 *         okText:
 *           type: string
 *           description: OK button text
 *           default: OK
 *         okTextAr:
 *           type: string
 *           description: OK button text in Arabic
 *           default: حسناً
 *         type:
 *           type: string
 *           enum: [success, error, warning, info]
 *           description: Alert type for styling
 *           default: info
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *           default: en
 */
export interface AlertDialogData {
  /** Dialog title (English) */
  title: string;
  /** Dialog title (Arabic - optional) */
  titleAr?: string;
  /** Dialog message (English) */
  message: string;
  /** Dialog message (Arabic - optional) */
  messageAr?: string;
  /** OK button text */
  okText?: string;
  /** OK button text (Arabic) */
  okTextAr?: string;
  /** Alert type for visual styling */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** Display language */
  language?: 'en' | 'ar';
}

/**
 * Alert Dialog Component
 *
 * @description
 * Reusable alert/notification dialog for the Syrian marketplace.
 * Styled with Golden Wheat theme and supports bilingual content (English/Arabic).
 * Replaces browser's native window.alert() with a professional Material Design dialog.
 *
 * Features:
 * - Bilingual support (English/Arabic with RTL)
 * - Golden Wheat design system styling
 * - Alert type styling (success, error, warning, info)
 * - Type-specific icons and colors
 * - Material Design animations
 * - Mobile-responsive layout
 * - Keyboard navigation (Enter/Escape)
 *
 * Alert Types:
 * - **success**: Green checkmark, for successful operations
 * - **error**: Red error icon, for failures
 * - **warning**: Orange warning icon, for warnings
 * - **info**: Blue info icon, for general notifications
 *
 * Usage with ModalService:
 * ```typescript
 * this.modalService.showSuccess('Product added to cart!');
 * this.modalService.showError('Failed to process payment');
 * this.modalService.showWarning('Your session will expire soon');
 * this.modalService.alert('Order Confirmed', 'Your order #12345 has been confirmed');
 * ```
 *
 * Direct usage with MatDialog:
 * ```typescript
 * const dialogRef = this.dialog.open(AlertDialogComponent, {
 *   data: {
 *     title: 'Success',
 *     titleAr: 'نجح',
 *     message: 'Your changes have been saved.',
 *     messageAr: 'تم حفظ التغييرات.',
 *     type: 'success',
 *     language: 'ar'
 *   }
 * });
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     AlertDialogComponent:
 *       type: object
 *       description: Material Design alert dialog for Syrian marketplace
 *       properties:
 *         dialogRef:
 *           type: object
 *           description: Material Dialog reference
 *         data:
 *           $ref: '#/components/schemas/AlertDialogData'
 *       methods:
 *         onOk:
 *           description: Handles OK button click
 *           returns:
 *             type: void
 *         getIcon:
 *           description: Returns icon name based on alert type
 *           returns:
 *             type: string
 *         getIconColor:
 *           description: Returns icon color class based on alert type
 *           returns:
 *             type: string
 */
@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertDialogComponent {
  /**
   * Default values for dialog data
   */
  readonly defaults = {
    okText: 'OK',
    okTextAr: 'حسناً',
    type: 'info' as const,
    language: 'en' as const
  };

  /**
   * Icon mapping for alert types
   */
  private readonly iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  /**
   * Icon color class mapping for alert types
   */
  private readonly iconColorMap = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info'
  };

  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogData
  ) {
    // Apply defaults if not provided
    this.data = {
      ...this.defaults,
      ...data
    };
  }

  /**
   * Handle OK button click
   * Closes dialog
   */
  onOk(): void {
    this.dialogRef.close();
  }

  /**
   * Get icon name based on alert type
   * @returns Material icon name
   */
  getIcon(): string {
    return this.iconMap[this.data.type || 'info'];
  }

  /**
   * Get icon color class based on alert type
   * @returns CSS class name for icon color
   */
  getIconColor(): string {
    return this.iconColorMap[this.data.type || 'info'];
  }

  /**
   * Get display text based on language preference
   * @param textEn - English text
   * @param textAr - Arabic text (optional)
   * @returns Appropriate text based on language
   */
  getDisplayText(textEn: string, textAr?: string): string {
    return this.data.language === 'ar' && textAr ? textAr : textEn;
  }
}
