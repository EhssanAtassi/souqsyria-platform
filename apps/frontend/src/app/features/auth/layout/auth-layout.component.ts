/**
 * Auth Layout Component for SouqSyria marketplace
 *
 * @description Standalone layout component that wraps all auth routes (login,
 * register, forgot-password, OTP verification, reset-password) with a minimal
 * header showing only the logo and language toggle. Replaces the full commerce
 * header with a clean, professional auth experience matching industry standards
 * (Amazon, Noon, Shopee).
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthLayoutComponent:
 *       type: object
 *       description: Minimal auth layout with logo + language toggle
 *       properties:
 *         languageService:
 *           type: object
 *           description: LanguageService for direction and language signals
 */

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LogoComponent } from '../../../shared/components/header/components/logo/logo.component';
import { LanguageToggleComponent } from '../../../shared/components/header/components/language-toggle/language-toggle.component';
import { LanguageService } from '../../../shared/services/language.service';

/**
 * AuthLayoutComponent
 *
 * @description Route-level layout component for the /auth/* route tree.
 * Provides a minimal header (logo + EN/AR toggle) and a centered content area
 * with a gradient background. Child auth routes render inside the nested
 * <router-outlet>. The [dir] attribute on the root element drives RTL layout
 * for all child components, so individual auth pages no longer need their own.
 *
 * @usageNotes
 * Used as parent route component in auth.routes.ts:
 * ```
 * { path: '', component: AuthLayoutComponent, children: [...authChildRoutes] }
 * ```
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LogoComponent, LanguageToggleComponent],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  /** @description Language service for direction, language signals, and toggle */
  readonly languageService = inject(LanguageService);

  /**
   * Handle language change from the toggle component
   * @description Delegates to LanguageService to update language, direction, and persistence
   * @param lang - Language code selected by the user
   */
  onLanguageChange(lang: 'en' | 'ar'): void {
    this.languageService.setLanguage(lang);
  }
}
