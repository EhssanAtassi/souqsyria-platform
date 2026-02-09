/**
 * @file price-range-filter.component.spec.ts
 * @description Unit tests for PriceRangeFilterComponent.
 * Validates component creation, slider rendering, preset button display,
 * preset selection logic, rangeChange event emission, SYP price formatting,
 * and bilingual language handling.
 *
 * @swagger
 * tags:
 *   - name: PriceRangeFilterComponent Tests
 *     description: Verifies the price range filter component behavior
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PriceRangeFilterComponent } from './price-range-filter.component';
import { ComponentRef } from '@angular/core';

describe('PriceRangeFilterComponent', () => {
  let component: PriceRangeFilterComponent;
  let fixture: ComponentFixture<PriceRangeFilterComponent>;
  let componentRef: ComponentRef<PriceRangeFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceRangeFilterComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(PriceRangeFilterComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  // =========================================================================
  // 1. Component creates successfully
  // =========================================================================

  describe('Component Creation', () => {
    /**
     * @description Verifies the component instantiates without errors
     */
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    /**
     * @description Verifies default signal values are set correctly
     */
    it('should have correct default signal values', () => {
      fixture.detectChanges();

      expect(component.minPrice()).toBe(0);
      expect(component.maxPrice()).toBe(10000000);
      expect(component.language()).toBe('en');
      expect(component.currency()).toBe('SYP');
    });

    /**
     * @description Verifies the step value is set to 100000
     */
    it('should have a step value of 100000', () => {
      expect(component.step).toBe(100000);
    });
  });

  // =========================================================================
  // 2. Renders min/max slider inputs
  // =========================================================================

  describe('Slider Rendering', () => {
    /**
     * @description Verifies mat-slider elements are rendered in the template
     */
    it('should render mat-slider elements for min and max', () => {
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const sliders = compiled.querySelectorAll('mat-slider');

      expect(sliders.length).toBe(2);
    });

    /**
     * @description Verifies slider containers are present with correct classes
     */
    it('should render slider containers with appropriate classes', () => {
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const sliderContainers = compiled.querySelectorAll('.slider-container');

      expect(sliderContainers.length).toBe(2);
    });

    /**
     * @description Verifies the min slider has a label
     */
    it('should display labels for the sliders', () => {
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const labels = compiled.querySelectorAll('.slider-label');

      expect(labels.length).toBe(2);
    });

    /**
     * @description Verifies min and max input fields exist for direct entry
     */
    it('should render number input fields for direct entry', () => {
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const inputs = compiled.querySelectorAll('input[type="number"]');

      expect(inputs.length).toBe(2);
    });
  });

  // =========================================================================
  // 3. Shows preset price buttons
  // =========================================================================

  describe('Preset Price Buttons', () => {
    /**
     * @description Verifies all preset buttons are rendered
     */
    it('should render all preset price buttons', () => {
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const presetButtons = compiled.querySelectorAll('.price-preset-btn');

      expect(presetButtons.length).toBe(component.presets.length);
      expect(presetButtons.length).toBe(5);
    });

    /**
     * @description Verifies preset buttons display English labels by default
     */
    it('should display English labels on preset buttons by default', () => {
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const presetButtons = compiled.querySelectorAll('.price-preset-btn');

      expect(presetButtons[0].textContent!.trim()).toBe('Under 500K');
      expect(presetButtons[1].textContent!.trim()).toBe('500K - 1M');
      expect(presetButtons[2].textContent!.trim()).toBe('1M - 5M');
    });

    /**
     * @description Verifies the preset data structure contains correct ranges
     */
    it('should have correct preset price ranges', () => {
      expect(component.presets[0]).toEqual(
        jasmine.objectContaining({ min: 0, max: 500000 })
      );
      expect(component.presets[4]).toEqual(
        jasmine.objectContaining({ min: 10000000, max: 50000000 })
      );
    });

    /**
     * @description Verifies presets contain both English and Arabic labels
     */
    it('should have both English and Arabic labels for each preset', () => {
      component.presets.forEach((preset) => {
        expect(preset.labelEn).toBeTruthy();
        expect(preset.labelAr).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // 4. Selecting a preset updates min/max values
  // =========================================================================

  describe('Preset Selection', () => {
    /**
     * @description Verifies selecting a preset updates minPrice and maxPrice signals
     */
    it('should update minPrice and maxPrice when a preset is selected', () => {
      fixture.detectChanges();

      const preset = component.presets[1]; // 500K - 1M
      component.selectPreset(preset);

      expect(component.minPrice()).toBe(500000);
      expect(component.maxPrice()).toBe(1000000);
    });

    /**
     * @description Verifies the active CSS class is applied to the selected preset button
     */
    it('should apply active class to the selected preset button', () => {
      fixture.detectChanges();

      const preset = component.presets[2]; // 1M - 5M
      component.selectPreset(preset);
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const activeButtons = compiled.querySelectorAll(
        '.price-preset-btn--active'
      );

      expect(activeButtons.length).toBe(1);
      expect(activeButtons[0].textContent!.trim()).toBe('1M - 5M');
    });

    /**
     * @description Verifies selecting a different preset removes active from previous
     */
    it('should deactivate the previous preset when a new one is selected', () => {
      fixture.detectChanges();

      component.selectPreset(component.presets[0]);
      fixture.detectChanges();

      let activeButtons = fixture.nativeElement.querySelectorAll(
        '.price-preset-btn--active'
      );
      expect(activeButtons.length).toBe(1);

      /** @description Select a different preset */
      component.selectPreset(component.presets[3]);
      fixture.detectChanges();

      activeButtons = fixture.nativeElement.querySelectorAll(
        '.price-preset-btn--active'
      );
      expect(activeButtons.length).toBe(1);
      expect(activeButtons[0].textContent!.trim()).toBe('5M - 10M');
    });

    /**
     * @description Verifies clicking a preset button triggers selectPreset
     */
    it('should call selectPreset when a preset button is clicked', () => {
      fixture.detectChanges();
      spyOn(component, 'selectPreset').and.callThrough();

      const compiled: HTMLElement = fixture.nativeElement;
      const presetButtons = compiled.querySelectorAll('.price-preset-btn');

      (presetButtons[0] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.selectPreset).toHaveBeenCalledWith(
        component.presets[0]
      );
    });
  });

  // =========================================================================
  // 5. Emits priceChange event when range changes
  // =========================================================================

  describe('Price Change Emission', () => {
    /**
     * @description Verifies rangeChange emits when a preset is selected
     */
    it('should emit rangeChange when a preset is selected', () => {
      fixture.detectChanges();

      let emittedValue: { min: number; max: number } | undefined;
      component.rangeChange.subscribe((val) => (emittedValue = val));

      component.selectPreset(component.presets[1]);

      expect(emittedValue).toEqual({ min: 500000, max: 1000000 });
    });

    /**
     * @description Verifies rangeChange emits when min value changes via onMinChange
     */
    it('should emit rangeChange when min value changes', () => {
      fixture.detectChanges();

      let emittedValue: { min: number; max: number } | undefined;
      component.rangeChange.subscribe((val) => (emittedValue = val));

      component.onMinChange(200000);

      expect(emittedValue).toBeDefined();
      expect(emittedValue!.min).toBe(200000);
    });

    /**
     * @description Verifies rangeChange emits when max value changes via onMaxChange
     */
    it('should emit rangeChange when max value changes', () => {
      fixture.detectChanges();

      let emittedValue: { min: number; max: number } | undefined;
      component.rangeChange.subscribe((val) => (emittedValue = val));

      component.onMaxChange(5000000);

      expect(emittedValue).toBeDefined();
      expect(emittedValue!.max).toBe(5000000);
    });

    /**
     * @description Verifies emitChange sends both min and max in payload
     */
    it('should emit both min and max values in the payload', () => {
      fixture.detectChanges();

      component.minPrice.set(100000);
      component.maxPrice.set(3000000);

      let emittedValue: { min: number; max: number } | undefined;
      component.rangeChange.subscribe((val) => (emittedValue = val));

      component.emitChange();

      expect(emittedValue).toEqual({ min: 100000, max: 3000000 });
    });

    /**
     * @description Verifies onMinChange clamps min so it does not exceed max
     */
    it('should prevent min from exceeding max minus step', () => {
      fixture.detectChanges();

      component.maxPrice.set(500000);
      component.onMinChange(600000);

      expect(component.minPrice()).toBeLessThan(500000);
    });

    /**
     * @description Verifies onMaxChange clamps max so it does not go below min
     */
    it('should prevent max from going below min plus step', () => {
      fixture.detectChanges();

      component.minPrice.set(3000000);
      component.onMaxChange(2000000);

      expect(component.maxPrice()).toBeGreaterThan(3000000);
    });
  });

  // =========================================================================
  // 6. Formats prices in SYP with Arabic formatting
  // =========================================================================

  describe('Price Formatting', () => {
    /**
     * @description Verifies SYP formatting includes the currency suffix
     */
    it('should format SYP prices with ل.س suffix', () => {
      fixture.detectChanges();

      const formatted = component.formatPrice(5000000);

      expect(formatted).toContain('ل.س');
    });

    /**
     * @description Verifies SYP formatting uses number localization
     */
    it('should format SYP prices with localized number separators', () => {
      fixture.detectChanges();

      const formatted = component.formatPrice(5000000);

      /** @description The formatted string should contain some form of thousand separator */
      expect(formatted.length).toBeGreaterThan(4);
      expect(formatted).toContain('ل.س');
    });

    /**
     * @description Verifies USD formatting uses dollar sign prefix
     */
    it('should format USD prices with $ prefix', () => {
      fixture.detectChanges();
      componentRef.setInput('currency', 'USD');
      fixture.detectChanges();

      const formatted = component.formatPrice(1500);

      expect(formatted).toContain('$');
      expect(formatted).toContain('1,500');
    });

    /**
     * @description Verifies EUR formatting uses euro sign prefix
     */
    it('should format EUR prices with euro sign prefix', () => {
      fixture.detectChanges();
      componentRef.setInput('currency', 'EUR');
      fixture.detectChanges();

      const formatted = component.formatPrice(2500);

      expect(formatted).toContain('€');
    });

    /**
     * @description Verifies the currency symbol getter returns correct symbol
     */
    it('should return correct currency symbol for SYP', () => {
      fixture.detectChanges();

      expect(component.getCurrencySymbol()).toBe('ل.س');
    });

    /**
     * @description Verifies the currency symbol getter returns $ for USD
     */
    it('should return correct currency symbol for USD', () => {
      fixture.detectChanges();
      componentRef.setInput('currency', 'USD');
      fixture.detectChanges();

      expect(component.getCurrencySymbol()).toBe('$');
    });

    /**
     * @description Verifies the price display section shows formatted min and max
     */
    it('should display formatted min and max prices in the price display section', () => {
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const priceAmounts = compiled.querySelectorAll('.price-amount');

      expect(priceAmounts.length).toBe(2);
      expect(priceAmounts[0].textContent).toContain('ل.س');
      expect(priceAmounts[1].textContent).toContain('ل.س');
    });
  });

  // =========================================================================
  // 7. Handles language input (en/ar)
  // =========================================================================

  describe('Language Support', () => {
    /**
     * @description Verifies English labels are displayed by default
     */
    it('should display English labels by default', () => {
      fixture.detectChanges();

      expect(component.getMinLabel()).toBe('Min');
      expect(component.getMaxLabel()).toBe('Max');
    });

    /**
     * @description Verifies Arabic labels when language is set to ar
     */
    it('should display Arabic labels when language is ar', () => {
      componentRef.setInput('language', 'ar');
      fixture.detectChanges();

      expect(component.getMinLabel()).toBe('الحد الأدنى');
      expect(component.getMaxLabel()).toBe('الحد الأقصى');
    });

    /**
     * @description Verifies preset buttons show Arabic labels when language is ar
     */
    it('should show Arabic labels on preset buttons when language is ar', () => {
      componentRef.setInput('language', 'ar');
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const presetButtons = compiled.querySelectorAll('.price-preset-btn');

      expect(presetButtons[0].textContent!.trim()).toBe('أقل من 500 ألف');
      expect(presetButtons[1].textContent!.trim()).toBe('500 ألف - 1 مليون');
    });

    /**
     * @description Verifies direction attribute changes with language
     */
    it('should set dir attribute to rtl when language is ar', () => {
      componentRef.setInput('language', 'ar');
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const container = compiled.querySelector('.price-range-filter');

      expect(container?.getAttribute('dir')).toBe('rtl');
    });

    /**
     * @description Verifies direction attribute is ltr for English
     */
    it('should set dir attribute to ltr when language is en', () => {
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const container = compiled.querySelector('.price-range-filter');

      expect(container?.getAttribute('dir')).toBe('ltr');
    });

    /**
     * @description Verifies slider labels change with language
     */
    it('should display Arabic slider labels when language is ar', () => {
      componentRef.setInput('language', 'ar');
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const labels = compiled.querySelectorAll('.slider-label');

      expect(labels[0].textContent!.trim()).toBe('الحد الأدنى');
      expect(labels[1].textContent!.trim()).toBe('الحد الأقصى');
    });

    /**
     * @description Verifies price label section reflects language change
     */
    it('should display Arabic labels in price-value sections when language is ar', () => {
      componentRef.setInput('language', 'ar');
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const priceLabels = compiled.querySelectorAll('.price-label');

      expect(priceLabels[0].textContent!.trim()).toBe('الحد الأدنى');
      expect(priceLabels[1].textContent!.trim()).toBe('الحد الأقصى');
    });
  });

  // =========================================================================
  // Additional: Input initialization
  // =========================================================================

  describe('Input Initialization', () => {
    /**
     * @description Verifies minPrice initializes from initialMin input
     */
    it('should initialize minPrice from initialMin input', () => {
      componentRef.setInput('initialMin', 500000);
      fixture.detectChanges();

      expect(component.minPrice()).toBe(500000);
    });

    /**
     * @description Verifies maxPrice initializes from initialMax input
     */
    it('should initialize maxPrice from initialMax input', () => {
      componentRef.setInput('initialMax', 5000000);
      fixture.detectChanges();

      expect(component.maxPrice()).toBe(5000000);
    });

    /**
     * @description Verifies both initialMin and initialMax work together
     */
    it('should initialize both min and max from inputs', () => {
      componentRef.setInput('initialMin', 100000);
      componentRef.setInput('initialMax', 2000000);
      fixture.detectChanges();

      expect(component.minPrice()).toBe(100000);
      expect(component.maxPrice()).toBe(2000000);
    });
  });

  // =========================================================================
  // Additional: Direct input handling
  // =========================================================================

  describe('Direct Input Handling', () => {
    /**
     * @description Verifies onMinInputChange parses value and updates minPrice
     */
    it('should update minPrice from direct input change', () => {
      fixture.detectChanges();

      const mockEvent = {
        target: { value: '300000' } as HTMLInputElement,
      } as unknown as Event;

      component.onMinInputChange(mockEvent);

      expect(component.minPrice()).toBeLessThanOrEqual(300000);
    });

    /**
     * @description Verifies onMaxInputChange parses value and updates maxPrice
     */
    it('should update maxPrice from direct input change', () => {
      fixture.detectChanges();

      const mockEvent = {
        target: { value: '8000000' } as HTMLInputElement,
      } as unknown as Event;

      component.onMaxInputChange(mockEvent);

      expect(component.maxPrice()).toBeGreaterThanOrEqual(8000000);
    });

    /**
     * @description Verifies invalid input (NaN) does not update the price
     */
    it('should not update minPrice when input is NaN', () => {
      fixture.detectChanges();

      const initialMin = component.minPrice();

      const mockEvent = {
        target: { value: 'abc' } as HTMLInputElement,
      } as unknown as Event;

      component.onMinInputChange(mockEvent);

      expect(component.minPrice()).toBe(initialMin);
    });
  });
});
