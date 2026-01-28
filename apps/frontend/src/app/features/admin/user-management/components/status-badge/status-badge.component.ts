/**
 * Status Badge Component
 *
 * @description
 * Displays user account status as a colored badge with icon.
 * Uses Material Design chips with consistent color coding.
 *
 * Features:
 * - Color-coded badges (green=active, red=banned, orange=suspended, etc.)
 * - Material icons for visual identification
 * - Tooltip with full status description
 * - Uppercase text for emphasis
 * - Accessible with ARIA attributes
 *
 * @example
 * ```html
 * <app-status-badge [status]="'active'"></app-status-badge>
 * <app-status-badge [status]="'banned'" [showIcon]="true"></app-status-badge>
 * ```
 */

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserStatus } from '../../models';
import { STATUS_CONFIGS, StatusConfig } from '../../constants';

/**
 * Status Badge Component
 *
 * Standalone component for displaying user status badges.
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule, MatTooltipModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent implements OnInit {
  /**
   * User status to display
   *
   * @required
   */
  @Input({ required: true }) status!: UserStatus;

  /**
   * Whether to show icon
   *
   * @default true
   */
  @Input() showIcon = true;

  /**
   * Whether to show tooltip
   *
   * @default true
   */
  @Input() showTooltip = true;

  /**
   * Custom CSS class
   *
   * @optional
   */
  @Input() customClass = '';

  /**
   * Status configuration (computed from status input)
   */
  statusConfig = signal<StatusConfig | null>(null);

  /**
   * Badge label (computed)
   */
  label = computed(() => this.statusConfig()?.label || this.status);

  /**
   * Badge icon (computed)
   */
  icon = computed(() => this.statusConfig()?.icon || 'info');

  /**
   * Badge color (computed)
   */
  color = computed(() => this.statusConfig()?.color || '#9e9e9e');

  /**
   * Background color (computed)
   */
  backgroundColor = computed(
    () => this.statusConfig()?.backgroundColor || '#f5f5f5'
  );

  /**
   * Tooltip text (computed)
   */
  tooltipText = computed(() => this.statusConfig()?.tooltip || this.status);

  /**
   * Initialize component
   *
   * @description
   * Loads status configuration.
   */
  ngOnInit(): void {
    this.loadStatusConfig();
  }

  /**
   * Load status configuration
   *
   * @description
   * Fetches configuration for the current status.
   *
   * @private
   */
  private loadStatusConfig(): void {
    if (this.status && STATUS_CONFIGS[this.status]) {
      this.statusConfig.set(STATUS_CONFIGS[this.status]);
    } else {
      // Fallback config for unknown status
      this.statusConfig.set({
        value: this.status,
        label: this.status.charAt(0).toUpperCase() + this.status.slice(1),
        icon: 'info',
        color: '#9e9e9e',
        backgroundColor: '#f5f5f5',
        actionable: false,
        tooltip: `Status: ${this.status}`,
      });
    }
  }

  /**
   * Get CSS class for status
   *
   * @description
   * Returns a CSS class name based on status for styling.
   *
   * @returns CSS class name
   */
  getStatusClass(): string {
    return `status-${this.status}`;
  }

  /**
   * Check if status is actionable
   *
   * @description
   * Determines if the status can be changed/acted upon.
   *
   * @returns True if status is actionable
   */
  isActionable(): boolean {
    return this.statusConfig()?.actionable || false;
  }
}
