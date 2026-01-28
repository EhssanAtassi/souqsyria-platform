import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, startWith, map } from 'rxjs';

import { RouteManagementService } from '../../state/route-management.service';
import { RouteManagementQuery } from '../../state/route-management.query';
import { HttpMethod, RouteStatus } from '../../models';

/**
 * Permission for autocomplete (minimal interface)
 */
interface PermissionOption {
  id: string;
  name: string;
}

/**
 * RouteFiltersComponent
 *
 * Comprehensive filter panel for route management dashboard.
 * Provides filtering by:
 * - HTTP Method (GET, POST, PUT, DELETE, PATCH)
 * - Mapping Status (mapped, unmapped, public)
 * - Controller name
 * - Permission assignment
 *
 * @features
 * - Collapsible expansion panels
 * - Material selection lists
 * - Permission autocomplete with search
 * - Clear all filters action
 * - Reactive forms with automatic updates
 *
 * @example
 * ```html
 * <app-route-filters />
 * ```
 *
 * @remarks
 * All filter changes are automatically synchronized with the state layer
 * and trigger data refresh via the service.
 */
@Component({
  selector: 'app-route-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './route-filters.component.html',
  styleUrls: ['./route-filters.component.scss']
})
export class RouteFiltersComponent implements OnInit {
  /**
   * Dependency injection
   */
  private readonly service = inject(RouteManagementService);
  private readonly query = inject(RouteManagementQuery);

  /**
   * Form controls for each filter type
   */
  readonly methodControl = new FormControl<HttpMethod | 'ALL'>('ALL', { nonNullable: true });
  readonly statusControl = new FormControl<RouteStatus | 'all'>('all', { nonNullable: true });
  readonly controllerControl = new FormControl<string | null>(null);
  readonly permissionControl = new FormControl<string>('', { nonNullable: true });

  /**
   * Observable streams
   */
  readonly controllers$: Observable<string[]> = this.query.controllers$;
  readonly hasActiveFilters$: Observable<boolean> = this.query.hasActiveFilters$;

  /**
   * HTTP method options for selection
   */
  readonly httpMethods: Array<{ value: HttpMethod | 'ALL'; label: string; color?: string }> = [
    { value: 'ALL', label: 'All Methods' },
    { value: 'GET', label: 'GET', color: '#2196F3' },
    { value: 'POST', label: 'POST', color: '#4CAF50' },
    { value: 'PUT', label: 'PUT', color: '#FF9800' },
    { value: 'DELETE', label: 'DELETE', color: '#F44336' },
    { value: 'PATCH', label: 'PATCH', color: '#9C27B0' }
  ];

  /**
   * Status filter options
   */
  readonly statusOptions: Array<{ value: RouteStatus | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All Routes', icon: 'list' },
    { value: 'mapped', label: 'Mapped', icon: 'check_circle' },
    { value: 'unmapped', label: 'Unmapped', icon: 'cancel' },
    { value: 'public', label: 'Public', icon: 'public' }
  ];

  /**
   * Mock permissions for autocomplete
   * TODO: Replace with actual permission service integration
   */
  private readonly mockPermissions: PermissionOption[] = [
    { id: '1', name: 'users:read' },
    { id: '2', name: 'users:write' },
    { id: '3', name: 'users:delete' },
    { id: '4', name: 'roles:read' },
    { id: '5', name: 'roles:write' },
    { id: '6', name: 'permissions:read' }
  ];

  /**
   * Filtered permissions for autocomplete
   */
  filteredPermissions$!: Observable<PermissionOption[]>;

  constructor() {
    // Subscribe to form control changes
    this.setupFilterSubscriptions();
  }

  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.setupPermissionAutocomplete();
    this.loadCurrentFilters();
  }

  /**
   * Setup subscriptions to form control changes
   *
   * @private
   */
  private setupFilterSubscriptions(): void {
    // HTTP Method filter
    this.methodControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(method => {
        this.service.updateFilters({ method });
      });

    // Status filter
    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(status => {
        this.service.updateFilters({ status });
      });

    // Controller filter
    this.controllerControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(controller => {
        this.service.updateFilters({ controller });
      });
  }

  /**
   * Setup permission autocomplete filtering
   *
   * @private
   */
  private setupPermissionAutocomplete(): void {
    this.filteredPermissions$ = this.permissionControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPermissions(value || ''))
    );
  }

  /**
   * Filter permissions based on search input
   *
   * @param value - Search term
   * @returns Filtered permission list
   *
   * @private
   */
  private _filterPermissions(value: string): PermissionOption[] {
    const filterValue = value.toLowerCase();
    return this.mockPermissions.filter(permission =>
      permission.name.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Load current filter state from store
   *
   * Initializes form controls with existing filter values
   *
   * @private
   */
  private loadCurrentFilters(): void {
    const currentFilters = this.query.getValue().filters;

    this.methodControl.setValue(currentFilters.method, { emitEvent: false });
    this.statusControl.setValue(currentFilters.status, { emitEvent: false });
    this.controllerControl.setValue(currentFilters.controller, { emitEvent: false });

    if (currentFilters.permissionId) {
      const permission = this.mockPermissions.find(p => p.id === currentFilters.permissionId);
      if (permission) {
        this.permissionControl.setValue(permission.name, { emitEvent: false });
      }
    }
  }

  /**
   * Handle permission selection from autocomplete
   *
   * @param permissionId - Selected permission ID
   *
   * @public
   */
  onPermissionSelected(permissionId: string): void {
    this.service.updateFilters({ permissionId });
  }

  /**
   * Clear all active filters
   *
   * Resets all form controls to default values
   * and clears filters in the service.
   *
   * @public
   */
  clearAll(): void {
    this.methodControl.setValue('ALL', { emitEvent: false });
    this.statusControl.setValue('all', { emitEvent: false });
    this.controllerControl.setValue(null, { emitEvent: false });
    this.permissionControl.setValue('', { emitEvent: false });

    this.service.clearFilters();
  }

  /**
   * Get color for HTTP method chip
   *
   * @param method - HTTP method
   * @returns CSS color value
   *
   * @public
   */
  getMethodColor(method: HttpMethod | 'ALL'): string {
    const option = this.httpMethods.find(m => m.value === method);
    return option?.color || 'transparent';
  }

  /**
   * Display function for permission autocomplete
   *
   * @param permissionId - Permission ID
   * @returns Display name for the permission
   *
   * @public
   */
  displayPermission(permissionId: string): string {
    const permission = this.mockPermissions.find(p => p.id === permissionId);
    return permission ? permission.name : '';
  }
}
