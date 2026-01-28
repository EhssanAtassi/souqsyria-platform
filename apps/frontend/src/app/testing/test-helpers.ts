/**
 * Angular Testing Helper Utilities
 * 
 * Provides consistent testing utilities following Angular 17+ best practices
 * and Jasmine testing patterns. Ensures type safety and reduces code duplication
 * across test suites.
 * 
 * @swagger
 * components:
 *   schemas:
 *     TestHelpers:
 *       type: object
 *       description: Collection of testing utilities for Angular applications
 *       properties:
 *         mockEvent:
 *           type: function
 *           description: Creates properly typed Event mocks for Jasmine
 *         expectArrayLength:
 *           type: function
 *           description: Type-safe array length assertions
 *         createMockComponent:
 *           type: function
 *           description: Creates component mocks with proper lifecycle hooks
 */

import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';

/**
 * Creates a properly typed Event mock for Jasmine testing
 * Addresses the common issue of incomplete Event objects in tests
 * 
 * @param type - Event type (click, error, etc.)
 * @param target - Event target element
 * @param options - Additional event properties
 * @returns Fully formed Event mock compatible with Jasmine
 */
export function createMockEvent<T extends Element = HTMLElement>(
  type: string,
  target?: T,
  options: Partial<Event> = {}
): Event {
  const mockTarget = target || ({} as T);
  
  return {
    target: mockTarget,
    currentTarget: mockTarget,
    type,
    bubbles: options.bubbles ?? false,
    cancelable: options.cancelable ?? false,
    composed: options.composed ?? false,
    defaultPrevented: options.defaultPrevented ?? false,
    eventPhase: options.eventPhase ?? 2,
    isTrusted: options.isTrusted ?? true,
    timeStamp: options.timeStamp ?? Date.now(),
    preventDefault: jasmine.createSpy('preventDefault'),
    stopPropagation: jasmine.createSpy('stopPropagation'),
    stopImmediatePropagation: jasmine.createSpy('stopImmediatePropagation'),
    ...options
  } as unknown as Event;
}

/**
 * Creates a properly typed MouseEvent mock for Jasmine testing
 * 
 * @param type - Mouse event type (click, mouseover, etc.)
 * @param target - Event target element
 * @param options - Additional mouse event properties
 * @returns Fully formed MouseEvent mock
 */
export function createMockMouseEvent<T extends Element = HTMLElement>(
  type: string,
  target?: T,
  options: Partial<MouseEvent> = {}
): MouseEvent {
  const baseEvent = createMockEvent(type, target, options);
  
  return {
    ...baseEvent,
    button: options.button ?? 0,
    buttons: options.buttons ?? 0,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    ...options
  } as unknown as MouseEvent;
}

/**
 * Type-safe assertion for array lengths
 * Replaces Jest's toHaveLength with Jasmine equivalent
 * 
 * @param actual - Array to test
 * @param expected - Expected length
 * @param message - Optional assertion message
 */
export function expectArrayLength<T>(
  actual: T[] | undefined | null,
  expected: number,
  message?: string
): void {
  const array = actual || [];
  expect(array.length).toBe(expected, message);
}

/**
 * Type-safe assertion for array contents
 * Handles potentially undefined arrays safely
 * 
 * @param actual - Array to test
 * @param expected - Expected contents
 * @param message - Optional assertion message
 */
export function expectArrayContains<T>(
  actual: T[] | undefined | null,
  expected: T,
  message?: string
): void {
  const array = actual || [];
  expect(array).toContain(expected, message);
}

/**
 * Type-safe assertion for object properties
 * Handles potentially undefined state objects
 * 
 * @param actual - Object to test
 * @param property - Property to check
 * @param expected - Expected value
 */
export function expectObjectProperty<T, K extends keyof T>(
  actual: T | undefined | null,
  property: K,
  expected: T[K]
): void {
  const obj = actual || {} as T;
  expect(obj[property]).toBe(expected);
}

/**
 * Creates a spy object with proper typing for Angular services
 * Replaces manual jasmine.createSpyObj calls with better typing
 * 
 * @param serviceName - Name of the service being mocked
 * @param methods - Array of method names to spy on
 * @param properties - Optional object of properties to include
 * @returns Typed spy object
 */
export function createServiceSpy<T>(
  serviceName: string,
  methods: Array<keyof T>,
  properties?: Partial<T>
): jasmine.SpyObj<T> {
  const spy = jasmine.createSpyObj(serviceName, methods as string[], properties);
  return spy as jasmine.SpyObj<T>;
}

/**
 * Creates a mock Angular component for testing
 * Useful for shallow testing and avoiding deep component trees
 * 
 * @param selector - Component selector
 * @param inputs - Input properties
 * @param outputs - Output events
 * @returns Mock component class
 */
export function createMockComponent(
  selector: string,
  inputs: string[] = [],
  outputs: string[] = []
): any {
  const mockComponent = class {
    constructor() {
      // Initialize input properties
      inputs.forEach(input => {
        (this as any)[input] = undefined;
      });
      
      // Initialize output properties as EventEmitters
      outputs.forEach(output => {
        (this as any)[output] = {
          emit: jasmine.createSpy(`${output}.emit`)
        };
      });
    }
  };

  // Add Component decorator metadata
  Object.defineProperty(mockComponent, 'annotations', {
    value: [{
      selector,
      template: `<div data-testid="${selector}">Mock ${selector}</div>`,
      inputs,
      outputs
    }]
  });

  return mockComponent;
}

/**
 * Waits for Angular change detection and component updates
 * Useful for async operations and signal updates
 * 
 * @param fixture - Component fixture
 * @param milliseconds - Time to wait (default: 0 for next tick)
 * @returns Promise that resolves after detection
 */
export async function waitForChanges<T>(
  fixture: ComponentFixture<T>,
  milliseconds: number = 0
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
  fixture.detectChanges();
  await fixture.whenStable();
}

/**
 * Finds elements by test ID attribute
 * Provides a consistent way to select test elements
 * 
 * @param fixture - Component fixture
 * @param testId - Test ID attribute value
 * @returns Debug element or null
 */
export function getByTestId<T>(
  fixture: ComponentFixture<T>,
  testId: string
): DebugElement | null {
  const debugElement = fixture.debugElement.query(
    debugEl => debugEl.nativeElement?.getAttribute?.('data-testid') === testId
  );
  return debugElement;
}

/**
 * Finds all elements by test ID attribute
 * 
 * @param fixture - Component fixture
 * @param testId - Test ID attribute value
 * @returns Array of debug elements
 */
export function getAllByTestId<T>(
  fixture: ComponentFixture<T>,
  testId: string
): DebugElement[] {
  const debugElements = fixture.debugElement.queryAll(
    debugEl => debugEl.nativeElement?.getAttribute?.('data-testid') === testId
  );
  return debugElements;
}

/**
 * Triggers a click event on an element
 * Handles proper event creation and propagation
 * 
 * @param element - Element to click
 * @param fixture - Component fixture
 */
export function clickElement<T>(
  element: DebugElement | HTMLElement,
  fixture: ComponentFixture<T>
): void {
  const htmlElement = element instanceof DebugElement ? element.nativeElement : element;
  const clickEvent = createMockMouseEvent('click', htmlElement);
  
  if (element instanceof DebugElement) {
    element.triggerEventHandler('click', clickEvent);
  } else {
    htmlElement.dispatchEvent(clickEvent);
  }
  
  fixture.detectChanges();
}

/**
 * Types text into an input element
 * Simulates user typing with proper events
 * 
 * @param element - Input element
 * @param text - Text to type
 * @param fixture - Component fixture
 */
export function typeIntoInput<T>(
  element: DebugElement | HTMLInputElement,
  text: string,
  fixture: ComponentFixture<T>
): void {
  const inputElement = element instanceof DebugElement 
    ? element.nativeElement as HTMLInputElement
    : element;
  
  inputElement.value = text;
  inputElement.dispatchEvent(createMockEvent('input', inputElement));
  inputElement.dispatchEvent(createMockEvent('change', inputElement));
  
  fixture.detectChanges();
}

/**
 * Asserts that an element has specific CSS classes
 * 
 * @param element - Element to check
 * @param expectedClasses - Array of expected class names
 */
export function expectElementClasses(
  element: DebugElement | HTMLElement,
  expectedClasses: string[]
): void {
  const htmlElement = element instanceof DebugElement ? element.nativeElement : element;
  const classList = Array.from(htmlElement.classList);
  
  expectedClasses.forEach(className => {
    expect(classList).toContain(className, 
      `Expected element to have class '${className}'. Actual classes: ${classList.join(', ')}`);
  });
}

/**
 * Asserts that an element has specific attributes
 * 
 * @param element - Element to check
 * @param expectedAttributes - Object of expected attributes and values
 */
export function expectElementAttributes(
  element: DebugElement | HTMLElement,
  expectedAttributes: Record<string, string | null>
): void {
  const htmlElement = element instanceof DebugElement ? element.nativeElement : element;
  
  Object.entries(expectedAttributes).forEach(([attr, expectedValue]) => {
    const actualValue = htmlElement.getAttribute(attr);
    expect(actualValue).toBe(expectedValue, 
      `Expected attribute '${attr}' to be '${expectedValue}', but got '${actualValue}'`);
  });
}

/**
 * Comprehensive test data factory for creating consistent mock data
 * Follows the pattern used across Syrian marketplace tests
 */
export class TestDataFactory {
  /**
   * Creates a mock product with default values
   * 
   * @param overrides - Properties to override
   * @returns Mock product object
   */
  static createMockProduct(overrides: Partial<any> = {}): any {
    const defaultProduct = {
      id: 'test-product-001',
      name: 'Test Damascus Steel Knife',
      nameArabic: 'سكين الفولاذ الدمشقي للاختبار',
      slug: 'test-damascus-steel-knife',
      description: 'Test product description',
      descriptionArabic: 'وصف المنتج للاختبار',
      price: {
        amount: 150,
        currency: 'USD',
        originalPrice: 200
      },
      images: [{
        id: 'test-image-1',
        url: 'https://example.com/test-image.jpg',
        alt: 'Test Product Image',
        isPrimary: true,
        order: 1
      }],
      category: {
        id: 'damascus-steel',
        name: 'Damascus Steel',
        nameArabic: 'الفولاذ الدمشقي',
        slug: 'damascus-steel'
      },
      inventory: {
        inStock: true,
        quantity: 25,
        minOrderQuantity: 1,
        status: 'in_stock',
        lowStockThreshold: 5
      },
      reviews: {
        averageRating: 4.8,
        totalReviews: 127,
        ratingDistribution: { 1: 3, 2: 2, 3: 8, 4: 31, 5: 83 }
      },
      authenticity: {
        certified: true,
        heritage: 'traditional',
        unescoRecognition: true,
        badges: ['UNESCO Heritage', 'Handcrafted', 'Syrian Artisan']
      },
      timestamps: {
        created: new Date('2025-01-01T00:00:00Z'),
        updated: new Date('2025-01-10T12:00:00Z')
      }
    };

    return { ...defaultProduct, ...overrides };
  }

  /**
   * Creates a mock hero banner with default values
   * 
   * @param overrides - Properties to override
   * @returns Mock hero banner object
   */
  static createMockHeroBanner(overrides: Partial<any> = {}): any {
    const defaultBanner = {
      id: 'test-banner-001',
      name: {
        english: 'Test Banner',
        arabic: 'بانر اختبار'
      },
      type: 'main',
      status: 'active',
      priority: 100,
      image: {
        url: '/assets/test.jpg',
        alt: {
          english: 'Test Image',
          arabic: 'صورة اختبار'
        },
        dimensions: { width: 1920, height: 800 },
        format: 'jpg',
        size: 200000
      },
      headline: {
        english: 'Test Headline',
        arabic: 'عنوان اختبار'
      },
      cta: {
        text: {
          english: 'Shop Now',
          arabic: 'تسوق الآن'
        },
        variant: 'primary',
        size: 'large',
        visible: true
      },
      analytics: {
        impressions: 0,
        clicks: 0,
        clickThroughRate: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        lastUpdated: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return { ...defaultBanner, ...overrides };
  }
}

/**
 * Console spy utilities for testing logging and analytics
 */




export class ConsoleSpy {
  private static spies: jasmine.Spy[] = [];

  /**
   * Spies on console methods and tracks calls
   * 
   * @param methods - Console methods to spy on
   * @returns Object with spy methods
   */
  static setup(methods: Array<keyof Console> = ['log', 'warn', 'error']): Record<string, jasmine.Spy> {
    const spies: Record<string, jasmine.Spy> = {};
    
    methods.forEach(method => {
      const spy = spyOn(console, method).and.callThrough();
      spies[method as string] = spy;
      ConsoleSpy.spies.push(spy);
    });
    
    return spies;
  }

  /**
   * Resets all console spies
   */
  static reset(): void {
    ConsoleSpy.spies.forEach(spy => spy.calls.reset());
  }

  /**
   * Removes all console spies
   */
  static cleanup(): void {
    ConsoleSpy.spies = [];
  }
}

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

/**
 * Global test setup function
 * Call this in your test files to set up common test configuration
 */
export function setupAngularTest(): void {
  // This is intentionally empty for now
  // Custom matchers should be set up in individual test files
  // or via Karma configuration
}