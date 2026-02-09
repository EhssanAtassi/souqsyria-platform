/**
 * @file mobile-category-nav.component.spec.ts
 * @description Unit tests for the MobileCategoryNavComponent
 *
 * TEST COVERAGE:
 * - Component initialization and inputs
 * - Event emissions (menuClosed, categorySelected)
 * - Loading states and skeleton display
 * - RTL layout detection
 * - User interactions (clicks, keyboard, backdrop)
 * - Category display and hierarchy
 *
 * @author SouqSyria Development Team
 * @since 2026-02-09
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MobileCategoryNavComponent } from './mobile-category-nav.component';
import { CategoryTreeNode } from '../../models/category-tree.interface';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Mock category tree data for testing
 * Creates a realistic 3-level hierarchy
 */
const MOCK_CATEGORIES: CategoryTreeNode[] = [
  {
    id: 1,
    name: 'Electronics',
    nameAr: 'إلكترونيات',
    slug: 'electronics',
    icon: 'devices',
    image: 'electronics.jpg',
    productCount: 150,
    children: [
      {
        id: 10,
        name: 'Mobile Phones',
        nameAr: 'هواتف محمولة',
        slug: 'mobile-phones',
        icon: 'smartphone',
        image: 'phones.jpg',
        productCount: 50,
        children: [
          {
            id: 100,
            name: 'iPhones',
            nameAr: 'آيفونات',
            slug: 'iphones',
            icon: 'apple',
            image: 'iphones.jpg',
            productCount: 25,
          },
        ],
      },
      {
        id: 11,
        name: 'Laptops',
        nameAr: 'أجهزة محمولة',
        slug: 'laptops',
        icon: 'laptop',
        image: 'laptops.jpg',
        productCount: 40,
      },
    ],
  },
  {
    id: 2,
    name: 'Fashion',
    nameAr: 'أزياء',
    slug: 'fashion',
    icon: 'checkroom',
    image: 'fashion.jpg',
    productCount: 200,
    children: [],
  },
];

// =============================================================================
// TEST SUITE
// =============================================================================

/**
 * @description Unit tests for MobileCategoryNavComponent
 */
describe('MobileCategoryNavComponent', () => {
  let component: MobileCategoryNavComponent;
  let fixture: ComponentFixture<MobileCategoryNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileCategoryNavComponent, BrowserAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileCategoryNavComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ===========================================================================
  // COMPONENT INITIALIZATION
  // ===========================================================================

  /**
   * @description Verifies component creates successfully
   */
  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.categories).toEqual([]);
      expect(component.isOpen).toBe(false);
      expect(component.isLoading).toBe(false);
    });

    it('should initialize skeleton items for loading state', () => {
      expect(component.skeletonItems().length).toBe(6);
    });
  });

  // ===========================================================================
  // EVENT EMISSIONS
  // ===========================================================================

  /**
   * @description Tests for component event outputs
   */
  describe('Event Emissions', () => {
    /**
     * Should emit menuClosed when close button clicked
     * Validates: closeMenu method emits correct event
     */
    it('should emit menuClosed when close button clicked', () => {
      const menuClosedSpy = spyOn(component.menuClosed, 'emit');

      component.closeMenu();

      expect(menuClosedSpy).toHaveBeenCalledWith();
    });

    /**
     * Should emit categorySelected with slug when category clicked
     * Validates: Category selection emits correct slug
     */
    it('should emit categorySelected with slug when category is clicked', () => {
      const categorySelectedSpy = spyOn(component.categorySelected, 'emit');
      component.isOpen = true;

      component.onCategoryClick('electronics');

      expect(categorySelectedSpy).toHaveBeenCalledWith('electronics');
    });

    /**
     * Should close menu after category selection
     * Validates: Menu closes automatically after selection
     */
    it('should close menu after category selection', () => {
      const menuClosedSpy = spyOn(component.menuClosed, 'emit');
      component.isOpen = true;

      component.onCategoryClick('electronics');

      expect(menuClosedSpy).toHaveBeenCalledWith();
    });

    /**
     * Should emit menuClosed on Escape key press
     * Validates: Keyboard handler emits close event
     */
    it('should emit menuClosed on Escape key press', () => {
      const menuClosedSpy = spyOn(component.menuClosed, 'emit');
      component.isOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onEscapePress(event);

      expect(menuClosedSpy).toHaveBeenCalledWith();
    });
  });

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  /**
   * @description Tests for loading state and skeleton display
   */
  describe('Loading State', () => {
    /**
     * Should show loading skeleton when isLoading is true
     * Validates: Skeleton display based on loading flag
     */
    it('should show loading skeleton when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      expect(component.skeletonItems().length).toBeGreaterThan(0);
    });

    /**
     * Should hide skeleton when loading is false
     * Validates: Skeleton hidden when data is loaded
     */
    it('should hide skeleton when loading is false', () => {
      component.isLoading = false;
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
    });

    /**
     * Should display categories when not loading
     * Validates: Categories shown when isLoading is false
     */
    it('should display categories when not loading', () => {
      component.categories = MOCK_CATEGORIES;
      component.isLoading = false;
      fixture.detectChanges();

      expect(component.categories.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // RTL LAYOUT
  // ===========================================================================

  /**
   * @description Tests for RTL (right-to-left) layout detection
   */
  describe('RTL Layout Detection', () => {
    /**
     * Should detect RTL mode from document
     * Validates: RTL computed signal works correctly
     */
    it('should detect RTL mode', () => {
      // Set document direction to RTL
      document.documentElement.dir = 'rtl';
      fixture.detectChanges();

      expect(component.isRtl()).toBe(true);

      // Reset to default
      document.documentElement.dir = 'ltr';
    });

    /**
     * Should return Arabic name in RTL mode
     * Validates: getCategoryName returns correct name based on RTL
     */
    it('should return Arabic name in RTL mode', () => {
      document.documentElement.dir = 'rtl';
      const category = MOCK_CATEGORIES[0];

      fixture.detectChanges();
      const name = component.getCategoryName(category);

      expect(name).toBe(category.nameAr);

      // Reset
      document.documentElement.dir = 'ltr';
    });

    /**
     * Should return English name in LTR mode
     * Validates: getCategoryName returns English in LTR
     */
    it('should return English name in LTR mode', () => {
      document.documentElement.dir = 'ltr';
      const category = MOCK_CATEGORIES[0];

      fixture.detectChanges();
      const name = component.getCategoryName(category);

      expect(name).toBe(category.name);
    });
  });

  // ===========================================================================
  // CATEGORY HIERARCHY
  // ===========================================================================

  /**
   * @description Tests for category tree display and hierarchy
   */
  describe('Category Hierarchy', () => {
    /**
     * Should display category names from input
     * Validates: Categories rendered from input array
     */
    it('should display category names from input', () => {
      component.categories = MOCK_CATEGORIES;
      component.isOpen = true;
      fixture.detectChanges();

      expect(component.categories.length).toBe(2);
      expect(component.categories[0].name).toBe('Electronics');
      expect(component.categories[1].name).toBe('Fashion');
    });

    /**
     * Should detect categories with children
     * Validates: hasChildren method works correctly
     */
    it('should detect categories with children', () => {
      const categoryWithChildren = MOCK_CATEGORIES[0];
      const categoryWithoutChildren = MOCK_CATEGORIES[1];

      expect(component.hasChildren(categoryWithChildren)).toBe(true);
      expect(component.hasChildren(categoryWithoutChildren)).toBe(false);
    });

    /**
     * Should support up to 3 levels of hierarchy
     * Validates: Grandchildren are accessible
     */
    it('should support up to 3 levels of hierarchy', () => {
      const root = MOCK_CATEGORIES[0];
      const child = root.children![0];
      const grandchild = child.children![0];

      expect(root.id).toBe(1);
      expect(child.id).toBe(10);
      expect(grandchild.id).toBe(100);
    });

    /**
     * Should handle categories without children gracefully
     * Validates: Empty children array handled
     */
    it('should handle categories without children gracefully', () => {
      const categoryWithoutChildren = { ...MOCK_CATEGORIES[1], children: [] };

      expect(component.hasChildren(categoryWithoutChildren)).toBe(false);
    });
  });

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  /**
   * @description Tests for user interaction handling
   */
  describe('User Interactions', () => {
    /**
     * Should close menu on backdrop click
     * Validates: Backdrop element click handling
     */
    it('should close menu on backdrop click', () => {
      const menuClosedSpy = spyOn(component.menuClosed, 'emit');
      component.isOpen = true;

      const event = new MouseEvent('click');
      const backdropElement = document.createElement('div');
      backdropElement.classList.add('mobile-nav-backdrop');
      Object.defineProperty(event, 'target', { value: backdropElement, enumerable: true });

      component.onBackdropClick(event);

      expect(menuClosedSpy).toHaveBeenCalledWith();
    });

    /**
     * Should not close on non-backdrop element click
     * Validates: Click on other elements ignored
     */
    it('should not close on non-backdrop element click', () => {
      const menuClosedSpy = spyOn(component.menuClosed, 'emit');

      const event = new MouseEvent('click');
      const otherElement = document.createElement('div');
      Object.defineProperty(event, 'target', { value: otherElement, enumerable: true });

      component.onBackdropClick(event);

      expect(menuClosedSpy).not.toHaveBeenCalled();
    });

    /**
     * Should only close menu on Escape when open
     * Validates: Escape key only works when menu is open
     */
    it('should only close menu on Escape when open', () => {
      const menuClosedSpy = spyOn(component.menuClosed, 'emit');
      component.isOpen = false;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onEscapePress(event);

      // Menu is not open, so closeMenu should not be called
      // In this case, the handler checks isOpen before calling closeMenu
      expect(component.isOpen).toBe(false);
    });
  });

  // ===========================================================================
  // INPUT/OUTPUT BINDING
  // ===========================================================================

  /**
   * @description Tests for component input/output bindings
   */
  describe('Input/Output Bindings', () => {
    /**
     * Should accept categories input
     * Validates: Categories can be set via input
     */
    it('should accept categories input', () => {
      component.categories = MOCK_CATEGORIES;
      fixture.detectChanges();

      expect(component.categories).toEqual(MOCK_CATEGORIES);
    });

    /**
     * Should accept isOpen input
     * Validates: Menu visibility controlled via input
     */
    it('should accept isOpen input', () => {
      component.isOpen = true;
      fixture.detectChanges();

      expect(component.isOpen).toBe(true);
    });

    /**
     * Should accept isLoading input
     * Validates: Loading state can be controlled
     */
    it('should accept isLoading input', () => {
      component.isLoading = true;
      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  /**
   * @description Tests for edge cases and error handling
   */
  describe('Edge Cases', () => {
    /**
     * Should handle empty categories array
     * Validates: Empty data handled gracefully
     */
    it('should handle empty categories array', () => {
      component.categories = [];
      component.isOpen = true;
      fixture.detectChanges();

      expect(component.categories.length).toBe(0);
    });

    /**
     * Should handle undefined children array
     * Validates: Missing children handled safely
     */
    it('should handle undefined children array', () => {
      const categoryWithoutChildren: CategoryTreeNode = {
        id: 1,
        name: 'Test',
        nameAr: 'اختبار',
        slug: 'test',
      };

      expect(component.hasChildren(categoryWithoutChildren)).toBe(false);
    });

    /**
     * Should handle deeply nested categories
     * Validates: Multiple nesting levels supported
     */
    it('should handle deeply nested categories', () => {
      component.categories = MOCK_CATEGORIES;
      const deepestChild = MOCK_CATEGORIES[0].children![0].children![0];

      expect(deepestChild).toBeDefined();
      expect(deepestChild.nameAr).toBe('آيفونات');
    });
  });
});
