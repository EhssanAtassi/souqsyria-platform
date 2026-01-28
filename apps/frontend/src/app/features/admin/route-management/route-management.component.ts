import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { RouteManagementService } from './state/route-management.service';
import { RouteManagementQuery } from './state/route-management.query';
import { RouteManagementStore, ViewMode } from './state/route-management.store';
import { CoverageStats } from './models';
import { RouteSearchComponent } from './components/route-search/route-search.component';
import { RouteFiltersComponent } from './components/route-filters/route-filters.component';
import { CoverageDashboardComponent } from './components/coverage-dashboard/coverage-dashboard.component';

/**
 * RouteManagementComponent
 *
 * Main container component for the Route-Permission Mapping Dashboard.
 * Orchestrates the entire dashboard interface including:
 * - Route discovery and data fetching
 * - View mode switching (list, tree, matrix)
 * - Filter management
 * - Coverage statistics display
 * - Responsive layout with collapsible sidebar
 *
 * @example
 * <app-route-management></app-route-management>
 *
 * @architecture
 * Smart container that:
 * - Subscribes to query observables
 * - Delegates business logic to RouteManagementService
 * - Provides context to child components
 * - Manages responsive drawer behavior
 *
 * @see RouteManagementService For business logic
 * @see RouteManagementQuery For state queries
 */
@Component({
  selector: 'app-route-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatSidenavModule,
    MatProgressBarModule,
    RouteSearchComponent,
    RouteFiltersComponent,
    CoverageDashboardComponent
  ],
  providers: [
    RouteManagementStore,
    RouteManagementQuery,
    RouteManagementService
  ],
  templateUrl: './route-management.component.html',
  styleUrls: ['./route-management.component.scss']
})
export class RouteManagementComponent implements OnInit {
  /**
   * Dependency injection
   */
  private readonly service = inject(RouteManagementService);
  private readonly query = inject(RouteManagementQuery);

  /**
   * Observable streams from query layer
   */
  readonly loading$: Observable<boolean> = this.query.loading$;
  readonly coverage$: Observable<CoverageStats> = this.query.coverage$;
  readonly viewMode$: Observable<ViewMode> = this.query.viewMode$;
  readonly hasActiveFilters$: Observable<boolean> = this.query.hasActiveFilters$;

  /**
   * Signal-based UI state for drawer
   */
  readonly filtersOpen = signal(true);

  /**
   * Signal-based view mode for button toggle
   */
  readonly viewMode = signal<ViewMode>('list');

  /**
   * Flag to track if discovery is in progress
   */
  readonly discovering = signal(false);

  constructor() {
    // Subscribe to view mode changes
    this.query.viewMode$
      .pipe(takeUntilDestroyed())
      .subscribe(mode => this.viewMode.set(mode));
  }

  /**
   * Component initialization
   * - Fetches initial route data
   * - Loads coverage statistics
   */
  ngOnInit(): void {
    // Initial data fetch (respects cache)
    this.service.fetchRoutes().subscribe();
  }

  /**
   * Toggle filter sidebar visibility
   * Responsive behavior: auto-close on mobile after filter selection
   */
  toggleFilters(): void {
    this.filtersOpen.update(open => !open);
  }

  /**
   * Handle view mode change from button toggle
   *
   * @param mode - Selected view mode (list, tree, matrix)
   *
   * @remarks
   * - Updates service state
   * - Triggers route tree building if switching to tree view
   * - May trigger navigation to different route outlet
   */
  onViewModeChange(mode: ViewMode): void {
    this.service.setViewMode(mode);
  }

  /**
   * Trigger route discovery operation
   *
   * Scans all NestJS controllers and creates/updates route records
   * with their metadata (controller, handler, method, path).
   *
   * @remarks
   * - Shows loading state during discovery
   * - Displays success/error notifications
   * - Refreshes coverage statistics after completion
   * - Invalidates cache to force data refresh
   *
   * @example
   * ```typescript
   * // Triggered by user clicking "Discover Routes" button
   * this.discover();
   * ```
   */
  discover(): void {
    this.discovering.set(true);

    this.service.discoverRoutes().subscribe({
      next: () => {
        this.discovering.set(false);
        // Refresh coverage after discovery
        this.service.fetchCoverageStats().subscribe();
      },
      error: () => {
        this.discovering.set(false);
      }
    });
  }

  /**
   * Clear all active filters
   *
   * Resets filter state to defaults and triggers data refresh
   */
  clearAllFilters(): void {
    this.service.clearFilters();
  }

  /**
   * Refresh route data
   *
   * Forces a fresh fetch from API, ignoring cache
   */
  refresh(): void {
    this.service.refreshRoutes().subscribe();
  }
}
