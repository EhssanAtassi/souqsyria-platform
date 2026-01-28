/**
 * User Profile Tab Component
 *
 * @description
 * Displays user's personal information and account details in read-only format.
 * Shows two main sections:
 * - Personal Information: Name, email, phone, address
 * - Account Information: Registration date, last login, account ID
 *
 * Features:
 * - Read-only data display with Material List
 * - Icons for visual clarity
 * - Relative time formatting for dates
 * - Empty state handling
 * - Edit action (propagates to parent)
 *
 * @module UserManagement/Components/DetailPanel
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-user-profile-tab
 *   [user]="selectedUser"
 *   (edit)="onEditUser($event)"
 * />
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UserProfileTabProps:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/ManagedUser'
 *           description: User to display profile for
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { ManagedUser } from '../../../../models/user.model';
import { RelativeTimePipe } from '../../../../pipes/relative-time.pipe';

/**
 * User Profile Tab Component Class
 *
 * @description
 * Presentational component for displaying user profile information.
 */
@Component({
  selector: 'app-user-profile-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RelativeTimePipe
  ],
  templateUrl: './user-profile-tab.component.html',
  styleUrls: ['./user-profile-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileTabComponent {
  /**
   * User Input
   *
   * @description
   * User whose profile information will be displayed.
   * All fields are read-only in this view.
   */
  @Input({ required: true }) user!: ManagedUser;

  /**
   * Edit Event
   *
   * @description
   * Emitted when user clicks the Edit button.
   * Parent component handles the actual edit flow.
   */
  @Output() edit = new EventEmitter<ManagedUser>();

  /**
   * Handle Edit Action
   *
   * @description
   * Emits edit event with current user when Edit button is clicked.
   */
  onEdit(): void {
    this.edit.emit(this.user);
  }

  /**
   * Get Full Name
   *
   * @description
   * Returns user's full name, falling back to first + last name.
   *
   * @returns Full name string
   */
  get fullName(): string {
    return this.user.fullName || `${this.user.firstName} ${this.user.lastName}`;
  }

  /**
   * Get Address
   *
   * @description
   * Returns formatted address or placeholder if not available.
   *
   * @returns Address string or 'Not provided'
   */
  get address(): string {
    // TODO: Add address field to user model
    return 'Not provided';
  }

  /**
   * Get Phone
   *
   * @description
   * Returns phone number or placeholder if not available.
   *
   * @returns Phone string or 'Not provided'
   */
  get phone(): string {
    return this.user.phone || 'Not provided';
  }

  /**
   * Get Account Age
   *
   * @description
   * Calculates account age in days.
   *
   * @returns Number of days since account creation
   */
  get accountAgeDays(): number {
    const createdAt = new Date(this.user.createdAt);
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
