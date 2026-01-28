import { Component, OnInit, Inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { User, BusinessRole } from '../../models/user.interface';
import { AssignRoleDto, UserPermissionsResponse } from '../../models/user-action.dto';
import { UserManagementService } from '../../services/user-management.service';
import { BUSINESS_ROLE_OPTIONS } from '../../constants/user.constants';

/**
 * Admin role option interface
 */
interface AdminRoleOption {
  value: string | null;
  label: string;
  description?: string;
}

/**
 * Permission change type for visual diff
 */
type PermissionChangeType = 'added' | 'removed' | 'unchanged';

/**
 * Permission item with change status
 */
interface PermissionItem {
  name: string;
  displayName: string;
  changeType: PermissionChangeType;
}

/**
 * Assign Role Dialog Component
 *
 * Displays a dialog for assigning or modifying user roles (business and admin roles).
 * Shows real-time permission preview and diff of changes.
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(AssignRoleDialogComponent, {
 *   data: { user: selectedUser },
 *   width: '650px',
 *   disableClose: true
 * });
 *
 * dialogRef.afterClosed().subscribe((result: AssignRoleDto | undefined) => {
 *   if (result) {
 *     this.userService.assignRole(selectedUser.id, result).subscribe({
 *       next: () => console.log('Role assigned successfully'),
 *       error: (error) => console.error('Role assignment failed', error)
 *     });
 *   }
 * });
 * ```
 *
 * @remarks
 * This dialog provides:
 * - Business role selection (Customer, Seller, etc.)
 * - Admin role selection (Admin, Moderator, Staff)
 * - Real-time permission preview
 * - Visual diff of permission changes (added/removed)
 * - Current vs new permission comparison
 *
 * @accessibility
 * - Implements WCAG 2.1 AA standards
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support
 * - Screen reader compatible
 * - Color-blind friendly (uses icons + colors)
 */
@Component({
  selector: 'app-assign-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    UserAvatarComponent
  ],
  templateUrl: './assign-role-dialog.component.html',
  styleUrls: ['./assign-role-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignRoleDialogComponent implements OnInit {
  /**
   * Reactive form group for role assignment
   */
  roleForm!: FormGroup;

  /**
   * Business role options from constants
   */
  readonly businessRoles = BUSINESS_ROLE_OPTIONS;

  /**
   * Admin role options with descriptions
   */
  readonly adminRoles: AdminRoleOption[] = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Full system access and user management'
    },
    {
      value: 'moderator',
      label: 'Moderator',
      description: 'Content moderation and user monitoring'
    },
    {
      value: 'staff',
      label: 'Staff',
      description: 'Limited administrative capabilities'
    },
    {
      value: null,
      label: 'None',
      description: 'No administrative privileges'
    }
  ];

  /**
   * Current user permissions
   */
  currentPermissions: PermissionItem[] = [];

  /**
   * New calculated permissions based on selected roles
   */
  newPermissions: PermissionItem[] = [];

  /**
   * Loading state for permission fetching
   */
  loadingPermissions = signal(false);

  /**
   * Error state for permission fetching
   */
  permissionError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignRoleDialogComponent>,
    private userService: UserManagementService,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {}

  /**
   * Initializes the component and sets up role form
   *
   * @remarks
   * - Loads current user permissions
   * - Sets up form with current roles
   * - Watches for role changes to update permission preview
   */
  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentPermissions();
    this.setupPermissionPreviewWatcher();
  }

  /**
   * Initializes the role form with current user roles
   */
  private initializeForm(): void {
    this.roleForm = this.fb.group({
      businessRole: [this.data.user.role, Validators.required],
      adminRole: [this.data.user.assignedRole?.id || null]
    });
  }

  /**
   * Loads current user permissions from the service
   */
  private loadCurrentPermissions(): void {
    this.loadingPermissions.set(true);
    this.permissionError.set(null);

    this.userService.fetchUserPermissions(this.data.user.id).subscribe({
      next: (response: UserPermissionsResponse) => {
        this.currentPermissions = this.mapPermissionsToItems(
          response.permissions,
          'unchanged'
        );
        this.newPermissions = [...this.currentPermissions];
        this.loadingPermissions.set(false);
      },
      error: (error) => {
        console.error('Failed to load permissions:', error);
        this.permissionError.set('Failed to load permissions. Please try again.');
        this.loadingPermissions.set(false);
      }
    });
  }

  /**
   * Sets up watcher for role changes to update permission preview
   */
  private setupPermissionPreviewWatcher(): void {
    this.roleForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) =>
          prev.businessRole === curr.businessRole &&
          prev.adminRole === curr.adminRole
        )
      )
      .subscribe(() => {
        this.updatePermissionPreview();
      });
  }

  /**
   * Updates the permission preview based on selected roles
   *
   * @remarks
   * In a real implementation, this would call the backend to fetch
   * permissions for the selected role combination. For now, it provides
   * a mock implementation showing the concept.
   */
  private updatePermissionPreview(): void {
    const formValue = this.roleForm.value;

    // Mock permission calculation (replace with actual API call)
    const mockNewPermissions = this.calculateMockPermissions(
      formValue.businessRole,
      formValue.adminRole
    );

    // Calculate diff
    this.newPermissions = this.calculatePermissionDiff(
      this.currentPermissions,
      mockNewPermissions
    );
  }

  /**
   * Mock permission calculation based on roles
   * @todo Replace with actual API call
   */
  private calculateMockPermissions(
    businessRole: BusinessRole,
    adminRole: string | null
  ): string[] {
    const permissions: Set<string> = new Set();

    // Business role permissions
    switch (businessRole) {
      case 'customer':
        permissions.add('view_products');
        permissions.add('create_orders');
        permissions.add('view_own_orders');
        break;
      case 'seller':
        permissions.add('view_products');
        permissions.add('create_products');
        permissions.add('edit_own_products');
        permissions.add('view_own_orders');
        permissions.add('manage_inventory');
        break;
      case 'admin':
        permissions.add('view_products');
        permissions.add('create_products');
        permissions.add('edit_products');
        permissions.add('delete_products');
        permissions.add('view_orders');
        permissions.add('manage_orders');
        break;
    }

    // Admin role permissions
    switch (adminRole) {
      case 'admin':
        permissions.add('manage_users');
        permissions.add('manage_roles');
        permissions.add('view_analytics');
        permissions.add('system_settings');
        break;
      case 'moderator':
        permissions.add('moderate_content');
        permissions.add('view_reports');
        permissions.add('manage_reviews');
        break;
      case 'staff':
        permissions.add('view_reports');
        permissions.add('support_tickets');
        break;
    }

    return Array.from(permissions);
  }

  /**
   * Calculates the diff between current and new permissions
   */
  private calculatePermissionDiff(
    current: PermissionItem[],
    newPerms: string[]
  ): PermissionItem[] {
    const currentSet = new Set(current.map(p => p.name));
    const newSet = new Set(newPerms);
    const result: PermissionItem[] = [];

    // Find removed permissions
    current.forEach(perm => {
      if (!newSet.has(perm.name)) {
        result.push({
          ...perm,
          changeType: 'removed'
        });
      }
    });

    // Find unchanged and added permissions
    newPerms.forEach(permName => {
      if (currentSet.has(permName)) {
        result.push({
          name: permName,
          displayName: this.formatPermissionName(permName),
          changeType: 'unchanged'
        });
      } else {
        result.push({
          name: permName,
          displayName: this.formatPermissionName(permName),
          changeType: 'added'
        });
      }
    });

    return result.sort((a, b) => {
      // Sort: unchanged, added, removed
      const order = { unchanged: 0, added: 1, removed: 2 };
      return order[a.changeType] - order[b.changeType];
    });
  }

  /**
   * Maps permission strings to PermissionItem objects
   */
  private mapPermissionsToItems(
    permissions: string[],
    changeType: PermissionChangeType
  ): PermissionItem[] {
    return permissions.map(perm => ({
      name: perm,
      displayName: this.formatPermissionName(perm),
      changeType
    }));
  }

  /**
   * Formats permission name for display (e.g., "view_products" -> "View Products")
   */
  private formatPermissionName(permission: string): string {
    return permission
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.roleForm.valid) {
      const result: AssignRoleDto = {
        businessRole: this.roleForm.value.businessRole,
        adminRoleId: this.roleForm.value.adminRole
      };
      this.dialogRef.close(result);
    } else {
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Handles dialog cancellation
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Gets the count of added permissions
   */
  get addedPermissionsCount(): number {
    return this.newPermissions.filter(p => p.changeType === 'added').length;
  }

  /**
   * Gets the count of removed permissions
   */
  get removedPermissionsCount(): number {
    return this.newPermissions.filter(p => p.changeType === 'removed').length;
  }

  /**
   * Checks if roles have been modified
   */
  get rolesModified(): boolean {
    const currentBusinessRole = this.data.user.role;
    const currentAdminRole = this.data.user.assignedRole?.id || null;
    const newBusinessRole = this.roleForm.get('businessRole')?.value;
    const newAdminRole = this.roleForm.get('adminRole')?.value;

    return (
      currentBusinessRole !== newBusinessRole ||
      currentAdminRole !== newAdminRole
    );
  }

  /**
   * Gets the chip color class based on change type
   */
  getChipColorClass(changeType: PermissionChangeType): string {
    switch (changeType) {
      case 'added':
        return 'chip-added';
      case 'removed':
        return 'chip-removed';
      case 'unchanged':
      default:
        return 'chip-unchanged';
    }
  }

  /**
   * Gets the chip icon based on change type
   */
  getChipIcon(changeType: PermissionChangeType): string {
    switch (changeType) {
      case 'added':
        return 'add_circle';
      case 'removed':
        return 'remove_circle';
      case 'unchanged':
      default:
        return 'check_circle';
    }
  }

  /**
   * Gets the current business role label
   */
  get currentBusinessRoleLabel(): string {
    return this.businessRoles.find(r => r.value === this.data.user.role)?.label || 'Unknown';
  }

  /**
   * Gets the current admin role label
   */
  get currentAdminRoleLabel(): string {
    const roleId = this.data.user.assignedRole?.id;
    return this.adminRoles.find(r => r.value === roleId)?.label || 'None';
  }
}
