/**
 * Role Display Pipe
 *
 * @description
 * Transforms role enum values to human-readable display text.
 * Supports both business roles and admin roles.
 *
 * @example
 * ```html
 * <!-- In template -->
 * <span>{{ user.businessRole | roleDisplay }}</span>
 * <!-- Outputs: "Customer", "Seller", "Admin" -->
 *
 * <span>{{ user.adminRole | roleDisplay }}</span>
 * <!-- Outputs: "Super Admin", "Moderator", etc. -->
 * ```
 */

import { Pipe, PipeTransform } from '@angular/core';
import { BusinessRole, AdminRole } from '../models';
import {
  getBusinessRoleConfig,
  getAdminRoleConfig,
} from '../constants';

/**
 * Role Display Pipe
 *
 * Transforms role enum to display label.
 */
@Pipe({
  name: 'roleDisplay',
  standalone: true,
})
export class RoleDisplayPipe implements PipeTransform {
  /**
   * Transform role to display text
   *
   * @param value - BusinessRole or AdminRole enum value
   * @param type - Optional type hint ('business' or 'admin')
   * @returns Display label
   *
   * @example
   * ```typescript
   * transform('customer')        // "Customer"
   * transform('seller')          // "Seller"
   * transform('super_admin')     // "Super Admin"
   * transform(null)              // "-"
   * ```
   */
  transform(
    value: BusinessRole | AdminRole | null | undefined,
    type?: 'business' | 'admin'
  ): string {
    if (!value) {
      return '-';
    }

    // Try business role first if type specified or value looks like business role
    if (type === 'business' || ['customer', 'seller', 'admin'].includes(value)) {
      const config = getBusinessRoleConfig(value as BusinessRole);
      if (config) {
        return config.label;
      }
    }

    // Try admin role if type specified or value looks like admin role
    if (type === 'admin' || value !== 'customer' && value !== 'seller') {
      const config = getAdminRoleConfig(value as AdminRole);
      if (config) {
        return config.label;
      }
    }

    // Fallback: format the value
    return this.formatRoleValue(value);
  }

  /**
   * Format role value as fallback
   *
   * @description
   * Converts snake_case or camelCase to Title Case.
   *
   * @param value - Role string value
   * @returns Formatted string
   *
   * @private
   *
   * @example
   * ```typescript
   * formatRoleValue('super_admin')     // "Super Admin"
   * formatRoleValue('customerService') // "Customer Service"
   * ```
   */
  private formatRoleValue(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
