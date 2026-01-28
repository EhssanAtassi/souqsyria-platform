/**
 * @file settings.service.ts
 * @description Service for system configuration API calls.
 *              Handles settings, roles, permissions, and audit logs.
 * @module AdminDashboard/Settings
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  GeneralSettings,
  CommissionSettings,
  PaymentSettings,
  ShippingSettings,
  AllSettingsResponse,
  SettingsUpdateRequest,
  AdminRole,
  Permission,
  PermissionCategory,
  RolePermissionEntry,
  AuditLogEntry,
  AuditLogFilter,
  AuditLogResponse,
  AuditAction,
  FeatureFlag,
  ShippingZone,
  PaymentMethod
} from '../interfaces/settings.interface';

/**
 * Settings Service
 * @description Manages system configuration, roles, permissions, and audit logs
 *
 * @example
 * ```typescript
 * // Inject the service
 * private settingsService = inject(SettingsService);
 *
 * // Load all settings
 * this.settingsService.getAllSettings().subscribe(settings => {
 *   console.log(settings.general.platformName);
 * });
 *
 * // Update a specific setting
 * this.settingsService.updateGeneralSettings({ maintenanceMode: true }).subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  /** HTTP client for API requests */
  private readonly http = inject(HttpClient);

  /** Base API URL for settings endpoints */
  private readonly baseUrl = `${environment.apiUrl}/admin-dashboard/settings`;

  // ===========================================================================
  // GENERAL SETTINGS
  // ===========================================================================

  /**
   * Get all system settings
   * @returns Observable of all settings
   */
  getAllSettings(): Observable<AllSettingsResponse> {
    return this.http.get<AllSettingsResponse>(`${this.baseUrl}`).pipe(
      catchError(() => of(this.getMockAllSettings()))
    );
  }

  /**
   * Get general platform settings
   * @returns Observable of general settings
   */
  getGeneralSettings(): Observable<GeneralSettings> {
    return this.http.get<GeneralSettings>(`${this.baseUrl}/general`).pipe(
      catchError(() => of(this.getMockGeneralSettings()))
    );
  }

  /**
   * Update general platform settings
   * @param settings - Partial settings to update
   * @returns Observable of updated settings
   */
  updateGeneralSettings(settings: Partial<GeneralSettings>): Observable<GeneralSettings> {
    return this.http.patch<GeneralSettings>(`${this.baseUrl}/general`, settings);
  }

  // ===========================================================================
  // COMMISSION SETTINGS
  // ===========================================================================

  /**
   * Get commission settings
   * @returns Observable of commission settings
   */
  getCommissionSettings(): Observable<CommissionSettings> {
    return this.http.get<CommissionSettings>(`${this.baseUrl}/commission`).pipe(
      catchError(() => of(this.getMockCommissionSettings()))
    );
  }

  /**
   * Update commission settings
   * @param settings - Partial commission settings to update
   * @returns Observable of updated settings
   */
  updateCommissionSettings(settings: Partial<CommissionSettings>): Observable<CommissionSettings> {
    return this.http.patch<CommissionSettings>(`${this.baseUrl}/commission`, settings);
  }

  // ===========================================================================
  // PAYMENT SETTINGS
  // ===========================================================================

  /**
   * Get payment settings
   * @returns Observable of payment settings
   */
  getPaymentSettings(): Observable<PaymentSettings> {
    return this.http.get<PaymentSettings>(`${this.baseUrl}/payment`).pipe(
      catchError(() => of(this.getMockPaymentSettings()))
    );
  }

  /**
   * Update payment settings
   * @param settings - Partial payment settings to update
   * @returns Observable of updated settings
   */
  updatePaymentSettings(settings: Partial<PaymentSettings>): Observable<PaymentSettings> {
    return this.http.patch<PaymentSettings>(`${this.baseUrl}/payment`, settings);
  }

  /**
   * Add a new payment method
   * @param method - Payment method to add
   * @returns Observable of added payment method
   */
  addPaymentMethod(method: Omit<PaymentMethod, 'id'>): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.baseUrl}/payment/methods`, method);
  }

  /**
   * Update a payment method
   * @param methodId - Payment method ID
   * @param method - Partial method data to update
   * @returns Observable of updated payment method
   */
  updatePaymentMethod(methodId: string, method: Partial<PaymentMethod>): Observable<PaymentMethod> {
    return this.http.patch<PaymentMethod>(`${this.baseUrl}/payment/methods/${methodId}`, method);
  }

  /**
   * Delete a payment method
   * @param methodId - Payment method ID to delete
   * @returns Observable of void
   */
  deletePaymentMethod(methodId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/payment/methods/${methodId}`);
  }

  // ===========================================================================
  // SHIPPING SETTINGS
  // ===========================================================================

  /**
   * Get shipping settings
   * @returns Observable of shipping settings
   */
  getShippingSettings(): Observable<ShippingSettings> {
    return this.http.get<ShippingSettings>(`${this.baseUrl}/shipping`).pipe(
      catchError(() => of(this.getMockShippingSettings()))
    );
  }

  /**
   * Update shipping settings
   * @param settings - Partial shipping settings to update
   * @returns Observable of updated settings
   */
  updateShippingSettings(settings: Partial<ShippingSettings>): Observable<ShippingSettings> {
    return this.http.patch<ShippingSettings>(`${this.baseUrl}/shipping`, settings);
  }

  /**
   * Add a new shipping zone
   * @param zone - Shipping zone to add
   * @returns Observable of added shipping zone
   */
  addShippingZone(zone: Omit<ShippingZone, 'id'>): Observable<ShippingZone> {
    return this.http.post<ShippingZone>(`${this.baseUrl}/shipping/zones`, zone);
  }

  /**
   * Update a shipping zone
   * @param zoneId - Shipping zone ID
   * @param zone - Partial zone data to update
   * @returns Observable of updated shipping zone
   */
  updateShippingZone(zoneId: string, zone: Partial<ShippingZone>): Observable<ShippingZone> {
    return this.http.patch<ShippingZone>(`${this.baseUrl}/shipping/zones/${zoneId}`, zone);
  }

  /**
   * Delete a shipping zone
   * @param zoneId - Shipping zone ID to delete
   * @returns Observable of void
   */
  deleteShippingZone(zoneId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/shipping/zones/${zoneId}`);
  }

  // ===========================================================================
  // ROLE MANAGEMENT
  // ===========================================================================

  /**
   * Get all admin roles
   * @returns Observable of admin roles array
   */
  getRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(`${this.baseUrl}/roles`).pipe(
      catchError(() => of(this.getMockRoles()))
    );
  }

  /**
   * Get a single role by ID
   * @param roleId - Role ID
   * @returns Observable of admin role
   */
  getRole(roleId: string): Observable<AdminRole> {
    return this.http.get<AdminRole>(`${this.baseUrl}/roles/${roleId}`);
  }

  /**
   * Create a new role
   * @param role - Role data
   * @returns Observable of created role
   */
  createRole(role: Omit<AdminRole, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'isSystemRole'>): Observable<AdminRole> {
    return this.http.post<AdminRole>(`${this.baseUrl}/roles`, role);
  }

  /**
   * Update a role
   * @param roleId - Role ID
   * @param role - Partial role data to update
   * @returns Observable of updated role
   */
  updateRole(roleId: string, role: Partial<AdminRole>): Observable<AdminRole> {
    return this.http.patch<AdminRole>(`${this.baseUrl}/roles/${roleId}`, role);
  }

  /**
   * Delete a role
   * @param roleId - Role ID to delete
   * @returns Observable of void
   */
  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${roleId}`);
  }

  // ===========================================================================
  // PERMISSION MANAGEMENT
  // ===========================================================================

  /**
   * Get all available permissions
   * @returns Observable of permissions array
   */
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.baseUrl}/permissions`).pipe(
      catchError(() => of(this.getMockPermissions()))
    );
  }

  /**
   * Get permissions grouped by category
   * @returns Observable of permission categories
   */
  getPermissionCategories(): Observable<PermissionCategory[]> {
    return this.http.get<PermissionCategory[]>(`${this.baseUrl}/permissions/categories`).pipe(
      catchError(() => of(this.getMockPermissionCategories()))
    );
  }

  /**
   * Update role permissions
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to assign
   * @returns Observable of updated role
   */
  updateRolePermissions(roleId: string, permissionIds: string[]): Observable<AdminRole> {
    return this.http.put<AdminRole>(`${this.baseUrl}/roles/${roleId}/permissions`, { permissionIds });
  }

  /**
   * Get permission matrix (all roles x all permissions)
   * @returns Observable of role permission entries
   */
  getPermissionMatrix(): Observable<RolePermissionEntry[]> {
    return this.http.get<RolePermissionEntry[]>(`${this.baseUrl}/permissions/matrix`);
  }

  // ===========================================================================
  // AUDIT LOG
  // ===========================================================================

  /**
   * Get audit log entries with filtering
   * @param filter - Filter criteria
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of entries per page
   * @returns Observable of paginated audit log
   */
  getAuditLog(
    filter: AuditLogFilter = {},
    page: number = 1,
    pageSize: number = 20
  ): Observable<AuditLogResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filter.action) params = params.set('action', filter.action);
    if (filter.resourceType) params = params.set('resourceType', filter.resourceType);
    if (filter.adminUserId) params = params.set('adminUserId', filter.adminUserId);
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);
    if (filter.success !== undefined) params = params.set('success', filter.success.toString());
    if (filter.search) params = params.set('search', filter.search);

    return this.http.get<AuditLogResponse>(`${this.baseUrl}/audit-log`, { params }).pipe(
      catchError(() => of(this.getMockAuditLog(page, pageSize)))
    );
  }

  /**
   * Get audit log entry by ID
   * @param entryId - Audit log entry ID
   * @returns Observable of audit log entry
   */
  getAuditLogEntry(entryId: string): Observable<AuditLogEntry> {
    return this.http.get<AuditLogEntry>(`${this.baseUrl}/audit-log/${entryId}`);
  }

  /**
   * Export audit log
   * @param filter - Filter criteria
   * @param format - Export format (csv, xlsx, pdf)
   * @returns Observable of blob
   */
  exportAuditLog(filter: AuditLogFilter, format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    if (filter.action) params = params.set('action', filter.action);
    if (filter.resourceType) params = params.set('resourceType', filter.resourceType);
    if (filter.adminUserId) params = params.set('adminUserId', filter.adminUserId);
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);

    return this.http.get(`${this.baseUrl}/audit-log/export`, {
      params,
      responseType: 'blob'
    });
  }

  // ===========================================================================
  // FEATURE FLAGS
  // ===========================================================================

  /**
   * Get all feature flags
   * @returns Observable of feature flags array
   */
  getFeatureFlags(): Observable<FeatureFlag[]> {
    return this.http.get<FeatureFlag[]>(`${this.baseUrl}/feature-flags`).pipe(
      catchError(() => of(this.getMockFeatureFlags()))
    );
  }

  /**
   * Update a feature flag
   * @param flagId - Feature flag ID
   * @param flag - Partial flag data to update
   * @returns Observable of updated feature flag
   */
  updateFeatureFlag(flagId: string, flag: Partial<FeatureFlag>): Observable<FeatureFlag> {
    return this.http.patch<FeatureFlag>(`${this.baseUrl}/feature-flags/${flagId}`, flag);
  }

  /**
   * Create a new feature flag
   * @param flag - Feature flag data
   * @returns Observable of created feature flag
   */
  createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Observable<FeatureFlag> {
    return this.http.post<FeatureFlag>(`${this.baseUrl}/feature-flags`, flag);
  }

  /**
   * Delete a feature flag
   * @param flagId - Feature flag ID to delete
   * @returns Observable of void
   */
  deleteFeatureFlag(flagId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/feature-flags/${flagId}`);
  }

  // ===========================================================================
  // MOCK DATA METHODS
  // ===========================================================================

  /**
   * Get mock all settings
   * @private
   */
  private getMockAllSettings(): AllSettingsResponse {
    return {
      general: this.getMockGeneralSettings(),
      commission: this.getMockCommissionSettings(),
      payment: this.getMockPaymentSettings(),
      shipping: this.getMockShippingSettings()
    };
  }

  /**
   * Get mock general settings
   * @private
   */
  private getMockGeneralSettings(): GeneralSettings {
    return {
      platformName: 'SouqSyria',
      defaultCurrency: 'SYP',
      supportedCurrencies: ['SYP', 'USD', 'EUR'],
      defaultLanguage: 'ar',
      supportedLanguages: ['ar', 'en'],
      timezone: 'Asia/Damascus',
      dateFormat: 'dd/MM/yyyy',
      maintenanceMode: false,
      maintenanceMessage: '',
      contactEmail: 'support@souqsyria.com',
      supportPhone: '+963-11-1234567'
    };
  }

  /**
   * Get mock commission settings
   * @private
   */
  private getMockCommissionSettings(): CommissionSettings {
    return {
      defaultRate: 10,
      minRate: 5,
      maxRate: 25,
      categoryRates: [
        { categoryId: '1', categoryName: 'Electronics', rate: 8 },
        { categoryId: '2', categoryName: 'Fashion', rate: 12 },
        { categoryId: '3', categoryName: 'Home & Garden', rate: 10 },
        { categoryId: '4', categoryName: 'Food & Beverages', rate: 15 }
      ],
      allowVendorRates: true
    };
  }

  /**
   * Get mock payment settings
   * @private
   */
  private getMockPaymentSettings(): PaymentSettings {
    return {
      enabledMethods: [
        {
          id: '1',
          name: 'Cash on Delivery',
          type: 'cod',
          enabled: true,
          processingFee: 0,
          icon: 'local_atm'
        },
        {
          id: '2',
          name: 'Bank Transfer',
          type: 'bank_transfer',
          enabled: true,
          processingFee: 0,
          icon: 'account_balance'
        },
        {
          id: '3',
          name: 'Credit/Debit Card',
          type: 'card',
          enabled: false,
          processingFee: 2.5,
          gateway: { provider: 'stripe', sandbox: true },
          icon: 'credit_card'
        }
      ],
      defaultMethod: 'cod',
      allowCOD: true,
      codMaxAmount: 500000,
      minOrderAmount: 5000,
      vatEnabled: true,
      vatRate: 11
    };
  }

  /**
   * Get mock shipping settings
   * @private
   */
  private getMockShippingSettings(): ShippingSettings {
    return {
      zones: [
        {
          id: '1',
          name: 'Damascus & Rural Damascus',
          areas: ['Damascus', 'Rural Damascus'],
          baseRate: 3000,
          perItemRate: 500,
          deliveryDays: { min: 1, max: 2 },
          active: true
        },
        {
          id: '2',
          name: 'Coastal Region',
          areas: ['Latakia', 'Tartus'],
          baseRate: 5000,
          perItemRate: 750,
          deliveryDays: { min: 2, max: 4 },
          active: true
        },
        {
          id: '3',
          name: 'Central Syria',
          areas: ['Homs', 'Hama'],
          baseRate: 4500,
          perItemRate: 700,
          deliveryDays: { min: 2, max: 3 },
          active: true
        }
      ],
      defaultZoneId: '1',
      freeShippingEnabled: true,
      freeShippingThreshold: 100000,
      sameDayDeliveryEnabled: true
    };
  }

  /**
   * Get mock roles
   * @private
   */
  private getMockRoles(): AdminRole[] {
    const now = new Date().toISOString();
    return [
      {
        id: '1',
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        isSystemRole: true,
        permissions: [],
        userCount: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        name: 'admin',
        displayName: 'Administrator',
        description: 'General administrative access',
        isSystemRole: true,
        permissions: [],
        userCount: 5,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        name: 'moderator',
        displayName: 'Moderator',
        description: 'Content and user moderation access',
        isSystemRole: true,
        permissions: [],
        userCount: 8,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '4',
        name: 'customer_service',
        displayName: 'Customer Service',
        description: 'Order and customer support access',
        isSystemRole: true,
        permissions: [],
        userCount: 12,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '5',
        name: 'vendor_manager',
        displayName: 'Vendor Manager',
        description: 'Vendor oversight and commission management',
        isSystemRole: true,
        permissions: [],
        userCount: 4,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  /**
   * Get mock permissions
   * @private
   */
  private getMockPermissions(): Permission[] {
    return [
      { id: '1', name: 'users.read', description: 'View user list and details', resource: 'users', action: 'read', category: 'users' },
      { id: '2', name: 'users.create', description: 'Create new users', resource: 'users', action: 'create', category: 'users' },
      { id: '3', name: 'users.update', description: 'Update user information', resource: 'users', action: 'update', category: 'users' },
      { id: '4', name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete', category: 'users' },
      { id: '5', name: 'products.read', description: 'View products', resource: 'products', action: 'read', category: 'products' },
      { id: '6', name: 'products.create', description: 'Create products', resource: 'products', action: 'create', category: 'products' },
      { id: '7', name: 'products.update', description: 'Update products', resource: 'products', action: 'update', category: 'products' },
      { id: '8', name: 'products.delete', description: 'Delete products', resource: 'products', action: 'delete', category: 'products' },
      { id: '9', name: 'products.manage', description: 'Approve/reject products', resource: 'products', action: 'manage', category: 'products' },
      { id: '10', name: 'orders.read', description: 'View orders', resource: 'orders', action: 'read', category: 'orders' },
      { id: '11', name: 'orders.update', description: 'Update order status', resource: 'orders', action: 'update', category: 'orders' },
      { id: '12', name: 'orders.manage', description: 'Process refunds', resource: 'orders', action: 'manage', category: 'orders' },
      { id: '13', name: 'vendors.read', description: 'View vendors', resource: 'vendors', action: 'read', category: 'vendors' },
      { id: '14', name: 'vendors.manage', description: 'Verify/suspend vendors', resource: 'vendors', action: 'manage', category: 'vendors' },
      { id: '15', name: 'analytics.read', description: 'View analytics', resource: 'analytics', action: 'read', category: 'analytics' },
      { id: '16', name: 'settings.read', description: 'View settings', resource: 'settings', action: 'read', category: 'settings' },
      { id: '17', name: 'settings.manage', description: 'Modify settings', resource: 'settings', action: 'manage', category: 'settings' }
    ];
  }

  /**
   * Get mock permission categories
   * @private
   */
  private getMockPermissionCategories(): PermissionCategory[] {
    const permissions = this.getMockPermissions();
    return [
      { id: 'users', name: 'User Management', icon: 'people', permissions: permissions.filter(p => p.category === 'users') },
      { id: 'products', name: 'Product Catalog', icon: 'inventory_2', permissions: permissions.filter(p => p.category === 'products') },
      { id: 'orders', name: 'Order Management', icon: 'shopping_cart', permissions: permissions.filter(p => p.category === 'orders') },
      { id: 'vendors', name: 'Vendor Management', icon: 'store', permissions: permissions.filter(p => p.category === 'vendors') },
      { id: 'analytics', name: 'Analytics', icon: 'analytics', permissions: permissions.filter(p => p.category === 'analytics') },
      { id: 'settings', name: 'System Settings', icon: 'settings', permissions: permissions.filter(p => p.category === 'settings') }
    ];
  }

  /**
   * Get mock audit log
   * @private
   */
  private getMockAuditLog(page: number, pageSize: number): AuditLogResponse {
    const mockEntries: AuditLogEntry[] = [];
    const actions: AuditAction[] = [
      'user.create', 'user.update', 'user.status_change',
      'product.approve', 'product.reject',
      'order.status_change', 'order.refund',
      'vendor.verify', 'settings.update', 'login'
    ];
    const resources = ['User', 'Product', 'Order', 'Vendor', 'Settings'];

    for (let i = 0; i < 50; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const date = new Date();
      date.setHours(date.getHours() - i * 2);

      mockEntries.push({
        id: `log-${i + 1}`,
        action,
        resourceType: resources[Math.floor(Math.random() * resources.length)],
        resourceId: `res-${Math.floor(Math.random() * 1000)}`,
        adminUser: {
          id: `admin-${Math.floor(Math.random() * 5) + 1}`,
          name: ['Ahmad Khaled', 'Layla Hassan', 'Omar Farouk', 'Nadia Salim', 'Karim Abbas'][Math.floor(Math.random() * 5)],
          email: 'admin@souqsyria.com',
          role: ['super_admin', 'admin', 'moderator'][Math.floor(Math.random() * 3)]
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: date.toISOString(),
        success: Math.random() > 0.1
      });
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: mockEntries.slice(start, end),
      total: mockEntries.length,
      page,
      pageSize,
      totalPages: Math.ceil(mockEntries.length / pageSize)
    };
  }

  /**
   * Get mock feature flags
   * @private
   */
  private getMockFeatureFlags(): FeatureFlag[] {
    const now = new Date().toISOString();
    return [
      {
        id: '1',
        key: 'new_checkout_flow',
        name: 'New Checkout Flow',
        description: 'Streamlined checkout process with fewer steps',
        enabled: true,
        rolloutPercentage: 100,
        category: 'commerce',
        environments: ['development', 'staging', 'production'],
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        key: 'dark_mode',
        name: 'Dark Mode',
        description: 'Enable dark theme for the admin panel',
        enabled: false,
        rolloutPercentage: 0,
        category: 'user_experience',
        environments: ['development'],
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        key: 'ai_product_descriptions',
        name: 'AI Product Descriptions',
        description: 'Generate product descriptions using AI',
        enabled: true,
        rolloutPercentage: 50,
        category: 'experimental',
        environments: ['development', 'staging'],
        enabledForRoles: ['super_admin', 'admin'],
        createdAt: now,
        updatedAt: now
      },
      {
        id: '4',
        key: 'vendor_analytics_v2',
        name: 'Vendor Analytics V2',
        description: 'Enhanced vendor analytics dashboard',
        enabled: true,
        rolloutPercentage: 25,
        category: 'performance',
        environments: ['development', 'staging'],
        createdAt: now,
        updatedAt: now
      }
    ];
  }
}
