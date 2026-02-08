/**
 * @fileoverview Password strength indicator component
 * @description Visual indicator showing password strength with criteria checklist
 */

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * @description Password strength levels
 * @type {enum}
 */
export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

/**
 * @description Component displaying password strength meter and validation criteria
 * @class PasswordStrengthComponent
 */
@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent {
  /** Password input signal */
  private passwordSignal = signal<string>('');

  /**
   * @description Password string to evaluate
   * @param {string} value - Password value
   */
  @Input()
  set password(value: string) {
    this.passwordSignal.set(value || '');
  }

  get password(): string {
    return this.passwordSignal();
  }

  /**
   * @description Computed signal for minimum character requirement
   * @returns {boolean} True if password has at least 8 characters
   */
  hasMinLength = computed(() => {
    return this.passwordSignal().length >= 8;
  });

  /**
   * @description Computed signal for uppercase letter requirement
   * @returns {boolean} True if password contains at least one uppercase letter
   */
  hasUppercase = computed(() => {
    return /[A-Z]/.test(this.passwordSignal());
  });

  /**
   * @description Computed signal for number requirement
   * @returns {boolean} True if password contains at least one number
   */
  hasNumber = computed(() => {
    return /\d/.test(this.passwordSignal());
  });

  /**
   * @description Computed signal for special character requirement
   * @returns {boolean} True if password contains at least one special character
   */
  hasSpecialChar = computed(() => {
    return /[@$!%*?&]/.test(this.passwordSignal());
  });

  /**
   * @description Computed signal for password strength score (0-4)
   * @returns {number} Strength score based on criteria met
   */
  strengthScore = computed(() => {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUppercase()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSpecialChar()) score++;
    return score;
  });

  /**
   * @description Computed signal for password strength level
   * @returns {StrengthLevel} Current strength level
   */
  strengthLevel = computed((): StrengthLevel => {
    const score = this.strengthScore();
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
  });

  /**
   * @description Computed signal for strength color
   * @returns {string} CSS color for strength level
   */
  strengthColor = computed(() => {
    const level = this.strengthLevel();
    const colors = {
      weak: '#f44336',
      fair: '#ff9800',
      good: '#ffc107',
      strong: '#4caf50',
    };
    return colors[level];
  });

  /**
   * @description Computed signal for filled segments count
   * @returns {number} Number of filled segments (1-4)
   */
  filledSegments = computed(() => {
    return this.strengthScore() + 1;
  });
}
