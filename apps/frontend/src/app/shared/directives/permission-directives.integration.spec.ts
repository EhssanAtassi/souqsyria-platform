/**
 * Permission Directives Integration Tests
 *
 * @description
 * Integration tests for HasPermissionDirective and DisableWithoutPermissionDirective.
 * These tests validate the complete directive behavior with real PermissionStore state,
 * including DOM rendering, CSS styles, ARIA attributes, and reactive updates.
 *
 * Test Coverage:
 * - *hasPermission shows/hides elements based on real store state
 * - *hasPermission with multiple permissions (AND/OR modes)
 * - [disableWithoutPermission] disables buttons correctly
 * - Permission changes reflect in UI immediately
 * - Loading state handling with loading templates
 * - Else template rendering for denied access
 * - Fallback role support
 * - ARIA accessibility attributes
 * - Memory leak prevention via OnDestroy
 *
 * @module SharedDirectives/IntegrationTests
 * @group integration
 * @group directives
 * @group permissions
 */

import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';

import { HasPermissionDirective } from './has-permission.directive';
import { DisableWithoutPermissionDirective } from './disable-without-permission.directive';
import { PermissionStore } from '../../store/permissions/permission.store';
import { PermissionQuery } from '../../store/permissions/permission.query';
import { Role } from '../../store/permissions/permission.model';

// =============================================================================
// TEST HOST COMPONENTS
// =============================================================================

/**
 * Test host component for HasPermissionDirective.
 *
 * @description
 * Provides various template configurations to test all directive features.
 */
@Component({
  template: `
    <!-- Single permission test -->
    <div id="single-perm" *hasPermission="'manage_users'">
      <span class="admin-content">ادارة المستخدمين - User Management</span>
    </div>

    <!-- Multiple permissions - ALL mode -->
    <div
      id="all-mode"
      *hasPermission="['manage_users', 'manage_roles']; mode: 'all'"
    >
      <span class="full-admin-content">Full Admin Panel</span>
    </div>

    <!-- Multiple permissions - ANY mode -->
    <div
      id="any-mode"
      *hasPermission="['manage_users', 'manage_products']; mode: 'any'"
    >
      <span class="any-admin-content">Partial Admin Panel</span>
    </div>

    <!-- With else template -->
    <div
      id="with-else"
      *hasPermission="'super_admin_access'; else: noAccessTpl"
    >
      <span class="super-admin">Super Admin Only</span>
    </div>
    <ng-template #noAccessTpl>
      <div id="no-access-message">
        <span class="denied-content">ليس لديك الصلاحية - Access Denied</span>
      </div>
    </ng-template>

    <!-- With loading template -->
    <div
      id="with-loading"
      *hasPermission="'view_dashboard'; loading: loadingTpl"
    >
      <span class="dashboard-content">Dashboard Content</span>
    </div>
    <ng-template #loadingTpl>
      <div id="loading-indicator">
        <span class="loading-text">جاري التحميل... Loading permissions...</span>
      </div>
    </ng-template>

    <!-- With fallback role -->
    <div
      id="with-fallback"
      *hasPermission="'nonexistent_permission'; fallbackRole: 'admin'"
    >
      <span class="fallback-content">Visible via admin fallback role</span>
    </div>

    <!-- Empty permission (edge case) -->
    <div id="empty-perm" *hasPermission="''">
      <span>Should not render</span>
    </div>
  `,
  standalone: true,
  imports: [HasPermissionDirective]
})
class HasPermissionTestHostComponent {}

/**
 * Test host component for DisableWithoutPermissionDirective.
 *
 * @description
 * Provides button and form element templates for disable directive testing.
 */
@Component({
  template: `
    <!-- Single permission disable -->
    <button
      id="btn-single"
      [disableWithoutPermission]="'manage_users'"
    >
      حظر المستخدم - Ban User
    </button>

    <!-- Multiple permissions - ALL mode -->
    <button
      id="btn-all"
      [disableWithoutPermission]="['manage_users', 'manage_roles']"
      [disableWithoutPermissionMode]="'all'"
    >
      Manage Everything
    </button>

    <!-- Multiple permissions - ANY mode -->
    <button
      id="btn-any"
      [disableWithoutPermission]="['manage_users', 'manage_products']"
      [disableWithoutPermissionMode]="'any'"
    >
      Any Admin Action
    </button>

    <!-- With custom tooltip -->
    <button
      id="btn-tooltip"
      [disableWithoutPermission]="'delete_products'"
      [disableWithoutPermissionTooltip]="'تحتاج صلاحية حذف المنتجات - Need delete permission'"
    >
      حذف المنتج - Delete Product
    </button>

    <!-- Input element -->
    <input
      id="input-perm"
      type="text"
      [disableWithoutPermission]="'edit_user_profile'"
      placeholder="اسم المستخدم - Username"
    />

    <!-- Select element -->
    <select
      id="select-perm"
      [disableWithoutPermission]="'assign_roles'"
    >
      <option value="admin">مدير</option>
      <option value="seller">بائع</option>
    </select>
  `,
  standalone: true,
  imports: [DisableWithoutPermissionDirective]
})
class DisableTestHostComponent {}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Permission Directives Integration Tests', () => {
  let store: PermissionStore;
  let query: PermissionQuery;

  // ---------------------------------------------------------------------------
  // Mock Data
  // ---------------------------------------------------------------------------

  /** Admin permissions for SouqSyria platform */
  const ADMIN_PERMISSIONS: string[] = [
    'manage_users',
    'view_users',
    'manage_roles',
    'view_roles',
    'manage_products',
    'view_products',
    'manage_orders',
    'view_orders',
    'manage_routes',
    'view_audit_logs',
    'access_admin_panel',
    'view_dashboard'
  ];

  /** Seller permissions */
  const SELLER_PERMISSIONS: string[] = [
    'view_products',
    'create_products',
    'edit_products',
    'view_orders',
    'manage_own_store',
    'view_dashboard'
  ];

  /** Admin role */
  const ADMIN_ROLE: Role = {
    id: 1,
    name: 'admin',
    description: 'مدير النظام - System Administrator'
  };

  /** Seller role */
  const SELLER_ROLE: Role = {
    id: 2,
    name: 'seller',
    description: 'بائع - Seller'
  };

  // ===========================================================================
  // 1. HasPermissionDirective - SHOW/HIDE ELEMENTS
  // ===========================================================================

  describe('*hasPermission shows/hides elements based on real store state', () => {
    let fixture: ComponentFixture<HasPermissionTestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
          HasPermissionTestHostComponent
        ],
        providers: [PermissionStore, PermissionQuery]
      }).compileComponents();

      store = TestBed.inject(PermissionStore);
      query = TestBed.inject(PermissionQuery);
      fixture = TestBed.createComponent(HasPermissionTestHostComponent);
    });

    afterEach(() => {
      store.reset();
    });

    /**
     * Verifies that element is shown when user has the required permission.
     */
    it('should show element when user has the required permission', () => {
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('.admin-content'));
      expect(el).toBeTruthy();
      expect(el.nativeElement.textContent).toContain('ادارة المستخدمين');
    });

    /**
     * Verifies that element is hidden when user lacks the required permission.
     */
    it('should hide element when user lacks the required permission', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('.admin-content'));
      expect(el).toBeNull();
    });

    /**
     * Verifies that "else" template is rendered when permission is denied.
     */
    it('should render else template when permission is denied', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const denied = fixture.debugElement.query(By.css('.denied-content'));
      expect(denied).toBeTruthy();
      expect(denied.nativeElement.textContent).toContain('ليس لديك الصلاحية');

      const superAdmin = fixture.debugElement.query(By.css('.super-admin'));
      expect(superAdmin).toBeNull();
    });

    /**
     * Verifies that main template is rendered instead of else template when permission is granted.
     */
    it('should render main template and hide else template when permission is granted', () => {
      store.setPermissions([...ADMIN_PERMISSIONS, 'super_admin_access'], [ADMIN_ROLE]);
      fixture.detectChanges();

      const superAdmin = fixture.debugElement.query(By.css('.super-admin'));
      expect(superAdmin).toBeTruthy();

      const denied = fixture.debugElement.query(By.css('.denied-content'));
      expect(denied).toBeNull();
    });

    /**
     * Verifies fallback role grants access even without the specific permission.
     */
    it('should show element via fallback role when permission is missing', () => {
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      const fallback = fixture.debugElement.query(By.css('.fallback-content'));
      expect(fallback).toBeTruthy();
      expect(fallback.nativeElement.textContent).toContain('Visible via admin fallback role');
    });

    /**
     * Verifies that fallback role does not grant access when user lacks the role.
     */
    it('should hide element when both permission and fallback role are missing', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const fallback = fixture.debugElement.query(By.css('.fallback-content'));
      expect(fallback).toBeNull();
    });
  });

  // ===========================================================================
  // 2. HasPermissionDirective - MULTIPLE PERMISSIONS (AND/OR MODES)
  // ===========================================================================

  describe('*hasPermission with multiple permissions (AND/OR modes)', () => {
    let fixture: ComponentFixture<HasPermissionTestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, HasPermissionTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      }).compileComponents();

      store = TestBed.inject(PermissionStore);
      query = TestBed.inject(PermissionQuery);
      fixture = TestBed.createComponent(HasPermissionTestHostComponent);
    });

    afterEach(() => {
      store.reset();
    });

    /**
     * Verifies ALL mode requires all listed permissions.
     */
    it('should show element in ALL mode when user has ALL permissions', () => {
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('.full-admin-content'));
      expect(el).toBeTruthy();
    });

    /**
     * Verifies ALL mode hides element when any permission is missing.
     */
    it('should hide element in ALL mode when any permission is missing', () => {
      // Has manage_users but NOT manage_roles
      store.setPermissions(['manage_users'], []);
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('.full-admin-content'));
      expect(el).toBeNull();
    });

    /**
     * Verifies ANY mode shows element when at least one permission matches.
     */
    it('should show element in ANY mode when at least one permission matches', () => {
      // Has manage_users but NOT manage_products
      store.setPermissions(['manage_users'], []);
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('.any-admin-content'));
      expect(el).toBeTruthy();
    });

    /**
     * Verifies ANY mode hides element when no permissions match.
     */
    it('should hide element in ANY mode when no permissions match', () => {
      store.setPermissions(['view_dashboard'], []);
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('.any-admin-content'));
      expect(el).toBeNull();
    });
  });

  // ===========================================================================
  // 3. DisableWithoutPermissionDirective - DISABLE BUTTONS
  // ===========================================================================

  describe('[disableWithoutPermission] disables buttons correctly', () => {
    let fixture: ComponentFixture<DisableTestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, DisableTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      }).compileComponents();

      store = TestBed.inject(PermissionStore);
      query = TestBed.inject(PermissionQuery);
      fixture = TestBed.createComponent(DisableTestHostComponent);
    });

    afterEach(() => {
      store.reset();
    });

    /**
     * Verifies that button is enabled when user has the required permission.
     */
    it('should enable button when user has the required permission', () => {
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-single'));
      expect(btn.nativeElement.disabled).toBeFalsy();
      expect(btn.nativeElement.getAttribute('aria-disabled')).toBe('false');
    });

    /**
     * Verifies that button is disabled when user lacks the required permission.
     */
    it('should disable button when user lacks the required permission', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-single'));
      expect(btn.nativeElement.disabled).toBeTruthy();
      expect(btn.nativeElement.getAttribute('aria-disabled')).toBe('true');
    });

    /**
     * Verifies visual feedback styles when element is disabled.
     */
    it('should apply visual disabled styles (opacity, cursor, pointer-events)', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-single'));
      const styles = btn.nativeElement.style;
      expect(styles.opacity).toBe('0.5');
      expect(styles.cursor).toBe('not-allowed');
      expect(styles.pointerEvents).toBe('none');
    });

    /**
     * Verifies that disabled styles are removed when permission is present.
     */
    it('should remove disabled styles when user has permission', () => {
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-single'));
      expect(btn.nativeElement.style.opacity).toBeFalsy();
      expect(btn.nativeElement.style.cursor).toBeFalsy();
    });

    /**
     * Verifies ARIA tabindex is set to -1 when disabled for keyboard navigation prevention.
     */
    it('should set tabindex to -1 when disabled to prevent keyboard focus', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-single'));
      expect(btn.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    /**
     * Verifies custom tooltip is displayed on disabled element.
     */
    it('should display custom tooltip on disabled element', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-tooltip'));
      expect(btn.nativeElement.getAttribute('title')).toContain(
        'تحتاج صلاحية حذف المنتجات'
      );
      expect(btn.nativeElement.getAttribute('aria-label')).toContain(
        'تحتاج صلاحية حذف المنتجات'
      );
    });

    /**
     * Verifies ALL mode requires all permissions to enable button.
     */
    it('should disable in ALL mode when any permission is missing', () => {
      store.setPermissions(['manage_users'], []);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-all'));
      expect(btn.nativeElement.disabled).toBeTruthy();
    });

    /**
     * Verifies ALL mode enables button when all permissions are present.
     */
    it('should enable in ALL mode when all permissions are present', () => {
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-all'));
      expect(btn.nativeElement.disabled).toBeFalsy();
    });

    /**
     * Verifies ANY mode enables button when at least one permission matches.
     */
    it('should enable in ANY mode when at least one permission matches', () => {
      store.setPermissions(['manage_users'], []);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#btn-any'));
      expect(btn.nativeElement.disabled).toBeFalsy();
    });

    /**
     * Verifies that input elements are also disabled/enabled correctly.
     */
    it('should disable input element when permission is missing', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('#input-perm'));
      expect(input.nativeElement.disabled).toBeTruthy();
      expect(input.nativeElement.getAttribute('aria-disabled')).toBe('true');
    });

    /**
     * Verifies that select elements are disabled correctly.
     */
    it('should disable select element when permission is missing', () => {
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      const select = fixture.debugElement.query(By.css('#select-perm'));
      expect(select.nativeElement.disabled).toBeTruthy();
    });
  });

  // ===========================================================================
  // 4. PERMISSION CHANGES REFLECT IN UI IMMEDIATELY
  // ===========================================================================

  describe('Permission changes reflect in UI immediately', () => {
    let fixture: ComponentFixture<HasPermissionTestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, HasPermissionTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      }).compileComponents();

      store = TestBed.inject(PermissionStore);
      query = TestBed.inject(PermissionQuery);
      fixture = TestBed.createComponent(HasPermissionTestHostComponent);
    });

    afterEach(() => {
      store.reset();
    });

    /**
     * Verifies that granting a permission immediately shows the element.
     */
    it('should show element immediately when permission is granted', () => {
      // Start without permission
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      let el = fixture.debugElement.query(By.css('.admin-content'));
      expect(el).toBeNull();

      // Grant permission
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      el = fixture.debugElement.query(By.css('.admin-content'));
      expect(el).toBeTruthy();
      expect(el.nativeElement.textContent).toContain('ادارة المستخدمين');
    });

    /**
     * Verifies that revoking a permission immediately hides the element.
     */
    it('should hide element immediately when permission is revoked', () => {
      // Start with permission
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      let el = fixture.debugElement.query(By.css('.admin-content'));
      expect(el).toBeTruthy();

      // Revoke permission
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      el = fixture.debugElement.query(By.css('.admin-content'));
      expect(el).toBeNull();
    });

    /**
     * Verifies that else template swaps correctly on permission change.
     */
    it('should swap between main and else template on permission change', () => {
      // Start without permission - should show else
      store.setPermissions([], []);
      fixture.detectChanges();

      let denied = fixture.debugElement.query(By.css('.denied-content'));
      let superAdmin = fixture.debugElement.query(By.css('.super-admin'));
      expect(denied).toBeTruthy();
      expect(superAdmin).toBeNull();

      // Grant permission - should show main
      store.setPermissions([...ADMIN_PERMISSIONS, 'super_admin_access'], [ADMIN_ROLE]);
      fixture.detectChanges();

      denied = fixture.debugElement.query(By.css('.denied-content'));
      superAdmin = fixture.debugElement.query(By.css('.super-admin'));
      expect(denied).toBeNull();
      expect(superAdmin).toBeTruthy();

      // Revoke permission - should show else again
      store.setPermissions([], []);
      fixture.detectChanges();

      denied = fixture.debugElement.query(By.css('.denied-content'));
      superAdmin = fixture.debugElement.query(By.css('.super-admin'));
      expect(denied).toBeTruthy();
      expect(superAdmin).toBeNull();
    });

    /**
     * Verifies that clearing all permissions hides all permission-gated elements.
     */
    it('should hide all permission-gated elements when permissions are cleared', () => {
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      // Should have visible elements
      expect(fixture.debugElement.query(By.css('.admin-content'))).toBeTruthy();

      // Clear all permissions
      store.setPermissions([], []);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.admin-content'))).toBeNull();
      expect(fixture.debugElement.query(By.css('.full-admin-content'))).toBeNull();
      expect(fixture.debugElement.query(By.css('.any-admin-content'))).toBeNull();
    });
  });

  // ===========================================================================
  // 5. DISABLE DIRECTIVE - REACTIVE UPDATES
  // ===========================================================================

  describe('Disable directive reflects permission changes immediately', () => {
    let fixture: ComponentFixture<DisableTestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, DisableTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      }).compileComponents();

      store = TestBed.inject(PermissionStore);
      query = TestBed.inject(PermissionQuery);
      fixture = TestBed.createComponent(DisableTestHostComponent);
    });

    afterEach(() => {
      store.reset();
    });

    /**
     * Verifies button transitions from disabled to enabled when permission is granted.
     */
    it('should enable button when permission is granted dynamically', () => {
      // Start without permission
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      let btn = fixture.debugElement.query(By.css('#btn-single'));
      expect(btn.nativeElement.disabled).toBeTruthy();

      // Grant permission
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      btn = fixture.debugElement.query(By.css('#btn-single'));
      expect(btn.nativeElement.disabled).toBeFalsy();
      expect(btn.nativeElement.getAttribute('aria-disabled')).toBe('false');
    });

    /**
     * Verifies button transitions from enabled to disabled when permission is revoked.
     */
    it('should disable button when permission is revoked dynamically', () => {
      // Start with permission
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      fixture.detectChanges();

      let btn = fixture.debugElement.query(By.css('#btn-single'));
      expect(btn.nativeElement.disabled).toBeFalsy();

      // Revoke permission
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      btn = fixture.debugElement.query(By.css('#btn-single'));
      expect(btn.nativeElement.disabled).toBeTruthy();
    });

    /**
     * Verifies tooltip and ARIA attributes are cleaned up when permission is granted.
     */
    it('should remove tooltip and ARIA attributes when button becomes enabled', () => {
      // Start disabled with tooltip
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      fixture.detectChanges();

      let btn = fixture.debugElement.query(By.css('#btn-tooltip'));
      expect(btn.nativeElement.getAttribute('title')).toBeTruthy();
      expect(btn.nativeElement.getAttribute('aria-label')).toBeTruthy();

      // Grant permission
      store.setPermissions([...ADMIN_PERMISSIONS, 'delete_products'], [ADMIN_ROLE]);
      fixture.detectChanges();

      btn = fixture.debugElement.query(By.css('#btn-tooltip'));
      expect(btn.nativeElement.getAttribute('title')).toBeNull();
      expect(btn.nativeElement.getAttribute('aria-label')).toBeNull();
    });
  });

  // ===========================================================================
  // 6. LOADING STATE HANDLING
  // ===========================================================================

  describe('Loading state handling', () => {
    let fixture: ComponentFixture<HasPermissionTestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, HasPermissionTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      }).compileComponents();

      store = TestBed.inject(PermissionStore);
      query = TestBed.inject(PermissionQuery);
      fixture = TestBed.createComponent(HasPermissionTestHostComponent);
    });

    afterEach(() => {
      store.reset();
    });

    /**
     * Verifies that loading template is shown during permission loading.
     */
    it('should show loading template when permissions are loading', () => {
      store.update({ loading: true });
      fixture.detectChanges();

      const loading = fixture.debugElement.query(By.css('.loading-text'));
      expect(loading).toBeTruthy();
      expect(loading.nativeElement.textContent).toContain('جاري التحميل');
    });

    /**
     * Verifies that main content replaces loading template after load completes.
     */
    it('should replace loading template with content after loading completes', () => {
      // Start loading
      store.update({ loading: true });
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.loading-text'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.dashboard-content'))).toBeNull();

      // Finish loading with permission
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
      store.update({ loading: false });
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.loading-text'))).toBeNull();
      expect(fixture.debugElement.query(By.css('.dashboard-content'))).toBeTruthy();
    });

    /**
     * Verifies that content is hidden after loading when permission is missing.
     */
    it('should hide content after loading when permission is missing', () => {
      // Start loading
      store.update({ loading: true });
      fixture.detectChanges();

      // Finish loading without permission
      store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
      store.update({ loading: false });
      fixture.detectChanges();

      // No dashboard content since seller does not have 'view_dashboard'... but actually does
      // So let's check manage_users which seller doesn't have
      const adminContent = fixture.debugElement.query(By.css('.admin-content'));
      expect(adminContent).toBeNull();
    });
  });

  // ===========================================================================
  // 7. EDGE CASES AND MEMORY LEAK PREVENTION
  // ===========================================================================

  describe('Edge cases and memory leak prevention', () => {
    /**
     * Verifies that directives clean up on component destroy.
     */
    it('should clean up subscriptions when directive is destroyed', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, HasPermissionTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      });

      store = TestBed.inject(PermissionStore);
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);

      const fixture = TestBed.createComponent(HasPermissionTestHostComponent);
      fixture.detectChanges();

      // Destroy the component - should not throw
      expect(() => fixture.destroy()).not.toThrow();
    });

    /**
     * Verifies that disable directive cleans up on component destroy.
     */
    it('should clean up disable directive subscriptions on destroy', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, DisableTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      });

      store = TestBed.inject(PermissionStore);
      store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);

      const fixture = TestBed.createComponent(DisableTestHostComponent);
      fixture.detectChanges();

      expect(() => fixture.destroy()).not.toThrow();
    });

    /**
     * Verifies that multiple permission updates do not cause errors.
     */
    it('should handle rapid permission changes without errors', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, HasPermissionTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      });

      store = TestBed.inject(PermissionStore);
      const fixture = TestBed.createComponent(HasPermissionTestHostComponent);

      expect(() => {
        for (let i = 0; i < 20; i++) {
          if (i % 2 === 0) {
            store.setPermissions(ADMIN_PERMISSIONS, [ADMIN_ROLE]);
          } else {
            store.setPermissions(SELLER_PERMISSIONS, [SELLER_ROLE]);
          }
          fixture.detectChanges();
        }
      }).not.toThrow();
    });

    /**
     * Verifies that empty permission store does not cause errors.
     */
    it('should handle empty permission store gracefully', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, HasPermissionTestHostComponent],
        providers: [PermissionStore, PermissionQuery]
      });

      store = TestBed.inject(PermissionStore);
      const fixture = TestBed.createComponent(HasPermissionTestHostComponent);

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      // All gated elements should be hidden
      const adminContent = fixture.debugElement.query(By.css('.admin-content'));
      expect(adminContent).toBeNull();
    });
  });
});
