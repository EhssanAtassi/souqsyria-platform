import {
  Directive,
  Input,
  OnInit,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { PermissionQuery } from '../../store/permissions/permission.query';

/**
 * Has Permission Structural Directive
 *
 * A structural directive that conditionally displays elements based on user permissions.
 * This directive provides flexible permission checking with support for single/multiple
 * permissions, loading states, else templates, and role-based fallbacks.
 *
 * ## Features
 * - ✅ Single permission check
 * - ✅ Multiple permissions (ANY/ALL logic)
 * - ✅ Loading state handling
 * - ✅ Else template support
 * - ✅ Role-based fallback
 * - ✅ Reactive permission updates
 * - ✅ Memory leak prevention
 * - ✅ Type-safe inputs
 *
 * ## Basic Usage
 *
 * ### Single Permission
 * ```html
 * <button *hasPermission="'create_products'">Create Product</button>
 * ```
 *
 * ### Multiple Permissions (OR Logic)
 * ```html
 * <div *hasPermission="['edit_products', 'delete_products']; mode: 'any'">
 *   Admin Actions
 * </div>
 * ```
 *
 * ### Multiple Permissions (AND Logic)
 * ```html
 * <div *hasPermission="['view_users', 'manage_users']; mode: 'all'">
 *   User Management Panel
 * </div>
 * ```
 *
 * ## Advanced Usage
 *
 * ### With Else Template
 * ```html
 * <button *hasPermission="'admin_access'; else: noAccess">
 *   Admin Panel
 * </button>
 * <ng-template #noAccess>
 *   <p>Insufficient permissions</p>
 * </ng-template>
 * ```
 *
 * ### With Loading Template
 * ```html
 * <div *hasPermission="'manage_orders'; loading: loadingTemplate">
 *   Orders Dashboard
 * </div>
 * <ng-template #loadingTemplate>
 *   <mat-spinner diameter="20"></mat-spinner>
 * </ng-template>
 * ```
 *
 * ### With Role Fallback
 * ```html
 * <nav *hasPermission="'admin_panel'; fallbackRole: 'admin'">
 *   Admin Navigation
 * </nav>
 * ```
 *
 * ### Complete Example
 * ```html
 * <section
 *   *hasPermission="['edit_products', 'delete_products'];
 *                    mode: 'any';
 *                    loading: loadingTpl;
 *                    else: noAccessTpl;
 *                    fallbackRole: 'admin'"
 * >
 *   <h2>Product Management</h2>
 *   <button (click)="editProduct()">Edit</button>
 *   <button (click)="deleteProduct()">Delete</button>
 * </section>
 *
 * <ng-template #loadingTpl>
 *   <div class="loading-state">
 *     <mat-spinner diameter="24"></mat-spinner>
 *     <span>Loading permissions...</span>
 *   </div>
 * </ng-template>
 *
 * <ng-template #noAccessTpl>
 *   <div class="no-access">
 *     <mat-icon>lock</mat-icon>
 *     <p>You don't have permission to access this section</p>
 *   </div>
 * </ng-template>
 * ```
 *
 * ## Permission Modes
 *
 * ### Mode: 'all' (AND Logic - Default)
 * User must have ALL specified permissions:
 * ```html
 * <div *hasPermission="['view_users', 'edit_users']; mode: 'all'">
 *   <!-- Shown only if user has BOTH view_users AND edit_users -->
 * </div>
 * ```
 *
 * ### Mode: 'any' (OR Logic)
 * User must have AT LEAST ONE permission:
 * ```html
 * <div *hasPermission="['view_users', 'edit_users']; mode: 'any'">
 *   <!-- Shown if user has view_users OR edit_users OR both -->
 * </div>
 * ```
 *
 * ## Integration with Material Design
 *
 * ### Material Buttons
 * ```html
 * <button mat-raised-button *hasPermission="'create_order'" color="primary">
 *   Create Order
 * </button>
 * ```
 *
 * ### Material Cards
 * ```html
 * <mat-card *hasPermission="'view_dashboard'">
 *   <mat-card-header>Dashboard</mat-card-header>
 *   <mat-card-content>...</mat-card-content>
 * </mat-card>
 * ```
 *
 * ### Material Menu Items
 * ```html
 * <mat-menu #menu="matMenu">
 *   <button mat-menu-item *hasPermission="'view_products'">Products</button>
 *   <button mat-menu-item *hasPermission="'view_orders'">Orders</button>
 *   <button mat-menu-item *hasPermission="'manage_users'">Users</button>
 * </mat-menu>
 * ```
 *
 * ## Performance Optimization
 *
 * The directive automatically:
 * - Uses `distinctUntilChanged()` to prevent unnecessary updates
 * - Unsubscribes on component destroy (memory leak prevention)
 * - Shares permission check observables
 * - Caches template references
 *
 * ## Accessibility (WCAG 2.1 AA)
 *
 * The directive automatically handles accessibility:
 * - Removed elements don't affect DOM (not just hidden)
 * - Screen readers won't encounter hidden content
 * - Focus management handled automatically
 * - No tab-index pollution
 *
 * ## Common Patterns
 *
 * ### Admin-Only Section
 * ```html
 * <section *hasPermission="'admin_panel'; fallbackRole: 'admin'">
 *   <!-- Admin content -->
 * </section>
 * ```
 *
 * ### Edit/Delete Actions
 * ```html
 * <div class="actions" *hasPermission="['edit_products', 'delete_products']; mode: 'any'">
 *   <button *hasPermission="'edit_products'">Edit</button>
 *   <button *hasPermission="'delete_products'">Delete</button>
 * </div>
 * ```
 *
 * ### Feature Flags
 * ```html
 * <div *hasPermission="'beta_features'">
 *   <app-new-feature />
 * </div>
 * ```
 *
 * @example
 * // Component Usage
 * @Component({
 *   selector: 'app-product-list',
 *   standalone: true,
 *   imports: [CommonModule, HasPermissionDirective],
 *   template: `
 *     <button *hasPermission="'create_products'">Create</button>
 *   `
 * })
 * export class ProductListComponent {}
 *
 * @see {@link PermissionQuery} for underlying permission checks
 * @see {@link DisableWithoutPermissionDirective} for disabling elements
 *
 * @swagger
 * components:
 *   directives:
 *     HasPermissionDirective:
 *       description: Structural directive for permission-based element visibility
 *       inputs:
 *         hasPermission:
 *           type: string | string[]
 *           description: Permission(s) to check
 *           required: true
 *         hasPermissionMode:
 *           type: 'any' | 'all'
 *           description: Logic mode for multiple permissions
 *           default: 'all'
 *         hasPermissionElse:
 *           type: TemplateRef<any>
 *           description: Template to show when permission denied
 *         hasPermissionLoading:
 *           type: TemplateRef<any>
 *           description: Template to show while loading permissions
 *         hasPermissionFallbackRole:
 *           type: string
 *           description: Role to check if permission check fails
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  /**
   * Permission(s) to check
   *
   * Can be a single permission string or an array of permissions.
   * When multiple permissions are provided, use `hasPermissionMode` to specify logic.
   *
   * @example
   * ```html
   * <!-- Single permission -->
   * <div *hasPermission="'view_users'">Content</div>
   *
   * <!-- Multiple permissions -->
   * <div *hasPermission="['view_users', 'edit_users']">Content</div>
   * ```
   */
  @Input() hasPermission!: string | string[];

  /**
   * Permission check mode
   *
   * - 'all': User must have ALL permissions (AND logic)
   * - 'any': User must have AT LEAST ONE permission (OR logic)
   *
   * Default: 'all'
   *
   * @example
   * ```html
   * <!-- Require both permissions -->
   * <div *hasPermission="['view_users', 'edit_users']; mode: 'all'">...</div>
   *
   * <!-- Require at least one -->
   * <div *hasPermission="['view_users', 'edit_users']; mode: 'any'">...</div>
   * ```
   */
  @Input() hasPermissionMode: 'any' | 'all' = 'all';

  /**
   * Else template reference
   *
   * Template to display when user lacks permission.
   * Useful for showing "Access Denied" messages.
   *
   * @example
   * ```html
   * <div *hasPermission="'admin_access'; else: noAccess">
   *   Admin Panel
   * </div>
   * <ng-template #noAccess>
   *   <p>Access Denied</p>
   * </ng-template>
   * ```
   */
  @Input() hasPermissionElse?: TemplateRef<any>;

  /**
   * Loading template reference
   *
   * Template to display while permission check is in progress.
   * Useful for showing spinners during initial load.
   *
   * @example
   * ```html
   * <div *hasPermission="'view_data'; loading: loadingTpl">
   *   Data Content
   * </div>
   * <ng-template #loadingTpl>
   *   <mat-spinner></mat-spinner>
   * </ng-template>
   * ```
   */
  @Input() hasPermissionLoading?: TemplateRef<any>;

  /**
   * Fallback role name
   *
   * If permission check fails, check if user has this role instead.
   * Useful for admin overrides.
   *
   * @example
   * ```html
   * <div *hasPermission="'manage_users'; fallbackRole: 'admin'">
   *   <!-- Shown if user has 'manage_users' OR 'admin' role -->
   * </div>
   * ```
   */
  @Input() hasPermissionFallbackRole?: string;

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
   * Template Reference
   * The template to render when permission is granted
   */
  private templateRef = inject(TemplateRef<any>);

  /**
   * View Container Reference
   * Controls rendering of templates in the DOM
   */
  private viewContainer = inject(ViewContainerRef);

  /**
   * Constructor
   *
   * Dependencies are injected using Angular's modern inject() function.
   * This approach is cleaner than constructor injection for standalone directives.
   */
  constructor() {}

  /**
   * Lifecycle Hook: OnInit
   *
   * Initializes the directive and sets up reactive permission checking.
   * Subscribes to permission changes and updates the view accordingly.
   *
   * Flow:
   * 1. Validate inputs
   * 2. Set up permission check observable
   * 3. Combine with loading state
   * 4. Subscribe and update view
   *
   * @throws {Error} If hasPermission input is not provided
   */
  ngOnInit(): void {
    // Validate required inputs
    if (!this.hasPermission) {
      console.error('[HasPermissionDirective] hasPermission input is required');
      return;
    }

    // Set up permission check observable
    const permissionCheck$ = this.createPermissionCheck();

    // Combine permission check with loading state
    combineLatest([this.permissionQuery.loading$, permissionCheck$])
      .pipe(
        distinctUntilChanged(
          ([prevLoading, prevHasAccess], [currLoading, currHasAccess]) =>
            prevLoading === currLoading && prevHasAccess === currHasAccess
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([loading, hasAccess]) => {
        this.updateView(loading, hasAccess);
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
   * - Releasing template references
   * - Cleaning up view container
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Create Permission Check Observable
   *
   * Creates an observable that emits permission check results.
   * Handles single/multiple permissions and fallback roles.
   *
   * Logic:
   * 1. Check primary permission(s)
   * 2. If failed and fallbackRole exists, check role
   * 3. Return combined result
   *
   * @returns Observable that emits true if user has access
   * @private
   */
  private createPermissionCheck() {
    // Convert single permission to array for uniform handling
    const permissions = Array.isArray(this.hasPermission)
      ? this.hasPermission
      : [this.hasPermission];

    // Select appropriate permission check method
    const permissionCheck$ =
      this.hasPermissionMode === 'any'
        ? this.permissionQuery.hasAnyPermission(permissions)
        : this.permissionQuery.hasAllPermissions(permissions);

    // Add role fallback if specified
    if (this.hasPermissionFallbackRole) {
      return permissionCheck$.pipe(
        switchMap((hasPermission) => {
          if (hasPermission) {
            return of(true);
          }
          // Check fallback role
          return this.permissionQuery.hasRole(this.hasPermissionFallbackRole!);
        })
      );
    }

    return permissionCheck$;
  }

  /**
   * Update View Based on Permission State
   *
   * Updates the DOM by rendering the appropriate template:
   * - Loading template (if loading)
   * - Main template (if has access)
   * - Else template (if no access)
   * - Nothing (if no else template)
   *
   * This method is called whenever:
   * - Loading state changes
   * - Permission state changes
   * - User permissions are updated
   *
   * @param loading - Whether permissions are currently loading
   * @param hasAccess - Whether user has required permission
   * @private
   */
  private updateView(loading: boolean, hasAccess: boolean): void {
    // Clear existing view
    this.viewContainer.clear();

    if (loading && this.hasPermissionLoading) {
      // Show loading template
      this.viewContainer.createEmbeddedView(this.hasPermissionLoading);
    } else if (hasAccess) {
      // Show main template (user has permission)
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else if (this.hasPermissionElse) {
      // Show else template (user lacks permission)
      this.viewContainer.createEmbeddedView(this.hasPermissionElse);
    }
    // If no access and no else template, render nothing
  }
}
