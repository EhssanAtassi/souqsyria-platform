import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { HasPermissionDirective } from './has-permission.directive';
import { PermissionQuery } from '../../store/permissions/permission.query';
import { BehaviorSubject, of } from 'rxjs';

/**
 * Test component for HasPermissionDirective
 *
 * Provides test templates for various directive scenarios
 */
@Component({
  selector: 'app-test-has-permission',
  standalone: true,
  imports: [HasPermissionDirective],
  template: `
    <!-- Single Permission Test -->
    <div *hasPermission="singlePermission" id="single-permission-content">
      <span id="protected-content">Protected Content</span>
    </div>

    <!-- Multiple Permissions (ALL mode) Test -->
    <div *hasPermission="multiplePermissions; mode: permissionModeAll" id="multiple-all-content">
      <span id="all-permissions-content">All Permissions Content</span>
    </div>

    <!-- Multiple Permissions (ANY mode) Test -->
    <div *hasPermission="multiplePermissions; mode: permissionModeAny" id="multiple-any-content">
      <span id="any-permissions-content">Any Permissions Content</span>
    </div>

    <!-- With Else Template -->
    <div *hasPermission="singlePermission; else: elseTemplate" id="with-else-content">
      <span id="main-content">Main Content</span>
    </div>
    <ng-template #elseTemplate>
      <span id="else-content">Access Denied</span>
    </ng-template>

    <!-- With Loading Template -->
    <div *hasPermission="singlePermission; loading: loadingTemplate" id="with-loading-content">
      <span id="loaded-content">Loaded Content</span>
    </div>
    <ng-template #loadingTemplate>
      <span id="loading-content">Loading...</span>
    </ng-template>

    <!-- With Fallback Role -->
    <div *hasPermission="singlePermission; fallbackRole: fallbackRole" id="with-fallback-content">
      <span id="fallback-content">Fallback Content</span>
    </div>

    <!-- Empty Permission -->
    <div *hasPermission="emptyPermission" id="empty-permission-content">
      <span id="empty-content">Empty Permission Content</span>
    </div>

    <!-- Null Permission -->
    <div *hasPermission="nullPermission" id="null-permission-content">
      <span id="null-content">Null Permission Content</span>
    </div>
  `
})
class TestHasPermissionComponent {
  singlePermission = 'manage_users';
  multiplePermissions = ['perm1', 'perm2'];
  permissionModeAll: 'all' = 'all';
  permissionModeAny: 'any' = 'any';
  fallbackRole = 'admin';
  emptyPermission = '';
  nullPermission: any = null;

  @ViewChild('elseTemplate', { read: TemplateRef }) elseTemplate!: TemplateRef<any>;
  @ViewChild('loadingTemplate', { read: TemplateRef }) loadingTemplate!: TemplateRef<any>;
}

/**
 * HasPermissionDirective Test Suite
 *
 * Comprehensive tests for structural directive that shows/hides elements
 * based on user permissions with support for loading states, else templates,
 * and role-based fallbacks.
 */
describe('HasPermissionDirective', () => {
  let component: TestHasPermissionComponent;
  let fixture: ComponentFixture<TestHasPermissionComponent>;
  let mockPermissionQuery: jasmine.SpyObj<PermissionQuery>;
  let loadingSubject: BehaviorSubject<boolean>;

  /**
   * Helper: Get element from fixture by CSS selector
   */
  function getElement(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  /**
   * Helper: Check if element is visible in DOM
   */
  function isElementVisible(selector: string): boolean {
    fixture.detectChanges();
    return getElement(selector) !== null;
  }

  /**
   * Helper: Trigger change detection and wait for updates
   */
  function detectChanges(): void {
    fixture.detectChanges();
  }

  beforeEach(async () => {
    // Create loading subject for reactive testing
    loadingSubject = new BehaviorSubject<boolean>(false);

    // Create mock PermissionQuery with spy methods
    mockPermissionQuery = jasmine.createSpyObj('PermissionQuery', [
      'hasPermission',
      'hasAllPermissions',
      'hasAnyPermission',
      'hasRole'
    ]);

    // Set default loading$ observable
    Object.defineProperty(mockPermissionQuery, 'loading$', {
      get: () => loadingSubject.asObservable(),
      configurable: true
    });

    await TestBed.configureTestingModule({
      imports: [HasPermissionDirective, TestHasPermissionComponent],
      providers: [
        { provide: PermissionQuery, useValue: mockPermissionQuery }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHasPermissionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    loadingSubject.complete();
  });

  /**
   * ==================================================================
   * GROUP 1: Single Permission Tests (4 cases)
   * ==================================================================
   */
  describe('Single Permission', () => {
    it('should render element when user has permission', () => {
      // Arrange: User has the required permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be visible
      expect(isElementVisible('#protected-content')).toBe(true);
      expect(getElement('#protected-content')?.textContent?.trim()).toBe('Protected Content');
    });

    it('should remove element when user lacks permission', () => {
      // Arrange: User does NOT have the required permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should NOT be in DOM (completely removed)
      expect(isElementVisible('#protected-content')).toBe(false);
      expect(getElement('#protected-content')).toBeNull();
    });

    it('should update view when permissions change', () => {
      // Arrange: Start with no permission
      const permissionSubject = new BehaviorSubject<boolean>(false);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Act: Initial render (no permission)
      detectChanges();

      // Assert: Element should be hidden
      expect(isElementVisible('#protected-content')).toBe(false);

      // Act: Grant permission
      permissionSubject.next(true);
      detectChanges();

      // Assert: Element should now be visible
      expect(isElementVisible('#protected-content')).toBe(true);

      // Act: Revoke permission
      permissionSubject.next(false);
      detectChanges();

      // Assert: Element should be hidden again
      expect(isElementVisible('#protected-content')).toBe(false);

      permissionSubject.complete();
    });

    it('should handle empty permission string', () => {
      // Arrange: Permission is empty string
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element with empty permission should be hidden
      expect(isElementVisible('#empty-content')).toBe(false);
      expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['']);
    });
  });

  /**
   * ==================================================================
   * GROUP 2: Multiple Permissions with AND Logic (3 cases)
   * ==================================================================
   */
  describe('Multiple Permissions (AND Logic)', () => {
    it('should render when user has ALL permissions', () => {
      // Arrange: User has all required permissions
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be visible
      expect(isElementVisible('#all-permissions-content')).toBe(true);
      expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['perm1', 'perm2']);
    });

    it('should hide when user lacks ANY permission', () => {
      // Arrange: User is missing at least one permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be hidden
      expect(isElementVisible('#all-permissions-content')).toBe(false);
      expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['perm1', 'perm2']);
    });

    it('should default to AND mode when mode not specified', () => {
      // Arrange: Create component with default mode
      @Component({
        selector: 'app-test-default-mode',
        standalone: true,
        imports: [HasPermissionDirective],
        template: `
          <div *hasPermission="['perm1', 'perm2']" id="default-mode-content">
            Default Mode Content
          </div>
        `
      })
      class TestDefaultModeComponent {}

      const defaultModeFixture = TestBed.createComponent(TestDefaultModeComponent);
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      defaultModeFixture.detectChanges();

      // Assert: Should call hasAllPermissions (not hasAnyPermission)
      expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['perm1', 'perm2']);
      expect(mockPermissionQuery.hasAnyPermission).not.toHaveBeenCalled();
    });
  });

  /**
   * ==================================================================
   * GROUP 3: Multiple Permissions with OR Logic (2 cases)
   * ==================================================================
   */
  describe('Multiple Permissions (OR Logic)', () => {
    it('should render when user has ANY permission', () => {
      // Arrange: User has at least one permission
      mockPermissionQuery.hasAnyPermission.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be visible
      expect(isElementVisible('#any-permissions-content')).toBe(true);
      expect(mockPermissionQuery.hasAnyPermission).toHaveBeenCalledWith(['perm1', 'perm2']);
    });

    it('should hide when user has NONE of the permissions', () => {
      // Arrange: User has no permissions
      mockPermissionQuery.hasAnyPermission.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be hidden
      expect(isElementVisible('#any-permissions-content')).toBe(false);
      expect(mockPermissionQuery.hasAnyPermission).toHaveBeenCalledWith(['perm1', 'perm2']);
    });
  });

  /**
   * ==================================================================
   * GROUP 4: Loading State (2 cases)
   * ==================================================================
   */
  describe('Loading State', () => {
    it('should hide element while permissions are loading', () => {
      // Arrange: Permissions are loading
      loadingSubject.next(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Main content should be hidden (no loading template provided for this test)
      expect(isElementVisible('#protected-content')).toBe(false);
    });

    it('should show element after loading completes if user has permission', () => {
      // Arrange: Start with loading state
      loadingSubject.next(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Initial render (loading)
      detectChanges();
      expect(isElementVisible('#protected-content')).toBe(false);

      // Act: Complete loading
      loadingSubject.next(false);
      detectChanges();

      // Assert: Element should now be visible
      expect(isElementVisible('#protected-content')).toBe(true);
    });
  });

  /**
   * ==================================================================
   * GROUP 5: Else Template (2 cases)
   * ==================================================================
   */
  describe('Else Template', () => {
    it('should show else template when user lacks permission', () => {
      // Arrange: User does not have permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Main content hidden, else template visible
      expect(isElementVisible('#main-content')).toBe(false);
      expect(isElementVisible('#else-content')).toBe(true);
      expect(getElement('#else-content')?.textContent?.trim()).toBe('Access Denied');
    });

    it('should show main template when user has permission', () => {
      // Arrange: User has permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Main content visible, else template hidden
      expect(isElementVisible('#main-content')).toBe(true);
      expect(isElementVisible('#else-content')).toBe(false);
    });
  });

  /**
   * ==================================================================
   * GROUP 6: Loading Template (2 cases)
   * ==================================================================
   */
  describe('Loading Template', () => {
    it('should show loading template while permissions are loading', () => {
      // Arrange: Permissions are loading
      loadingSubject.next(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Loading template visible, main content hidden
      expect(isElementVisible('#loading-content')).toBe(true);
      expect(isElementVisible('#loaded-content')).toBe(false);
      expect(getElement('#loading-content')?.textContent?.trim()).toBe('Loading...');
    });

    it('should replace loading template with main content after loading', () => {
      // Arrange: Start with loading
      loadingSubject.next(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Initial render (loading)
      detectChanges();
      expect(isElementVisible('#loading-content')).toBe(true);

      // Act: Complete loading
      loadingSubject.next(false);
      detectChanges();

      // Assert: Main content visible, loading template hidden
      expect(isElementVisible('#loaded-content')).toBe(true);
      expect(isElementVisible('#loading-content')).toBe(false);
    });
  });

  /**
   * ==================================================================
   * GROUP 7: Fallback Role (2 cases)
   * ==================================================================
   */
  describe('Fallback Role', () => {
    it('should show content when permission check fails but user has fallback role', () => {
      // Arrange: Permission check fails, but role check succeeds
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));
      mockPermissionQuery.hasRole.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Content should be visible (fallback role granted access)
      expect(isElementVisible('#fallback-content')).toBe(true);
      expect(mockPermissionQuery.hasRole).toHaveBeenCalledWith('admin');
    });

    it('should hide content when both permission and fallback role checks fail', () => {
      // Arrange: Both permission and role checks fail
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));
      mockPermissionQuery.hasRole.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Content should be hidden
      expect(isElementVisible('#fallback-content')).toBe(false);
      expect(mockPermissionQuery.hasRole).toHaveBeenCalledWith('admin');
    });
  });

  /**
   * ==================================================================
   * GROUP 8: Memory Management (2 cases)
   * ==================================================================
   */
  describe('Observable Unsubscription', () => {
    it('should unsubscribe when directive is destroyed', () => {
      // Arrange: Create subscription spy
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Track subscription
      let subscriptionCount = 0;
      const originalSubscribe = permissionSubject.subscribe.bind(permissionSubject);
      spyOn(permissionSubject, 'subscribe').and.callFake((...args: any[]) => {
        subscriptionCount++;
        return originalSubscribe(...args);
      });

      // Act: Create and destroy component
      detectChanges();
      fixture.destroy();

      // Assert: No active subscriptions after destroy
      expect(permissionSubject.observed).toBe(false);

      permissionSubject.complete();
    });

    it('should handle multiple permission changes without memory leaks', () => {
      // Arrange: Create observable that emits multiple times
      const permissionSubject = new BehaviorSubject<boolean>(false);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Act: Initial render
      detectChanges();

      // Act: Emit many permission changes
      for (let i = 0; i < 100; i++) {
        permissionSubject.next(i % 2 === 0);
        detectChanges();
      }

      // Act: Destroy component
      const initialObservers = permissionSubject.observers.length;
      fixture.destroy();

      // Assert: All subscriptions cleaned up
      expect(permissionSubject.observed).toBe(false);

      permissionSubject.complete();
    });
  });

  /**
   * ==================================================================
   * GROUP 9: Edge Cases (3 cases)
   * ==================================================================
   */
  describe('Edge Cases', () => {
    it('should handle null/undefined permissions gracefully', () => {
      // Arrange: Permission is null
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be hidden (null permission = no access)
      expect(isElementVisible('#null-content')).toBe(false);
    });

    it('should handle permission array with duplicates', () => {
      // Arrange: Create component with duplicate permissions
      @Component({
        selector: 'app-test-duplicates',
        standalone: true,
        imports: [HasPermissionDirective],
        template: `
          <div *hasPermission="['perm1', 'perm1', 'perm2']" id="duplicate-content">
            Duplicate Permissions Content
          </div>
        `
      })
      class TestDuplicatesComponent {}

      const duplicatesFixture = TestBed.createComponent(TestDuplicatesComponent);
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      duplicatesFixture.detectChanges();

      // Assert: Should handle duplicates correctly
      expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['perm1', 'perm1', 'perm2']);
    });

    it('should handle missing hasPermission input gracefully', () => {
      // Arrange: Create component without permission input
      @Component({
        selector: 'app-test-missing-input',
        standalone: true,
        imports: [HasPermissionDirective],
        template: `
          <div *hasPermission="undefined" id="missing-input-content">
            Missing Input Content
          </div>
        `
      })
      class TestMissingInputComponent {}

      const missingInputFixture = TestBed.createComponent(TestMissingInputComponent);

      // Spy on console.error
      spyOn(console, 'error');

      // Act: Trigger change detection
      missingInputFixture.detectChanges();

      // Assert: Should log error and not crash
      expect(console.error).toHaveBeenCalledWith(
        '[HasPermissionDirective] hasPermission input is required'
      );
    });
  });

  /**
   * ==================================================================
   * GROUP 10: Complex Scenarios (2 cases)
   * ==================================================================
   */
  describe('Complex Scenarios', () => {
    it('should handle combination of loading, else template, and fallback role', () => {
      // Arrange: Complex scenario with all features
      @Component({
        selector: 'app-test-complex',
        standalone: true,
        imports: [HasPermissionDirective],
        template: `
          <div *hasPermission="'admin_access';
                               loading: loading;
                               else: noAccess;
                               fallbackRole: 'superadmin'"
               id="complex-content">
            Admin Content
          </div>
          <ng-template #loading><span id="complex-loading">Loading...</span></ng-template>
          <ng-template #noAccess><span id="complex-denied">Access Denied</span></ng-template>
        `
      })
      class TestComplexComponent {}

      const complexFixture = TestBed.createComponent(TestComplexComponent);

      // Scenario 1: Loading state
      loadingSubject.next(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));
      mockPermissionQuery.hasRole.and.returnValue(of(false));
      complexFixture.detectChanges();
      expect(complexFixture.nativeElement.querySelector('#complex-loading')).not.toBeNull();

      // Scenario 2: No permission, no role
      loadingSubject.next(false);
      complexFixture.detectChanges();
      expect(complexFixture.nativeElement.querySelector('#complex-denied')).not.toBeNull();

      // Scenario 3: No permission, but has fallback role
      mockPermissionQuery.hasRole.and.returnValue(of(true));
      complexFixture.detectChanges();
      expect(complexFixture.nativeElement.querySelector('#complex-content')).not.toBeNull();
    });

    it('should handle rapid permission changes efficiently', () => {
      // Arrange: Create observable with rapid changes
      const permissionSubject = new BehaviorSubject<boolean>(false);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Track view updates
      let updateCount = 0;
      const originalClear = fixture.componentRef.location.nativeElement.querySelector;

      // Act: Initial render
      detectChanges();

      // Act: Rapid permission changes
      for (let i = 0; i < 50; i++) {
        permissionSubject.next(i % 2 === 0);
      }
      detectChanges();

      // Assert: Should handle rapid changes without errors
      expect(() => detectChanges()).not.toThrow();

      permissionSubject.complete();
    });
  });
});
