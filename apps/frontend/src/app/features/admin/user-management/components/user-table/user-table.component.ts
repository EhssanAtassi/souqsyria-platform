import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { User } from '../../models';

/**
 * User Table Component
 * 
 * @description Presentational component for displaying users in a Material table.
 * Supports sorting, selection, and row actions.
 * 
 * Features:
 * - Multi-select with checkboxes
 * - Column sorting
 * - Row click to view details
 * - Action menu for each user
 * - Permission-based action visibility
 * - Loading state
 * - Empty state
 * - Responsive layout
 * 
 * @example
 * ```html
 * <app-user-table
 *   [users]="users"
 *   [loading]="false"
 *   (userSelect)="onUserSelect($event)"
 *   (actionClick)="onAction($event)">
 * </app-user-table>
 * ```
 */
@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSortModule
    // TODO: Import custom components when created
    // UserAvatarComponent,
    // StatusBadgeComponent
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTableComponent {
  /**
   * List of users to display
   */
  @Input() set users(value: User[]) {
    this.dataSource.data = value || [];
  }

  /**
   * Loading state
   */
  @Input() loading = false;

  /**
   * Selected user IDs (for bulk operations)
   */
  @Input() set selectedIds(value: number[]) {
    this.selection.clear();
    if (value && value.length > 0) {
      const users = this.dataSource.data.filter(u => value.includes(u.id));
      this.selection.select(...users);
    }
  }

  /**
   * Emits when user row is clicked
   */
  @Output() userSelect = new EventEmitter<User>();

  /**
   * Emits when action button is clicked
   */
  @Output() actionClick = new EventEmitter<{ action: string; user: User }>();

  /**
   * Emits when selection changes (for bulk operations)
   */
  @Output() selectionChange = new EventEmitter<number[]>();

  /**
   * Mat table data source
   */
  dataSource = new MatTableDataSource<User>([]);

  /**
   * Selection model for multi-select
   */
  selection = new SelectionModel<User>(true, []);

  /**
   * Mat sort reference
   */
  @ViewChild(MatSort) set sort(value: MatSort) {
    if (value) {
      this.dataSource.sort = value;
    }
  }

  /**
   * Displayed columns
   */
  displayedColumns = [
    'select',
    'avatar',
    'name',
    'email',
    'businessRole',
    'adminRole',
    'status',
    'lastLogin',
    'createdAt',
    'actions'
  ];

  /**
   * Track by function for performance
   * 
   * @description Uses user ID as unique identifier.
   * Prevents unnecessary re-renders when data changes.
   * 
   * @param index - Row index
   * @param user - User object
   * @returns User ID
   */
  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  /**
   * Check if all rows are selected
   * 
   * @returns True if all rows are selected
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /**
   * Check if some rows are selected
   * 
   * @returns True if some but not all rows are selected
   */
  isSomeSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected > 0 && numSelected < numRows;
  }

  /**
   * Toggle all rows selection
   * 
   * @description Selects all if none or some are selected.
   * Clears selection if all are selected.
   */
  toggleAll(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(user => this.selection.select(user));
    }
    this.emitSelectionChange();
  }

  /**
   * Toggle single row selection
   * 
   * @param user - User to toggle
   * @param event - Click event (to stop propagation)
   */
  toggleRow(user: User, event: Event): void {
    event.stopPropagation();
    this.selection.toggle(user);
    this.emitSelectionChange();
  }

  /**
   * Emit selection change event
   * 
   * @description Emits array of selected user IDs.
   * 
   * @private
   */
  private emitSelectionChange(): void {
    const selectedIds = this.selection.selected.map(u => u.id);
    this.selectionChange.emit(selectedIds);
  }

  /**
   * Handle row click
   * 
   * @description Emits userSelect event to open detail panel.
   * 
   * @param user - Clicked user
   * @param event - Click event (to prevent on checkbox click)
   */
  onRowClick(user: User, event: Event): void {
    // Don't trigger on checkbox or action clicks
    const target = event.target as HTMLElement;
    if (
      target.closest('.mat-checkbox') ||
      target.closest('button') ||
      target.closest('mat-menu')
    ) {
      return;
    }

    this.userSelect.emit(user);
  }

  /**
   * Handle action click
   * 
   * @description Emits actionClick event with action name and user.
   * Stops event propagation to prevent row click.
   * 
   * @param action - Action name (edit, ban, suspend, etc.)
   * @param user - User to apply action to
   * @param event - Click event
   */
  onAction(action: string, user: User, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action, user });
  }

  /**
   * Get user initials for avatar fallback
   * 
   * @description Creates 2-letter initials from user name.
   * 
   * @param user - User object
   * @returns Initials (e.g., "JD" for "John Doe")
   */
  getUserInitials(user: User): string {
    const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (!name) return '??';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Get avatar background color
   * 
   * @description Generates consistent color based on user ID.
   * 
   * @param user - User object
   * @returns Hex color code
   */
  getAvatarColor(user: User): string {
    const colors = [
      '#1976d2', // Blue
      '#388e3c', // Green
      '#f57c00', // Orange
      '#7b1fa2', // Purple
      '#c2185b', // Pink
      '#0097a7', // Cyan
      '#5d4037', // Brown
      '#455a64'  // Blue grey
    ];
    
    return colors[user.id % colors.length];
  }

  /**
   * Format last login date
   * 
   * @description Converts date to relative time string.
   * 
   * @param date - Last login date
   * @returns Relative time string (e.g., "5 minutes ago")
   */
  formatLastLogin(date: Date | null): string {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 30) return new Date(date).toLocaleDateString();
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Format created date
   * 
   * @description Converts date to readable format.
   * 
   * @param date - Created date
   * @returns Formatted date string
   */
  formatCreatedAt(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get status color
   * 
   * @description Maps status to Material color.
   * 
   * @param status - User status
   * @returns Material color name
   */
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'primary';
      case 'banned':
        return 'warn';
      case 'suspended':
        return 'accent';
      case 'inactive':
        return '';
      default:
        return '';
    }
  }

  /**
   * Format business role
   * 
   * @description Converts role enum to display text.
   * 
   * @param role - Business role enum
   * @returns Display text
   */
  formatBusinessRole(role: string): string {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Check if action is available for user
   * 
   * @description Determines if action should be shown based on user state.
   * 
   * @param action - Action name
   * @param user - User object
   * @returns True if action is available
   */
  isActionAvailable(action: string, user: User): boolean {
    switch (action) {
      case 'ban':
        return user.status !== 'banned';
      case 'unban':
        return user.status === 'banned';
      case 'suspend':
        return user.status !== 'suspended' && user.status !== 'banned';
      case 'unsuspend':
        return user.status === 'suspended';
      default:
        return true;
    }
  }
}
