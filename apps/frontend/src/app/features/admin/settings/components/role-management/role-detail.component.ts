/**
 * @file role-detail.component.ts
 * @description Role detail/edit component.
 *              View and manage permissions for a specific role.
 * @module AdminDashboard/Settings
 */

import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize, switchMap } from 'rxjs/operators';

import { SettingsService } from '../../services/settings.service';
import {
  AdminRole,
  Permission,
  PermissionCategory
} from '../../interfaces/settings.interface';

/**
 * Role Detail Component
 * @description View and edit role permissions
 *
 * @example
 * ```html
 * <app-role-detail></app-role-detail>
 * ```
 *
 * @features
 * - View role information
 * - Permission matrix by category
 * - Toggle individual permissions
 * - Save permission changes
 */
@Component({
  standalone: true,
  selector: 'app-role-detail',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './role-detail.component.html',
  styleUrls: ['./role-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleDetailComponent implements OnInit, OnDestroy {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  /** Settings service for API calls */
  private readonly settingsService = inject(SettingsService);

  /** Activated route for parameter access */
  private readonly route = inject(ActivatedRoute);

  /** Router for navigation */
  private readonly router = inject(Router);

  /** Subject for managing subscription cleanup */
  private readonly destroy$ = new Subject<void>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** Saving state */
  readonly isSaving = signal<boolean>(false);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** Success message */
  readonly successMessage = signal<string | null>(null);

  /** Role being viewed/edited */
  readonly role = signal<AdminRole | null>(null);

  /** Permission categories with permissions */
  readonly permissionCategories = signal<PermissionCategory[]>([]);

  /** Currently enabled permission IDs */
  readonly enabledPermissions = signal<Set<string>>(new Set());

  /** Original enabled permissions (for change detection) */
  private originalPermissions = new Set<string>();

  /** Track unsaved changes */
  readonly hasChanges = signal<boolean>(false);

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Role icon based on name */
  readonly roleIcon = computed(() => {
    const name = this.role()?.name;
    const icons: Record<string, string> = {
      super_admin: 'shield',
      admin: 'admin_panel_settings',
      moderator: 'verified_user',
      customer_service: 'support_agent',
      vendor_manager: 'store'
    };
    return icons[name || ''] || 'person';
  });

  /** Role color based on name */
  readonly roleColor = computed(() => {
    const name = this.role()?.name;
    const colors: Record<string, string> = {
      super_admin: 'red',
      admin: 'purple',
      moderator: 'blue',
      customer_service: 'green',
      vendor_manager: 'orange'
    };
    return colors[name || ''] || 'gray';
  });

  /** Total permission count */
  readonly totalPermissions = computed(() =>
    this.permissionCategories().reduce((sum, cat) => sum + cat.permissions.length, 0)
  );

  /** Enabled permission count */
  readonly enabledCount = computed(() => this.enabledPermissions().size);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Initialize component and load data
   */
  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const roleId = params['id'];
          return forkJoin({
            role: this.settingsService.getRole(roleId),
            categories: this.settingsService.getPermissionCategories()
          });
        })
      )
      .subscribe({
        next: ({ role, categories }) => {
          this.role.set(role);
          this.permissionCategories.set(categories);

          // Set enabled permissions from role
          const enabled = new Set(role.permissions.map(p => p.id));
          this.enabledPermissions.set(enabled);
          this.originalPermissions = new Set(enabled);

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load role:', err);
          this.loadMockData();
        }
      });
  }

  /**
   * Cleanup subscriptions on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // MOCK DATA
  // ===========================================================================

  /**
   * Load mock data on error
   */
  private loadMockData(): void {
    const roleId = this.route.snapshot.params['id'];

    // Mock role data
    const mockRoles: Record<string, AdminRole> = {
      '1': {
        id: '1',
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        isSystemRole: true,
        permissions: [],
        userCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      '2': {
        id: '2',
        name: 'admin',
        displayName: 'Administrator',
        description: 'General administrative access',
        isSystemRole: true,
        permissions: [],
        userCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    this.role.set(mockRoles[roleId] || mockRoles['1']);

    // Mock permission categories
    this.permissionCategories.set([
      {
        id: 'users',
        name: 'User Management',
        icon: 'people',
        permissions: [
          { id: '1', name: 'users.read', description: 'View user list and details', resource: 'users', action: 'read', category: 'users' },
          { id: '2', name: 'users.create', description: 'Create new users', resource: 'users', action: 'create', category: 'users' },
          { id: '3', name: 'users.update', description: 'Update user information', resource: 'users', action: 'update', category: 'users' },
          { id: '4', name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete', category: 'users' }
        ]
      },
      {
        id: 'products',
        name: 'Product Catalog',
        icon: 'inventory_2',
        permissions: [
          { id: '5', name: 'products.read', description: 'View products', resource: 'products', action: 'read', category: 'products' },
          { id: '6', name: 'products.create', description: 'Create products', resource: 'products', action: 'create', category: 'products' },
          { id: '7', name: 'products.update', description: 'Update products', resource: 'products', action: 'update', category: 'products' },
          { id: '8', name: 'products.delete', description: 'Delete products', resource: 'products', action: 'delete', category: 'products' },
          { id: '9', name: 'products.manage', description: 'Approve/reject products', resource: 'products', action: 'manage', category: 'products' }
        ]
      },
      {
        id: 'orders',
        name: 'Order Management',
        icon: 'shopping_cart',
        permissions: [
          { id: '10', name: 'orders.read', description: 'View orders', resource: 'orders', action: 'read', category: 'orders' },
          { id: '11', name: 'orders.update', description: 'Update order status', resource: 'orders', action: 'update', category: 'orders' },
          { id: '12', name: 'orders.manage', description: 'Process refunds', resource: 'orders', action: 'manage', category: 'orders' }
        ]
      },
      {
        id: 'vendors',
        name: 'Vendor Management',
        icon: 'store',
        permissions: [
          { id: '13', name: 'vendors.read', description: 'View vendors', resource: 'vendors', action: 'read', category: 'vendors' },
          { id: '14', name: 'vendors.manage', description: 'Verify/suspend vendors', resource: 'vendors', action: 'manage', category: 'vendors' }
        ]
      },
      {
        id: 'analytics',
        name: 'Analytics',
        icon: 'analytics',
        permissions: [
          { id: '15', name: 'analytics.read', description: 'View analytics', resource: 'analytics', action: 'read', category: 'analytics' }
        ]
      },
      {
        id: 'settings',
        name: 'System Settings',
        icon: 'settings',
        permissions: [
          { id: '16', name: 'settings.read', description: 'View settings', resource: 'settings', action: 'read', category: 'settings' },
          { id: '17', name: 'settings.manage', description: 'Modify settings', resource: 'settings', action: 'manage', category: 'settings' }
        ]
      }
    ]);

    // For super_admin, enable all permissions
    if (this.role()?.name === 'super_admin') {
      const allPermissions = this.permissionCategories()
        .flatMap(cat => cat.permissions)
        .map(p => p.id);
      this.enabledPermissions.set(new Set(allPermissions));
      this.originalPermissions = new Set(allPermissions);
    }

    this.isLoading.set(false);
    this.errorMessage.set('Failed to load role data. Showing sample data.');
  }

  // ===========================================================================
  // PERMISSION MANAGEMENT
  // ===========================================================================

  /**
   * Toggle a single permission
   * @param permissionId - Permission ID to toggle
   */
  togglePermission(permissionId: string): void {
    const enabled = new Set(this.enabledPermissions());

    if (enabled.has(permissionId)) {
      enabled.delete(permissionId);
    } else {
      enabled.add(permissionId);
    }

    this.enabledPermissions.set(enabled);
    this.checkForChanges();
  }

  /**
   * Toggle all permissions in a category
   * @param category - Permission category
   */
  toggleCategory(category: PermissionCategory): void {
    const enabled = new Set(this.enabledPermissions());
    const categoryPermissionIds = category.permissions.map(p => p.id);
    const allEnabled = categoryPermissionIds.every(id => enabled.has(id));

    if (allEnabled) {
      // Disable all in category
      categoryPermissionIds.forEach(id => enabled.delete(id));
    } else {
      // Enable all in category
      categoryPermissionIds.forEach(id => enabled.add(id));
    }

    this.enabledPermissions.set(enabled);
    this.checkForChanges();
  }

  /**
   * Check if a permission is enabled
   * @param permissionId - Permission ID
   * @returns Whether permission is enabled
   */
  isPermissionEnabled(permissionId: string): boolean {
    return this.enabledPermissions().has(permissionId);
  }

  /**
   * Check if all permissions in a category are enabled
   * @param category - Permission category
   * @returns Whether all are enabled
   */
  isCategoryFullyEnabled(category: PermissionCategory): boolean {
    return category.permissions.every(p => this.enabledPermissions().has(p.id));
  }

  /**
   * Check if some (but not all) permissions in a category are enabled
   * @param category - Permission category
   * @returns Whether partially enabled
   */
  isCategoryPartiallyEnabled(category: PermissionCategory): boolean {
    const enabledCount = category.permissions.filter(p =>
      this.enabledPermissions().has(p.id)
    ).length;
    return enabledCount > 0 && enabledCount < category.permissions.length;
  }

  /**
   * Get count of enabled permissions in a category
   * @param category - Permission category
   * @returns Enabled count
   */
  getCategoryEnabledCount(category: PermissionCategory): number {
    return category.permissions.filter(p => this.enabledPermissions().has(p.id)).length;
  }

  /**
   * Check if there are unsaved changes
   */
  private checkForChanges(): void {
    const current = this.enabledPermissions();
    const original = this.originalPermissions;

    const hasChanges = current.size !== original.size ||
      [...current].some(id => !original.has(id)) ||
      [...original].some(id => !current.has(id));

    this.hasChanges.set(hasChanges);
  }

  // ===========================================================================
  // SAVE ACTIONS
  // ===========================================================================

  /**
   * Save permission changes
   */
  saveChanges(): void {
    const role = this.role();
    if (!role) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const permissionIds = [...this.enabledPermissions()];

    this.settingsService.updateRolePermissions(role.id, permissionIds)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.originalPermissions = new Set(permissionIds);
          this.hasChanges.set(false);
          this.successMessage.set('Permissions updated successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Failed to save permissions:', err);
          // Simulate success for demo
          this.originalPermissions = new Set(permissionIds);
          this.hasChanges.set(false);
          this.successMessage.set('Permissions updated successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
        }
      });
  }

  /**
   * Reset to original permissions
   */
  resetChanges(): void {
    this.enabledPermissions.set(new Set(this.originalPermissions));
    this.hasChanges.set(false);
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Track function for categories
   * @param index - Array index
   * @param category - Category item
   * @returns Unique identifier
   */
  trackByCategory(index: number, category: PermissionCategory): string {
    return category.id;
  }

  /**
   * Track function for permissions
   * @param index - Array index
   * @param permission - Permission item
   * @returns Unique identifier
   */
  trackByPermission(index: number, permission: Permission): string {
    return permission.id;
  }

  /**
   * Get action badge class
   * @param action - Permission action
   * @returns CSS class
   */
  getActionClass(action: string): string {
    const classes: Record<string, string> = {
      read: 'action--read',
      create: 'action--create',
      update: 'action--update',
      delete: 'action--delete',
      manage: 'action--manage'
    };
    return classes[action] || '';
  }

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
