import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ThemePalette } from '@angular/material/core';

import { RouteStatus } from '../../models';

/**
 * StatusIndicatorComponent
 *
 * Visual status indicator for route mapping state.
 * Displays icon and label with color-coding:
 * - Mapped: Blue check icon - route has permission
 * - Unmapped: Red cancel icon - no permission assigned
 * - Public: Amber public icon - publicly accessible
 *
 * @features
 * - Color-coded icons
 * - Material Design icons
 * - Semantic labeling
 * - Inline or block layout
 * - Accessibility-friendly
 *
 * @example
 * ```html
 * <app-status-indicator [status]="'mapped'" />
 * <app-status-indicator [status]="getStatus(route)" />
 * ```
 *
 * @remarks
 * Status is derived from route properties:
 * - isPublic = true → 'public'
 * - permissionId exists → 'mapped'
 * - else → 'unmapped'
 */
@Component({
  selector: 'app-status-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './status-indicator.component.html',
  styleUrls: ['./status-indicator.component.scss']
})
export class StatusIndicatorComponent {
  /**
   * Route status to display
   *
   * Required input from parent component
   */
  @Input({ required: true }) status!: RouteStatus;

  /**
   * Optional compact mode (icon only, no label)
   *
   * @default false
   */
  @Input() compact = false;

  /**
   * Get Material icon name for status
   *
   * @returns Icon name from Material Icons font
   *
   * @public
   */
  getIcon(): string {
    switch (this.status) {
      case 'mapped':
        return 'check_circle';
      case 'unmapped':
        return 'cancel';
      case 'public':
        return 'public';
      default:
        return 'help';
    }
  }

  /**
   * Get Material theme color for status
   *
   * @returns Material palette color or undefined for default
   *
   * @public
   */
  getColor(): ThemePalette {
    switch (this.status) {
      case 'mapped':
        return 'primary';
      case 'unmapped':
        return 'warn';
      case 'public':
        return 'accent';
      default:
        return undefined;
    }
  }

  /**
   * Get human-readable label for status
   *
   * Capitalizes first letter of status
   *
   * @returns Display label
   *
   * @public
   */
  getLabel(): string {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1);
  }

  /**
   * Get CSS class for status
   *
   * Used for custom styling beyond Material theme colors
   *
   * @returns CSS class name (e.g., 'status-mapped')
   *
   * @public
   */
  getStatusClass(): string {
    return `status-${this.status}`;
  }

  /**
   * Get ARIA label for accessibility
   *
   * @returns Descriptive label for screen readers
   *
   * @public
   */
  getAriaLabel(): string {
    switch (this.status) {
      case 'mapped':
        return 'Route is mapped to a permission';
      case 'unmapped':
        return 'Route is not mapped to any permission';
      case 'public':
        return 'Route is publicly accessible';
      default:
        return 'Route status unknown';
    }
  }
}
