// Test setup file for Syrian Marketplace Angular Enterprise Application
// Configures Angular testing environment and Syrian marketplace specific test utilities

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

/**
 * Syrian Marketplace Test Environment Setup
 *
 * Configures comprehensive testing environment including:
 * - Angular testing platform initialization
 * - Custom matchers for Syrian marketplace features
 * - Arabic text and RTL testing utilities
 * - Mock data providers for Syrian cultural content
 * - Test performance monitoring
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianTestEnvironment:
 *       type: object
 *       description: Test environment configuration for Syrian marketplace
 *       properties:
 *         customMatchers:
 *           type: object
 *           description: Custom Jasmine matchers for Syrian features
 *         mockProviders:
 *           type: array
 *           description: Mock services for Syrian marketplace testing
 *         testUtilities:
 *           type: object
 *           description: Utility functions for Syrian marketplace testing
 */

// Initialize Angular testing platform
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Custom matchers for Syrian marketplace testing
beforeEach(() => {
  jasmine.addMatchers({
    /**
     * Custom matcher to validate Arabic text content
     * Checks if text contains Arabic characters
     */
    toContainArabicText: function() {
      return {
        compare: function(actual: string, expected?: string) {
          const arabicRegex = /[\u0600-\u06FF]/;
          const result = {
            pass: arabicRegex.test(actual)
          } as any;

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
     * Custom matcher to validate Syrian currency codes
     * Checks if currency is valid for Syrian marketplace
     */
    toBeValidSyrianCurrency: function() {
      return {
        compare: function(actual: string) {
          const validCurrencies = ['USD', 'SYP', 'EUR'];
          const result = {
            pass: validCurrencies.includes(actual)
          } as any;

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
     * Custom matcher to validate Syrian governorate names
     * Checks if governorate is a valid Syrian administrative division
     */
    toBeValidSyrianGovernorate: function() {
      return {
        compare: function(actual: string) {
          const validGovernorates = [
            'Damascus', 'Aleppo', 'Homs', 'Latakia', 'Daraa', 'Deir ez-Zor',
            'Hasakah', 'Idlib', 'Hama', 'Tartus', 'Raqqa', 'As-Suwayda', 'Quneitra',
            'دمشق', 'حلب', 'حمص', 'اللاذقية', 'درعا', 'دير الزور'
          ];

          const result = {
            pass: validGovernorates.some(gov =>
              gov.toLowerCase() === actual.toLowerCase() ||
              gov === actual
            )
          } as any;

          if (result.pass) {
            result.message = `Expected '${actual}' not to be a valid Syrian governorate`;
          } else {
            result.message = `Expected '${actual}' to be a valid Syrian governorate`;
          }

          return result;
        }
      };
    },

    /**
     * Custom matcher to validate UNESCO heritage categories
     * Checks if category represents UNESCO recognized Syrian heritage
     */
    toBeUNESCOHeritageCategory: function() {
      return {
        compare: function(actual: string) {
          const unescoCategories = [
            'damascus_steel', 'aleppo_soap', 'traditional_crafts',
            'damascus_steel_blades', 'traditional_weaving'
          ];

          const result = {
            pass: unescoCategories.includes(actual.toLowerCase())
          } as any;

          if (result.pass) {
            result.message = `Expected '${actual}' not to be a UNESCO heritage category`;
          } else {
            result.message = `Expected '${actual}' to be a UNESCO heritage category`;
          }

          return result;
        }
      };
    },

    /**
     * Custom matcher to validate Syrian phone number format
     * Checks if phone number matches Syrian format (+963 or 09xx)
     */
    toBeValidSyrianPhoneNumber: function() {
      return {
        compare: function(actual: string) {
          const syrianPhoneRegex = /^(\+963|0)(9[0-9]{8}|1[1-5][0-9]{7})$/;
          const result = {
            pass: syrianPhoneRegex.test(actual.replace(/[\s-]/g, ''))
          } as any;

          if (result.pass) {
            result.message = `Expected '${actual}' not to be a valid Syrian phone number`;
          } else {
            result.message = `Expected '${actual}' to be a valid Syrian phone number format`;
          }

          return result;
        }
      };
    },

    /**
     * Custom matcher to validate inventory status
     * Checks if status is valid for Syrian marketplace inventory
     */
    toBeValidInventoryStatus: function() {
      return {
        compare: function(actual: string) {
          const validStatuses = ['in_stock', 'low_stock', 'out_of_stock', 'pre_order', 'discontinued'];
          const result = {
            pass: validStatuses.includes(actual)
          } as any;

          if (result.pass) {
            result.message = `Expected '${actual}' not to be a valid inventory status`;
          } else {
            result.message = `Expected '${actual}' to be a valid inventory status (${validStatuses.join(', ')})`;
          }

          return result;
        }
      };
    },

    /**
     * Custom matcher to validate order status in Syrian workflow
     * Checks if status is valid in the 22-stage Syrian order workflow
     */
    toBeValidSyrianOrderStatus: function() {
      return {
        compare: function(actual: string) {
          const validStatuses = [
            'pending', 'confirmed', 'payment_verified', 'preparing_shipment',
            'shipped', 'in_transit', 'delivered', 'cancelled', 'returned',
            'refunded', 'pending_review', 'processing', 'awaiting_payment'
          ];

          const result = {
            pass: validStatuses.includes(actual)
          } as any;

          if (result.pass) {
            result.message = `Expected '${actual}' not to be a valid Syrian order status`;
          } else {
            result.message = `Expected '${actual}' to be a valid Syrian order status`;
          }

          return result;
        }
      };
    }
  });
});

// Global test utilities for Syrian marketplace
(window as any).SyrianTestUtils = {
  /**
   * Generate mock Syrian product data
   * Creates realistic test data for Syrian marketplace products
   */
  generateMockSyrianProduct: (overrides: any = {}) => {
    return {
      id: `product_${Date.now()}`,
      name: 'Damascus Steel Knife',
      nameArabic: 'سكين من الفولاذ الدمشقي',
      sku: 'DSK-001',
      price: { amount: 150, currency: 'USD' },
      category: {
        id: 'damascus-steel',
        name: 'Damascus Steel',
        nameArabic: 'الفولاذ الدمشقي'
      },
      seller: {
        name: 'Damascus Artisans',
        nameArabic: 'حرفيو دمشق',
        location: { city: 'Damascus', governorate: 'Damascus' }
      },
      authenticity: {
        certified: true,
        heritage: 'traditional',
        unescoRecognized: true
      },
      inventory: {
        quantity: 10,
        status: 'in_stock'
      },
      ...overrides
    };
  },

  /**
   * Generate mock Syrian order data
   * Creates realistic test data for Syrian marketplace orders
   */
  generateMockSyrianOrder: (overrides: any = {}) => {
    return {
      id: `order_${Date.now()}`,
      orderNumber: 'SO-2024-001',
      status: 'pending',
      customer: {
        name: 'Ahmed Al-Shami',
        nameArabic: 'أحمد الشامي',
        email: 'ahmed@example.com',
        phone: '+963-991-234567'
      },
      shipping: {
        address: {
          city: 'Damascus',
          cityArabic: 'دمشق',
          governorate: 'Damascus',
          governorateArabic: 'دمشق'
        }
      },
      payment: {
        method: 'cash_on_delivery',
        currency: 'USD'
      },
      totals: {
        total: { amount: 200, currency: 'USD' }
      },
      ...overrides
    };
  },

  /**
   * Generate mock Syrian vendor data
   * Creates realistic test data for Syrian marketplace vendors
   */
  generateMockSyrianVendor: (overrides: any = {}) => {
    return {
      id: `vendor_${Date.now()}`,
      businessInfo: {
        businessName: 'Damascus Traditional Crafts',
        businessNameArabic: 'الحرف التقليدية الدمشقية',
        specializations: ['damascus_steel', 'traditional_crafts']
      },
      contactInfo: {
        ownerName: 'Mohammad Al-Dimashqi',
        ownerNameArabic: 'محمد الدمشقي',
        email: 'mohammad@example.com',
        phone: '+963-11-234567'
      },
      address: {
        city: 'Damascus',
        cityArabic: 'دمشق',
        governorate: 'Damascus',
        governorateArabic: 'دمشق'
      },
      verification: {
        heritageVerified: true,
        unescoRecognized: true
      },
      ...overrides
    };
  },

  /**
   * Mock Syrian governorate data
   * Provides test data for Syrian administrative divisions
   */
  getMockSyrianGovernorates: () => {
    return [
      {
        id: 'damascus',
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        regions: [
          {
            id: 'old_damascus',
            nameEn: 'Old Damascus',
            nameAr: 'دمشق القديمة',
            governorateId: 'damascus'
          }
        ]
      },
      {
        id: 'aleppo',
        nameEn: 'Aleppo',
        nameAr: 'حلب',
        regions: [
          {
            id: 'old_aleppo',
            nameEn: 'Old Aleppo',
            nameAr: 'حلب القديمة',
            governorateId: 'aleppo'
          }
        ]
      }
    ];
  },

  /**
   * Arabic text testing utilities
   * Provides functions for testing Arabic text handling
   */
  arabicTextUtils: {
    isArabicText: (text: string) => /[\u0600-\u06FF]/.test(text),
    isRTLDirection: (element: HTMLElement) => {
      const style = window.getComputedStyle(element);
      return style.direction === 'rtl';
    },
    generateArabicText: (length: number = 10) => {
      const arabicChars = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += arabicChars[Math.floor(Math.random() * arabicChars.length)];
      }
      return result;
    }
  },

  /**
   * Currency and pricing utilities
   * Provides functions for testing Syrian marketplace pricing
   */
  currencyUtils: {
    formatSyrianPrice: (amount: number, currency: string) => {
      const formatters = {
        USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
        SYP: new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP' }),
        EUR: new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' })
      };
      return formatters[currency]?.format(amount) || `${amount} ${currency}`;
    },

    convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => {
      // Mock exchange rates for testing
      const rates = {
        'USD_SYP': 13000,
        'USD_EUR': 0.92,
        'SYP_USD': 1 / 13000,
        'EUR_USD': 1 / 0.92
      };
      const rateKey = `${fromCurrency}_${toCurrency}`;
      return rates[rateKey] ? amount * rates[rateKey] : amount;
    }
  }
};

// Performance monitoring for tests
let testStartTime: number;

beforeEach(() => {
  testStartTime = performance.now();
});

afterEach(() => {
  const testDuration = performance.now() - testStartTime;
  if (testDuration > 5000) { // Warn for tests taking longer than 5 seconds
    console.warn(`Slow test detected: ${jasmine.currentTest?.fullName} took ${testDuration.toFixed(2)}ms`);
  }
});

// Global error handler for tests
window.addEventListener('error', (event) => {
  console.error('Uncaught error in test:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in test:', event.reason);
});

// Console log capturing for tests
const originalConsole = { ...console };
(window as any).captureConsoleLogs = () => {
  const logs: any[] = [];
  ['log', 'warn', 'error', 'info'].forEach(method => {
    console[method] = (...args: any[]) => {
      logs.push({ method, args, timestamp: Date.now() });
      originalConsole[method](...args);
    };
  });
  return {
    getLogs: () => logs,
    restore: () => {
      Object.assign(console, originalConsole);
    }
  };
};

// Declare custom matchers for TypeScript
declare global {
  namespace jasmine {
    interface Matchers<T> {
      toContainArabicText(): boolean;
      toBeValidSyrianCurrency(): boolean;
      toBeValidSyrianGovernorate(): boolean;
      toBeUNESCOHeritageCategory(): boolean;
      toBeValidSyrianPhoneNumber(): boolean;
      toBeValidInventoryStatus(): boolean;
      toBeValidSyrianOrderStatus(): boolean;
    }
  }
}

export {};