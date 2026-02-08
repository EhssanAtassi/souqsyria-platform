/**
 * @file product-card.component.spec.ts
 * @description Unit tests for ProductCardComponent.
 * Validates rendering of product data (name, price, stock, discount),
 * bilingual support, and the Add to Cart output event.
 *
 * @swagger
 * tags:
 *   - name: ProductCardComponent Tests
 *     description: Verifies presentational product card behavior
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ProductCardComponent } from './product-card.component';
import { ProductListItem } from '../../models/product-list.interface';

/**
 * @description Creates a mock ProductListItem with sensible defaults
 * @param overrides - Partial fields to override
 * @returns Complete ProductListItem
 */
function createMockProduct(
  overrides: Partial<ProductListItem> = {}
): ProductListItem {
  return {
    id: 1,
    slug: 'test-product',
    nameEn: 'Test Product',
    nameAr: 'منتج اختباري',
    mainImage: 'https://example.com/image.jpg',
    basePrice: 2500000,
    discountPrice: null,
    currency: 'SYP',
    categoryId: 1,
    categoryNameEn: 'Damascus Steel',
    categoryNameAr: 'فولاذ دمشقي',
    stockStatus: 'in_stock',
    rating: 4.5,
    reviewCount: 12,
    ...overrides,
  };
}

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  /** @description Default mock product used across tests */
  const defaultProduct = createMockProduct();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
  });

  /**
   * @description Sets the required product input and triggers change detection
   * @param product - Product data to set
   * @param language - Optional language override
   */
  function setInputs(
    product: ProductListItem = defaultProduct,
    language?: 'en' | 'ar'
  ): void {
    fixture.componentRef.setInput('product', product);
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

  describe('Product Name Display', () => {
    /**
     * @description Verifies the English product name renders by default
     */
    it('should display product name in English', () => {
      setInputs(defaultProduct, 'en');

      const compiled: HTMLElement = fixture.nativeElement;
      const nameEl = compiled.querySelector('.product-card__name');

      expect(nameEl?.textContent?.trim()).toContain('Test Product');
    });

    /**
     * @description Verifies the Arabic product name renders when language is 'ar'
     */
    it('should display product name in Arabic when language is ar', () => {
      setInputs(defaultProduct, 'ar');

      const compiled: HTMLElement = fixture.nativeElement;
      const nameEl = compiled.querySelector('.product-card__name');

      expect(nameEl?.textContent?.trim()).toContain('منتج اختباري');
    });
  });

  describe('Price Display', () => {
    /**
     * @description Verifies the formatted base price renders with SYP currency symbol
     */
    it('should display formatted base price with SYP currency', () => {
      setInputs(createMockProduct({ basePrice: 2500000 }));

      const compiled: HTMLElement = fixture.nativeElement;
      const priceEl = compiled.querySelector(
        '.product-card__price--current'
      );

      expect(priceEl?.textContent?.trim()).toContain('2,500,000');
      expect(priceEl?.textContent?.trim()).toContain('ل.س');
    });

    /**
     * @description Verifies the original price has strikethrough styling when a discount exists
     */
    it('should show strikethrough on original price when discount exists', () => {
      const discountProduct = createMockProduct({
        basePrice: 3000000,
        discountPrice: 2500000,
      });
      setInputs(discountProduct);

      const compiled: HTMLElement = fixture.nativeElement;
      const originalPriceEl = compiled.querySelector(
        '.product-card__price--original'
      );
      const currentPriceEl = compiled.querySelector(
        '.product-card__price--current'
      );

      expect(originalPriceEl).toBeTruthy();
      expect(originalPriceEl?.textContent?.trim()).toContain('3,000,000');
      expect(currentPriceEl?.textContent?.trim()).toContain('2,500,000');
    });

    /**
     * @description Verifies the original price element is absent when there is no discount
     */
    it('should not show original price when no discount exists', () => {
      setInputs(createMockProduct({ discountPrice: null }));

      const compiled: HTMLElement = fixture.nativeElement;
      const originalPriceEl = compiled.querySelector(
        '.product-card__price--original'
      );

      expect(originalPriceEl).toBeNull();
    });
  });

  describe('Stock Badge', () => {
    /**
     * @description Verifies the stock badge renders with the correct CSS class for in_stock
     */
    it('should show stock badge with correct class for in_stock', () => {
      setInputs(createMockProduct({ stockStatus: 'in_stock' }));

      const compiled: HTMLElement = fixture.nativeElement;
      const badge = compiled.querySelector('.stock-badge');

      expect(badge).toBeTruthy();
      expect(badge?.classList).toContain('stock-badge--in_stock');
      expect(badge?.textContent?.trim()).toBe('In Stock');
    });

    /**
     * @description Verifies the stock badge CSS class for low_stock
     */
    it('should show stock badge with correct class for low_stock', () => {
      setInputs(createMockProduct({ stockStatus: 'low_stock' }));

      const compiled: HTMLElement = fixture.nativeElement;
      const badge = compiled.querySelector('.stock-badge');

      expect(badge?.classList).toContain('stock-badge--low_stock');
      expect(badge?.textContent?.trim()).toBe('Low Stock');
    });

    /**
     * @description Verifies the stock badge CSS class for out_of_stock
     */
    it('should show stock badge with correct class for out_of_stock', () => {
      setInputs(createMockProduct({ stockStatus: 'out_of_stock' }));

      const compiled: HTMLElement = fixture.nativeElement;
      const badge = compiled.querySelector('.stock-badge');

      expect(badge?.classList).toContain('stock-badge--out_of_stock');
      expect(badge?.textContent?.trim()).toBe('Out of Stock');
    });
  });

  describe('Add to Cart', () => {
    /**
     * @description Verifies the addToCart output emits the product when Add to Cart is clicked
     */
    it('should emit addToCart when Add to Cart button clicked', () => {
      const product = createMockProduct({ stockStatus: 'in_stock' });
      setInputs(product);

      spyOn(component.addToCart, 'emit');

      const compiled: HTMLElement = fixture.nativeElement;
      const addToCartBtn = compiled.querySelector(
        '.product-card__add-to-cart'
      ) as HTMLButtonElement;

      addToCartBtn.click();

      expect(component.addToCart.emit).toHaveBeenCalledWith(product);
    });

    /**
     * @description Verifies the Add to Cart button is disabled when product is out of stock
     */
    it('should disable Add to Cart button when product is out of stock', () => {
      setInputs(createMockProduct({ stockStatus: 'out_of_stock' }));

      const compiled: HTMLElement = fixture.nativeElement;
      const addToCartBtn = compiled.querySelector(
        '.product-card__add-to-cart'
      ) as HTMLButtonElement;

      expect(addToCartBtn.disabled).toBeTrue();
    });

    /**
     * @description Verifies addToCart does not emit when product is out of stock
     */
    it('should not emit addToCart when product is out of stock', () => {
      setInputs(createMockProduct({ stockStatus: 'out_of_stock' }));

      spyOn(component.addToCart, 'emit');

      const compiled: HTMLElement = fixture.nativeElement;
      const addToCartBtn = compiled.querySelector(
        '.product-card__add-to-cart'
      ) as HTMLButtonElement;

      addToCartBtn.click();

      expect(component.addToCart.emit).not.toHaveBeenCalled();
    });
  });

  describe('Computed Signals', () => {
    /**
     * @description Verifies the star rating computed signal produces correct icons
     */
    it('should compute correct star icons based on rating', () => {
      setInputs(createMockProduct({ rating: 3.5 }));

      const stars = component.stars();

      expect(stars).toEqual([
        'star',
        'star',
        'star',
        'star_half',
        'star_outline',
      ]);
    });

    /**
     * @description Verifies the hasDiscount computed returns false when discountPrice is null
     */
    it('should compute hasDiscount as false when discountPrice is null', () => {
      setInputs(createMockProduct({ discountPrice: null }));

      expect(component.hasDiscount()).toBeFalse();
    });

    /**
     * @description Verifies hasDiscount is true when discountPrice differs from basePrice
     */
    it('should compute hasDiscount as true when discountPrice differs from basePrice', () => {
      setInputs(
        createMockProduct({ basePrice: 3000000, discountPrice: 2500000 })
      );

      expect(component.hasDiscount()).toBeTrue();
    });

    /**
     * @description Verifies hasDiscount is false when discountPrice equals basePrice
     */
    it('should compute hasDiscount as false when discountPrice equals basePrice', () => {
      setInputs(
        createMockProduct({ basePrice: 2500000, discountPrice: 2500000 })
      );

      expect(component.hasDiscount()).toBeFalse();
    });
  });

  describe('Category Display', () => {
    /**
     * @description Verifies the category name renders when present
     */
    it('should display category name when available', () => {
      setInputs(
        createMockProduct({ categoryNameEn: 'Damascus Steel' }),
        'en'
      );

      const compiled: HTMLElement = fixture.nativeElement;
      const categoryEl = compiled.querySelector('.product-card__category');

      expect(categoryEl?.textContent?.trim()).toBe('Damascus Steel');
    });

    /**
     * @description Verifies category is not rendered when names are null
     */
    it('should not display category when names are null', () => {
      setInputs(
        createMockProduct({
          categoryNameEn: null,
          categoryNameAr: null,
        })
      );

      const compiled: HTMLElement = fixture.nativeElement;
      const categoryEl = compiled.querySelector('.product-card__category');

      expect(categoryEl).toBeNull();
    });
  });
});
