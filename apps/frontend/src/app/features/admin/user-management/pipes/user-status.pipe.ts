/**
 * User Status Pipe
 *
 * @description
 * Transforms UserStatus enum to human-readable display text.
 * Uses configuration from constants for consistent labeling.
 *
 * @example
 * ```html
 * <!-- In template -->
 * <span>{{ user.status | userStatus }}</span>
 * <!-- Outputs: "Active", "Banned", etc. -->
 * ```
 */

import { Pipe, PipeTransform } from '@angular/core';
import { UserStatus } from '../models';
import { STATUS_CONFIGS } from '../constants';

/**
 * User Status Pipe
 *
 * Transforms status enum to display label.
 */
@Pipe({
  name: 'userStatus',
  standalone: true,
})
export class UserStatusPipe implements PipeTransform {
  /**
   * Transform status to display text
   *
   * @param value - UserStatus enum value
   * @returns Display label
   *
   * @example
   * ```typescript
   * transform('active')    // "Active"
   * transform('banned')    // "Banned"
   * transform('suspended') // "Suspended"
   * ```
   */
  transform(value: UserStatus | null | undefined): string {
    if (!value) {
      return '-';
    }

    const config = STATUS_CONFIGS[value];

    if (config) {
      return config.label;
    }

    // Fallback: capitalize first letter
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
