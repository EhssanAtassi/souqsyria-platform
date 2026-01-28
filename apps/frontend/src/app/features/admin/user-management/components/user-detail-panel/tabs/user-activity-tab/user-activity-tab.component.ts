/**
 * User Activity Tab Component
 *
 * @description
 * Displays paginated timeline of user activities with filtering.
 * Features:
 * - Activity type filter dropdown
 * - Timeline visualization with icons and colors
 * - Pagination support
 * - Real-time relative timestamps
 * - Loading and empty states
 *
 * @module UserManagement/Components/DetailPanel
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-user-activity-tab [user]="selectedUser" />
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UserActivityTabProps:
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
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ManagedUser } from '../../../../models/user.model';
import { UserActivity, ActivityType, ACTIVITY_TYPE_CONFIGS } from '../../../../models/user-activity.model';
import { UserManagementService } from '../../../../state/user-management.service';
import { RelativeTimePipe } from '../../../../pipes/relative-time.pipe';

/**
 * Query Activity DTO
 *
 * @description
 * Query parameters for fetching activities.
 */
interface QueryActivityDto {
  page: number;
  limit: number;
  actionType?: string;
}

/**
 * Activity Response
 *
 * @description
 * Paginated response for activities.
 */
interface ActivityResponse {
  items: UserActivity[];
  totalCount: number;
  page: number;
  limit: number;
}

/**
 * Action Type Option
 *
 * @description
 * Filter dropdown option.
 */
interface ActionTypeOption {
  value: string;
  label: string;
}

/**
 * User Activity Tab Component Class
 *
 * @description
 * Timeline component for user activity history.
 */
@Component({
  selector: 'app-user-activity-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    RelativeTimePipe
  ],
  templateUrl: './user-activity-tab.component.html',
  styleUrls: ['./user-activity-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserActivityTabComponent implements OnInit {
  /**
   * User Input
   *
   * @description
   * User whose activity history will be displayed.
   */
  @Input({ required: true }) user!: ManagedUser;

  /**
   * User Management Service
   *
   * @description
   * Service for fetching user activities.
   */
  private userService = inject(UserManagementService);

  /**
   * Activities
   *
   * @description
   * Current page of activities.
   */
  activities = signal<UserActivity[]>([]);

  /**
   * Loading State
   *
   * @description
   * True while fetching activities.
   */
  loading = signal(false);

  /**
   * Current Page
   *
   * @description
   * Current page number (1-indexed).
   */
  page = signal(1);

  /**
   * Total Count
   *
   * @description
   * Total number of activities across all pages.
   */
  totalCount = signal(0);

  /**
   * Page Size
   *
   * @description
   * Number of activities per page.
   */
  pageSize = 10;

  /**
   * Action Type Filter
   *
   * @description
   * Currently selected action type filter.
   */
  actionTypeFilter = signal<string>('all');

  /**
   * Action Type Options
   *
   * @description
   * Dropdown options for filtering by action type.
   */
  actionTypes: ActionTypeOption[] = [
    { value: 'all', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'profile_update', label: 'Profile Update' },
    { value: 'password_change', label: 'Password Change' },
    { value: 'role_changed', label: 'Role Change' },
    { value: 'account_status_changed', label: 'Status Change' }
  ];

  /**
   * Has Activities
   *
   * @description
   * Computed boolean indicating if any activities exist.
   */
  hasActivities = computed(() => this.activities().length > 0);

  /**
   * Component Initialization
   *
   * @description
   * Loads first page of activities.
   */
  ngOnInit(): void {
    this.loadActivity();
  }

  /**
   * Load Activity
   *
   * @description
   * Fetches activities from backend with current filters and pagination.
   *
   * @private
   */
  private loadActivity(): void {
    this.loading.set(true);

    // Mock data for now
    // TODO: Implement actual API call
    setTimeout(() => {
      const mockActivities = this.getMockActivities();
      this.activities.set(mockActivities);
      this.totalCount.set(mockActivities.length);
      this.loading.set(false);
    }, 500);

    /*
    const params: QueryActivityDto = {
      page: this.page(),
      limit: this.pageSize,
      actionType: this.actionTypeFilter() !== 'all' ? this.actionTypeFilter() : undefined
    };

    this.userService.fetchUserActivity(this.user.id, params).subscribe({
      next: (response: ActivityResponse) => {
        this.activities.set(response.items);
        this.totalCount.set(response.totalCount);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load activities:', error);
        this.loading.set(false);
      }
    });
    */
  }

  /**
   * Get Mock Activities
   *
   * @description
   * Returns mock activity data for testing.
   * TODO: Remove after backend implementation.
   *
   * @private
   * @returns Array of mock activities
   */
  private getMockActivities(): UserActivity[] {
    const now = new Date();
    const mockActivities: UserActivity[] = [
      {
        id: 1,
        userId: this.user.id,
        type: 'login',
        description: 'User logged in successfully',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        ipAddress: '192.168.1.100'
      },
      {
        id: 2,
        userId: this.user.id,
        type: 'profile_update',
        description: 'Updated profile information',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        metadata: { changedFields: ['phone', 'address'] }
      },
      {
        id: 3,
        userId: this.user.id,
        type: 'password_change',
        description: 'Password changed successfully',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: 4,
        userId: this.user.id,
        type: 'login',
        description: 'User logged in from new device',
        timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        ipAddress: '192.168.1.105'
      }
    ];

    return mockActivities;
  }

  /**
   * Handle Filter Change
   *
   * @description
   * Updates filter and reloads activities from page 1.
   *
   * @param actionType - Selected action type
   */
  onFilterChange(actionType: string): void {
    this.actionTypeFilter.set(actionType);
    this.page.set(1);
    this.loadActivity();
  }

  /**
   * Handle Page Change
   *
   * @description
   * Updates page and reloads activities.
   *
   * @param event - Page change event
   */
  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.loadActivity();
  }

  /**
   * Get Action Icon
   *
   * @description
   * Returns Material icon name for activity type.
   *
   * @param action - Activity type
   * @returns Icon name
   */
  getActionIcon(action: ActivityType): string {
    const config = ACTIVITY_TYPE_CONFIGS[action];
    return config?.icon || 'info';
  }

  /**
   * Get Action Color
   *
   * @description
   * Returns color hex code for activity type.
   *
   * @param action - Activity type
   * @returns Hex color code
   */
  getActionColor(action: ActivityType): string {
    const config = ACTIVITY_TYPE_CONFIGS[action];
    return config?.color || '#9e9e9e';
  }

  /**
   * Get Action Label
   *
   * @description
   * Returns display label for activity type.
   *
   * @param action - Activity type
   * @returns Label string
   */
  getActionLabel(action: ActivityType): string {
    const config = ACTIVITY_TYPE_CONFIGS[action];
    return config?.label || action;
  }

  /**
   * Format Metadata
   *
   * @description
   * Formats activity metadata for display.
   *
   * @param activity - Activity object
   * @returns Formatted metadata string or null
   */
  formatMetadata(activity: UserActivity): string | null {
    if (!activity.metadata) return null;

    const meta = activity.metadata;
    const parts: string[] = [];

    if (meta.changedFields && meta.changedFields.length > 0) {
      parts.push(`Changed: ${meta.changedFields.join(', ')}`);
    }

    if (meta.orderId) {
      parts.push(`Order #${meta.orderId}`);
    }

    if (meta.productId) {
      parts.push(`Product #${meta.productId}`);
    }

    return parts.length > 0 ? parts.join(' • ') : null;
  }
}
