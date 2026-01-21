/**
 * @file settings-hub.component.ts
 * @description Settings hub/landing page component for system configuration.
 *              Provides navigation cards to all settings sections.
 * @module AdminDashboard/Settings
 */

import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { SettingsService } from '../../services/settings.service';
import { GeneralSettings } from '../../interfaces/settings.interface';

/**
 * Settings section configuration
 * @description Configuration for settings navigation cards
 */
interface SettingsSection {
  /** Section title */
  title: string;

  /** Section description */
  description: string;

  /** Material icon name */
  icon: string;

  /** Route path */
  route: string;

  /** Required role to access */
  requiredRole: string[];

  /** Color theme for the card */
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'teal';

  /** Quick stats to display (optional) */
  stats?: { label: string; value: string }[];
}

/**
 * Settings Hub Component
 * @description Main navigation page for system configuration settings
 *
 * @example
 * ```html
 * <app-settings-hub></app-settings-hub>
 * ```
 *
 * @features
 * - Navigation cards to all settings sections
 * - Quick overview of current configuration
 * - Role-based access indicators
 * - Platform status display
 */
@Component({
  standalone: true,
  selector: 'app-settings-hub',
  imports: [CommonModule, RouterLink],
  templateUrl: './settings-hub.component.html',
  styleUrls: ['./settings-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsHubComponent implements OnInit {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  /** Settings service for API calls */
  private readonly settingsService = inject(SettingsService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** General settings for quick overview */
  readonly generalSettings = signal<GeneralSettings | null>(null);

  /** Settings sections for navigation */
  readonly sections: SettingsSection[] = [
    {
      title: 'General Settings',
      description: 'Platform name, currencies, languages, and contact information',
      icon: 'settings',
      route: '/admin/settings/general',
      requiredRole: ['super_admin', 'admin'],
      color: 'blue'
    },
    {
      title: 'Role Management',
      description: 'Admin roles, permissions, and access control policies',
      icon: 'admin_panel_settings',
      route: '/admin/settings/roles',
      requiredRole: ['super_admin'],
      color: 'purple'
    },
    {
      title: 'Audit Log',
      description: 'Track administrative actions and security events',
      icon: 'history',
      route: '/admin/settings/audit-log',
      requiredRole: ['super_admin', 'admin'],
      color: 'green'
    },
    {
      title: 'Feature Flags',
      description: 'Control feature rollouts and experimental features',
      icon: 'flag',
      route: '/admin/settings/feature-flags',
      requiredRole: ['super_admin'],
      color: 'orange'
    }
  ];

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Initialize component and load settings overview
   */
  ngOnInit(): void {
    this.loadSettingsOverview();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Load general settings for quick overview display
   */
  loadSettingsOverview(): void {
    this.isLoading.set(true);

    this.settingsService.getGeneralSettings().subscribe({
      next: (settings) => {
        this.generalSettings.set(settings);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get the status label for maintenance mode
   * @returns Status text
   */
  getMaintenanceStatus(): string {
    const settings = this.generalSettings();
    if (!settings) return 'Unknown';
    return settings.maintenanceMode ? 'Maintenance Mode' : 'Operational';
  }

  /**
   * Get the status class for maintenance mode
   * @returns CSS class
   */
  getMaintenanceStatusClass(): string {
    const settings = this.generalSettings();
    if (!settings) return 'status--unknown';
    return settings.maintenanceMode ? 'status--warning' : 'status--success';
  }

  /**
   * Track function for sections
   * @param index - Array index
   * @param section - Section item
   * @returns Unique identifier
   */
  trackBySection(index: number, section: SettingsSection): string {
    return section.route;
  }
}
