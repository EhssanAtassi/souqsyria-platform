/**
 * @file preferences.component.spec.ts
 * @description Unit tests for PreferencesComponent
 *
 * Tests cover:
 * - Component creation and form initialization
 * - Loading preferences from profile API
 * - Language change with immediate application
 * - Saving preferences to backend
 * - Error handling during load and save
 *
 * @author Claude Code
 * @since 2025-02-09
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PreferencesComponent } from './preferences.component';
import { environment } from '../../../../../environments/environment';

describe('PreferencesComponent', () => {
  let component: PreferencesComponent;
  let fixture: ComponentFixture<PreferencesComponent>;
  let httpMock: HttpTestingController;
  let snackBar: MatSnackBar;
  let translateService: TranslateService;

  const profileUrl = `${environment.userApiUrl}/profile`;
  const preferencesUrl = `${environment.userApiUrl}/preferences`;

  const mockProfile = {
    id: 1,
    fullName: 'Test User',
    email: 'test@example.com',
    preferences: {
      language: 'en',
      currency: 'USD',
      emailNotifications: false,
      smsNotifications: true,
      marketingEmails: true,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PreferencesComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    snackBar = TestBed.inject(MatSnackBar);
    translateService = TestBed.inject(TranslateService);

    fixture = TestBed.createComponent(PreferencesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Helper: triggers ngOnInit and flushes the profile GET
   */
  function initAndFlush(profile = mockProfile): void {
    fixture.detectChanges(); // triggers ngOnInit
    const req = httpMock.expectOne(profileUrl);
    req.flush(profile);
  }

  describe('creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
      // Flush the auto-triggered profile GET
      fixture.detectChanges();
      httpMock.expectOne(profileUrl).flush(mockProfile);
    });

    it('should initialize form with default values before profile loads', () => {
      fixture.detectChanges();
      expect(component.form.value.language).toBe('ar');
      expect(component.form.value.currency).toBe('SYP');
      expect(component.form.value.emailNotifications).toBeTrue();
      httpMock.expectOne(profileUrl).flush(mockProfile);
    });
  });

  describe('loadPreferences', () => {
    it('should patch form with profile preferences on load', () => {
      initAndFlush();

      expect(component.form.value.language).toBe('en');
      expect(component.form.value.currency).toBe('USD');
      expect(component.form.value.emailNotifications).toBeFalse();
      expect(component.form.value.smsNotifications).toBeTrue();
      expect(component.form.value.marketingEmails).toBeTrue();
      expect(component.loading()).toBeFalse();
    });

    it('should use defaults when profile has no preferences', () => {
      initAndFlush({ ...mockProfile, preferences: undefined } as any);

      expect(component.form.value.language).toBe('ar');
      expect(component.form.value.currency).toBe('SYP');
      expect(component.loading()).toBeFalse();
    });

    it('should set error state on profile load failure', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(profileUrl);
      req.error(new ProgressEvent('Network error'));

      expect(component.error()).toBe('account.preferences.loadError');
      expect(component.loading()).toBeFalse();
    });
  });

  describe('onLanguageChange', () => {
    it('should apply language immediately via TranslateService', () => {
      initAndFlush();
      spyOn(translateService, 'use');

      component.onLanguageChange('ar');

      expect(translateService.use).toHaveBeenCalledWith('ar');
    });

    it('should set document direction to RTL for Arabic', () => {
      initAndFlush();

      component.onLanguageChange('ar');

      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
    });

    it('should set document direction to LTR for English', () => {
      initAndFlush();

      component.onLanguageChange('en');

      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('savePreferences', () => {
    it('should send PATCH request with form values', () => {
      initAndFlush();

      component.form.patchValue({ language: 'ar', currency: 'SYP' });
      component.savePreferences();

      const req = httpMock.expectOne(preferencesUrl);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.language).toBe('ar');
      expect(req.request.body.currency).toBe('SYP');
      req.flush({ message: 'ok', preferences: {} });

      expect(component.saving()).toBeFalse();
    });

    it('should show success snackbar after save', () => {
      initAndFlush();
      spyOn(snackBar, 'open');

      component.savePreferences();

      const req = httpMock.expectOne(preferencesUrl);
      req.flush({ message: 'ok', preferences: {} });

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should show error snackbar on save failure', () => {
      initAndFlush();
      spyOn(snackBar, 'open');

      component.savePreferences();

      const req = httpMock.expectOne(preferencesUrl);
      req.error(new ProgressEvent('Network error'));

      expect(component.saving()).toBeFalse();
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should not send request if already saving', () => {
      initAndFlush();

      component.saving.set(true);
      component.savePreferences();

      httpMock.expectNone(preferencesUrl);
    });
  });
});
