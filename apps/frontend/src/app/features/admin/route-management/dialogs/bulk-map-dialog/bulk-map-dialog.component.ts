import { Component, OnInit, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, startWith, map } from 'rxjs';

import { Route } from '../../models/route.model';
import { Permission } from '../../../role-management/models';
import { MethodBadgeComponent } from '../../components/method-badge/method-badge.component';

/**
 * Input data for the Bulk Map Dialog
 */
export interface BulkMapDialogData {
  /**
   * Array of route IDs selected for bulk mapping
   */
  selectedRouteIds: string[];

  /**
   * Full route objects for display
   */
  routes: Route[];

  /**
   * Available permissions to map to
   */
  permissions: Permission[];
}

/**
 * Result returned when dialog is closed with confirmation
 */
export interface BulkMapDialogResult {
  /**
   * ID of the permission to apply to all routes
   */
  permissionId: string;

  /**
   * Array of route IDs to map
   */
  routeIds: string[];

  /**
   * Permission object for reference
   */
  permission: Permission;
}

/**
 * BulkMapDialogComponent
 *
 * Multi-step wizard dialog for bulk mapping multiple routes to a single permission.
 * Provides:
 * - Step 1: Review selected routes
 * - Step 2: Search and select target permission with autocomplete
 * - Step 3: Confirm mapping operation
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(BulkMapDialogComponent, {
 *   width: '600px',
 *   data: {
 *     selectedRouteIds: ['route-1', 'route-2'],
 *     routes: [route1, route2],
 *     permissions: allPermissions
 *   }
 * });
 *
 * dialogRef.afterClosed().subscribe((result: BulkMapDialogResult) => {
 *   if (result) {
 *     // Apply bulk mapping
 *   }
 * });
 * ```
 */
@Component({
  selector: 'app-bulk-map-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatListModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MethodBadgeComponent
  ],
  templateUrl: './bulk-map-dialog.component.html',
  styleUrls: ['./bulk-map-dialog.component.scss']
})
export class BulkMapDialogComponent implements OnInit {
  /**
   * Form control for permission search with autocomplete
   */
  permissionControl = new FormControl<Permission | null>(null, [
    Validators.required
  ]);

  /**
   * Currently selected permission
   */
  selectedPermission = signal<Permission | null>(null);

  /**
   * Loading state during async operations
   */
  loading = signal(false);

  /**
   * Filtered permissions based on search input
   */
  filteredPermissions$!: Observable<Permission[]>;

  /**
   * Computed property for total route count
   */
  routeCount = computed(() => this.data.routes.length);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BulkMapDialogData,
    private dialogRef: MatDialogRef<BulkMapDialogComponent, BulkMapDialogResult>,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Initializes the component and sets up autocomplete filtering
   */
  ngOnInit(): void {
    this.setupAutocomplete();

    // Subscribe to permission control changes
    this.permissionControl.valueChanges.subscribe(value => {
      if (value && typeof value === 'object') {
        this.selectedPermission.set(value);
      }
    });
  }

  /**
   * Sets up autocomplete filtering for permission search
   */
  private setupAutocomplete(): void {
    this.filteredPermissions$ = this.permissionControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const searchTerm = typeof value === 'string' ? value : value?.name || '';
        return this.filterPermissions(searchTerm);
      })
    );
  }

  /**
   * Filters permissions based on search term
   *
   * @param searchTerm - The search string to filter by
   * @returns Filtered array of permissions
   */
  private filterPermissions(searchTerm: string): Permission[] {
    if (!searchTerm) {
      return this.data.permissions;
    }

    const filterValue = searchTerm.toLowerCase();

    return this.data.permissions.filter(permission => {
      const nameMatch = permission.name.toLowerCase().includes(filterValue);
      const descriptionMatch = permission.description
        ?.toLowerCase()
        .includes(filterValue);
      const resourceMatch = permission.resource?.toLowerCase().includes(filterValue);

      return nameMatch || descriptionMatch || resourceMatch;
    });
  }

  /**
   * Display function for autocomplete
   * Shows permission name in the input field
   *
   * @param permission - Permission object or null
   * @returns Display string for autocomplete
   */
  displayPermission(permission: Permission | null): string {
    return permission?.name || '';
  }

  /**
   * Handles the confirm action from step 3
   * Validates data and closes dialog with result
   */
  onConfirm(): void {
    const permission = this.selectedPermission();

    if (!permission) {
      this.snackBar.open('Please select a permission', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (this.data.routes.length === 0) {
      this.snackBar.open('No routes selected', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.loading.set(true);

    // Simulate async operation
    setTimeout(() => {
      this.loading.set(false);

      const result: BulkMapDialogResult = {
        permissionId: permission.id,
        routeIds: this.data.selectedRouteIds,
        permission: permission
      };

      this.dialogRef.close(result);

      this.snackBar.open(
        `Bulk mapping ${this.data.routes.length} routes to "${permission.name}"`,
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      );
    }, 500);
  }

  /**
   * Handles cancel action
   * Closes dialog without returning data
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Gets the icon for a permission
   *
   * @param permission - Permission object
   * @returns Icon name
   */
  getPermissionIcon(permission: Permission): string {
    return permission.resource
      ? this.getResourceIcon(permission.resource)
      : 'shield';
  }

  /**
   * Maps resource type to appropriate icon
   *
   * @param resource - Resource name
   * @returns Material icon name
   */
  private getResourceIcon(resource: string): string {
    const iconMap: Record<string, string> = {
      user: 'person',
      role: 'admin_panel_settings',
      permission: 'verified_user',
      route: 'route',
      product: 'inventory_2',
      order: 'shopping_cart',
      category: 'category',
      settings: 'settings'
    };

    return iconMap[resource.toLowerCase()] || 'shield';
  }

  /**
   * Tracks routes in ngFor for performance
   *
   * @param index - Index in array
   * @param route - Route object
   * @returns Unique identifier
   */
  trackByRouteId(index: number, route: Route): string {
    return route.id;
  }

  /**
   * Tracks permissions in ngFor for performance
   *
   * @param index - Index in array
   * @param permission - Permission object
   * @returns Unique identifier
   */
  trackByPermissionId(index: number, permission: Permission): string {
    return permission.id;
  }
}
