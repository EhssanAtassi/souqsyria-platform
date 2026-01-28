import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { Route, RouteStatus } from '../../models/route.model';
import { RouteManagementQuery } from '../../state/route-management.query';
import { MethodBadgeComponent } from '../../components/method-badge/method-badge.component';
import { StatusIndicatorComponent } from '../../components/status-indicator/status-indicator.component';

/**
 * Input data for Route Detail Dialog
 */
export interface RouteDetailDialogData {
  /**
   * Route to display details for
   */
  route: Route;
}

/**
 * Actions that can be performed from the dialog
 */
export type RouteDetailDialogAction = 'edit' | 'applySuggestion' | 'unlink';

/**
 * Result returned when dialog is closed with an action
 */
export interface RouteDetailDialogResult {
  /**
   * Action performed
   */
  action: RouteDetailDialogAction;

  /**
   * Route that was acted upon
   */
  route: Route;
}

/**
 * RouteDetailDialogComponent
 *
 * Full-screen responsive dialog displaying comprehensive route details.
 * Alternative to the side panel for mobile/tablet devices or when
 * a modal presentation is preferred.
 *
 * Features:
 * - Complete route metadata display
 * - HTTP method and path information
 * - Controller and handler details
 * - Security status and permission info
 * - AI suggestion display (if applicable)
 * - Timestamps and audit information
 * - Action buttons (edit, apply suggestion, unlink)
 * - Responsive design (full-screen on mobile)
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(RouteDetailDialogComponent, {
 *   width: '600px',
 *   maxHeight: '90vh',
 *   data: { route: selectedRoute }
 * });
 *
 * dialogRef.afterClosed().subscribe((result: RouteDetailDialogResult) => {
 *   if (result) {
 *     switch (result.action) {
 *       case 'edit':
 *         // Handle edit mapping
 *         break;
 *       case 'applySuggestion':
 *         // Handle apply suggestion
 *         break;
 *       case 'unlink':
 *         // Handle unlink permission
 *         break;
 *     }
 *   }
 * });
 * ```
 *
 * @remarks
 * On mobile devices (<600px), the dialog automatically becomes full-screen
 * for better usability. Use MatDialog configuration to control this behavior.
 */
@Component({
  selector: 'app-route-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MethodBadgeComponent,
    StatusIndicatorComponent
  ],
  templateUrl: './route-detail-dialog.component.html',
  styleUrls: ['./route-detail-dialog.component.scss']
})
export class RouteDetailDialogComponent {
  /**
   * Injected query service for route operations
   */
  private readonly query = inject(RouteManagementQuery);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RouteDetailDialogData,
    private dialogRef: MatDialogRef<
      RouteDetailDialogComponent,
      RouteDetailDialogResult
    >
  ) {}

  /**
   * Gets the route status classification
   *
   * @param route - Route to classify
   * @returns Status enum value
   */
  getStatus(route: Route): RouteStatus {
    return this.query.getRouteStatus(route);
  }

  /**
   * Gets the permission name from ID
   * In production, this would query the permission service
   *
   * @param permissionId - Permission identifier
   * @returns Permission display name
   */
  getPermissionName(permissionId: string | null): string {
    if (!permissionId) {
      return 'No Permission';
    }

    // Mock implementation
    // TODO: Integrate with actual permission service or get from route.permission
    const mockPermissions: Record<string, string> = {
      '1': 'users:read',
      '2': 'users:write',
      '3': 'users:delete',
      '4': 'roles:read',
      '5': 'roles:write',
      '6': 'permissions:read',
      '7': 'routes:read',
      '8': 'routes:write'
    };

    return mockPermissions[permissionId] || 'Unknown Permission';
  }

  /**
   * Gets the suggested permission name
   *
   * @returns Suggested permission display name
   */
  getSuggestedName(): string {
    return this.data.route.suggestedPermission || '';
  }

  /**
   * Checks if route has an assigned permission
   *
   * @returns True if permission is assigned
   */
  hasPermission(): boolean {
    return !!this.data.route.permissionId;
  }

  /**
   * Checks if route is publicly accessible
   *
   * @returns True if route is public
   */
  isPublic(): boolean {
    return this.data.route.isPublic === true;
  }

  /**
   * Checks if route has an AI-generated suggestion
   *
   * @returns True if suggestion exists and route is unmapped
   */
  hasSuggestion(): boolean {
    return !!this.data.route.suggestedPermission && !this.hasPermission();
  }

  /**
   * Handles edit mapping action
   * Closes dialog and returns edit action result
   */
  editMapping(): void {
    const result: RouteDetailDialogResult = {
      action: 'edit',
      route: this.data.route
    };
    this.dialogRef.close(result);
  }

  /**
   * Handles apply AI suggestion action
   * Closes dialog and returns applySuggestion action result
   */
  applySuggestion(): void {
    const result: RouteDetailDialogResult = {
      action: 'applySuggestion',
      route: this.data.route
    };
    this.dialogRef.close(result);
  }

  /**
   * Handles unlink permission action
   * Closes dialog and returns unlink action result
   */
  unlinkPermission(): void {
    const result: RouteDetailDialogResult = {
      action: 'unlink',
      route: this.data.route
    };
    this.dialogRef.close(result);
  }

  /**
   * Handles close/cancel action
   * Closes dialog without returning data
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Gets the status badge label
   *
   * @param status - Route status
   * @returns Display label for status
   */
  getStatusLabel(status: RouteStatus): string {
    const labels: Record<RouteStatus, string> = {
      mapped: 'Mapped',
      unmapped: 'Unmapped',
      public: 'Public'
    };
    return labels[status];
  }

  /**
   * Gets the status badge color
   *
   * @param status - Route status
   * @returns Material color for chip
   */
  getStatusColor(status: RouteStatus): 'primary' | 'accent' | 'warn' {
    const colors: Record<RouteStatus, 'primary' | 'accent' | 'warn'> = {
      mapped: 'primary',
      unmapped: 'warn',
      public: 'accent'
    };
    return colors[status];
  }
}
