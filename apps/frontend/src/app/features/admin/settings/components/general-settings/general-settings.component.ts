/**
 * @file general-settings.component.ts
 * @description General platform settings component.
 *              Manages platform configuration, currencies, languages, and business settings.
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
import { takeUntil, finalize } from 'rxjs/operators';

import { SettingsService } from '../../services/settings.service';
import {
  GeneralSettings,
  CommissionSettings,
  PaymentSettings,
  ShippingSettings,
  AllSettingsResponse
} from '../../interfaces/settings.interface';

/**
 * Settings tab definition
 * @description Tab configuration for the settings interface
 */
interface SettingsTab {
  id: string;
  label: string;
  icon: string;
}

/**
 * General Settings Component
 * @description Comprehensive platform configuration management
 *
 * @example
 * ```html
 * <app-general-settings></app-general-settings>
 * ```
 *
 * @features
 * - Platform information settings
 * - Currency and language configuration
 * - Commission rate management
 * - Payment method settings
 * - Shipping zone configuration
 * - Maintenance mode toggle
 */
@Component({
  standalone: true,
  selector: 'app-general-settings',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralSettingsComponent implements OnInit, OnDestroy {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  /** Settings service for API calls */
  private readonly settingsService = inject(SettingsService);

  /** Subject for managing subscription cleanup */
  private readonly destroy$ = new Subject<void>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** Saving state */
  readonly isSaving = signal<boolean>(false);

  /** Active tab */
  readonly activeTab = signal<string>('platform');

  /** Success message */
  readonly successMessage = signal<string | null>(null);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** General settings data */
  readonly generalSettings = signal<GeneralSettings | null>(null);

  /** Commission settings data */
  readonly commissionSettings = signal<CommissionSettings | null>(null);

  /** Payment settings data */
  readonly paymentSettings = signal<PaymentSettings | null>(null);

  /** Shipping settings data */
  readonly shippingSettings = signal<ShippingSettings | null>(null);

  /** Track if form has unsaved changes */
  readonly hasChanges = signal<boolean>(false);

  // ===========================================================================
  // STATIC DATA
  // ===========================================================================

  /** Settings tabs */
  readonly tabs: SettingsTab[] = [
    { id: 'platform', label: 'Platform', icon: 'dns' },
    { id: 'localization', label: 'Localization', icon: 'language' },
    { id: 'commission', label: 'Commission', icon: 'percent' },
    { id: 'payment', label: 'Payment', icon: 'payment' },
    { id: 'shipping', label: 'Shipping', icon: 'local_shipping' }
  ];

  /** Available currencies */
  readonly availableCurrencies = [
    { code: 'SYP', name: 'Syrian Pound', symbol: 'ل.س' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' }
  ];

  /** Available languages */
  readonly availableLanguages = [
    { code: 'ar', name: 'Arabic', direction: 'rtl' },
    { code: 'en', name: 'English', direction: 'ltr' }
  ];

  /** Available timezones (Middle East focused) */
  readonly availableTimezones = [
    'Asia/Damascus',
    'Asia/Beirut',
    'Asia/Amman',
    'Asia/Baghdad',
    'Europe/Istanbul',
    'Asia/Dubai',
    'Asia/Riyadh',
    'UTC'
  ];

  /** Date format options */
  readonly dateFormats = [
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (21/01/2026)' },
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (01/21/2026)' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2026-01-21)' }
  ];

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Check if platform tab is active */
  readonly isPlatformTab = computed(() => this.activeTab() === 'platform');

  /** Check if localization tab is active */
  readonly isLocalizationTab = computed(() => this.activeTab() === 'localization');

  /** Check if commission tab is active */
  readonly isCommissionTab = computed(() => this.activeTab() === 'commission');

  /** Check if payment tab is active */
  readonly isPaymentTab = computed(() => this.activeTab() === 'payment');

  /** Check if shipping tab is active */
  readonly isShippingTab = computed(() => this.activeTab() === 'shipping');

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Initialize component and load settings
   */
  ngOnInit(): void {
    this.loadAllSettings();
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
   * Load all settings from API
   */
  loadAllSettings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.settingsService.getAllSettings()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (settings: AllSettingsResponse) => {
          this.generalSettings.set({ ...settings.general });
          this.commissionSettings.set({ ...settings.commission });
          this.paymentSettings.set({ ...settings.payment });
          this.shippingSettings.set({ ...settings.shipping });
          this.hasChanges.set(false);
        },
        error: (err) => {
          console.error('Failed to load settings:', err);
          this.errorMessage.set('Failed to load settings. Showing default values.');
        }
      });
  }

  // ===========================================================================
  // TAB NAVIGATION
  // ===========================================================================

  /**
   * Switch to a different tab
   * @param tabId - Tab identifier
   */
  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  /**
   * Track function for tabs
   * @param index - Array index
   * @param tab - Tab item
   * @returns Unique identifier
   */
  trackByTab(index: number, tab: SettingsTab): string {
    return tab.id;
  }

  // ===========================================================================
  // FORM HANDLERS
  // ===========================================================================

  /**
   * Mark form as having changes
   */
  markAsChanged(): void {
    this.hasChanges.set(true);
  }

  /**
   * Update general settings field
   * @param field - Field name
   * @param value - New value
   */
  updateGeneralField<K extends keyof GeneralSettings>(
    field: K,
    value: GeneralSettings[K]
  ): void {
    const current = this.generalSettings();
    if (current) {
      this.generalSettings.set({ ...current, [field]: value });
      this.markAsChanged();
    }
  }

  /**
   * Update commission settings field
   * @param field - Field name
   * @param value - New value
   */
  updateCommissionField<K extends keyof CommissionSettings>(
    field: K,
    value: CommissionSettings[K]
  ): void {
    const current = this.commissionSettings();
    if (current) {
      this.commissionSettings.set({ ...current, [field]: value });
      this.markAsChanged();
    }
  }

  /**
   * Update payment settings field
   * @param field - Field name
   * @param value - New value
   */
  updatePaymentField<K extends keyof PaymentSettings>(
    field: K,
    value: PaymentSettings[K]
  ): void {
    const current = this.paymentSettings();
    if (current) {
      this.paymentSettings.set({ ...current, [field]: value });
      this.markAsChanged();
    }
  }

  /**
   * Update shipping settings field
   * @param field - Field name
   * @param value - ShippingSettings[K]
   */
  updateShippingField<K extends keyof ShippingSettings>(
    field: K,
    value: ShippingSettings[K]
  ): void {
    const current = this.shippingSettings();
    if (current) {
      this.shippingSettings.set({ ...current, [field]: value });
      this.markAsChanged();
    }
  }

  /**
   * Toggle a currency in supported currencies
   * @param currencyCode - Currency code to toggle
   */
  toggleCurrency(currencyCode: string): void {
    const current = this.generalSettings();
    if (!current) return;

    const currencies = [...current.supportedCurrencies];
    const index = currencies.indexOf(currencyCode);

    if (index > -1) {
      // Don't remove if it's the only one or the default
      if (currencies.length > 1 && currencyCode !== current.defaultCurrency) {
        currencies.splice(index, 1);
      }
    } else {
      currencies.push(currencyCode);
    }

    this.generalSettings.set({ ...current, supportedCurrencies: currencies });
    this.markAsChanged();
  }

  /**
   * Check if currency is supported
   * @param currencyCode - Currency code
   * @returns Whether currency is in supported list
   */
  isCurrencySupported(currencyCode: string): boolean {
    return this.generalSettings()?.supportedCurrencies.includes(currencyCode) ?? false;
  }

  /**
   * Toggle a language in supported languages
   * @param languageCode - Language code to toggle
   */
  toggleLanguage(languageCode: string): void {
    const current = this.generalSettings();
    if (!current) return;

    const languages = [...current.supportedLanguages];
    const index = languages.indexOf(languageCode);

    if (index > -1) {
      // Don't remove if it's the only one or the default
      if (languages.length > 1 && languageCode !== current.defaultLanguage) {
        languages.splice(index, 1);
      }
    } else {
      languages.push(languageCode);
    }

    this.generalSettings.set({ ...current, supportedLanguages: languages });
    this.markAsChanged();
  }

  /**
   * Check if language is supported
   * @param languageCode - Language code
   * @returns Whether language is in supported list
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.generalSettings()?.supportedLanguages.includes(languageCode) ?? false;
  }

  /**
   * Toggle payment method enabled state
   * @param methodId - Payment method ID
   */
  togglePaymentMethod(methodId: string): void {
    const current = this.paymentSettings();
    if (!current) return;

    const methods = current.enabledMethods.map(m =>
      m.id === methodId ? { ...m, enabled: !m.enabled } : m
    );

    this.paymentSettings.set({ ...current, enabledMethods: methods });
    this.markAsChanged();
  }

  /**
   * Toggle shipping zone active state
   * @param zoneId - Shipping zone ID
   */
  toggleShippingZone(zoneId: string): void {
    const current = this.shippingSettings();
    if (!current) return;

    const zones = current.zones.map(z =>
      z.id === zoneId ? { ...z, active: !z.active } : z
    );

    this.shippingSettings.set({ ...current, zones });
    this.markAsChanged();
  }

  // ===========================================================================
  // SAVE HANDLERS
  // ===========================================================================

  /**
   * Save all settings
   */
  saveSettings(): void {
    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // In a real app, we'd call multiple API endpoints
    // For now, simulate a save operation
    setTimeout(() => {
      this.isSaving.set(false);
      this.hasChanges.set(false);
      this.successMessage.set('Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage.set(null), 3000);
    }, 1000);
  }

  /**
   * Reset settings to last saved state
   */
  resetSettings(): void {
    this.loadAllSettings();
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Track function for categories
   * @param index - Array index
   * @param category - Category item
   * @returns Unique identifier
   */
  trackByCategory(index: number, category: { categoryId: string }): string {
    return category.categoryId;
  }

  /**
   * Track function for payment methods
   * @param index - Array index
   * @param method - Payment method
   * @returns Unique identifier
   */
  trackByMethod(index: number, method: { id: string }): string {
    return method.id;
  }

  /**
   * Track function for shipping zones
   * @param index - Array index
   * @param zone - Shipping zone
   * @returns Unique identifier
   */
  trackByZone(index: number, zone: { id: string }): string {
    return zone.id;
  }

  /**
   * Format currency for display
   * @param amount - Amount to format
   * @param currency - Currency code
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, currency: string = 'SYP'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
