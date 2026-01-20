import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Confirmation Dialog Data Interface
 *
 * @description
 * Data structure for confirmation dialog configuration.
 * Supports bilingual content and customizable button styling.
 *
 * @swagger
 * components:
 *   schemas:
 *     ConfirmationDialogData:
 *       type: object
 *       required:
 *         - title
 *         - message
 *       properties:
 *         title:
 *           type: string
 *           description: Dialog title in English
 *           example: Delete Product
 *         titleAr:
 *           type: string
 *           description: Dialog title in Arabic (optional)
 *           example: حذف المنتج
 *         message:
 *           type: string
 *           description: Dialog message in English
 *           example: Are you sure you want to delete this product?
 *         messageAr:
 *           type: string
 *           description: Dialog message in Arabic (optional)
 *           example: هل أنت متأكد من حذف هذا المنتج؟
 *         confirmText:
 *           type: string
 *           description: Confirm button text
 *           default: Confirm
 *         confirmTextAr:
 *           type: string
 *           description: Confirm button text in Arabic
 *           default: تأكيد
 *         cancelText:
 *           type: string
 *           description: Cancel button text
 *           default: Cancel
 *         cancelTextAr:
 *           type: string
 *           description: Cancel button text in Arabic
 *           default: إلغاء
 *         confirmColor:
 *           type: string
 *           enum: [primary, accent, warn]
 *           description: Material color for confirm button
 *           default: primary
 *         icon:
 *           type: string
 *           description: Optional Material icon name
 *           example: warning
 *         iconColor:
 *           type: string
 *           description: Icon color class
 *           example: text-warn
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *           default: en
 */
export interface ConfirmationDialogData {
  /** Dialog title (English) */
  title: string;
  /** Dialog title (Arabic - optional) */
  titleAr?: string;
  /** Dialog message (English) */
  message: string;
  /** Dialog message (Arabic - optional) */
  messageAr?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Confirm button text (Arabic) */
  confirmTextAr?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Cancel button text (Arabic) */
  cancelTextAr?: string;
  /** Material color for confirm button */
  confirmColor?: 'primary' | 'accent' | 'warn';
  /** Optional icon name */
  icon?: string;
  /** Icon color class */
  iconColor?: string;
  /** Display language */
  language?: 'en' | 'ar';
}

/**
 * Confirmation Dialog Component
 *
 * @description
 * Reusable confirmation dialog for the Syrian marketplace.
 * Styled with Golden Wheat theme and supports bilingual content (English/Arabic).
 * Replaces browser's native window.confirm() with a professional Material Design dialog.
 *
 * Features:
 * - Bilingual support (English/Arabic with RTL)
 * - Golden Wheat design system styling
 * - Customizable button text and colors
 * - Optional icon display
 * - Material Design animations
 * - Mobile-responsive layout
 * - Keyboard navigation support (Enter/Escape)
 *
 * Usage with ModalService:
 * ```typescript
 * const dialogRef = this.modalService.confirm(
 *   'Delete Product',
 *   'Are you sure you want to delete this product?',
 *   'Delete',
 *   'Cancel',
 *   'warn'
 * );
 *
 * dialogRef.subscribe(confirmed => {
 *   if (confirmed) {
 *     // User confirmed
 *   }
 * });
 * ```
 *
 * Direct usage with MatDialog:
 * ```typescript
 * const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
 *   data: {
 *     title: 'Remove from Cart',
 *     titleAr: 'إزالة من السلة',
 *     message: 'Remove this item from your cart?',
 *     messageAr: 'هل تريد إزالة هذا المنتج من سلتك؟',
 *     confirmText: 'Remove',
 *     confirmTextAr: 'إزالة',
 *     cancelText: 'Keep',
 *     cancelTextAr: 'إبقاء',
 *     confirmColor: 'warn',
 *     icon: 'shopping_cart',
 *     language: 'ar'
 *   }
 * });
 *
 * dialogRef.afterClosed().subscribe(result => {
 *   if (result) {
 *     // User confirmed
 *   }
 * });
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ConfirmationDialogComponent:
 *       type: object
 *       description: Material Design confirmation dialog for Syrian marketplace
 *       properties:
 *         dialogRef:
 *           type: object
 *           description: Material Dialog reference
 *         data:
 *           $ref: '#/components/schemas/ConfirmationDialogData'
 *       methods:
 *         onConfirm:
 *           description: Handles confirm button click
 *           returns:
 *             type: void
 *         onCancel:
 *           description: Handles cancel button click
 *           returns:
 *             type: void
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDialogComponent {
  /**
   * Default values for dialog data
   */
  readonly defaults = {
    confirmText: 'Confirm',
    confirmTextAr: 'تأكيد',
    cancelText: 'Cancel',
    cancelTextAr: 'إلغاء',
    confirmColor: 'primary' as const,
    language: 'en' as const
  };

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {
    // Apply defaults if not provided
    this.data = {
      ...this.defaults,
      ...data
    };
  }

  /**
   * Handle confirm button click
   * Closes dialog with true result
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Handle cancel button click
   * Closes dialog with false result
   */
  onCancel(): void {
    this.dialogRef.close(false);
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
