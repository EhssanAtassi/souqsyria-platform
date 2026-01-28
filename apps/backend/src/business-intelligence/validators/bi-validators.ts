/**
 * @file bi-validators.ts
 * @description Custom validation decorators and schemas for Business Intelligence
 * @module BusinessIntelligence/Validators
 * 
 * This file contains custom validation decorators, validation schemas,
 * and utility validators specifically designed for BI data validation.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isDateString,
  isNumber,
  isString,
  isArray,
  min,
  max,
} from 'class-validator';
import { Transform } from 'class-transformer';

// =============================================================================
// CUSTOM VALIDATION CONSTRAINTS
// =============================================================================

/**
 * Validates that a date range is valid and logical
 */
@ValidatorConstraint({ name: 'isValidDateRange', async: false })
export class IsValidDateRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const { startDate, endDate } = value;

    // Check if both dates are valid ISO strings
    if (!isDateString(startDate) || !isDateString(endDate)) {
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // Start date must be before end date
    if (start >= end) {
      return false;
    }

    // Date range cannot be more than 2 years
    const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
    if (end.getTime() - start.getTime() > maxRange) {
      return false;
    }

    // Dates cannot be in the future (with 1 day buffer)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (end > tomorrow) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Date range must have valid start and end dates, with start before end, within 2 years, and not in the future';
  }
}

/**
 * Validates that a monetary value is positive and within reasonable bounds
 */
@ValidatorConstraint({ name: 'isValidMonetaryValue', async: false })
export class IsValidMonetaryValueConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isNumber(value)) {
      return false;
    }

    // Must be non-negative
    if (value < 0) {
      return false;
    }

    // Must be finite
    if (!isFinite(value)) {
      return false;
    }

    // Maximum value: 1 trillion SYP (reasonable upper bound)
    const maxValue = 1_000_000_000_000;
    if (value > maxValue) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Monetary value must be a positive number within reasonable bounds (0 to 1 trillion)';
  }
}

/**
 * Validates that a percentage value is between 0 and 100
 */
@ValidatorConstraint({ name: 'isValidPercentage', async: false })
export class IsValidPercentageConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isNumber(value)) {
      return false;
    }

    return value >= 0 && value <= 100 && isFinite(value);
  }

  defaultMessage(): string {
    return 'Percentage must be a number between 0 and 100';
  }
}

/**
 * Validates that a rate value is between 0 and 1
 */
@ValidatorConstraint({ name: 'isValidRate', async: false })
export class IsValidRateConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isNumber(value)) {
      return false;
    }

    return value >= 0 && value <= 1 && isFinite(value);
  }

  defaultMessage(): string {
    return 'Rate must be a number between 0 and 1';
  }
}

/**
 * Validates that a count value is a non-negative integer
 */
@ValidatorConstraint({ name: 'isValidCount', async: false })
export class IsValidCountConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isNumber(value)) {
      return false;
    }

    return value >= 0 && Number.isInteger(value) && isFinite(value);
  }

  defaultMessage(): string {
    return 'Count must be a non-negative integer';
  }
}

/**
 * Validates that a score value is between 0 and 100
 */
@ValidatorConstraint({ name: 'isValidScore', async: false })
export class IsValidScoreConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isNumber(value)) {
      return false;
    }

    return value >= 0 && value <= 100 && isFinite(value);
  }

  defaultMessage(): string {
    return 'Score must be a number between 0 and 100';
  }
}

/**
 * Validates that user IDs array is not too large
 */
@ValidatorConstraint({ name: 'isValidUserIdArray', async: false })
export class IsValidUserIdArrayConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isArray(value)) {
      return false;
    }

    // Maximum 1000 user IDs
    if (value.length > 1000) {
      return false;
    }

    // All elements must be positive integers
    return value.every((id: any) => isNumber(id) && Number.isInteger(id) && id > 0);
  }

  defaultMessage(): string {
    return 'User ID array must contain valid positive integers and not exceed 1000 items';
  }
}

/**
 * Validates that product IDs array is not too large
 */
@ValidatorConstraint({ name: 'isValidProductIdArray', async: false })
export class IsValidProductIdArrayConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isArray(value)) {
      return false;
    }

    // Maximum 500 product IDs
    if (value.length > 500) {
      return false;
    }

    // All elements must be positive integers
    return value.every((id: any) => isNumber(id) && Number.isInteger(id) && id > 0);
  }

  defaultMessage(): string {
    return 'Product ID array must contain valid positive integers and not exceed 500 items';
  }
}

/**
 * Validates timezone string
 */
@ValidatorConstraint({ name: 'isValidTimezone', async: false })
export class IsValidTimezoneConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isString(value)) {
      return false;
    }

    try {
      // Try to create a date with the timezone
      Intl.DateTimeFormat(undefined, { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Timezone must be a valid IANA timezone identifier';
  }
}

/**
 * Validates cohort ID format
 */
@ValidatorConstraint({ name: 'isValidCohortId', async: false })
export class IsValidCohortIdConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isString(value)) {
      return false;
    }

    // Cohort ID pattern: cohort_YYYY_QX or cohort_YYYY_MM or custom format
    const patterns = [
      /^cohort_\d{4}_q[1-4]$/i, // Quarterly: cohort_2024_Q1
      /^cohort_\d{4}_\d{2}$/,   // Monthly: cohort_2024_01
      /^cohort_[a-z0-9_-]{3,50}$/i, // Custom: cohort_high_value_customers
    ];

    return patterns.some(pattern => pattern.test(value));
  }

  defaultMessage(): string {
    return 'Cohort ID must follow valid format: cohort_YYYY_QX, cohort_YYYY_MM, or cohort_custom_name';
  }
}

/**
 * Validates funnel ID format
 */
@ValidatorConstraint({ name: 'isValidFunnelId', async: false })
export class IsValidFunnelIdConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isString(value)) {
      return false;
    }

    // Funnel ID pattern: funnel_name_001 or custom format
    const pattern = /^funnel_[a-z0-9_-]{3,50}$/i;
    return pattern.test(value);
  }

  defaultMessage(): string {
    return 'Funnel ID must follow format: funnel_name (3-50 characters, alphanumeric, underscore, hyphen)';
  }
}

/**
 * Validates CLV prediction horizon
 */
@ValidatorConstraint({ name: 'isValidPredictionHorizon', async: false })
export class IsValidPredictionHorizonConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!isNumber(value)) {
      return false;
    }

    // Must be between 30 days and 5 years (1825 days)
    return Number.isInteger(value) && value >= 30 && value <= 1825;
  }

  defaultMessage(): string {
    return 'Prediction horizon must be an integer between 30 and 1825 days (5 years)';
  }
}

// =============================================================================
// VALIDATION DECORATORS
// =============================================================================

/**
 * Validates date range objects
 */
export function IsValidDateRange(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDateRangeConstraint,
    });
  };
}

/**
 * Validates monetary values
 */
export function IsMonetaryValue(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidMonetaryValueConstraint,
    });
  };
}

/**
 * Validates percentage values (0-100)
 */
export function IsPercentage(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPercentageConstraint,
    });
  };
}

/**
 * Validates rate values (0-1)
 */
export function IsRate(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidRateConstraint,
    });
  };
}

/**
 * Validates count values (non-negative integers)
 */
export function IsCount(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCountConstraint,
    });
  };
}

/**
 * Validates score values (0-100)
 */
export function IsScore(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidScoreConstraint,
    });
  };
}

/**
 * Validates user ID arrays
 */
export function IsUserIdArray(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidUserIdArrayConstraint,
    });
  };
}

/**
 * Validates product ID arrays
 */
export function IsProductIdArray(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidProductIdArrayConstraint,
    });
  };
}

/**
 * Validates timezone strings
 */
export function IsTimezone(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidTimezoneConstraint,
    });
  };
}

/**
 * Validates cohort IDs
 */
export function IsCohortId(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCohortIdConstraint,
    });
  };
}

/**
 * Validates funnel IDs
 */
export function IsFunnelId(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidFunnelIdConstraint,
    });
  };
}

/**
 * Validates CLV prediction horizons
 */
export function IsPredictionHorizon(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPredictionHorizonConstraint,
    });
  };
}

// =============================================================================
// TRANSFORM DECORATORS
// =============================================================================

/**
 * Transforms string to number for numeric fields
 */
export function ToNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'string' && value.trim() !== '') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  });
}

/**
 * Transforms string to integer for count fields
 */
export function ToInteger() {
  return Transform(({ value }) => {
    if (typeof value === 'string' && value.trim() !== '') {
      const num = parseInt(value, 10);
      return isNaN(num) ? value : num;
    }
    return value;
  });
}

/**
 * Transforms string to boolean for boolean fields
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  });
}

/**
 * Transforms comma-separated string to array
 */
export function ToArray() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return Array.isArray(value) ? value : [value];
  });
}

/**
 * Transforms and validates date strings
 */
export function ToDate() {
  return Transform(({ value }) => {
    if (typeof value === 'string' && value.trim() !== '') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }
    return value;
  });
}

// =============================================================================
// VALIDATION GROUPS AND CONDITIONAL VALIDATION
// =============================================================================

/**
 * Validation groups for different contexts
 */
export const ValidationGroups = {
  /** Basic validation for simple queries */
  BASIC: 'basic',
  /** Advanced validation for complex analytics */
  ADVANCED: 'advanced',
  /** Export validation for report generation */
  EXPORT: 'export',
  /** Real-time validation for live dashboards */
  REALTIME: 'realtime',
} as const;

/**
 * Conditional validation decorator for date range
 */
export function IsRequiredWhenCustomDateRange(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isRequiredWhenCustomDateRange',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          
          // If dateRange is 'custom', then startDate and endDate are required
          if (obj.dateRange === 'custom') {
            return value !== null && value !== undefined && value !== '';
          }
          
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is required when dateRange is 'custom'`;
        },
      },
    });
  };
}

/**
 * Validates that array size is within limits based on user role/permissions
 */
export function IsArraySizeWithinLimits(
  maxSize: number,
  validationOptions?: ValidationOptions
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isArraySizeWithinLimits',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxSize],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) {
            return false;
          }
          
          const [maxSize] = args.constraints;
          return value.length <= maxSize;
        },
        defaultMessage(args: ValidationArguments) {
          const [maxSize] = args.constraints;
          return `${args.property} array cannot contain more than ${maxSize} items`;
        },
      },
    });
  };
}

// =============================================================================
// UTILITY VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates if a string is a valid Syrian mobile number
 */
export function isValidSyrianMobile(value: string): boolean {
  const pattern = /^(\+963|0)?9[0-9]{8}$/;
  return pattern.test(value);
}

/**
 * Validates if a string is a valid email domain
 */
export function isValidEmailDomain(value: string): boolean {
  const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return pattern.test(value);
}

/**
 * Validates if a number is within a reasonable range for Syrian Pounds
 */
export function isValidSyrianPounds(value: number): boolean {
  // Minimum: 1 SYP, Maximum: 100 billion SYP
  return value >= 1 && value <= 100_000_000_000 && Number.isFinite(value);
}

/**
 * Validates if a date is within business hours
 */
export function isWithinBusinessHours(date: Date, timezone = 'Asia/Damascus'): boolean {
  try {
    const damascusTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    
    const hour = parseInt(damascusTime.format(date));
    return hour >= 8 && hour <= 18; // 8 AM to 6 PM
  } catch {
    return false;
  }
}

/**
 * Validates if an object has all required properties for a specific validation context
 */
export function hasRequiredPropertiesForContext(
  obj: any,
  context: string,
  requiredProperties: string[]
): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredProperties.every(prop => 
    obj.hasOwnProperty(prop) && obj[prop] !== null && obj[prop] !== undefined
  );
}

/**
 * Validates metric name format
 */
export function isValidMetricName(value: string): boolean {
  // Metric names: alphanumeric, underscore, hyphen, 3-50 characters
  const pattern = /^[a-zA-Z0-9_-]{3,50}$/;
  return pattern.test(value);
}

/**
 * Validates campaign ID format
 */
export function isValidCampaignId(value: string): boolean {
  // Campaign IDs: campaign_type_identifier format
  const pattern = /^campaign_[a-z]+_[a-z0-9_-]+$/i;
  return pattern.test(value);
}

/**
 * Validates event name format
 */
export function isValidEventName(value: string): boolean {
  // Event names: snake_case format, 3-50 characters
  const pattern = /^[a-z0-9_]{3,50}$/;
  return pattern.test(value);
}