/**
 * @file variant-selector.component.spec.ts
 * @description Unit tests for VariantSelectorComponent.
 * Validates rendering of variant option chips, selection state,
 * and emission of variantSelect output event.
 *
 * @swagger
 * tags:
 *   - name: VariantSelectorComponent Tests
 *     description: Verifies variant attribute chip rendering and selection behavior
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { VariantSelectorComponent } from './variant-selector.component';
import { ProductDetailVariant } from '../../models/product-detail.interface';

/**
 * @description Creates a mock ProductDetailVariant with sensible defaults
 * @param overrides - Partial fields to override
 * @returns Complete ProductDetailVariant
 */
function createMockVariant(
  overrides: Partial<ProductDetailVariant> = {}
): ProductDetailVariant {
  return {
    id: 1,
    sku: 'V1',
    price: 100,
    variantData: { Color: 'Red' },
    imageUrl: null,
    stockStatus: 'in_stock',
    totalStock: 10,
    isActive: true,
    ...overrides,
  };
}

describe('VariantSelectorComponent', () => {
  let component: VariantSelectorComponent;
  let fixture: ComponentFixture<VariantSelectorComponent>;

  /** @description Default mock variants used across tests */
  const defaultVariants: ProductDetailVariant[] = [
    createMockVariant({ id: 1, sku: 'V1', variantData: { Color: 'Red', Size: 'M' } }),
    createMockVariant({ id: 2, sku: 'V2', variantData: { Color: 'Blue', Size: 'M' } }),
    createMockVariant({ id: 3, sku: 'V3', variantData: { Color: 'Red', Size: 'L' } }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantSelectorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(VariantSelectorComponent);
    component = fixture.componentInstance;
  });

  /**
   * @description Sets the required variants input and triggers change detection
   * @param variants - Variant data to set
   * @param language - Optional language override
   */
  function setInputs(
    variants: ProductDetailVariant[] = defaultVariants,
    language?: 'en' | 'ar'
  ): void {
    fixture.componentRef.setInput('variants', variants);
    if (language) {
      fixture.componentRef.setInput('language', language);
    }
    fixture.detectChanges();
  }

  /**
   * @description Verifies the component instantiates successfully
   */
  it('should create', () => {
    setInputs();
    expect(component).toBeTruthy();
  });

  describe('Attribute Keys Extraction', () => {
    /**
     * @description Verifies unique attribute keys are extracted from variant data
     */
    it('should extract unique attribute keys from variants', () => {
      setInputs();
      const keys = component.attributeKeys();
      expect(keys).toContain('Color');
      expect(keys).toContain('Size');
      expect(keys.length).toBe(2);
    });

    /**
     * @description Verifies no attribute keys for empty variants
     */
    it('should return empty keys for empty variants array', () => {
      setInputs([]);
      expect(component.attributeKeys().length).toBe(0);
    });
  });

  describe('Option Values', () => {
    /**
     * @description Verifies unique option values are returned for a given key
     */
    it('should return unique option values for Color key', () => {
      setInputs();
      const colorOptions = component.getOptionsForKey()('Color');
      expect(colorOptions).toContain('Red');
      expect(colorOptions).toContain('Blue');
      expect(colorOptions.length).toBe(2);
    });

    /**
     * @description Verifies unique option values for Size key
     */
    it('should return unique option values for Size key', () => {
      setInputs();
      const sizeOptions = component.getOptionsForKey()('Size');
      expect(sizeOptions).toContain('M');
      expect(sizeOptions).toContain('L');
      expect(sizeOptions.length).toBe(2);
    });
  });

  describe('Rendering', () => {
    /**
     * @description Verifies that variant attribute groups are rendered in the DOM
     */
    it('should render attribute group labels', () => {
      setInputs();
      const compiled: HTMLElement = fixture.nativeElement;
      const labels = compiled.querySelectorAll('.variant-selector__label');
      expect(labels.length).toBe(2);

      const labelTexts = Array.from(labels).map(l => l.textContent?.trim());
      expect(labelTexts).toContain('Color');
      expect(labelTexts).toContain('Size');
    });

    /**
     * @description Verifies that variant option buttons are rendered
     */
    it('should render variant option buttons', () => {
      setInputs();
      const compiled: HTMLElement = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('.variant-option');

      // 2 colors + 2 sizes = 4 buttons
      expect(buttons.length).toBe(4);
    });

    /**
     * @description Verifies variant data labels are shown on buttons
     */
    it('should display variant data labels on option buttons', () => {
      setInputs();
      const compiled: HTMLElement = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('.variant-option');
      const buttonTexts = Array.from(buttons).map(b => b.textContent?.trim());

      expect(buttonTexts).toContain('Red');
      expect(buttonTexts).toContain('Blue');
      expect(buttonTexts).toContain('M');
      expect(buttonTexts).toContain('L');
    });
  });

  describe('Selection Behavior', () => {
    /**
     * @description Verifies that clicking an option updates the selected state
     */
    it('should mark option as selected after clicking', () => {
      setInputs();
      component.selectOption('Color', 'Red');
      expect(component.isSelected('Color', 'Red')).toBeTrue();
      expect(component.isSelected('Color', 'Blue')).toBeFalse();
    });

    /**
     * @description Verifies clicking updates selectedOptions signal
     */
    it('should update selectedOptions signal on click', () => {
      setInputs();
      component.selectOption('Color', 'Blue');
      expect(component.selectedOptions()['Color']).toBe('Blue');
    });

    /**
     * @description Verifies the selected CSS class is applied after selection
     */
    it('should add selected CSS class to clicked option', () => {
      setInputs();
      component.selectOption('Color', 'Red');
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const selectedBtns = compiled.querySelectorAll('.variant-option--selected');
      expect(selectedBtns.length).toBeGreaterThanOrEqual(1);

      const selectedText = Array.from(selectedBtns).map(b => b.textContent?.trim());
      expect(selectedText).toContain('Red');
    });
  });

  describe('variantSelect Output', () => {
    /**
     * @description Verifies variantSelect emits matching variant when option is clicked
     */
    it('should emit variantSelect with matching variant on option selection', () => {
      setInputs();
      spyOn(component.variantSelect, 'emit');

      // Select both attributes to fully match a variant
      component.selectOption('Color', 'Red');
      component.selectOption('Size', 'M');

      expect(component.variantSelect.emit).toHaveBeenCalled();
      const emittedVariant = (component.variantSelect.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedVariant.variantData['Color']).toBe('Red');
      expect(emittedVariant.variantData['Size']).toBe('M');
    });

    /**
     * @description Verifies variantSelect emits on partial match if a variant matches
     */
    it('should emit variantSelect even on partial match when variant matches', () => {
      const singleKeyVariants: ProductDetailVariant[] = [
        createMockVariant({ id: 1, variantData: { Color: 'Red' } }),
        createMockVariant({ id: 2, variantData: { Color: 'Blue' } }),
      ];
      setInputs(singleKeyVariants);

      spyOn(component.variantSelect, 'emit');
      component.selectOption('Color', 'Blue');

      expect(component.variantSelect.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ variantData: { Color: 'Blue' } })
      );
    });

    /**
     * @description Verifies DOM click on option button triggers emission
     */
    it('should emit variantSelect when option button is clicked in DOM', () => {
      const singleKeyVariants: ProductDetailVariant[] = [
        createMockVariant({ id: 1, variantData: { Color: 'Red' } }),
        createMockVariant({ id: 2, variantData: { Color: 'Blue' } }),
      ];
      setInputs(singleKeyVariants);

      spyOn(component.variantSelect, 'emit');

      const compiled: HTMLElement = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('.variant-option');
      const blueButton = Array.from(buttons).find(
        b => b.textContent?.trim() === 'Blue'
      ) as HTMLButtonElement;

      expect(blueButton).toBeTruthy();
      blueButton.click();
      fixture.detectChanges();

      expect(component.variantSelect.emit).toHaveBeenCalled();
    });
  });
});
