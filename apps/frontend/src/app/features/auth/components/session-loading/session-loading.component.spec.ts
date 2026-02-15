/**
 * @file session-loading.component.spec.ts
 * @description Unit tests for SessionLoadingComponent
 * Tests overlay mode, inline mode, accessibility, and responsive behavior
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SessionLoadingComponent } from './session-loading.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

/**
 * SessionLoadingComponent Test Suite
 *
 * @description Comprehensive tests for session loading component
 * Covers:
 * - Overlay mode rendering
 * - Inline mode rendering
 * - Progress bar modes (determinate/indeterminate)
 * - Message display
 * - Accessibility (ARIA attributes)
 * - Spinner sizes
 * - Color themes
 */
describe('SessionLoadingComponent', () => {
  let component: SessionLoadingComponent;
  let fixture: ComponentFixture<SessionLoadingComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SessionLoadingComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionLoadingComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Overlay Mode Tests
   */
  describe('Overlay Mode', () => {
    it('should display overlay when isLoading and overlay are true', () => {
      component.isLoading = true;
      component.overlay = true;
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement).toBeTruthy();
    });

    it('should not display overlay when isLoading is false', () => {
      component.isLoading = false;
      component.overlay = true;
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement).toBeFalsy();
    });

    it('should not display overlay when overlay is false', () => {
      component.isLoading = true;
      component.overlay = false;
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement).toBeFalsy();
    });

    it('should display spinner in overlay mode', () => {
      component.isLoading = true;
      component.overlay = true;
      fixture.detectChanges();

      const spinner = debugElement.query(By.css('.session-loading-overlay mat-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should display message in overlay mode when provided', () => {
      component.isLoading = true;
      component.overlay = true;
      component.message = 'Initializing session...';
      fixture.detectChanges();

      const messageElement = debugElement.query(By.css('.session-loading-message'));
      expect(messageElement).toBeTruthy();
      expect(messageElement.nativeElement.textContent).toContain('Initializing session...');
    });

    it('should not display message in overlay mode when not provided', () => {
      component.isLoading = true;
      component.overlay = true;
      component.message = undefined;
      fixture.detectChanges();

      const messageElement = debugElement.query(By.css('.session-loading-message'));
      expect(messageElement).toBeFalsy();
    });
  });

  /**
   * Inline Mode Tests
   */
  describe('Inline Mode', () => {
    it('should display inline mode when isLoading is true and overlay is false', () => {
      component.isLoading = true;
      component.overlay = false;
      fixture.detectChanges();

      const inlineElement = debugElement.query(By.css('.session-loading-inline'));
      expect(inlineElement).toBeTruthy();
    });

    it('should display progress bar in inline mode', () => {
      component.isLoading = true;
      component.overlay = false;
      fixture.detectChanges();

      const progressBar = debugElement.query(By.css('.session-progress-bar'));
      expect(progressBar).toBeTruthy();
    });

    it('should display indeterminate progress bar by default', () => {
      component.isLoading = true;
      component.overlay = false;
      component.mode = 'indeterminate';
      fixture.detectChanges();

      const progressBar = debugElement.query(By.css('mat-progress-bar[mode="indeterminate"]'));
      expect(progressBar).toBeTruthy();
    });

    it('should display determinate progress bar when mode is determinate', () => {
      component.isLoading = true;
      component.overlay = false;
      component.mode = 'determinate';
      component.progress = 50;
      fixture.detectChanges();

      const progressBar = debugElement.query(By.css('mat-progress-bar[mode="determinate"]'));
      expect(progressBar).toBeTruthy();
    });

    it('should display spinner in inline mode', () => {
      component.isLoading = true;
      component.overlay = false;
      fixture.detectChanges();

      const spinner = debugElement.query(By.css('.session-loading-inline mat-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should display message in inline mode when provided', () => {
      component.isLoading = true;
      component.overlay = false;
      component.message = 'Validating session...';
      fixture.detectChanges();

      const messageElement = debugElement.query(By.css('.session-loading-inline-message'));
      expect(messageElement).toBeTruthy();
      expect(messageElement.nativeElement.textContent).toContain('Validating session...');
    });
  });

  /**
   * Spinner Size Tests
   */
  describe('Spinner Size', () => {
    it('should have default medium size (48px)', () => {
      expect(component.spinnerDiameter).toBe(48);
    });

    it('should have small size (24px) when size is small', () => {
      component.size = 'small';
      expect(component.spinnerDiameter).toBe(24);
    });

    it('should have medium size (48px) when size is medium', () => {
      component.size = 'medium';
      expect(component.spinnerDiameter).toBe(48);
    });

    it('should have large size (64px) when size is large', () => {
      component.size = 'large';
      expect(component.spinnerDiameter).toBe(64);
    });
  });

  /**
   * Color Theme Tests
   */
  describe('Color Theme', () => {
    it('should use primary color by default', () => {
      expect(component.color).toBe('primary');
    });

    it('should apply primary color to spinner', () => {
      component.isLoading = true;
      component.overlay = true;
      component.color = 'primary';
      fixture.detectChanges();

      const spinner = debugElement.query(By.css('mat-spinner[color="primary"]'));
      expect(spinner).toBeTruthy();
    });

    it('should apply accent color to spinner', () => {
      component.isLoading = true;
      component.overlay = true;
      component.color = 'accent';
      fixture.detectChanges();

      const spinner = debugElement.query(By.css('mat-spinner[color="accent"]'));
      expect(spinner).toBeTruthy();
    });

    it('should apply warn color to spinner', () => {
      component.isLoading = true;
      component.overlay = true;
      component.color = 'warn';
      fixture.detectChanges();

      const spinner = debugElement.query(By.css('mat-spinner[color="warn"]'));
      expect(spinner).toBeTruthy();
    });
  });

  /**
   * Accessibility Tests
   */
  describe('Accessibility', () => {
    it('should have role="alert" in overlay mode', () => {
      component.isLoading = true;
      component.overlay = true;
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement.nativeElement.getAttribute('role')).toBe('alert');
    });

    it('should have role="status" in inline mode', () => {
      component.isLoading = true;
      component.overlay = false;
      fixture.detectChanges();

      const inlineElement = debugElement.query(By.css('.session-loading-inline'));
      expect(inlineElement.nativeElement.getAttribute('role')).toBe('status');
    });

    it('should have aria-live="polite" attribute', () => {
      component.isLoading = true;
      component.overlay = true;
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement.nativeElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-label with default message when no message provided', () => {
      component.isLoading = true;
      component.overlay = true;
      component.message = undefined;
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement.nativeElement.getAttribute('aria-label'))
        .toBe('Session is loading, please wait');
    });

    it('should have aria-label with custom message when provided', () => {
      component.isLoading = true;
      component.overlay = true;
      component.message = 'Creating guest session';
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement.nativeElement.getAttribute('aria-label'))
        .toBe('Creating guest session');
    });

    it('should have screen reader only announcement', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const srElement = debugElement.query(By.css('.sr-only'));
      expect(srElement).toBeTruthy();
      expect(srElement.nativeElement.getAttribute('role')).toBe('status');
      expect(srElement.nativeElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should announce loading state to screen readers', () => {
      component.isLoading = true;
      component.message = 'Loading session data';
      fixture.detectChanges();

      const srElement = debugElement.query(By.css('.sr-only span'));
      expect(srElement.nativeElement.textContent).toBe('Loading session data');
    });
  });

  /**
   * Progress Mode Tests
   */
  describe('Progress Mode', () => {
    it('should default to indeterminate mode', () => {
      expect(component.mode).toBe('indeterminate');
    });

    it('should support determinate mode with progress value', () => {
      component.isLoading = true;
      component.overlay = false;
      component.mode = 'determinate';
      component.progress = 75;
      fixture.detectChanges();

      const progressBar = debugElement.query(By.css('mat-progress-bar'));
      expect(progressBar.componentInstance.mode).toBe('determinate');
      expect(progressBar.componentInstance.value).toBe(75);
    });

    it('should clamp progress value between 0 and 100', () => {
      component.progress = 75;
      expect(component.progress).toBeGreaterThanOrEqual(0);
      expect(component.progress).toBeLessThanOrEqual(100);
    });
  });

  /**
   * Component State Tests
   */
  describe('Component State', () => {
    it('should hide loading when isLoading is false', () => {
      component.isLoading = false;
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      const inlineElement = debugElement.query(By.css('.session-loading-inline'));

      expect(overlayElement).toBeFalsy();
      expect(inlineElement).toBeFalsy();
    });

    it('should toggle loading state', () => {
      component.isLoading = true;
      component.overlay = true;
      fixture.detectChanges();

      let overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement).toBeTruthy();

      component.isLoading = false;
      fixture.detectChanges();

      overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      expect(overlayElement).toBeFalsy();
    });
  });

  /**
   * Integration Tests
   */
  describe('Integration', () => {
    it('should render complete overlay with all features', () => {
      component.isLoading = true;
      component.overlay = true;
      component.size = 'large';
      component.color = 'primary';
      component.message = 'Initializing guest session...';
      fixture.detectChanges();

      const overlayElement = debugElement.query(By.css('.session-loading-overlay'));
      const spinner = debugElement.query(By.css('mat-spinner'));
      const message = debugElement.query(By.css('.session-loading-message'));

      expect(overlayElement).toBeTruthy();
      expect(spinner).toBeTruthy();
      expect(spinner.componentInstance.diameter).toBe(64);
      expect(spinner.componentInstance.color).toBe('primary');
      expect(message.nativeElement.textContent).toContain('Initializing guest session...');
    });

    it('should render complete inline with all features', () => {
      component.isLoading = true;
      component.overlay = false;
      component.size = 'medium';
      component.color = 'accent';
      component.mode = 'determinate';
      component.progress = 60;
      component.message = 'Validating...';
      fixture.detectChanges();

      const inlineElement = debugElement.query(By.css('.session-loading-inline'));
      const progressBar = debugElement.query(By.css('mat-progress-bar'));
      const spinner = debugElement.query(By.css('mat-spinner'));
      const message = debugElement.query(By.css('.session-loading-inline-message'));

      expect(inlineElement).toBeTruthy();
      expect(progressBar).toBeTruthy();
      expect(progressBar.componentInstance.mode).toBe('determinate');
      expect(progressBar.componentInstance.value).toBe(60);
      expect(spinner.componentInstance.diameter).toBe(48);
      expect(spinner.componentInstance.color).toBe('accent');
      expect(message.nativeElement.textContent).toContain('Validating...');
    });
  });
});
