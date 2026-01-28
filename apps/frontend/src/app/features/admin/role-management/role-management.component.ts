/**
 * Role Management Container Component
 *
 * @description
 * Main container component for the role management dashboard.
 * Orchestrates all child components and manages role operations.
 *
 * @features
 * - Role CRUD operations (create, edit, clone, delete)
 * - Filtering and search
 * - Pagination
 * - Detail panel for viewing role information
 * - Permission assignment
 * - Role templates support
 *
 * @architecture
 * - Smart container component (handles logic and state)
 * - Uses Akita for state management
 * - Delegates UI to presentational components
 * - OnPush change detection for performance
 *
 * @swagger
 * tags:
 *   - name: Role Management
 *     description: Role management dashboard operations
 *
 * @example
 * ```html
 * <app-role-management></app-role-management>
 * ```
 */

import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule } from '@angular/material/paginator';

import { RoleManagementStore } from './state/role-management.store';
import { RoleManagementQuery } from './state/role-management.query';
import { RoleManagementService } from './state/role-management.service';
import { Role, CreateRoleDto, UpdateRoleDto, CloneRoleDto } from './models';

// Component imports
import { RoleGridComponent } from './components/role-grid/role-grid.component';
import { RoleFiltersComponent } from './components/role-filters/role-filters.component';
import { RoleSearchComponent } from './components/role-search/role-search.component';
import { RoleDetailPanelComponent } from './components/role-detail-panel/role-detail-panel.component';

// Dialog imports
import { CreateRoleDialogComponent } from './dialogs/create-role-dialog/create-role-dialog.component';
import { EditRoleDialogComponent } from './dialogs/edit-role-dialog/edit-role-dialog.component';
import { CloneRoleDialogComponent } from './dialogs/clone-role-dialog/clone-role-dialog.component';
import { DeleteRoleDialogComponent } from './dialogs/delete-role-dialog/delete-role-dialog.component';

/**
 * Role Management Component
 *
 * @class RoleManagementComponent
 * @implements {OnInit}
 */
@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatDialogModule,
    RoleGridComponent,
    RoleFiltersComponent,
    RoleSearchComponent,
    RoleDetailPanelComponent
  ],
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RoleManagementStore,
    RoleManagementQuery,
    RoleManagementService
  ]
})
export class RoleManagementComponent implements OnInit {
  /**
   * Injected dependencies
   *
   * @private
   * @readonly
   */
  private readonly service = inject(RoleManagementService);
  private readonly query = inject(RoleManagementQuery);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Observable streams from query
   *
   * @description
   * All streams use async pipe in template for automatic subscription management.
   * These observables provide reactive data binding to the UI.
   *
   * @public
   * @readonly
   */
  readonly roles$ = this.query.filteredRoles$;
  readonly loading$ = this.query.loading$;
  readonly selectedRole$ = this.query.selectedRole$;
  readonly selectedRoleId$ = this.query.selectedRoleId$;
  readonly totalCount$ = this.query.totalCount$;
  readonly currentPage$ = this.query.currentPage$;
  readonly pageSize$ = this.query.pageSize$;
  readonly hasFilters$ = this.query.hasActiveFilters$;

  /**
   * UI state flags
   *
   * @description
   * Controls visibility of sidebars and panels.
   *
   * @public
   */
  filtersOpen = true;
  detailPanelOpen = false;
  drawerMode: MatDrawerMode = 'side';

  /**
   * Initialize component
   *
   * @description
   * Loads initial data and sets up subscriptions.
   * - Fetches roles with permissions and templates
   * - Subscribes to selected role changes for detail panel
   *
   * @public
   */
  ngOnInit(): void {
    // Initialize dashboard data (roles, permissions, templates)
    this.service.initializeDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Subscribe to selected role changes to open detail panel
    this.selectedRole$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(role => {
        this.detailPanelOpen = !!role;
      });
  }

  // ==========================================================================
  // EVENT HANDLERS - Search & Filter
  // ==========================================================================

  /**
   * Handle search query changes
   *
   * @description
   * Applies search query and refetches roles with current filters.
   *
   * @param {string} query - Search query string
   *
   * @public
   *
   * @example
   * ```html
   * <app-role-search (search)="onSearch($event)"></app-role-search>
   * ```
   */
  onSearch(query: string): void {
    const state = this.query.getValue();

    this.service.applyFilters({
      ...state.filters,
      search: query
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  /**
   * Handle filter changes
   *
   * @description
   * Applies filter criteria and refetches roles.
   * Resets pagination to first page.
   *
   * @param {any} filters - Filter criteria from filter component
   *
   * @public
   *
   * @example
   * ```html
   * <app-role-filters (filterChange)="onFilterChange($event)"></app-role-filters>
   * ```
   */
  onFilterChange(filters: any): void {
    this.service.applyFilters(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Clear all filters
   *
   * @description
   * Resets all filters and refetches roles with default settings.
   *
   * @public
   */
  clearFilters(): void {
    this.service.clearFilters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // ==========================================================================
  // EVENT HANDLERS - Pagination
  // ==========================================================================

  /**
   * Handle pagination changes
   *
   * @description
   * Updates page/limit and refetches roles with current filters.
   * Material paginator uses 0-based indexing, API uses 1-based.
   *
   * @param {PageEvent} event - Pagination event from Material paginator
   *
   * @public
   *
   * @example
   * ```html
   * <mat-paginator (page)="onPageChange($event)"></mat-paginator>
   * ```
   */
  onPageChange(event: PageEvent): void {
    const state = this.query.getValue();

    this.service.fetchRoles({
      page: event.pageIndex + 1, // Convert 0-based to 1-based
      limit: event.pageSize,
      ...state.filters
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // ==========================================================================
  // EVENT HANDLERS - Role Selection
  // ==========================================================================

  /**
   * Handle role selection from grid
   *
   * @description
   * Selects role and opens detail panel.
   * Fetches full role details if needed.
   *
   * @param {Role} role - Selected role from grid
   *
   * @public
   *
   * @example
   * ```html
   * <app-role-grid (roleSelect)="onRoleSelect($event)"></app-role-grid>
   * ```
   */
  onRoleSelect(role: Role): void {
    this.service.selectRole(role.id);
    this.detailPanelOpen = true;
  }

  /**
   * Close detail panel
   *
   * @description
   * Deselects role and closes detail panel.
   *
   * @public
   *
   * @example
   * ```html
   * <app-role-detail-panel (close)="onDetailPanelClose()"></app-role-detail-panel>
   * ```
   */
  onDetailPanelClose(): void {
    this.service.selectRole(null);
    this.detailPanelOpen = false;
  }

  // ==========================================================================
  // EVENT HANDLERS - Role Actions
  // ==========================================================================

  /**
   * Create new role
   *
   * @description
   * Opens create role dialog and handles role creation.
   * Uses multi-step wizard for guided creation.
   *
   * @public
   */
  onCreate(): void {
    const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: CreateRoleDto | undefined) => {
        if (result) {
          this.service.createRole(result)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  /**
   * Edit existing role
   *
   * @description
   * Opens edit role dialog with pre-filled data.
   * System roles cannot be edited (button disabled in UI).
   *
   * @param {Role} role - Role to edit
   *
   * @public
   *
   * @example
   * ```html
   * <app-role-grid (roleEdit)="onEdit($event)"></app-role-grid>
   * ```
   */
  onEdit(role: Role): void {
    if (role.isSystem) {
      console.warn('System roles cannot be edited');
      return;
    }

    const dialogRef = this.dialog.open(EditRoleDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true,
      data: { role }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: UpdateRoleDto | undefined) => {
        if (result) {
          this.service.updateRole(role.id, result)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  /**
   * Clone existing role
   *
   * @description
   * Opens clone role dialog to create a copy with new name.
   * Optionally copies permissions.
   *
   * @param {Role} role - Role to clone
   *
   * @public
   *
   * @example
   * ```html
   * <app-role-grid (roleClone)="onClone($event)"></app-role-grid>
   * ```
   */
  onClone(role: Role): void {
    const dialogRef = this.dialog.open(CloneRoleDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { role }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: CloneRoleDto | undefined) => {
        if (result) {
          this.service.cloneRole(role.id, result)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  /**
   * Delete role
   *
   * @description
   * Opens confirmation dialog before deletion.
   * System roles and roles with users cannot be deleted.
   *
   * @param {Role} role - Role to delete
   *
   * @public
   *
   * @example
   * ```html
   * <app-role-grid (roleDelete)="onDelete($event)"></app-role-grid>
   * ```
   */
  onDelete(role: Role): void {
    const dialogRef = this.dialog.open(DeleteRoleDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { role }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.service.deleteRole(role.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================

  /**
   * Toggle filters sidebar
   *
   * @description
   * Shows/hides filter panel.
   * Useful on mobile to reclaim screen space.
   *
   * @public
   */
  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  /**
   * Refresh role list
   *
   * @description
   * Refetches roles with current settings.
   * Useful to reload data after external changes.
   *
   * @public
   */
  refresh(): void {
    this.service.refresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Export roles to CSV
   *
   * @description
   * Exports filtered roles to CSV file.
   * TODO: Implement export functionality
   *
   * @public
   */
  exportRoles(): void {
    console.log('Export roles - TODO');
    // TODO: Implement CSV export
  }

  /**
   * Navigate to role templates page
   *
   * @description
   * Opens the role templates gallery.
   *
   * @public
   */
  navigateToTemplates(): void {
    this.router.navigate(['/admin/roles/templates']);
  }

  /**
   * Navigate to create role page
   *
   * @description
   * Opens the role editor in create mode.
   *
   * @public
   */
  navigateToCreateRole(): void {
    this.router.navigate(['/admin/roles/new']);
  }
}
