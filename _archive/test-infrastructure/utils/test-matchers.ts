/**
 * @file test-matchers.ts
 * @description Custom Jest matchers for domain-specific assertions
 *
 * Provides custom matchers for:
 * - CLV and financial calculations
 * - Customer segments and RFM scores
 * - Monetary values and currency validation
 * - Time-based assertions
 * - Analytics and funnel assertions
 *
 * @author Test Automation Team
 * @since 2026-01-24
 */

import { CustomerSegment } from '../../apps/backend/src/business-intelligence/entities/business-event.entity';

/**
 * Custom matchers for CLV domain
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Assert CLV metrics object has all required properties with correct types
       */
      toHaveValidCLVStructure(): R;

      /**
       * Assert value is a valid customer segment
       */
      toBeValidCustomerSegment(): R;

      /**
       * Assert value is a valid RFM score (1-5)
       */
      toBeRFMScore(min?: number, max?: number): R;

      /**
       * Assert value is a valid churn probability (0-1)
       */
      toBeChurnProbability(): R;

      /**
       * Assert value is a valid monetary amount in SYP
       */
      toBeValidCurrency(currency?: string): R;

      /**
       * Assert monetary value equals expected within tolerance
       */
      toEqualMonetaryValue(expected: number, tolerance?: number): R;

      /**
       * Assert date is within specified days of reference
       */
      toBeWithinDays(referenceDate: Date, days: number): R;

      /**
       * Assert conversion rate is valid (0-100%)
       */
      toBeValidConversionRate(): R;

      /**
       * Assert retention rates are monotonic (decreasing)
       */
      toHaveMonotonicRetention(): R;

      /**
       * Assert array is sorted by specified field
       */
      toBeSortedBy(field: string, direction?: 'asc' | 'desc'): R;
    }
  }
}

/**
 * CLV Metrics Structure Matcher
 * Validates that an object contains all required CLV metric properties
 */
expect.extend({
  toHaveValidCLVStructure(received: any) {
    const requiredProperties = [
      'userId',
      'email',
      'name',
      'historicalCLV',
      'predictedCLV',
      'totalCLV',
      'recency',
      'frequency',
      'monetary',
      'orderCount',
      'firstOrderDate',
      'lastOrderDate',
      'lifespanDays',
      'rfmScore',
      'segment',
      'churnProbability',
      'retentionAction',
      'calculatedAt'
    ];

    const missingProperties = requiredProperties.filter(prop => !(prop in received));
    const invalidTypes: string[] = [];

    // Validate types
    if (typeof received.userId !== 'number') invalidTypes.push('userId must be number');
    if (typeof received.email !== 'string') invalidTypes.push('email must be string');
    if (typeof received.historicalCLV !== 'number') invalidTypes.push('historicalCLV must be number');
    if (typeof received.rfmScore !== 'number' || received.rfmScore < 1 || received.rfmScore > 5) {
      invalidTypes.push('rfmScore must be number between 1-5');
    }
    if (typeof received.churnProbability !== 'number' || received.churnProbability < 0 || received.churnProbability > 1) {
      invalidTypes.push('churnProbability must be number between 0-1');
    }

    const pass = missingProperties.length === 0 && invalidTypes.length === 0;

    return {
      pass,
      message: () => {
        const errors = [
          ...missingProperties.map(p => `Missing property: ${p}`),
          ...invalidTypes
        ];
        return `Expected CLV metrics to be valid. Errors: ${errors.join('; ')}`;
      }
    };
  }
});

/**
 * Valid Customer Segment Matcher
 */
expect.extend({
  toBeValidCustomerSegment(received: any) {
    const validSegments = Object.values(CustomerSegment);
    const pass = validSegments.includes(received);

    return {
      pass,
      message: () =>
        `Expected ${received} to be a valid customer segment. Valid values: ${validSegments.join(', ')}`
    };
  }
});

/**
 * RFM Score Matcher
 * Validates RFM score is between min and max (default 1-5)
 */
expect.extend({
  toBeRFMScore(received: any, min: number = 1, max: number = 5) {
    const pass = typeof received === 'number' && received >= min && received <= max;

    return {
      pass,
      message: () =>
        `Expected ${received} to be a valid RFM score between ${min} and ${max}. Received: ${typeof received === 'number' ? received : typeof received}`
    };
  }
});

/**
 * Churn Probability Matcher
 * Validates churn probability is between 0 and 1
 */
expect.extend({
  toBeChurnProbability(received: any) {
    const pass = typeof received === 'number' && received >= 0 && received <= 1;

    return {
      pass,
      message: () =>
        `Expected ${received} to be a valid churn probability between 0 and 1. Received: ${typeof received === 'number' ? received : typeof received}`
    };
  }
});

/**
 * Valid Currency Matcher
 * Validates monetary value is a non-negative number
 */
expect.extend({
  toBeValidCurrency(received: any, currency: string = 'SYP') {
    const pass = typeof received === 'number' && received >= 0 && isFinite(received);

    return {
      pass,
      message: () =>
        `Expected ${received} to be a valid ${currency} currency value. Must be non-negative number.`
    };
  }
});

/**
 * Monetary Value Equality Matcher
 * Compares monetary values with tolerance for floating-point errors
 */
expect.extend({
  toEqualMonetaryValue(received: any, expected: number, tolerance: number = 0.01) {
    const pass = typeof received === 'number' &&
      Math.abs(received - expected) <= tolerance;

    return {
      pass,
      message: () =>
        `Expected monetary value ${received} to equal ${expected} (tolerance: ${tolerance}). Difference: ${Math.abs(received - expected)}`
    };
  }
});

/**
 * Date Range Matcher
 * Validates date is within specified number of days from reference date
 */
expect.extend({
  toBeWithinDays(received: any, referenceDate: Date, days: number) {
    if (!(received instanceof Date)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be a Date instance`
      };
    }

    const timeDiff = Math.abs(received.getTime() - referenceDate.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    const pass = daysDiff <= days;

    return {
      pass,
      message: () =>
        `Expected date ${received.toISOString()} to be within ${days} days of ${referenceDate.toISOString()}. Actual difference: ${daysDiff.toFixed(2)} days`
    };
  }
});

/**
 * Conversion Rate Matcher
 * Validates conversion rate is percentage between 0-100
 */
expect.extend({
  toBeValidConversionRate(received: any) {
    const pass = typeof received === 'number' && received >= 0 && received <= 100;

    return {
      pass,
      message: () =>
        `Expected ${received} to be a valid conversion rate between 0% and 100%`
    };
  }
});

/**
 * Monotonic Retention Matcher
 * Validates that retention rates decrease monotonically (as expected in cohort analysis)
 */
expect.extend({
  toHaveMonotonicRetention(received: any) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `Expected array of retention rates, received ${typeof received}`
      };
    }

    let isMonotonic = true;
    for (let i = 1; i < received.length; i++) {
      if (received[i] > received[i - 1]) {
        isMonotonic = false;
        break;
      }
    }

    return {
      pass: isMonotonic,
      message: () =>
        `Expected retention rates to be monotonically decreasing. Received: [${received.join(', ')}]`
    };
  }
});

/**
 * Sorted Array Matcher
 * Validates array is sorted by specified field
 */
expect.extend({
  toBeSortedBy(received: any, field: string, direction: 'asc' | 'desc' = 'asc') {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `Expected array, received ${typeof received}`
      };
    }

    let isSorted = true;
    for (let i = 1; i < received.length; i++) {
      const current = received[i][field];
      const previous = received[i - 1][field];

      if (direction === 'asc' && current < previous) {
        isSorted = false;
        break;
      } else if (direction === 'desc' && current > previous) {
        isSorted = false;
        break;
      }
    }

    return {
      pass: isSorted,
      message: () =>
        `Expected array to be sorted by '${field}' in ${direction}ending order`
    };
  }
});

/**
 * Setup custom matchers for all tests
 * Call this in your test setup file
 */
export function setupCustomMatchers(): void {
  // Matchers are automatically registered via expect.extend()
}

/**
 * Helper function to validate CLV calculation results
 * @param metrics - CLV metrics to validate
 * @param expectedSegment - Expected customer segment
 * @param tolerancePercent - Allowed deviation percentage
 */
export function validateCLVMetrics(
  metrics: any,
  expectedSegment?: CustomerSegment,
  tolerancePercent: number = 5
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required properties
  const requiredProperties = ['userId', 'historicalCLV', 'segment', 'churnProbability'];
  for (const prop of requiredProperties) {
    if (!(prop in metrics)) {
      errors.push(`Missing required property: ${prop}`);
    }
  }

  // Validate numeric ranges
  if (typeof metrics.historicalCLV !== 'number' || metrics.historicalCLV < 0) {
    errors.push('historicalCLV must be non-negative number');
  }

  if (typeof metrics.churnProbability !== 'number' || metrics.churnProbability < 0 || metrics.churnProbability > 1) {
    errors.push('churnProbability must be between 0 and 1');
  }

  // Validate segment if expected
  if (expectedSegment && metrics.segment !== expectedSegment) {
    errors.push(`Expected segment ${expectedSegment}, got ${metrics.segment}`);
  }

  // Validate CLV consistency
  if (metrics.totalCLV < metrics.historicalCLV) {
    errors.push('totalCLV must be >= historicalCLV');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to validate conversion funnel data
 * @param funnel - Funnel data to validate
 */
export function validateFunnelData(funnel: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(funnel.steps)) {
    errors.push('Funnel steps must be array');
  }

  if (!Array.isArray(funnel.conversionRates)) {
    errors.push('Conversion rates must be array');
  }

  if (funnel.steps && funnel.conversionRates) {
    if (funnel.steps.length !== funnel.conversionRates.length + 1) {
      errors.push('Conversion rates should be steps.length - 1');
    }

    for (let i = 0; i < funnel.conversionRates.length; i++) {
      const rate = funnel.conversionRates[i];
      if (typeof rate !== 'number' || rate < 0 || rate > 100) {
        errors.push(`Conversion rate at step ${i} must be 0-100`);
      }

      // Check monotonic decrease
      if (i > 0 && funnel.conversionRates[i] > funnel.conversionRates[i - 1]) {
        errors.push(`Conversion rate should decrease from step ${i - 1} to ${i}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
