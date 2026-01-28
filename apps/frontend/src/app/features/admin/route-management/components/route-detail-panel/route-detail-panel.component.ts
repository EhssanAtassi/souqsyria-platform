import { Component, Input, Output, EventEmitter, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { Route, RouteStatus } from '../../models';
import { RouteManagementQuery } from '../../state/route-management.query';
import { MethodBadgeComponent } from '../method-badge/method-badge.component';
import { StatusIndicatorComponent } from '../status-indicator/status-indicator.component';

/**
 * RouteDetailPanelComponent
 *
 * Comprehensive sidebar panel displaying full route details.
 * Opened from parent when user selects a route.
 *
 * @features
 * - Material drawer (side panel)
 * - Full route metadata display
 * - Permission assignment information
 * - AI suggestion display
 * - Action buttons (edit, unlink)
 * - Timestamps and audit info
 * - Responsive behavior
 *
 * @sections
 * - Endpoint: Path, method, badge
 * - Implementation: Controller, handler
 * - Security: Status, permission
 * - AI Suggestion: If unmapped
 * - Metadata: Timestamps
 * - Actions: Edit, unlink buttons
 *
 * @example
 * ```html
 * <app-route-detail-panel
 *   [route]="selectedRoute"
 *   (closed)="onPanelClosed()"
 *   (editMapping)="onEditMapping($event)"
 *   (unlinkPermission)="onUnlinkPermission($event)"
 * />
 * ```
 *
 * @remarks
 * Panel automatically opens when route is set and closes
 * when route is nulled. Emits events for user actions.
 */
@Component({
  selector: 'app-route-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    MethodBadgeComponent,
    StatusIndicatorComponent
  ],
  templateUrl: './route-detail-panel.component.html',
  styleUrls: ['./route-detail-panel.component.scss']
})
export class RouteDetailPanelComponent {
  /**
   * Dependency injection
   */
  private readonly query = inject(RouteManagementQuery);

  /**
   * Drawer reference for programmatic control
   */
  @ViewChild('drawer', { static: false }) drawer!: MatDrawer;

  /**
   * Route to display details for
   *
   * When set, drawer automatically opens
   * When nulled, drawer closes
   */
  @Input() set route(value: Route | null) {
    this._route = value;
    if (value) {
      this.open();
    } else {
      this.close();
    }
  }
  get route(): Route | null {
    return this._route;
  }
  private _route: Route | null = null;

  /**
   * Emitted when panel is closed
   */
  @Output() closed = new EventEmitter<void>();

  /**
   * Emitted when edit mapping is requested
   */
  @Output() editMapping = new EventEmitter<Route>();

  /**
   * Emitted when unlink permission is requested
   */
  @Output() unlinkPermission = new EventEmitter<Route>();

  /**
   * Emitted when AI suggestion should be applied
   */
  @Output() applySuggestion = new EventEmitter<Route>();

  /**
   * Open the drawer panel
   *
   * @public
   */
  open(): void {
    if (this.drawer) {
      this.drawer.open();
    }
  }

  /**
   * Close the drawer panel
   *
   * @public
   */
  close(): void {
    if (this.drawer) {
      this.drawer.close();
    }
    this.closed.emit();
  }

  /**
   * Get route status classification
   *
   * @param route - Route to classify
   * @returns Status enum value
   *
   * @public
   */
  getStatus(route: Route | null): RouteStatus {
    if (!route) {
      return 'unmapped';
    }
    return this.query.getRouteStatus(route);
  }

  /**
   * Get permission name from ID
   *
   * @param permissionId - Permission ID
   * @returns Permission display name
   *
   * @public
   */
  getPermissionName(permissionId: string | null): string {
    if (!permissionId) {
      return 'No Permission';
    }

    // Mock implementation
    // TODO: Integrate with actual permission service
    const mockPermissions: Record<string, string> = {
      '1': 'users:read',
      '2': 'users:write',
      '3': 'users:delete',
      '4': 'roles:read',
      '5': 'roles:write',
      '6': 'permissions:read'
    };

    return mockPermissions[permissionId] || 'Unknown Permission';
  }

  /**
   * Get suggested permission name
   *
   * @returns Suggested permission display name
   *
   * @public
   */
  getSuggestedName(): string {
    if (!this.route?.suggestedPermission) {
      return '';
    }

    return this.route.suggestedPermission;
  }

  /**
   * Handle edit mapping button click
   *
   * @public
   */
  onEditMapping(): void {
    if (this.route) {
      this.editMapping.emit(this.route);
    }
  }

  /**
   * Handle unlink permission button click
   *
   * @public
   */
  onUnlinkPermission(): void {
    if (this.route) {
      this.unlinkPermission.emit(this.route);
    }
  }

  /**
   * Handle apply suggestion button click
   *
   * @public
   */
  onApplySuggestion(): void {
    if (this.route) {
      this.applySuggestion.emit(this.route);
    }
  }

  /**
   * Check if route has permission
   *
   * @returns True if permission is assigned
   *
   * @public
   */
  hasPermission(): boolean {
    return !!this.route?.permissionId;
  }

  /**
   * Check if route is public
   *
   * @returns True if route is public
   *
   * @public
   */
  isPublic(): boolean {
    return this.route?.isPublic === true;
  }

  /**
   * Check if route has AI suggestion
   *
   * @returns True if suggestion exists
   *
   * @public
   */
  hasSuggestion(): boolean {
    return !!this.route?.suggestedPermission && !this.hasPermission();
  }
}
