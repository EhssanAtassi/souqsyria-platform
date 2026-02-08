/**
 * @file featured-categories.component.spec.ts
 * @description Unit tests for the FeaturedCategoriesComponent
 *
 * TEST COVERAGE:
 * - Component creation
 * - Category card rendering with correct count
 * - Category name and product count display
 * - Event emission on card click
 * - Loading skeleton state
 * - Image error fallback placeholder
 * - Grid layout for desktop (6 columns)
 * - Empty state rendering
 *
 * @author SouqSyria Development Team
 * @since 2026-02-07
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { FeaturedCategoriesComponent } from './featured-categories.component';
import { FeaturedCategory } from '../../models/category-tree.interface';

// =============================================================================
// TEST DATA
// =============================================================================

/** Mock featured categories representing Syrian marketplace data */
const MOCK_FEATURED_CATEGORIES: FeaturedCategory[] = [
  {
    id: 1,
    name: 'Electronics',
    nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
    slug: 'electronics',
    image: 'electronics.jpg',
    icon: 'devices',
    productCount: 45,
    sortOrder: 10,
  },
  {
    id: 2,
    name: 'Fashion',
    nameAr: '\u0623\u0632\u064A\u0627\u0621',
    slug: 'fashion',
    image: 'fashion.jpg',
    icon: 'checkroom',
    productCount: 38,
    sortOrder: 20,
  },
  {
    id: 3,
    name: 'Home & Garden',
    nameAr: '\u0627\u0644\u0645\u0646\u0632\u0644 \u0648\u0627\u0644\u062D\u062F\u064A\u0642\u0629',
    slug: 'home-garden',
    image: 'home.jpg',
    icon: 'home',
    productCount: 27,
    sortOrder: 30,
  },
  {
    id: 4,
    name: 'Sports',
    nameAr: '\u0631\u064A\u0627\u0636\u0629',
    slug: 'sports',
    image: 'sports.jpg',
    icon: 'sports',
    productCount: 15,
    sortOrder: 40,
  },
  {
    id: 5,
    name: 'Books',
    nameAr: '\u0643\u062A\u0628',
    slug: 'books',
    image: 'books.jpg',
    icon: 'book',
    productCount: 1,
    sortOrder: 50,
  },
  {
    id: 6,
    name: 'Beauty',
    nameAr: '\u062C\u0645\u0627\u0644',
    slug: 'beauty',
    image: 'beauty.jpg',
    icon: 'spa',
    productCount: 22,
    sortOrder: 60,
  },
];

// =============================================================================
// TEST SUITE
// =============================================================================

/** @description Comprehensive tests for the FeaturedCategoriesComponent */
describe('FeaturedCategoriesComponent', () => {
  let component: FeaturedCategoriesComponent;
  let fixture: ComponentFixture<FeaturedCategoriesComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedCategoriesComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedCategoriesComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ===========================================================================
  // COMPONENT CREATION
  // ===========================================================================

  /** @description Basic component instantiation */
  describe('Component Creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  // ===========================================================================
  // RENDERING CATEGORIES
  // ===========================================================================

  /** @description Tests for rendering category cards */
  describe('Category Card Rendering', () => {
    /**
     * Should render correct number of category cards
     * Validates: ngFor renders one card per category
     */
    it('should render correct number of category cards', () => {
      component.categories = MOCK_FEATURED_CATEGORIES;
      component.isLoading = false;
      fixture.detectChanges();

      const cards = compiled.querySelectorAll('.category-card');
      expect(cards.length).toBe(6);
    });

    /**
     * Should display category name and product count
     * Validates: Card content shows name text and product count badge
     */
    it('should display category name and product count', () => {
      component.categories = MOCK_FEATURED_CATEGORIES;
      component.isLoading = false;
      fixture.detectChanges();

      const firstCard = compiled.querySelector('.category-card');
      expect(firstCard).toBeTruthy();

      const nameElement = firstCard?.querySelector('.category-name');
      expect(nameElement?.textContent?.trim()).toContain('Electronics');

      const countElement = firstCard?.querySelector('.product-count');
      expect(countElement?.textContent?.trim()).toContain('45 products');
    });

    /**
     * Should render 6 cards for desktop grid
     * Validates: Full grid renders all provided categories
     */
    it('should render 6 cards for desktop grid', () => {
      component.categories = MOCK_FEATURED_CATEGORIES;
      component.isLoading = false;
      fixture.detectChanges();

      const grid = compiled.querySelector('.categories-grid');
      expect(grid).toBeTruthy();
      expect(grid?.classList.contains('lg:grid-cols-6')).toBe(true);

      const cards = grid?.querySelectorAll('.category-card');
      expect(cards?.length).toBe(6);
    });

    /**
     * Should display singular product count for 1 product
     * Validates: Text formatting for singular count
     */
    it('should display singular product count for 1 product', () => {
      component.isRtl.set(false);
      const text = component.getProductCountText(1);
      expect(text).toBe('1 product');
    });

    /**
     * Should display plural product count for multiple products
     * Validates: Text formatting for plural count
     */
    it('should display plural product count for multiple products', () => {
      component.isRtl.set(false);
      const text = component.getProductCountText(45);
      expect(text).toBe('45 products');
    });
  });

  // ===========================================================================
  // EVENT EMISSION
  // ===========================================================================

  /** @description Tests for output event emissions */
  describe('Event Emission', () => {
    /**
     * Should emit categoryClicked when card is clicked
     * Validates: onCategoryClick method emits the correct slug
     */
    it('should emit categoryClicked when card is clicked', () => {
      const emitSpy = jest.spyOn(component.categoryClicked, 'emit');
      component.categories = MOCK_FEATURED_CATEGORIES;
      component.isLoading = false;
      fixture.detectChanges();

      component.onCategoryClick('electronics');

      expect(emitSpy).toHaveBeenCalledWith('electronics');
    });

    /**
     * Should emit event from DOM click on category card
     * Validates: Click handler on card element triggers emission
     */
    it('should emit event from DOM click on category card', () => {
      const emitSpy = jest.spyOn(component.categoryClicked, 'emit');
      component.categories = MOCK_FEATURED_CATEGORIES;
      component.isLoading = false;
      fixture.detectChanges();

      const firstCard = compiled.querySelector('.category-card') as HTMLElement;
      firstCard?.click();

      expect(emitSpy).toHaveBeenCalledWith('electronics');
    });
  });

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  /** @description Tests for skeleton loading state */
  describe('Loading State', () => {
    /**
     * Should show skeleton when isLoading=true
     * Validates: Skeleton cards are displayed during loading
     */
    it('should show skeleton when isLoading=true', () => {
      component.isLoading = true;
      component.categories = [];
      fixture.detectChanges();

      const skeletonCards = compiled.querySelectorAll('.skeleton-card');
      expect(skeletonCards.length).toBe(6);
    });

    /**
     * Should not show skeleton when isLoading=false
     * Validates: Skeleton is hidden when data is loaded
     */
    it('should not show skeleton when isLoading=false', () => {
      component.isLoading = false;
      component.categories = MOCK_FEATURED_CATEGORIES;
      fixture.detectChanges();

      const skeletonCards = compiled.querySelectorAll('.skeleton-card');
      expect(skeletonCards.length).toBe(0);
    });

    /**
     * Should not show categories grid when loading
     * Validates: Category grid is hidden during loading
     */
    it('should not show categories grid when loading', () => {
      component.isLoading = true;
      component.categories = MOCK_FEATURED_CATEGORIES;
      fixture.detectChanges();

      const grid = compiled.querySelector('.categories-grid');
      expect(grid).toBeNull();
    });
  });

  // ===========================================================================
  // IMAGE ERROR HANDLING
  // ===========================================================================

  /** @description Tests for image load error fallback */
  describe('Image Error Handling', () => {
    /**
     * Should show placeholder on image error
     * Validates: onImageError sets placeholder src
     */
    it('should show placeholder on image error', () => {
      const mockImg = { src: 'broken.jpg' } as HTMLImageElement;
      const mockEvent = { target: mockImg } as unknown as Event;

      component.onImageError(mockEvent);

      expect(mockImg.src).toBe('/assets/images/placeholder-category.png');
    });
  });

  // ===========================================================================
  // RTL SUPPORT
  // ===========================================================================

  /** @description Tests for RTL layout and Arabic name display */
  describe('RTL Support', () => {
    /**
     * Should display Arabic name when isRtl=true
     * Validates: getCategoryName returns Arabic name in RTL mode
     */
    it('should display Arabic name when isRtl=true', () => {
      component.isRtl.set(true);
      const name = component.getCategoryName(MOCK_FEATURED_CATEGORIES[0]);
      expect(name).toBe('\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A');
    });

    /**
     * Should display English name when isRtl=false
     * Validates: getCategoryName returns English name in LTR mode
     */
    it('should display English name when isRtl=false', () => {
      component.isRtl.set(false);
      const name = component.getCategoryName(MOCK_FEATURED_CATEGORIES[0]);
      expect(name).toBe('Electronics');
    });

    /**
     * Should display Arabic product count text when isRtl=true
     * Validates: Product count uses Arabic format
     */
    it('should display Arabic product count text when isRtl=true', () => {
      component.isRtl.set(true);
      const text = component.getProductCountText(45);
      expect(text).toContain('45');
      expect(text).toContain('\u0645\u0646\u062A\u062C');
    });
  });

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  /** @description Tests for empty state display */
  describe('Empty State', () => {
    /**
     * Should display empty state when no categories and not loading
     * Validates: Empty state message is visible
     */
    it('should display empty state when no categories and not loading', () => {
      component.categories = [];
      component.isLoading = false;
      fixture.detectChanges();

      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    /**
     * Should not display empty state when categories are present
     * Validates: Empty state is hidden when data exists
     */
    it('should not display empty state when categories are present', () => {
      component.categories = MOCK_FEATURED_CATEGORIES;
      component.isLoading = false;
      fixture.detectChanges();

      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeNull();
    });
  });

  // ===========================================================================
  // TRACK BY
  // ===========================================================================

  /** @description Tests for ngFor trackBy optimization */
  describe('TrackBy Function', () => {
    /**
     * Should return category id for trackBy
     * Validates: trackByCategory returns the unique category id
     */
    it('should return category id for trackBy', () => {
      const result = component.trackByCategory(0, MOCK_FEATURED_CATEGORIES[0]);
      expect(result).toBe(1);
    });
  });
});
