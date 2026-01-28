/**
 * Audit Log View Component
 * 
 * @description Primary view for displaying security audit event logs.
 * Features comprehensive filtering, sorting, pagination, and detail viewing.
 * 
 * Features:
 * - Expandable filter panel with multiple criteria
 * - Sortable data table with all event fields
 * - Paginated results with configurable page sizes
 * - Row actions for viewing event details
 * - Responsive table with horizontal scrolling on mobile
 * 
 * Table Columns:
 * - Timestamp: Event creation date/time
 * - Action: Security audit action type (color-coded badge)
 * - User: User email or "Anonymous"
 * - Status: Success/failure indicator
 * - Resource: Resource type that was accessed
 * - IP Address: Origin IP address
 * - Actions: Detail view button
 * 
 * @example
 * ```html
 * <app-audit-log-view />
 * ```
 * 
 * @swagger
 * components:
 *   AuditLogView:
 *     description: Comprehensive audit event log viewer with filtering and pagination
 */

import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// State management
import { SecurityAuditQuery } from '../../state/security-audit.query';
import { SecurityAuditService } from '../../state/security-audit.service';

// Models
import { SecurityAuditEvent } from '../../models';

// Components
import { ActionBadgeComponent } from '../../components/action-badge.component';
import { SuccessIndicatorComponent } from '../../components/success-indicator.component';
import { AuditFiltersComponent } from '../../components/audit-filters/audit-filters.component';
import { EventDetailDialogComponent } from '../../dialogs/event-detail-dialog/event-detail-dialog.component';

@Component({
  selector: 'app-audit-log-view',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ActionBadgeComponent,
    SuccessIndicatorComponent,
    AuditFiltersComponent,
  ],
  templateUrl: './audit-log-view.component.html',
  styleUrls: ['./audit-log-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogViewComponent implements OnInit {
  /** Inject dependencies */
  private readonly service = inject(SecurityAuditService);
  private readonly query = inject(SecurityAuditQuery);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Observable streams from query
   */
  readonly events$ = this.query.events$;
  readonly loading$ = this.query.loading$;
  readonly pagination$ = this.query.pagination$;

  /**
   * Table data source
   */
  dataSource!: MatTableDataSource<SecurityAuditEvent>;

  /**
   * Paginator reference
   */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /**
   * Sort reference
   */
  @ViewChild(MatSort) sort!: MatSort;

  /**
   * Displayed table columns
   */
  displayedColumns: string[] = [
    'timestamp',
    'action',
    'user',
    'status',
    'resource',
    'ip',
    'actions',
  ];

  /**
   * Filter panel expansion state
   */
  filtersExpanded = true;

  /**
   * Initialize component
   * 
   * @description Sets up data source and subscribes to event stream.
   */
  ngOnInit(): void {
    this.initializeDataSource();
    this.subscribeToEvents();
  }

  /**
   * Initialize table data source
   * 
   * @description Creates MatTableDataSource for event display.
   * 
   * @private
   */
  private initializeDataSource(): void {
    this.dataSource = new MatTableDataSource<SecurityAuditEvent>([]);
  }

  /**
   * Subscribe to events stream and update data source
   * 
   * @description Updates table when events change in store.
   * 
   * @private
   */
  private subscribeToEvents(): void {
    this.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((events) => {
      this.dataSource.data = events;

      // Connect paginator and sort after data is loaded
      if (this.paginator && !this.dataSource.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort && !this.dataSource.sort) {
        this.dataSource.sort = this.sort;
      }
    });
  }

  /**
   * Handle page change from paginator
   * 
   * @description Updates pagination in store and fetches new page.
   * 
   * @param event - Pagination event from Material paginator
   * 
   * @example
   * ```html
   * <mat-paginator (page)="onPageChange($event)">
   * ```
   */
  onPageChange(event: PageEvent): void {
    this.service
      .setPage(event.pageIndex + 1) // Convert to 1-based
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Update page size if changed
    if (event.pageSize !== this.query.getValue().pagination.limit) {
      this.service
        .setPageSize(event.pageSize)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  /**
   * View event details in dialog
   * 
   * @description Opens dialog with full event information.
   * 
   * @param event - Event to display
   * 
   * @example
   * ```html
   * <button mat-icon-button (click)="viewDetails(event)">
   * ```
   */
  viewDetails(event: SecurityAuditEvent): void {
    this.dialog.open(EventDetailDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: event,
      autoFocus: false,
    });
  }

  /**
   * Format user display name
   * 
   * @description Returns user email or "Anonymous" for null user.
   * 
   * @param event - Audit event
   * @returns Formatted user name
   */
  getUserDisplay(event: SecurityAuditEvent): string {
    return event.userEmail || 'Anonymous';
  }

  /**
   * Format resource display
   * 
   * @description Returns resource type or "-" for null.
   * 
   * @param event - Audit event
   * @returns Formatted resource type
   */
  getResourceDisplay(event: SecurityAuditEvent): string {
    return event.resourceType || '-';
  }
}
