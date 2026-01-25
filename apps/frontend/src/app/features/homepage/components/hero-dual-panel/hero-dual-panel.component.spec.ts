import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Component, Input, Output, EventEmitter } from '@angular/core';

import { HeroDualPanelComponent } from './hero-dual-panel.component';

// Mock SliderImageSwiperComponent
@Component({
  selector: 'app-slider-image-swiper',
  template: '<div data-testid="mock-slider">Mock Slider</div>'
})
class MockSliderImageSwiperComponent {
  @Input() images: any[] = [];
  @Input() autoplay = true;
  @Input() intervalMs = 4000;
  @Input() pauseOnHover = true;
  @Input() offerBaseUrl = '/offers';
}

// Mock FeaturedProductShowcaseComponent
@Component({
  selector: 'app-featured-product-showcase',
  template: '<div data-testid="mock-featured-product">Mock Featured Product</div>'
})
class MockFeaturedProductShowcaseComponent {
  @Input() product: any = null;
  @Input() showTodaysBadge = true;
  @Input() damascusPatternOverlay = true;
  @Output() productClick = new EventEmitter<any>();
  @Output() addToCart = new EventEmitter<any>();
}

/**
 * Test Suite for Hero Dual Panel Component
 *
 * Tests the dual-panel hero section functionality including:
 * - Component initialization and rendering
 * - Offer banner display and interactions
 * - Featured product showcase integration
 * - Responsive layout behavior
 * - Accessibility features
 * - Analytics tracking
 * - Loading and empty states
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroDualPanelComponentTest:
 *       type: object
 *       description: Test configuration for Hero Dual Panel Component
 *       properties:
 *         testOfferBanners:
 *           type: array
 *           description: Mock offer banners for testing
 *         testFeaturedProduct:
 *           type: object
 *           description: Mock featured product for testing
 *         expectedAnalyticsEvents:
 *           type: array
 *           description: Expected analytics events to be tracked
 */
describe('HeroDualPanelComponent', () => {
  let component: HeroDualPanelComponent;
  let fixture: ComponentFixture<HeroDualPanelComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  // Test data
  const mockOfferBanners = [
    {
      src: 'https://example.com/banner1.jpg',
      alt: 'Damascus Steel Offer',
      link: '/category/damascus-steel',
      titleAr: 'خصم 30% على الفولاذ الدمشقي',
      titleEn: '30% OFF Damascus Steel'
    },
    {
      src: 'https://example.com/banner2.jpg',
      alt: 'Aleppo Soap Special',
      link: '/category/beauty-wellness',
      titleAr: 'عرض خاص على صابون حلب',
      titleEn: 'Aleppo Soap Special'
    }
  ];

  const mockFeaturedProduct = {
    id: 'test-damascus-knife',
    name: 'Test Damascus Steel Knife',
    nameArabic: 'سكين الفولاذ الدمشقي للاختبار',
    slug: 'test-damascus-steel-knife',
    price: {
      amount: 150,
      currency: 'USD',
      originalPrice: 200
    },
    images: [
      {
        id: 'test-knife-1',
        url: 'https://example.com/knife.jpg',
        alt: 'Test Damascus Knife',
        isPrimary: true
      }
    ],
    category: {
      id: 'damascus-steel',
      name: 'Damascus Steel',
      nameArabic: 'الفولاذ الدمشقي'
    },
    reviews: {
      averageRating: 4.8,
      totalReviews: 100
    },
    inventory: {
      inStock: true,
      quantity: 25,
      status: 'in_stock'
    }
  };

  beforeEach(async () => {
    // Create router spy
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        HeroDualPanelComponent,
        MockSliderImageSwiperComponent,
        MockFeaturedProductShowcaseComponent
      ],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroDualPanelComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.offerBanners).toEqual([]);
      expect(component.featuredProduct).toBeNull();
      expect(component.autoRotateInterval).toBe(4000);
      expect(component.pauseOnHover).toBe(true);
    });

    it('should have computed signals working correctly', () => {
      expect(component.hasValidData()).toBeFalsy();
      expect(component.displayOfferBanners()).toBeDefined();
      expect(component.displayFeaturedProduct()).toBeDefined();
    });
  });

  describe('Input Properties', () => {
    it('should accept offer banners input', () => {
      component.offerBanners = mockOfferBanners;
      fixture.detectChanges();

      expect(component.displayOfferBanners()).toEqual(mockOfferBanners);
      expect(component.hasValidData()).toBeTruthy();
    });

    it('should accept featured product input', () => {
      component.featuredProduct = mockFeaturedProduct;
      fixture.detectChanges();

      expect(component.displayFeaturedProduct()).toEqual(mockFeaturedProduct);
      expect(component.hasValidData()).toBeTruthy();
    });

    it('should accept custom autoplay settings', () => {
      component.autoRotateInterval = 6000;
      component.pauseOnHover = false;
      fixture.detectChanges();

      expect(component.autoRotateInterval).toBe(6000);
      expect(component.pauseOnHover).toBe(false);
    });
  });

  describe('Offer Banner Interactions', () => {
    beforeEach(() => {
      component.offerBanners = mockOfferBanners;
      fixture.detectChanges();
    });

    it('should emit offerClick event when banner is clicked', () => {
      spyOn(component.offerClick, 'emit');
      const testBanner = mockOfferBanners[0];

      component.onOfferBannerClick(testBanner);

      expect(component.offerClick.emit).toHaveBeenCalledWith({
        bannerId: '30-off-damascus-steel',
        link: '/category/damascus-steel',
        source: 'hero-dual-panel'
      });
    });

    it('should handle banner click with missing link gracefully', () => {
      spyOn(component.offerClick, 'emit');
      const bannerWithoutLink = { ...mockOfferBanners[0], link: undefined };

      component.onOfferBannerClick(bannerWithoutLink);

      expect(component.offerClick.emit).toHaveBeenCalledWith({
        bannerId: '30-off-damascus-steel',
        link: '/offers',
        source: 'hero-dual-panel'
      });
    });

    it('should track analytics for banner clicks', () => {
      spyOn(console, 'log');
      const testBanner = mockOfferBanners[0];

      component.onOfferBannerClick(testBanner);

      expect(console.log).toHaveBeenCalledWith(
        'Hero Dual Panel Analytics: offer_banner_click',
        jasmine.objectContaining({
          banner_title_en: '30% OFF Damascus Steel',
          banner_title_ar: 'خصم 30% على الفولاذ الدمشقي',
          source: 'hero_dual_panel'
        })
      );
    });
  });

  describe('Featured Product Interactions', () => {
    beforeEach(() => {
      component.featuredProduct = mockFeaturedProduct;
      fixture.detectChanges();
    });

    it('should emit featuredProductClick event when product is clicked', () => {
      spyOn(component.featuredProductClick, 'emit');

      component.onFeaturedProductClick(mockFeaturedProduct);

      expect(component.featuredProductClick.emit).toHaveBeenCalledWith({
        productId: 'test-damascus-knife',
        productName: 'Test Damascus Steel Knife',
        source: 'hero-dual-panel'
      });
    });

    it('should emit featuredProductAddToCart event when add to cart is clicked', () => {
      spyOn(component.featuredProductAddToCart, 'emit');

      component.onFeaturedProductAddToCart(mockFeaturedProduct);

      expect(component.featuredProductAddToCart.emit).toHaveBeenCalledWith({
        productId: 'test-damascus-knife',
        productName: 'Test Damascus Steel Knife',
        price: 150,
        source: 'hero-dual-panel'
      });
    });

    it('should track analytics for product interactions', () => {
      spyOn(console, 'log');

      component.onFeaturedProductClick(mockFeaturedProduct);

      expect(console.log).toHaveBeenCalledWith(
        'Hero Dual Panel Analytics: featured_product_click',
        jasmine.objectContaining({
          product_id: 'test-damascus-knife',
          product_name: 'Test Damascus Steel Knife',
          source: 'hero_dual_panel'
        })
      );
    });
  });

  describe('Default Fallback Data', () => {
    it('should provide default offer banners when none are provided', () => {
      // Don't set any offer banners
      fixture.detectChanges();

      const defaultBanners = component.displayOfferBanners();
      expect(defaultBanners.length).toBeGreaterThan(0);
      expect(defaultBanners[0].titleAr).toBeDefined();
      expect(defaultBanners[0].titleEn).toBeDefined();
    });

    it('should provide default featured product when none is provided', () => {
      // Don't set any featured product
      fixture.detectChanges();

      const defaultProduct = component.displayFeaturedProduct();
      expect(defaultProduct).toBeDefined();
      expect(defaultProduct.name).toBeDefined();
      expect(defaultProduct.nameArabic).toBeDefined();
      expect(defaultProduct.price).toBeDefined();
    });

    it('should use provided data over defaults', () => {
      component.offerBanners = mockOfferBanners;
      component.featuredProduct = mockFeaturedProduct;
      fixture.detectChanges();

      expect(component.displayOfferBanners()).toEqual(mockOfferBanners);
      expect(component.displayFeaturedProduct()).toEqual(mockFeaturedProduct);
    });
  });

  describe('Template Rendering', () => {
    it('should render dual panel structure', () => {
      component.offerBanners = mockOfferBanners;
      component.featuredProduct = mockFeaturedProduct;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('.hero-dual-panel-container')).toBeTruthy();
      expect(compiled.querySelector('.offers-slider-panel')).toBeTruthy();
      expect(compiled.querySelector('.featured-product-panel')).toBeTruthy();
    });

    it('should show loading state when no data is available', () => {
      // Set empty data
      component.offerBanners = [];
      component.featuredProduct = null;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.hero-loading-state')).toBeTruthy();
    });

    it('should include structured data for SEO', () => {
      component.featuredProduct = mockFeaturedProduct;
      fixture.detectChanges();

      const structuredData = fixture.nativeElement.querySelector('script[type="application/ld+json"]');
      expect(structuredData).toBeTruthy();

      const jsonData = JSON.parse(structuredData.textContent);
      expect(jsonData['@type']).toBe('Product');
      expect(jsonData.name).toBe('Test Damascus Steel Knife');
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      component.offerBanners = mockOfferBanners;
      component.featuredProduct = mockFeaturedProduct;
      fixture.detectChanges();
    });

    it('should have proper ARIA labels', () => {
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('[aria-label*="Special offers"]')).toBeTruthy();
      expect(compiled.querySelector('[aria-label*="featured product"]')).toBeTruthy();
    });

    it('should have role attributes for semantic structure', () => {
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('[role="banner"]')).toBeTruthy();
      expect(compiled.querySelector('[role="region"]')).toBeTruthy();
    });

    it('should include screen reader content', () => {
      const compiled = fixture.nativeElement;
      const srContent = compiled.querySelector('#offers-description');

      expect(srContent).toBeTruthy();
      expect(srContent.textContent).toContain('Current promotion');
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive CSS classes', () => {
      component.offerBanners = mockOfferBanners;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.hero-dual-panel-container');

      expect(container).toBeTruthy();
      // CSS responsive behavior is tested through the stylesheet
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics tracking errors gracefully', () => {
      spyOn(console, 'error');

      // Mock gtag to throw an error
      (window as any).gtag = () => {
        throw new Error('Analytics error');
      };

      component.onOfferBannerClick(mockOfferBanners[0]);

      expect(console.error).toHaveBeenCalledWith(
        'Hero Dual Panel: Analytics tracking error:',
        jasmine.any(Error)
      );
    });

    it('should handle missing banner properties', () => {
      const incompleteBanner = { src: 'test.jpg' };

      expect(() => {
        component.onOfferBannerClick(incompleteBanner);
      }).not.toThrow();
    });
  });
});