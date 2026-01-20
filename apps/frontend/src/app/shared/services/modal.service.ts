import { Injectable, inject, Type } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Product } from '../interfaces/product.interface';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
  AlertDialogComponent,
  AlertDialogData
} from '../components/dialogs';

/**
 * Dialog Data Interface
 * @description Generic interface for dialog data
 */
export interface DialogData {
  title: string;
  message: string;
  [key: string]: any;
}

/**
 * Modal Service
 *
 * @description
 * Comprehensive modal and dialog service for SouqSyria marketplace.
 * Provides easy-to-use methods for displaying confirmation dialogs,
 * alerts, custom modals, and product quick views.
 *
 * Features:
 * - Confirmation dialogs with customizable buttons
 * - Alert dialogs for notifications
 * - Custom modal dialogs with any component
 * - Product quick view modal
 * - Image gallery modal
 * - Observable-based dialog results
 * - Configurable dialog appearance
 *
 * @example
 * ```typescript
 * // Inject the service
 * private modalService = inject(ModalService);
 *
 * // Show confirmation dialog
 * this.modalService.confirm(
 *   'Remove Item',
 *   'Are you sure you want to remove this item from cart?'
 * ).subscribe(confirmed => {
 *   if (confirmed) {
 *     // User clicked confirm
 *   }
 * });
 *
 * // Show alert
 * this.modalService.alert('Success', 'Product added to cart!');
 *
 * // Show product quick view
 * this.modalService.showProductQuickView(product);
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ModalService:
 *       type: object
 *       description: Service for displaying modals and dialogs
 *       methods:
 *         confirm:
 *           description: Show confirmation dialog
 *           parameters:
 *             - name: title
 *               type: string
 *               required: true
 *             - name: message
 *               type: string
 *               required: true
 *             - name: confirmText
 *               type: string
 *               default: Confirm
 *             - name: cancelText
 *               type: string
 *               default: Cancel
 *           returns:
 *             type: Observable<boolean>
 *         alert:
 *           description: Show alert dialog
 *           parameters:
 *             - name: title
 *               type: string
 *               required: true
 *             - name: message
 *               type: string
 *               required: true
 *           returns:
 *             type: Observable<void>
 *         openModal:
 *           description: Open custom modal with component
 *           parameters:
 *             - name: component
 *               type: Type<any>
 *               required: true
 *             - name: data
 *               type: any
 *             - name: config
 *               type: MatDialogConfig
 *           returns:
 *             type: MatDialogRef<any>
 *         showProductQuickView:
 *           description: Show product quick view modal
 *           parameters:
 *             - name: product
 *               type: Product
 *               required: true
 *         showImageGallery:
 *           description: Show image gallery modal
 *           parameters:
 *             - name: images
 *               type: string[]
 *               required: true
 *             - name: startIndex
 *               type: number
 *               default: 0
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  /**
   * MatDialog service for displaying dialogs
   * @private
   */
  private dialog = inject(MatDialog);

  /**
   * Show confirmation dialog
   * @description Displays a confirmation dialog with confirm and cancel buttons
   * @param title - Dialog title
   * @param message - Dialog message
   * @param confirmText - Text for confirm button (default: 'Confirm')
   * @param cancelText - Text for cancel button (default: 'Cancel')
   * @param confirmColor - Color of confirm button (default: 'primary')
   * @returns Observable that emits true if confirmed, false if cancelled
   *
   * @example
   * ```typescript
   * modalService.confirm(
   *   'Delete Product',
   *   'Are you sure you want to delete this product?',
   *   'Delete',
   *   'Cancel',
   *   'warn'
   * ).subscribe(confirmed => {
   *   if (confirmed) {
   *     // Delete the product
   *   }
   * });
   * ```
   */
  confirm(
    title: string,
    message: string,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    confirmColor: 'primary' | 'accent' | 'warn' = 'primary'
  ): Observable<boolean> {
    const dialogData: ConfirmationDialogData = {
      title,
      message,
      confirmText,
      cancelText,
      confirmColor
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'confirmation-dialog-container',
      disableClose: false,
      autoFocus: 'first-tabbable'
    });

    return dialogRef.afterClosed().pipe(
      map(result => result === true)
    );
  }

  /**
   * Show alert dialog
   * @description Displays an alert dialog with a single OK button
   * @param title - Dialog title
   * @param message - Dialog message
   * @param okText - Text for OK button (default: 'OK')
   * @returns Observable that completes when dialog is closed
   *
   * @example
   * ```typescript
   * modalService.alert('Success', 'Your order has been placed!').subscribe(() => {
   *   // Dialog closed
   * });
   * ```
   */
  alert(
    title: string,
    message: string,
    okText: string = 'OK'
  ): Observable<void> {
    const dialogData: AlertDialogData = {
      title,
      message,
      okText,
      type: 'info'
    };

    const dialogRef = this.dialog.open(AlertDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'alert-dialog-container',
      disableClose: false,
      autoFocus: 'first-tabbable'
    });

    return dialogRef.afterClosed().pipe(
      map(() => undefined)
    );
  }

  /**
   * Open custom modal with any component
   * @description Generic method to open any component in a dialog
   * @param component - Component class to display in dialog
   * @param data - Data to pass to the component
   * @param config - Optional MatDialog configuration
   * @returns MatDialogRef for the opened dialog
   *
   * @example
   * ```typescript
   * const dialogRef = modalService.openModal(MyCustomComponent, {
   *   someData: 'value'
   * }, {
   *   width: '600px',
   *   disableClose: true
   * });
   *
   * dialogRef.afterClosed().subscribe(result => {
   *   console.log('Dialog result:', result);
   * });
   * ```
   */
  openModal<T, D = any, R = any>(
    component: Type<T>,
    data?: D,
    config?: MatDialogConfig
  ): MatDialogRef<T, R> {
    const dialogConfig: MatDialogConfig = {
      width: '500px',
      maxWidth: '90vw',
      ...config,
      data: data || {}
    };

    return this.dialog.open(component, dialogConfig);
  }

  /**
   * Show product quick view
   * @description Displays a modal with product details for quick viewing
   * @param product - Product to display
   *
   * @example
   * ```typescript
   * modalService.showProductQuickView(product);
   * ```
   */
  showProductQuickView(product: Product): void {
    // TODO: Implement with ProductQuickViewComponent when created
    console.log('Product Quick View:', product.name);
    this.alert(
      product.name,
      `${product.description}\n\nPrice: $${product.price.amount}\nStock: ${product.inventory.quantity} units`
    ).subscribe();
  }

  /**
   * Show image gallery
   * @description Displays an image gallery modal with navigation
   * @param images - Array of image URLs
   * @param startIndex - Index of image to show first (default: 0)
   *
   * @example
   * ```typescript
   * modalService.showImageGallery(product.images, 0);
   * ```
   */
  showImageGallery(images: string[], startIndex: number = 0): void {
    // TODO: Implement with ImageGalleryComponent when created
    console.log('Image Gallery:', images.length, 'images, starting at', startIndex);
    this.alert(
      'Image Gallery',
      `Viewing ${images.length} images starting from image ${startIndex + 1}`
    ).subscribe();
  }

  /**
   * Show loading dialog
   * @description Displays a loading spinner dialog
   * @param message - Loading message (default: 'Loading...')
   * @returns MatDialogRef to close the dialog later
   *
   * @example
   * ```typescript
   * const loadingRef = modalService.showLoading('Processing order...');
   * // ... do async work ...
   * loadingRef.close();
   * ```
   */
  showLoading(message: string = 'Loading...'): MatDialogRef<any> {
    // TODO: Implement with LoadingDialogComponent when created
    console.log('Loading:', message);
    return this.dialog.open({} as any); // Placeholder
  }

  /**
   * Close all dialogs
   * @description Closes all currently open dialogs
   */
  closeAll(): void {
    this.dialog.closeAll();
  }

  /**
   * Get open dialogs count
   * @description Returns the number of currently open dialogs
   * @returns Number of open dialogs
   */
  getOpenDialogsCount(): number {
    return this.dialog.openDialogs.length;
  }

  /**
   * Check if any dialogs are open
   * @description Returns true if any dialogs are currently open
   * @returns True if dialogs are open
   */
  hasOpenDialogs(): boolean {
    return this.dialog.openDialogs.length > 0;
  }

  /**
   * Show success notification
   * @description Convenience method for success alerts
   * @param message - Success message
   * @param title - Title (default: 'Success')
   * @returns Observable that completes when closed
   *
   * @example
   * ```typescript
   * modalService.showSuccess('Product added to cart!');
   * ```
   */
  showSuccess(message: string, title: string = 'Success'): Observable<void> {
    const dialogData: AlertDialogData = {
      title,
      message,
      okText: 'OK',
      type: 'success'
    };

    const dialogRef = this.dialog.open(AlertDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'alert-dialog-container'
    });

    return dialogRef.afterClosed().pipe(
      map(() => undefined)
    );
  }

  /**
   * Show error notification
   * @description Convenience method for error alerts
   * @param message - Error message
   * @param title - Title (default: 'Error')
   * @returns Observable that completes when closed
   *
   * @example
   * ```typescript
   * modalService.showError('Failed to add product to cart');
   * ```
   */
  showError(message: string, title: string = 'Error'): Observable<void> {
    const dialogData: AlertDialogData = {
      title,
      message,
      okText: 'OK',
      type: 'error'
    };

    const dialogRef = this.dialog.open(AlertDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'alert-dialog-container'
    });

    return dialogRef.afterClosed().pipe(
      map(() => undefined)
    );
  }

  /**
   * Show warning notification
   * @description Convenience method for warning alerts
   * @param message - Warning message
   * @param title - Title (default: 'Warning')
   * @returns Observable that completes when closed
   *
   * @example
   * ```typescript
   * modalService.showWarning('Your session will expire soon');
   * ```
   */
  showWarning(message: string, title: string = 'Warning'): Observable<void> {
    const dialogData: AlertDialogData = {
      title,
      message,
      okText: 'OK',
      type: 'warning'
    };

    const dialogRef = this.dialog.open(AlertDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'alert-dialog-container'
    });

    return dialogRef.afterClosed().pipe(
      map(() => undefined)
    );
  }

  /**
   * Confirm delete operation
   * @description Convenience method for delete confirmations
   * @param itemName - Name of item being deleted
   * @returns Observable that emits true if confirmed
   *
   * @example
   * ```typescript
   * modalService.confirmDelete('Damascus Steel Knife').subscribe(confirmed => {
   *   if (confirmed) {
   *     // Delete the item
   *   }
   * });
   * ```
   */
  confirmDelete(itemName: string): Observable<boolean> {
    return this.confirm(
      'Confirm Delete',
      `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      'Delete',
      'Cancel',
      'warn'
    );
  }

  /**
   * Confirm remove from cart
   * @description Convenience method for cart removal confirmations
   * @param productName - Name of product being removed
   * @returns Observable that emits true if confirmed
   *
   * @example
   * ```typescript
   * modalService.confirmRemoveFromCart(product.name).subscribe(confirmed => {
   *   if (confirmed) {
   *     cartService.removeItem(product.id);
   *   }
   * });
   * ```
   */
  confirmRemoveFromCart(productName: string): Observable<boolean> {
    return this.confirm(
      'Remove from Cart',
      `Remove "${productName}" from your cart?`,
      'Remove',
      'Cancel'
    );
  }

  /**
   * Confirm clear cart
   * @description Convenience method for clearing entire cart
   * @returns Observable that emits true if confirmed
   *
   * @example
   * ```typescript
   * modalService.confirmClearCart().subscribe(confirmed => {
   *   if (confirmed) {
   *     cartService.clearCart();
   *   }
   * });
   * ```
   */
  confirmClearCart(): Observable<boolean> {
    return this.confirm(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      'Clear Cart',
      'Cancel',
      'warn'
    );
  }

  /**
   * Confirm logout
   * @description Convenience method for logout confirmations
   * @returns Observable that emits true if confirmed
   *
   * @example
   * ```typescript
   * modalService.confirmLogout().subscribe(confirmed => {
   *   if (confirmed) {
   *     authService.logout();
   *   }
   * });
   * ```
   */
  confirmLogout(): Observable<boolean> {
    return this.confirm(
      'Confirm Logout',
      'Are you sure you want to log out?',
      'Logout',
      'Cancel'
    );
  }

  /**
   * Confirm unsaved changes
   * @description Convenience method for unsaved changes warnings
   * @returns Observable that emits true if user wants to discard changes
   *
   * @example
   * ```typescript
   * modalService.confirmUnsavedChanges().subscribe(discard => {
   *   if (discard) {
   *     router.navigate(['/other-page']);
   *   }
   * });
   * ```
   */
  confirmUnsavedChanges(): Observable<boolean> {
    return this.confirm(
      'Unsaved Changes',
      'You have unsaved changes. Do you want to discard them?',
      'Discard',
      'Cancel',
      'warn'
    );
  }
}
