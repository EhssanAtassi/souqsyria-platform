/**
 * @file role-list.component.ts
 * @description Role management list component.
 *              Displays and manages admin roles and their permissions.
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
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { SettingsService } from '../../services/settings.service';
import { AdminRole, PermissionCategory } from '../../interfaces/settings.interface';

/**
 * Role List Component
 * @description Displays all admin roles with quick permission overview
 *
 * @example
 * ```html
 * <app-role-list></app-role-list>
 * ```
 *
 * @features
 * - List all admin roles
 * - Display user count per role
 * - Show permission categories
 * - Navigate to role detail view
 * - Create new custom roles
 */
@Component({
  standalone: true,
  selector: 'app-role-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleListComponent implements OnInit, OnDestroy {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  /** Settings service for API calls */
  private readonly settingsService = inject(SettingsService);

  /** Subject for managing subscription cleanup */
  private readonly destroy$ = new Subject<void>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** Success message */
  readonly successMessage = signal<string | null>(null);

  /** List of admin roles */
  readonly roles = signal<AdminRole[]>([]);

  /** Permission categories for display */
  readonly permissionCategories = signal<PermissionCategory[]>([]);

  /** Role being deleted (for confirmation) */
  readonly deletingRole = signal<AdminRole | null>(null);

  /** Deletion in progress */
  readonly isDeleting = signal<boolean>(false);

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Total number of admin users */
  readonly totalAdminUsers = computed(() =>
    this.roles().reduce((sum, role) => sum + role.userCount, 0)
  );

  /** System roles (cannot be deleted) */
  readonly systemRoles = computed(() =>
    this.roles().filter(role => role.isSystemRole)
  );

  /** Custom roles (can be deleted) */
  readonly customRoles = computed(() =>
    this.roles().filter(role => !role.isSystemRole)
  );

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Initialize component and load data
   */
  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissionCategories();
  }

  /**
   * Cleanup subscriptions on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Load all roles from API
   */
  loadRoles(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.settingsService.getRoles()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (roles) => {
          this.roles.set(roles);
        },
        error: (err) => {
          console.error('Failed to load roles:', err);
          this.errorMessage.set('Failed to load roles. Please try again.');
        }
      });
  }

  /**
   * Load permission categories for reference
   */
  loadPermissionCategories(): void {
    this.settingsService.getPermissionCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.permissionCategories.set(categories);
        }
      });
  }

  // ===========================================================================
  // ROLE ACTIONS
  // ===========================================================================

  /**
   * Initiate role deletion (show confirmation)
   * @param role - Role to delete
   */
  confirmDelete(role: AdminRole): void {
    if (role.isSystemRole) {
      this.errorMessage.set('System roles cannot be deleted.');
      return;
    }
    this.deletingRole.set(role);
  }

  /**
   * Cancel deletion
   */
  cancelDelete(): void {
    this.deletingRole.set(null);
  }

  /**
   * Execute role deletion
   */
  deleteRole(): void {
    const role = this.deletingRole();
    if (!role) return;

    this.isDeleting.set(true);

    this.settingsService.deleteRole(role.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isDeleting.set(false);
          this.deletingRole.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.roles.update(roles => roles.filter(r => r.id !== role.id));
          this.successMessage.set(`Role "${role.displayName}" deleted successfully.`);
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Failed to delete role:', err);
          this.errorMessage.set('Failed to delete role. Please try again.');
        }
      });
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get icon for role
   * @param roleName - Role name
   * @returns Material icon name
   */
  getRoleIcon(roleName: string): string {
    const icons: Record<string, string> = {
      super_admin: 'shield',
      admin: 'admin_panel_settings',
      moderator: 'verified_user',
      customer_service: 'support_agent',
      vendor_manager: 'store'
    };
    return icons[roleName] || 'person';
  }

  /**
   * Get color class for role
   * @param roleName - Role name
   * @returns Color identifier
   */
  getRoleColor(roleName: string): string {
    const colors: Record<string, string> = {
      super_admin: 'red',
      admin: 'purple',
      moderator: 'blue',
      customer_service: 'green',
      vendor_manager: 'orange'
    };
    return colors[roleName] || 'gray';
  }

  /**
   * Track function for roles
   * @param index - Array index
   * @param role - Role item
   * @returns Unique identifier
   */
  trackByRole(index: number, role: AdminRole): string {
    return role.id;
  }

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
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
