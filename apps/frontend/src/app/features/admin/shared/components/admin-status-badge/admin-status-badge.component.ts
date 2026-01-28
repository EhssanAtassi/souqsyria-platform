/**
 * @file admin-status-badge.component.ts
 * @description Reusable status badge component for displaying status indicators.
 *              Supports various status types for orders, users, vendors, and products.
 * @module AdminDashboard/SharedComponents
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

/**
 * Status variant type
 * @description Visual variant for the badge appearance
 */
export type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Badge size options
 * @description Controls the size of the badge
 */
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Status mapping type
 * @description Maps status strings to their visual variants
 */
export type StatusMapping = Record<string, StatusVariant>;

/**
 * Predefined status mappings
 * @description Maps common status strings to their visual variants
 */
const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
  // Order statuses
  pending: 'warning',
  pending_payment: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  in_transit: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  refunded: 'danger',
  failed: 'danger',
  returned: 'danger',

  // User statuses
  active: 'success',
  inactive: 'neutral',
  suspended: 'warning',
  banned: 'danger',
  pending_verification: 'warning',
  verified: 'success',

  // Vendor statuses
  approved: 'success',
  rejected: 'danger',
  under_review: 'info',
  documents_requested: 'warning',
  documents_submitted: 'info',
  verification_pending: 'warning',
  on_hold: 'warning',
  expired: 'danger',

  // Product statuses
  draft: 'neutral',
  pending_approval: 'warning',
  published: 'success',
  out_of_stock: 'danger',
  low_stock: 'warning',
  discontinued: 'neutral',
  featured: 'info',

  // Payment statuses
  paid: 'success',
  unpaid: 'danger',
  partial: 'warning',
  refund_pending: 'warning',

  // General
  enabled: 'success',
  disabled: 'neutral',
  yes: 'success',
  no: 'danger',
  true: 'success',
  false: 'danger'
};

/**
 * Admin Status Badge Component
 * @description A versatile badge component for displaying status indicators
 *              with automatic color mapping based on status type.
 *
 * @example
 * ```html
 * <!-- Auto-detected variant based on status -->
 * <app-admin-status-badge status="approved" />
 *
 * <!-- Manual variant override -->
 * <app-admin-status-badge status="Custom Status" variant="info" />
 *
 * <!-- With custom label -->
 * <app-admin-status-badge status="pending" label="Awaiting Review" />
 *
 * <!-- With dot indicator -->
 * <app-admin-status-badge status="active" [showDot]="true" />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-admin-status-badge',
  templateUrl: './admin-status-badge.component.html',
  styleUrls: ['./admin-status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgIf]
})
export class AdminStatusBadgeComponent {
  /**
   * Status value
   * @description The status string (e.g., 'pending', 'approved', 'active')
   */
  readonly status = input.required<string>();

  /**
   * Display label
   * @description Optional custom label to display instead of formatted status
   */
  readonly label = input<string>('');

  /**
   * Visual variant
   * @description Override the automatic variant detection
   */
  readonly variant = input<StatusVariant | ''>('');

  /**
   * Badge size
   * @description Controls the size of the badge
   * @default 'sm'
   */
  readonly size = input<BadgeSize>('sm');

  /**
   * Show dot indicator
   * @description Whether to show a colored dot before the text
   * @default false
   */
  readonly showDot = input<boolean>(false);

  /**
   * Pill style
   * @description Use pill (fully rounded) style instead of default rounded
   * @default true
   */
  readonly pill = input<boolean>(true);

  /**
   * Uppercase text
   * @description Whether to uppercase the label text
   * @default false
   */
  readonly uppercase = input<boolean>(false);

  /**
   * Computed variant
   * @description Determines the visual variant based on status or manual override
   */
  readonly computedVariant = computed((): StatusVariant => {
    const manualVariant = this.variant();
    if (manualVariant) {
      return manualVariant;
    }

    const statusKey = this.normalizeStatus(this.status());
    return STATUS_VARIANT_MAP[statusKey] || 'default';
  });

  /**
   * Display label
   * @description The text to display in the badge
   */
  readonly displayLabel = computed((): string => {
    const customLabel = this.label();
    if (customLabel) {
      return customLabel;
    }
    return this.formatStatus(this.status());
  });

  /**
   * Badge CSS classes
   * @description Combined CSS classes for the badge element
   */
  readonly badgeClasses = computed(() => {
    const variant = this.computedVariant();
    const size = this.size();
    const isPill = this.pill();
    const isUppercase = this.uppercase();

    return {
      [`status-badge--${variant}`]: true,
      [`status-badge--${size}`]: true,
      'status-badge--pill': isPill,
      'status-badge--uppercase': isUppercase
    };
  });

  /**
   * Normalize status string for lookup
   * @param status - Raw status string
   * @returns Normalized status key
   */
  private normalizeStatus(status: string): string {
    return status
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Format status for display
   * @param status - Raw status string
   * @returns Human-readable formatted status
   */
  private formatStatus(status: string): string {
    return status
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
