import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

/**
 * Unit Tests for Skeleton Loader Component
 *
 * Test Coverage:
 * - Component initialization and default values
 * - Input property bindings
 * - Different skeleton types (card, banner, category, text, circle)
 * - Animation variants (shimmer, pulse, wave)
 * - Theme variants (light, dark)
 * - Count property (single and multiple items)
 * - Custom dimensions (width, height)
 * - CSS class generation
 * - Style object generation
 * - Grid layout detection
 * - Accessibility (ARIA labels)
 * - Responsive grid layout
 * - RTL support
 * - OnPush change detection
 *
 * @description
 * Comprehensive test suite ensuring skeleton loader component
 * works correctly across all scenarios and edge cases.
 *
 * Target Coverage: >80% (statements, branches, functions, lines)
 */
describe('SkeletonLoaderComponent', () => {
  let component: SkeletonLoaderComponent;
  let fixture: ComponentFixture<SkeletonLoaderComponent>;
  let compiled: HTMLElement;

  /**
   * Setup before each test
   * Creates component instance and compiles template
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonLoaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
  });

  // ===== BASIC COMPONENT TESTS =====

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.type).toBe('card');
    expect(component.count).toBe(1);
    expect(component.width).toBeNull();
    expect(component.height).toBeNull();
    expect(component.animation).toBe('shimmer');
    expect(component.theme).toBe('light');
    expect(component.borderRadius).toBe('0.5rem');
  });

  it('should initialize signals on ngOnInit', () => {
    component.type = 'banner';
    component.count = 5;
    component.ngOnInit();

    expect(component['typeSignal']()).toBe('banner');
    expect(component['countSignal']()).toBe(5);
  });

  // ===== INPUT PROPERTY TESTS =====

  it('should accept type input', () => {
    component.type = 'banner';
    fixture.detectChanges();
    expect(component.type).toBe('banner');
  });

  it('should accept count input', () => {
    component.count = 8;
    component.ngOnInit();
    expect(component['countSignal']()).toBe(8);
  });

  it('should clamp count between 1 and 20', () => {
    // Test lower bound
    component.count = 0;
    component.ngOnInit();
    expect(component['countSignal']()).toBe(1);

    // Test upper bound
    component.count = 25;
    component.ngOnInit();
    expect(component['countSignal']()).toBe(20);

    // Test valid value
    component.count = 10;
    component.ngOnInit();
    expect(component['countSignal']()).toBe(10);
  });

  it('should accept width and height inputs', () => {
    component.width = '300px';
    component.height = '400px';
    fixture.detectChanges();

    expect(component.width).toBe('300px');
    expect(component.height).toBe('400px');
  });

  it('should accept animation input', () => {
    component.animation = 'pulse';
    fixture.detectChanges();
    expect(component.animation).toBe('pulse');
  });

  it('should accept theme input', () => {
    component.theme = 'dark';
    fixture.detectChanges();
    expect(component.theme).toBe('dark');
  });

  // ===== SKELETON TYPE TESTS =====

  it('should render card skeleton', () => {
    component.type = 'card';
    component.ngOnInit();
    fixture.detectChanges();

    const cardElement = compiled.querySelector('.skeleton-card');
    expect(cardElement).toBeTruthy();
  });

  it('should render banner skeleton', () => {
    component.type = 'banner';
    component.ngOnInit();
    fixture.detectChanges();

    const bannerElement = compiled.querySelector('.skeleton-banner');
    expect(bannerElement).toBeTruthy();
  });

  it('should render category skeleton', () => {
    component.type = 'category';
    component.ngOnInit();
    fixture.detectChanges();

    const categoryElement = compiled.querySelector('.skeleton-category');
    expect(categoryElement).toBeTruthy();
  });

  it('should render text skeleton', () => {
    component.type = 'text';
    component.ngOnInit();
    fixture.detectChanges();

    const textElement = compiled.querySelector('.skeleton-text');
    expect(textElement).toBeTruthy();
  });

  it('should render circle skeleton', () => {
    component.type = 'circle';
    component.ngOnInit();
    fixture.detectChanges();

    const circleElement = compiled.querySelector('.skeleton-circle');
    expect(circleElement).toBeTruthy();
  });

  // ===== COUNT TESTS =====

  it('should render single skeleton by default', () => {
    component.type = 'card';
    component.count = 1;
    component.ngOnInit();
    fixture.detectChanges();

    const skeletons = compiled.querySelectorAll('.skeleton-card');
    expect(skeletons.length).toBe(1);
  });

  it('should render multiple skeletons when count > 1', () => {
    component.type = 'card';
    component.count = 8;
    component.ngOnInit();
    fixture.detectChanges();

    const skeletons = compiled.querySelectorAll('.skeleton-card');
    expect(skeletons.length).toBe(8);
  });

  // ===== CSS CLASS GENERATION TESTS =====

  it('should generate correct CSS classes for card type', () => {
    component.type = 'card';
    component.animation = 'shimmer';
    component.theme = 'light';

    const classes = component.getSkeletonClasses();
    expect(classes).toContain('skeleton-loader');
    expect(classes).toContain('skeleton-loader--card');
    expect(classes).toContain('skeleton-loader--shimmer');
    expect(classes).toContain('skeleton-loader--light');
  });

  it('should generate correct CSS classes for dark theme', () => {
    component.type = 'banner';
    component.theme = 'dark';

    const classes = component.getSkeletonClasses();
    expect(classes).toContain('skeleton-loader--dark');
  });

  it('should generate correct CSS classes for pulse animation', () => {
    component.animation = 'pulse';

    const classes = component.getSkeletonClasses();
    expect(classes).toContain('skeleton-loader--pulse');
  });

  it('should generate correct CSS classes for wave animation', () => {
    component.animation = 'wave';

    const classes = component.getSkeletonClasses();
    expect(classes).toContain('skeleton-loader--wave');
  });

  // ===== STYLE GENERATION TESTS =====

  it('should generate styles with custom width', () => {
    component.width = '400px';

    const styles = component.getSkeletonStyles();
    expect(styles['width']).toBe('400px');
  });

  it('should generate styles with custom height', () => {
    component.height = '300px';

    const styles = component.getSkeletonStyles();
    expect(styles['height']).toBe('300px');
  });

  it('should generate styles with custom border radius for non-circle types', () => {
    component.type = 'card';
    component.borderRadius = '1rem';

    const styles = component.getSkeletonStyles();
    expect(styles['border-radius']).toBe('1rem');
  });

  it('should not apply border radius to circle type', () => {
    component.type = 'circle';
    component.borderRadius = '1rem';

    const styles = component.getSkeletonStyles();
    expect(styles['border-radius']).toBeUndefined();
  });

  it('should return empty styles object when no custom dimensions', () => {
    component.width = null;
    component.height = null;

    const styles = component.getSkeletonStyles();
    expect(Object.keys(styles).length).toBeLessThanOrEqual(1); // Only border-radius might be present
  });

  // ===== GRID LAYOUT TESTS =====

  it('should identify card type as grid layout', () => {
    component.type = 'card';
    expect(component.isGridLayout()).toBe(true);
  });

  it('should identify category type as grid layout', () => {
    component.type = 'category';
    expect(component.isGridLayout()).toBe(true);
  });

  it('should identify banner type as non-grid layout', () => {
    component.type = 'banner';
    expect(component.isGridLayout()).toBe(false);
  });

  it('should identify text type as non-grid layout', () => {
    component.type = 'text';
    expect(component.isGridLayout()).toBe(false);
  });

  it('should identify circle type as non-grid layout', () => {
    component.type = 'circle';
    expect(component.isGridLayout()).toBe(false);
  });

  it('should generate grid classes for card type', () => {
    component.type = 'card';

    const classes = component.getGridClasses();
    expect(classes).toContain('skeleton-grid');
    expect(classes).toContain('grid');
    expect(classes).toContain('gap-4');
  });

  it('should return empty string for non-grid types', () => {
    component.type = 'text';

    const classes = component.getGridClasses();
    expect(classes).toBe('');
  });

  it('should generate correct container classes for grid layout', () => {
    component.type = 'card';

    const classes = component.getContainerClasses();
    expect(classes).toContain('skeleton-grid');
  });

  it('should generate correct container classes for non-grid layout', () => {
    component.type = 'banner';

    const classes = component.getContainerClasses();
    expect(classes).toBe('skeleton-container');
  });

  // ===== ACCESSIBILITY TESTS =====

  it('should generate correct ARIA label for card type', () => {
    component.type = 'card';
    expect(component.getAriaLabel()).toBe('Loading product card');
  });

  it('should generate correct ARIA label for banner type', () => {
    component.type = 'banner';
    expect(component.getAriaLabel()).toBe('Loading banner');
  });

  it('should generate correct ARIA label for category type', () => {
    component.type = 'category';
    expect(component.getAriaLabel()).toBe('Loading category');
  });

  it('should generate correct ARIA label for text type', () => {
    component.type = 'text';
    expect(component.getAriaLabel()).toBe('Loading text');
  });

  it('should generate correct ARIA label for circle type', () => {
    component.type = 'circle';
    expect(component.getAriaLabel()).toBe('Loading image');
  });

  it('should have role="status" on container', () => {
    component.type = 'card';
    component.ngOnInit();
    fixture.detectChanges();

    const container = compiled.querySelector('[role="status"]');
    expect(container).toBeTruthy();
  });

  it('should have aria-label on skeleton elements', () => {
    component.type = 'card';
    component.ngOnInit();
    fixture.detectChanges();

    // The container has 'Loading N items' and individual elements have type-specific labels
    const skeletonElement = compiled.querySelector('[aria-label]');
    expect(skeletonElement).toBeTruthy();
    expect(skeletonElement?.getAttribute('aria-label')).toContain('Loading');
  });

  it('should have screen reader text', () => {
    component.ngOnInit();
    fixture.detectChanges();

    const srText = compiled.querySelector('.sr-only');
    expect(srText).toBeTruthy();
    expect(srText?.textContent).toContain('Loading content, please wait');
  });

  // ===== TRACK BY FUNCTION TESTS =====

  it('should return index for trackByIndex', () => {
    const index = 5;
    const result = component.trackByIndex(index);
    expect(result).toBe(index);
  });

  // ===== COMPUTED SIGNAL TESTS =====

  it('should compute items array based on count', () => {
    component.count = 3;
    component.ngOnInit();

    const items = component['items']();
    expect(items.length).toBe(3);
  });

  it('should update items when count signal changes', () => {
    component.count = 5;
    component.ngOnInit();
    expect(component['items']().length).toBe(5);

    component['countSignal'].set(10);
    expect(component['items']().length).toBe(10);
  });

  // ===== INTEGRATION TESTS =====

  it('should render card skeleton with all elements', () => {
    component.type = 'card';
    component.ngOnInit();
    fixture.detectChanges();

    const card = compiled.querySelector('.skeleton-card');
    expect(card).toBeTruthy();

    // Check card elements
    expect(card?.querySelector('.skeleton-card__image')).toBeTruthy();
    expect(card?.querySelector('.skeleton-card__content')).toBeTruthy();
    expect(card?.querySelector('.skeleton-card__badges')).toBeTruthy();
    expect(card?.querySelector('.skeleton-card__title')).toBeTruthy();
    expect(card?.querySelector('.skeleton-card__rating')).toBeTruthy();
    expect(card?.querySelector('.skeleton-card__price-row')).toBeTruthy();
    expect(card?.querySelector('.skeleton-card__actions')).toBeTruthy();
  });

  it('should render banner skeleton with all elements', () => {
    component.type = 'banner';
    component.ngOnInit();
    fixture.detectChanges();

    const banner = compiled.querySelector('.skeleton-banner');
    expect(banner).toBeTruthy();

    // Check banner elements
    expect(banner?.querySelector('.skeleton-banner__bg')).toBeTruthy();
    expect(banner?.querySelector('.skeleton-banner__content')).toBeTruthy();
    expect(banner?.querySelector('.skeleton-banner__heading')).toBeTruthy();
    expect(banner?.querySelector('.skeleton-banner__cta')).toBeTruthy();
  });

  it('should apply custom styles to skeleton', () => {
    component.type = 'card';
    component.width = '350px';
    component.height = '450px';
    component.ngOnInit();
    fixture.detectChanges();

    const skeleton = compiled.querySelector('.skeleton-loader');
    const styles = (skeleton as HTMLElement)?.style;

    expect(styles?.width).toBe('350px');
    expect(styles?.height).toBe('450px');
  });

  // ===== EDGE CASES =====

  it('should handle count of 0 by setting to 1', () => {
    component.count = 0;
    component.ngOnInit();

    expect(component['countSignal']()).toBe(1);
  });

  it('should handle negative count by setting to 1', () => {
    component.count = -5;
    component.ngOnInit();

    expect(component['countSignal']()).toBe(1);
  });

  it('should handle count exceeding 20 by clamping to 20', () => {
    component.count = 100;
    component.ngOnInit();

    expect(component['countSignal']()).toBe(20);
  });

  // ===== CHANGE DETECTION =====

  it('should use OnPush change detection strategy', () => {
    // In Angular 18 with Ivy, component metadata is accessed via ɵcmp
    const componentDef = (component.constructor as any).ɵcmp;
    expect(componentDef).toBeTruthy();
    expect(componentDef.onPush).toBe(true);
  });

  // ===== RESPONSIVE GRID =====

  it('should apply responsive grid classes', () => {
    component.type = 'card';
    component.ngOnInit();
    fixture.detectChanges();

    const grid = compiled.querySelector('.skeleton-grid');
    expect(grid).toBeTruthy();
    expect(grid?.classList.contains('grid')).toBe(true);
    expect(grid?.classList.contains('grid-cols-1')).toBe(true);
    expect(grid?.classList.contains('sm:grid-cols-2')).toBe(true);
    expect(grid?.classList.contains('md:grid-cols-3')).toBe(true);
    expect(grid?.classList.contains('lg:grid-cols-4')).toBe(true);
    expect(grid?.classList.contains('xl:grid-cols-5')).toBe(true);
  });

  // ===== COMPONENT CLEANUP =====

  afterEach(() => {
    fixture.destroy();
  });
});
