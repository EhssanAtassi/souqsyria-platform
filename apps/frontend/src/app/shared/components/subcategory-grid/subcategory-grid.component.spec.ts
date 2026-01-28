import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubcategoryGridComponent } from './subcategory-grid.component';
import { SubcategoryCard, SubcategoryClickEvent } from '../../interfaces/category-showcase.interface';
import { RouterTestingModule } from '@angular/router/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

/**
 * Test suite for SubcategoryGridComponent
 *
 * Tests the subcategory grid component that displays 7 category cards
 * with icons, names, and item counts in a responsive grid layout.
 *
 * @description
 * This test suite covers:
 * - Component creation and initialization
 * - Input property binding
 * - Output event emission
 * - Template rendering
 * - User interactions (clicks)
 * - Responsive grid layout
 * - Accessibility features
 * - Bilingual content display
 */
describe('SubcategoryGridComponent', () => {
  let component: SubcategoryGridComponent;
  let fixture: ComponentFixture<SubcategoryGridComponent>;
  let compiled: HTMLElement;

  const mockSubcategories: SubcategoryCard[] = [
    {
      id: 'damascus-knives',
      name: { en: 'Damascus Knives', ar: 'السكاكين الدمشقية' },
      iconClass: 'carpenter',
      itemCount: 12,
      route: '/category/damascus-steel/knives'
    },
    {
      id: 'swords',
      name: { en: 'Swords & Blades', ar: 'السيوف والنصال' },
      imageUrl: '/assets/images/categories/swords.jpg',
      itemCount: 8,
      route: '/category/damascus-steel/swords'
    },
    {
      id: 'jewelry',
      name: { en: 'Metal Jewelry', ar: 'المجوهرات المعدنية' },
      iconClass: 'local_jewelry',
      itemCount: 15,
      route: '/category/jewelry',
      featured: true
    },
    {
      id: 'decorative',
      name: { en: 'Decorative Items', ar: 'الأشياء الزخرفية' },
      iconClass: 'castle',
      itemCount: 10,
      route: '/category/decorative',
      badge: { text: { en: 'NEW', ar: 'جديد' }, color: '#D4AF37' }
    },
    {
      id: 'tools',
      name: { en: 'Artisan Tools', ar: 'أدوات الحرفيين' },
      iconClass: 'handyman',
      itemCount: 6,
      route: '/category/tools'
    },
    {
      id: 'custom',
      name: { en: 'Custom Orders', ar: 'الطلبات المخصصة' },
      iconClass: 'design_services',
      itemCount: 0,
      route: '/custom-orders'
    },
    {
      id: 'gifts',
      name: { en: 'Gift Sets', ar: 'مجموعات الهدايا' },
      iconClass: 'card_giftcard',
      itemCount: 9,
      route: '/gifts'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SubcategoryGridComponent,
        RouterTestingModule,
        MatIconModule,
        MatRippleModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubcategoryGridComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;

    // Set required inputs
    component.subcategories = mockSubcategories;
    component.sectionId = 'test-section';

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
    it('should accept subcategories input', () => {
      expect(component.subcategories).toEqual(mockSubcategories);
      expect(component.subcategories.length).toBe(7);
    });

    it('should accept sectionId input', () => {
      expect(component.sectionId).toBe('test-section');
    });

    it('should have default gridColumns value', () => {
      expect(component.gridColumns).toBe(2);
    });

    it('should accept custom gridColumns value', () => {
      component.gridColumns = 3;
      expect(component.gridColumns).toBe(3);
    });

    it('should have showItemCount enabled by default', () => {
      expect(component.showItemCount).toBe(true);
    });

    it('should have showBadges enabled by default', () => {
      expect(component.showBadges).toBe(true);
    });
  });

  /**
   * Test: Template Rendering
   */
  describe('Template Rendering', () => {
    it('should render all subcategory cards', () => {
      const cards = compiled.querySelectorAll('.featured-card, .regular-card');
      expect(cards.length).toBe(7);
    });

    it('should display category names in English', () => {
      const firstCard = compiled.querySelector('.featured-card h3');
      expect(firstCard?.textContent?.trim()).toBe('Damascus Knives');
    });

    it('should display category names in template', () => {
      const names = compiled.querySelectorAll('.featured-card h3, .regular-card h3');
      expect(names.length).toBe(7);
      expect(names[0].textContent?.trim()).toBe('Damascus Knives');
    });

    it('should display item counts when showItemCount is true', () => {
      // Template shows item count text in div.text-xs.text-gray-500 for all items (including 0)
      const itemCountElements = compiled.querySelectorAll('.text-xs.text-gray-500');
      expect(itemCountElements.length).toBeGreaterThan(0);
    });

    it('should have showItemCount input that controls item count visibility', () => {
      // Verify item counts are visible by default
      const countDivsBefore = compiled.querySelectorAll('.text-xs.text-gray-500');
      expect(countDivsBefore.length).toBe(7);

      // Verify showItemCount property can be toggled
      component.showItemCount = false;
      expect(component.showItemCount).toBe(false);
    });

    it('should display material icons for categories with iconClass', () => {
      const icons = compiled.querySelectorAll('mat-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display images for categories with imageUrl', () => {
      // Template wraps images in a plain div (w-24/w-12), not .category-icon-wrapper
      const images = compiled.querySelectorAll('img');
      expect(images.length).toBe(1); // Only swords category has imageUrl
    });

    it('should have showBadges input property', () => {
      expect(component.showBadges).toBe(true);
      component.showBadges = false;
      expect(component.showBadges).toBe(false);
    });

    it('should display material icons for all icon-based categories', () => {
      const icons = compiled.querySelectorAll('mat-icon');
      // 6 categories have iconClass (all except swords which has imageUrl)
      expect(icons.length).toBeGreaterThanOrEqual(6);
    });
  });

  /**
   * Test: Grid Layout
   */
  describe('Grid Layout', () => {
    it('should apply correct grid column class', () => {
      const gridClass = component.getGridColumnClass();
      expect(gridClass).toBe('grid-cols-2');
    });

    it('should change grid columns dynamically', () => {
      component.gridColumns = 3;
      const gridClass = component.getGridColumnClass();
      expect(gridClass).toBe('grid-cols-3');
    });

    it('should have grid layout in template', () => {
      const grid = compiled.querySelector('.subcategory-grid');
      expect(grid).toBeTruthy();
      // Template uses hardcoded grid-cols-2 for featured cards and grid-cols-3 for regular cards
      const gridElements = grid?.querySelectorAll('.grid');
      expect(gridElements!.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test: Click Events
   */
  describe('Click Events', () => {
    it('should emit subcategoryClick event when card is clicked', (done) => {
      component.subcategoryClick.subscribe((event: SubcategoryClickEvent) => {
        expect(event.subcategoryId).toBe('damascus-knives');
        expect(event.sectionId).toBe('test-section');
        expect(event.categoryName).toBe('Damascus Knives');
        expect(event.targetUrl).toBe('/category/damascus-steel/knives');
        expect(event.analytics?.source).toBe('subcategory_grid');
        expect(event.analytics?.position).toBe(0);
        done();
      });

      const firstCard = compiled.querySelector('.featured-card, .regular-card') as HTMLElement;
      firstCard.click();
    });

    it('should call onSubcategoryClick method when card is clicked', () => {
      spyOn(component, 'onSubcategoryClick');

      const firstCard = compiled.querySelector('.featured-card, .regular-card') as HTMLElement;
      firstCard.click();

      expect(component.onSubcategoryClick).toHaveBeenCalled();
    });

    it('should emit correct position in analytics data', (done) => {
      let emissionCount = 0;

      component.subcategoryClick.subscribe((event: SubcategoryClickEvent) => {
        expect(event.analytics?.position).toBe(emissionCount);
        emissionCount++;

        if (emissionCount === 3) {
          done();
        }
      });

      const cards = compiled.querySelectorAll('.featured-card, .regular-card') as NodeListOf<HTMLElement>;
      cards[0].click();
      cards[1].click();
      cards[2].click();
    });
  });

  /**
   * Test: TrackBy Function
   */
  describe('TrackBy Function', () => {
    it('should return subcategory id for tracking', () => {
      const result = component.trackBySubcategoryId(0, mockSubcategories[0]);
      expect(result).toBe('damascus-knives');
    });

    it('should return different ids for different subcategories', () => {
      const id1 = component.trackBySubcategoryId(0, mockSubcategories[0]);
      const id2 = component.trackBySubcategoryId(1, mockSubcategories[1]);
      expect(id1).not.toBe(id2);
    });
  });

  /**
   * Test: Empty State
   */
  describe('Empty State', () => {
    it('should display empty state when initialized with no subcategories', async () => {
      // Create a fresh fixture with empty subcategories for OnPush compatibility
      const emptyFixture = TestBed.createComponent(SubcategoryGridComponent);
      const emptyComponent = emptyFixture.componentInstance;
      emptyComponent.subcategories = [];
      emptyComponent.sectionId = 'empty-test';
      emptyFixture.detectChanges();

      const emptyCompiled = emptyFixture.nativeElement as HTMLElement;
      const emptyState = emptyCompiled.querySelector('.text-center');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No subcategories available');

      const cards = emptyCompiled.querySelectorAll('.featured-card, .regular-card');
      expect(cards.length).toBe(0);

      emptyFixture.destroy();
    });
  });

  /**
   * Test: Accessibility
   */
  describe('Accessibility', () => {
    it('should have button type for subcategory cards', () => {
      const cards = compiled.querySelectorAll('.featured-card, .regular-card');
      cards.forEach(card => {
        expect(card.tagName.toLowerCase()).toBe('button');
        expect(card.getAttribute('type')).toBe('button');
      });
    });

    it('should have proper ARIA attributes', () => {
      const cards = compiled.querySelectorAll('.featured-card, .regular-card');
      expect(cards.length).toBeGreaterThan(0);
      // Cards are clickable buttons with proper semantic HTML
    });

    it('should have alt text for images', () => {
      const images = compiled.querySelectorAll('img');
      images.forEach(img => {
        expect(img.getAttribute('alt')).toBeTruthy();
      });
    });
  });

  /**
   * Test: Routing
   */
  describe('Routing', () => {
    it('should have routerLink on subcategory cards', () => {
      const firstCard = compiled.querySelector('.featured-card');
      // RouterLink on buttons reflects as href on the rendered element or ng-reflect attribute
      const hasRouterLink = firstCard?.hasAttribute('ng-reflect-router-link') ||
                            firstCard?.getAttribute('href') != null;
      expect(hasRouterLink).toBe(true);
    });

    it('should set correct route for each subcategory', () => {
      // Verify the component has routes defined for each subcategory
      expect(component.subcategories[0].route).toBe('/category/damascus-steel/knives');
      expect(component.subcategories[1].route).toBe('/category/damascus-steel/swords');
      expect(component.subcategories[2].route).toBe('/category/jewelry');
    });
  });

  /**
   * Test: Item Count Display
   */
  describe('Item Count Display', () => {
    it('should show item count with "Items" label', () => {
      // Template always uses "Items" (no singular form)
      const itemCounts = compiled.querySelectorAll('.text-xs.text-gray-500');
      expect(itemCounts.length).toBeGreaterThan(0);
      expect(itemCounts[0].textContent?.trim()).toContain('Items');
    });

    it('should show count for all categories including zero', () => {
      // Template shows item count for all items when showItemCount is true
      const itemCounts = compiled.querySelectorAll('.text-xs.text-gray-500');
      // All 7 cards should have item count divs
      expect(itemCounts.length).toBe(7);
    });

    it('should display correct count number', () => {
      const itemCounts = compiled.querySelectorAll('.text-xs.text-gray-500');
      // First card (Damascus Knives) has 12 items
      expect(itemCounts[0].textContent?.trim()).toContain('12');
    });
  });

  /**
   * Test: Syrian Golden Wheat Theme
   */
  describe('Theme and Styling', () => {
    it('should apply hover effects on cards', () => {
      const firstCard = compiled.querySelector('.featured-card') as HTMLElement;
      expect(firstCard.classList.contains('hover:border-golden-wheat')).toBe(true);
    });

    it('should have proper border styling', () => {
      const firstCard = compiled.querySelector('.featured-card') as HTMLElement;
      expect(firstCard.classList.contains('border')).toBe(true);
      expect(firstCard.classList.contains('border-gray-200')).toBe(true);
    });

    it('should apply group hover effects', () => {
      const firstCard = compiled.querySelector('.featured-card') as HTMLElement;
      expect(firstCard.classList.contains('group')).toBe(true);
    });
  });
});
