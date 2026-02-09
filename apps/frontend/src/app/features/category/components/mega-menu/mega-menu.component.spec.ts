/**
 * @file mega-menu.component.spec.ts
 * @description Unit tests for the MegaMenuComponent
 *
 * TEST COVERAGE:
 * - Component creation and initialization
 * - Desktop hover behavior with subcategory display
 * - Mobile accordion drill-down navigation
 * - Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
 * - RTL (Arabic) layout support
 * - Event emission (categorySelected, menuClosed)
 * - Category stack management for mobile back navigation
 *
 * @author SouqSyria Development Team
 * @since 2026-02-07
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { MegaMenuComponent } from './mega-menu.component';
import { CategoryTreeNode } from '../../models/category-tree.interface';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

/** Mock category tree nodes representing Syrian marketplace categories */
const MOCK_CATEGORIES: CategoryTreeNode[] = [
  {
    id: 1,
    name: 'Electronics',
    nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
    slug: 'electronics',
    icon: 'devices',
    image: 'electronics.jpg',
    children: [
      {
        id: 10,
        name: 'Mobile Phones',
        nameAr: '\u0647\u0648\u0627\u062A\u0641 \u0645\u062D\u0645\u0648\u0644\u0629',
        slug: 'mobile-phones',
        icon: 'smartphone',
        image: 'phones.jpg',
        children: [
          {
            id: 100,
            name: 'iPhone',
            nameAr: '\u0622\u064A\u0641\u0648\u0646',
            slug: 'iphone',
            icon: 'phone_iphone',
            image: 'iphone.jpg',
            children: [],
          },
        ],
      },
      {
        id: 11,
        name: 'Laptops',
        nameAr: '\u062D\u0648\u0627\u0633\u064A\u0628 \u0645\u062D\u0645\u0648\u0644\u0629',
        slug: 'laptops',
        icon: 'laptop',
        image: 'laptops.jpg',
        children: [],
      },
    ],
  },
  {
    id: 2,
    name: 'Fashion',
    nameAr: '\u0623\u0632\u064A\u0627\u0621',
    slug: 'fashion',
    icon: 'checkroom',
    image: 'fashion.jpg',
    children: [],
  },
];

/** Category with no children for leaf-node testing */
const LEAF_CATEGORY: CategoryTreeNode = {
  id: 3,
  name: 'Books',
  nameAr: '\u0643\u062A\u0628',
  slug: 'books',
  icon: 'book',
  image: 'books.jpg',
  children: [],
};

// =============================================================================
// TEST SUITE
// =============================================================================

/** @description Comprehensive tests for the MegaMenuComponent */
describe('MegaMenuComponent', () => {
  let component: MegaMenuComponent;
  let fixture: ComponentFixture<MegaMenuComponent>;
  let compiled: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MegaMenuComponent,
        RouterTestingModule.withRoutes([]),
        NoopAnimationsModule,
        MatIconModule,
      ],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MegaMenuComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    compiled = fixture.nativeElement as HTMLElement;

    // Default test inputs
    component.categories = MOCK_CATEGORIES;
    component.isOpen = true;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ===========================================================================
  // COMPONENT CREATION
  // ===========================================================================

  /** @description Basic component instantiation tests */
  describe('Component Creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  /** @description Tests for template rendering behavior */
  describe('Rendering', () => {
    /**
     * Should render category list when isOpen=true and categories provided
     * Validates: Menu overlay is visible with category buttons
     */
    it('should render category list when isOpen=true and categories provided', () => {
      fixture.detectChanges();

      const overlay = compiled.querySelector('.mega-menu-overlay');
      expect(overlay).toBeTruthy();
    });

    /**
     * Should not render when isOpen=false
     * Validates: Menu overlay is hidden when closed
     */
    it('should not render when isOpen=false', () => {
      component.isOpen = false;
      fixture.detectChanges();

      const overlay = compiled.querySelector('.mega-menu-overlay');
      expect(overlay).toBeNull();
    });
  });

  // ===========================================================================
  // DESKTOP HOVER BEHAVIOR
  // ===========================================================================

  /** @description Tests for desktop hover-based category navigation */
  describe('Desktop Hover Behavior', () => {
    beforeEach(() => {
      // Ensure desktop mode
      component.isMobile.set(false);
      fixture.detectChanges();
    });

    /**
     * Should call onCategoryHover when mouse enters category (desktop)
     * Validates: Hover sets the activeCategory signal
     */
    it('should call onCategoryHover when mouse enters category (desktop)', () => {
      const electronicsCategory = MOCK_CATEGORIES[0];
      component.onCategoryHover(electronicsCategory);

      expect(component.activeCategory()).toBe(electronicsCategory);
    });

    /**
     * Should show subcategories for active hovered category
     * Validates: Subcategory panel appears for categories with children
     */
    it('should show subcategories for active hovered category', () => {
      const electronicsCategory = MOCK_CATEGORIES[0];
      component.onCategoryHover(electronicsCategory);
      fixture.detectChanges();

      const subcategoriesPanel = compiled.querySelector('.subcategories-panel');
      expect(subcategoriesPanel).toBeTruthy();
    });

    /**
     * Should not set activeCategory on hover when in mobile mode
     * Validates: Hover is disabled in mobile view
     */
    it('should not set activeCategory on hover when in mobile mode', () => {
      component.isMobile.set(true);
      component.onCategoryHover(MOCK_CATEGORIES[0]);

      expect(component.activeCategory()).toBeNull();
    });
  });

  // ===========================================================================
  // KEYBOARD NAVIGATION
  // ===========================================================================

  /** @description Tests for keyboard accessibility navigation */
  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      component.isMobile.set(false);
      fixture.detectChanges();
    });

    /**
     * Should close menu on Escape key press
     * Validates: Escape keydown triggers close()
     */
    it('should close menu on Escape key press', () => {
      const closeSpy = spyOn(component, 'close');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      component.handleEscapeKey(event);

      expect(closeSpy).toHaveBeenCalled();
    });

    /**
     * Should navigate with arrow keys (ArrowDown increments focusedCategoryIndex)
     * Validates: ArrowDown increases the focused index
     */
    it('should navigate with arrow keys (ArrowDown increments focusedCategoryIndex)', () => {
      component.focusedCategoryIndex.set(0);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      component.handleKeyboardNav(event);

      expect(component.focusedCategoryIndex()).toBe(1);
    });

    /**
     * Should navigate with arrow keys (ArrowUp decrements focusedCategoryIndex)
     * Validates: ArrowUp decreases the focused index
     */
    it('should navigate with arrow keys (ArrowUp decrements focusedCategoryIndex)', () => {
      component.focusedCategoryIndex.set(1);

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      component.handleKeyboardNav(event);

      expect(component.focusedCategoryIndex()).toBe(0);
    });

    /**
     * Should not go below 0 when pressing ArrowUp at first item
     * Validates: Lower bound of keyboard navigation
     */
    it('should not go below 0 when pressing ArrowUp at first item', () => {
      component.focusedCategoryIndex.set(0);

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      component.handleKeyboardNav(event);

      expect(component.focusedCategoryIndex()).toBe(0);
    });

    /**
     * Should not exceed category count when pressing ArrowDown at last item
     * Validates: Upper bound of keyboard navigation
     */
    it('should not exceed category count when pressing ArrowDown at last item', () => {
      const lastIndex = component.displayCategories().length - 1;
      component.focusedCategoryIndex.set(lastIndex);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      component.handleKeyboardNav(event);

      expect(component.focusedCategoryIndex()).toBe(lastIndex);
    });

    /**
     * Should select category on Enter key
     * Validates: Enter triggers onCategoryClick on focused category
     */
    it('should select category on Enter key', () => {
      const clickSpy = spyOn(component, 'onCategoryClick');
      component.focusedCategoryIndex.set(0);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      component.handleKeyboardNav(event);

      expect(clickSpy).toHaveBeenCalledWith(MOCK_CATEGORIES[0]);
    });

    /**
     * Should not process keyboard events when menu is closed
     * Validates: Keyboard handler early-exits when isOpen=false
     */
    it('should not process keyboard events when menu is closed', () => {
      component.isOpen = false;
      component.focusedCategoryIndex.set(0);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      component.handleKeyboardNav(event);

      expect(component.focusedCategoryIndex()).toBe(0);
    });
  });

  // ===========================================================================
  // EVENT EMISSION
  // ===========================================================================

  /** @description Tests for output event emissions */
  describe('Event Emission', () => {
    /**
     * Should emit categorySelected when navigateToCategory is called
     * Validates: Output emitter fires with correct slug
     */
    it('should emit categorySelected when navigateToCategory is called', () => {
      const emitSpy = spyOn(component.categorySelected, 'emit');
      const routerSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

      component.navigateToCategory('electronics');

      expect(emitSpy).toHaveBeenCalledWith('electronics');
    });

    /**
     * Should emit menuClosed when close() is called
     * Validates: Output emitter fires when menu closes
     */
    it('should emit menuClosed when close() is called', () => {
      const emitSpy = spyOn(component.menuClosed, 'emit');

      component.close();

      expect(emitSpy).toHaveBeenCalled();
    });

    /**
     * Should reset all state when close() is called
     * Validates: Close resets activeCategory, categoryStack, etc.
     */
    it('should reset all state when close() is called', () => {
      component.activeCategory.set(MOCK_CATEGORIES[0]);
      component.categoryStack.set([MOCK_CATEGORIES[0]]);
      component.currentMobileCategory.set(MOCK_CATEGORIES[0]);
      component.focusedCategoryIndex.set(2);

      component.close();

      expect(component.activeCategory()).toBeNull();
      expect(component.categoryStack()).toEqual([]);
      expect(component.currentMobileCategory()).toBeNull();
      expect(component.focusedCategoryIndex()).toBe(0);
    });
  });

  // ===========================================================================
  // MOBILE NAVIGATION
  // ===========================================================================

  /** @description Tests for mobile accordion-style drill-down navigation */
  describe('Mobile Navigation', () => {
    beforeEach(() => {
      component.isMobile.set(true);
      fixture.detectChanges();
    });

    /**
     * Should show mobile accordion when isMobile=true
     * Validates: Mobile container renders on small screens
     */
    it('should show mobile accordion when isMobile=true', () => {
      const mobileMenu = compiled.querySelector('.mobile-menu-container');
      expect(mobileMenu).toBeTruthy();
    });

    /**
     * Should push to categoryStack on mobile category click with children
     * Validates: Drill-down pushes parent onto navigation stack
     */
    it('should push to categoryStack on mobile category click with children', () => {
      const electronicsCategory = MOCK_CATEGORIES[0]; // Has children

      component.onCategoryClick(electronicsCategory);

      expect(component.categoryStack()).toHaveSize(1);
      expect(component.categoryStack()[0]).toBe(electronicsCategory);
      expect(component.currentMobileCategory()).toBe(electronicsCategory);
    });

    /**
     * Should navigate directly on mobile category click without children
     * Validates: Leaf categories trigger navigation instead of drill-down
     */
    it('should navigate directly on mobile category click without children', () => {
      const navigateSpy = spyOn(component, 'navigateToCategory');
      const fashionCategory = MOCK_CATEGORIES[1]; // No children

      component.onCategoryClick(fashionCategory);

      expect(navigateSpy).toHaveBeenCalledWith('fashion');
      expect(component.categoryStack()).toHaveSize(0);
    });

    /**
     * Should go back in category stack when goBack() called
     * Validates: Back button pops the last item from the stack
     */
    it('should go back in category stack when goBack() called', () => {
      const electronicsCategory = MOCK_CATEGORIES[0];
      const mobilePhonesCategory = MOCK_CATEGORIES[0].children[0];

      // Simulate drill-down: Electronics > Mobile Phones
      component.onCategoryClick(electronicsCategory);
      component.onCategoryClick(mobilePhonesCategory);

      expect(component.categoryStack()).toHaveSize(2);

      // Go back to Electronics
      component.goBack();

      expect(component.categoryStack()).toHaveSize(1);
      expect(component.currentMobileCategory()).toBe(electronicsCategory);
    });

    /**
     * Should reset to root level when goBack() empties stack
     * Validates: Going back from first-level returns to root categories
     */
    it('should reset to root level when goBack() empties stack', () => {
      const electronicsCategory = MOCK_CATEGORIES[0];

      component.onCategoryClick(electronicsCategory);
      expect(component.categoryStack()).toHaveSize(1);

      component.goBack();

      expect(component.categoryStack()).toHaveSize(0);
      expect(component.currentMobileCategory()).toBeNull();
    });
  });

  // ===========================================================================
  // DESKTOP CLICK BEHAVIOR
  // ===========================================================================

  /** @description Tests for desktop click navigation */
  describe('Desktop Click Behavior', () => {
    beforeEach(() => {
      component.isMobile.set(false);
      fixture.detectChanges();
    });

    /**
     * Should navigate to category on desktop click regardless of children
     * Validates: Desktop always navigates on click (hover shows children)
     */
    it('should navigate to category on desktop click regardless of children', () => {
      const navigateSpy = spyOn(component, 'navigateToCategory');

      component.onCategoryClick(MOCK_CATEGORIES[0]); // Has children

      expect(navigateSpy).toHaveBeenCalledWith('electronics');
    });
  });

  // ===========================================================================
  // RTL SUPPORT
  // ===========================================================================

  /** @description Tests for RTL (right-to-left) layout support */
  describe('RTL Support', () => {
    /**
     * Should display RTL names when isRtl=true
     * Validates: getCategoryName returns Arabic name in RTL mode
     */
    it('should display RTL names when isRtl=true', () => {
      component.isRtl.set(true);

      const name = component.getCategoryName(MOCK_CATEGORIES[0]);

      expect(name).toBe('\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A');
    });

    /**
     * Should display English names when isRtl=false
     * Validates: getCategoryName returns English name in LTR mode
     */
    it('should display English names when isRtl=false', () => {
      component.isRtl.set(false);

      const name = component.getCategoryName(MOCK_CATEGORIES[0]);

      expect(name).toBe('Electronics');
    });
  });

  // ===========================================================================
  // IMAGE ERROR HANDLING
  // ===========================================================================

  /** @description Tests for image fallback on load errors */
  describe('Image Error Handling', () => {
    /**
     * Should set placeholder image on error
     * Validates: onImageError replaces broken src with placeholder
     */
    it('should set placeholder image on error', () => {
      const mockImg = { src: 'broken.jpg' } as HTMLImageElement;
      const mockEvent = { target: mockImg } as unknown as Event;

      component.onImageError(mockEvent);

      expect(mockImg.src).toBe('/assets/images/placeholder-category.png');
    });
  });

  // ===========================================================================
  // COMPUTED PROPERTIES
  // ===========================================================================

  /** @description Tests for computed signal displayCategories */
  describe('Computed Properties', () => {
    /**
     * Should return root categories in desktop mode
     * Validates: displayCategories returns top-level categories
     */
    it('should return root categories in desktop mode', () => {
      component.isMobile.set(false);
      component.currentMobileCategory.set(null);

      expect(component.displayCategories()).toBe(MOCK_CATEGORIES);
    });

    /**
     * Should return children of current mobile category
     * Validates: displayCategories returns drilled-down children
     */
    it('should return children of current mobile category', () => {
      component.isMobile.set(true);
      component.currentMobileCategory.set(MOCK_CATEGORIES[0]);

      const displayed = component.displayCategories();
      expect(displayed).toEqual(MOCK_CATEGORIES[0].children);
    });
  });
});
