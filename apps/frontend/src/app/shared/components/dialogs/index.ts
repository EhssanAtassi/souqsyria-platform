/**
 * @fileoverview Dialogs Index
 * @description Central export for all dialog components in the Syrian marketplace
 * @swagger
 * components:
 *   schemas:
 *     Dialogs:
 *       type: object
 *       description: Collection of all dialog components for Syrian marketplace
 */

// Confirmation Dialog
export { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
export type { ConfirmationDialogData } from './confirmation-dialog/confirmation-dialog.component';

// Alert Dialog
export { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
export type { AlertDialogData } from './alert-dialog/alert-dialog.component';
