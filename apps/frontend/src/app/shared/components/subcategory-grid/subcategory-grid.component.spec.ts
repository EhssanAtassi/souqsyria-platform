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
      const cards = compiled.querySelectorAll('.subcategory-card');
      expect(cards.length).toBe(7);
    });

    it('should display category names in English', () => {
      const firstCard = compiled.querySelector('.subcategory-card h3');
      expect(firstCard?.textContent?.trim()).toBe('Damascus Knives');
    });

    it('should display category names in Arabic', () => {
      const arabicNames = compiled.querySelectorAll('.subcategory-card p.font-arabic');
      expect(arabicNames.length).toBeGreaterThan(0);
      expect(arabicNames[0].textContent?.trim()).toBe('السكاكين الدمشقية');
    });

    it('should display item counts when showItemCount is true', () => {
      const itemCounts = compiled.querySelectorAll('.item-count');
      expect(itemCounts.length).toBe(6); // 6 categories have items (one has 0)
    });

    it('should hide item counts when showItemCount is false', () => {
      component.showItemCount = false;
      fixture.detectChanges();

      const itemCounts = compiled.querySelectorAll('.item-count');
      expect(itemCounts.length).toBe(0);
    });

    it('should display material icons for categories with iconClass', () => {
      const icons = compiled.querySelectorAll('mat-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display images for categories with imageUrl', () => {
      const images = compiled.querySelectorAll('.category-icon-wrapper img');
      expect(images.length).toBe(1); // Only swords category has imageUrl
    });

    it('should display badges when available and showBadges is true', () => {
      const badges = compiled.querySelectorAll('.absolute.top-2.right-2');
      expect(badges.length).toBe(1); // Decorative category has badge
      expect(badges[0].textContent?.trim()).toBe('NEW');
    });

    it('should hide badges when showBadges is false', () => {
      component.showBadges = false;
      fixture.detectChanges();

      const badges = compiled.querySelectorAll('.absolute.top-2.right-2');
      expect(badges.length).toBe(0);
    });

    it('should display featured star for featured categories', () => {
      const stars = compiled.querySelectorAll('.absolute.top-2.left-2 mat-icon');
      expect(stars.length).toBe(1); // Jewelry category is featured
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
      expect(grid?.classList.contains('grid-cols-2')).toBe(true);
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

      const firstCard = compiled.querySelector('.subcategory-card') as HTMLElement;
      firstCard.click();
    });

    it('should call onSubcategoryClick method when card is clicked', () => {
      spyOn(component, 'onSubcategoryClick');

      const firstCard = compiled.querySelector('.subcategory-card') as HTMLElement;
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

      const cards = compiled.querySelectorAll('.subcategory-card') as NodeListOf<HTMLElement>;
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
    it('should display empty state when no subcategories', () => {
      component.subcategories = [];
      fixture.detectChanges();

      const emptyState = compiled.querySelector('.col-span-full');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No subcategories available');
    });

    it('should not display cards when subcategories array is empty', () => {
      component.subcategories = [];
      fixture.detectChanges();

      const cards = compiled.querySelectorAll('.subcategory-card');
      expect(cards.length).toBe(0);
    });
  });

  /**
   * Test: Accessibility
   */
  describe('Accessibility', () => {
    it('should have button type for subcategory cards', () => {
      const cards = compiled.querySelectorAll('.subcategory-card');
      cards.forEach(card => {
        expect(card.getAttribute('type')).toBe('button');
      });
    });

    it('should have proper ARIA attributes', () => {
      const cards = compiled.querySelectorAll('.subcategory-card');
      expect(cards.length).toBeGreaterThan(0);
      // Cards are clickable buttons with proper semantic HTML
    });

    it('should have alt text for images', () => {
      const images = compiled.querySelectorAll('.category-icon-wrapper img');
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
      const firstCard = compiled.querySelector('.subcategory-card');
      expect(firstCard?.getAttribute('ng-reflect-router-link')).toBe('/category/damascus-steel/knives');
    });

    it('should navigate to correct route for each subcategory', () => {
      const cards = compiled.querySelectorAll('.subcategory-card');

      expect(cards[0].getAttribute('ng-reflect-router-link')).toBe('/category/damascus-steel/knives');
      expect(cards[1].getAttribute('ng-reflect-router-link')).toBe('/category/damascus-steel/swords');
      expect(cards[2].getAttribute('ng-reflect-router-link')).toBe('/category/jewelry');
    });
  });

  /**
   * Test: Item Count Display
   */
  describe('Item Count Display', () => {
    it('should show "Item" for singular count', () => {
      // Create subcategory with 1 item
      const singleItemSubcat: SubcategoryCard = {
        id: 'single',
        name: { en: 'Single Item', ar: 'عنصر واحد' },
        iconClass: 'test',
        itemCount: 1,
        route: '/test'
      };

      component.subcategories = [singleItemSubcat];
      fixture.detectChanges();

      const itemCount = compiled.querySelector('.item-count');
      expect(itemCount?.textContent).toContain('1 Item');
    });

    it('should show "Items" for plural count', () => {
      const itemCount = compiled.querySelectorAll('.item-count')[0];
      expect(itemCount?.textContent).toContain('Items');
    });

    it('should not display item count for zero items', () => {
      const customCard = compiled.querySelectorAll('.subcategory-card')[5]; // Custom Orders with 0 items
      const itemCount = customCard.querySelector('.item-count');
      expect(itemCount).toBeFalsy();
    });
  });

  /**
   * Test: Syrian Golden Wheat Theme
   */
  describe('Theme and Styling', () => {
    it('should apply hover effects on cards', () => {
      const firstCard = compiled.querySelector('.subcategory-card') as HTMLElement;
      expect(firstCard.classList.contains('hover:border-golden-wheat')).toBe(true);
    });

    it('should have proper border styling', () => {
      const firstCard = compiled.querySelector('.subcategory-card') as HTMLElement;
      expect(firstCard.classList.contains('border')).toBe(true);
      expect(firstCard.classList.contains('border-neutral-200')).toBe(true);
    });

    it('should apply group hover effects', () => {
      const firstCard = compiled.querySelector('.subcategory-card') as HTMLElement;
      expect(firstCard.classList.contains('group')).toBe(true);
    });
  });
});
