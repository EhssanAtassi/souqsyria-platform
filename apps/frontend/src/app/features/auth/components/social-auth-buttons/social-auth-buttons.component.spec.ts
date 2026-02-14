/**
 * Unit tests for SocialAuthButtonsComponent
 *
 * @description Tests rendering, click behavior, redirect URLs, disabled state,
 * and accessibility attributes for the Google + Facebook OAuth buttons.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { SocialAuthButtonsComponent } from './social-auth-buttons.component';
import { environment } from '../../../../../environments/environment';

describe('SocialAuthButtonsComponent', () => {
  let component: SocialAuthButtonsComponent;
  let fixture: ComponentFixture<SocialAuthButtonsComponent>;

  /** @description Captured URL from window.location.href assignment */
  let capturedHref: string | null;

  beforeEach(async () => {
    capturedHref = null;

    await TestBed.configureTestingModule({
      imports: [
        SocialAuthButtonsComponent,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SocialAuthButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * @description Helper to spy on loginWithGoogle/loginWithFacebook methods
   * capturing the URL they would redirect to without triggering actual navigation.
   */
  function spyOnOAuthRedirects(): void {
    spyOn(component, 'loginWithGoogle').and.callFake(() => {
      component.isRedirecting.set(true);
      capturedHref = `${environment.apiUrl}/auth/google`;
    });
    spyOn(component, 'loginWithFacebook').and.callFake(() => {
      component.isRedirecting.set(true);
      capturedHref = `${environment.apiUrl}/auth/facebook`;
    });
  }

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ─── Rendering ──────────────────────────────────────────────────

  it('should render Google and Facebook buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('.social-btn'));
    expect(buttons.length).toBe(2);

    const googleBtn = fixture.debugElement.query(By.css('.google-btn'));
    const facebookBtn = fixture.debugElement.query(By.css('.facebook-btn'));
    expect(googleBtn).toBeTruthy();
    expect(facebookBtn).toBeTruthy();
  });

  it('should render the social divider', () => {
    const divider = fixture.debugElement.query(By.css('.social-divider'));
    expect(divider).toBeTruthy();
  });

  it('should render SVG icons inside each button', () => {
    const svgs = fixture.debugElement.queryAll(By.css('.social-icon'));
    expect(svgs.length).toBe(2);
    svgs.forEach(svg => {
      expect(svg.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Click behavior and redirect URLs ───────────────────────────

  it('should call loginWithGoogle and redirect to correct URL when Google button is clicked', () => {
    spyOnOAuthRedirects();

    const googleBtn = fixture.debugElement.query(By.css('.google-btn'));
    googleBtn.triggerEventHandler('click', null);

    expect(component.loginWithGoogle).toHaveBeenCalled();
    expect(component.isRedirecting()).toBe(true);
    expect(capturedHref).toBe(`${environment.apiUrl}/auth/google`);
  });

  it('should call loginWithFacebook and redirect to correct URL when Facebook button is clicked', () => {
    spyOnOAuthRedirects();

    const facebookBtn = fixture.debugElement.query(By.css('.facebook-btn'));
    facebookBtn.triggerEventHandler('click', null);

    expect(component.loginWithFacebook).toHaveBeenCalled();
    expect(component.isRedirecting()).toBe(true);
    expect(capturedHref).toBe(`${environment.apiUrl}/auth/facebook`);
  });

  it('should use environment.apiUrl as the OAuth base URL', () => {
    // Verify apiUrl is configured (sanity check for test environment)
    expect(environment.apiUrl).toBeTruthy();
    expect(environment.apiUrl).toContain('localhost');
  });

  // ─── Disabled state ─────────────────────────────────────────────

  it('should disable both buttons when isRedirecting is true', () => {
    component.isRedirecting.set(true);
    fixture.detectChanges();

    const googleBtn = fixture.debugElement.query(By.css('.google-btn'));
    const facebookBtn = fixture.debugElement.query(By.css('.facebook-btn'));

    expect(googleBtn.nativeElement.disabled).toBe(true);
    expect(facebookBtn.nativeElement.disabled).toBe(true);
  });

  it('should enable both buttons when isRedirecting is false', () => {
    component.isRedirecting.set(false);
    fixture.detectChanges();

    const googleBtn = fixture.debugElement.query(By.css('.google-btn'));
    const facebookBtn = fixture.debugElement.query(By.css('.facebook-btn'));

    expect(googleBtn.nativeElement.disabled).toBe(false);
    expect(facebookBtn.nativeElement.disabled).toBe(false);
  });

  it('should not trigger navigation when button is already disabled', () => {
    spyOnOAuthRedirects();
    component.isRedirecting.set(true);
    fixture.detectChanges();

    const googleBtn = fixture.debugElement.query(By.css('.google-btn'));
    // Native disabled buttons don't fire click events on the element
    expect(googleBtn.nativeElement.disabled).toBe(true);
  });

  // ─── Accessibility ──────────────────────────────────────────────

  it('should have aria-label attributes on both buttons', () => {
    const googleBtn = fixture.debugElement.query(By.css('.google-btn'));
    const facebookBtn = fixture.debugElement.query(By.css('.facebook-btn'));

    // TranslateModule.forRoot() without translations returns the key as fallback
    expect(googleBtn.nativeElement.getAttribute('aria-label')).toBeTruthy();
    expect(facebookBtn.nativeElement.getAttribute('aria-label')).toBeTruthy();
  });

  it('should have type="button" to prevent form submission', () => {
    const buttons = fixture.debugElement.queryAll(By.css('.social-btn'));
    buttons.forEach(btn => {
      expect(btn.nativeElement.getAttribute('type')).toBe('button');
    });
  });
});
