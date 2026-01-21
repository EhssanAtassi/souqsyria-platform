/**
 * @file has-permission.directive.ts
 * @description Structural directive for conditional rendering based on user permissions.
 *              Hides elements if the user doesn't have the required permission(s).
 * @module AdminDashboard/SharedDirectives
 */

import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AdminAuthService } from '../../../../shared/services/admin-auth.service';

/**
 * Permission check mode
 * @description Determines how multiple permissions are evaluated
 */
export type PermissionMode = 'any' | 'all';

/**
 * Has Permission Directive
 * @description A structural directive that conditionally renders content based on
 *              the current user's permissions or roles.
 *
 * @example
 * ```html
 * <!-- Single permission check -->
 * <button *appHasPermission="'users.create'">
 *   Create User
 * </button>
 *
 * <!-- Multiple permissions (ANY mode - default) -->
 * <div *appHasPermission="['users.edit', 'users.delete']">
 *   User can edit OR delete
 * </div>
 *
 * <!-- Multiple permissions (ALL mode) -->
 * <div *appHasPermission="['orders.view', 'orders.export']; mode: 'all'">
 *   User can view AND export
 * </div>
 *
 * <!-- Role-based check -->
 * <nav *appHasPermission="''; role: 'super_admin'">
 *   Super Admin Navigation
 * </nav>
 *
 * <!-- With else template -->
 * <button *appHasPermission="'products.approve'; else noPermission">
 *   Approve Product
 * </button>
 * <ng-template #noPermission>
 *   <span>You don't have permission</span>
 * </ng-template>
 * ```
 */
@Directive({
  standalone: true,
  selector: '[appHasPermission]'
})
export class HasPermissionDirective {
  /**
   * Auth service for permission checks
   */
  private readonly authService = inject(AdminAuthService);

  /**
   * Template reference for the element
   */
  private readonly templateRef = inject(TemplateRef<unknown>);

  /**
   * View container for rendering
   */
  private readonly viewContainer = inject(ViewContainerRef);

  /**
   * Destroy reference for cleanup
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Whether the view is currently created
   */
  private hasView = false;

  /**
   * Required permission(s)
   */
  private permissions: string | string[] = [];

  /**
   * Permission check mode
   */
  private mode: PermissionMode = 'any';

  /**
   * Required role (alternative to permissions)
   */
  private requiredRole: string | null = null;

  /**
   * Else template reference
   */
  private elseTemplateRef: TemplateRef<unknown> | null = null;

  /**
   * Main input: permission(s) to check
   * @description Can be a single permission string or array of permissions
   */
  @Input()
  set appHasPermission(value: string | string[]) {
    this.permissions = value;
    this.updateView();
  }

  /**
   * Permission check mode
   * @description 'any' = user needs at least one permission, 'all' = user needs all permissions
   * @default 'any'
   */
  @Input()
  set appHasPermissionMode(value: PermissionMode) {
    this.mode = value;
    this.updateView();
  }

  /**
   * Role check (alternative to permissions)
   * @description Check if user has a specific role instead of permissions
   */
  @Input()
  set appHasPermissionRole(value: string) {
    this.requiredRole = value;
    this.updateView();
  }

  /**
   * Else template
   * @description Template to show when permission check fails
   */
  @Input()
  set appHasPermissionElse(templateRef: TemplateRef<unknown>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor() {
    // React to auth state changes
    effect(() => {
      // Access currentUser signal to trigger re-evaluation
      const user = this.authService.currentUser();
      this.updateView();
    });
  }

  /**
   * Update the view based on permission check
   */
  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (hasPermission && !this.hasView) {
      // Show the main content
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      // Hide the main content, show else template if available
      this.viewContainer.clear();
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
      this.hasView = false;
    } else if (!hasPermission && !this.hasView && this.elseTemplateRef) {
      // Ensure else template is shown when permission fails
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }

  /**
   * Check if user has required permission(s) or role
   * @returns True if user has required access
   */
  private checkPermission(): boolean {
    // If not logged in, no permissions
    if (!this.authService.isLoggedIn()) {
      return false;
    }

    // Check role if specified
    if (this.requiredRole) {
      return this.authService.hasRole(this.requiredRole);
    }

    // If no permissions specified, allow access
    if (!this.permissions || (Array.isArray(this.permissions) && this.permissions.length === 0)) {
      return true;
    }

    // Normalize to array
    const permissionList = Array.isArray(this.permissions) ? this.permissions : [this.permissions];

    // Filter out empty strings
    const validPermissions = permissionList.filter(p => p && p.trim().length > 0);

    if (validPermissions.length === 0) {
      return true;
    }

    // Check based on mode
    if (this.mode === 'all') {
      return validPermissions.every(p => this.authService.hasPermission(p));
    } else {
      return validPermissions.some(p => this.authService.hasPermission(p));
    }
  }
}
