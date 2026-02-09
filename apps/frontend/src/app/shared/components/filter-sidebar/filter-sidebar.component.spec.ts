import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { FilterSidebarComponent, FilterState } from './filter-sidebar.component';

/**
 * @description Unit tests for FilterSidebarComponent
 *
 * Covers:
 * - Component creation and initial state
 * - Price range filter section rendering
 * - filtersChange emission when price range changes
 * - clearAll resets all filters and emits clearFilters
 * - activeFilterCount computed property accuracy
 * - Bilingual label rendering (English / Arabic)
 */
describe('FilterSidebarComponent', () => {
  let component: FilterSidebarComponent;
  let fixture: ComponentFixture<FilterSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FilterSidebarComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------
  // 1. Component creates successfully
  // ---------------------------------------------------------------
  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------
  // 2. Renders price range filter section
  // ---------------------------------------------------------------
  it('should render the price range filter section with expansion panel', () => {
    const pricePanel = fixture.debugElement.query(By.css('mat-expansion-panel'));
    expect(pricePanel).toBeTruthy();

    const priceRangeFilter = fixture.debugElement.query(By.css('app-price-range-filter'));
    expect(priceRangeFilter).toBeTruthy();
  });

  it('should render the "Price Range" panel title in English by default', () => {
    const panelTitle = fixture.debugElement.query(By.css('mat-panel-title'));
    expect(panelTitle).toBeTruthy();
    expect(panelTitle.nativeElement.textContent).toContain('Price Range');
  });

  // ---------------------------------------------------------------
  // 3. Emits filtersChange when price range changes
  // ---------------------------------------------------------------
  it('should emit filtersChange with updated priceRange when onPriceChange is called', () => {
    const filtersChangeSpy = spyOn(component.filtersChange, 'emit');

    const newRange = { min: 1000, max: 50000 };
    component.onPriceChange(newRange);

    expect(filtersChangeSpy).toHaveBeenCalledTimes(1);

    const emittedFilters: FilterState = filtersChangeSpy.calls.mostRecent().args[0];
    expect(emittedFilters.priceRange).toEqual(newRange);
  });

  it('should update currentFilters signal when onPriceChange is called', () => {
    component.onPriceChange({ min: 500, max: 10000 });

    const filters = component.currentFilters();
    expect(filters.priceRange).toEqual({ min: 500, max: 10000 });
  });

  // ---------------------------------------------------------------
  // 4. Clear all resets filters
  // ---------------------------------------------------------------
  it('should reset currentFilters to empty object when clearAll is called', () => {
    // Arrange: set some filters first
    component.onPriceChange({ min: 100, max: 5000 });
    component.onRatingChange([4, 5]);
    component.onAvailabilityChange('inStock', true);
    expect(component.hasActiveFilters()).toBeTrue();

    const clearFiltersSpy = spyOn(component.clearFilters, 'emit');

    // Act
    component.clearAll();

    // Assert
    expect(component.currentFilters()).toEqual({});
    expect(clearFiltersSpy).toHaveBeenCalledTimes(1);
    expect(component.hasActiveFilters()).toBeFalse();
  });

  // ---------------------------------------------------------------
  // 5. Shows active filter count
  // ---------------------------------------------------------------
  it('should return 0 for activeFilterCount when no filters are set', () => {
    component.currentFilters.set({});
    expect(component.activeFilterCount()).toBe(0);
  });

  it('should count priceRange as 1 active filter', () => {
    component.currentFilters.set({ priceRange: { min: 0, max: 5000 } });
    expect(component.activeFilterCount()).toBe(1);
  });

  it('should count each selected rating individually', () => {
    component.currentFilters.set({ ratings: [4, 5] });
    expect(component.activeFilterCount()).toBe(2);
  });

  it('should count authenticity, availability, and regions correctly', () => {
    component.currentFilters.set({
      priceRange: { min: 0, max: 1000 },           // +1
      ratings: [3],                                  // +1
      authenticity: { unesco: true, handmade: true }, // +2
      availability: { inStock: true },               // +1
      regions: ['damascus', 'aleppo']                // +2
    });
    expect(component.activeFilterCount()).toBe(7);
  });

  it('should display active filter count badge when filters are active', () => {
    component.currentFilters.set({ priceRange: { min: 0, max: 5000 } });
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('.active-filters-badge'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent).toContain('1');
  });

  // ---------------------------------------------------------------
  // 6. Handles bilingual labels (en/ar)
  // ---------------------------------------------------------------
  it('should return English label from getLabel when language is "en"', () => {
    // Default language is 'en'
    const result = component.getLabel('Damascus', 'دمشق');
    expect(result).toBe('Damascus');
  });

  it('should return Arabic label from getLabel when language is "ar"', () => {
    // Override the language input signal
    fixture.componentRef.setInput('language', 'ar');
    fixture.detectChanges();

    const result = component.getLabel('Damascus', 'دمشق');
    expect(result).toBe('دمشق');
  });

  it('should display Arabic header title when language is "ar"', () => {
    fixture.componentRef.setInput('language', 'ar');
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css('.filter-title h3'));
    expect(titleEl).toBeTruthy();
    expect(titleEl.nativeElement.textContent).toContain('تصفية المنتجات');
  });

  it('should display English header title by default', () => {
    const titleEl = fixture.debugElement.query(By.css('.filter-title h3'));
    expect(titleEl).toBeTruthy();
    expect(titleEl.nativeElement.textContent).toContain('Filter Products');
  });

  // ---------------------------------------------------------------
  // Additional behavioral tests
  // ---------------------------------------------------------------
  it('should update availability filter via onAvailabilityChange', () => {
    const filtersChangeSpy = spyOn(component.filtersChange, 'emit');

    component.onAvailabilityChange('inStock', true);

    expect(component.isAvailabilitySelected('inStock')).toBeTrue();
    expect(filtersChangeSpy).toHaveBeenCalledTimes(1);
  });

  it('should toggle region filter via onRegionChange', () => {
    const filtersChangeSpy = spyOn(component.filtersChange, 'emit');

    component.onRegionChange('damascus', true);
    expect(component.isRegionSelected('damascus')).toBeTrue();

    component.onRegionChange('damascus', false);
    expect(component.isRegionSelected('damascus')).toBeFalse();

    expect(filtersChangeSpy).toHaveBeenCalledTimes(2);
  });

  it('should show Clear All button only when filters are active', () => {
    // No active filters initially
    let clearBtn = fixture.debugElement.query(By.css('.clear-all-btn'));
    expect(clearBtn).toBeFalsy();

    // Activate a filter
    component.onPriceChange({ min: 0, max: 5000 });
    fixture.detectChanges();

    clearBtn = fixture.debugElement.query(By.css('.clear-all-btn'));
    expect(clearBtn).toBeTruthy();
  });
});
