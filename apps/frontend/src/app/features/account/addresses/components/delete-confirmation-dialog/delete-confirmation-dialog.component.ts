import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AddressResponse } from '../../interfaces/address.interface';

/**
 * @description Dialog data interface for delete confirmation
 */
export interface DeleteConfirmationData {
  address: AddressResponse;
  isDefault: boolean;
  isOnlyAddress: boolean;
}

/**
 * @description Confirmation dialog for address deletion
 * Shows appropriate warnings for default addresses or when deleting the only address.
 * Returns boolean result indicating whether to proceed with deletion.
 *
 * @swagger
 * components:
 *   schemas:
 *     DeleteConfirmationDialogComponent:
 *       type: object
 *       description: Confirmation dialog for address deletion with safety checks
 *       properties:
 *         isDefault:
 *           type: boolean
 *           description: Whether the address to delete is the default address
 *         isOnlyAddress:
 *           type: boolean
 *           description: Whether this is the user's only address
 */
@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrls: ['./delete-confirmation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteConfirmationDialogComponent {
  readonly data = inject<DeleteConfirmationData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<DeleteConfirmationDialogComponent>);

  /**
   * @description Check if deletion should be blocked
   * @returns True if address is default or is the only address
   */
  get isDeletionBlocked(): boolean {
    return this.data.isDefault || this.data.isOnlyAddress;
  }

  /**
   * @description Handle confirm button click
   * Closes dialog with true result if deletion is not blocked
   */
  onConfirm(): void {
    if (!this.isDeletionBlocked) {
      this.dialogRef.close(true);
    }
  }

  /**
   * @description Handle cancel button click
   * Closes dialog with false result
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
