import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturedBannerComponent } from './featured-banner.component';
import { FeaturedBanner, BannerClickEvent } from '../../interfaces/category-showcase.interface';
import { RouterTestingModule } from '@angular/router/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

/**
 * Test suite for FeaturedBannerComponent
 *
 * Tests the featured promotional banner component that displays
 * product images, pricing, discounts, and call-to-action buttons.
 *
 * @description
 * This test suite covers:
 * - Component creation and initialization
 * - Input property binding
 * - Output event emission
 * - Discount calculation
 * - Price formatting
 * - Template rendering
 * - Click event handling
 * - Bilingual content display
 * - Accessibility features
 */
describe('FeaturedBannerComponent', () => {
  let component: FeaturedBannerComponent;
  let fixture: ComponentFixture<FeaturedBannerComponent>;
  let compiled: HTMLElement;

  const mockBanner: FeaturedBanner = {
    id: 'damascus-knife-promo',
    title: {
      en: 'EXPERIENCE AUTHENTIC DAMASCUS STEEL',
      ar: 'اكتشف الفولاذ الدمشقي الأصيل'
    },
    subtitle: {
      en: 'Handcrafted by Master Artisans',
      ar: 'صناعة يدوية من الحرفيين المهرة'
    },
    imageUrl: '/assets/images/products/exp1.png',
    originalPrice: 625.00,
    discountedPrice: 205.00,
    currency: 'USD',
    ctaText: { en: 'Shop Now', ar: 'تسوق الآن' },
    ctaLink: '/category/damascus-steel',
    badge: { text: { en: 'BEST SELLER', ar: 'الأكثر مبيعاً' }, color: '#C41E3A' }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FeaturedBannerComponent,
        RouterTestingModule,
        MatButtonModule,
        MatIconModule,
        MatRippleModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedBannerComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;

    // Set required inputs
    component.banner = mockBanner;
    component.sectionId = 'damascus-steel-showcase';

    fixture.detectChanges();
  });

  /**
   * Test: Component Creation
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test: Input Properties
   */
  describe('Input Properties', () => {
    it('should accept banner input', () => {
      expect(component.banner).toEqual(mockBanner);
    });

    it('should accept sectionId input', () => {
      expect(component.sectionId).toBe('damascus-steel-showcase');
    });

    it('should have showDiscount enabled by default', () => {
      expect(component.showDiscount).toBe(true);
    });

    it('should have showOriginalPrice enabled by default', () => {
      expect(component.showOriginalPrice).toBe(true);
    });
  });

  /**
   * Test: Discount Calculation
   */
  describe('Discount Calculation', () => {
    it('should calculate discount percentage correctly', () => {
      const percentage = component.discountPercentage();
      // (625 - 205) / 625 * 100 = 67.2% => rounds to 67%
      expect(percentage).toBe(67);
    });

    it('should return 0 when no discount exists', () => {
      component.banner = {
        ...mockBanner,
        originalPrice: 100,
        discountedPrice: 100
      };

      const percentage = component.discountPercentage();
      expect(percentage).toBe(0);
    });

    it('should return 0 when discounted price is higher', () => {
      component.banner = {
        ...mockBanner,
        originalPrice: 100,
        discountedPrice: 150
      };

      const percentage = component.discountPercentage();
      expect(percentage).toBe(0);
    });

    it('should detect when banner has discount', () => {
      expect(component.hasDiscount()).toBe(true);
    });

    it('should detect when banner has no discount', () => {
      component.banner = {
        ...mockBanner,
        originalPrice: 100,
        discountedPrice: 100
      };

      expect(component.hasDiscount()).toBe(false);
    });
  });

  /**
   * Test: Price Formatting
   */
  describe('Price Formatting', () => {
    it('should format USD prices correctly', () => {
      const formatted = component.formatPrice(205.00, 'USD');
      expect(formatted).toBe('$205.00');
    });

    it('should format SYP prices correctly', () => {
      const formatted = component.formatPrice(500000, 'SYP');
      expect(formatted).toContain('500,000.00');
      expect(formatted).toContain('ل.س');
    });

    it('should format EUR prices correctly', () => {
      const formatted = component.formatPrice(150.50, 'EUR');
      expect(formatted).toBe('€150.50');
    });

    it('should format GBP prices correctly', () => {
      const formatted = component.formatPrice(99.99, 'GBP');
      expect(formatted).toBe('£99.99');
    });

    it('should add commas to large numbers', () => {
      const formatted = component.formatPrice(1234567.89, 'USD');
      expect(formatted).toBe('$1,234,567.89');
    });

    it('should handle unknown currency codes', () => {
      const formatted = component.formatPrice(100, 'XYZ');
      expect(formatted).toContain('100.00');
      expect(formatted).toContain('XYZ');
    });
  });

  /**
   * Test: Template Rendering
   */
  describe('Template Rendering', () => {
    it('should display banner title in English', () => {
      const title = compiled.querySelector('h2');
      expect(title?.textContent).toContain('EXPERIENCE AUTHENTIC DAMASCUS STEEL');
    });

    it('should display banner title in Arabic', () => {
      const arabicTitle = compiled.querySelector('p[dir="rtl"]');
      expect(arabicTitle?.textContent).toContain('اكتشف الفولاذ الدمشقي الأصيل');
    });

    it('should display subtitle when provided', () => {
      const subtitle = compiled.querySelector('.text-content .mb-6');
      expect(subtitle?.textContent).toContain('Handcrafted by Master Artisans');
    });

    it('should not display subtitle section when not provided', () => {
      component.banner = { ...mockBanner, subtitle: undefined };
      fixture.detectChanges();

      const subtitleSection = compiled.querySelectorAll('.mb-6');
      // Should have fewer mb-6 elements without subtitle
      expect(subtitleSection.length).toBeLessThan(3);
    });

    it('should display product image', () => {
      const image = compiled.querySelector('.image-wrapper img') as HTMLImageElement;
      expect(image).toBeTruthy();
      expect(image.src).toContain('exp1.png');
      expect(image.alt).toBe(mockBanner.title.en);
    });

    it('should display original price when showOriginalPrice is true', () => {
      const originalPrice = compiled.querySelector('.original-price');
      expect(originalPrice).toBeTruthy();
      expect(originalPrice?.textContent).toContain('$625.00');
    });

    it('should hide original price when showOriginalPrice is false', () => {
      component.showOriginalPrice = false;
      fixture.detectChanges();

      const originalPrice = compiled.querySelector('.original-price');
      expect(originalPrice).toBeFalsy();
    });

    it('should display discounted price', () => {
      const salePrice = compiled.querySelector('.sale-price');
      expect(salePrice).toBeTruthy();
      expect(salePrice?.textContent).toContain('$205.00');
    });

    it('should display CTA button text in English', () => {
      const ctaButton = compiled.querySelector('.cta-button span');
      expect(ctaButton?.textContent).toContain('Shop Now');
    });

    it('should display CTA button text in Arabic', () => {
      const arabicCta = compiled.querySelector('.cta-section .font-arabic');
      expect(arabicCta?.textContent).toContain('تسوق الآن');
    });

    it('should display badge when provided', () => {
      const badge = compiled.querySelector('.absolute.top-4.left-4');
      expect(badge).toBeTruthy();
      expect(badge?.textContent).toContain('BEST SELLER');
    });

    it('should not display badge when not provided', () => {
      component.banner = { ...mockBanner, badge: undefined };
      fixture.detectChanges();

      const badge = compiled.querySelector('.absolute.top-4.left-4');
      expect(badge).toBeFalsy();
    });

    it('should display discount badge when showDiscount is true', () => {
      const discountBadge = compiled.querySelector('.absolute.top-4.right-4');
      expect(discountBadge).toBeTruthy();
      expect(discountBadge?.textContent).toContain('-67% OFF');
    });

    it('should hide discount badge when showDiscount is false', () => {
      component.showDiscount = false;
      fixture.detectChanges();

      const discountBadge = compiled.querySelector('.absolute.top-4.right-4');
      expect(discountBadge).toBeFalsy();
    });
  });

  /**
   * Test: Click Events
   */
  describe('Click Events', () => {
    it('should emit bannerClick event when banner is clicked', (done) => {
      component.bannerClick.subscribe((event: BannerClickEvent) => {
        expect(event.bannerId).toBe('damascus-knife-promo');
        expect(event.sectionId).toBe('damascus-steel-showcase');
        expect(event.targetUrl).toBe('/category/damascus-steel');
        expect(event.analytics?.source).toBe('featured_banner');
        expect(event.analytics?.medium).toBe('homepage_section');
        expect(event.analytics?.campaign).toBe('damascus-steel-showcase');
        done();
      });

      const banner = compiled.querySelector('.featured-banner') as HTMLElement;
      banner.click();
    });

    it('should emit bannerClick event when CTA button is clicked', (done) => {
      component.bannerClick.subscribe((event: BannerClickEvent) => {
        expect(event.bannerId).toBe('damascus-knife-promo');
        done();
      });

      const ctaButton = compiled.querySelector('.cta-button') as HTMLElement;
      ctaButton.click();
    });

    it('should call onBannerClick method', () => {
      spyOn(component, 'onBannerClick');

      const banner = compiled.querySelector('.featured-banner') as HTMLElement;
      banner.click();

      expect(component.onBannerClick).toHaveBeenCalled();
    });

    it('should stop event propagation on CTA click', () => {
      const mockEvent = new MouseEvent('click');
      spyOn(mockEvent, 'stopPropagation');

      component.onCtaClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  /**
   * Test: Routing
   */
  describe('Routing', () => {
    it('should have routerLink on banner', () => {
      const banner = compiled.querySelector('.featured-banner');
      expect(banner?.getAttribute('ng-reflect-router-link')).toBe('/category/damascus-steel');
    });

    it('should navigate to correct route', () => {
      const banner = compiled.querySelector('.featured-banner');
      expect(banner?.getAttribute('ng-reflect-router-link')).toBe(mockBanner.ctaLink);
    });
  });

  /**
   * Test: Accessibility
   */
  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      const image = compiled.querySelector('.image-wrapper img') as HTMLImageElement;
      expect(image.alt).toBe(mockBanner.title.en);
    });

    it('should have button type for CTA', () => {
      const ctaButton = compiled.querySelector('.cta-button');
      expect(ctaButton?.getAttribute('type')).toBe('button');
    });

    it('should have proper heading hierarchy', () => {
      const h2 = compiled.querySelector('h2');
      expect(h2).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      const banner = compiled.querySelector('.featured-banner');
      expect(banner?.classList.contains('cursor-pointer')).toBe(true);
    });
  });

  /**
   * Test: Responsive Layout
   */
  describe('Responsive Layout', () => {
    it('should have grid layout for content', () => {
      const content = compiled.querySelector('.banner-content');
      expect(content?.classList.contains('grid')).toBe(true);
    });

    it('should have responsive grid columns', () => {
      const content = compiled.querySelector('.banner-content');
      expect(content?.classList.contains('grid-cols-1')).toBe(true);
      expect(content?.classList.contains('lg:grid-cols-2')).toBe(true);
    });

    it('should order content correctly on mobile vs desktop', () => {
      const textContent = compiled.querySelector('.text-content');
      const imageContent = compiled.querySelector('.image-content');

      expect(textContent?.classList.contains('order-2')).toBe(true);
      expect(textContent?.classList.contains('lg:order-1')).toBe(true);

      expect(imageContent?.classList.contains('order-1')).toBe(true);
      expect(imageContent?.classList.contains('lg:order-2')).toBe(true);
    });
  });

  /**
   * Test: Syrian Golden Wheat Theme
   */
  describe('Theme and Styling', () => {
    it('should apply Syrian Golden Wheat colors', () => {
      const salePrice = compiled.querySelector('.sale-price');
      expect(salePrice?.classList.contains('text-golden-wheat-dark')).toBe(true);
    });

    it('should have hover effects', () => {
      const banner = compiled.querySelector('.featured-banner');
      expect(banner?.classList.contains('hover:border-golden-wheat')).toBe(true);
    });

    it('should apply group hover effects', () => {
      const banner = compiled.querySelector('.featured-banner');
      expect(banner?.classList.contains('group')).toBe(true);
    });

    it('should have proper background color', () => {
      const banner = compiled.querySelector('.featured-banner') as HTMLElement;
      expect(banner.style.backgroundColor).toBe('rgb(249, 250, 251)');
    });
  });

  /**
   * Test: Badge Styling
   */
  describe('Badge Display', () => {
    it('should apply correct badge color', () => {
      const badge = compiled.querySelector('.absolute.top-4.left-4') as HTMLElement;
      expect(badge.style.backgroundColor).toBe('rgb(196, 30, 58)'); // #C41E3A
    });

    it('should display badge text in uppercase', () => {
      const badge = compiled.querySelector('.absolute.top-4.left-4');
      expect(badge?.classList.contains('uppercase')).toBe(true);
    });
  });

  /**
   * Test: Currency Support
   */
  describe('Currency Support', () => {
    it('should handle multiple currencies', () => {
      const currencies = ['USD', 'SYP', 'EUR', 'GBP'];

      currencies.forEach(currency => {
        const formatted = component.formatPrice(100, currency);
        expect(formatted).toBeTruthy();
        expect(formatted.length).toBeGreaterThan(0);
      });
    });

    it('should position currency symbol correctly for Syrian Pounds', () => {
      const formatted = component.formatPrice(1000, 'SYP');
      // Syrian Pounds should have symbol after amount
      expect(formatted.indexOf('ل.س')).toBeGreaterThan(formatted.indexOf('1,000'));
    });

    it('should position currency symbol correctly for Western currencies', () => {
      const formatted = component.formatPrice(100, 'USD');
      // USD should have symbol before amount
      expect(formatted.indexOf('$')).toBe(0);
    });
  });
});
