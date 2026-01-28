/**
 * User Avatar Component
 *
 * @description
 * Displays user avatar with intelligent fallback to initials.
 * Generates consistent colors based on user name.
 *
 * Features:
 * - Image avatar if URL provided
 * - Fallback to initials with generated background color
 * - Three size variants: small, medium, large
 * - Circular shape with Material elevation
 * - Accessible with proper ARIA attributes
 * - Handles loading states and errors
 *
 * @example
 * ```html
 * <!-- With avatar URL -->
 * <app-user-avatar
 *   [user]="{ fullName: 'John Doe', avatarUrl: 'https://...' }"
 *   size="medium">
 * </app-user-avatar>
 *
 * <!-- Without avatar (shows initials) -->
 * <app-user-avatar
 *   [user]="{ fullName: 'Jane Smith' }"
 *   size="large">
 * </app-user-avatar>
 * ```
 */

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

import { getInitials, getAvatarColor } from '../../utils/user.utils';

/**
 * User data for avatar display
 */
export interface AvatarUser {
  /** Full name for initials and tooltip */
  fullName?: string;

  /** Avatar image URL (optional) */
  avatarUrl?: string;

  /** Alternative: first name */
  firstName?: string;

  /** Alternative: last name */
  lastName?: string;
}

/**
 * Avatar size variants
 */
export type AvatarSize = 'small' | 'medium' | 'large';

/**
 * User Avatar Component
 *
 * Standalone component for displaying user avatars with fallback.
 */
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnInit {
  /**
   * User data for avatar
   *
   * @required
   */
  @Input({ required: true }) user!: AvatarUser;

  /**
   * Avatar size variant
   *
   * @default 'medium'
   */
  @Input() size: AvatarSize = 'medium';

  /**
   * Whether to show tooltip on hover
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
   * User initials (computed)
   */
  initials = signal<string>('');

  /**
   * Background color (computed from name)
   */
  backgroundColor = signal<string>('#3f51b5');

  /**
   * Whether image failed to load
   */
  imageError = signal<boolean>(false);

  /**
   * Whether image is loading
   */
  imageLoading = signal<boolean>(true);

  /**
   * Tooltip text (user's full name)
   */
  tooltipText = signal<string>('');

  /**
   * Initialize component
   *
   * @description
   * Computes initials and background color from user data.
   */
  ngOnInit(): void {
    this.computeAvatarData();
  }

  /**
   * Compute avatar data (initials and color)
   *
   * @description
   * Generates initials and consistent background color from user name.
   *
   * @private
   */
  private computeAvatarData(): void {
    // Get full name
    const fullName = this.getFullName();

    // Compute initials
    this.initials.set(getInitials(fullName));

    // Compute background color
    this.backgroundColor.set(getAvatarColor(fullName));

    // Set tooltip text
    this.tooltipText.set(fullName || 'User');
  }

  /**
   * Get full name from user data
   *
   * @description
   * Handles various user data formats.
   *
   * @returns Full name string
   *
   * @private
   */
  private getFullName(): string {
    if (this.user.fullName) {
      return this.user.fullName;
    }

    if (this.user.firstName || this.user.lastName) {
      const firstName = this.user.firstName?.trim() || '';
      const lastName = this.user.lastName?.trim() || '';

      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }

      return firstName || lastName;
    }

    return '';
  }

  /**
   * Handle image load success
   *
   * @description
   * Called when avatar image loads successfully.
   */
  onImageLoad(): void {
    this.imageLoading.set(false);
    this.imageError.set(false);
  }

  /**
   * Handle image load error
   *
   * @description
   * Called when avatar image fails to load.
   * Falls back to initials display.
   */
  onImageError(): void {
    this.imageLoading.set(false);
    this.imageError.set(true);
  }

  /**
   * Check if should show image
   *
   * @description
   * Determines whether to show image or initials.
   *
   * @returns True if image should be displayed
   */
  shouldShowImage(): boolean {
    return !!(
      this.user.avatarUrl &&
      !this.imageError() &&
      this.user.avatarUrl.trim().length > 0
    );
  }

  /**
   * Check if should show initials
   *
   * @description
   * Determines whether to show initials fallback.
   *
   * @returns True if initials should be displayed
   */
  shouldShowInitials(): boolean {
    return !this.shouldShowImage() && !this.imageLoading();
  }

  /**
   * Get avatar size in pixels
   *
   * @description
   * Returns numeric size for various uses.
   *
   * @returns Size in pixels
   */
  getSizeInPixels(): number {
    switch (this.size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      default:
        return 48;
    }
  }

  /**
   * Get font size for initials
   *
   * @description
   * Scales font size based on avatar size.
   *
   * @returns Font size in pixels
   */
  getInitialsFontSize(): number {
    switch (this.size) {
      case 'small':
        return 14;
      case 'medium':
        return 18;
      case 'large':
        return 24;
      default:
        return 18;
    }
  }
}
