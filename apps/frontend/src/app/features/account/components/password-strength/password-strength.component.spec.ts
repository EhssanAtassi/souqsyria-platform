/**
 * @fileoverview Unit tests for PasswordStrengthComponent
 * @description Tests the password strength indicator component including computed signals
 * for hasMinLength, hasUppercase, hasNumber, strengthScore, strengthLevel, strengthColor,
 * and filledSegments. Verifies correct evaluation across various password inputs.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import {
  PasswordStrengthComponent,
} from './password-strength.component';

describe('PasswordStrengthComponent', () => {
  /** Component under test */
  let component: PasswordStrengthComponent;

  /** Component fixture for DOM interaction */
  let fixture: ComponentFixture<PasswordStrengthComponent>;

  /**
   * @description Test module setup - configures standalone component
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PasswordStrengthComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordStrengthComponent);
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

    /**
     * @description Verifies default password is empty string
     */
    it('should initialize with empty password', () => {
      expect(component.password).toBe('');
    });
  });

  // ─── hasMinLength Computed Signal ────────────────────────────────

  describe('hasMinLength', () => {
    /**
     * @description Verifies hasMinLength is false for empty password
     */
    it('should return false for empty password', () => {
      component.password = '';
      expect(component.hasMinLength()).toBe(false);
    });

    /**
     * @description Verifies hasMinLength is false for password shorter than 8 chars
     */
    it('should return false for password with fewer than 8 characters', () => {
      component.password = 'Abc123';
      expect(component.hasMinLength()).toBe(false);
    });

    /**
     * @description Verifies hasMinLength is true for password with exactly 8 chars
     */
    it('should return true for password with exactly 8 characters', () => {
      component.password = '12345678';
      expect(component.hasMinLength()).toBe(true);
    });

    /**
     * @description Verifies hasMinLength is true for password with more than 8 chars
     */
    it('should return true for password with more than 8 characters', () => {
      component.password = 'LongPassword123';
      expect(component.hasMinLength()).toBe(true);
    });
  });

  // ─── hasUppercase Computed Signal ────────────────────────────────

  describe('hasUppercase', () => {
    /**
     * @description Verifies hasUppercase is false for empty password
     */
    it('should return false for empty password', () => {
      component.password = '';
      expect(component.hasUppercase()).toBe(false);
    });

    /**
     * @description Verifies hasUppercase is false for all-lowercase password
     */
    it('should return false for all lowercase characters', () => {
      component.password = 'alllowercase';
      expect(component.hasUppercase()).toBe(false);
    });

    /**
     * @description Verifies hasUppercase is false for numeric-only password
     */
    it('should return false for numeric-only password', () => {
      component.password = '12345678';
      expect(component.hasUppercase()).toBe(false);
    });

    /**
     * @description Verifies hasUppercase is true when at least one uppercase letter exists
     */
    it('should return true when at least one uppercase letter is present', () => {
      component.password = 'hasUpperA';
      expect(component.hasUppercase()).toBe(true);
    });

    /**
     * @description Verifies hasUppercase is true for all-uppercase password
     */
    it('should return true for all uppercase password', () => {
      component.password = 'ALLUPPERCASE';
      expect(component.hasUppercase()).toBe(true);
    });
  });

  // ─── hasNumber Computed Signal ───────────────────────────────────

  describe('hasNumber', () => {
    /**
     * @description Verifies hasNumber is false for empty password
     */
    it('should return false for empty password', () => {
      component.password = '';
      expect(component.hasNumber()).toBe(false);
    });

    /**
     * @description Verifies hasNumber is false for alphabetic-only password
     */
    it('should return false for alphabetic-only password', () => {
      component.password = 'NoDigitsHere';
      expect(component.hasNumber()).toBe(false);
    });

    /**
     * @description Verifies hasNumber is true when at least one digit exists
     */
    it('should return true when at least one digit is present', () => {
      component.password = 'has1digit';
      expect(component.hasNumber()).toBe(true);
    });

    /**
     * @description Verifies hasNumber is true for numeric-only password
     */
    it('should return true for numeric-only password', () => {
      component.password = '123456';
      expect(component.hasNumber()).toBe(true);
    });
  });

  // ─── strengthScore Computed Signal ───────────────────────────────

  describe('strengthScore', () => {
    /**
     * @description Verifies score is 0 when no criteria are met
     */
    it('should return 0 when no criteria are met (empty password)', () => {
      component.password = '';
      expect(component.strengthScore()).toBe(0);
    });

    /**
     * @description Verifies score is 0 when password is too short with no upper or digit
     */
    it('should return 0 for short lowercase-only password', () => {
      component.password = 'abc';
      expect(component.strengthScore()).toBe(0);
    });

    /**
     * @description Verifies score is 1 when only minLength is met
     */
    it('should return 1 when only minLength is met', () => {
      component.password = 'alllower'; // 8 chars, no uppercase, no digit
      expect(component.strengthScore()).toBe(1);
    });

    /**
     * @description Verifies score is 1 when only uppercase is met (short password)
     */
    it('should return 1 when only uppercase is met', () => {
      component.password = 'Ab'; // has uppercase, but <8 chars, no digit
      expect(component.strengthScore()).toBe(1);
    });

    /**
     * @description Verifies score is 1 when only number is met (short password)
     */
    it('should return 1 when only number is met', () => {
      component.password = 'a1b'; // has digit, but <8 chars, no uppercase
      expect(component.strengthScore()).toBe(1);
    });

    /**
     * @description Verifies score is 2 when two criteria are met
     */
    it('should return 2 when minLength and uppercase are met', () => {
      component.password = 'Abcdefgh'; // 8 chars, has uppercase, no digit
      expect(component.strengthScore()).toBe(2);
    });

    /**
     * @description Verifies score is 2 when minLength and number are met
     */
    it('should return 2 when minLength and number are met', () => {
      component.password = 'abcdefg1'; // 8 chars, has digit, no uppercase
      expect(component.strengthScore()).toBe(2);
    });

    /**
     * @description Verifies score is 3 when all criteria are met
     */
    it('should return 3 when all criteria are met', () => {
      component.password = 'Abcdefg1'; // 8 chars, uppercase, digit
      expect(component.strengthScore()).toBe(3);
    });
  });

  // ─── strengthLevel Computed Signal ───────────────────────────────

  describe('strengthLevel', () => {
    /**
     * @description Verifies level is 'weak' when score is 0
     */
    it('should return "weak" when score is 0', () => {
      component.password = '';
      expect(component.strengthLevel()).toBe('weak');
    });

    /**
     * @description Verifies level is 'weak' when score is 1
     */
    it('should return "weak" when score is 1', () => {
      component.password = 'alllower'; // score = 1 (minLength only)
      expect(component.strengthLevel()).toBe('weak');
    });

    /**
     * @description Verifies level is 'fair' when score is 2
     */
    it('should return "fair" when score is 2', () => {
      component.password = 'Abcdefgh'; // score = 2 (minLength + uppercase)
      expect(component.strengthLevel()).toBe('fair');
    });

    /**
     * @description Verifies level is 'good' when score is 3
     */
    it('should return "good" when score is 3', () => {
      component.password = 'Abcdefg1'; // score = 3 (minLength + uppercase + number)
      expect(component.strengthLevel()).toBe('good');
    });

    /**
     * @description Verifies level is 'strong' when score is 4
     */
    it('should return "strong" when score is 4', () => {
      component.password = 'Abcdefg1!'; // score = 4 (all criteria)
      expect(component.strengthLevel()).toBe('strong');
    });
  });

  // ─── strengthColor Computed Signal ───────────────────────────────

  describe('strengthColor', () => {
    /**
     * @description Verifies color is red (#f44336) for 'weak' level
     */
    it('should return "#f44336" for weak password', () => {
      component.password = '';
      expect(component.strengthColor()).toBe('#f44336');
    });

    /**
     * @description Verifies color is orange (#ff9800) for 'fair' level
     */
    it('should return "#ff9800" for fair password', () => {
      component.password = 'alllower'; // fair
      expect(component.strengthColor()).toBe('#ff9800');
    });

    /**
     * @description Verifies color is amber (#ffc107) for 'good' level
     */
    it('should return "#ffc107" for good password', () => {
      component.password = 'Abcdefgh'; // good
      expect(component.strengthColor()).toBe('#ffc107');
    });

    /**
     * @description Verifies color is green (#4caf50) for 'strong' level
     */
    it('should return "#4caf50" for strong password', () => {
      component.password = 'Abcdefg1'; // strong
      expect(component.strengthColor()).toBe('#4caf50');
    });
  });

  // ─── filledSegments Computed Signal ──────────────────────────────

  describe('filledSegments', () => {
    /**
     * @description Verifies filledSegments is 1 when score is 0
     */
    it('should return 1 when score is 0 (empty password)', () => {
      component.password = '';
      expect(component.filledSegments()).toBe(1);
    });

    /**
     * @description Verifies filledSegments is 2 when score is 1
     */
    it('should return 2 when score is 1', () => {
      component.password = 'alllower';
      expect(component.filledSegments()).toBe(2);
    });

    /**
     * @description Verifies filledSegments is 3 when score is 2
     */
    it('should return 3 when score is 2', () => {
      component.password = 'Abcdefgh';
      expect(component.filledSegments()).toBe(3);
    });

    /**
     * @description Verifies filledSegments is 4 when score is 3
     */
    it('should return 4 when score is 3 (max strength)', () => {
      component.password = 'Abcdefg1';
      expect(component.filledSegments()).toBe(4);
    });
  });

  // ─── Password Input Setter ───────────────────────────────────────

  describe('Password Input Setter', () => {
    /**
     * @description Verifies password setter handles null/undefined by defaulting to empty string
     */
    it('should default to empty string when null is passed', () => {
      component.password = null as any;
      expect(component.password).toBe('');
      expect(component.strengthScore()).toBe(0);
    });

    /**
     * @description Verifies password setter handles undefined
     */
    it('should default to empty string when undefined is passed', () => {
      component.password = undefined as any;
      expect(component.password).toBe('');
      expect(component.strengthLevel()).toBe('weak');
    });

    /**
     * @description Verifies computed signals update reactively when password changes
     */
    it('should update all computed signals when password changes', () => {
      // Start with empty
      component.password = '';
      expect(component.strengthLevel()).toBe('weak');

      // Add a short uppercase-only password
      component.password = 'Ab';
      expect(component.strengthScore()).toBe(1);
      expect(component.strengthLevel()).toBe('fair');

      // Add a longer password with uppercase and digit
      component.password = 'Abcdefg1';
      expect(component.strengthScore()).toBe(3);
      expect(component.strengthLevel()).toBe('strong');
      expect(component.strengthColor()).toBe('#4caf50');
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────

  describe('Edge Cases', () => {
    /**
     * @description Verifies password with special characters does not affect criteria
     */
    it('should not give extra score for special characters', () => {
      component.password = '!@#$%^&*'; // 8 special chars, no uppercase, no digit
      expect(component.hasMinLength()).toBe(true);
      expect(component.hasUppercase()).toBe(false);
      expect(component.hasNumber()).toBe(false);
      expect(component.strengthScore()).toBe(1);
    });

    /**
     * @description Verifies spaces are counted in length
     */
    it('should count spaces in password length', () => {
      component.password = '        '; // 8 spaces
      expect(component.hasMinLength()).toBe(true);
    });

    /**
     * @description Verifies Unicode uppercase letters are recognized
     */
    it('should detect Unicode uppercase letters', () => {
      component.password = '\u00C9longated'; // E with accent
      expect(component.hasUppercase()).toBe(true);
    });
  });
});
