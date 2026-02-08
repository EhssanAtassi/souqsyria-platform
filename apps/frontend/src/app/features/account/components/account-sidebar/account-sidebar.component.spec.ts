/**
 * @fileoverview Unit tests for AccountSidebarComponent
 * @description Tests the account sidebar navigation component including component creation,
 * navigation items configuration, route links, disabled states, and active route behavior.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';

import { AccountSidebarComponent } from './account-sidebar.component';

describe('AccountSidebarComponent', () => {
  /** Component under test */
  let component: AccountSidebarComponent;

  /** Component fixture for DOM interaction */
  let fixture: ComponentFixture<AccountSidebarComponent>;

  /**
   * @description Test module setup - configures standalone component with routing stubs
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AccountSidebarComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Component Creation ──────────────────────────────────────────

  describe('Component Creation', () => {
    /**
     * @description Verifies the component is created successfully
     */
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  // ─── Navigation Items Configuration ──────────────────────────────

  describe('Navigation Items', () => {
    /**
     * @description Verifies navItems array contains exactly 4 items
     */
    it('should have 4 navigation items', () => {
      expect(component.navItems.length).toBe(4);
    });

    /**
     * @description Verifies the profile nav item configuration
     */
    it('should have profile nav item with correct properties', () => {
      const profileItem = component.navItems.find(
        (item) => item.route === '/account/profile'
      );

      expect(profileItem).toBeTruthy();
      expect(profileItem?.icon).toBe('person');
      expect(profileItem?.label).toBe('account.sidebar.profile');
      expect(profileItem?.disabled).toBe(false);
    });

    /**
     * @description Verifies the security nav item configuration
     */
    it('should have security nav item with correct properties', () => {
      const securityItem = component.navItems.find(
        (item) => item.route === '/account/security'
      );

      expect(securityItem).toBeTruthy();
      expect(securityItem?.icon).toBe('lock');
      expect(securityItem?.label).toBe('account.sidebar.security');
      expect(securityItem?.disabled).toBe(false);
    });

    /**
     * @description Verifies the orders nav item is disabled
     */
    it('should have orders nav item marked as disabled', () => {
      const ordersItem = component.navItems.find(
        (item) => item.route === '/account/orders'
      );

      expect(ordersItem).toBeTruthy();
      expect(ordersItem?.icon).toBe('shopping_bag');
      expect(ordersItem?.label).toBe('account.sidebar.orders');
      expect(ordersItem?.disabled).toBe(true);
    });

    /**
     * @description Verifies the addresses nav item is disabled
     */
    it('should have addresses nav item marked as disabled', () => {
      const addressesItem = component.navItems.find(
        (item) => item.route === '/account/addresses'
      );

      expect(addressesItem).toBeTruthy();
      expect(addressesItem?.icon).toBe('location_on');
      expect(addressesItem?.label).toBe('account.sidebar.addresses');
      expect(addressesItem?.disabled).toBe(true);
    });

    /**
     * @description Verifies that profile and security are the only enabled items
     */
    it('should have exactly 2 enabled navigation items', () => {
      const enabledItems = component.navItems.filter(
        (item) => !item.disabled
      );
      expect(enabledItems.length).toBe(2);
    });

    /**
     * @description Verifies the order of navigation items
     */
    it('should have navigation items in correct order', () => {
      const routes = component.navItems.map((item) => item.route);
      expect(routes).toEqual([
        '/account/profile',
        '/account/security',
        '/account/orders',
        '/account/addresses',
      ]);
    });
  });

  // ─── DOM Rendering ───────────────────────────────────────────────

  describe('DOM Rendering', () => {
    /**
     * @description Verifies navigation list is rendered in the DOM
     */
    it('should render a mat-nav-list element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-nav-list')).toBeTruthy();
    });

    /**
     * @description Verifies all nav items are rendered as anchor elements
     */
    it('should render 4 navigation link items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a[mat-list-item]');
      expect(links.length).toBe(4);
    });

    /**
     * @description Verifies that disabled items have the disabled CSS class
     */
    it('should apply disabled class on disabled nav items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const disabledLinks = compiled.querySelectorAll('a.disabled');
      expect(disabledLinks.length).toBe(2);
    });

    /**
     * @description Verifies that disabled items have aria-disabled attribute
     */
    it('should set aria-disabled on disabled nav items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a[mat-list-item]');

      // Orders (index 2) and Addresses (index 3) should be aria-disabled
      expect(links[2]?.getAttribute('aria-disabled')).toBe('true');
      expect(links[3]?.getAttribute('aria-disabled')).toBe('true');

      // Profile (index 0) and Security (index 1) should not be aria-disabled
      expect(links[0]?.getAttribute('aria-disabled')).toBe('false');
      expect(links[1]?.getAttribute('aria-disabled')).toBe('false');
    });

    /**
     * @description Verifies each nav item contains a mat-icon element
     */
    it('should render mat-icon for each nav item', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icons = compiled.querySelectorAll('mat-icon');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });

    /**
     * @description Verifies navigation links have routerLink attributes
     */
    it('should have routerLink attributes on nav links', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a[mat-list-item]');

      links.forEach((link) => {
        expect(link.hasAttribute('ng-reflect-router-link')).toBe(true);
      });
    });
  });

  // ─── Active Route Highlighting ───────────────────────────────────

  describe('Active Route Configuration', () => {
    /**
     * @description Verifies that routerLinkActive directive is applied
     */
    it('should have routerLinkActive attribute on nav links', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a[mat-list-item]');

      // All links should have routerLinkActive configured
      links.forEach((link) => {
        expect(
          link.hasAttribute('ng-reflect-router-link-active')
        ).toBe(true);
      });
    });

    /**
     * @description Verifies the active CSS class name is "active"
     */
    it('should use "active" as the routerLinkActive class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstLink = compiled.querySelector('a[mat-list-item]');

      // The routerLinkActive directive should be set to "active"
      expect(
        firstLink?.getAttribute('ng-reflect-router-link-active')
      ).toBe('active');
    });
  });
});
