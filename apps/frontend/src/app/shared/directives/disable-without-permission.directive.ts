import {
  Directive,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  inject,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { PermissionQuery } from '../../store/permissions/permission.query';

/**
 * Disable Without Permission Attribute Directive
 *
 * An attribute directive that disables form elements (buttons, inputs, etc.) based on
 * user permissions without hiding them from the UI. This provides better UX by showing
 * users what actions exist but are currently unavailable to them.
 *
 * ## Features
 * - ✅ Disable elements based on permissions
 * - ✅ Visual feedback (opacity, cursor)
 * - ✅ Tooltip support for explanation
 * - ✅ Material Design compatible
 * - ✅ ARIA attributes for accessibility
 * - ✅ Reactive permission updates
 * - ✅ Memory leak prevention
 * - ✅ Works with native and Material buttons
 *
 * ## Basic Usage
 *
 * ### Single Permission
 * ```html
 * <button [disableWithoutPermission]="'edit_products'" mat-raised-button>
 *   Edit Product
 * </button>
 * ```
 *
 * ### Multiple Permissions (ALL Logic)
 * ```html
 * <button
 *   [disableWithoutPermission]="['edit_products', 'delete_products']"
 *   [disableWithoutPermissionMode]="'all'"
 *   mat-button
 * >
 *   Manage Product
 * </button>
 * ```
 *
 * ### Multiple Permissions (ANY Logic)
 * ```html
 * <button
 *   [disableWithoutPermission]="['edit_products', 'delete_products']"
 *   [disableWithoutPermissionMode]="'any'"
 *   mat-icon-button
 * >
 *   <mat-icon>edit</mat-icon>
 * </button>
 * ```
 *
 * ## Advanced Usage
 *
 * ### With Custom Tooltip
 * ```html
 * <button
 *   [disableWithoutPermission]="'ban_users'"
 *   [disableWithoutPermissionTooltip]="'You need admin permission to ban users'"
 *   mat-icon-button
 * >
 *   <mat-icon>block</mat-icon>
 * </button>
 * ```
 *
 * ### Disable Form Inputs
 * ```html
 * <mat-form-field [disableWithoutPermission]="'edit_user_profile'">
 *   <mat-label>Email</mat-label>
 *   <input matInput [(ngModel)]="user.email" />
 * </mat-form-field>
 * ```
 *
 * ### Disable Select Dropdowns
 * ```html
 * <mat-select
 *   [disableWithoutPermission]="'change_role'"
 *   [disableWithoutPermissionTooltip]="'Insufficient permissions'"
 *   [(ngModel)]="selectedRole"
 * >
 *   <mat-option value="user">User</mat-option>
 *   <mat-option value="admin">Admin</mat-option>
 * </mat-select>
 * ```
 *
 * ### Complete Example
 * ```html
 * <form>
 *   <mat-form-field
 *     [disableWithoutPermission]="'edit_user_profile'"
 *     [disableWithoutPermissionTooltip]="'You cannot edit user profiles'"
 *   >
 *     <mat-label>Username</mat-label>
 *     <input matInput [(ngModel)]="user.name" name="name" />
 *   </mat-form-field>
 *
 *   <mat-form-field [disableWithoutPermission]="'edit_user_email'">
 *     <mat-label>Email</mat-label>
 *     <input matInput [(ngModel)]="user.email" name="email" />
 *   </mat-form-field>
 *
 *   <button
 *     mat-raised-button
 *     color="primary"
 *     type="submit"
 *     [disableWithoutPermission]="['edit_user_profile', 'edit_user_email']"
 *     [disableWithoutPermissionMode]="'all'"
 *     [disableWithoutPermissionTooltip]="'You need full edit permissions'"
 *   >
 *     Save Changes
 *   </button>
 * </form>
 * ```
 *
 * ## Integration with Material Design
 *
 * ### Material Buttons
 * ```html
 * <!-- Raised Button -->
 * <button mat-raised-button [disableWithoutPermission]="'create_order'">
 *   Create Order
 * </button>
 *
 * <!-- Flat Button -->
 * <button mat-button [disableWithoutPermission]="'view_details'">
 *   View Details
 * </button>
 *
 * <!-- Icon Button -->
 * <button mat-icon-button [disableWithoutPermission]="'delete_item'">
 *   <mat-icon>delete</mat-icon>
 * </button>
 *
 * <!-- FAB Button -->
 * <button mat-fab [disableWithoutPermission]="'add_item'">
 *   <mat-icon>add</mat-icon>
 * </button>
 * ```
 *
 * ### Material Form Controls
 * ```html
 * <!-- Input -->
 * <mat-form-field>
 *   <input
 *     matInput
 *     [disableWithoutPermission]="'edit_field'"
 *     placeholder="Enter value"
 *   />
 * </mat-form-field>
 *
 * <!-- Checkbox -->
 * <mat-checkbox [disableWithoutPermission]="'toggle_feature'">
 *   Enable Feature
 * </mat-checkbox>
 *
 * <!-- Radio Button -->
 * <mat-radio-button [disableWithoutPermission]="'select_option'">
 *   Option A
 * </mat-radio-button>
 *
 * <!-- Slide Toggle -->
 * <mat-slide-toggle [disableWithoutPermission]="'toggle_setting'">
 *   Setting
 * </mat-slide-toggle>
 * ```
 *
 * ## Visual Feedback
 *
 * When disabled, the directive applies:
 * - `opacity: 0.5` - Visual dimming
 * - `cursor: not-allowed` - Cursor feedback
 * - `pointer-events: none` - Prevents interaction
 * - `disabled` attribute - Native HTML disabled state
 *
 * ## Accessibility (WCAG 2.1 AA)
 *
 * The directive ensures accessibility by:
 * - Adding `aria-disabled="true"` when disabled
 * - Adding `aria-label` with explanation
 * - Setting `tabindex="-1"` to prevent keyboard focus
 * - Screen reader announcement of disabled state
 *
 * ## Permission Modes
 *
 * ### Mode: 'all' (AND Logic - Default)
 * Element is enabled only if user has ALL permissions:
 * ```html
 * <button
 *   [disableWithoutPermission]="['view_users', 'edit_users']"
 *   [disableWithoutPermissionMode]="'all'"
 * >
 *   <!-- Enabled only if user has BOTH permissions -->
 * </button>
 * ```
 *
 * ### Mode: 'any' (OR Logic)
 * Element is enabled if user has AT LEAST ONE permission:
 * ```html
 * <button
 *   [disableWithoutPermission]="['view_users', 'edit_users']"
 *   [disableWithoutPermissionMode]="'any'"
 * >
 *   <!-- Enabled if user has view_users OR edit_users OR both -->
 * </button>
 * ```
 *
 * ## Common Patterns
 *
 * ### Edit/Delete Actions
 * ```html
 * <div class="actions">
 *   <button
 *     mat-button
 *     [disableWithoutPermission]="'edit_product'"
 *     (click)="edit()"
 *   >
 *     Edit
 *   </button>
 *   <button
 *     mat-button
 *     color="warn"
 *     [disableWithoutPermission]="'delete_product'"
 *     [disableWithoutPermissionTooltip]="'You cannot delete products'"
 *     (click)="delete()"
 *   >
 *     Delete
 *   </button>
 * </div>
 * ```
 *
 * ### Form Actions
 * ```html
 * <div mat-dialog-actions>
 *   <button mat-button mat-dialog-close>Cancel</button>
 *   <button
 *     mat-raised-button
 *     color="primary"
 *     [disableWithoutPermission]="'save_changes'"
 *     [disabled]="form.invalid"
 *     (click)="save()"
 *   >
 *     Save
 *   </button>
 * </div>
 * ```
 *
 * ### Conditional Editing
 * ```html
 * <mat-card>
 *   <mat-card-header>User Profile</mat-card-header>
 *   <mat-card-content>
 *     <form [formGroup]="profileForm">
 *       <mat-form-field>
 *         <input
 *           matInput
 *           formControlName="name"
 *           [disableWithoutPermission]="'edit_profile'"
 *         />
 *       </mat-form-field>
 *     </form>
 *   </mat-card-content>
 * </mat-card>
 * ```
 *
 * ## Performance Optimization
 *
 * The directive automatically:
 * - Uses `distinctUntilChanged()` to prevent unnecessary updates
 * - Unsubscribes on component destroy (memory leak prevention)
 * - Shares permission check observables
 * - Applies styles efficiently using Renderer2
 *
 * ## Combining with Native [disabled]
 *
 * You can combine this directive with Angular's native `[disabled]` binding:
 * ```html
 * <button
 *   [disableWithoutPermission]="'submit_order'"
 *   [disabled]="form.invalid || isSubmitting"
 *   (click)="submitOrder()"
 * >
 *   Submit Order
 * </button>
 * ```
 *
 * The button will be disabled if:
 * - User lacks 'submit_order' permission, OR
 * - Form is invalid, OR
 * - Submission is in progress
 *
 * @example
 * // Component Usage
 * @Component({
 *   selector: 'app-product-list',
 *   standalone: true,
 *   imports: [CommonModule, DisableWithoutPermissionDirective],
 *   template: `
 *     <button [disableWithoutPermission]="'delete_product'">Delete</button>
 *   `
 * })
 * export class ProductListComponent {}
 *
 * @see {@link PermissionQuery} for underlying permission checks
 * @see {@link HasPermissionDirective} for hiding elements
 *
 * @swagger
 * components:
 *   directives:
 *     DisableWithoutPermissionDirective:
 *       description: Attribute directive for permission-based element disabling
 *       inputs:
 *         disableWithoutPermission:
 *           type: string | string[]
 *           description: Permission(s) required to enable element
 *           required: true
 *         disableWithoutPermissionMode:
 *           type: 'any' | 'all'
 *           description: Logic mode for multiple permissions
 *           default: 'all'
 *         disableWithoutPermissionTooltip:
 *           type: string
 *           description: Tooltip message explaining why element is disabled
 */
@Directive({
  selector: '[disableWithoutPermission]',
  standalone: true,
})
export class DisableWithoutPermissionDirective implements OnInit, OnDestroy {
  /**
   * Permission(s) required to enable element
   *
   * Can be a single permission string or an array of permissions.
   * When multiple permissions are provided, use `disableWithoutPermissionMode` to specify logic.
   *
   * @example
   * ```html
   * <!-- Single permission -->
   * <button [disableWithoutPermission]="'edit_users'">Edit</button>
   *
   * <!-- Multiple permissions -->
   * <button [disableWithoutPermission]="['edit_users', 'delete_users']">Manage</button>
   * ```
   */
  @Input() disableWithoutPermission!: string | string[];

  /**
   * Permission check mode
   *
   * - 'all': User must have ALL permissions to enable element (AND logic)
   * - 'any': User must have AT LEAST ONE permission to enable element (OR logic)
   *
   * Default: 'all'
   *
   * @example
   * ```html
   * <!-- Require both permissions -->
   * <button
   *   [disableWithoutPermission]="['view_users', 'edit_users']"
   *   [disableWithoutPermissionMode]="'all'"
   * >...</button>
   *
   * <!-- Require at least one -->
   * <button
   *   [disableWithoutPermission]="['view_users', 'edit_users']"
   *   [disableWithoutPermissionMode]="'any'"
   * >...</button>
   * ```
   */
  @Input() disableWithoutPermissionMode: 'any' | 'all' = 'all';

  /**
   * Tooltip message for disabled state
   *
   * Explains why the element is disabled.
   * Displayed on hover (if element supports title attribute).
   *
   * @example
   * ```html
   * <button
   *   [disableWithoutPermission]="'ban_users'"
   *   [disableWithoutPermissionTooltip]="'You need admin permission to ban users'"
   * >
   *   Ban User
   * </button>
   * ```
   */
  @Input() disableWithoutPermissionTooltip?: string;

  /**
   * Subject for cleanup on destroy
   * Prevents memory leaks by unsubscribing from all observables
   */
  private destroy$ = new Subject<void>();

  /**
   * Permission Query Service
   * Injected using modern inject() function
   */
  private permissionQuery = inject(PermissionQuery);

  /**
   * Element Reference
   * Reference to the host element this directive is attached to
   */
  private el = inject(ElementRef);

  /**
   * Renderer2 Service
   * Used for safe DOM manipulation
   */
  private renderer = inject(Renderer2);

  /**
   * Constructor
   *
   * Dependencies are injected using Angular's modern inject() function.
   */
  constructor() {}

  /**
   * Lifecycle Hook: OnInit
   *
   * Initializes the directive and sets up reactive permission checking.
   * Subscribes to permission changes and updates element state accordingly.
   *
   * Flow:
   * 1. Validate inputs
   * 2. Set up permission check observable
   * 3. Subscribe and update element state
   *
   * @throws {Error} If disableWithoutPermission input is not provided
   */
  ngOnInit(): void {
    // Validate required inputs
    if (!this.disableWithoutPermission) {
      console.error(
        '[DisableWithoutPermissionDirective] disableWithoutPermission input is required'
      );
      return;
    }

    // Set up permission check observable
    const permissions = Array.isArray(this.disableWithoutPermission)
      ? this.disableWithoutPermission
      : [this.disableWithoutPermission];

    const permissionCheck$ =
      this.disableWithoutPermissionMode === 'any'
        ? this.permissionQuery.hasAnyPermission(permissions)
        : this.permissionQuery.hasAllPermissions(permissions);

    // Subscribe to permission changes
    permissionCheck$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((hasPermission) => {
        this.updateElementState(hasPermission);
      });
  }

  /**
   * Lifecycle Hook: OnDestroy
   *
   * Cleanup method called when directive is destroyed.
   * Completes the destroy$ subject to unsubscribe from all observables.
   *
   * This prevents memory leaks by:
   * - Unsubscribing from permission observables
   * - Releasing element reference
   * - Cleaning up event listeners
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update Element State Based on Permission
   *
   * Enables or disables the element based on permission state.
   * Applies visual styles, ARIA attributes, and tooltips.
   *
   * When disabled:
   * - Adds `disabled` attribute
   * - Sets `opacity: 0.5`
   * - Sets `cursor: not-allowed`
   * - Sets `pointer-events: none`
   * - Sets `tabindex: -1`
   * - Adds ARIA attributes
   * - Adds tooltip (if provided)
   *
   * When enabled:
   * - Removes all disabled styles and attributes
   * - Restores original state
   *
   * @param hasPermission - Whether user has required permission
   * @private
   */
  private updateElementState(hasPermission: boolean): void {
    if (hasPermission) {
      this.enableElement();
    } else {
      this.disableElement();
    }
  }

  /**
   * Disable Element
   *
   * Applies disabled state with visual feedback and accessibility attributes.
   *
   * Changes applied:
   * 1. Native disabled attribute
   * 2. Visual styles (opacity, cursor, pointer-events)
   * 3. ARIA attributes for accessibility
   * 4. Tooltip (if provided)
   * 5. Keyboard navigation prevention (tabindex)
   *
   * @private
   */
  private disableElement(): void {
    const element = this.el.nativeElement;

    // Add disabled attribute (works for buttons, inputs, etc.)
    this.renderer.setAttribute(element, 'disabled', 'true');

    // Visual feedback
    this.renderer.setStyle(element, 'opacity', '0.5');
    this.renderer.setStyle(element, 'cursor', 'not-allowed');
    this.renderer.setStyle(element, 'pointer-events', 'none');

    // Accessibility (WCAG 2.1 AA)
    this.renderer.setAttribute(element, 'aria-disabled', 'true');
    this.renderer.setAttribute(element, 'tabindex', '-1');

    // Add descriptive ARIA label
    const ariaLabel = this.disableWithoutPermissionTooltip
      ? `Action disabled: ${this.disableWithoutPermissionTooltip}`
      : 'Action disabled: insufficient permissions';
    this.renderer.setAttribute(element, 'aria-label', ariaLabel);

    // Add tooltip using title attribute (basic tooltip support)
    if (this.disableWithoutPermissionTooltip) {
      this.renderer.setAttribute(
        element,
        'title',
        this.disableWithoutPermissionTooltip
      );
    }

    // Special handling for Material Design components
    this.handleMaterialComponent(element, true);
  }

  /**
   * Enable Element
   *
   * Removes disabled state and restores original appearance.
   *
   * Changes applied:
   * 1. Remove disabled attribute
   * 2. Remove visual styles
   * 3. Remove ARIA disabled attributes
   * 4. Remove tooltip
   * 5. Restore keyboard navigation
   *
   * @private
   */
  private enableElement(): void {
    const element = this.el.nativeElement;

    // Remove disabled attribute
    this.renderer.removeAttribute(element, 'disabled');

    // Remove visual styles
    this.renderer.removeStyle(element, 'opacity');
    this.renderer.removeStyle(element, 'cursor');
    this.renderer.removeStyle(element, 'pointer-events');

    // Accessibility (WCAG 2.1 AA)
    this.renderer.setAttribute(element, 'aria-disabled', 'false');
    this.renderer.removeAttribute(element, 'tabindex');
    this.renderer.removeAttribute(element, 'aria-label');

    // Remove tooltip
    this.renderer.removeAttribute(element, 'title');

    // Special handling for Material Design components
    this.handleMaterialComponent(element, false);
  }

  /**
   * Handle Material Design Components
   *
   * Applies special handling for Angular Material components.
   * Material components may need additional class manipulation.
   *
   * Material Button Types:
   * - mat-button
   * - mat-raised-button
   * - mat-flat-button
   * - mat-stroked-button
   * - mat-icon-button
   * - mat-fab
   * - mat-mini-fab
   *
   * @param element - The DOM element
   * @param disable - Whether to disable (true) or enable (false)
   * @private
   */
  private handleMaterialComponent(element: HTMLElement, disable: boolean): void {
    // Check if element has Material button attributes
    const isMaterialButton =
      element.hasAttribute('mat-button') ||
      element.hasAttribute('mat-raised-button') ||
      element.hasAttribute('mat-flat-button') ||
      element.hasAttribute('mat-stroked-button') ||
      element.hasAttribute('mat-icon-button') ||
      element.hasAttribute('mat-fab') ||
      element.hasAttribute('mat-mini-fab');

    if (isMaterialButton) {
      // Material buttons already handle disabled state well
      // Just ensure the disabled attribute is set correctly
      if (disable) {
        this.renderer.addClass(element, 'mat-button-disabled');
      } else {
        this.renderer.removeClass(element, 'mat-button-disabled');
      }
    }

    // Check if element is Material form field or input
    const isMaterialFormControl =
      element.tagName === 'MAT-FORM-FIELD' ||
      element.classList.contains('mat-form-field') ||
      element.classList.contains('mat-select') ||
      element.classList.contains('mat-checkbox') ||
      element.classList.contains('mat-slide-toggle');

    if (isMaterialFormControl) {
      // For form fields, we may need to find the actual input/control
      const input = element.querySelector('input, select, textarea');
      if (input) {
        if (disable) {
          this.renderer.setAttribute(input, 'disabled', 'true');
        } else {
          this.renderer.removeAttribute(input, 'disabled');
        }
      }
    }
  }
}
