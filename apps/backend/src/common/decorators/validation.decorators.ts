/**
 * @file validation.decorators.ts
 * @description Custom validation decorators for Syrian marketplace requirements.
 * 
 * These decorators provide:
 * - Syrian phone number validation
 * - Syrian National ID validation
 * - Syrian postal code validation
 * - Arabic text validation
 * - Price validation for SYP (Syrian Pound)
 * - Safe string validation (XSS prevention)
 * - Common validation patterns
 * 
 * @author SouqSyria Development Team
 * @since 2026-01-20
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Matches,
  MinLength,
  MaxLength,
  IsString,
  IsNumber,
  Min,
  applyDecorators,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// =============================================================================
// SYRIAN PHONE NUMBER VALIDATION
// =============================================================================

/**
 * Syrian phone number validator constraint
 * Validates Syrian mobile and landline numbers
 * 
 * Valid formats:
 * - Mobile: +963 9XX XXX XXX (Syriatel, MTN, etc.)
 * - Landline: +963 11 XXX XXXX (Damascus), +963 21 XXX XXXX (Aleppo), etc.
 * - Local format: 09XX XXX XXX
 */
@ValidatorConstraint({ name: 'isSyrianPhone', async: false })
export class IsSyrianPhoneConstraint implements ValidatorConstraintInterface {
  /**
   * Syrian mobile prefixes (after country code)
   * 93X, 94X, 95X, 96X, 99X - Various operators
   */
  private readonly mobileRegex = /^(\+963|00963|0)?9[3-69]\d{7}$/;
  
  /**
   * Syrian landline prefixes (area codes)
   * 11 - Damascus, 21 - Aleppo, 31 - Homs, etc.
   */
  private readonly landlineRegex = /^(\+963|00963|0)?(11|21|31|33|41|43|51|52|53)\d{7}$/;
  
  validate(phone: any): boolean {
    if (typeof phone !== 'string') return false;
    
    // Remove spaces and dashes for validation
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    return this.mobileRegex.test(cleanPhone) || this.landlineRegex.test(cleanPhone);
  }
  
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid Syrian phone number (e.g., +963912345678 or 0912345678)`;
  }
}

/**
 * Decorator for validating Syrian phone numbers
 * 
 * @example
 * @IsSyrianPhone()
 * phone: string;
 */
export function IsSyrianPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSyrianPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSyrianPhoneConstraint,
    });
  };
}

// =============================================================================
// SYRIAN NATIONAL ID VALIDATION
// =============================================================================

/**
 * Syrian National ID validator
 * Syrian national IDs are 11-digit numbers
 */
@ValidatorConstraint({ name: 'isSyrianNationalId', async: false })
export class IsSyrianNationalIdConstraint implements ValidatorConstraintInterface {
  private readonly nationalIdRegex = /^\d{11}$/;
  
  validate(nationalId: any): boolean {
    if (typeof nationalId !== 'string') return false;
    return this.nationalIdRegex.test(nationalId.trim());
  }
  
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid Syrian National ID (11 digits)`;
  }
}

/**
 * Decorator for validating Syrian National ID
 */
export function IsSyrianNationalId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSyrianNationalId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSyrianNationalIdConstraint,
    });
  };
}

// =============================================================================
// SYRIAN POSTAL CODE VALIDATION
// =============================================================================

/**
 * Syrian postal code validator
 * Syrian postal codes follow specific formats per governorate
 */
@ValidatorConstraint({ name: 'isSyrianPostalCode', async: false })
export class IsSyrianPostalCodeConstraint implements ValidatorConstraintInterface {
  /**
   * Syrian postal codes are typically 5-6 digits
   * Format varies by governorate
   */
  private readonly postalCodeRegex = /^\d{5,6}$/;
  
  validate(postalCode: any): boolean {
    if (typeof postalCode !== 'string') return false;
    return this.postalCodeRegex.test(postalCode.trim());
  }
  
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid Syrian postal code (5-6 digits)`;
  }
}

/**
 * Decorator for validating Syrian postal codes
 */
export function IsSyrianPostalCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSyrianPostalCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSyrianPostalCodeConstraint,
    });
  };
}

// =============================================================================
// ARABIC TEXT VALIDATION
// =============================================================================

/**
 * Arabic text validator
 * Validates that text contains Arabic characters
 */
@ValidatorConstraint({ name: 'isArabicText', async: false })
export class IsArabicTextConstraint implements ValidatorConstraintInterface {
  /**
   * Matches Arabic characters (including numbers and common punctuation)
   */
  private readonly arabicRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s\d.,!?()-]+$/;
  
  validate(text: any): boolean {
    if (typeof text !== 'string') return false;
    return this.arabicRegex.test(text.trim());
  }
  
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must contain only Arabic characters`;
  }
}

/**
 * Decorator for validating Arabic-only text
 */
export function IsArabicText(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isArabicText',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsArabicTextConstraint,
    });
  };
}

/**
 * Validator for text that may contain both Arabic and English
 */
@ValidatorConstraint({ name: 'isMultilingualText', async: false })
export class IsMultilingualTextConstraint implements ValidatorConstraintInterface {
  /**
   * Allows Arabic, English, numbers, and common punctuation
   */
  private readonly multilingualRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\d.,!?()'\"-:;@#$%&*+=]+$/;
  
  validate(text: any): boolean {
    if (typeof text !== 'string') return false;
    if (text.trim().length === 0) return true; // Empty is valid (use IsNotEmpty separately)
    return this.multilingualRegex.test(text.trim());
  }
  
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} contains invalid characters`;
  }
}

/**
 * Decorator for validating multilingual text (Arabic + English)
 */
export function IsMultilingualText(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMultilingualText',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMultilingualTextConstraint,
    });
  };
}

// =============================================================================
// PRICE VALIDATION (SYP - Syrian Pound)
// =============================================================================

/**
 * Syrian Pound price validator
 * Validates price is positive and within reasonable SYP range
 */
@ValidatorConstraint({ name: 'isSYPPrice', async: false })
export class IsSYPPriceConstraint implements ValidatorConstraintInterface {
  /**
   * Maximum price in SYP (10 billion - reasonable for high-value items)
   */
  private readonly maxPrice = 10_000_000_000;
  
  validate(price: any): boolean {
    if (typeof price !== 'number') return false;
    if (!Number.isFinite(price)) return false;
    return price >= 0 && price <= this.maxPrice;
  }
  
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid SYP price (0 to ${this.maxPrice.toLocaleString()})`;
  }
}

/**
 * Decorator for validating Syrian Pound prices
 */
export function IsSYPPrice(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSYPPrice',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSYPPriceConstraint,
    });
  };
}

// =============================================================================
// SAFE STRING VALIDATION (XSS Prevention)
// =============================================================================

/**
 * Safe string validator
 * Prevents XSS attacks by disallowing HTML/script tags
 */
@ValidatorConstraint({ name: 'isSafeString', async: false })
export class IsSafeStringConstraint implements ValidatorConstraintInterface {
  /**
   * Dangerous patterns that could indicate XSS attempts
   */
  private readonly dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<[^>]*on\w+\s*=/gi,  // Event handlers like onclick, onerror
    /javascript:/gi,
    /data:/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /<style/gi,
    /expression\s*\(/gi,
  ];
  
  validate(text: any): boolean {
    if (typeof text !== 'string') return false;
    
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }
    return true;
  }
  
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} contains potentially dangerous content`;
  }
}

/**
 * Decorator for validating safe strings (no XSS vectors)
 */
export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSafeString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeStringConstraint,
    });
  };
}

// =============================================================================
// COMPOSITE VALIDATORS (Combining Multiple Validations)
// =============================================================================

/**
 * Product title validator
 * Combines multiple validations for product names
 */
export function IsProductTitle(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsString(validationOptions),
    MinLength(3, { message: 'Product title must be at least 3 characters' }),
    MaxLength(255, { message: 'Product title cannot exceed 255 characters' }),
    IsSafeString(validationOptions),
    IsMultilingualText(validationOptions),
  );
}

/**
 * Product description validator
 */
export function IsProductDescription(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsString(validationOptions),
    MaxLength(5000, { message: 'Product description cannot exceed 5000 characters' }),
    IsSafeString(validationOptions),
  );
}

/**
 * User name validator (first/last name)
 */
export function IsUserName(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsString(validationOptions),
    MinLength(2, { message: 'Name must be at least 2 characters' }),
    MaxLength(100, { message: 'Name cannot exceed 100 characters' }),
    IsSafeString(validationOptions),
    IsMultilingualText(validationOptions),
  );
}

/**
 * Syrian address line validator
 */
export function IsSyrianAddress(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsString(validationOptions),
    MinLength(10, { message: 'Address must be at least 10 characters' }),
    MaxLength(500, { message: 'Address cannot exceed 500 characters' }),
    IsSafeString(validationOptions),
  );
}

// =============================================================================
// TRANSFORM DECORATORS
// =============================================================================

/**
 * Transform decorator to sanitize strings
 * Trims whitespace and normalizes spaces
 */
export function SanitizeString() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' ');
  });
}

/**
 * Transform decorator to normalize Syrian phone numbers
 * Converts to international format (+963)
 */
export function NormalizeSyrianPhone() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    
    let phone = value.replace(/[\s-]/g, '');
    
    // Convert to international format
    if (phone.startsWith('00963')) {
      phone = '+963' + phone.slice(5);
    } else if (phone.startsWith('0')) {
      phone = '+963' + phone.slice(1);
    } else if (!phone.startsWith('+963')) {
      phone = '+963' + phone;
    }
    
    return phone;
  });
}

/**
 * Transform decorator to normalize prices
 * Rounds to 2 decimal places
 */
export function NormalizePrice() {
  return Transform(({ value }) => {
    if (typeof value !== 'number') return value;
    return Math.round(value * 100) / 100;
  });
}

// =============================================================================
// COMBINED PROPERTY DECORATORS
// =============================================================================

/**
 * Complete Syrian phone property decorator with all validations
 * Includes API documentation
 */
export function SyrianPhoneProperty(required: boolean = true) {
  const decorators = [
    ApiProperty({
      description: 'Syrian phone number',
      example: '+963912345678',
      required,
    }),
    NormalizeSyrianPhone(),
    IsSyrianPhone(),
  ];
  
  return applyDecorators(...decorators);
}

/**
 * Complete price property decorator for SYP
 */
export function SYPPriceProperty(description: string, required: boolean = true) {
  const decorators = [
    ApiProperty({
      description: `${description} (in SYP)`,
      example: 50000,
      required,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
    IsSYPPrice(),
    NormalizePrice(),
  ];
  
  return applyDecorators(...decorators);
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Syrian governorate validation (14 governorates)
 */
export const SYRIAN_GOVERNORATES = [
  'Damascus',
  'Damascus Countryside',
  'Aleppo',
  'Homs',
  'Hama',
  'Latakia',
  'Tartus',
  'Idlib',
  'Daraa',
  'Deir ez-Zor',
  'Raqqa',
  'Al-Hasakah',
  'Quneitra',
  'As-Suwayda',
] as const;

export type SyrianGovernorate = typeof SYRIAN_GOVERNORATES[number];

/**
 * Decorator for validating Syrian governorate
 */
export function IsSyrianGovernorate(validationOptions?: ValidationOptions) {
  return Matches(
    new RegExp(`^(${SYRIAN_GOVERNORATES.join('|')})$`, 'i'),
    {
      message: 'Must be a valid Syrian governorate',
      ...validationOptions,
    },
  );
}

/**
 * Syrian payment methods
 */
export const SYRIAN_PAYMENT_METHODS = [
  'syriatel_cash',
  'mtn_cash',
  'cash_on_delivery',
  'bank_transfer',
] as const;

export type SyrianPaymentMethod = typeof SYRIAN_PAYMENT_METHODS[number];

/**
 * Decorator for validating Syrian payment methods
 */
export function IsSyrianPaymentMethod(validationOptions?: ValidationOptions) {
  return Matches(
    new RegExp(`^(${SYRIAN_PAYMENT_METHODS.join('|')})$`),
    {
      message: 'Must be a valid Syrian payment method (syriatel_cash, mtn_cash, cash_on_delivery, bank_transfer)',
      ...validationOptions,
    },
  );
}
