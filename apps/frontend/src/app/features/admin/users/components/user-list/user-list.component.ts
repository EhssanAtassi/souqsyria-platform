/**
 * @file user-list.component.ts
 * @description User list component for admin user management.
 *              Provides paginated user listing with search, filtering, and bulk actions.
 * @module AdminDashboard/Users/Components
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs';

import { AdminUsersService } from '../../../services';
import {
  AdminDataTableComponent,
  AdminFilterPanelComponent,
  AdminPaginationComponent,
  AdminStatusBadgeComponent,
  AdminConfirmationDialogComponent,
  TableColumn,
  RowAction,
  FilterField,
  FilterValues
} from '../../../shared';
import {
  UserListItem,
  UserListQuery,
  UserStatus,
  KycStatus,
  PaginatedResponse
} from '../../../interfaces';
import { RoleAssignmentDialogComponent } from '../role-assignment-dialog/role-assignment-dialog.component';
import { StatusChangeDialogComponent } from '../status-change-dialog/status-change-dialog.component';

/**
 * User statistics summary interface
 */
interface UserStatistics {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  pendingVerification: number;
  newThisMonth: number;
}

/**
 * User List Component
 * @description Main component for user administration.
 *              Displays paginated user list with search, filtering, and management actions.
 *
 * @features
 * - Paginated user listing with real-time search
 * - Advanced filtering (status, KYC, roles, date range)
 * - Bulk selection and actions (suspend, activate, ban)
 * - Role assignment via dialog
 * - Status change via dialog
 * - Export to CSV/Excel
 *
 * @example
 * ```html
 * <app-user-list></app-user-list>
 * ```
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    AdminDataTableComponent,
    AdminFilterPanelComponent,
    AdminPaginationComponent,
    AdminStatusBadgeComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly usersService = inject(AdminUsersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state for user list */
  readonly isLoading = signal(false);

  /** Loading state for statistics */
  readonly isLoadingStats = signal(false);

  /** Loading state for export operation */
  readonly isExporting = signal(false);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** User list data */
  readonly users = signal<UserListItem[]>([]);

  /** User statistics */
  readonly statistics = signal<UserStatistics | null>(null);

  /** Pagination info */
  readonly pagination = signal({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  /** Selected user IDs for bulk actions */
  readonly selectedUserIds = signal<number[]>([]);

  /** Current search term */
  readonly searchTerm = signal('');

  /** Current filters */
  readonly currentFilters = signal<FilterValues>({});

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Whether any users are selected */
  readonly hasSelection = computed(() => this.selectedUserIds().length > 0);

  /** Number of selected users */
  readonly selectionCount = computed(() => this.selectedUserIds().length);

  /** Whether all users on current page are selected */
  readonly isAllSelected = computed(() => {
    const userIds = this.users().map(u => u.id);
    const selectedIds = this.selectedUserIds();
    return userIds.length > 0 && userIds.every(id => selectedIds.includes(id));
  });

  // =========================================================================
  // TABLE CONFIGURATION
  // =========================================================================

  /**
   * Table columns configuration
   * @description Defines columns for the user data table
   */
  readonly tableColumns: TableColumn[] = [
    {
      key: 'fullName',
      label: 'User',
      sortable: true,
      template: 'user'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'roles',
      label: 'Roles',
      template: 'roles'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      template: 'status'
    },
    {
      key: 'kyc',
      label: 'KYC',
      template: 'kyc'
    },
    {
      key: 'totalOrders',
      label: 'Orders',
      sortable: true,
      align: 'right'
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      sortable: true,
      align: 'right',
      template: 'currency'
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      template: 'date'
    }
  ];

  /**
   * Row actions configuration
   * @description Available actions for each user row
   */
  readonly rowActions: RowAction[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: 'visibility'
    },
    {
      key: 'edit-roles',
      label: 'Manage Roles',
      icon: 'admin_panel_settings'
    },
    {
      key: 'change-status',
      label: 'Change Status',
      icon: 'toggle_on'
    },
    {
      key: 'view-activity',
      label: 'View Activity',
      icon: 'history'
    }
  ];

  // =========================================================================
  // FILTER CONFIGURATION
  // =========================================================================

  /**
   * Filter fields configuration
   * @description Defines available filters for the user list
   */
  readonly filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Account Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'banned', label: 'Banned' },
        { value: 'pending_verification', label: 'Pending Verification' }
      ]
    },
    {
      key: 'kycStatus',
      label: 'KYC Status',
      type: 'select',
      options: [
        { value: 'not_submitted', label: 'Not Submitted' },
        { value: 'pending', label: 'Pending' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'requires_resubmission', label: 'Requires Resubmission' }
      ]
    },
    {
      key: 'emailVerified',
      label: 'Email Verified',
      type: 'select',
      options: [
        { value: 'true', label: 'Verified' },
        { value: 'false', label: 'Not Verified' }
      ]
    },
    {
      key: 'dateRange',
      label: 'Registration Date',
      type: 'daterange'
    }
  ];

  // =========================================================================
  // SEARCH FORM
  // =========================================================================

  /** Search form group */
  searchForm: FormGroup = this.fb.group({
    search: ['']
  });

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  /**
   * Component initialization
   * @description Loads initial data and sets up search subscription
   */
  ngOnInit(): void {
    this.loadUsers();
    this.loadStatistics();
    this.setupSearchSubscription();
  }

  /**
   * Component cleanup
   * @description Unsubscribes from all observables
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load users with current query parameters
   * @description Fetches paginated user list from API
   */
  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const query: UserListQuery = {
      page: this.pagination().page,
      limit: this.pagination().limit,
      search: this.searchTerm() || undefined,
      ...this.buildFilterQuery()
    };

    this.usersService.getUsers(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: PaginatedResponse<UserListItem>) => {
          this.users.set(response.items);
          this.pagination.update(p => ({
            ...p,
            total: response.total,
            totalPages: response.totalPages
          }));
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.errorMessage.set('Failed to load users. Please try again.');
        }
      });
  }

  /**
   * Load user statistics
   * @description Fetches aggregated user statistics
   */
  loadStatistics(): void {
    this.isLoadingStats.set(true);

    this.usersService.getUserStatistics()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingStats.set(false))
      )
      .subscribe({
        next: (stats) => {
          this.statistics.set(stats);
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  /**
   * Build filter query from current filters
   * @description Converts filter values to API query parameters
   * @returns Partial query object
   */
  private buildFilterQuery(): Partial<UserListQuery> {
    const filters = this.currentFilters();
    const query: Partial<UserListQuery> = {};

    if (filters['status']) {
      query.status = filters['status'] as UserStatus;
    }

    if (filters['kycStatus']) {
      query.kycStatus = filters['kycStatus'] as KycStatus;
    }

    if (filters['dateRange']) {
      const range = filters['dateRange'] as { start: string; end: string };
      if (range.start) query.createdAfter = range.start;
      if (range.end) query.createdBefore = range.end;
    }

    return query;
  }

  /**
   * Setup search input subscription
   * @description Debounces search input and triggers user reload
   */
  private setupSearchSubscription(): void {
    this.searchForm.get('search')?.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value: string) => {
        this.searchTerm.set(value);
        this.pagination.update(p => ({ ...p, page: 1 }));
        this.loadUsers();
      });
  }

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handle page change
   * @description Updates current page and reloads data
   * @param event - Page change event with new page number
   */
  onPageChange(event: { page: number }): void {
    this.pagination.update(p => ({ ...p, page: event.page }));
    this.loadUsers();
  }

  /**
   * Handle page size change
   * @description Updates items per page and reloads data
   * @param limit - New page size
   */
  onPageSizeChange(limit: number): void {
    this.pagination.update(p => ({ ...p, limit, page: 1 }));
    this.loadUsers();
  }

  /**
   * Handle filter change
   * @description Updates current filters and reloads data
   * @param filters - New filter values
   */
  onFilterChange(filters: FilterValues): void {
    this.currentFilters.set(filters);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadUsers();
  }

  /**
   * Handle filter reset
   * @description Clears all filters and reloads data
   */
  onFilterReset(): void {
    this.currentFilters.set({});
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadUsers();
  }

  /**
   * Handle row action
   * @description Routes to appropriate action handler
   * @param event - Row action event with action key and user data
   */
  onRowAction(event: { action: string; row: UserListItem }): void {
    const { action, row } = event;

    switch (action) {
      case 'view':
        this.router.navigate(['/admin/users', row.id]);
        break;
      case 'edit-roles':
        this.openRoleDialog(row);
        break;
      case 'change-status':
        this.openStatusDialog(row);
        break;
      case 'view-activity':
        this.router.navigate(['/admin/users', row.id], { fragment: 'activity' });
        break;
    }
  }

  /**
   * Handle selection change
   * @description Updates selected user IDs
   * @param event - Selection change event with selected rows
   */
  onSelectionChange(event: { selectedRows: UserListItem[] }): void {
    this.selectedUserIds.set(event.selectedRows.map(u => u.id));
  }

  /**
   * Handle sort change
   * @description Updates sort parameters and reloads data
   * @param event - Sort change event with sort key and direction
   */
  onSortChange(event: { sortKey: string; sortOrder: 'asc' | 'desc' }): void {
    // The data table handles sorting; reload if server-side sorting is needed
    this.loadUsers();
  }

  // =========================================================================
  // DIALOG HANDLERS
  // =========================================================================

  /**
   * Open role assignment dialog
   * @description Opens dialog to manage user roles
   * @param user - User to manage roles for
   */
  openRoleDialog(user: UserListItem): void {
    const dialogRef = this.dialog.open(RoleAssignmentDialogComponent, {
      width: '500px',
      data: { user },
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.snackBar.open('User roles updated successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        }
      });
  }

  /**
   * Open status change dialog
   * @description Opens dialog to change user status
   * @param user - User to change status for
   */
  openStatusDialog(user: UserListItem): void {
    const dialogRef = this.dialog.open(StatusChangeDialogComponent, {
      width: '500px',
      data: { user },
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.snackBar.open('User status updated successfully', 'Close', { duration: 3000 });
          this.loadUsers();
          this.loadStatistics();
        }
      });
  }

  // =========================================================================
  // BULK ACTIONS
  // =========================================================================

  /**
   * Perform bulk status update
   * @description Updates status for all selected users
   * @param status - New status to apply
   */
  bulkUpdateStatus(status: 'active' | 'suspended' | 'banned'): void {
    const selectedIds = this.selectedUserIds();

    if (selectedIds.length === 0) return;

    const statusLabels: Record<string, string> = {
      active: 'activate',
      suspended: 'suspend',
      banned: 'ban'
    };

    const dialogRef = this.dialog.open(AdminConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `Bulk ${statusLabels[status]} users`,
        message: `Are you sure you want to ${statusLabels[status]} ${selectedIds.length} user(s)?`,
        confirmLabel: statusLabels[status].charAt(0).toUpperCase() + statusLabels[status].slice(1),
        confirmColor: status === 'active' ? 'primary' : 'warn',
        type: status === 'active' ? 'info' : 'warning'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.confirmed) {
          this.executeBulkStatusUpdate(selectedIds, status, result.reason);
        }
      });
  }

  /**
   * Execute bulk status update
   * @description Calls API to update status for multiple users
   * @param userIds - User IDs to update
   * @param status - New status
   * @param reason - Optional reason for status change
   */
  private executeBulkStatusUpdate(
    userIds: number[],
    status: 'active' | 'suspended' | 'banned',
    reason?: string
  ): void {
    this.isLoading.set(true);

    this.usersService.bulkUpdateStatus(userIds, status, reason)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (result) => {
          const message = `${result.successful} of ${result.totalProcessed} users updated successfully`;
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.selectedUserIds.set([]);
          this.loadUsers();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Bulk status update failed:', error);
          this.snackBar.open('Failed to update users', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Clear selection
   * @description Clears all selected users
   */
  clearSelection(): void {
    this.selectedUserIds.set([]);
  }

  // =========================================================================
  // EXPORT FUNCTIONALITY
  // =========================================================================

  /**
   * Export users to file
   * @description Triggers download of user data in specified format
   * @param format - Export format (csv or xlsx)
   */
  exportUsers(format: 'csv' | 'xlsx'): void {
    this.isExporting.set(true);

    const query: UserListQuery = {
      search: this.searchTerm() || undefined,
      ...this.buildFilterQuery()
    };

    this.usersService.exportUsers(format, query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isExporting.set(false))
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Export downloaded successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.snackBar.open('Failed to export users', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Track by function for user list
   * @description Optimizes ngFor rendering
   * @param index - Item index
   * @param user - User item
   * @returns User ID for tracking
   */
  trackById(index: number, user: UserListItem): number {
    return user.id;
  }

  /**
   * Get status color for badge
   * @description Maps user status to badge variant
   * @param status - User status
   * @returns Badge variant
   */
  getStatusVariant(status: UserStatus): string {
    const variantMap: Record<UserStatus, string> = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'warning',
      banned: 'danger',
      pending_verification: 'info'
    };
    return variantMap[status] || 'secondary';
  }

  /**
   * Get KYC status color for badge
   * @description Maps KYC status to badge variant
   * @param status - KYC status
   * @returns Badge variant
   */
  getKycVariant(status: KycStatus): string {
    const variantMap: Record<KycStatus, string> = {
      not_submitted: 'secondary',
      pending: 'info',
      under_review: 'warning',
      approved: 'success',
      rejected: 'danger',
      requires_resubmission: 'warning'
    };
    return variantMap[status] || 'secondary';
  }

  /**
   * Refresh data
   * @description Reloads user list and statistics
   */
  refresh(): void {
    this.loadUsers();
    this.loadStatistics();
  }
}
