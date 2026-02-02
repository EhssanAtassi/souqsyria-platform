import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Language Service for SouqSyria
 *
 * @description Manages language selection (English/Arabic), RTL switching,
 * and provides localization helpers for bilingual components.
 * Uses Angular signals for reactive state management.
 *
 * @swagger
 * components:
 *   schemas:
 *     LanguageState:
 *       type: object
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Current active language
 *         isRtl:
 *           type: boolean
 *           description: Whether RTL layout is active
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  /** Platform ID for browser detection */
  private readonly platformId = inject(PLATFORM_ID);

  /** LocalStorage key for persisted language preference */
  private readonly STORAGE_KEY = 'sq_language';

  /** Current language signal */
  readonly language = signal<'en' | 'ar'>(this.getInitialLanguage());

  /** Whether RTL layout is active (computed from language) */
  readonly isRtl = computed(() => this.language() === 'ar');

  /** Current direction string for template binding */
  readonly direction = computed(() => this.isRtl() ? 'rtl' : 'ltr');

  /**
   * Set the active language
   * @description Switches language, updates document direction, and persists preference
   * @param lang - Language code to switch to ('en' or 'ar')
   */
  setLanguage(lang: 'en' | 'ar'): void {
    this.language.set(lang);
    this.applyDocumentDirection(lang);
    this.persistLanguage(lang);
  }

  /**
   * Toggle between English and Arabic
   * @description Convenience method to switch to the other language
   */
  toggleLanguage(): void {
    const next = this.language() === 'en' ? 'ar' : 'en';
    this.setLanguage(next);
  }

  /**
   * Get localized text from an English/Arabic pair
   * @description Returns the text matching the current language
   * @param en - English text
   * @param ar - Arabic text
   * @returns The text in the current language
   */
  localize(en: string, ar: string): string {
    return this.language() === 'ar' ? ar : en;
  }

  /**
   * Get initial language from storage or browser preference
   * @description Checks localStorage, then browser language, defaults to 'en'
   * @returns Initial language setting
   * @private
   */
  private getInitialLanguage(): 'en' | 'ar' {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'ar' || stored === 'en') {
        return stored;
      }

      /** Check browser language */
      const browserLang = navigator.language?.substring(0, 2);
      if (browserLang === 'ar') {
        return 'ar';
      }
    }
    return 'en';
  }

  /**
   * Apply document-level direction and language attributes
   * @description Updates html element dir and lang attributes for proper RTL rendering
   * @param lang - Language code
   * @private
   */
  private applyDocumentDirection(lang: 'en' | 'ar'): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }

  /**
   * Persist language preference to localStorage
   * @description Saves the language choice for returning visitors
   * @param lang - Language code to persist
   * @private
   */
  private persistLanguage(lang: 'en' | 'ar'): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }
  }
}
