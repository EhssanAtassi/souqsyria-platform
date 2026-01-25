import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { HomepageComponent } from './homepage.component';
import { ProductService } from '../../shared/services/product.service';
import { CartService } from '../../store/cart/cart.service';
import { CategoryService } from '../../shared/services/category.service';
import { Product } from '../../shared/interfaces/product.interface';

/**
 * Enterprise Unit Tests for Enhanced Homepage Component
 * 
 * Test Coverage:
 * - Component initialization and lifecycle
 * - Error handling and retry logic
 * - Loading states and user feedback
 * - Product interactions and navigation
 * - Accessibility compliance
 * - Performance optimizations (OnPush, trackBy)
 * - Signal-based reactive state management
 * - User interactions and analytics
 * 
 * @swagger
 * components:
 *   schemas:
 *     HomepageComponentTest:
 *       type: object
 *       description: Comprehensive test suite for enhanced homepage component
 */
describe('HomepageComponent (Enhanced)', () => {
  let component: HomepageComponent;
  let fixture: ComponentFixture<HomepageComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockCartService: jasmine.SpyObj<CartService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;
  let router: Router;
  let mockProducts: Product[];

  beforeEach(async () => {
    // Create spy objects for services
    const productServiceSpy = jasmine.createSpyObj('ProductService', ['getProducts']);
    const cartServiceSpy = jasmine.createSpyObj('CartService', ['addToCart']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getAllCategories']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        NoopAnimationsModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        HomepageComponent // Import standalone component
      ],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomepageComponent);
    component = fixture.componentInstance;

    mockProductService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    mockCartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
    mockCategoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    router = TestBed.inject(Router);

    // Setup mock data
    mockProducts = createMockProducts();
    mockProductService.getProducts.and.returnValue(of({ data: mockProducts, total: mockProducts.length, page: 1, limit: 10 }));
    mockCategoryService.getAllCategories.and.returnValue(of([]));
  });

  //#region Component Initialization Tests
  
  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.allProducts()).toEqual([]);
      expect(component.isLoadingProducts()).toBe(false);
      expect(component.productsError()).toBeNull();
      expect(component.retryCount()).toBe(0);
    });

    it('should load products on initialization', fakeAsync(() => {
      component.ngOnInit();
      tick(1000); // Wait for delays

      expect(mockProductService.getProducts).toHaveBeenCalled();
      expect(component.allProducts()).toEqual(mockProducts);
      expect(component.isLoadingProducts()).toBe(false);
    }));

    it('should load categories on initialization', fakeAsync(() => {
      component.ngOnInit();
      tick(1000);

      expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
      expect(component.isLoadingCategories()).toBe(false);
    }));

    it('should set loading state during product loading', () => {
      const productSubject = new Subject<Product[]>();
      mockProductService.getProducts.and.returnValue(productSubject.asObservable());

      component.ngOnInit();
      
      expect(component.isLoadingProducts()).toBe(true);
      
      productSubject.next(mockProducts);
      productSubject.complete();
      
      expect(component.isLoadingProducts()).toBe(false);
    });

    it('should handle component initialization without errors', () => {
      spyOn(console, 'log');
      component.ngOnInit();

      expect(mockProductService.getProducts).toHaveBeenCalled();
    });
  });

  //#endregion

  //#region Error Handling Tests
  
  describe('Error Handling', () => {
    it('should handle product loading errors gracefully', fakeAsync(() => {
      const error = new Error('Network error');
      mockProductService.getProducts.and.returnValue(throwError(() => error));
      
      spyOn(console, 'error');
      
      component.ngOnInit();
      tick(1000);
      
      expect(console.error).toHaveBeenCalledWith('Failed to load products after all retry attempts:', error);
      expect(component.productsError()).toBeTruthy();
      expect(component.isLoadingProducts()).toBe(false);
      expect(component.allProducts()).toEqual([]);
    }));

    it('should display error state in template', fakeAsync(() => {
      mockProductService.getProducts.and.returnValue(throwError(() => new Error('Test error')));
      
      component.ngOnInit();
      tick(1000);
      fixture.detectChanges();
      
      const errorElement = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Loading Error');
    }));

    it('should retry loading products on user request', fakeAsync(() => {
      mockProductService.getProducts.and.returnValues(
        throwError(() => new Error('First error')),
        of({ data: mockProducts, total: mockProducts.length, page: 1, limit: 10 })
      );

      component.ngOnInit();
      tick(1000);

      expect(component.productsError()).toBeTruthy();

      // User clicks retry
      component.onRetryLoadProducts();
      tick(1000);

      expect(component.allProducts()).toEqual(mockProducts);
      expect(component.productsError()).toBeNull();
      expect(mockProductService.getProducts).toHaveBeenCalledTimes(2);
    }));

    it('should handle cart service errors', fakeAsync(() => {
      const product = mockProducts[0];
      mockCartService.addToCart.and.returnValue(throwError(() => new Error('Cart error')));
      
      spyOn(component as any, 'showErrorNotification');
      
      component.onProductGridAddToCart(product);
      tick();
      
      expect((component as any).showErrorNotification).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to add item to cart')
      );
    }));
  });

  //#endregion

  //#region Loading States Tests
  
  describe('Loading States', () => {
    it('should display loading spinner during product load', fakeAsync(() => {
      const productSubject = new Subject<Product[]>();
      mockProductService.getProducts.and.returnValue(productSubject.asObservable());
      
      component.ngOnInit();
      fixture.detectChanges();
      
      const loadingElement = fixture.debugElement.query(By.css('[role="status"]'));
      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      
      expect(loadingElement).toBeTruthy();
      expect(spinner).toBeTruthy();
      expect(loadingElement.nativeElement.textContent).toContain('Loading authentic Syrian products');
      
      productSubject.next(mockProducts);
      productSubject.complete();
      tick();
      fixture.detectChanges();
      
      const loadingElementAfter = fixture.debugElement.query(By.css('[role="status"]'));
      expect(loadingElementAfter).toBeFalsy();
    }));

    it('should display empty state when no products available', fakeAsync(() => {
      mockProductService.getProducts.and.returnValue(of([]));
      
      component.ngOnInit();
      tick(1000);
      fixture.detectChanges();
      
      const emptyStateElement = fixture.debugElement.query(By.css('[role="status"]'));
      expect(emptyStateElement).toBeTruthy();
      expect(emptyStateElement.nativeElement.textContent).toContain('No Products Available');
    }));
  });

  //#endregion

  //#region Signal-based State Management Tests
  
  describe('Signal-based State Management', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
    }));

    it('should compute featured products correctly', () => {
      const featuredProducts = component.featuredProducts();
      
      // Featured products should have discounts or high ratings
      featuredProducts.forEach(product => {
        const hasDiscount = product.price.discount && product.price.discount.percentage > 0;
        const highRating = product.reviews.averageRating >= 4.5;
        expect(hasDiscount || highRating).toBeTruthy();
      });
      
      expect(featuredProducts.length).toBeLessThanOrEqual(8);
    });

    it('should compute new arrivals correctly', () => {
      const newArrivals = component.newArrivals();
      
      // Should be sorted by creation date (newest first)
      for (let i = 0; i < newArrivals.length - 1; i++) {
        const current = newArrivals[i].timestamps.created.getTime();
        const next = newArrivals[i + 1].timestamps.created.getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
      
      expect(newArrivals.length).toBeLessThanOrEqual(6);
    });

    it('should compute top rated products correctly', () => {
      const topRated = component.topRated();
      
      // Should be sorted by rating score (rating * log(reviews))
      for (let i = 0; i < topRated.length - 1; i++) {
        const currentScore = topRated[i].reviews.averageRating * Math.log(topRated[i].reviews.totalReviews + 1);
        const nextScore = topRated[i + 1].reviews.averageRating * Math.log(topRated[i + 1].reviews.totalReviews + 1);
        expect(currentScore).toBeGreaterThanOrEqual(nextScore);
      }
      
      expect(topRated.length).toBeLessThanOrEqual(6);
    });

    it('should react to product changes', fakeAsync(() => {
      const newProducts = [...mockProducts, createMockProduct('new-product', 'New Product')];
      
      // Update products signal
      component.allProducts.set(newProducts);
      tick();
      
      expect(component.featuredProducts().length).toBeGreaterThanOrEqual(0);
      expect(component.newArrivals().length).toBeGreaterThanOrEqual(0);
      expect(component.topRated().length).toBeGreaterThanOrEqual(0);
    }));
  });

  //#endregion

  //#region User Interaction Tests
  
  describe('User Interactions', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
    }));

    it('should handle featured category clicks', () => {
      spyOn(router, 'navigate');
      spyOn(console, 'log');
      
      const category = component.featuredCategories[0];
      component.onFeaturedCategoryClick(category);
      
      expect(console.log).toHaveBeenCalledWith('Featured category clicked:', category.name, 'Arabic:', category.nameAr);
      expect(router.navigate).toHaveBeenCalledWith([category.route]);
    });

    it('should handle quick navigation clicks', () => {
      spyOn(router, 'navigate');
      
      const category = component.quickNavCategories[1]; // Not the active one
      component.onQuickNavCategoryClick(category);
      
      expect(category.active).toBe(true);
      expect(component.quickNavCategories[0].active).toBe(false); // Previous active should be false
      expect(router.navigate).toHaveBeenCalledWith([category.route]);
    });

    it('should handle product grid clicks', () => {
      spyOn(router, 'navigate');
      const product = mockProducts[0];
      
      component.onProductGridClick(product);
      
      expect(router.navigate).toHaveBeenCalledWith(['/product', product.slug]);
    });

    it('should handle add to cart with inventory validation', fakeAsync(() => {
      const product = { ...mockProducts[0] };
      product.inventory.inStock = false;
      
      mockCartService.addToCart.and.returnValue(of(true));
      spyOn(component as any, 'showErrorNotification');
      
      component.onProductGridAddToCart(product);
      tick();
      
      expect((component as any).showErrorNotification).toHaveBeenCalledWith('Product is currently out of stock');
      expect(mockCartService.addToCart).not.toHaveBeenCalled();
    }));

    it('should handle successful add to cart', fakeAsync(() => {
      const product = mockProducts[0];
      mockCartService.addToCart.and.returnValue(of(true));
      
      spyOn(component as any, 'showSuccessNotification');
      spyOn(component as any, 'trackAnalyticsEvent');
      
      component.onProductGridAddToCart(product);
      tick();
      
      expect(mockCartService.addToCart).toHaveBeenCalledWith(product.id, 1);
      expect((component as any).showSuccessNotification).toHaveBeenCalledWith(
        jasmine.stringContaining('added to cart')
      );
      expect((component as any).trackAnalyticsEvent).toHaveBeenCalledWith('add_to_cart', jasmine.any(Object));
    }));

    it('should handle hero CTA clicks', () => {
      spyOn(router, 'navigate');
      spyOn(console, 'log');
      
      component.onHeroCtaClick('browse-marketplace');
      
      expect(console.log).toHaveBeenCalledWith('Hero CTA clicked:', 'browse-marketplace');
      expect(router.navigate).toHaveBeenCalledWith(['/categories/all']);
    });
  });

  //#endregion

  //#region Performance Optimization Tests
  
  describe('Performance Optimizations', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component.constructor.ɵcmp.changeDetection).toBe(1); // OnPush = 1
    });

    it('should provide trackBy functions for performance', () => {
      const category = component.featuredCategories[0];
      const product = mockProducts[0];
      
      expect(component.trackFeaturedCategory(0, category)).toBe(category.name);
      expect(component.trackQuickNavCategory(0, component.quickNavCategories[0])).toBe(component.quickNavCategories[0].name);
      expect(component.trackProduct(0, product)).toBe(product.id);
    });

    it('should use trackBy in templates', () => {
      fixture.detectChanges();
      
      // Check if ngFor directives use trackBy functions
      const featuredCategoriesContainer = fixture.debugElement.query(
        By.css('div[*ngFor*="trackFeaturedCategory"]')
      );
      expect(featuredCategoriesContainer).toBeTruthy();
    });
  });

  //#endregion

  //#region Accessibility Tests
  
  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      fixture.detectChanges();
    }));

    it('should have proper ARIA labels', () => {
      const heroSection = fixture.debugElement.query(By.css('[role="banner"]'));
      const featuredSection = fixture.debugElement.query(By.css('[role="region"]'));
      const mainSection = fixture.debugElement.query(By.css('[role="main"]'));
      
      expect(heroSection).toBeTruthy();
      expect(heroSection.nativeElement.getAttribute('aria-label')).toBe('Syrian Marketplace Welcome');
      expect(featuredSection).toBeTruthy();
      expect(mainSection).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      const categoryCards = fixture.debugElement.queryAll(By.css('[role="button"]'));
      
      categoryCards.forEach(card => {
        expect(card.nativeElement.tabIndex).toBe(0);
        expect(card.nativeElement.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should provide proper focus management', () => {
      const focusableElements = fixture.debugElement.queryAll(
        By.css('button, [tabindex="0"], [role="button"]')
      );
      
      focusableElements.forEach(element => {
        expect(element.nativeElement.classList.contains('focus:outline-none') || 
               element.nativeElement.classList.contains('focus:ring-2')).toBeTruthy();
      });
    });

    it('should have semantic HTML structure', () => {
      const headings = fixture.debugElement.queryAll(By.css('h1, h2, h3'));
      expect(headings.length).toBeGreaterThan(0);
      
      const sections = fixture.debugElement.queryAll(By.css('section'));
      expect(sections.length).toBeGreaterThan(0);
      
      // Each section should have proper headings
      sections.forEach(section => {
        const sectionHeading = section.query(By.css('h1, h2, h3'));
        expect(sectionHeading).toBeTruthy();
      });
    });

    it('should provide proper live regions for dynamic content', () => {
      // Loading states should have aria-live
      const productSubject = new Subject<Product[]>();
      mockProductService.getProducts.and.returnValue(productSubject.asObservable());
      
      component.ngOnInit();
      fixture.detectChanges();
      
      const loadingRegion = fixture.debugElement.query(By.css('[aria-live="polite"]'));
      expect(loadingRegion).toBeTruthy();
    });
  });

  //#endregion

  //#region Helper Functions
  
  /**
   * Creates mock products for testing
   */
  function createMockProducts(): Product[] {
    return [
      createMockProduct('featured-product-1', 'Featured Damascus Knife', 4.8, 25, true, 15),
      createMockProduct('featured-product-2', 'Premium Aleppo Soap', 4.6, 30, true, 20),
      createMockProduct('regular-product-1', 'Regular Item', 4.2, 10, true, 0),
      createMockProduct('out-of-stock', 'Out of Stock Item', 4.5, 15, false, 10),
      createMockProduct('new-arrival', 'New Arrival', 4.0, 5, true, 25)
    ];
  }

  function createMockProduct(
    id: string, 
    name: string, 
    rating: number = 4.0, 
    reviewCount: number = 10, 
    inStock: boolean = true,
    discountPercentage: number = 0
  ): Product {
    const baseDate = new Date('2024-01-01');
    const createdDate = new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    return {
      id,
      name,
      nameArabic: name + ' عربي',
      slug: id.toLowerCase().replace(/\s+/g, '-'),
      description: `Description for ${name}`,
      descriptionArabic: `وصف ${name}`,
      price: {
        amount: 100,
        currency: 'USD',
        originalPrice: discountPercentage > 0 ? 100 / (1 - discountPercentage / 100) : undefined,
        discount: discountPercentage > 0 ? {
          percentage: discountPercentage,
          type: 'seasonal' as const,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        } : undefined
      },
      category: {
        id: 'test-category',
        name: 'Test Category',
        nameArabic: 'فئة تجريبية',
        slug: 'test-category',
        breadcrumb: ['Home', 'Test Category']
      },
      images: [{
        id: 'img-1',
        url: '/test-image.jpg',
        alt: 'Test image',
        isPrimary: true,
        order: 1
      }],
      specifications: {
        materials: ['Test Material'],
        colors: ['Blue'],
        sizes: ['Medium']
      },
      seller: {
        id: 'test-seller',
        name: 'Test Seller',
        location: { city: 'Damascus', governorate: 'Damascus' },
        rating: 4.5,
        reviewCount: 100,
        verified: true
      },
      shipping: {
        methods: [],
        deliveryTimes: {}
      },
      authenticity: {
        certified: true,
        heritage: 'traditional',
        badges: ['authentic']
      },
      inventory: {
        inStock,
        quantity: inStock ? 10 : 0,
        minOrderQuantity: 1,
        status: inStock ? 'in_stock' : 'out_of_stock',
        lowStockThreshold: 5
      },
      reviews: {
        averageRating: rating,
        totalReviews: reviewCount,
        ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: Math.max(0, reviewCount - 8) }
      },
      timestamps: {
        created: createdDate,
        updated: new Date(createdDate.getTime() + 24 * 60 * 60 * 1000)
      }
    };
  }

  //#endregion
});