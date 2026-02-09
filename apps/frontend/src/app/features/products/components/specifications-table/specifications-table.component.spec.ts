/**
 * @file specifications-table.component.spec.ts
 * @description Unit tests for SpecificationsTableComponent.
 * Validates rendering of attribute rows, bilingual labels,
 * color swatch display, and empty state handling.
 *
 * @swagger
 * tags:
 *   - name: SpecificationsTableComponent Tests
 *     description: Verifies product specification table rendering and localization
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpecificationsTableComponent } from './specifications-table.component';
import { ProductDetailAttribute } from '../../models/product-detail.interface';

/**
 * @description Creates a mock ProductDetailAttribute with sensible defaults
 * @param overrides - Partial fields to override
 * @returns Complete ProductDetailAttribute
 */
function createMockAttribute(
  overrides: Partial<ProductDetailAttribute> = {}
): ProductDetailAttribute {
  return {
    id: 1,
    attributeNameEn: 'Color',
    attributeNameAr: 'اللون',
    valueEn: 'Red',
    valueAr: 'أحمر',
    colorHex: null,
    ...overrides,
  };
}

describe('SpecificationsTableComponent', () => {
  let component: SpecificationsTableComponent;
  let fixture: ComponentFixture<SpecificationsTableComponent>;

  /** @description Default mock attributes used across tests */
  const defaultAttributes: ProductDetailAttribute[] = [
    createMockAttribute({
      id: 1,
      attributeNameEn: 'Color',
      attributeNameAr: 'اللون',
      valueEn: 'Red',
      valueAr: 'أحمر',
      colorHex: '#FF0000',
    }),
    createMockAttribute({
      id: 2,
      attributeNameEn: 'Material',
      attributeNameAr: 'المادة',
      valueEn: 'Cotton',
      valueAr: 'قطن',
      colorHex: null,
    }),
    createMockAttribute({
      id: 3,
      attributeNameEn: 'Weight',
      attributeNameAr: 'الوزن',
      valueEn: '500g',
      valueAr: '٥٠٠ غرام',
      colorHex: null,
    }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecificationsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecificationsTableComponent);
    component = fixture.componentInstance;
  });

  /**
   * @description Sets the required attributes input and triggers change detection
   * @param attributes - Attribute data to set
   * @param language - Optional language override
   */
  function setInputs(
    attributes: ProductDetailAttribute[] = defaultAttributes,
    language?: 'en' | 'ar'
  ): void {
    fixture.componentRef.setInput('attributes', attributes);
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

  describe('Table Rendering', () => {
    /**
     * @description Verifies a table row is rendered for each attribute
     */
    it('should render a table row for each attribute', () => {
      setInputs();
      const compiled: HTMLElement = fixture.nativeElement;
      const rows = compiled.querySelectorAll('.specifications-table__row');
      expect(rows.length).toBe(3);
    });

    /**
     * @description Verifies the table element is rendered when attributes exist
     */
    it('should render the table when attributes are provided', () => {
      setInputs();
      const compiled: HTMLElement = fixture.nativeElement;
      const table = compiled.querySelector('.specifications-table__table');
      expect(table).toBeTruthy();
    });
  });

  describe('Bilingual Labels', () => {
    /**
     * @description Verifies English labels are displayed when language is 'en'
     */
    it('should display English attribute names when language is en', () => {
      setInputs(defaultAttributes, 'en');

      const compiled: HTMLElement = fixture.nativeElement;
      const labels = compiled.querySelectorAll('.specifications-table__label');
      const labelTexts = Array.from(labels).map(l => l.textContent?.trim());

      expect(labelTexts).toContain('Color');
      expect(labelTexts).toContain('Material');
      expect(labelTexts).toContain('Weight');
    });

    /**
     * @description Verifies English values are displayed when language is 'en'
     */
    it('should display English attribute values when language is en', () => {
      setInputs(defaultAttributes, 'en');

      const compiled: HTMLElement = fixture.nativeElement;
      const values = compiled.querySelectorAll('.specifications-table__value');
      const valueTexts = Array.from(values).map(v => v.textContent?.trim());

      expect(valueTexts).toContain('Red');
      expect(valueTexts).toContain('Cotton');
      expect(valueTexts).toContain('500g');
    });

    /**
     * @description Verifies Arabic labels are displayed when language is 'ar'
     */
    it('should display Arabic attribute names when language is ar', () => {
      setInputs(defaultAttributes, 'ar');

      const compiled: HTMLElement = fixture.nativeElement;
      const labels = compiled.querySelectorAll('.specifications-table__label');
      const labelTexts = Array.from(labels).map(l => l.textContent?.trim());

      expect(labelTexts).toContain('اللون');
      expect(labelTexts).toContain('المادة');
      expect(labelTexts).toContain('الوزن');
    });

    /**
     * @description Verifies Arabic values are displayed when language is 'ar'
     */
    it('should display Arabic attribute values when language is ar', () => {
      setInputs(defaultAttributes, 'ar');

      const compiled: HTMLElement = fixture.nativeElement;
      const values = compiled.querySelectorAll('.specifications-table__value');
      const valueTexts = Array.from(values).map(v => v.textContent?.trim());

      expect(valueTexts).toContain('أحمر');
      expect(valueTexts).toContain('قطن');
      expect(valueTexts).toContain('٥٠٠ غرام');
    });
  });

  describe('Empty State', () => {
    /**
     * @description Verifies the empty state message is shown when no attributes exist
     */
    it('should show empty state when no attributes are provided', () => {
      setInputs([]);

      const compiled: HTMLElement = fixture.nativeElement;
      const emptyEl = compiled.querySelector('.specifications-table__empty');
      const table = compiled.querySelector('.specifications-table__table');

      expect(emptyEl).toBeTruthy();
      expect(table).toBeNull();
    });

    /**
     * @description Verifies English empty message content
     */
    it('should display English empty message when language is en', () => {
      setInputs([], 'en');

      const compiled: HTMLElement = fixture.nativeElement;
      const emptyEl = compiled.querySelector('.specifications-table__empty');

      expect(emptyEl?.textContent?.trim()).toBe('No specifications available');
    });

    /**
     * @description Verifies Arabic empty message content
     */
    it('should display Arabic empty message when language is ar', () => {
      setInputs([], 'ar');

      const compiled: HTMLElement = fixture.nativeElement;
      const emptyEl = compiled.querySelector('.specifications-table__empty');

      expect(emptyEl?.textContent?.trim()).toBe('لا توجد مواصفات متاحة');
    });
  });

  describe('Color Swatch', () => {
    /**
     * @description Verifies a color swatch is shown for attributes with colorHex
     */
    it('should show color swatch for attributes with colorHex', () => {
      setInputs();

      const compiled: HTMLElement = fixture.nativeElement;
      const swatches = compiled.querySelectorAll('.specifications-table__color-swatch');

      // Only the first attribute (Color) has colorHex
      expect(swatches.length).toBe(1);
    });

    /**
     * @description Verifies the color swatch has the correct background color
     */
    it('should set correct background color on swatch', () => {
      setInputs();

      const compiled: HTMLElement = fixture.nativeElement;
      const swatch = compiled.querySelector('.specifications-table__color-swatch') as HTMLElement;

      expect(swatch).toBeTruthy();
      expect(swatch.style.backgroundColor).toBeTruthy();
    });

    /**
     * @description Verifies no color swatch for attributes without colorHex
     */
    it('should not show color swatch for attributes without colorHex', () => {
      const noColorAttrs = [
        createMockAttribute({ id: 1, colorHex: null }),
      ];
      setInputs(noColorAttrs);

      const compiled: HTMLElement = fixture.nativeElement;
      const swatches = compiled.querySelectorAll('.specifications-table__color-swatch');

      expect(swatches.length).toBe(0);
    });
  });

  describe('Computed Signals', () => {
    /**
     * @description Verifies localizedRows computed signal maps correctly for English
     */
    it('should compute localized rows for English', () => {
      setInputs(defaultAttributes, 'en');

      const rows = component.localizedRows();
      expect(rows.length).toBe(3);
      expect(rows[0].name).toBe('Color');
      expect(rows[0].value).toBe('Red');
      expect(rows[0].colorHex).toBe('#FF0000');
    });

    /**
     * @description Verifies localizedRows computed signal maps correctly for Arabic
     */
    it('should compute localized rows for Arabic', () => {
      setInputs(defaultAttributes, 'ar');

      const rows = component.localizedRows();
      expect(rows.length).toBe(3);
      expect(rows[0].name).toBe('اللون');
      expect(rows[0].value).toBe('أحمر');
    });

    /**
     * @description Verifies emptyMessage computed signal for English
     */
    it('should compute English empty message', () => {
      setInputs([], 'en');
      expect(component.emptyMessage()).toBe('No specifications available');
    });

    /**
     * @description Verifies emptyMessage computed signal for Arabic
     */
    it('should compute Arabic empty message', () => {
      setInputs([], 'ar');
      expect(component.emptyMessage()).toBe('لا توجد مواصفات متاحة');
    });
  });
});
