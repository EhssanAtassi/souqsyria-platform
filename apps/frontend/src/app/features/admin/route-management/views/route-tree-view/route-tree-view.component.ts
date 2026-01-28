import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeModule,
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RouteManagementService } from '../../state/route-management.service';
import { RouteManagementQuery } from '../../state/route-management.query';
import { Route, RouteStatus, RouteTreeNode } from '../../models';
import { MethodBadgeComponent } from '../../components/method-badge/method-badge.component';
import { StatusIndicatorComponent } from '../../components/status-indicator/status-indicator.component';

/**
 * Flattened tree node for Material Tree
 */
interface FlatTreeNode {
  expandable: boolean;
  name: string;
  level: number;
  type: 'controller' | 'route';
  data: ControllerNode | RouteNodeData;
}

/**
 * Controller node data
 */
interface ControllerNode {
  controller: string;
  routeCount: number;
  mappedCount: number;
  coveragePercentage: number;
}

/**
 * Route node data
 */
interface RouteNodeData {
  route: Route;
}

/**
 * Route Tree View Component
 *
 * Hierarchical tree view displaying routes grouped by controller.
 * Features:
 * - Expandable/collapsible controller nodes
 * - Coverage percentage per controller
 * - Visual progress bars
 * - Nested route display
 * - Quick actions per route
 *
 * @example
 * ```html
 * <app-route-tree-view></app-route-tree-view>
 * ```
 */
@Component({
  selector: 'app-route-tree-view',
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MethodBadgeComponent,
    StatusIndicatorComponent,
  ],
  templateUrl: './route-tree-view.component.html',
  styleUrls: ['./route-tree-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteTreeViewComponent implements OnInit {
  private readonly routeService = inject(RouteManagementService);
  private readonly routeQuery = inject(RouteManagementQuery);

  /**
   * Tree control for expansion/collapse
   */
  readonly treeControl = new FlatTreeControl<FlatTreeNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  /**
   * Tree flattener configuration
   */
  private readonly treeFlattener = new MatTreeFlattener<
    RouteTreeNode,
    FlatTreeNode
  >(
    this.transformer.bind(this),
    (node) => node.level,
    (node) => node.expandable,
    (node) => ('children' in node ? node.children : [])
  );

  /**
   * Tree data source
   */
  readonly dataSource = new MatTreeFlatDataSource(
    this.treeControl,
    this.treeFlattener
  );

  /**
   * Observable state
   */
  readonly routeTree$ = this.routeQuery.routeTree$;
  readonly loading$ = this.routeQuery.loading$;

  /**
   * Permission lookup map
   */
  private permissionMap = signal<Map<string, string>>(new Map());

  constructor() {
    // Subscribe to tree data
    this.routeTree$.pipe(takeUntilDestroyed()).subscribe((tree) => {
      this.dataSource.data = tree || [];
    });
  }

  ngOnInit(): void {
    // Build tree structure
    this.routeService.buildRouteTree().subscribe();
  }

  /**
   * Transform tree node to flat node
   *
   * @param node - Original tree node
   * @param level - Tree level
   * @returns Flattened node
   */
  private transformer(node: RouteTreeNode, level: number): FlatTreeNode {
    if (node.type === 'controller' && node.controller) {
      // Controller node
      return {
        expandable: true,
        name: node.controller,
        level,
        type: 'controller',
        data: {
          controller: node.controller,
          routeCount: node.routeCount || 0,
          mappedCount: node.mappedCount || 0,
          coveragePercentage: node.coveragePercentage || 0,
        },
      };
    } else if (node.type === 'route' && node.route) {
      // Route node
      return {
        expandable: false,
        name: node.route.path,
        level,
        type: 'route',
        data: {
          route: node.route,
        },
      };
    }

    // Fallback for invalid nodes
    return {
      expandable: false,
      name: 'Unknown',
      level,
      type: 'route',
      data: {} as any,
    };
  }

  /**
   * Check if node is a controller node
   *
   * @param _ - Index (unused)
   * @param node - Tree node
   * @returns True if controller node
   */
  isControllerNode(_: number, node: FlatTreeNode): boolean {
    return node.type === 'controller';
  }

  /**
   * Check if node is a route node
   *
   * @param _ - Index (unused)
   * @param node - Tree node
   * @returns True if route node
   */
  isRouteNode(_: number, node: FlatTreeNode): boolean {
    return node.type === 'route';
  }

  /**
   * Expand all tree nodes
   */
  expandAll(): void {
    this.treeControl.expandAll();
  }

  /**
   * Collapse all tree nodes
   */
  collapseAll(): void {
    this.treeControl.collapseAll();
  }

  /**
   * Select route and open detail panel
   *
   * @param route - Route to select
   */
  selectRoute(route: Route): void {
    this.routeService.selectRoute(route.id);
  }

  /**
   * View route details
   *
   * @param route - Route to view
   */
  viewDetails(route: Route): void {
    this.routeService.selectRoute(route.id);
  }

  /**
   * Edit route mapping
   *
   * @param route - Route to edit
   */
  editMapping(route: Route): void {
    this.routeService.selectRoute(route.id);
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
    return 'unmapped';
  }

  /**
   * Get permission name by ID
   *
   * @param permissionId - Permission identifier (can be null)
   * @returns Permission name or 'Unknown'
   */
  getPermissionName(permissionId: string | null): string {
    if (!permissionId) return 'Unknown Permission';
    return this.permissionMap().get(permissionId) || 'Unknown Permission';
  }

  /**
   * Get progress bar color based on coverage percentage
   *
   * @param percentage - Coverage percentage
   * @returns Material color theme
   */
  getCoverageColor(percentage: number): 'primary' | 'accent' | 'warn' {
    if (percentage >= 80) {
      return 'primary';
    } else if (percentage >= 50) {
      return 'accent';
    } else {
      return 'warn';
    }
  }

  /**
   * Get controller node data
   *
   * @param node - Flat tree node
   * @returns Controller node data
   */
  getControllerData(node: FlatTreeNode): ControllerNode {
    return node.data as ControllerNode;
  }

  /**
   * Get route node data
   *
   * @param node - Flat tree node
   * @returns Route node data
   */
  getRouteData(node: FlatTreeNode): RouteNodeData {
    return node.data as RouteNodeData;
  }

  /**
   * TrackBy function for tree nodes
   *
   * @param index - Node index
   * @param node - Tree node
   * @returns Unique identifier
   */
  trackByNode(index: number, node: FlatTreeNode): string {
    return `${node.type}-${node.name}-${node.level}`;
  }
}
