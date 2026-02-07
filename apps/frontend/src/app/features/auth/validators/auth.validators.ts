/**
 * @fileoverview Custom form validators for authentication feature
 * @module auth.validators
 * @description Provides validators for password strength, password matching, OTP format validation
 * for the SouqSyria authentication system
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that password and confirmPassword fields match
 * @description Group-level validator that compares password and confirmPassword controls.
 * Sets error on confirmPassword control if mismatch detected.
 * @param control - The FormGroup containing password and confirmPassword controls
 * @returns ValidationErrors object with passwordMismatch property if invalid, null if valid
 * @example
 * this.fb.group({
 *   password: ['', Validators.required],
 *   confirmPassword: ['', Validators.required]
 * }, { validators: passwordMatch() })
 */
export function passwordMatch(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    const passwordValue = password.value;
    const confirmPasswordValue = confirmPassword.value;

    if (!passwordValue || !confirmPasswordValue) {
      return null;
    }

    if (passwordValue !== confirmPasswordValue) {
      // Set error on confirmPassword control
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear passwordMismatch error if values match
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }

    return null;
  };
}

/**
 * Validates strong password requirements for reset password flow
 * @description Enforces minimum 8 characters, at least 1 uppercase letter, and 1 number
 * as per backend ResetPasswordDto requirements
 * @param control - The form control to validate
 * @returns ValidationErrors object with specific violations (minLength, uppercase, number) or null if valid
 * @example
 * this.fb.control('', [Validators.required, strongPassword()])
 */
export function strongPassword(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const errors: ValidationErrors = {};

    // Check minimum length (8 characters)
    if (value.length < 8) {
      errors['minLength'] = true;
    }

    // Check for at least 1 uppercase letter
    if (!/[A-Z]/.test(value)) {
      errors['uppercase'] = true;
    }

    // Check for at least 1 number
    if (!/[0-9]/.test(value)) {
      errors['number'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Validates OTP (One-Time Password) format
 * @description Ensures OTP is exactly 6 digits as per backend verification requirements
 * @param control - The form control to validate
 * @returns ValidationErrors object with otpFormat property if invalid, null if valid
 * @example
 * this.fb.control('', [Validators.required, otpFormat()])
 */
export function otpFormat(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    // Must be exactly 6 digits
    const otpPattern = /^\d{6}$/;

    if (!otpPattern.test(value)) {
      return { otpFormat: true };
    }

    return null;
  };
}
