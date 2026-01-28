import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { FeaturedProductShowcaseComponent } from './featured-product-showcase.component';

/**
 * Test Suite for Featured Product Showcase Component
 *
 * Tests the featured product display functionality including:
 * - Component initialization and rendering
 * - Product data display (names, prices, ratings)
 * - Image handling and error states
 * - Interactive elements (buttons, clicks)
 * - Syrian styling and theming
 * - Accessibility features
 * - Loading and error states
 * - Analytics tracking
 *
 * @swagger
 * components:
 *   schemas:
 *     FeaturedProductShowcaseComponentTest:
 *       type: object
 *       description: Test configuration for Featured Product Showcase Component
 *       properties:
 *         mockProduct:
 *           type: object
 *           description: Mock product data for testing
 *         expectedEvents:
 *           type: array
 *           description: Expected events to be emitted
 *         accessibilityChecks:
 *           type: array
 *           description: Accessibility features to validate
 */
describe('FeaturedProductShowcaseComponent', () => {
  let component: FeaturedProductShowcaseComponent;
  let fixture: ComponentFixture<FeaturedProductShowcaseComponent>;

  // Mock product data
  const mockProduct = {
    id: 'test-product-123',
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
    images: [
      {
        id: 'test-image-1',
        url: 'https://example.com/test-image.jpg',
        alt: 'Test Product Image',
        isPrimary: true,
        order: 1
      },
      {
        id: 'test-image-2',
        url: 'https://example.com/test-image-2.jpg',
        alt: 'Test Product Image 2',
        isPrimary: false,
        order: 2
      }
    ],
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
      ratingDistribution: {
        1: 3, 2: 2, 3: 8, 4: 31, 5: 83
      }
    },
    authenticity: {
      certified: true,
      heritage: 'traditional',
      unescoRecognition: true,
      badges: ['UNESCO Heritage', 'Handcrafted', 'Syrian Artisan']
    },
    tags: ['featured', 'today-pick', 'damascus', 'unesco-heritage']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        FeaturedProductShowcaseComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedProductShowcaseComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.product).toBeNull();
      expect(component.showTodaysBadge).toBe(true);
      expect(component.damascusPatternOverlay).toBe(true);
      expect(component.backgroundTheme).toBe('golden-wheat');
    });

    it('should have computed signals working correctly', () => {
      expect(component.isProductAvailable()).toBeFalsy();
      expect(component.primaryImage()).toBeDefined();
      expect(component.priceDisplay()).toBeNull();
      expect(component.starRating()).toBeDefined();
    });
  });

  describe('Product Data Display', () => {
    beforeEach(() => {
      component.product = mockProduct;
      fixture.detectChanges();
    });

    it('should display product availability correctly', () => {
      expect(component.isProductAvailable()).toBeTruthy();
    });

    it('should get primary image correctly', () => {
      const primaryImg = component.primaryImage();
      expect(primaryImg.url).toBe('https://example.com/test-image.jpg');
      expect(primaryImg.alt).toBe('Test Product Image');
    });

    it('should calculate price display correctly', () => {
      const priceDisplay = component.priceDisplay();
      expect(priceDisplay).toBeTruthy();
      expect(priceDisplay!.current).toBe(150);
      expect(priceDisplay!.original).toBe(200);
      expect(priceDisplay!.hasDiscount).toBe(true);
      expect(priceDisplay!.discountPercentage).toBe(25);
      expect(priceDisplay!.formattedCurrent).toBe('$150.00');
      expect(priceDisplay!.formattedOriginal).toBe('$200.00');
    });

    it('should generate star rating correctly', () => {
      const stars = component.starRating();
      expect(stars.length).toBe(5);

      // Should have 4 full stars, 1 empty star (4.8 rating)
      const filledStars = stars.filter(star => star.filled).length;
      const halfStars = stars.filter(star => star.half).length;
      const emptyStars = stars.filter(star => !star.filled && !star.half).length;

      expect(filledStars).toBe(4);
      expect(halfStars).toBe(1);
      expect(emptyStars).toBe(0);
    });

    it('should calculate stock status correctly', () => {
      const stockStatus = component.stockStatus();
      expect(stockStatus.status).toBe('in-stock');
      expect(stockStatus.message).toBe('In Stock');
      expect(stockStatus.messageAr).toBe('متوفر');
      expect(stockStatus.className).toBe('stock-available');
    });

    it('should handle low stock status', () => {
      component.product = {
        ...mockProduct,
        inventory: {
          ...mockProduct.inventory,
          quantity: 3,
          lowStockThreshold: 5
        }
      };
      fixture.detectChanges();

      const stockStatus = component.stockStatus();
      expect(stockStatus.status).toBe('low-stock');
      expect(stockStatus.message).toBe('Only 3 left');
      expect(stockStatus.messageAr).toBe('متبقي 3 فقط');
      expect(stockStatus.className).toBe('stock-low');
    });

    it('should handle out of stock status', () => {
      component.product = {
        ...mockProduct,
        inventory: {
          ...mockProduct.inventory,
          inStock: false,
          quantity: 0
        }
      };
      fixture.detectChanges();

      const stockStatus = component.stockStatus();
      expect(stockStatus.status).toBe('out-of-stock');
      expect(stockStatus.message).toBe('Out of Stock');
      expect(stockStatus.messageAr).toBe('نفد من المخزون');
      expect(stockStatus.className).toBe('stock-out');
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      component.product = mockProduct;
      fixture.detectChanges();
    });

    it('should emit productClick event when product is clicked', () => {
      spyOn(component.productClick, 'emit');
      spyOn(console, 'log');

      component.onProductClick();

      expect(component.productClick.emit).toHaveBeenCalledWith(mockProduct);
      expect(console.log).toHaveBeenCalled();
    });

    it('should emit addToCart event when add to cart is clicked', () => {
      spyOn(component.addToCart, 'emit');
      const mockEvent = new Event('click');
      spyOn(mockEvent, 'stopPropagation');

      component.onAddToCart(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.addToCart.emit).toHaveBeenCalledWith(mockProduct);
    });

    it('should not add to cart when product is unavailable', () => {
      spyOn(component.addToCart, 'emit');
      spyOn(console, 'warn');

      component.product = {
        ...mockProduct,
        inventory: { ...mockProduct.inventory, inStock: false }
      };
      fixture.detectChanges();

      const mockEvent = new Event('click');
      component.onAddToCart(mockEvent);

      expect(component.addToCart.emit).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should emit toggleWishlist event when wishlist is clicked', () => {
      spyOn(component.toggleWishlist, 'emit');
      const mockEvent = new Event('click');
      spyOn(mockEvent, 'stopPropagation');

      component.onToggleWishlist(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.toggleWishlist.emit).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('Price Formatting', () => {
    it('should format USD prices correctly', () => {
      const formatted = (component as any).formatPrice(150.99, 'USD');
      expect(formatted).toBe('$150.99');
    });

    it('should format SYP prices correctly', () => {
      const formatted = (component as any).formatPrice(150000, 'SYP');
      expect(formatted).toBe('150,000 £S');
    });

    it('should format EUR prices correctly', () => {
      const formatted = (component as any).formatPrice(125.50, 'EUR');
      expect(formatted).toBe('€125.50');
    });

    it('should handle unknown currencies', () => {
      const formatted = (component as any).formatPrice(100, 'JPY');
      expect(formatted).toBe('100.00 JPY');
    });

    it('should handle invalid amounts', () => {
      const formatted = (component as any).formatPrice(0, 'USD');
      expect(formatted).toBe('');
    });
  });

  describe('Image Error Handling', () => {
    it('should handle image errors and set placeholder', () => {
      const mockImgElement = {
        src: '',
        alt: ''
      } as HTMLImageElement;

      const mockEvent = {
        target: mockImgElement
      } as unknown as Event;

      component.onImageError(mockEvent);

      expect(mockImgElement.src).toBe('assets/images/placeholder-product.svg');
      expect(mockImgElement.alt).toBe('Product image not available | الصورة غير متاحة');
    });

    it('should provide placeholder image when no images exist', () => {
      component.product = {
        ...mockProduct,
        images: []
      };
      fixture.detectChanges();

      const primaryImg = component.primaryImage();
      expect(primaryImg.url).toBe('assets/images/placeholder-product.svg');
      expect(primaryImg.alt).toBe('Product image | صورة المنتج');
    });
  });

  describe('CSS Theme Classes', () => {
    it('should generate correct theme classes', () => {
      component.backgroundTheme = 'golden-wheat';
      component.damascusPatternOverlay = true;

      const classes = component.getBackgroundThemeClass();
      expect(classes).toContain('featured-product-showcase-container');
      expect(classes).toContain('theme-golden-wheat');
      expect(classes).toContain('with-damascus-pattern');
    });

    it('should handle theme without Damascus pattern', () => {
      component.backgroundTheme = 'cream';
      component.damascusPatternOverlay = false;

      const classes = component.getBackgroundThemeClass();
      expect(classes).toContain('theme-cream');
      expect(classes).not.toContain('with-damascus-pattern');
    });
  });

  describe('Product Route Generation', () => {
    it('should generate correct product route', () => {
      component.product = mockProduct;
      const route = component.getProductRoute();
      expect(route).toBe('/product/test-damascus-steel-knife');
    });

    it('should handle missing product slug', () => {
      component.product = { ...mockProduct, slug: undefined };
      const route = component.getProductRoute();
      expect(route).toBe('/products');
    });

    it('should handle null product', () => {
      component.product = null;
      const route = component.getProductRoute();
      expect(route).toBe('/products');
    });
  });

  describe('Template Rendering', () => {
    it('should render loading state when no product', () => {
      component.product = null;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.loading-state')).toBeTruthy();
      expect(compiled.querySelector('.loading-spinner')).toBeTruthy();
    });

    it('should render product content when product exists', () => {
      component.product = mockProduct;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.showcase-content')).toBeTruthy();
      expect(compiled.querySelector('.product-content')).toBeTruthy();
    });

    it('should show today\'s badge when enabled', () => {
      component.product = mockProduct;
      component.showTodaysBadge = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.todays-pick-badge')).toBeTruthy();
    });

    it('should hide today\'s badge when disabled', () => {
      component.product = mockProduct;
      component.showTodaysBadge = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.todays-pick-badge')).toBeFalsy();
    });

    it('should display product names in correct order (Arabic first)', () => {
      component.product = mockProduct;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const arabicName = compiled.querySelector('.product-name-arabic');
      const englishName = compiled.querySelector('.product-name-english');

      expect(arabicName).toBeTruthy();
      expect(englishName).toBeTruthy();
      expect(arabicName.textContent.trim()).toBe('سكين الفولاذ الدمشقي للاختبار');
      expect(englishName.textContent.trim()).toBe('Test Damascus Steel Knife');
    });

    it('should display pricing information correctly', () => {
      component.product = mockProduct;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const currentPrice = compiled.querySelector('.price-current');
      const originalPrice = compiled.querySelector('.price-original');
      const discountBadge = compiled.querySelector('.price-discount-badge');

      expect(currentPrice.textContent.trim()).toBe('$150.00');
      expect(originalPrice.textContent.trim()).toBe('$200.00');
      expect(discountBadge.textContent.trim()).toBe('-25%');
    });

    it('should display star rating correctly', () => {
      component.product = mockProduct;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const stars = compiled.querySelectorAll('.rating-star');
      const ratingText = compiled.querySelector('.rating-text');

      expect(stars.length).toBe(5);
      expect(ratingText.textContent).toContain('4.8');
      expect(ratingText.textContent).toContain('(127)');
    });

    it('should show authenticity badges', () => {
      component.product = mockProduct;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const badges = compiled.querySelectorAll('.authenticity-badge');

      expect(badges.length).toBe(2); // Only first 2 badges should be shown
      expect(badges[0].textContent.trim()).toBe('UNESCO Heritage');
      expect(badges[1].textContent.trim()).toBe('Handcrafted');
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      component.product = mockProduct;
      fixture.detectChanges();
    });

    it('should have proper ARIA labels', () => {
      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.featured-product-showcase-container');
      const productContent = compiled.querySelector('.product-content');

      expect(container.getAttribute('aria-label')).toContain('Featured product');
      expect(productContent.getAttribute('aria-label')).toContain('Click to view');
    });

    it('should have proper role attributes', () => {
      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.featured-product-showcase-container');
      const badge = compiled.querySelector('.todays-pick-badge');
      const productContent = compiled.querySelector('.product-content');

      expect(container.getAttribute('role')).toBe('article');
      expect(badge.getAttribute('role')).toBe('banner');
      expect(productContent.getAttribute('role')).toBe('button');
    });

    it('should have tabindex for keyboard navigation', () => {
      const compiled = fixture.nativeElement;
      const productContent = compiled.querySelector('.product-content');

      expect(productContent.getAttribute('tabindex')).toBe('0');
    });

    it('should include screen reader announcements', () => {
      const compiled = fixture.nativeElement;
      const announcement = compiled.querySelector('#product-status-announcement');

      expect(announcement).toBeTruthy();
      expect(announcement.textContent).toContain('Featured product');
      expect(announcement.textContent).toContain(mockProduct.name);
    });
  });

  describe('Analytics Tracking', () => {
    beforeEach(() => {
      component.product = mockProduct;
      fixture.detectChanges();
    });

    it('should track product click analytics', () => {
      spyOn(console, 'log');

      component.onProductClick();

      expect(console.log).toHaveBeenCalledWith(
        'Featured Product Showcase Analytics: featured_product_click',
        jasmine.objectContaining({
          product_id: 'test-product-123',
          product_name: 'Test Damascus Steel Knife',
          source: 'featured_product_showcase'
        })
      );
    });

    it('should track add to cart analytics', () => {
      spyOn(console, 'log');
      const mockEvent = new Event('click');

      component.onAddToCart(mockEvent);

      expect(console.log).toHaveBeenCalledWith(
        'Featured Product Showcase Analytics: add_to_cart',
        jasmine.objectContaining({
          currency: 'USD',
          value: 150,
          items: jasmine.arrayContaining([
            jasmine.objectContaining({
              item_id: 'test-product-123',
              item_name: 'Test Damascus Steel Knife'
            })
          ])
        })
      );
    });

    it('should handle analytics errors gracefully', () => {
      spyOn(console, 'error');

      // Mock gtag to throw an error
      (window as any).gtag = () => {
        throw new Error('Analytics error');
      };

      component.onProductClick();

      expect(console.error).toHaveBeenCalledWith(
        'Featured Product Showcase: Analytics tracking error:',
        jasmine.any(Error)
      );
    });
  });

  describe('Input Property Validation', () => {
    it('should accept different background themes', () => {
      component.backgroundTheme = 'cream';
      fixture.detectChanges();
      expect(component.backgroundTheme).toBe('cream');

      component.backgroundTheme = 'sand';
      fixture.detectChanges();
      expect(component.backgroundTheme).toBe('sand');
    });

    it('should handle boolean input properties', () => {
      component.showTodaysBadge = false;
      component.damascusPatternOverlay = false;
      fixture.detectChanges();

      expect(component.showTodaysBadge).toBe(false);
      expect(component.damascusPatternOverlay).toBe(false);
    });
  });
});