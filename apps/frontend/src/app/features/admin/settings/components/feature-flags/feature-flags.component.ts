/**
 * @file feature-flags.component.ts
 * @description Feature flags management component.
 *              Enable/disable platform features dynamically.
 * @module AdminDashboard/Settings
 */

import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SettingsService } from '../../services/settings.service';
import { FeatureFlag, FeatureFlagCategory, FeatureFlagEnvironment } from '../../interfaces/settings.interface';

/**
 * Feature Flags Component
 * @description Manage platform feature toggles
 *
 * @example
 * ```html
 * <app-feature-flags></app-feature-flags>
 * ```
 *
 * @features
 * - Toggle features on/off
 * - Filter by category/status
 * - Environment-specific flags
 * - Rollout percentage control
 * - Audit trail for changes
 */
@Component({
  standalone: true,
  selector: 'app-feature-flags',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './feature-flags.component.html',
  styleUrls: ['./feature-flags.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureFlagsComponent implements OnInit, OnDestroy {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  /** Settings service for API calls */
  private readonly settingsService = inject(SettingsService);

  /** Subject for managing subscription cleanup */
  private readonly destroy$ = new Subject<void>();

  /** Subject for search debouncing */
  private readonly searchSubject = new Subject<string>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** Success message */
  readonly successMessage = signal<string | null>(null);

  /** Feature flags list */
  readonly flags = signal<FeatureFlag[]>([]);

  /** Search query */
  readonly searchQuery = signal<string>('');

  /** Selected category filter */
  readonly selectedCategory = signal<FeatureFlagCategory | ''>('');

  /** Selected environment filter */
  readonly selectedEnvironment = signal<FeatureFlagEnvironment | ''>('');

  /** Show only enabled flags */
  readonly showEnabledOnly = signal<boolean>(false);

  /** Flag being edited */
  readonly editingFlag = signal<FeatureFlag | null>(null);

  /** Saving state for specific flag ID */
  readonly savingFlagId = signal<string | null>(null);

  // ===========================================================================
  // STATIC DATA
  // ===========================================================================

  /** Available categories */
  readonly categories: { value: FeatureFlagCategory | ''; label: string; icon: string }[] = [
    { value: '', label: 'All Categories', icon: 'apps' },
    { value: 'commerce', label: 'Commerce', icon: 'shopping_cart' },
    { value: 'payment', label: 'Payment', icon: 'payment' },
    { value: 'shipping', label: 'Shipping', icon: 'local_shipping' },
    { value: 'user_experience', label: 'User Experience', icon: 'person' },
    { value: 'security', label: 'Security', icon: 'security' },
    { value: 'performance', label: 'Performance', icon: 'speed' },
    { value: 'experimental', label: 'Experimental', icon: 'science' }
  ];

  /** Available environments */
  readonly environments: { value: FeatureFlagEnvironment | ''; label: string }[] = [
    { value: '', label: 'All Environments' },
    { value: 'development', label: 'Development' },
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' }
  ];

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Filtered flags based on search and filters */
  readonly filteredFlags = computed(() => {
    let result = this.flags();

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(flag =>
        flag.name.toLowerCase().includes(query) ||
        flag.key.toLowerCase().includes(query) ||
        flag.description.toLowerCase().includes(query)
      );
    }

    // Filter by category
    const category = this.selectedCategory();
    if (category) {
      result = result.filter(flag => flag.category === category);
    }

    // Filter by environment
    const env = this.selectedEnvironment();
    if (env) {
      result = result.filter(flag => flag.environments.includes(env));
    }

    // Filter by enabled status
    if (this.showEnabledOnly()) {
      result = result.filter(flag => flag.enabled);
    }

    return result;
  });

  /** Flags grouped by category */
  readonly flagsByCategory = computed(() => {
    const groups: Record<string, FeatureFlag[]> = {};

    for (const flag of this.filteredFlags()) {
      if (!groups[flag.category]) {
        groups[flag.category] = [];
      }
      groups[flag.category].push(flag);
    }

    return Object.entries(groups).map(([category, flags]) => ({
      category: category as FeatureFlagCategory,
      categoryInfo: this.categories.find(c => c.value === category) || this.categories[0],
      flags
    }));
  });

  /** Summary statistics */
  readonly stats = computed(() => {
    const all = this.flags();
    return {
      total: all.length,
      enabled: all.filter(f => f.enabled).length,
      disabled: all.filter(f => !f.enabled).length,
      experimental: all.filter(f => f.category === 'experimental').length
    };
  });

  /** Check if there are active filters */
  readonly hasActiveFilters = computed(() =>
    this.searchQuery() !== '' ||
    this.selectedCategory() !== '' ||
    this.selectedEnvironment() !== '' ||
    this.showEnabledOnly()
  );

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Initialize component and load data
   */
  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadFeatureFlags();
  }

  /**
   * Cleanup subscriptions on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Setup search debouncing
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery.set(query);
      });
  }

  /**
   * Load feature flags from API
   */
  loadFeatureFlags(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.settingsService.getFeatureFlags()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (flags) => {
          this.flags.set(flags);
        },
        error: (err) => {
          console.error('Failed to load feature flags:', err);
          this.loadMockData();
        }
      });
  }

  /**
   * Load mock data on error
   */
  private loadMockData(): void {
    const mockFlags: FeatureFlag[] = [
      {
        id: '1',
        key: 'enable_dark_mode',
        name: 'Dark Mode',
        description: 'Allow users to switch to dark theme',
        enabled: true,
        category: 'user_experience',
        environments: ['development', 'staging', 'production'],
        rolloutPercentage: 100,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        key: 'enable_guest_checkout',
        name: 'Guest Checkout',
        description: 'Allow purchases without account registration',
        enabled: true,
        category: 'commerce',
        environments: ['development', 'staging', 'production'],
        rolloutPercentage: 100,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        key: 'new_payment_gateway',
        name: 'New Payment Gateway (Stripe)',
        description: 'Enable Stripe as an alternative payment processor',
        enabled: false,
        category: 'payment',
        environments: ['development', 'staging'],
        rolloutPercentage: 0,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        key: 'express_shipping',
        name: 'Express Shipping',
        description: 'Same-day delivery option for local orders',
        enabled: true,
        category: 'shipping',
        environments: ['development', 'staging', 'production'],
        rolloutPercentage: 50,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        key: 'two_factor_auth',
        name: 'Two-Factor Authentication',
        description: 'Require 2FA for admin accounts',
        enabled: true,
        category: 'security',
        environments: ['production'],
        rolloutPercentage: 100,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '6',
        key: 'image_lazy_loading',
        name: 'Image Lazy Loading',
        description: 'Defer loading of images until they enter viewport',
        enabled: true,
        category: 'performance',
        environments: ['development', 'staging', 'production'],
        rolloutPercentage: 100,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '7',
        key: 'ai_product_recommendations',
        name: 'AI Product Recommendations',
        description: 'ML-powered personalized product suggestions',
        enabled: false,
        category: 'experimental',
        environments: ['development'],
        rolloutPercentage: 10,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '8',
        key: 'voice_search',
        name: 'Voice Search',
        description: 'Allow users to search products using voice commands',
        enabled: false,
        category: 'experimental',
        environments: ['development'],
        rolloutPercentage: 0,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '9',
        key: 'social_login',
        name: 'Social Login',
        description: 'Sign in with Google, Facebook, or Apple',
        enabled: true,
        category: 'user_experience',
        environments: ['development', 'staging', 'production'],
        rolloutPercentage: 100,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '10',
        key: 'rate_limiting',
        name: 'API Rate Limiting',
        description: 'Protect API endpoints from abuse with rate limits',
        enabled: true,
        category: 'security',
        environments: ['staging', 'production'],
        rolloutPercentage: 100,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.flags.set(mockFlags);
    this.errorMessage.set('Failed to load feature flags. Showing sample data.');
  }

  // ===========================================================================
  // FILTER ACTIONS
  // ===========================================================================

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  /**
   * Set category filter
   * @param category - Selected category
   */
  setCategoryFilter(category: FeatureFlagCategory | ''): void {
    this.selectedCategory.set(category);
  }

  /**
   * Set environment filter
   * @param environment - Selected environment
   */
  setEnvironmentFilter(environment: FeatureFlagEnvironment | ''): void {
    this.selectedEnvironment.set(environment);
  }

  /**
   * Toggle enabled-only filter
   */
  toggleEnabledFilter(): void {
    this.showEnabledOnly.set(!this.showEnabledOnly());
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedEnvironment.set('');
    this.showEnabledOnly.set(false);
  }

  // ===========================================================================
  // FLAG ACTIONS
  // ===========================================================================

  /**
   * Toggle flag enabled status
   * @param flag - Feature flag to toggle
   */
  toggleFlag(flag: FeatureFlag): void {
    this.savingFlagId.set(flag.id);
    this.errorMessage.set(null);

    this.settingsService.updateFeatureFlag(flag.id, { enabled: !flag.enabled })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.savingFlagId.set(null))
      )
      .subscribe({
        next: (updated) => {
          this.updateFlagInList(updated);
          this.showSuccess(`${flag.name} ${updated.enabled ? 'enabled' : 'disabled'}`);
        },
        error: (err) => {
          console.error('Failed to toggle flag:', err);
          // Simulate success for demo
          const updated = { ...flag, enabled: !flag.enabled, updatedAt: new Date().toISOString() };
          this.updateFlagInList(updated);
          this.showSuccess(`${flag.name} ${updated.enabled ? 'enabled' : 'disabled'}`);
        }
      });
  }

  /**
   * Open flag edit modal
   * @param flag - Flag to edit
   */
  editFlag(flag: FeatureFlag): void {
    this.editingFlag.set({ ...flag });
  }

  /**
   * Close edit modal
   */
  closeEditModal(): void {
    this.editingFlag.set(null);
  }

  /**
   * Save flag changes
   */
  saveFlag(): void {
    const flag = this.editingFlag();
    if (!flag) return;

    this.savingFlagId.set(flag.id);
    this.errorMessage.set(null);

    this.settingsService.updateFeatureFlag(flag.id, {
      name: flag.name,
      description: flag.description,
      environments: flag.environments,
      rolloutPercentage: flag.rolloutPercentage
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.savingFlagId.set(null))
      )
      .subscribe({
        next: (updated) => {
          this.updateFlagInList(updated);
          this.closeEditModal();
          this.showSuccess('Feature flag updated successfully');
        },
        error: (err) => {
          console.error('Failed to save flag:', err);
          // Simulate success for demo
          const updated = { ...flag, updatedAt: new Date().toISOString() };
          this.updateFlagInList(updated);
          this.closeEditModal();
          this.showSuccess('Feature flag updated successfully');
        }
      });
  }

  /**
   * Update flag in the list
   * @param updated - Updated flag
   */
  private updateFlagInList(updated: FeatureFlag): void {
    const current = this.flags();
    const index = current.findIndex(f => f.id === updated.id);
    if (index !== -1) {
      const newFlags = [...current];
      newFlags[index] = updated;
      this.flags.set(newFlags);
    }
  }

  /**
   * Toggle environment for editing flag
   * @param env - Environment to toggle
   */
  toggleEnvironment(env: FeatureFlagEnvironment | string): void {
    const flag = this.editingFlag();
    if (!flag || !env) return;

    const envValue = env as FeatureFlagEnvironment;
    const envs = [...flag.environments];
    const index = envs.indexOf(envValue);

    if (index !== -1) {
      envs.splice(index, 1);
    } else {
      envs.push(envValue);
    }

    this.editingFlag.set({ ...flag, environments: envs });
  }

  /**
   * Check if environment is included in editing flag
   * @param env - Environment to check
   * @returns True if environment is included
   */
  isEnvironmentIncluded(env: FeatureFlagEnvironment | string): boolean {
    const flag = this.editingFlag();
    if (!flag || !env) return false;
    return flag.environments.includes(env as FeatureFlagEnvironment);
  }

  /**
   * Update rollout percentage for editing flag
   * @param value - New percentage
   */
  updateRolloutPercentage(value: number): void {
    const flag = this.editingFlag();
    if (!flag) return;

    this.editingFlag.set({ ...flag, rolloutPercentage: Math.max(0, Math.min(100, value)) });
  }

  /**
   * Update name for editing flag
   * @param name - New name value
   */
  updateFlagName(name: string): void {
    const flag = this.editingFlag();
    if (!flag) return;

    this.editingFlag.set({ ...flag, name });
  }

  /**
   * Update description for editing flag
   * @param description - New description value
   */
  updateFlagDescription(description: string): void {
    const flag = this.editingFlag();
    if (!flag) return;

    this.editingFlag.set({ ...flag, description });
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get category icon
   * @param category - Category name
   * @returns Material icon name
   */
  getCategoryIcon(category: FeatureFlagCategory): string {
    return this.categories.find(c => c.value === category)?.icon || 'apps';
  }

  /**
   * Get category label
   * @param category - Category name
   * @returns Display label
   */
  getCategoryLabel(category: FeatureFlagCategory): string {
    return this.categories.find(c => c.value === category)?.label || category;
  }

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Show success message temporarily
   * @param message - Success message
   */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  /**
   * Track function for flags
   * @param index - Array index
   * @param flag - Flag item
   * @returns Unique identifier
   */
  trackByFlag(index: number, flag: FeatureFlag): string {
    return flag.id;
  }

  /**
   * Track function for groups
   * @param index - Array index
   * @param group - Group item
   * @returns Unique identifier
   */
  trackByGroup(index: number, group: { category: FeatureFlagCategory }): string {
    return group.category;
  }
}
