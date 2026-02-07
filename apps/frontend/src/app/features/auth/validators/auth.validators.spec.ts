/**
 * Unit tests for authentication validators
 *
 * @description Tests custom form validators: passwordMatch,
 * strongPassword, and otpFormat used throughout the auth feature forms.
 */
import { FormControl, FormGroup } from '@angular/forms';
import {
  passwordMatch,
  strongPassword,
  otpFormat,
} from './auth.validators';

describe('Auth Validators', () => {

  // ─── passwordMatch ────────────────────────────────────────────

  describe('passwordMatch', () => {
    const validator = passwordMatch();

    it('should return null when both passwords match', () => {
      const group = new FormGroup({
        password: new FormControl('MyPass1'),
        confirmPassword: new FormControl('MyPass1'),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return passwordMismatch when passwords differ', () => {
      const group = new FormGroup({
        password: new FormControl('MyPass1'),
        confirmPassword: new FormControl('Different'),
      });
      expect(validator(group)).toEqual({ passwordMismatch: true });
    });

    it('should set error on confirmPassword control when mismatch', () => {
      const group = new FormGroup({
        password: new FormControl('MyPass1'),
        confirmPassword: new FormControl('Different'),
      });
      validator(group);
      expect(group.get('confirmPassword')!.hasError('passwordMismatch')).toBeTrue();
    });

    it('should clear passwordMismatch error when values match again', () => {
      const group = new FormGroup({
        password: new FormControl('MyPass1'),
        confirmPassword: new FormControl('Different'),
      });
      validator(group); // sets error
      group.get('confirmPassword')!.setValue('MyPass1');
      validator(group); // should clear
      expect(group.get('confirmPassword')!.hasError('passwordMismatch')).toBeFalse();
    });

    it('should return null when either field is empty', () => {
      const group = new FormGroup({
        password: new FormControl('MyPass1'),
        confirmPassword: new FormControl(''),
      });
      expect(validator(group)).toBeNull();
    });

    it('should return null when password or confirmPassword control missing', () => {
      const group = new FormGroup({
        password: new FormControl('MyPass1'),
      });
      expect(validator(group)).toBeNull();
    });
  });

  // ─── strongPassword ───────────────────────────────────────────

  describe('strongPassword', () => {
    const validator = strongPassword();

    it('should return null for empty value', () => {
      expect(validator(new FormControl(''))).toBeNull();
    });

    it('should return minLength error for passwords shorter than 8 chars', () => {
      const errors = validator(new FormControl('Ab1'));
      expect(errors).toBeTruthy();
      expect(errors!['minLength']).toBeTrue();
    });

    it('should return uppercase error when no uppercase letter', () => {
      const errors = validator(new FormControl('password1'));
      expect(errors).toBeTruthy();
      expect(errors!['uppercase']).toBeTrue();
    });

    it('should return number error when no digit', () => {
      const errors = validator(new FormControl('PasswordAbc'));
      expect(errors).toBeTruthy();
      expect(errors!['number']).toBeTrue();
    });

    it('should return null when all requirements met', () => {
      expect(validator(new FormControl('MyPass12'))).toBeNull();
      expect(validator(new FormControl('StrongP1'))).toBeNull();
    });

    it('should return multiple errors when multiple requirements fail', () => {
      const errors = validator(new FormControl('abc'));
      expect(errors).toBeTruthy();
      expect(errors!['minLength']).toBeTrue();
      expect(errors!['uppercase']).toBeTrue();
      expect(errors!['number']).toBeTrue();
    });
  });

  // ─── otpFormat ────────────────────────────────────────────────

  describe('otpFormat', () => {
    const validator = otpFormat();

    it('should return null for empty value', () => {
      expect(validator(new FormControl(''))).toBeNull();
    });

    it('should return null for valid 6-digit OTP', () => {
      expect(validator(new FormControl('123456'))).toBeNull();
      expect(validator(new FormControl('000000'))).toBeNull();
    });

    it('should return otpFormat error for fewer than 6 digits', () => {
      expect(validator(new FormControl('12345'))).toEqual({ otpFormat: true });
    });

    it('should return otpFormat error for more than 6 digits', () => {
      expect(validator(new FormControl('1234567'))).toEqual({ otpFormat: true });
    });

    it('should return otpFormat error for non-numeric characters', () => {
      expect(validator(new FormControl('12345a'))).toEqual({ otpFormat: true });
      expect(validator(new FormControl('abcdef'))).toEqual({ otpFormat: true });
    });

    it('should return otpFormat error for special characters', () => {
      expect(validator(new FormControl('12345!'))).toEqual({ otpFormat: true });
    });
  });
});
