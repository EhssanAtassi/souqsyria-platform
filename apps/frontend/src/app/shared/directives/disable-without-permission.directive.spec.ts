import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DisableWithoutPermissionDirective } from './disable-without-permission.directive';
import { PermissionQuery } from '../../store/permissions/permission.query';
import { BehaviorSubject, of } from 'rxjs';

/**
 * Test component for DisableWithoutPermissionDirective
 *
 * Provides test templates for various directive scenarios including
 * native HTML elements and Material Design components
 */
@Component({
  selector: 'app-test-disable-without-permission',
  standalone: true,
  imports: [DisableWithoutPermissionDirective],
  template: `
    <!-- Single Permission on Button -->
    <button
      id="btn-single"
      [disableWithoutPermission]="singlePermission"
    >
      Action Button
    </button>

    <!-- Multiple Permissions (ALL mode) on Button -->
    <button
      id="btn-all"
      [disableWithoutPermission]="multiplePermissions"
      [disableWithoutPermissionMode]="'all'"
    >
      All Permissions Button
    </button>

    <!-- Multiple Permissions (ANY mode) on Button -->
    <button
      id="btn-any"
      [disableWithoutPermission]="multiplePermissions"
      [disableWithoutPermissionMode]="'any'"
    >
      Any Permission Button
    </button>

    <!-- With Custom Tooltip -->
    <button
      id="btn-tooltip"
      [disableWithoutPermission]="singlePermission"
      [disableWithoutPermissionTooltip]="customTooltip"
    >
      Tooltip Button
    </button>

    <!-- Native Input Element -->
    <input
      id="input-native"
      type="text"
      [disableWithoutPermission]="singlePermission"
    />

    <!-- Material Button -->
    <button
      id="btn-material"
      mat-raised-button
      [disableWithoutPermission]="singlePermission"
    >
      Material Button
    </button>

    <!-- Material Icon Button -->
    <button
      id="btn-icon"
      mat-icon-button
      [disableWithoutPermission]="singlePermission"
    >
      Icon
    </button>

    <!-- Material FAB -->
    <button
      id="btn-fab"
      mat-fab
      [disableWithoutPermission]="singlePermission"
    >
      FAB
    </button>

    <!-- Select Element -->
    <select
      id="select-native"
      [disableWithoutPermission]="singlePermission"
    >
      <option>Option 1</option>
    </select>

    <!-- Textarea Element -->
    <textarea
      id="textarea-native"
      [disableWithoutPermission]="singlePermission"
    ></textarea>

    <!-- Form Field Container -->
    <div
      id="form-field"
      class="mat-form-field"
      [disableWithoutPermission]="singlePermission"
    >
      <input type="text" />
    </div>

    <!-- Checkbox -->
    <div
      id="checkbox"
      class="mat-checkbox"
      [disableWithoutPermission]="singlePermission"
    >
      <input type="checkbox" />
    </div>

    <!-- Slide Toggle -->
    <div
      id="slide-toggle"
      class="mat-slide-toggle"
      [disableWithoutPermission]="singlePermission"
    >
      <input type="checkbox" />
    </div>
  `
})
class TestDisableWithoutPermissionComponent {
  singlePermission = 'edit_products';
  multiplePermissions = ['perm1', 'perm2'];
  customTooltip = 'Custom permission required';
}

/**
 * DisableWithoutPermissionDirective Test Suite
 *
 * Comprehensive tests for attribute directive that disables elements
 * based on user permissions without hiding them from the UI.
 */
describe('DisableWithoutPermissionDirective', () => {
  let component: TestDisableWithoutPermissionComponent;
  let fixture: ComponentFixture<TestDisableWithoutPermissionComponent>;
  let mockPermissionQuery: jasmine.SpyObj<PermissionQuery>;

  /**
   * Helper: Get element from fixture by CSS selector
   */
  function getElement(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  /**
   * Helper: Check if element is disabled
   */
  function isElementDisabled(selector: string): boolean {
    fixture.detectChanges();
    const element = getElement(selector) as HTMLButtonElement | HTMLInputElement;
    return element?.disabled === true || element?.hasAttribute('disabled') === true;
  }

  /**
   * Helper: Check if element has tooltip
   */
  function hasTooltip(selector: string): boolean {
    fixture.detectChanges();
    const element = getElement(selector);
    return element?.hasAttribute('title') === true;
  }

  /**
   * Helper: Get tooltip text
   */
  function getTooltipText(selector: string): string | null {
    fixture.detectChanges();
    const element = getElement(selector);
    return element?.getAttribute('title') || null;
  }

  /**
   * Helper: Check if element has specific style
   */
  function hasStyle(selector: string, styleName: string, expectedValue: string): boolean {
    fixture.detectChanges();
    const element = getElement(selector) as HTMLElement;
    return element?.style.getPropertyValue(styleName) === expectedValue;
  }

  /**
   * Helper: Check if element is visible in DOM
   */
  function isElementVisible(selector: string): boolean {
    fixture.detectChanges();
    return getElement(selector) !== null;
  }

  /**
   * Helper: Get ARIA attribute value
   */
  function getAriaAttribute(selector: string, attribute: string): string | null {
    fixture.detectChanges();
    const element = getElement(selector);
    return element?.getAttribute(attribute) || null;
  }

  /**
   * Helper: Trigger change detection
   */
  function detectChanges(): void {
    fixture.detectChanges();
  }

  beforeEach(async () => {
    // Create mock PermissionQuery with spy methods
    mockPermissionQuery = jasmine.createSpyObj('PermissionQuery', [
      'hasPermission',
      'hasAllPermissions',
      'hasAnyPermission'
    ]);

    await TestBed.configureTestingModule({
      imports: [DisableWithoutPermissionDirective, TestDisableWithoutPermissionComponent],
      providers: [
        { provide: PermissionQuery, useValue: mockPermissionQuery }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestDisableWithoutPermissionComponent);
    component = fixture.componentInstance;
  });

  /**
   * ==================================================================
   * GROUP 1: Single Permission Tests (3 cases)
   * ==================================================================
   */
  describe('Single Permission', () => {
    it('should enable element when user has permission', () => {
      // Arrange: User has the required permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Button should be enabled
      expect(isElementDisabled('#btn-single')).toBe(false);
      expect(getElement('#btn-single')?.getAttribute('disabled')).toBeNull();
    });

    it('should disable element when user lacks permission', () => {
      // Arrange: User does NOT have the required permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Button should be disabled
      expect(isElementDisabled('#btn-single')).toBe(true);
      expect(getElement('#btn-single')?.getAttribute('disabled')).toBe('true');
    });

    it('should keep element visible when disabled', () => {
      // Arrange: User does NOT have permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should still be visible in DOM (not hidden)
      expect(isElementVisible('#btn-single')).toBe(true);
      expect(isElementDisabled('#btn-single')).toBe(true);
    });
  });

  /**
   * ==================================================================
   * GROUP 2: Visual Feedback (3 cases)
   * ==================================================================
   */
  describe('Visual Feedback', () => {
    it('should apply disabled styles when element is disabled', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Disabled styles applied
      expect(hasStyle('#btn-single', 'opacity', '0.5')).toBe(true);
      expect(hasStyle('#btn-single', 'cursor', 'not-allowed')).toBe(true);
      expect(hasStyle('#btn-single', 'pointer-events', 'none')).toBe(true);
    });

    it('should remove disabled styles when element is enabled', () => {
      // Arrange: Start disabled
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));
      detectChanges();

      // Act: Grant permission
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());
      detectChanges();

      // Assert: Styles should be removed
      const element = getElement('#btn-single') as HTMLElement;
      expect(element.style.opacity).toBe('');
      expect(element.style.cursor).toBe('');
      expect(element.style.pointerEvents).toBe('');

      permissionSubject.complete();
    });

    it('should apply visual feedback immediately on permission change', () => {
      // Arrange: Create observable for permission changes
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Act: Initial state (enabled)
      detectChanges();
      expect(isElementDisabled('#btn-single')).toBe(false);

      // Act: Revoke permission
      permissionSubject.next(false);
      detectChanges();

      // Assert: Disabled styles applied immediately
      expect(isElementDisabled('#btn-single')).toBe(true);
      expect(hasStyle('#btn-single', 'opacity', '0.5')).toBe(true);

      permissionSubject.complete();
    });
  });

  /**
   * ==================================================================
   * GROUP 3: Tooltip Integration (3 cases)
   * ==================================================================
   */
  describe('Tooltip Integration', () => {
    it('should add default tooltip when element is disabled', () => {
      // Arrange: User lacks permission, no custom tooltip
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Default tooltip should be added (via title attribute)
      expect(hasTooltip('#btn-single')).toBe(true);
      const tooltipText = getTooltipText('#btn-single');
      expect(tooltipText).toBeTruthy();
    });

    it('should add custom tooltip when element is disabled', () => {
      // Arrange: User lacks permission, custom tooltip provided
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Custom tooltip should be added
      expect(hasTooltip('#btn-tooltip')).toBe(true);
      expect(getTooltipText('#btn-tooltip')).toBe('Custom permission required');
    });

    it('should remove tooltip when element is enabled', () => {
      // Arrange: Start disabled with tooltip
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));
      detectChanges();
      expect(hasTooltip('#btn-tooltip')).toBe(true);

      // Act: Grant permission
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());
      detectChanges();

      // Assert: Tooltip should be removed
      expect(hasTooltip('#btn-tooltip')).toBe(false);
      expect(getTooltipText('#btn-tooltip')).toBeNull();

      permissionSubject.complete();
    });
  });

  /**
   * ==================================================================
   * GROUP 4: Accessibility (ARIA Attributes) (3 cases)
   * ==================================================================
   */
  describe('Accessibility (ARIA Attributes)', () => {
    it('should add aria-disabled="true" when disabled', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: ARIA disabled attribute set
      expect(getAriaAttribute('#btn-single', 'aria-disabled')).toBe('true');
    });

    it('should set aria-disabled="false" when enabled', () => {
      // Arrange: User has permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: ARIA disabled attribute set to false
      expect(getAriaAttribute('#btn-single', 'aria-disabled')).toBe('false');
    });

    it('should add descriptive aria-label when disabled', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: ARIA label should be added with description
      const ariaLabel = getAriaAttribute('#btn-single', 'aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('disabled');
    });

    it('should set tabindex="-1" when disabled to prevent keyboard focus', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Tabindex should be -1 to prevent keyboard navigation
      expect(getAriaAttribute('#btn-single', 'tabindex')).toBe('-1');
    });

    it('should remove tabindex when enabled', () => {
      // Arrange: Start disabled
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));
      detectChanges();
      expect(getAriaAttribute('#btn-single', 'tabindex')).toBe('-1');

      // Act: Grant permission
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());
      detectChanges();

      // Assert: Tabindex should be removed
      expect(getAriaAttribute('#btn-single', 'tabindex')).toBeNull();

      permissionSubject.complete();
    });
  });

  /**
   * ==================================================================
   * GROUP 5: Material Component Support (3 cases)
   * ==================================================================
   */
  describe('Material Component Support', () => {
    it('should disable Material button component', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Material button should be disabled with appropriate class
      expect(isElementDisabled('#btn-material')).toBe(true);
      const element = getElement('#btn-material');
      expect(element?.classList.contains('mat-button-disabled')).toBe(true);
    });

    it('should disable Material icon button component', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Material icon button should be disabled
      expect(isElementDisabled('#btn-icon')).toBe(true);
      const element = getElement('#btn-icon');
      expect(element?.classList.contains('mat-button-disabled')).toBe(true);
    });

    it('should disable Material FAB component', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Material FAB should be disabled
      expect(isElementDisabled('#btn-fab')).toBe(true);
      const element = getElement('#btn-fab');
      expect(element?.classList.contains('mat-button-disabled')).toBe(true);
    });
  });

  /**
   * ==================================================================
   * GROUP 6: Form Control Support (3 cases)
   * ==================================================================
   */
  describe('Form Control Support', () => {
    it('should disable native input element', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Input should be disabled
      expect(isElementDisabled('#input-native')).toBe(true);
    });

    it('should disable native select element', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Select should be disabled
      expect(isElementDisabled('#select-native')).toBe(true);
    });

    it('should disable native textarea element', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Textarea should be disabled
      expect(isElementDisabled('#textarea-native')).toBe(true);
    });
  });

  /**
   * ==================================================================
   * GROUP 7: Material Form Field Support (3 cases)
   * ==================================================================
   */
  describe('Material Form Field Support', () => {
    it('should disable input inside Material form field', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Input inside form field should be disabled
      const formField = getElement('#form-field');
      const input = formField?.querySelector('input') as HTMLInputElement;
      expect(input?.disabled).toBe(true);
    });

    it('should disable checkbox control', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Checkbox input should be disabled
      const checkbox = getElement('#checkbox');
      const input = checkbox?.querySelector('input') as HTMLInputElement;
      expect(input?.disabled).toBe(true);
    });

    it('should disable slide toggle control', () => {
      // Arrange: User lacks permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Slide toggle input should be disabled
      const toggle = getElement('#slide-toggle');
      const input = toggle?.querySelector('input') as HTMLInputElement;
      expect(input?.disabled).toBe(true);
    });
  });

  /**
   * ==================================================================
   * GROUP 8: Multiple Permissions (4 cases)
   * ==================================================================
   */
  describe('Multiple Permissions', () => {
    it('should enable when user has ALL permissions (ALL mode)', () => {
      // Arrange: User has all required permissions
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be enabled
      expect(isElementDisabled('#btn-all')).toBe(false);
      expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['perm1', 'perm2']);
    });

    it('should disable when user lacks ANY permission (ALL mode)', () => {
      // Arrange: User is missing at least one permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be disabled
      expect(isElementDisabled('#btn-all')).toBe(true);
      expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['perm1', 'perm2']);
    });

    it('should enable when user has ANY permission (ANY mode)', () => {
      // Arrange: User has at least one permission
      mockPermissionQuery.hasAnyPermission.and.returnValue(of(true));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be enabled
      expect(isElementDisabled('#btn-any')).toBe(false);
      expect(mockPermissionQuery.hasAnyPermission).toHaveBeenCalledWith(['perm1', 'perm2']);
    });

    it('should disable when user has NONE of the permissions (ANY mode)', () => {
      // Arrange: User has no permissions
      mockPermissionQuery.hasAnyPermission.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: Element should be disabled
      expect(isElementDisabled('#btn-any')).toBe(true);
      expect(mockPermissionQuery.hasAnyPermission).toHaveBeenCalledWith(['perm1', 'perm2']);
    });
  });

  /**
   * ==================================================================
   * GROUP 9: Dynamic Permission Updates (2 cases)
   * ==================================================================
   */
  describe('Dynamic Permission Updates', () => {
    it('should enable element when permission is granted', () => {
      // Arrange: Start with no permission
      const permissionSubject = new BehaviorSubject<boolean>(false);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Act: Initial render (disabled)
      detectChanges();
      expect(isElementDisabled('#btn-single')).toBe(true);

      // Act: Grant permission
      permissionSubject.next(true);
      detectChanges();

      // Assert: Element should now be enabled
      expect(isElementDisabled('#btn-single')).toBe(false);

      permissionSubject.complete();
    });

    it('should disable element when permission is revoked', () => {
      // Arrange: Start with permission
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Act: Initial render (enabled)
      detectChanges();
      expect(isElementDisabled('#btn-single')).toBe(false);

      // Act: Revoke permission
      permissionSubject.next(false);
      detectChanges();

      // Assert: Element should now be disabled
      expect(isElementDisabled('#btn-single')).toBe(true);

      permissionSubject.complete();
    });
  });

  /**
   * ==================================================================
   * GROUP 10: Memory Management (2 cases)
   * ==================================================================
   */
  describe('Memory Management', () => {
    it('should unsubscribe when directive is destroyed', () => {
      // Arrange: Create subscription spy
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

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
      fixture.destroy();

      // Assert: All subscriptions cleaned up
      expect(permissionSubject.observed).toBe(false);

      permissionSubject.complete();
    });
  });

  /**
   * ==================================================================
   * GROUP 11: Edge Cases (3 cases)
   * ==================================================================
   */
  describe('Edge Cases', () => {
    it('should handle missing directive input gracefully', () => {
      // Arrange: Create component without permission input
      @Component({
        selector: 'app-test-missing-input',
        standalone: true,
        imports: [DisableWithoutPermissionDirective],
        template: `
          <button id="btn-missing" [disableWithoutPermission]="undefined">
            Missing Input
          </button>
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
        '[DisableWithoutPermissionDirective] disableWithoutPermission input is required'
      );
    });

    it('should handle rapid permission toggles efficiently', () => {
      // Arrange: Create observable with rapid toggles
      const permissionSubject = new BehaviorSubject<boolean>(false);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Act: Initial render
      detectChanges();

      // Act: Rapid toggles
      for (let i = 0; i < 50; i++) {
        permissionSubject.next(i % 2 === 0);
      }
      detectChanges();

      // Assert: Should handle rapid changes without errors
      expect(() => detectChanges()).not.toThrow();

      permissionSubject.complete();
    });

    it('should work with elements that are already disabled', () => {
      // Arrange: Create component with pre-disabled element
      @Component({
        selector: 'app-test-pre-disabled',
        standalone: true,
        imports: [DisableWithoutPermissionDirective],
        template: `
          <button
            id="btn-pre-disabled"
            disabled
            [disableWithoutPermission]="'some_permission'"
          >
            Pre-disabled Button
          </button>
        `
      })
      class TestPreDisabledComponent {}

      const preDisabledFixture = TestBed.createComponent(TestPreDisabledComponent);
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(true));

      // Act: Trigger change detection
      preDisabledFixture.detectChanges();

      // Assert: Directive should override and enable if permission exists
      const button = preDisabledFixture.nativeElement.querySelector('#btn-pre-disabled');
      // Note: The directive removes the disabled attribute when permission is granted
      expect(button.hasAttribute('disabled')).toBe(false);
    });
  });

  /**
   * ==================================================================
   * GROUP 12: Complex Scenarios (2 cases)
   * ==================================================================
   */
  describe('Complex Scenarios', () => {
    it('should handle multiple directives on same page', () => {
      // Arrange: All elements start without permission
      mockPermissionQuery.hasAllPermissions.and.returnValue(of(false));

      // Act: Trigger change detection
      detectChanges();

      // Assert: All elements should be disabled
      expect(isElementDisabled('#btn-single')).toBe(true);
      expect(isElementDisabled('#input-native')).toBe(true);
      expect(isElementDisabled('#select-native')).toBe(true);

      // Act: Grant permission
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());
      detectChanges();

      // Assert: All elements should now be enabled
      expect(isElementDisabled('#btn-single')).toBe(false);
      expect(isElementDisabled('#input-native')).toBe(false);
      expect(isElementDisabled('#select-native')).toBe(false);

      permissionSubject.complete();
    });

    it('should maintain state consistency across rapid changes', () => {
      // Arrange: Create observable with state changes
      const permissionSubject = new BehaviorSubject<boolean>(true);
      mockPermissionQuery.hasAllPermissions.and.returnValue(permissionSubject.asObservable());

      // Act: Initial state (enabled)
      detectChanges();
      expect(isElementDisabled('#btn-single')).toBe(false);

      // Act: Toggle permission 10 times
      for (let i = 0; i < 10; i++) {
        permissionSubject.next(i % 2 === 0);
        detectChanges();
        const expectedDisabled = i % 2 !== 0;
        expect(isElementDisabled('#btn-single')).toBe(expectedDisabled);
      }

      permissionSubject.complete();
    });
  });
});
