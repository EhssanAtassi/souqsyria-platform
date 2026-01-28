import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RouteManagementService } from '../../state/route-management.service';
import { RouteManagementQuery } from '../../state/route-management.query';
import { Route, PermissionCoverageItem } from '../../models';
import { MethodBadgeComponent } from '../../components/method-badge/method-badge.component';

/**
 * Route Matrix View Component
 *
 * Permission coverage heat map showing which permissions protect which routes.
 * Features:
 * - Visual matrix of permission-to-route mappings
 * - Coverage statistics per permission
 * - Highlighted unmapped routes section
 * - Quick actions for auto-mapping and bulk operations
 *
 * @example
 * ```html
 * <app-route-matrix-view></app-route-matrix-view>
 * ```
 */
@Component({
  selector: 'app-route-matrix-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MethodBadgeComponent,
  ],
  templateUrl: './route-matrix-view.component.html',
  styleUrls: ['./route-matrix-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteMatrixViewComponent implements OnInit {
  private readonly routeService = inject(RouteManagementService);
  private readonly routeQuery = inject(RouteManagementQuery);

  /**
   * Observable state
   */
  readonly permissionCoverage$ = this.routeQuery.permissionCoverage$;
  readonly unmappedRoutes$ = this.routeQuery.unmappedRoutes$;
  readonly loading$ = this.routeQuery.loading$;

  /**
   * Selected route ID for highlighting
   */
  readonly selectedRouteId = signal<string | null>(null);

  constructor() {
    // Subscribe to selected route
    this.routeQuery.selectedRoute$
      .pipe(takeUntilDestroyed())
      .subscribe((route) => {
        this.selectedRouteId.set(route?.id || null);
      });
  }

  ngOnInit(): void {
    // Fetch permission coverage data
    this.routeService.fetchPermissionCoverage();
  }

  /**
   * Check if route is selected
   *
   * @param routeId - Route identifier
   * @returns True if route is selected
   */
  isSelected(routeId: string): boolean {
    return this.selectedRouteId() === routeId;
  }

  /**
   * Select route and open detail panel
   *
   * @param routeId - Route identifier
   */
  selectRoute(routeId: string): void {
    this.routeService.selectRoute(routeId);
  }

  /**
   * View permission details
   *
   * @param permissionId - Permission identifier
   */
  viewPermissionDetails(permissionId: string): void {
    // Navigate to permission detail or open dialog
    // Implementation depends on permission management integration
    console.log('View permission:', permissionId);
  }

  /**
   * Add routes to permission
   *
   * @param permissionId - Permission identifier
   */
  addRoutes(permissionId: string): void {
    // TODO: Implement dialog for adding routes to permission
    console.log('Add routes to permission:', permissionId);
  }

  /**
   * Auto-map unmapped routes using AI suggestions
   */
  autoMapUnmapped(): void {
    this.routeService.generateAutoMappings().subscribe({
      next: (result) => {
        console.log('Auto-mapped routes:', result);
      },
      error: (error) => {
        console.error('Auto-map failed:', error);
      },
    });
  }

  /**
   * Get heat map color intensity based on route count
   *
   * @param routeCount - Number of routes
   * @returns CSS color value
   */
  getHeatMapColor(routeCount: number): string {
    if (routeCount === 0) {
      return 'rgba(0, 0, 0, 0.05)';
    } else if (routeCount <= 5) {
      return 'rgba(33, 150, 243, 0.2)';
    } else if (routeCount <= 10) {
      return 'rgba(33, 150, 243, 0.4)';
    } else if (routeCount <= 20) {
      return 'rgba(33, 150, 243, 0.6)';
    } else {
      return 'rgba(33, 150, 243, 0.8)';
    }
  }

  /**
   * TrackBy function for permission groups
   *
   * @param index - Group index
   * @param group - Permission coverage group
   * @returns Unique identifier
   */
  trackByPermissionId(index: number, group: PermissionCoverageItem): string {
    return group.permissionId;
  }

  /**
   * TrackBy function for routes
   *
   * @param index - Route index
   * @param route - Route or RouteReference object
   * @returns Unique identifier
   */
  trackByRouteId(index: number, route: Route | { id: string }): string {
    return route.id;
  }
}
