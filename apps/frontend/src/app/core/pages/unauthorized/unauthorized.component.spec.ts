import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';
import { UnauthorizedComponent } from './unauthorized.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

/**
 * Test suite for UnauthorizedComponent
 *
 * @description
 * Tests the unauthorized page component including:
 * - Component initialization
 * - Query parameter parsing
 * - Navigation actions
 * - Display of error information
 * - Responsive behavior
 */
describe('UnauthorizedComponent', () => {
  let component: UnauthorizedComponent;
  let fixture: ComponentFixture<UnauthorizedComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    // Create mock services
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLocation = jasmine.createSpyObj('Location', ['back']);
    mockActivatedRoute = {
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [
        UnauthorizedComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null values', () => {
      expect(component.returnUrl()).toBeNull();
      expect(component.reason()).toBeNull();
      expect(component.requiredPermissions()).toEqual([]);
    });

    it('should parse query parameters on init', () => {
      mockActivatedRoute.queryParams = of({
        returnUrl: 'admin/users',
        reason: 'insufficient_permissions',
        required: 'manage_users,view_users'
      });

      component.ngOnInit();

      expect(component.returnUrl()).toBe('admin/users');
      expect(component.reason()).toBe('insufficient_permissions');
      expect(component.requiredPermissions()).toEqual(['manage_users', 'view_users']);
    });

    it('should handle missing query parameters gracefully', () => {
      mockActivatedRoute.queryParams = of({});

      component.ngOnInit();

      expect(component.returnUrl()).toBeNull();
      expect(component.reason()).toBeNull();
      expect(component.requiredPermissions()).toEqual([]);
    });

    it('should parse single permission correctly', () => {
      mockActivatedRoute.queryParams = of({
        required: 'manage_users'
      });

      component.ngOnInit();

      expect(component.requiredPermissions()).toEqual(['manage_users']);
    });

    it('should filter empty permissions from comma-separated list', () => {
      mockActivatedRoute.queryParams = of({
        required: 'manage_users,,view_users, '
      });

      component.ngOnInit();

      expect(component.requiredPermissions()).toEqual(['manage_users', 'view_users']);
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate back when goBack is called', () => {
      component.goBack();

      expect(mockLocation.back).toHaveBeenCalled();
    });

    it('should navigate to home when goHome is called', () => {
      component.goHome();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Reason Messages', () => {
    it('should return correct message for insufficient_permissions', () => {
      component.reason.set('insufficient_permissions');

      const message = component.getReasonMessage();

      expect(message).toBe('You do not have the required permissions to access this page.');
    });

    it('should return correct message for authentication_required', () => {
      component.reason.set('authentication_required');

      const message = component.getReasonMessage();

      expect(message).toBe('You must be authenticated to access this page.');
    });

    it('should return correct message for role_required', () => {
      component.reason.set('role_required');

      const message = component.getReasonMessage();

      expect(message).toBe('Your current role does not have access to this page.');
    });

    it('should return default message for unknown reason', () => {
      component.reason.set('unknown_reason');

      const message = component.getReasonMessage();

      expect(message).toBe('Access to this page is restricted.');
    });

    it('should return default message when reason is null', () => {
      component.reason.set(null);

      const message = component.getReasonMessage();

      expect(message).toBe('Access to this page is restricted.');
    });
  });

  describe('Template Rendering', () => {
    it('should display the main title', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('mat-card-title');

      expect(title?.textContent).toContain('Access Denied');
    });

    it('should display reason message in subtitle', () => {
      mockActivatedRoute.queryParams = of({
        reason: 'insufficient_permissions'
      });

      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const subtitle = compiled.querySelector('mat-card-subtitle');

      expect(subtitle?.textContent).toContain('You do not have the required permissions');
    });

    it('should display return URL when provided', () => {
      mockActivatedRoute.queryParams = of({
        returnUrl: 'admin/users'
      });

      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const returnInfo = compiled.querySelector('.return-info code');

      expect(returnInfo?.textContent).toContain('admin/users');
    });

    it('should not display return URL section when not provided', () => {
      mockActivatedRoute.queryParams = of({});

      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const returnInfo = compiled.querySelector('.return-info');

      expect(returnInfo).toBeNull();
    });

    it('should display required permissions when provided', () => {
      mockActivatedRoute.queryParams = of({
        required: 'manage_users,view_users'
      });

      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const permissionCodes = compiled.querySelectorAll('.permissions-list code');

      expect(permissionCodes.length).toBe(2);
      expect(permissionCodes[0].textContent).toContain('manage_users');
      expect(permissionCodes[1].textContent).toContain('view_users');
    });

    it('should not display permissions section when no permissions required', () => {
      mockActivatedRoute.queryParams = of({});

      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const permissionsInfo = compiled.querySelector('.permissions-info');

      expect(permissionsInfo).toBeNull();
    });

    it('should render both action buttons', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('mat-card-actions button');

      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Go Back');
      expect(buttons[1].textContent).toContain('Go to Home');
    });

    it('should trigger goBack when back button is clicked', () => {
      spyOn(component, 'goBack');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const backButton = compiled.querySelector('mat-card-actions button[color="primary"]') as HTMLButtonElement;
      backButton.click();

      expect(component.goBack).toHaveBeenCalled();
    });

    it('should have home icon in home button', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('mat-card-actions button');
      const homeButton = buttons[1];
      const homeIcon = homeButton.querySelector('mat-icon');

      expect(homeIcon?.textContent).toContain('home');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('mat-card-title');

      expect(title).toBeTruthy();
    });

    it('should have descriptive icons', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const icons = compiled.querySelectorAll('mat-icon');

      expect(icons.length).toBeGreaterThan(0);
      icons.forEach(icon => {
        expect(icon.textContent?.trim()).toBeTruthy();
      });
    });

    it('should have focusable action buttons', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');

      buttons.forEach(button => {
        expect(button.hasAttribute('disabled')).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long return URLs', () => {
      const longUrl = 'admin/users/detail/12345/edit/profile/settings/advanced/permissions/roles';
      mockActivatedRoute.queryParams = of({
        returnUrl: longUrl
      });

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.returnUrl()).toBe(longUrl);
    });

    it('should handle special characters in permissions', () => {
      mockActivatedRoute.queryParams = of({
        required: 'users:manage,users:view,roles:*'
      });

      component.ngOnInit();

      expect(component.requiredPermissions()).toEqual([
        'users:manage',
        'users:view',
        'roles:*'
      ]);
    });

    it('should handle multiple calls to ngOnInit', () => {
      mockActivatedRoute.queryParams = of({
        returnUrl: 'first/url'
      });

      component.ngOnInit();
      expect(component.returnUrl()).toBe('first/url');

      mockActivatedRoute.queryParams = of({
        returnUrl: 'second/url'
      });

      component.ngOnInit();
      expect(component.returnUrl()).toBe('second/url');
    });
  });
});
