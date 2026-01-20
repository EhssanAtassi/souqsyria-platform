import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ModalService } from '../services/modal.service';

/**
 * Component interface for unsaved changes detection
 *
 * @description
 * Components that want to use the UnsavedChangesGuard must implement this interface.
 * The guard will call canDeactivate() before allowing navigation away from the component.
 */
export interface ComponentCanDeactivate {
  /**
   * Determines if the component can be deactivated
   * @returns Observable, Promise, or boolean indicating if navigation should proceed
   */
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

/**
 * Unsaved Changes Guard
 *
 * @description
 * Prevents users from accidentally navigating away from forms with unsaved changes.
 * Integrates with ModalService to show a professional confirmation dialog in Arabic/English.
 *
 * This guard protects users from losing their work by:
 * - Detecting unsaved changes before navigation
 * - Showing a bilingual confirmation dialog
 * - Allowing users to cancel navigation and save their work
 * - Proceeding with navigation if user confirms data loss
 *
 * Features:
 * - Integration with ModalService for consistent UI
 * - Support for synchronous and asynchronous change detection
 * - Automatic handling of browser refresh/close events
 * - Syrian marketplace styling and bilingual messaging
 *
 * @example
 * ```typescript
 * // In component that has forms with unsaved changes
 * export class ProfileSettingsComponent implements ComponentCanDeactivate {
 *   private hasUnsavedChanges = signal<boolean>(false);
 *
 *   canDeactivate(): Observable<boolean> | boolean {
 *     if (!this.hasUnsavedChanges()) {
 *       return true; // No unsaved changes, allow navigation
 *     }
 *
 *     // Has unsaved changes, let guard handle confirmation
 *     return false;
 *   }
 *
 *   onFormChange(): void {
 *     this.hasUnsavedChanges.set(true);
 *   }
 *
 *   onFormSave(): void {
 *     this.hasUnsavedChanges.set(false);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'account/profile',
 *   component: ProfileSettingsComponent,
 *   canDeactivate: [unsavedChangesGuard]
 * }
 *
 * {
 *   path: 'account/addresses/new',
 *   component: AddressFormComponent,
 *   canDeactivate: [unsavedChangesGuard]
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UnsavedChangesGuard:
 *       type: object
 *       description: Route guard for unsaved changes detection
 *       properties:
 *         canDeactivate:
 *           type: boolean
 *           description: Whether component can be deactivated
 *         confirmationDialog:
 *           type: object
 *           properties:
 *             titleEn:
 *               type: string
 *               example: Unsaved Changes
 *             titleAr:
 *               type: string
 *               example: تغييرات غير محفوظة
 *             messageEn:
 *               type: string
 *               example: You have unsaved changes. Do you want to discard them?
 *             messageAr:
 *               type: string
 *               example: لديك تغييرات غير محفوظة. هل تريد تجاهلها؟
 */
export const unsavedChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (
  component,
  currentRoute,
  currentState,
  nextState
): Observable<boolean> | Promise<boolean> | boolean => {
  const modalService = inject(ModalService);

  // If component doesn't implement canDeactivate, allow navigation
  if (!component || typeof component.canDeactivate !== 'function') {
    return true;
  }

  // Get the component's deactivation decision
  const canDeactivate = component.canDeactivate();

  // If component allows deactivation (no unsaved changes), proceed
  if (canDeactivate === true) {
    return true;
  }

  // If component returns Observable or Promise, handle accordingly
  if (canDeactivate instanceof Observable || canDeactivate instanceof Promise) {
    const canDeactivate$ = canDeactivate instanceof Promise
      ? from(canDeactivate)
      : canDeactivate;

    return canDeactivate$.pipe(
      take(1),
      map(result => {
        if (result) {
          return true; // Component allows deactivation
        }
        // Component has unsaved changes, show confirmation
        return showConfirmationDialog(modalService);
      })
    );
  }

  // Component returned false, meaning it has unsaved changes
  // Show confirmation dialog using ModalService
  return showConfirmationDialog(modalService);
};

/**
 * Show confirmation dialog for unsaved changes
 * Uses ModalService.confirmUnsavedChanges() for consistent UI
 *
 * @param modalService - Injected ModalService instance
 * @returns Observable<boolean> - true if user confirms discard, false if user cancels
 */
function showConfirmationDialog(modalService: ModalService): Observable<boolean> {
  return modalService.confirmUnsavedChanges().pipe(take(1));
}

/**
 * Browser Beforeunload Handler Factory
 *
 * @description
 * Creates a beforeunload event handler to prevent accidental browser close/refresh
 * when there are unsaved changes. This is separate from the Angular route guard
 * and handles browser-level navigation (refresh, close tab, etc.).
 *
 * @param hasUnsavedChanges - Function that returns whether there are unsaved changes
 * @returns Event handler function for window.beforeunload
 *
 * @example
 * ```typescript
 * export class ProfileSettingsComponent implements OnInit, OnDestroy {
 *   private hasUnsavedChanges = signal<boolean>(false);
 *   private beforeunloadHandler?: (e: BeforeUnloadEvent) => void;
 *
 *   ngOnInit(): void {
 *     // Setup browser refresh/close protection
 *     this.beforeunloadHandler = createBeforeunloadHandler(
 *       () => this.hasUnsavedChanges()
 *     );
 *     window.addEventListener('beforeunload', this.beforeunloadHandler);
 *   }
 *
 *   ngOnDestroy(): void {
 *     // Remove handler when component is destroyed
 *     if (this.beforeunloadHandler) {
 *       window.removeEventListener('beforeunload', this.beforeunloadHandler);
 *     }
 *   }
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     BeforeunloadHandler:
 *       type: object
 *       description: Browser-level unsaved changes protection
 *       properties:
 *         hasUnsavedChanges:
 *           type: function
 *           description: Function that returns boolean indicating unsaved changes
 *         browserMessage:
 *           type: string
 *           description: Message shown in browser confirmation dialog
 *           example: You have unsaved changes. Are you sure you want to leave?
 */
export function createBeforeunloadHandler(
  hasUnsavedChanges: () => boolean
): (e: BeforeUnloadEvent) => void {
  return (e: BeforeUnloadEvent): void => {
    if (hasUnsavedChanges()) {
      // Modern browsers ignore custom messages and show their own
      // But we still need to set returnValue for the dialog to appear
      e.preventDefault();
      e.returnValue = '';
    }
  };
}

/**
 * Helper function to convert Promise to Observable
 */
function from<T>(promise: Promise<T>): Observable<T> {
  return new Observable(observer => {
    promise
      .then(value => {
        observer.next(value);
        observer.complete();
      })
      .catch(error => {
        observer.error(error);
      });
  });
}

/**
 * Dirty Form Tracker Service Helper
 *
 * @description
 * Utility class to help track form dirty state across multiple forms in a component.
 * Useful for complex forms with tabs or multiple sections.
 *
 * @example
 * ```typescript
 * export class AccountSettingsComponent implements ComponentCanDeactivate {
 *   private dirtyTracker = new DirtyFormTracker();
 *
 *   ngOnInit(): void {
 *     // Register forms
 *     this.dirtyTracker.registerForm('profile', this.profileForm);
 *     this.dirtyTracker.registerForm('notifications', this.notificationsForm);
 *     this.dirtyTracker.registerForm('privacy', this.privacyForm);
 *   }
 *
 *   canDeactivate(): boolean {
 *     return !this.dirtyTracker.hasAnyDirtyForms();
 *   }
 *
 *   saveAllForms(): void {
 *     // Save logic...
 *     this.dirtyTracker.markAllAsPristine();
 *   }
 * }
 * ```
 */
export class DirtyFormTracker {
  private forms = new Map<string, any>();

  /**
   * Register a form for dirty tracking
   * @param formName - Unique name for the form
   * @param form - Angular FormGroup or FormControl
   */
  registerForm(formName: string, form: any): void {
    this.forms.set(formName, form);
  }

  /**
   * Unregister a form from tracking
   * @param formName - Name of the form to unregister
   */
  unregisterForm(formName: string): void {
    this.forms.delete(formName);
  }

  /**
   * Check if any registered form is dirty
   * @returns true if at least one form is dirty
   */
  hasAnyDirtyForms(): boolean {
    for (const form of this.forms.values()) {
      if (form && form.dirty) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get list of dirty form names
   * @returns Array of form names that are dirty
   */
  getDirtyFormNames(): string[] {
    const dirtyForms: string[] = [];
    for (const [name, form] of this.forms.entries()) {
      if (form && form.dirty) {
        dirtyForms.push(name);
      }
    }
    return dirtyForms;
  }

  /**
   * Mark all forms as pristine
   * Call this after successfully saving all forms
   */
  markAllAsPristine(): void {
    for (const form of this.forms.values()) {
      if (form && form.markAsPristine) {
        form.markAsPristine();
      }
    }
  }

  /**
   * Clear all registered forms
   */
  clear(): void {
    this.forms.clear();
  }
}

/**
 * Async Data Tracker
 *
 * @description
 * Tracks unsaved changes for components that don't use Angular forms.
 * Useful for components with custom state management or API-driven data.
 *
 * @example
 * ```typescript
 * export class WishlistComponent implements ComponentCanDeactivate, OnInit, OnDestroy {
 *   private changeTracker = new AsyncDataTracker();
 *   private readonly destroyRef = inject(DestroyRef);
 *
 *   ngOnInit(): void {
 *     // Track data changes
 *     this.items$.pipe(
 *       takeUntilDestroyed(this.destroyRef)
 *     ).subscribe(items => {
 *       this.changeTracker.setOriginalData(items);
 *     });
 *   }
 *
 *   onItemChange(newItems: any[]): void {
 *     this.changeTracker.setCurrentData(newItems);
 *   }
 *
 *   canDeactivate(): boolean {
 *     return !this.changeTracker.hasChanges();
 *   }
 *
 *   saveChanges(): void {
 *     // Save logic...
 *     this.changeTracker.markAsSaved();
 *   }
 * }
 * ```
 */
export class AsyncDataTracker<T = any> {
  private originalData: T | null = null;
  private currentData: T | null = null;
  private customComparator?: (original: T, current: T) => boolean;

  constructor(comparator?: (original: T, current: T) => boolean) {
    this.customComparator = comparator;
  }

  /**
   * Set the original data (from server/initial load)
   * @param data - Original data
   */
  setOriginalData(data: T): void {
    this.originalData = JSON.parse(JSON.stringify(data)); // Deep clone
    this.currentData = JSON.parse(JSON.stringify(data));
  }

  /**
   * Set the current data (after user modifications)
   * @param data - Current data
   */
  setCurrentData(data: T): void {
    this.currentData = data;
  }

  /**
   * Check if there are unsaved changes
   * @returns true if current data differs from original
   */
  hasChanges(): boolean {
    if (this.originalData === null || this.currentData === null) {
      return false;
    }

    if (this.customComparator) {
      return !this.customComparator(this.originalData, this.currentData);
    }

    // Default: JSON comparison
    return JSON.stringify(this.originalData) !== JSON.stringify(this.currentData);
  }

  /**
   * Mark current data as saved (sync original with current)
   */
  markAsSaved(): void {
    if (this.currentData !== null) {
      this.originalData = JSON.parse(JSON.stringify(this.currentData));
    }
  }

  /**
   * Reset current data to original
   */
  reset(): void {
    if (this.originalData !== null) {
      this.currentData = JSON.parse(JSON.stringify(this.originalData));
    }
  }

  /**
   * Clear all tracked data
   */
  clear(): void {
    this.originalData = null;
    this.currentData = null;
  }
}
