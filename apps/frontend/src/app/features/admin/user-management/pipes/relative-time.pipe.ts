/**
 * Relative Time Pipe
 *
 * @description
 * Transforms dates to relative time strings ("5 minutes ago", "2 hours ago", etc.).
 * Automatically updates every minute for accurate display.
 *
 * @example
 * ```html
 * <!-- In template -->
 * <span>{{ user.lastLoginAt | relativeTime }}</span>
 * <!-- Outputs: "5 minutes ago", "2 hours ago", "Just now", etc. -->
 *
 * <span>{{ user.createdAt | relativeTime }}</span>
 * <!-- Outputs: "3 days ago", "Jan 15, 2024", etc. -->
 * ```
 */

import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { formatTimeAgo } from '../utils/user.utils';

/**
 * Relative Time Pipe
 *
 * Transforms Date to relative time string.
 * Pure pipe for performance (no automatic change detection).
 */
@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: true, // Pure pipe for better performance
})
export class RelativeTimePipe implements PipeTransform {
  /**
   * Transform date to relative time
   *
   * @param value - Date to transform
   * @returns Relative time string
   *
   * @example
   * ```typescript
   * transform(new Date())                    // "Just now"
   * transform(new Date(Date.now() - 300000)) // "5 minutes ago"
   * transform(new Date(Date.now() - 7200000))// "2 hours ago"
   * transform(null)                          // "Never"
   * ```
   */
  transform(value: Date | string | null | undefined): string {
    if (!value) {
      return 'Never';
    }

    // Convert string to Date if needed
    const date = typeof value === 'string' ? new Date(value) : value;

    // Use utility function
    return formatTimeAgo(date);
  }
}

/**
 * Relative Time Pipe with Auto-Update
 *
 * @description
 * Similar to RelativeTimePipe but updates automatically every minute.
 * Use this for timestamps that should stay current (like "last seen").
 *
 * Note: This is an impure pipe, so use sparingly as it impacts performance.
 *
 * @example
 * ```html
 * <span>{{ user.lastLoginAt | relativeTimeLive }}</span>
 * <!-- Auto-updates every minute -->
 * ```
 */
@Pipe({
  name: 'relativeTimeLive',
  standalone: true,
  pure: false, // Impure to trigger change detection
})
export class RelativeTimeLivePipe implements PipeTransform, OnDestroy {
  private timer: any;
  private lastValue: string = '';
  private lastDate: Date | null = null;

  /**
   * Transform date to relative time with auto-update
   *
   * @param value - Date to transform
   * @returns Relative time string
   */
  transform(value: Date | string | null | undefined): string {
    if (!value) {
      this.cleanup();
      return 'Never';
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    // Check if date changed
    if (this.lastDate?.getTime() !== date.getTime()) {
      this.lastDate = date;
      this.setupTimer();
    }

    this.lastValue = formatTimeAgo(date);
    return this.lastValue;
  }

  /**
   * Setup timer for auto-update
   *
   * @description
   * Updates every 60 seconds.
   *
   * @private
   */
  private setupTimer(): void {
    this.cleanup();

    // Update every minute
    this.timer = setInterval(() => {
      if (this.lastDate) {
        this.lastValue = formatTimeAgo(this.lastDate);
      }
    }, 60000); // 60 seconds
  }

  /**
   * Cleanup timer
   *
   * @private
   */
  private cleanup(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Component destruction cleanup
   */
  ngOnDestroy(): void {
    this.cleanup();
  }
}
