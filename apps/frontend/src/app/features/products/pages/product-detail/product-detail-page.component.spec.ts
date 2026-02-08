/**
 * @file product-detail-page.component.spec.ts
 * @description Unit tests for ProductDetailPageComponent.
 * Validates product loading, image gallery, variant selection,
 * breadcrumb rendering, loading/error states, and related products.
 *
 * @swagger
 * tags:
 *   - name: ProductDetailPageComponent Tests
 *     description: Verifies product detail page behavior including API integration and UI states
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal, computed } from '@angular/core';

import { ProductDetailPageComponent } from './product-detail-page.component';
import { ProductService } from '../../services/product.service';
import { LanguageService } from '../../../../shared/services/language.service';
import { ProductDetailResponse } from '../../models/product-detail.interface';

/**
 * @description Creates a mock ProductDetailResponse with sensible defaults
 * @param overrides - Partial fields to override
 * @returns Complete ProductDetailResponse
 */
function createMockProductDetail(
  overrides: Partial<ProductDetailResponse> = {}
): ProductDetailResponse {
  return {
    id: 1,
    slug: 'test-product',
    nameEn: 'Test Product',
    nameAr: '\u0645\u0646\u062a\u062c \u062a\u062c\u0631\u064a\u0628\u064a',
    sku: 'TST-001',
    category: { id: 1, nameEn: 'Category', nameAr: '\u0641\u0626\u0629', slug: 'cat' },
    manufacturer: null,
    vendor: null,
    pricing: { basePrice: 100, discountPrice: 80, currency: 'USD' },
    images: [
      { id: 1, imageUrl: '/img1.jpg', sortOrder: 0 },
      { id: 2, imageUrl: '/img2.jpg', sortOrder: 1 },
    ],
    descriptions: [
      { language: 'en', shortDescription: 'Short desc', fullDescription: 'Full desc' },
    ],
    variants: [
      {
        id: 1,
        sku: 'V1',
        price: 100,
        variantData: { Color: 'Red' },
        imageUrl: null,
        stockStatus: 'in_stock',
        totalStock: 10,
        isActive: true,
      },
    ],
    attributes: [
      {
        id: 1,
        attributeNameEn: 'Color',
        attributeNameAr: '\u0627\u0644\u0644\u0648\u0646',
        valueEn: 'Red',
        valueAr: '\u0623\u062d\u0645\u0631',
        colorHex: '#FF0000',
      },
    ],
    stockStatus: 'in_stock',
    totalStock: 10,
    relatedProducts: [
      {
        id: 2,
        slug: 'related',
        nameEn: 'Related',
        nameAr: '\u0630\u0648 \u0635\u0644\u0629',
        mainImage: '/r.jpg',
        basePrice: 50,
        discountPrice: null,
        currency: 'USD',
        stockStatus: 'in_stock',
      },
    ],
    ...overrides,
  };
}

describe('ProductDetailPageComponent', () => {
  let component: ProductDetailPageComponent;
  let fixture: ComponentFixture<ProductDetailPageComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let paramsSubject: Subject<Record<string, string>>;

  /** @description Mock product used across tests */
  const mockProduct = createMockProductDetail();

  /** @description Mock LanguageService with English defaults */
  const mockLanguageService = {
    language: signal<'en' | 'ar'>('en'),
    isRtl: computed(() => false),
    direction: computed(() => 'ltr' as const),
  };

  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getProductBySlug']);
    productServiceSpy.getProductBySlug.and.returnValue(of(mockProduct));

    paramsSubject = new Subject<Record<string, string>>();

    await TestBed.configureTestingModule({
      imports: [ProductDetailPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProductService, useValue: productServiceSpy },
        { provide: LanguageService, useValue: mockLanguageService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
            snapshot: { params: { productSlug: 'test-product' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailPageComponent);
    component = fixture.componentInstance;
  });

  /**
   * @description Verifies the component instantiates successfully
   */
  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Product Loading via Route Params', () => {
    /**
     * @description Verifies ProductService.getProductBySlug is called on init with slug from route params
     */
    it('should call ProductService.getProductBySlug on init with slug from route params', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(productServiceSpy.getProductBySlug).toHaveBeenCalledWith('test-product');
    });

    /**
     * @description Verifies product signal is populated after successful load
     */
    it('should set product signal after successful API response', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.product()).toEqual(mockProduct);
    });

    /**
     * @description Verifies loading is set to false after API response
     */
    it('should set loading to false after product loads', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.loading()).toBeFalse();
    });

    /**
     * @description Verifies error is null after successful load
     */
    it('should set error to null after successful load', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.error()).toBeNull();
    });

    /**
     * @description Verifies first variant is auto-selected when variants exist
     */
    it('should auto-select first variant when variants exist', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.selectedVariant()).toEqual(mockProduct.variants[0]);
    });
  });

  describe('Product Name Display', () => {
    /**
     * @description Verifies productName computed signal returns English name
     */
    it('should return English product name when language is en', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.productName()).toBe('Test Product');
    });

    /**
     * @description Verifies productName computed signal returns Arabic name
     */
    it('should return Arabic product name when language is ar', () => {
      mockLanguageService.language.set('ar');
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.productName()).toBe('\u0645\u0646\u062a\u062c \u062a\u062c\u0631\u064a\u0628\u064a');

      // Reset language
      mockLanguageService.language.set('en');
    });

    /**
     * @description Verifies productName is empty when product is null
     */
    it('should return empty string when product is null', () => {
      fixture.detectChanges();
      // Do not emit params so product stays null
      expect(component.productName()).toBe('');
    });
  });

  describe('Breadcrumb', () => {
    /**
     * @description Verifies breadcrumb renders with category name
     */
    it('should display breadcrumb with category name', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const breadcrumbLinks = compiled.querySelectorAll('.breadcrumb__link');
      const currentCrumb = compiled.querySelector('.breadcrumb__current');

      expect(breadcrumbLinks.length).toBeGreaterThanOrEqual(1);
      expect(currentCrumb?.textContent?.trim()).toBe('Test Product');
    });

    /**
     * @description Verifies categoryName computed returns the category name
     */
    it('should compute category name in current language', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.categoryName()).toBe('Category');
    });
  });

  describe('Image Gallery', () => {
    /**
     * @description Verifies the main image is displayed
     */
    it('should display the first image as the main image', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const mainImg = compiled.querySelector('.gallery__main-image') as HTMLImageElement;

      expect(mainImg).toBeTruthy();
      expect(mainImg.src).toContain('/img1.jpg');
    });

    /**
     * @description Verifies thumbnails are rendered when multiple images exist
     */
    it('should render thumbnails when multiple images exist', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const thumbnails = compiled.querySelectorAll('.gallery__thumbnail');

      expect(thumbnails.length).toBe(2);
    });

    /**
     * @description Verifies clicking a thumbnail changes the selected image index
     */
    it('should change selected image index on thumbnail click', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      component.onImageSelect(1);
      expect(component.selectedImageIndex()).toBe(1);
    });

    /**
     * @description Verifies the currentImage computed updates when selectedImageIndex changes
     */
    it('should update currentImage when selectedImageIndex changes', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      component.onImageSelect(1);
      expect(component.currentImage()?.imageUrl).toBe('/img2.jpg');
    });
  });

  describe('Variant Selector', () => {
    /**
     * @description Verifies variant selector is rendered when variants exist
     */
    it('should render variant selector when variants exist', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const variantSelector = compiled.querySelector('app-variant-selector');

      expect(variantSelector).toBeTruthy();
    });

    /**
     * @description Verifies variant selector is NOT rendered when no variants exist
     */
    it('should not render variant selector when no variants exist', () => {
      const noVariantProduct = createMockProductDetail({ variants: [] });
      productServiceSpy.getProductBySlug.and.returnValue(of(noVariantProduct));

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const variantSelector = compiled.querySelector('app-variant-selector');

      expect(variantSelector).toBeNull();
    });

    /**
     * @description Verifies onVariantSelect updates the selectedVariant signal
     */
    it('should update selectedVariant on onVariantSelect call', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      const newVariant = mockProduct.variants[0];
      component.onVariantSelect(newVariant);

      expect(component.selectedVariant()).toEqual(newVariant);
    });
  });

  describe('Specifications Table', () => {
    /**
     * @description Verifies specifications table is rendered when attributes exist
     */
    it('should render specifications table when attributes exist', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const specsTable = compiled.querySelector('app-specifications-table');

      expect(specsTable).toBeTruthy();
    });
  });

  describe('Related Products', () => {
    /**
     * @description Verifies related products grid is rendered when relatedProducts exist
     */
    it('should render related products section when relatedProducts exist', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const relatedSection = compiled.querySelector('.product-detail__related');

      expect(relatedSection).toBeTruthy();
    });

    /**
     * @description Verifies related products are mapped to ProductListItem format
     */
    it('should map related products to ProductListItem format', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      const relatedItems = component.relatedProductItems();
      expect(relatedItems.length).toBe(1);
      expect(relatedItems[0].id).toBe(2);
      expect(relatedItems[0].slug).toBe('related');
      expect(relatedItems[0].nameEn).toBe('Related');
    });

    /**
     * @description Verifies related products section is hidden when no related products
     */
    it('should not render related products section when relatedProducts is empty', () => {
      const noRelatedProduct = createMockProductDetail({ relatedProducts: [] });
      productServiceSpy.getProductBySlug.and.returnValue(of(noRelatedProduct));

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const relatedSection = compiled.querySelector('.product-detail__related');

      expect(relatedSection).toBeNull();
    });
  });

  describe('Loading State', () => {
    /**
     * @description Verifies loading state is shown while API request is in flight
     */
    it('should show loading state initially', () => {
      // Before emitting params, loading should be true (default)
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const loadingEl = compiled.querySelector('.product-detail-page__loading');

      expect(loadingEl).toBeTruthy();
    });

    /**
     * @description Verifies loading state disappears after product loads
     */
    it('should hide loading state after product loads', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const loadingEl = compiled.querySelector('.product-detail-page__loading');

      expect(loadingEl).toBeNull();
    });
  });

  describe('Error State', () => {
    /**
     * @description Verifies error state is shown on API error
     */
    it('should show error state on API error', () => {
      productServiceSpy.getProductBySlug.and.returnValue(
        throwError(() => ({ error: { message: 'Product not found' } }))
      );

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'nonexistent' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const errorEl = compiled.querySelector('.product-detail-page__error');

      expect(errorEl).toBeTruthy();
    });

    /**
     * @description Verifies the error message is displayed from API response
     */
    it('should display the error message from the API', () => {
      productServiceSpy.getProductBySlug.and.returnValue(
        throwError(() => ({ error: { message: 'Product not found' } }))
      );

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'nonexistent' });
      fixture.detectChanges();

      expect(component.error()).toBe('Product not found');
    });

    /**
     * @description Verifies fallback error message when API does not provide one
     */
    it('should display fallback error message when API does not provide one', () => {
      productServiceSpy.getProductBySlug.and.returnValue(
        throwError(() => ({}))
      );

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'nonexistent' });

      expect(component.error()).toBe('Failed to load product details');
    });

    /**
     * @description Verifies error sets loading to false
     */
    it('should set loading to false on error', () => {
      productServiceSpy.getProductBySlug.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'nonexistent' });

      expect(component.loading()).toBeFalse();
    });
  });

  describe('Retry Functionality', () => {
    /**
     * @description Verifies retry button triggers reload
     */
    it('should call getProductBySlug again on retryLoad', () => {
      productServiceSpy.getProductBySlug.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(productServiceSpy.getProductBySlug).toHaveBeenCalledTimes(1);

      // Reset to success for retry
      productServiceSpy.getProductBySlug.and.returnValue(of(mockProduct));
      component.retryLoad();

      expect(productServiceSpy.getProductBySlug).toHaveBeenCalledTimes(2);
    });

    /**
     * @description Verifies retry button renders in error state
     */
    it('should render retry button in error state', () => {
      productServiceSpy.getProductBySlug.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });
      fixture.detectChanges();

      const compiled: HTMLElement = fixture.nativeElement;
      const retryBtn = compiled.querySelector('.product-detail-page__error button');

      expect(retryBtn).toBeTruthy();
    });
  });

  describe('Pricing', () => {
    /**
     * @description Verifies hasDiscount returns true when discountPrice < basePrice
     */
    it('should compute hasDiscount as true when discountPrice is less than basePrice', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.hasDiscount()).toBeTrue();
    });

    /**
     * @description Verifies hasDiscount returns false when no discount
     */
    it('should compute hasDiscount as false when no discountPrice', () => {
      const noDiscountProduct = createMockProductDetail({
        pricing: { basePrice: 100, discountPrice: null, currency: 'USD' },
      });
      productServiceSpy.getProductBySlug.and.returnValue(of(noDiscountProduct));

      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.hasDiscount()).toBeFalse();
    });
  });

  describe('Stock Status', () => {
    /**
     * @description Verifies stockLabel returns English label for in_stock
     */
    it('should compute stockLabel as "In Stock" for in_stock status', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.stockLabel()).toBe('In Stock');
    });

    /**
     * @description Verifies stockClass returns correct CSS class
     */
    it('should compute correct stockClass', () => {
      fixture.detectChanges();
      paramsSubject.next({ productSlug: 'test-product' });

      expect(component.stockClass()).toBe('stock-badge--in-stock');
    });
  });

  describe('Quantity Control', () => {
    /**
     * @description Verifies quantity increments correctly
     */
    it('should increment quantity', () => {
      fixture.detectChanges();
      component.onQuantityChange(1);
      expect(component.quantity()).toBe(2);
    });

    /**
     * @description Verifies quantity does not go below 1
     */
    it('should not allow quantity below 1', () => {
      fixture.detectChanges();
      component.onQuantityChange(-1);
      expect(component.quantity()).toBe(1);
    });
  });

  describe('Localized Labels', () => {
    /**
     * @description Verifies English labels
     */
    it('should return English labels when language is en', () => {
      mockLanguageService.language.set('en');
      fixture.detectChanges();

      expect(component.retryLabel).toBe('Try Again');
      expect(component.addToCartLabel).toBe('Add to Cart');
      expect(component.addToWishlistLabel).toBe('Add to Wishlist');
      expect(component.descriptionTabLabel).toBe('Description');
      expect(component.specificationsTabLabel).toBe('Specifications');
      expect(component.relatedProductsHeading).toBe('Related Products');
    });

    /**
     * @description Verifies Arabic labels
     */
    it('should return Arabic labels when language is ar', () => {
      mockLanguageService.language.set('ar');
      fixture.detectChanges();

      expect(component.retryLabel).toBe('\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629');
      expect(component.addToCartLabel).toBe('\u0623\u0636\u0641 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629');

      // Reset language for other tests
      mockLanguageService.language.set('en');
    });
  });
});
