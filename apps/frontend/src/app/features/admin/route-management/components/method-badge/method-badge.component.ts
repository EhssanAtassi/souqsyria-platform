import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

import { HttpMethod } from '../../models';

/**
 * MethodBadgeComponent
 *
 * Compact, color-coded badge for displaying HTTP methods.
 * Each method has a semantic color following REST conventions:
 * - GET: Blue (read/query operations)
 * - POST: Green (create operations)
 * - PUT: Orange (update/replace operations)
 * - DELETE: Red (delete operations)
 * - PATCH: Purple (partial update operations)
 *
 * @features
 * - Color-coded by HTTP method semantics
 * - Material chip styling
 * - Inline display
 * - Compact size for tables/lists
 * - High contrast for accessibility
 *
 * @example
 * ```html
 * <app-method-badge [method]="'GET'" />
 * <app-method-badge [method]="route.method" />
 * ```
 *
 * @remarks
 * Component uses host display: inline-block to allow
 * flexible positioning within parent layouts.
 */
@Component({
  selector: 'app-method-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './method-badge.component.html',
  styleUrls: ['./method-badge.component.scss']
})
export class MethodBadgeComponent {
  /**
   * HTTP method to display
   *
   * Required input from parent component
   */
  @Input({ required: true }) method!: HttpMethod;

  /**
   * Optional size variant
   *
   * @default 'medium'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Get CSS class for the method
   *
   * Used to apply color-coding via SCSS
   *
   * @returns CSS class name (e.g., 'method-get')
   *
   * @public
   */
  getMethodClass(): string {
    return `method-${this.method.toLowerCase()}`;
  }

  /**
   * Get size class
   *
   * @returns CSS class for size variant
   *
   * @public
   */
  getSizeClass(): string {
    return `size-${this.size}`;
  }
}
