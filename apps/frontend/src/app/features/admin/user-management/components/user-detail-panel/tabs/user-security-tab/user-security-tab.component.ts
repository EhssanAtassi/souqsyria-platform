/**
 * User Security Tab Component
 *
 * @description
 * Displays security actions, metrics, and recent security events.
 * Features:
 * - Security action buttons (Ban, Suspend, Reset Password)
 * - Security metrics (failed logins, 2FA status, account age)
 * - Recent security events timeline (last 10)
 * - Permission-based button visibility
 *
 * @module UserManagement/Components/DetailPanel
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-user-security-tab
 *   [user]="selectedUser"
 *   (ban)="onBan($event)"
 *   (suspend)="onSuspend($event)"
 *   (resetPassword)="onResetPassword($event)"
 * />
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UserSecurityTabProps:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/ManagedUser'
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ManagedUser, UserStatus } from '../../../../models/user.model';
import { UserActivity, getSecurityEvents } from '../../../../models/user-activity.model';
import { UserManagementService } from '../../../../state/user-management.service';
import { RelativeTimePipe } from '../../../../pipes/relative-time.pipe';

/**
 * User Security Tab Component Class
 *
 * @description
 * Security management tab for user accounts.
 */
@Component({
  selector: 'app-user-security-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    RelativeTimePipe
  ],
  templateUrl: './user-security-tab.component.html',
  styleUrls: ['./user-security-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSecurityTabComponent implements OnInit {
  /**
   * User Input
   *
   * @description
   * User whose security information will be displayed.
   */
  @Input({ required: true }) user!: ManagedUser;

  /**
   * Ban Event
   *
   * @description
   * Emitted when Ban button is clicked.
   */
  @Output() ban = new EventEmitter<ManagedUser>();

  /**
   * Suspend Event
   *
   * @description
   * Emitted when Suspend button is clicked.
   */
  @Output() suspend = new EventEmitter<ManagedUser>();

  /**
   * Reset Password Event
   *
   * @description
   * Emitted when Reset Password button is clicked.
   */
  @Output() resetPassword = new EventEmitter<ManagedUser>();

  /**
   * User Management Service
   *
   * @description
   * Service for fetching security events.
   */
  private userService = inject(UserManagementService);

  /**
   * Security Events
   *
   * @description
   * Recent security-relevant activities (last 10).
   */
  securityEvents = signal<UserActivity[]>([]);

  /**
   * Loading State
   *
   * @description
   * True while fetching security events.
   */
  loading = signal(false);

  /**
   * Has Security Events
   *
   * @description
   * Computed boolean indicating if any security events exist.
   */
  hasSecurityEvents = computed(() => this.securityEvents().length > 0);

  /**
   * Component Initialization
   *
   * @description
   * Loads recent security events.
   */
  ngOnInit(): void {
    this.loadSecurityEvents();
  }

  /**
   * Load Security Events
   *
   * @description
   * Fetches recent 10 security-relevant events.
   *
   * @private
   */
  private loadSecurityEvents(): void {
    this.loading.set(true);

    // Mock data for now
    // TODO: Implement actual API call
    setTimeout(() => {
      const mockEvents = this.getMockSecurityEvents();
      this.securityEvents.set(mockEvents);
      this.loading.set(false);
    }, 500);

    /*
    this.userService.fetchUserActivity(this.user.id, {
      limit: 10,
      actionType: 'security'
    }).subscribe({
      next: (response) => {
        const securityRelevant = getSecurityEvents(response.items);
        this.securityEvents.set(securityRelevant);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load security events:', error);
        this.loading.set(false);
      }
    });
    */
  }

  /**
   * Get Mock Security Events
   *
   * @description
   * Returns mock security events for testing.
   * TODO: Remove after backend implementation.
   *
   * @private
   * @returns Array of mock security events
   */
  private getMockSecurityEvents(): UserActivity[] {
    const now = new Date();
    return [
      {
        id: 101,
        userId: this.user.id,
        type: 'login',
        description: 'Successful login from new location',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        ipAddress: '192.168.1.100',
        location: { city: 'Damascus', country: 'Syria', countryCode: 'SY' }
      },
      {
        id: 102,
        userId: this.user.id,
        type: 'password_change',
        description: 'Password changed successfully',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 103,
        userId: this.user.id,
        type: 'login_failed',
        description: 'Failed login attempt - invalid password',
        timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.105'
      }
    ];
  }

  /**
   * Handle Ban Action
   *
   * @description
   * Emits ban event when button is clicked.
   */
  onBan(): void {
    this.ban.emit(this.user);
  }

  /**
   * Handle Unban Action
   *
   * @description
   * Emits ban event for unbanning (backend will handle).
   */
  onUnban(): void {
    // TODO: Create separate unban event or handle via ban endpoint
    this.ban.emit(this.user);
  }

  /**
   * Handle Suspend Action
   *
   * @description
   * Emits suspend event when button is clicked.
   */
  onSuspend(): void {
    this.suspend.emit(this.user);
  }

  /**
   * Handle Reset Password Action
   *
   * @description
   * Emits resetPassword event when button is clicked.
   */
  onResetPassword(): void {
    this.resetPassword.emit(this.user);
  }

  /**
   * Is Banned
   *
   * @description
   * Checks if user is currently banned.
   *
   * @returns True if banned
   */
  get isBanned(): boolean {
    return this.user.status === 'banned';
  }

  /**
   * Is Suspended
   *
   * @description
   * Checks if user is currently suspended.
   *
   * @returns True if suspended
   */
  get isSuspended(): boolean {
    return this.user.status === 'suspended';
  }

  /**
   * Account Age Days
   *
   * @description
   * Calculates account age in days.
   *
   * @returns Number of days since creation
   */
  get accountAgeDays(): number {
    const createdAt = new Date(this.user.createdAt);
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Last Password Change
   *
   * @description
   * Returns date of last password change or placeholder.
   * TODO: Add field to user model.
   *
   * @returns Date string or placeholder
   */
  get lastPasswordChange(): string {
    // TODO: Add lastPasswordChange field to ManagedUser model
    return 'Not tracked';
  }

  /**
   * Failed Login Count
   *
   * @description
   * Returns count of recent failed login attempts.
   * TODO: Add field to user model.
   *
   * @returns Number of failed attempts
   */
  get failedLoginCount(): number {
    // TODO: Add failedLoginCount field to ManagedUser model
    return 0;
  }

  /**
   * Two Factor Status
   *
   * @description
   * Returns human-readable 2FA status.
   *
   * @returns Status string
   */
  get twoFactorStatus(): string {
    return this.user.twoFactorEnabled ? 'Enabled' : 'Disabled';
  }

  /**
   * Get Two Factor Color
   *
   * @description
   * Returns chip color based on 2FA status.
   *
   * @returns 'accent' or 'warn'
   */
  get twoFactorColor(): 'accent' | 'warn' {
    return this.user.twoFactorEnabled ? 'accent' : 'warn';
  }

  /**
   * Get Event Icon
   *
   * @description
   * Returns Material icon for security event type.
   *
   * @param event - Security event
   * @returns Icon name
   */
  getEventIcon(event: UserActivity): string {
    const icons: Record<string, string> = {
      login: 'login',
      login_failed: 'error_outline',
      password_change: 'lock_reset',
      two_factor_enabled: 'security',
      email_change: 'email',
      phone_change: 'phone'
    };
    return icons[event.type] || 'info';
  }

  /**
   * Get Event Color
   *
   * @description
   * Returns color for security event.
   *
   * @param event - Security event
   * @returns Color hex code
   */
  getEventColor(event: UserActivity): string {
    const colors: Record<string, string> = {
      login: '#4caf50',
      login_failed: '#f44336',
      password_change: '#ff9800',
      two_factor_enabled: '#4caf50',
      email_change: '#ff9800',
      phone_change: '#ff9800'
    };
    return colors[event.type] || '#9e9e9e';
  }
}
