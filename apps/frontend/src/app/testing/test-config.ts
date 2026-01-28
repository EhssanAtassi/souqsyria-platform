/**
 * Angular Test Configuration and Setup
 * 
 * Provides centralized test configuration following Angular 17+ best practices
 * for Karma/Jasmine testing environment. Includes custom matchers and
 * setup utilities specific to the Syrian marketplace application.
 * 
 * @swagger
 * components:
 *   schemas:
 *     TestConfiguration:
 *       type: object
 *       description: Centralized test configuration for Angular application
 *       properties:
 *         customMatchers:
 *           type: object
 *           description: Custom Jasmine matchers for Syrian marketplace testing
 *         testModules:
 *           type: object
 *           description: Common test module configurations
 *         mockProviders:
 *           type: array
 *           description: Standard mock providers for testing
 */

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Custom Jasmine matchers for Syrian marketplace testing
 * Extends Jasmine's assertion capabilities with domain-specific matchers
 */
export const customMatchers: jasmine.CustomMatcherFactories = {
  /**
   * Matcher to check if text contains Arabic characters
   * Usage: expect('مرحبا').toContainArabicText()
   */
  toContainArabicText: function(): jasmine.CustomMatcher {
    return {
      compare: function(actual: string): jasmine.CustomMatcherResult {
        const arabicRegex = /[\u0600-\u06FF]/;
        const result: jasmine.CustomMatcherResult = {
          pass: arabicRegex.test(actual)
        };
        
        if (result.pass) {
          result.message = `Expected '${actual}' not to contain Arabic text`;
        } else {
          result.message = `Expected '${actual}' to contain Arabic text`;
        }
        
        return result;
      }
    };
  },

  /**
   * Matcher to validate Syrian marketplace currencies
   * Usage: expect('SYP').toBeValidSyrianCurrency()
   */
  toBeValidSyrianCurrency: function(): jasmine.CustomMatcher {
    return {
      compare: function(actual: string): jasmine.CustomMatcherResult {
        const validCurrencies = ['USD', 'SYP', 'EUR'];
        const result: jasmine.CustomMatcherResult = {
          pass: validCurrencies.includes(actual)
        };
        
        if (result.pass) {
          result.message = `Expected '${actual}' not to be a valid Syrian marketplace currency`;
        } else {
          result.message = `Expected '${actual}' to be a valid Syrian marketplace currency (${validCurrencies.join(', ')})`;
        }
        
        return result;
      }
    };
  },

  /**
   * Matcher to check array length (replaces Jest's toHaveLength)
   * Usage: expect([1,2,3]).toHaveLength(3)
   */
  toHaveLength: function(): jasmine.CustomMatcher {
    return {
      compare: function(actual: any[], expected: number): jasmine.CustomMatcherResult {
        const actualLength = actual ? actual.length : 0;
        const result: jasmine.CustomMatcherResult = {
          pass: actualLength === expected
        };
        
        if (result.pass) {
          result.message = `Expected array not to have length ${expected}`;
        } else {
          result.message = `Expected array to have length ${expected}, but got ${actualLength}`;
        }
        
        return result;
      }
    };
  },

  /**
   * Matcher to validate product structure
   * Usage: expect(product).toBeValidProduct()
   */
  toBeValidProduct: function(): jasmine.CustomMatcher {
    return {
      compare: function(actual: any): jasmine.CustomMatcherResult {
        const requiredFields = ['id', 'name', 'price', 'inventory'];
        const hasAllFields = requiredFields.every(field => actual && actual.hasOwnProperty(field));
        
        const result: jasmine.CustomMatcherResult = {
          pass: hasAllFields && typeof actual?.id === 'string'
        };
        
        if (result.pass) {
          result.message = `Expected object not to be a valid product`;
        } else {
          const missingFields = requiredFields.filter(field => !actual || !actual.hasOwnProperty(field));
          result.message = `Expected object to be a valid product. Missing fields: ${missingFields.join(', ')}`;
        }
        
        return result;
      }
    };
  },

  /**
   * Matcher to validate bilingual content structure
   * Usage: expect(content).toBeValidBilingualContent()
   */
  toBeValidBilingualContent: function(): jasmine.CustomMatcher {
    return {
      compare: function(actual: any): jasmine.CustomMatcherResult {
        const hasEnglish = actual && typeof actual.english === 'string' && actual.english.length > 0;
        const hasArabic = actual && typeof actual.arabic === 'string' && actual.arabic.length > 0;
        const arabicRegex = /[\u0600-\u06FF]/;
        const hasArabicChars = hasArabic && arabicRegex.test(actual.arabic);
        
        const result: jasmine.CustomMatcherResult = {
          pass: hasEnglish && hasArabic && hasArabicChars
        };
        
        if (result.pass) {
          result.message = `Expected object not to have valid bilingual content`;
        } else {
          let issues = [];
          if (!hasEnglish) issues.push('missing or empty English text');
          if (!hasArabic) issues.push('missing or empty Arabic text');
          if (hasArabic && !hasArabicChars) issues.push('Arabic text does not contain Arabic characters');
          result.message = `Expected object to have valid bilingual content. Issues: ${issues.join(', ')}`;
        }
        
        return result;
      }
    };
  }
};

/**
 * Common test module imports for Angular testing
 */
export const commonTestModules = [
  NoopAnimationsModule,
  RouterTestingModule.withRoutes([]),
  HttpClientTestingModule,
  MatSnackBarModule,
  MatProgressSpinnerModule
];

/**
 * Common test providers for dependency injection
 */
export const commonTestProviders = [
  // Add common providers here as needed
];

/**
 * Test configuration for Akita store testing
 */
export const akitaTestConfig = {
  /**
   * Sets up Akita store for testing with proper cleanup
   * 
   * @param stores - Array of store classes to reset after each test
   */
  setupStoreTest: (stores: any[] = []) => {
    afterEach(() => {
      stores.forEach(store => {
        if (store && typeof store.reset === 'function') {
          store.reset();
        }
      });
    });
  }
};

/**
 * Performance testing configuration
 */
export const performanceTestConfig = {
  /**
   * Maximum acceptable render time in milliseconds
   */
  maxRenderTime: 100,

  /**
   * Maximum acceptable component initialization time
   */
  maxInitTime: 50,

  /**
   * Performance test wrapper function
   * 
   * @param testName - Name of the test
   * @param testFn - Test function to measure
   * @param maxTime - Maximum allowed execution time
   */
  measurePerformance: (testName: string, testFn: () => void, maxTime: number = 100) => {
    it(`${testName} (performance)`, () => {
      const startTime = performance.now();
      testFn();
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(maxTime, 
        `Test '${testName}' took ${executionTime}ms, which exceeds the maximum allowed time of ${maxTime}ms`);
    });
  }
};

/**
 * Accessibility testing helpers
 */
export const accessibilityTestHelpers: {
  requiredAttributes: Record<string, string[]>;
  validateA11yAttributes: (element: HTMLElement, elementType: string) => void;
  validateKeyboardNavigation: (element: HTMLElement) => void;
} = {
  /**
   * Common accessibility attributes to check
   */
  requiredAttributes: {
    buttons: ['role', 'aria-label'],
    forms: ['aria-label', 'aria-describedby'],
    images: ['alt'],
    sections: ['aria-label', 'role']
  },

  /**
   * Validates accessibility attributes on elements
   * 
   * @param element - Element to validate
   * @param elementType - Type of element (button, form, etc.)
   */
  validateA11yAttributes: (element: HTMLElement, elementType: string) => {
    const required = accessibilityTestHelpers.requiredAttributes[elementType];
    if (required) {
      required.forEach((attr: string) => {
        expect(element.getAttribute(attr)).toBeTruthy(`Missing required accessibility attribute: ${attr}`);
      });
    }
  },

  /**
   * Validates keyboard navigation support
   * 
   * @param element - Element to test
   */
  validateKeyboardNavigation: (element: HTMLElement) => {
    const tabIndex = element.getAttribute('tabindex');
    expect(tabIndex).not.toBeNull('Element should be keyboard accessible (tabindex required)');
    
    if (tabIndex !== null) {
      expect(parseInt(tabIndex, 10)).toBeGreaterThanOrEqual(-1, 'Invalid tabindex value');
    }
  }
};

/**
 * Syrian marketplace specific test data
 */
export const syrianMarketplaceTestData = {
  /**
   * Valid Syrian governorates for testing
   */
  governorates: [
    { id: 'damascus', nameEn: 'Damascus', nameAr: 'دمشق' },
    { id: 'aleppo', nameEn: 'Aleppo', nameAr: 'حلب' },
    { id: 'homs', nameEn: 'Homs', nameAr: 'حمص' },
    { id: 'latakia', nameEn: 'Latakia', nameAr: 'اللاذقية' }
  ],

  /**
   * Valid currencies for Syrian marketplace
   */
  currencies: ['USD', 'SYP', 'EUR'],

  /**
   * Traditional categories with heritage information
   */
  heritageCategories: [
    {
      id: 'damascus_steel',
      nameEn: 'Damascus Steel',
      nameAr: 'الفولاذ الدمشقي',
      unesco: true,
      heritage: true
    },
    {
      id: 'aleppo_soap',
      nameEn: 'Aleppo Soap',
      nameAr: 'صابون حلب',
      unesco: false,
      heritage: true
    }
  ],

  /**
   * Sample product data for testing
   */
  sampleProducts: [
    {
      id: 'test-product-1',
      name: 'Damascus Steel Knife',
      nameArabic: 'سكين فولاذ دمشقي',
      price: { amount: 150, currency: 'USD' },
      inventory: { inStock: true, quantity: 10 }
    }
  ]
};

/**
 * Global test setup function
 * Call this in your test files to set up common test configuration
 */
export function setupAngularTest(): void {
  beforeEach(() => {
    // Add custom matchers to Jasmine
    jasmine.addMatchers(customMatchers);
  });
}

/**
 * Async test helpers
 */
export const asyncTestHelpers = {
  /**
   * Waits for a specific condition to be true
   * 
   * @param condition - Function that returns true when condition is met
   * @param timeout - Maximum wait time in milliseconds
   * @param interval - Check interval in milliseconds
   * @returns Promise that resolves when condition is met
   */
  waitFor: async (
    condition: () => boolean, 
    timeout: number = 5000, 
    interval: number = 100
  ): Promise<void> => {
    const startTime = Date.now();
    
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Condition not met within ${timeout}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  },

  /**
   * Wraps async tests with proper error handling
   * 
   * @param testFn - Async test function
   * @returns Wrapped test function
   */
  wrapAsyncTest: (testFn: () => Promise<void>) => {
    return async (done: DoneFn) => {
      try {
        await testFn();
        done();
      } catch (error) {
        done.fail(error as Error);
      }
    };
  }
};

/**
 * Type definitions for enhanced testing
 */
export interface TestComponentHarness<T = any> {
  component: T;
  fixture: any;
  debugElement: any;
  nativeElement: HTMLElement;
}

/**
 * Creates a test component harness with common utilities
 * 
 * @param fixture - Component fixture
 * @returns Enhanced test harness
 */
export function createTestHarness<T>(fixture: any): TestComponentHarness<T> {
  return {
    component: fixture.componentInstance,
    fixture,
    debugElement: fixture.debugElement,
    nativeElement: fixture.nativeElement
  };
}