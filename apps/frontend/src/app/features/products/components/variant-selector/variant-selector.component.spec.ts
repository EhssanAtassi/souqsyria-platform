/**
 * @file variant-selector.component.spec.ts
 * @description Unit tests for VariantSelectorComponent (S2 + S3)
 * Tests enriched option groups, color swatches, availability, and Arabic labels
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { VariantSelectorComponent } from './variant-selector.component';
import {
  ProductDetailVariant,
  ProductDetailAttribute,
  VariantOptionGroup,
} from '../../models/product-detail.interface';

/** Creates a mock ProductDetailVariant */
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

  function setInputs(
    variants: ProductDetailVariant[] = defaultVariants,
    options?: {
      language?: 'en' | 'ar';
      attributes?: ProductDetailAttribute[];
      optionGroups?: VariantOptionGroup[];
    }
  ): void {
    fixture.componentRef.setInput('variants', variants);
    if (options?.language) {
      fixture.componentRef.setInput('language', options.language);
    }
    if (options?.attributes) {
      fixture.componentRef.setInput('attributes', options.attributes);
    }
    if (options?.optionGroups) {
      fixture.componentRef.setInput('optionGroups', options.optionGroups);
    }
    fixture.detectChanges();
  }

  it('should create', () => {
    setInputs();
    expect(component).toBeTruthy();
  });

  describe('Enriched Option Groups', () => {
    it('should derive option groups from variant data when no optionGroups provided', () => {
      setInputs();
      const groups = component.enrichedOptionGroups();
      expect(groups.length).toBe(2);

      const names = groups.map(g => g.optionName);
      expect(names).toContain('Color');
      expect(names).toContain('Size');
    });

    it('should use API optionGroups when provided', () => {
      const apiGroups: VariantOptionGroup[] = [
        {
          optionName: 'Color',
          optionNameAr: 'اللون',
          type: 'color',
          values: [{ value: 'Red', valueAr: 'أحمر', colorHex: '#FF0000', displayOrder: 1 }],
        },
      ];

      setInputs(defaultVariants, { optionGroups: apiGroups });
      const groups = component.enrichedOptionGroups();

      expect(groups.length).toBe(1);
      expect(groups[0].optionNameAr).toBe('اللون');
      expect(groups[0].type).toBe('color');
    });

    it('should fall back to deriving from attributes for colorHex enrichment', () => {
      const attributes: ProductDetailAttribute[] = [
        { id: 1, attributeNameEn: 'Color', attributeNameAr: 'اللون', valueEn: 'Red', valueAr: 'أحمر', colorHex: '#FF0000' },
        { id: 2, attributeNameEn: 'Color', attributeNameAr: 'اللون', valueEn: 'Blue', valueAr: 'أزرق', colorHex: '#0000FF' },
      ];

      setInputs(defaultVariants, { attributes });
      const groups = component.enrichedOptionGroups();
      const colorGroup = groups.find(g => g.optionName === 'Color');

      expect(colorGroup).toBeTruthy();
      expect(colorGroup!.type).toBe('color');
      expect(colorGroup!.values.find(v => v.value === 'Red')?.colorHex).toBe('#FF0000');
    });
  });

  describe('Color Swatch Rendering', () => {
    it('should render color swatches when colorHex is present', () => {
      const apiGroups: VariantOptionGroup[] = [
        {
          optionName: 'Color',
          optionNameAr: 'اللون',
          type: 'color',
          values: [
            { value: 'Red', valueAr: 'أحمر', colorHex: '#FF0000', displayOrder: 1 },
            { value: 'Blue', valueAr: 'أزرق', colorHex: '#0000FF', displayOrder: 2 },
          ],
        },
      ];

      setInputs(defaultVariants, { optionGroups: apiGroups });
      const el: HTMLElement = fixture.nativeElement;
      const swatches = el.querySelectorAll('.variant-option__swatch');

      expect(swatches.length).toBe(2);
      expect((swatches[0] as HTMLElement).style.backgroundColor).toBeTruthy();
    });

    it('should render standard chip buttons for non-color options', () => {
      setInputs();
      const el: HTMLElement = fixture.nativeElement;
      const buttons = el.querySelectorAll('.variant-option:not(.variant-option--color)');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled State (Unavailable Combinations)', () => {
    it('should disable unavailable option values', () => {
      // Only Red/M and Blue/M exist, no Blue/L
      const variants: ProductDetailVariant[] = [
        createMockVariant({ id: 1, variantData: { Color: 'Red', Size: 'M' }, isActive: true }),
        createMockVariant({ id: 2, variantData: { Color: 'Blue', Size: 'M' }, isActive: true }),
        createMockVariant({ id: 3, variantData: { Color: 'Red', Size: 'L' }, isActive: true }),
      ];

      setInputs(variants);

      // Select Blue → L should still be available because we haven't constrained yet
      component.selectOption('Color', 'Blue');
      fixture.detectChanges();

      // L is not available with Blue (no Blue/L variant)
      expect(component.isAvailable('Size', 'M')).toBeTrue();
      expect(component.isAvailable('Size', 'L')).toBeFalse();
    });

    it('should add disabled CSS class to unavailable options', () => {
      // Red/M, Blue/M, Red/L — so selecting Blue makes L unavailable
      const variants: ProductDetailVariant[] = [
        createMockVariant({ id: 1, variantData: { Color: 'Red', Size: 'M' }, isActive: true }),
        createMockVariant({ id: 2, variantData: { Color: 'Blue', Size: 'M' }, isActive: true }),
        createMockVariant({ id: 3, variantData: { Color: 'Red', Size: 'L' }, isActive: true }),
      ];

      setInputs(variants);
      component.selectOption('Color', 'Blue');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const disabledButtons = el.querySelectorAll('.variant-option--disabled');
      // L should be disabled (no Blue/L variant)
      expect(disabledButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should not allow selection of disabled options', () => {
      const variants: ProductDetailVariant[] = [
        createMockVariant({ id: 1, variantData: { Color: 'Red', Size: 'M' } }),
      ];

      setInputs(variants);
      component.selectOption('Color', 'Red');

      // Try to select L which doesn't exist
      component.selectOption('Size', 'L');
      expect(component.selectedOptions()['Size']).toBeUndefined();
    });
  });

  describe('Arabic Labels', () => {
    it('should display Arabic labels when language is ar', () => {
      const apiGroups: VariantOptionGroup[] = [
        {
          optionName: 'Color',
          optionNameAr: 'اللون',
          type: 'select',
          values: [{ value: 'Red', valueAr: 'أحمر', colorHex: null, displayOrder: 1 }],
        },
      ];

      setInputs(defaultVariants, { language: 'ar', optionGroups: apiGroups });
      const el: HTMLElement = fixture.nativeElement;
      const label = el.querySelector('.variant-selector__label');

      expect(label?.textContent?.trim()).toBe('اللون');
    });

    it('should display Arabic option values when language is ar', () => {
      const apiGroups: VariantOptionGroup[] = [
        {
          optionName: 'Color',
          optionNameAr: 'اللون',
          type: 'select',
          values: [{ value: 'Red', valueAr: 'أحمر', colorHex: null, displayOrder: 1 }],
        },
      ];

      setInputs(defaultVariants, { language: 'ar', optionGroups: apiGroups });
      const el: HTMLElement = fixture.nativeElement;
      const buttons = el.querySelectorAll('.variant-option');
      const text = Array.from(buttons).map(b => b.textContent?.trim());

      expect(text).toContain('أحمر');
    });
  });

  describe('Selection Behavior', () => {
    it('should mark option as selected after clicking', () => {
      setInputs();
      component.selectOption('Color', 'Red');
      expect(component.isSelected('Color', 'Red')).toBeTrue();
      expect(component.isSelected('Color', 'Blue')).toBeFalse();
    });

    it('should emit variantSelect with matching variant', () => {
      setInputs();
      spyOn(component.variantSelect, 'emit');

      component.selectOption('Color', 'Red');
      component.selectOption('Size', 'M');

      expect(component.variantSelect.emit).toHaveBeenCalled();
      const emitted = (component.variantSelect.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.variantData['Color']).toBe('Red');
      expect(emitted.variantData['Size']).toBe('M');
    });

    it('should add selected CSS class', () => {
      setInputs();
      component.selectOption('Color', 'Red');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const selected = el.querySelectorAll('.variant-option--selected');
      expect(selected.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Rendering', () => {
    it('should render group labels', () => {
      setInputs();
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('.variant-selector__label');
      expect(labels.length).toBe(2);
    });

    it('should render option buttons', () => {
      setInputs();
      const el: HTMLElement = fixture.nativeElement;
      const buttons = el.querySelectorAll('.variant-option');
      // 2 colors + 2 sizes = 4
      expect(buttons.length).toBe(4);
    });

    it('should apply rtl class when language is ar', () => {
      setInputs(defaultVariants, { language: 'ar' });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.variant-selector.rtl')).toBeTruthy();
    });
  });
});
