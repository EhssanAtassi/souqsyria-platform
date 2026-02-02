import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Language Toggle Component
 *
 * @description Standalone EN/AR pill toggle matching the prototype.
 * Active language gets golden background, inactive gets hover state.
 *
 * @swagger
 * components:
 *   schemas:
 *     LanguageToggleProps:
 *       type: object
 *       properties:
 *         activeLanguage:
 *           type: string
 *           enum: [en, ar]
 *           description: Currently active language
 *
 * @example
 * ```html
 * <app-language-toggle
 *   [activeLanguage]="'en'"
 *   (languageChange)="onLangChange($event)">
 * </app-language-toggle>
 * ```
 */
@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-toggle.component.html',
  styleUrl: './language-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageToggleComponent {
  /** Currently active language */
  @Input() activeLanguage: 'en' | 'ar' = 'en';

  /** Emitted when language selection changes */
  @Output() languageChange = new EventEmitter<'en' | 'ar'>();

  /**
   * Handle language button click
   * @description Switches to the selected language and emits change event
   * @param lang - Language to switch to
   */
  onSelect(lang: 'en' | 'ar'): void {
    if (lang !== this.activeLanguage) {
      this.languageChange.emit(lang);
    }
  }
}
