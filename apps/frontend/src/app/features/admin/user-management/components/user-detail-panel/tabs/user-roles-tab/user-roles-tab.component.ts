/**
 * User Roles Tab Component
 *
 * @description
 * Displays user's business/admin roles and effective permissions.
 * Features:
 * - Business Role card (Customer/Seller/Admin)
 * - Admin Role card (if assigned)
 * - Searchable permissions list with chips
 * - Change Role button (permission-protected)
 * - Real-time permission filtering
 *
 * @module UserManagement/Components/DetailPanel
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-user-roles-tab
 *   [user]="selectedUser"
 *   (changeRole)="onChangeRole($event)"
 * />
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UserRolesTabProps:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/ManagedUser'
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { ManagedUser, BusinessRole, AdminRole } from '../../../../models/user.model';
import { UserManagementService } from '../../../../state/user-management.service';
import { RoleDisplayPipe } from '../../../../pipes/role-display.pipe';

/**
 * Permission Response Interface
 *
 * @description
 * API response for user permissions.
 */
interface PermissionsResponse {
  permissions: string[];
  count: number;
}

/**
 * User Roles Tab Component Class
 *
 * @description
 * Displays and manages user roles and permissions.
 */
@Component({
  selector: 'app-user-roles-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    RoleDisplayPipe
  ],
  templateUrl: './user-roles-tab.component.html',
  styleUrls: ['./user-roles-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserRolesTabComponent implements OnInit {
  /**
   * User Input
   *
   * @description
   * User whose roles and permissions will be displayed.
   */
  @Input({ required: true }) user!: ManagedUser;

  /**
   * Change Role Event
   *
   * @description
   * Emitted when "Change Role" button is clicked.
   */
  @Output() changeRole = new EventEmitter<ManagedUser>();

  /**
   * User Management Service
   *
   * @description
   * Service for fetching user permissions.
   */
  private userService = inject(UserManagementService);

  /**
   * All Permissions
   *
   * @description
   * Complete list of user's effective permissions.
   */
  permissions = signal<string[]>([]);

  /**
   * Filtered Permissions
   *
   * @description
   * Permissions after applying search filter.
   */
  filteredPermissions = signal<string[]>([]);

  /**
   * Loading State
   *
   * @description
   * True while fetching permissions from API.
   */
  loading = signal(false);

  /**
   * Search Term
   *
   * @description
   * Current search query for filtering permissions.
   */
  searchTerm = signal('');

  /**
   * Permission Count
   *
   * @description
   * Computed count of filtered permissions.
   */
  permissionCount = computed(() => this.filteredPermissions().length);

  /**
   * Component Initialization
   *
   * @description
   * Loads user permissions on component init.
   */
  ngOnInit(): void {
    this.loadPermissions();
  }

  /**
   * Load Permissions
   *
   * @description
   * Fetches user's effective permissions from backend.
   * Handles loading state and errors.
   *
   * @private
   */
  private loadPermissions(): void {
    this.loading.set(true);

    // Mock permissions for now
    // TODO: Implement actual API call via userService
    setTimeout(() => {
      const mockPermissions = this.getMockPermissions();
      this.permissions.set(mockPermissions);
      this.filteredPermissions.set(mockPermissions);
      this.loading.set(false);
    }, 500);

    /*
    this.userService.fetchUserPermissions(this.user.id).subscribe({
      next: (response: PermissionsResponse) => {
        this.permissions.set(response.permissions);
        this.filteredPermissions.set(response.permissions);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load permissions:', error);
        this.loading.set(false);
      }
    });
    */
  }

  /**
   * Get Mock Permissions
   *
   * @description
   * Returns mock permissions based on user role.
   * TODO: Remove after backend implementation.
   *
   * @private
   * @returns Array of permission strings
   */
  private getMockPermissions(): string[] {
    const basePermissions = ['view_products', 'search_products', 'view_categories'];

    if (this.user.businessRole === 'seller') {
      return [
        ...basePermissions,
        'create_products',
        'edit_products',
        'delete_products',
        'view_orders',
        'manage_inventory',
        'view_analytics'
      ];
    }

    if (this.user.adminRole) {
      return [
        ...basePermissions,
        'manage_users',
        'assign_roles',
        'ban_users',
        'suspend_users',
        'view_reports',
        'manage_content',
        'moderate_reviews'
      ];
    }

    return basePermissions;
  }

  /**
   * Handle Search
   *
   * @description
   * Filters permissions based on search term.
   * Case-insensitive substring matching.
   *
   * @param term - Search query string
   */
  onSearch(term: string): void {
    this.searchTerm.set(term);

    if (!term.trim()) {
      this.filteredPermissions.set(this.permissions());
    } else {
      const lowerTerm = term.toLowerCase();
      this.filteredPermissions.set(
        this.permissions().filter(p =>
          p.toLowerCase().includes(lowerTerm)
        )
      );
    }
  }

  /**
   * Handle Change Role
   *
   * @description
   * Emits changeRole event when button is clicked.
   */
  onChangeRole(): void {
    this.changeRole.emit(this.user);
  }

  /**
   * Get Business Role Icon
   *
   * @description
   * Returns Material icon name for business role.
   *
   * @returns Icon name string
   */
  get businessRoleIcon(): string {
    const icons: Record<BusinessRole, string> = {
      customer: 'shopping_cart',
      seller: 'storefront',
      admin: 'admin_panel_settings'
    };
    return icons[this.user.businessRole];
  }

  /**
   * Get Business Role Description
   *
   * @description
   * Returns description text for business role.
   *
   * @returns Description string
   */
  get businessRoleDescription(): string {
    const descriptions: Record<BusinessRole, string> = {
      customer: 'Can browse and purchase products, write reviews',
      seller: 'Can list products, manage inventory, and fulfill orders',
      admin: 'Full system access with administrative privileges'
    };
    return descriptions[this.user.businessRole];
  }

  /**
   * Get Admin Role Description
   *
   * @description
   * Returns description text for admin role.
   *
   * @returns Description string or null
   */
  get adminRoleDescription(): string | null {
    if (!this.user.adminRole) return null;

    const descriptions: Record<NonNullable<AdminRole>, string> = {
      super_admin: 'Full system control, can manage all admins',
      admin: 'Full content management, cannot manage super admins',
      moderator: 'Content review and user communication',
      vendor_manager: 'Vendor approval and management',
      customer_service: 'Order and user support'
    };
    return descriptions[this.user.adminRole];
  }

  /**
   * Get Permission Category
   *
   * @description
   * Extracts category from permission name (e.g., "view_products" -> "products").
   *
   * @param permission - Permission string
   * @returns Category name
   */
  getPermissionCategory(permission: string): string {
    const parts = permission.split('_');
    return parts.length > 1 ? parts[parts.length - 1] : 'general';
  }

  /**
   * Get Permission Color
   *
   * @description
   * Returns chip color based on permission category.
   *
   * @param permission - Permission string
   * @returns Material color palette
   */
  getPermissionColor(permission: string): string {
    const category = this.getPermissionCategory(permission);
    const colorMap: Record<string, string> = {
      users: 'accent',
      products: 'primary',
      orders: 'warn',
      reports: 'accent',
      content: 'primary'
    };
    return colorMap[category] || '';
  }
}
