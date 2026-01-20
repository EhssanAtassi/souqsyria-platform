import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AdminPermission, AdminRole, AdminUser } from '../interfaces/admin.interface';

interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  admin: AdminUser;
}

const API_BASE = `${environment.apiUrl}/admin/auth`;
const STORAGE_KEYS = {
  admin: 'admin_user',
  accessToken: 'admin_access_token',
  refreshToken: 'admin_refresh_token',
  tokenExpiry: 'admin_token_exp',
};

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly _currentAdmin = signal<AdminUser | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _permissions = signal<AdminPermission[]>([]);

  private readonly currentAdminSubject = new BehaviorSubject<AdminUser | null>(null);

  readonly currentAdmin = this._currentAdmin.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly currentAdmin$ = this.currentAdminSubject.asObservable();

  private readonly offlineMode = environment.forceOfflineMode === true;

  private readonly rolePermissions: Record<AdminRole, AdminPermission[]> = {
    super_admin: [
      'products.view', 'products.create', 'products.edit', 'products.delete',
      'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund',
      'vendors.view', 'vendors.approve', 'vendors.edit', 'vendors.suspend',
      'customers.view', 'customers.edit', 'customers.suspend',
      'analytics.view', 'settings.edit', 'users.manage',
      'content.edit', 'promotions.manage', 'reports.generate'
    ],
    admin: [
      'products.view', 'products.create', 'products.edit',
      'orders.view', 'orders.edit', 'orders.cancel',
      'vendors.view', 'vendors.edit',
      'customers.view', 'customers.edit',
      'analytics.view', 'content.edit', 'promotions.manage', 'reports.generate'
    ],
    moderator: [
      'products.view', 'products.edit',
      'orders.view', 'orders.edit',
      'vendors.view',
      'customers.view',
      'content.edit'
    ],
    customer_service: [
      'orders.view', 'orders.edit',
      'customers.view', 'customers.edit',
      'vendors.view'
    ],
    vendor_manager: [
      'vendors.view', 'vendors.approve', 'vendors.edit', 'vendors.suspend',
      'products.view', 'products.edit',
      'orders.view'
    ]
  };

  constructor(private readonly http: HttpClient) {
    this.bootstrapFromStorage();
  }

  login(email: string, password: string): Observable<AdminUser> {
    if (this.offlineMode) {
      return this.mockAdminLogin(email, password).pipe(
        map(admin => {
          this.persistSession(admin, 'mock-access', 'mock-refresh');
          return admin;
        })
      );
    }

    return this.http
      .post<AdminAuthResponse>(`${API_BASE}/login`, { email, password })
      .pipe(
        map(response => {
          this.persistSession(response.admin, response.accessToken, response.refreshToken);
          return response.admin;
        }),
        catchError(error => throwError(() => this.transformHttpError(error)))
      );
  }

  logout(): Observable<boolean> {
    const performLocalLogout = () => {
      this.clearSession();
      return of(true);
    };

    if (this.offlineMode) {
      return performLocalLogout();
    }

    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return performLocalLogout();
    }

    const refreshToken = this.getRefreshToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });

    return this.http
      .post(`${API_BASE}/logout`, { refreshToken }, { headers })
      .pipe(
        catchError(() => of(null)),
        map(() => true),
        switchMap(result => performLocalLogout().pipe(map(() => result)))
      );
  }

  hasPermission(permission: AdminPermission): boolean {
    return this._permissions().includes(permission);
  }

  hasAnyPermission(permissions: AdminPermission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: AdminPermission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  hasRole(role: AdminRole): boolean {
    return this._currentAdmin()?.role === role;
  }

  hasAnyRole(roles: AdminRole[]): boolean {
    const admin = this._currentAdmin();
    return admin ? roles.includes(admin.role) : false;
  }

  getCurrentAdminId(): string {
    return this._currentAdmin()?.id ?? '';
  }

  getCurrentRole(): AdminRole | null {
    return this._currentAdmin()?.role ?? null;
  }

  refreshSession(): Observable<AdminUser> {
    if (this.offlineMode) {
      const admin = this._currentAdmin();
      return admin ? of(admin) : throwError(() => new Error('No current admin session'));
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AdminAuthResponse>(`${API_BASE}/refresh`, { refreshToken })
      .pipe(
        map(response => {
          this.persistSession(response.admin, response.accessToken, response.refreshToken);
          return response.admin;
        }),
        catchError(error => throwError(() => this.transformHttpError(error)))
      );
  }

  updateProfile(profileData: Partial<AdminUser>): Observable<AdminUser> {
    const admin = this._currentAdmin();
    if (!admin) {
      return throwError(() => new Error('No authenticated admin'));
    }

    const updatedAdmin: AdminUser = { ...admin, ...profileData, updatedAt: new Date() };
    this.persistSession(updatedAdmin, this.getAccessToken() ?? '', this.getRefreshToken());

    return of(updatedAdmin);
  }

  updateTwoFactor(enabled: boolean): Observable<boolean> {
    const admin = this._currentAdmin();
    if (!admin) {
      return throwError(() => new Error('No authenticated admin'));
    }

    this.persistSession(
      { ...admin, twoFactorEnabled: enabled, updatedAt: new Date() },
      this.getAccessToken() ?? '',
      this.getRefreshToken()
    );

    return of(true);
  }

  checkSessionExpiry(): Observable<boolean> {
    const exp = this.getStoredExpiry();
    if (!exp) {
      return of(false);
    }

    const now = Math.floor(Date.now() / 1000);
    if (exp <= now) {
      return this.logout().pipe(map(() => false));
    }

    const secondsRemaining = exp - now;
    if (secondsRemaining < 5 * 60 && !this.offlineMode) {
      return this.refreshSession().pipe(
        map(() => true),
        catchError(() => of(false))
      );
    }

    return of(true);
  }

  getAdminActivityLogs(limit = 50): Observable<any[]> {
    if (this.offlineMode) {
      return of(this.mockActivityLogs().slice(0, limit));
    }

    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return of(this.mockActivityLogs().slice(0, limit));
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
    return this.http
      .get<any[]>(`${environment.apiUrl}/admin/dashboard/activities`, { headers })
      .pipe(
        map(logs => logs.slice(0, limit)),
        catchError(() => of(this.mockActivityLogs().slice(0, limit)))
      );
  }

  private persistSession(admin: AdminUser, accessToken: string, refreshToken?: string | null): void {
    this.setCurrentAdmin(admin, admin.permissions);
    this.storeTokens(accessToken, refreshToken ?? null);
    localStorage.setItem(STORAGE_KEYS.admin, JSON.stringify(admin));
  }

  private setCurrentAdmin(admin: AdminUser, overridePermissions?: AdminPermission[]): void {
    const permissions = overridePermissions?.length
      ? overridePermissions
      : admin.permissions?.length
        ? admin.permissions
        : this.rolePermissions[admin.role] ?? [];

    const uniquePermissions = Array.from(new Set(permissions));
    this._currentAdmin.set({ ...admin, permissions: uniquePermissions });
    this._permissions.set(uniquePermissions);
    this._isAuthenticated.set(true);
    this.currentAdminSubject.next({ ...admin, permissions: uniquePermissions });
  }

  private storeTokens(accessToken: string, refreshToken: string | null): void {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
      const decoded = this.decodeToken(accessToken);
      if (decoded?.exp) {
        localStorage.setItem(STORAGE_KEYS.tokenExpiry, decoded.exp.toString());
      }
    }

    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    }
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.admin);
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.tokenExpiry);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_login_time');

    this._currentAdmin.set(null);
    this._permissions.set([]);
    this._isAuthenticated.set(false);
    this.currentAdminSubject.next(null);
  }

  private bootstrapFromStorage(): void {
    const adminRaw = localStorage.getItem(STORAGE_KEYS.admin);
    const accessToken = this.getAccessToken();

    if (!adminRaw || !accessToken) {
      return;
    }

    const decoded = this.decodeToken(accessToken);
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      this.clearSession();
      return;
    }

    try {
      const admin: AdminUser = JSON.parse(adminRaw);
      this.setCurrentAdmin(admin, admin.permissions);
    } catch {
      this.clearSession();
    }
  }

  private getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  }

  private getStoredExpiry(): number | null {
    const exp = localStorage.getItem(STORAGE_KEYS.tokenExpiry);
    return exp ? Number(exp) : null;
  }

  private decodeToken(token: string): { exp?: number; iat?: number } | null {
    try {
      const payload = token.split('.')[1];
      return payload ? JSON.parse(atob(payload)) : null;
    } catch {
      return null;
    }
  }

  private mockAdminLogin(email: string, password: string): Observable<AdminUser> {
    const admins: AdminUser[] = [
      {
        id: 'admin_001',
        email: 'admin@souqsyria.com',
        firstName: 'محمد',
        lastName: 'الأدمن',
        role: 'super_admin',
        permissions: [],
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date(),
        profilePicture: 'https://i.pravatar.cc/150?u=admin001',
        phoneNumber: '+963-11-555-0001',
        department: 'System Administration',
        twoFactorEnabled: false
      },
      {
        id: 'admin_002',
        email: 'manager@souqsyria.com',
        firstName: 'فاطمة',
        lastName: 'المدير',
        role: 'admin',
        permissions: [],
        isActive: true,
        createdAt: new Date('2023-02-01'),
        updatedAt: new Date(),
        profilePicture: 'https://i.pravatar.cc/150?u=admin002',
        phoneNumber: '+963-11-555-0002',
        department: 'Operations',
        twoFactorEnabled: true
      },
      {
        id: 'admin_003',
        email: 'moderator@souqsyria.com',
        firstName: 'أحمد',
        lastName: 'المنسق',
        role: 'moderator',
        permissions: [],
        isActive: true,
        createdAt: new Date('2023-03-01'),
        updatedAt: new Date(),
        profilePicture: 'https://i.pravatar.cc/150?u=admin003',
        phoneNumber: '+963-11-555-0003',
        department: 'Content Management',
        twoFactorEnabled: false
      }
    ];

    const admin = admins.find(item => item.email === email);
    if (!admin) {
      return throwError(() => new Error('Admin not found'));
    }

    const validPasswords = ['admin123', 'manager123', 'moderator123'];
    if (!validPasswords.includes(password)) {
      return throwError(() => new Error('Invalid password'));
    }

    return of({ ...admin, lastLoginAt: new Date() });
  }

  private mockActivityLogs() {
    return [
      {
        id: 'log_001',
        adminId: this.getCurrentAdminId(),
        action: 'login',
        resource: 'admin_panel',
        timestamp: new Date(),
        ipAddress: '192.168.1.100',
        success: true
      },
      {
        id: 'log_002',
        adminId: this.getCurrentAdminId(),
        action: 'update',
        resource: 'product',
        resourceId: 'prod_001',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        ipAddress: '192.168.1.100',
        success: true
      }
    ];
  }

  private transformHttpError(error: unknown): Error {
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = (error as { error?: { message?: string } }).error;
      if (typeof apiError?.message === 'string') {
        return new Error(apiError.message);
      }
    }
    return new Error('Unable to process admin request. Please try again.');
  }
}
