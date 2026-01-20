import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryShowcaseSectionComponent } from './category-showcase-section.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MatIconModule } from '@angular/material/icon';
import { FeaturedBannerComponent } from '../../../../shared/components/featured-banner/featured-banner.component';
import { SubcategoryGridComponent } from '../../../../shared/components/subcategory-grid/subcategory-grid.component';
import { CategoryShowcaseSection } from '../../../../shared/interfaces/category-showcase.interface';

/**
 * Test suite for CategoryShowcaseSectionComponent
 *
 * Tests the main wrapper component that combines featured banner
 * and subcategory grid in a responsive layout per Figma design.
 */
describe('CategoryShowcaseSectionComponent', () => {
  let component: CategoryShowcaseSectionComponent;
  let fixture: ComponentFixture<CategoryShowcaseSectionComponent>;
  let compiled: HTMLElement;

  const mockSection: CategoryShowcaseSection = {
    id: 'test-section',
    title: { en: 'Test Category', ar: 'فئة الاختبار' },
    titleIcon: 'category',
    visible: true,
    order: 1,
    featuredBanner: {
      id: 'test-banner',
      title: { en: 'Test Banner', ar: 'لافتة الاختبار' },
      imageUrl: '/assets/test.png',
      originalPrice: 100,
      discountedPrice: 50,
      currency: 'USD',
      ctaText: { en: 'Shop Now', ar: 'تسوق الآن' },
      ctaLink: '/test'
    },
    subcategories: Array.from({ length: 8 }, (_, i) => ({
      id: `subcat-${i}`,
      name: { en: `Category ${i + 1}`, ar: `الفئة ${i + 1}` },
      iconClass: 'category',
      itemCount: i + 1,
      route: `/category/${i}`
    })),
    navigationLinks: {
      newArrivals: '/new',
      bestSeller: '/best'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CategoryShowcaseSectionComponent,
        RouterTestingModule,
        MatIconModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryShowcaseSectionComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;

    component.section = mockSection;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display section title', () => {
    const title = compiled.querySelector('h2');
    expect(title?.textContent).toContain('Test Category');
  });

  it('should render featured banner component', () => {
    const banner = compiled.querySelector('app-featured-banner');
    expect(banner).toBeTruthy();
  });

  it('should render subcategory grid component', () => {
    const grid = compiled.querySelector('app-subcategory-grid');
    expect(grid).toBeTruthy();
  });

  it('should emit banner click events', (done) => {
    component.bannerClick.subscribe(event => {
      expect(event).toBeDefined();
      done();
    });

    component.onBannerClick({
      bannerId: 'test',
      sectionId: 'test',
      targetUrl: '/test',
      timestamp: new Date()
    });
  });

  it('should emit subcategory click events', (done) => {
    component.subcategoryClick.subscribe(event => {
      expect(event).toBeDefined();
      done();
    });

    component.onSubcategoryClick({
      subcategoryId: 'test',
      sectionId: 'test',
      categoryName: 'Test',
      targetUrl: '/test',
      timestamp: new Date()
    });
  });

  it('should have responsive grid layout', () => {
    const content = compiled.querySelector('.showcase-content');
    expect(content?.classList.contains('grid')).toBe(true);
    expect(content?.classList.contains('lg:grid-cols-12')).toBe(true);
  });

  it('should display navigation links', () => {
    const links = compiled.querySelectorAll('.nav-link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});
