/**
 * @file products-pagination.component.spec.ts
 * @description Unit tests for ProductsPaginationComponent.
 * Validates page navigation, Previous/Next button states, showing text,
 * and items-per-page selection change.
 *
 * @swagger
 * tags:
 *   - name: ProductsPaginationComponent Tests
 *     description: Verifies pagination controls and output events
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ProductsPaginationComponent } from './products-pagination.component';
import { ProductListMeta } from '../../models/product-list.interface';

/**
 * @description Creates a mock ProductListMeta with sensible defaults
 * @param overrides - Partial fields to override
 * @returns Complete ProductListMeta
 */
function createMockMeta(
  overrides: Partial<ProductListMeta> = {}
): ProductListMeta {
  return {
    total: 100,
    page: 1,
    limit: 20,
    totalPages: 5,
    ...overrides,
  };
}

describe('ProductsPaginationComponent', () => {
  let component: ProductsPaginationComponent;
  let fixture: ComponentFixture<ProductsPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsPaginationComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsPaginationComponent);
    component = fixture.componentInstance;
  });

  /**
   * @description Sets the required meta input and triggers change detection
   * @param meta - Pagination metadata to set
   * @param language - Optional language override
   */
  function setInputs(
    meta: ProductListMeta = createMockMeta(),
    language?: 'en' | 'ar'
  ): void {
    fixture.componentRef.setInput('meta', meta);
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

  describe('Page Change Events', () => {
    /**
     * @description Verifies pageChange emits the target page number when a page button is clicked
     */
    it('should emit pageChange when page clicked', () => {
      setInputs(createMockMeta({ page: 1, totalPages: 5 }));

      spyOn(component.pageChange, 'emit');

      component.onPageClick(3);

      expect(component.pageChange.emit).toHaveBeenCalledWith(3);
    });

    /**
     * @description Verifies pageChange does not emit when clicking the current page
     */
    it('should not emit pageChange when clicking the current page', () => {
      setInputs(createMockMeta({ page: 2 }));

      spyOn(component.pageChange, 'emit');

      component.onPageClick(2);

      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });

    /**
     * @description Verifies the Previous button emits pageChange with page - 1
     */
    it('should emit pageChange with previous page on previous click', () => {
      setInputs(createMockMeta({ page: 3, totalPages: 5 }));

      spyOn(component.pageChange, 'emit');

      component.onPreviousClick();

      expect(component.pageChange.emit).toHaveBeenCalledWith(2);
    });

    /**
     * @description Verifies the Next button emits pageChange with page + 1
     */
    it('should emit pageChange with next page on next click', () => {
      setInputs(createMockMeta({ page: 2, totalPages: 5 }));

      spyOn(component.pageChange, 'emit');

      component.onNextClick();

      expect(component.pageChange.emit).toHaveBeenCalledWith(3);
    });
  });

  describe('Previous Button State', () => {
    /**
     * @description Verifies the Previous button is disabled on the first page
     */
    it('should disable Previous button on page 1', () => {
      setInputs(createMockMeta({ page: 1 }));

      const compiled: HTMLElement = fixture.nativeElement;
      const prevBtn = compiled.querySelector(
        'button[aria-label="Previous"]'
      ) as HTMLButtonElement;

      expect(prevBtn.disabled).toBeTrue();
    });

    /**
     * @description Verifies the Previous button is enabled on pages after 1
     */
    it('should enable Previous button on page 2', () => {
      setInputs(createMockMeta({ page: 2 }));

      const compiled: HTMLElement = fixture.nativeElement;
      const prevBtn = compiled.querySelector(
        'button[aria-label="Previous"]'
      ) as HTMLButtonElement;

      expect(prevBtn.disabled).toBeFalse();
    });

    /**
     * @description Verifies onPreviousClick does not emit when on page 1
     */
    it('should not emit on previous click when on page 1', () => {
      setInputs(createMockMeta({ page: 1 }));

      spyOn(component.pageChange, 'emit');

      component.onPreviousClick();

      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('Next Button State', () => {
    /**
     * @description Verifies the Next button is disabled on the last page
     */
    it('should disable Next button on last page', () => {
      setInputs(createMockMeta({ page: 5, totalPages: 5 }));

      const compiled: HTMLElement = fixture.nativeElement;
      const nextBtn = compiled.querySelector(
        'button[aria-label="Next"]'
      ) as HTMLButtonElement;

      expect(nextBtn.disabled).toBeTrue();
    });

    /**
     * @description Verifies the Next button is enabled when not on the last page
     */
    it('should enable Next button when not on last page', () => {
      setInputs(createMockMeta({ page: 3, totalPages: 5 }));

      const compiled: HTMLElement = fixture.nativeElement;
      const nextBtn = compiled.querySelector(
        'button[aria-label="Next"]'
      ) as HTMLButtonElement;

      expect(nextBtn.disabled).toBeFalse();
    });

    /**
     * @description Verifies onNextClick does not emit when on the last page
     */
    it('should not emit on next click when on last page', () => {
      setInputs(createMockMeta({ page: 5, totalPages: 5 }));

      spyOn(component.pageChange, 'emit');

      component.onNextClick();

      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('Showing Text', () => {
    /**
     * @description Verifies correct "Showing X-Y of Z products" text on first page
     */
    it('should show correct "Showing X-Y of Z products" text', () => {
      setInputs(
        createMockMeta({ page: 1, limit: 20, total: 100 }),
        'en'
      );

      const compiled: HTMLElement = fixture.nativeElement;
      const text = compiled.querySelector('.pagination__text');

      expect(text?.textContent?.trim()).toBe(
        'Showing 1-20 of 100 products'
      );
    });

    /**
     * @description Verifies the showing text on a middle page
     */
    it('should show correct range text on page 3 with 20 items per page', () => {
      setInputs(
        createMockMeta({ page: 3, limit: 20, total: 100 }),
        'en'
      );

      const compiled: HTMLElement = fixture.nativeElement;
      const text = compiled.querySelector('.pagination__text');

      expect(text?.textContent?.trim()).toBe(
        'Showing 41-60 of 100 products'
      );
    });

    /**
     * @description Verifies the showing text caps at total on the last page
     */
    it('should cap range at total on last page', () => {
      setInputs(
        createMockMeta({ page: 3, limit: 20, total: 50 }),
        'en'
      );

      const compiled: HTMLElement = fixture.nativeElement;
      const text = compiled.querySelector('.pagination__text');

      expect(text?.textContent?.trim()).toBe(
        'Showing 41-50 of 50 products'
      );
    });

    /**
     * @description Verifies Arabic locale showing text
     */
    it('should show Arabic text when language is ar', () => {
      setInputs(
        createMockMeta({ page: 1, limit: 20, total: 100 }),
        'ar'
      );

      const compiled: HTMLElement = fixture.nativeElement;
      const text = compiled.querySelector('.pagination__text');

      expect(text?.textContent?.trim()).toContain('عرض');
      expect(text?.textContent?.trim()).toContain('100');
    });
  });

  describe('Limit Change', () => {
    /**
     * @description Verifies limitChange emits the new limit value
     */
    it('should emit limitChange when items per page changed', () => {
      setInputs(createMockMeta({ limit: 20 }));

      spyOn(component.limitChange, 'emit');

      component.onLimitChange(40);

      expect(component.limitChange.emit).toHaveBeenCalledWith(40);
    });

    /**
     * @description Verifies available limit options are [20, 40, 60]
     */
    it('should have correct limit options', () => {
      expect(component.limitOptions).toEqual([20, 40, 60]);
    });
  });

  describe('Page Number Generation', () => {
    /**
     * @description Verifies all pages are shown when totalPages is 5
     */
    it('should generate all page numbers when totalPages is 5', () => {
      setInputs(createMockMeta({ page: 1, totalPages: 5 }));

      const pages = component.pageNumbers();

      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    /**
     * @description Verifies ellipsis appears for large page counts
     */
    it('should include ellipsis for large page counts', () => {
      setInputs(createMockMeta({ page: 5, totalPages: 10 }));

      const pages = component.pageNumbers();

      expect(pages).toContain('ellipsis');
      expect(pages).toContain(1);
      expect(pages).toContain(10);
    });

    /**
     * @description Verifies current page is identified correctly
     */
    it('should identify current page correctly via isCurrentPage', () => {
      setInputs(createMockMeta({ page: 3, totalPages: 5 }));

      expect(component.isCurrentPage(3)).toBeTrue();
      expect(component.isCurrentPage(2)).toBeFalse();
      expect(component.isCurrentPage('ellipsis')).toBeFalse();
    });
  });
});
