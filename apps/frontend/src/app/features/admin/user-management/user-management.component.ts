import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';

import { UserManagementStore } from './state/user-management.store';
import { UserManagementQuery } from './state/user-management.query';
import { UserManagementService } from './state/user-management.service';
import { ManagedUser, UserFilter } from './models';

// Type for bulk actions (will be properly defined when bulk actions are implemented)
type BulkAction = 'activate' | 'deactivate' | 'ban' | 'suspend' | 'delete';

// Component imports (will be created in following phases)
// import { UserTableComponent } from './components/user-table/user-table.component';
// import { UserFiltersComponent } from './components/user-filters/user-filters.component';
// import { UserSearchComponent } from './components/user-search/user-search.component';
// import { BulkActionsToolbarComponent } from './components/bulk-actions-toolbar/bulk-actions-toolbar.component';
// import { UserDetailPanelComponent } from './components/user-detail-panel/user-detail-panel.component';

/**
 * User Management Component
 * 
 * @description Main container component for user management dashboard.
 * Orchestrates all child components and handles user interactions.
 * 
 * Features:
 * - Paginated user list with filtering and search
 * - Bulk operations on selected users
 * - User detail panel for viewing/editing
 * - Real-time status updates
 * - Permission-based action visibility
 * 
 * Architecture:
 * - Smart container component (handles logic and state)
 * - Uses Akita for state management
 * - Delegates UI to presentational components
 * - OnPush change detection for performance
 * 
 * @example
 * ```html
 * <app-user-management></app-user-management>
 * ```
 */
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatMenuModule,
    MatDividerModule,
    MatCardModule
    // TODO: Add component imports when created
    // UserTableComponent,
    // UserFiltersComponent,
    // UserSearchComponent,
    // BulkActionsToolbarComponent,
    // UserDetailPanelComponent
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    UserManagementStore,
    UserManagementQuery,
    UserManagementService
  ]
})
export class UserManagementComponent implements OnInit {
  /** Inject dependencies */
  private readonly service = inject(UserManagementService);
  private readonly query = inject(UserManagementQuery);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Observable streams from query
   * All streams use async pipe in template for automatic subscription management
   */
  readonly users$ = this.query.filteredUsers$;
  readonly loading$ = this.query.loading$;
  readonly selectedUser$ = this.query.selectedUser$;
  readonly pagination$ = this.query.pagination$;
  readonly bulkSelected$ = this.query.bulkSelectedUsers$;
  readonly hasFilters$ = this.query.hasActiveFilters$;
  // Total filtered count from pagination
  readonly totalFilteredCount$ = this.query.select(state => state.pagination.total);

  /**
   * UI state flags
   */
  filtersOpen = true;
  detailPanelOpen = false;

  /**
   * Initialize component
   * 
   * @description Fetches initial user data on component load.
   * Subscription is automatically cleaned up via takeUntilDestroyed.
   */
  ngOnInit(): void {
    this.loadUsers();

    // Subscribe to selected user changes to open detail panel
    this.selectedUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.detailPanelOpen = !!user;
      });
  }

  /**
   * Load users with current pagination settings
   * 
   * @description Fetches users from API and updates store.
   * 
   * @private
   */
  private loadUsers(): void {
    const pagination = this.query.getValue().pagination;
    
    this.service.fetchUsers({
      page: pagination.page,
      limit: pagination.limit
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  /**
   * Handle filter changes from UserFiltersComponent
   * 
   * @description Applies filters and refetches users.
   * 
   * @param filter - Filter criteria from filter component
   * 
   * @example
   * ```html
   * <app-user-filters (filterChange)="onFilterChange($event)">
   * ```
   */
  onFilterChange(filter: UserFilter): void {
    this.service.applyFilters(filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Handle search query changes from UserSearchComponent
   * 
   * @description Applies search query and refetches users.
   * 
   * @param query - Search query string
   * 
   * @example
   * ```html
   * <app-user-search (searchChange)="onSearchChange($event)">
   * ```
   */
  onSearchChange(query: string): void {
    this.service.applySearch(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Handle pagination changes from MatPaginator
   * 
   * @description Updates page/limit and refetches users.
   * 
   * @param event - Pagination event from Material paginator
   * 
   * @example
   * ```html
   * <mat-paginator (page)="onPageChange($event)">
   * ```
   */
  onPageChange(event: PageEvent): void {
    const state = this.query.getValue();

    this.service.fetchUsers({
      page: event.pageIndex + 1, // Material uses 0-based, API uses 1-based
      limit: event.pageSize,
      search: state.search,
      status: state.filters.status || undefined,
      role: state.filters.role || undefined,
      adminRole: state.filters.adminRole || undefined
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  /**
   * Handle user row selection from UserTableComponent
   * 
   * @description Opens detail panel for selected user.
   * 
   * @param user - Selected user from table
   * 
   * @example
   * ```html
   * <app-user-table (userSelect)="onUserSelect($event)">
   * ```
   */
  onUserSelect(user: ManagedUser): void {
    this.service.selectUser(user.id);
    this.detailPanelOpen = true;
  }

  /**
   * Handle action clicks from UserTableComponent
   * 
   * @description Routes action to appropriate service method.
   * 
   * @param event - Action event with action name and user
   * 
   * @example
   * ```html
   * <app-user-table (actionClick)="onActionClick($event)">
   * ```
   */
  onActionClick(event: { action: string; user: ManagedUser }): void {
    const { action, user } = event;

    switch (action) {
      case 'edit':
        this.onUserSelect(user);
        break;
      case 'ban':
        this.onBanUser(user);
        break;
      case 'unban':
        this.onUnbanUser(user);
        break;
      case 'suspend':
        this.onSuspendUser(user);
        break;
      case 'unsuspend':
        this.onUnsuspendUser(user);
        break;
      case 'activity':
        this.onViewActivity(user);
        break;
      case 'resetPassword':
        this.onResetPassword(user);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  /**
   * Handle bulk actions from BulkActionsToolbarComponent
   * 
   * @description Executes bulk operation on multiple users.
   * 
   * @param action - Bulk action type
   * @param userIds - Array of user IDs to apply action to
   * 
   * @example
   * ```html
   * <app-bulk-actions-toolbar (bulkAction)="onBulkAction($event.action, $event.userIds)">
   * ```
   */
  onBulkAction(action: BulkAction, userIds: number[]): void {
    // TODO: Implement bulk actions
    // Will be implemented with dialogs in Phase 5
    console.log('Bulk action:', action, 'on users:', userIds);
  }

  /**
   * Ban user
   * 
   * @description Opens ban dialog and executes ban operation.
   * 
   * @param user - User to ban
   * 
   * @private
   */
  private onBanUser(user: ManagedUser): void {
    // TODO: Open BanUserDialogComponent
    // For now, direct call (will be replaced with dialog in Phase 5)
    const reason = 'Violated terms of service'; // TODO: Get from dialog
    
    this.service.banUser(user.id, {
      reason,
      permanent: false
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  /**
   * Unban user
   * 
   * @description Executes unban operation with confirmation.
   * 
   * @param user - User to unban
   * 
   * @private
   */
  private onUnbanUser(user: ManagedUser): void {
    // TODO: Show confirmation dialog
    this.service.unbanUser(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Suspend user
   * 
   * @description Opens suspend dialog and executes suspension.
   * 
   * @param user - User to suspend
   * 
   * @private
   */
  private onSuspendUser(user: ManagedUser): void {
    // TODO: Open SuspendUserDialogComponent
    const reason = 'Under investigation'; // TODO: Get from dialog
    const until = new Date();
    until.setDate(until.getDate() + 7); // 7 days

    this.service.suspendUser(user.id, {
      reason,
      until
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  /**
   * Unsuspend user
   * 
   * @description Executes unsuspension with confirmation.
   * 
   * @param user - User to unsuspend
   * 
   * @private
   */
  private onUnsuspendUser(user: ManagedUser): void {
    // TODO: Show confirmation dialog
    this.service.unsuspendUser(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * View user activity
   * 
   * @description Opens detail panel on activity tab.
   * 
   * @param user - User to view activity for
   * 
   * @private
   */
  private onViewActivity(user: ManagedUser): void {
    this.service.selectUser(user.id);
    this.detailPanelOpen = true;
    // TODO: Set active tab to activity in detail panel
  }

  /**
   * Reset user password
   * 
   * @description Sends password reset email with confirmation.
   * 
   * @param user - User to reset password for
   * 
   * @private
   */
  private onResetPassword(user: ManagedUser): void {
    // TODO: Show confirmation dialog
    this.service.resetPassword(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Close detail panel
   * 
   * @description Deselects user and closes detail panel.
   * 
   * @example
   * ```html
   * <app-user-detail-panel (close)="onDetailPanelClose()">
   * ```
   */
  onDetailPanelClose(): void {
    this.service.selectUser(null);
    this.detailPanelOpen = false;
  }

  /**
   * Toggle filters sidebar
   * 
   * @description Shows/hides filter panel.
   */
  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  /**
   * Clear all filters
   * 
   * @description Resets filters and refetches users.
   */
  clearAllFilters(): void {
    this.service.clearFilters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Refresh user list
   * 
   * @description Refetches users with current settings.
   */
  refresh(): void {
    this.service.refresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Export users
   * 
   * @description Exports filtered users to CSV.
   * TODO: Implement export functionality
   */
  exportUsers(): void {
    console.log('Export users - TODO');
  }
}
