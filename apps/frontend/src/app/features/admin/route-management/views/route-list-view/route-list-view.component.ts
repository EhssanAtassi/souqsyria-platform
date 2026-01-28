import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatTableModule,
  MatTableDataSource,
} from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { SelectionModel } from '@angular/cdk/collections';

import { RouteManagementService } from '../../state/route-management.service';
import { RouteManagementQuery } from '../../state/route-management.query';
import { Route, RouteStatus } from '../../models/route.model';
import { MethodBadgeComponent } from '../../components/method-badge/method-badge.component';
import { StatusIndicatorComponent } from '../../components/status-indicator/status-indicator.component';
import { PermissionLinkEditorComponent } from '../../components/permission-link-editor/permission-link-editor.component';
import { BulkActionsBarComponent } from './components/bulk-actions-bar.component';

/**
 * Route List View Component
 *
 * Primary view displaying routes in a Material table with advanced features:
 * - Multi-row selection with bulk operations
 * - Inline permission editing
 * - Sorting and pagination
 * - Row-level actions menu
 * - Real-time status indicators
 *
 * @example
 * ```html
 * <app-route-list-view></app-route-list-view>
 * ```
 */
@Component({
  selector: 'app-route-list-view',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MethodBadgeComponent,
    StatusIndicatorComponent,
    PermissionLinkEditorComponent,
    BulkActionsBarComponent,
  ],
  templateUrl: './route-list-view.component.html',
  styleUrls: ['./route-list-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteListViewComponent implements OnInit {
  private readonly routeService = inject(RouteManagementService);
  private readonly routeQuery = inject(RouteManagementQuery);

  /**
   * Table columns to display
   */
  readonly displayedColumns: string[] = [
    'select',
    'method',
    'path',
    'controller',
    'handler',
    'status',
    'permission',
    'actions',
  ];

  /**
   * Selection model for multi-row selection
   */
  readonly selection = new SelectionModel<string>(true, []);

  /**
   * Route data observables
   */
  readonly routes$ = this.routeQuery.filteredRoutes$;
  readonly pagination$ = this.routeQuery.pagination$;
  readonly loading$ = this.routeQuery.loading$;

  /**
   * Bulk selection state
   */
  readonly hasSelection = computed(() => this.selection.selected.length > 0);
  readonly selectedCount = computed(() => this.selection.selected.length);

  /**
   * Current route data for table
   */
  private currentRoutes = signal<Route[]>([]);

  constructor() {
    // Subscribe to routes data
    this.routes$.pipe(takeUntilDestroyed()).subscribe((routes) => {
      this.currentRoutes.set(routes);
    });
  }

  ngOnInit(): void {
    // Initial data load is handled by parent container
  }

  /**
   * Check if all rows are selected
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.currentRoutes().length;
    return numSelected === numRows && numRows > 0;
  }

  /**
   * Check if some but not all rows are selected
   */
  hasPartialSelection(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.currentRoutes().length;
    return numSelected > 0 && numSelected < numRows;
  }

  /**
   * Toggle all rows selection
   */
  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.currentRoutes().forEach((route) => this.selection.select(route.id));
    }
  }

  /**
   * Toggle individual row selection
   *
   * @param routeId - Route identifier
   */
  toggleRow(routeId: string): void {
    this.selection.toggle(routeId);
  }

  /**
   * Check if specific route is selected
   *
   * @param routeId - Route identifier
   * @returns True if route is selected
   */
  isSelected(routeId: string): boolean {
    return this.selection.isSelected(routeId);
  }

  /**
   * Select single route and open detail panel
   *
   * @param route - Route to select
   */
  selectRoute(route: Route): void {
    this.routeService.selectRoute(route.id);
  }

  /**
   * Deselect all rows
   */
  deselectAll(): void {
    this.selection.clear();
  }

  /**
   * Handle bulk permission linking
   */
  bulkLinkPermissions(): void {
    const selectedIds = this.selection.selected;
    // TODO: Implement bulk link dialog
    console.log('Bulk link permissions:', selectedIds);
  }

  /**
   * Handle bulk permission unlinking
   */
  bulkUnlinkPermissions(): void {
    const selectedIds = this.selection.selected;
    // TODO: Implement bulk unlink
    console.log('Bulk unlink permissions:', selectedIds);
    this.selection.clear();
  }

  /**
   * Handle sort change event
   *
   * @param sort - Material Sort event
   */
  onSort(sort: Sort): void {
    // TODO: Implement sort via updateFilters
    console.log('Sort changed:', sort);
  }

  /**
   * Handle page change event
   *
   * @param event - Material PageEvent
   */
  onPageChange(event: PageEvent): void {
    this.routeService.updatePagination(event.pageIndex, event.pageSize);
  }

  /**
   * Handle permission linked event
   *
   * @param routeId - Route identifier
   * @param permissionId - Linked permission identifier
   */
  onPermissionLinked(routeId: string, permissionId: string): void {
    // State update handled by PermissionLinkEditorComponent
    // This is for additional UI feedback if needed
  }

  /**
   * Handle permission unlinked event
   *
   * @param routeId - Route identifier
   */
  onPermissionUnlinked(routeId: string): void {
    // State update handled by PermissionLinkEditorComponent
  }

  /**
   * View route details in side panel
   *
   * @param route - Route to view
   */
  viewDetails(route: Route): void {
    this.routeService.selectRoute(route.id);
  }

  /**
   * Apply AI suggestion for route
   *
   * @param route - Route to apply suggestion
   */
  applySuggestion(route: Route): void {
    // TODO: Implement applySuggestion in service
    console.log('Apply suggestion for route:', route.id);
  }

  /**
   * Unlink permission from route
   *
   * @param routeId - Route identifier
   */
  unlinkPermission(routeId: string): void {
    this.routeService.unlinkPermission(routeId).subscribe();
  }

  /**
   * Get route status for display
   *
   * @param route - Route object
   * @returns Route status enum value
   */
  getStatus(route: Route): RouteStatus {
    if (route.permissionId) {
      return 'mapped';
    }
    if (route.isPublic) {
      return 'public';
    }
    if (route.suggestedPermission) {
      return 'unmapped'; // No 'suggested' status in type, using 'unmapped'
    }
    return 'unmapped';
  }

  /**
   * TrackBy function for route rows
   *
   * @param index - Row index
   * @param route - Route object
   * @returns Unique identifier
   */
  trackByRouteId(index: number, route: Route): string {
    return route.id;
  }
}
