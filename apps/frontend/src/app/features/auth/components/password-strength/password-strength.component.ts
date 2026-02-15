/**
 * Password Strength Indicator Component for SouqSyria marketplace
 *
 * @description Standalone dumb component that displays a visual strength bar
 * and requirements checklist based on the current password value. Shows real-time
 * feedback as the user types, with color-coded strength levels (weak, fair, strong).
 *
 * @architecture
 * - Dumb/Presentational component: no service injection, pure input()-driven
 * - OnPush change detection for performance
 * - Respects prefers-reduced-motion for the strength bar transition
 * - RTL-compatible via CSS logical properties
 *
 * @swagger
 * components:
 *   schemas:
 *     PasswordStrengthComponent:
 *       type: object
 *       description: Visual password strength indicator with requirements checklist
 *       properties:
 *         password:
 *           type: string
 *           description: Current password value to evaluate
 *         strength:
 *           type: number
 *           description: Computed strength score (0-4)
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * PasswordStrengthComponent
 *
 * @description Presentational component that evaluates password strength
 * and displays a progress bar with requirement checkmarks. No NgRx or
 * service dependencies — receives password via input() signal.
 *
 * @usageNotes
 * ```html
 * <app-password-strength [password]="form.get('password')?.value ?? ''"></app-password-strength>
 * ```
 */
@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent {
  /**
   * The current password value to evaluate
   * @description Angular 18 signal input — automatically reactive, no setter needed.
   * SECURITY NOTE: This component provides UX feedback only.
   * Password validation is enforced server-side in RegisterDto, ResetPasswordDto, ChangePasswordDto.
   */
  readonly password = input<string>('');

  /** @description Whether the password meets the minimum length requirement (8 chars) */
  readonly hasMinLength = computed(() => this.password().length >= 8);

  /** @description Whether the password contains at least one uppercase letter */
  readonly hasUppercase = computed(() => /[A-Z]/.test(this.password()));

  /** @description Whether the password contains at least one digit */
  readonly hasNumber = computed(() => /[0-9]/.test(this.password()));

  /** @description Whether the password contains at least one special character */
  readonly hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.password()));

  /**
   * Computed strength score (0-4)
   * @description Counts how many requirements are met. Used for bar width and color.
   */
  readonly strengthScore = computed(() => {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUppercase()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSpecialChar()) score++;
    return score;
  });

  /**
   * Strength label key for translation
   * @description Maps score to i18n key: weak (0-1), fair (2), good (3), strong (4)
   */
  readonly strengthLabel = computed(() => {
    const score = this.strengthScore();
    if (score <= 1) return 'auth.passwordStrength.weak';
    if (score === 2) return 'auth.passwordStrength.fair';
    if (score === 3) return 'auth.passwordStrength.good';
    return 'auth.passwordStrength.strong';
  });

  /**
   * CSS class for strength bar color
   * @description Maps score to CSS class for visual feedback
   */
  readonly strengthClass = computed(() => {
    const score = this.strengthScore();
    if (score <= 1) return 'strength-weak';
    if (score === 2) return 'strength-fair';
    if (score === 3) return 'strength-good';
    return 'strength-strong';
  });

  /**
   * Bar width percentage
   * @description Maps score to percentage for the progress bar fill
   */
  readonly barWidth = computed(() => (this.strengthScore() / 4) * 100);

  /** @description Whether to show the indicator (only when password has content) */
  readonly isVisible = computed(() => this.password().length > 0);
}
