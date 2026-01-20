import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AdminAuthService } from '../services/admin-auth.service';
import { AdminPermission, AdminRole } from '../interfaces/admin.interface';

/**
 * Guards responsible for protecting the enterprise admin experience.
 * They lean on the admin authentication service for session state and
 * permission checks. The logic is intentionally conservative until the
 * backend integration is complete.
 */
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAccess(route, state);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAccess(childRoute, state);
  }

  private checkAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (!this.adminAuthService.isAuthenticated()) {
      this.redirectToLogin(state.url);
      return of(false);
    }

    return this.adminAuthService.checkSessionExpiry().pipe(
      map(isValid => {
        if (!isValid) {
          this.redirectToLogin(state.url);
          return false;
        }

        const requiredRoles = route.data?.['roles'] as AdminRole[] | undefined;
        if (requiredRoles?.length && !this.adminAuthService.hasAnyRole(requiredRoles)) {
          this.redirectToUnauthorized();
          return false;
        }

        const requiredPermissions = route.data?.['permissions'] as AdminPermission[] | undefined;
        if (requiredPermissions?.length && !this.adminAuthService.hasAllPermissions(requiredPermissions)) {
          this.redirectToUnauthorized();
          return false;
        }

        const anyPermissions = route.data?.['anyPermissions'] as AdminPermission[] | undefined;
        if (anyPermissions?.length && !this.adminAuthService.hasAnyPermission(anyPermissions)) {
          this.redirectToUnauthorized();
          return false;
        }

        return true;
      }),
      catchError(() => {
        this.redirectToLogin(state.url);
        return of(false);
      })
    );
  }

  private redirectToLogin(returnUrl: string): void {
    sessionStorage.setItem('admin_return_url', returnUrl);
    this.router.navigate(['/admin/login'], {
      queryParams: { returnUrl },
      replaceUrl: true
    });
  }

  private redirectToUnauthorized(): void {
    this.router.navigate(['/admin/unauthorized'], { replaceUrl: true });
  }
}

@Injectable({ providedIn: 'root' })
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router
  ) {}

  canActivate(): Observable<boolean> {
    if (!this.adminAuthService.isAuthenticated()) {
      this.router.navigate(['/admin/login']);
      return of(false);
    }

    if (!this.adminAuthService.hasRole('super_admin')) {
      this.router.navigate(['/admin/unauthorized']);
      return of(false);
    }

    return of(true);
  }
}
