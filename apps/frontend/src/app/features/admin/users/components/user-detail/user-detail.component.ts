/**
 * @file user-detail.component.ts
 * @description User detail component for viewing complete user information.
 *              Shows profile, activity history, orders summary, and management actions.
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
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, forkJoin, takeUntil, finalize } from 'rxjs';

import { AdminUsersService } from '../../../services';
import { AdminStatusBadgeComponent, CurrencyFormatPipe } from '../../../shared';
import { UserDetails, UserStatus, KycStatus, PaginatedResponse } from '../../../interfaces';
import { RoleAssignmentDialogComponent } from '../role-assignment-dialog/role-assignment-dialog.component';
import { StatusChangeDialogComponent } from '../status-change-dialog/status-change-dialog.component';

/**
 * User activity log entry
 */
interface ActivityEntry {
  id: number;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

/**
 * User orders summary
 */
interface OrdersSummary {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  ordersByStatus: { status: string; count: number }[];
}

/**
 * User Detail Component
 * @description Displays complete user profile with activity history,
 *              order summary, and management actions.
 *
 * @features
 * - User profile information display
 * - Account status and KYC status badges
 * - Role management via dialog
 * - Status change via dialog
 * - Activity timeline with pagination
 * - Orders summary with status breakdown
 *
 * @example
 * ```html
 * <!-- Routed via /admin/users/:id -->
 * <app-user-detail></app-user-detail>
 * ```
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule,
    AdminStatusBadgeComponent,
    CurrencyFormatPipe
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDetailComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(AdminUsersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** User ID from route */
  readonly userId = signal<number | null>(null);

  /** Loading state */
  readonly isLoading = signal(false);

  /** Loading state for activity */
  readonly isLoadingActivity = signal(false);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** User details */
  readonly user = signal<UserDetails | null>(null);

  /** User activity log */
  readonly activities = signal<ActivityEntry[]>([]);

  /** Activity pagination */
  readonly activityPagination = signal({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  /** Orders summary */
  readonly ordersSummary = signal<OrdersSummary | null>(null);

  /** Active tab index */
  readonly activeTab = signal(0);

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** User's full name */
  readonly fullName = computed(() => this.user()?.fullName || 'Loading...');

  /** User's initials for avatar */
  readonly initials = computed(() => {
    const user = this.user();
    if (!user) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  });

  /** Formatted member since date */
  readonly memberSince = computed(() => {
    const user = this.user();
    if (!user) return '';
    return new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = parseInt(params['id'], 10);
      if (!isNaN(id)) {
        this.userId.set(id);
        this.loadUserDetails();
      } else {
        this.router.navigate(['/admin/users']);
      }
    });

    // Check for fragment to determine initial tab
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe(fragment => {
      if (fragment === 'activity') {
        this.activeTab.set(1);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load user details and related data
   */
  loadUserDetails(): void {
    const userId = this.userId();
    if (!userId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      user: this.usersService.getUserById(userId),
      ordersSummary: this.usersService.getUserOrdersSummary(userId)
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: ({ user, ordersSummary }) => {
          this.user.set(user);
          this.ordersSummary.set(ordersSummary);
          this.loadActivity();
        },
        error: (error) => {
          console.error('Error loading user details:', error);
          this.errorMessage.set('Failed to load user details. Please try again.');
        }
      });
  }

  /**
   * Load user activity log
   */
  loadActivity(): void {
    const userId = this.userId();
    if (!userId) return;

    this.isLoadingActivity.set(true);

    this.usersService.getUserActivity(userId, {
      page: this.activityPagination().page,
      limit: this.activityPagination().limit
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingActivity.set(false))
      )
      .subscribe({
        next: (response: PaginatedResponse<ActivityEntry>) => {
          this.activities.set(response.items);
          this.activityPagination.update(p => ({
            ...p,
            total: response.total,
            totalPages: response.totalPages
          }));
        },
        error: (error) => {
          console.error('Error loading activity:', error);
        }
      });
  }

  // =========================================================================
  // TAB HANDLING
  // =========================================================================

  /**
   * Handle tab change
   * @param index - New tab index
   */
  onTabChange(index: number): void {
    this.activeTab.set(index);
  }

  // =========================================================================
  // ACTIVITY PAGINATION
  // =========================================================================

  /**
   * Load next page of activity
   */
  loadMoreActivity(): void {
    const pagination = this.activityPagination();
    if (pagination.page < pagination.totalPages) {
      this.activityPagination.update(p => ({ ...p, page: p.page + 1 }));
      this.loadActivity();
    }
  }

  // =========================================================================
  // DIALOGS
  // =========================================================================

  /**
   * Open role management dialog
   */
  openRoleDialog(): void {
    const user = this.user();
    if (!user) return;

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
          this.loadUserDetails();
        }
      });
  }

  /**
   * Open status change dialog
   */
  openStatusDialog(): void {
    const user = this.user();
    if (!user) return;

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
          this.loadUserDetails();
        }
      });
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get status badge variant
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
   * Get KYC status badge variant
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
   * Get activity icon
   * @param action - Activity action type
   * @returns Material icon name
   */
  getActivityIcon(action: string): string {
    const iconMap: Record<string, string> = {
      login: 'login',
      logout: 'logout',
      order_placed: 'shopping_cart',
      order_cancelled: 'cancel',
      profile_updated: 'edit',
      password_changed: 'lock',
      address_added: 'add_location',
      review_submitted: 'rate_review',
      wishlist_added: 'favorite',
      wishlist_removed: 'favorite_border'
    };
    return iconMap[action] || 'history';
  }

  /**
   * Format activity timestamp
   * @param timestamp - Activity timestamp
   * @returns Formatted date string
   */
  formatActivityTime(timestamp: Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  /**
   * Navigate back to user list
   */
  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadUserDetails();
  }
}
