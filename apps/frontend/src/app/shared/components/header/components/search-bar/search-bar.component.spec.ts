import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { SearchBarComponent } from './search-bar.component';
import { HeaderApiService } from '../../../../services/header-api.service';
import { ProductService } from '../../../../../features/products/services/product.service';
import { SearchSuggestion, RecentSearch } from '../../../../interfaces/header.interfaces';

/**
 * @description Unit tests for SearchBarComponent
 *
 * Covers:
 * - Component creation and initial state
 * - Search input rendering and placeholder localization
 * - 300ms debounce behavior on typed input
 * - Suggestions dropdown visibility based on API response
 * - Text highlight matching within suggestions
 * - Form submission emitting searchSubmit with query value
 * - Keyboard navigation (ArrowDown, Escape)
 * - Recent searches shown on focus with empty query
 * - Price formatting for SYP and USD currencies
 * - Icon resolution per suggestion type
 */
describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let mockHeaderApi: jasmine.SpyObj<HeaderApiService>;
  let mockProductService: jasmine.SpyObj<ProductService>;

  /** Sample recent searches for testing */
  const sampleRecentSearches: RecentSearch[] = [
    { id: '1', query: 'Damascus steel knife', searchedAt: new Date() },
    { id: '2', query: 'Aleppo soap', searchedAt: new Date() }
  ];

  /** Sample search suggestions for testing */
  const sampleSuggestions = {
    suggestions: [
      { text: 'Damascus Steel Chef Knife', textAr: 'سكين شيف فولاذ دمشقي', type: 'product' as const, slug: 'damascus-steel-chef-knife', imageUrl: null, price: 500000, currency: 'SYP' as const },
      { text: 'Damascus Steel', textAr: 'فولاذ دمشقي', type: 'category' as const, slug: 'damascus-steel', imageUrl: null, price: null, currency: undefined }
    ]
  };

  beforeEach(async () => {
    mockHeaderApi = jasmine.createSpyObj('HeaderApiService', [
      'getRecentSearches', 'saveRecentSearch', 'deleteRecentSearch', 'clearRecentSearches'
    ]);
    mockHeaderApi.getRecentSearches.and.returnValue(of([]));
    mockHeaderApi.saveRecentSearch.and.returnValue(of({ id: '99', query: 'test', searchedAt: new Date() }));
    mockHeaderApi.deleteRecentSearch.and.returnValue(of(true));
    mockHeaderApi.clearRecentSearches.and.returnValue(of(true));

    mockProductService = jasmine.createSpyObj('ProductService', ['getSearchSuggestions']);
    mockProductService.getSearchSuggestions.and.returnValue(of({ suggestions: [] }));

    await TestBed.configureTestingModule({
      imports: [SearchBarComponent],
      providers: [
        { provide: HeaderApiService, useValue: mockHeaderApi },
        { provide: ProductService, useValue: mockProductService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------
  // 1. Component creation
  // ---------------------------------------------------------------
  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------
  // 2. Renders search input field
  // ---------------------------------------------------------------
  it('should render a search input field', () => {
    const input = fixture.debugElement.query(By.css('input[formControlName="query"]'));
    expect(input).toBeTruthy();
    expect(input.nativeElement.getAttribute('type')).toBe('text');
  });

  // ---------------------------------------------------------------
  // 3. Placeholder text based on language
  // ---------------------------------------------------------------
  it('should show English placeholder when language is "en"', () => {
    component.language = 'en';
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input[formControlName="query"]'));
    expect(input.nativeElement.getAttribute('placeholder')).toContain('Search products');
  });

  it('should show Arabic placeholder when language is "ar"', () => {
    fixture.componentRef.setInput('language', 'ar');
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input[formControlName="query"]'));
    expect(input.nativeElement.getAttribute('placeholder')).toContain('ابحث عن المنتجات');
  });

  // ---------------------------------------------------------------
  // 4. Debounces input by 300ms before calling service
  // ---------------------------------------------------------------
  it('should debounce input by 300ms before calling ProductService', fakeAsync(() => {
    mockProductService.getSearchSuggestions.and.returnValue(of(sampleSuggestions));

    // Type a query that meets the minimum length of 2
    component.searchForm.get('query')?.setValue('Dam');

    // Before 300ms, the service should not have been called
    tick(100);
    expect(mockProductService.getSearchSuggestions).not.toHaveBeenCalled();

    // After 300ms, the debounced subscription fires
    tick(200);
    expect(mockProductService.getSearchSuggestions).toHaveBeenCalledWith('Dam');
  }));

  // ---------------------------------------------------------------
  // 5. Shows suggestions dropdown when suggestions arrive
  // ---------------------------------------------------------------
  it('should open the dropdown when suggestions are returned from the API', fakeAsync(() => {
    mockProductService.getSearchSuggestions.and.returnValue(of(sampleSuggestions));

    component.searchForm.get('query')?.setValue('Damascus');
    tick(300);
    fixture.detectChanges();

    expect(component.dropdownOpen).toBeTrue();
    expect(component.suggestions.length).toBeGreaterThan(0);

    const dropdownItems = fixture.debugElement.queryAll(By.css('.sq-search-dropdown-item'));
    expect(dropdownItems.length).toBe(component.suggestions.length);
  }));

  // ---------------------------------------------------------------
  // 6. Highlights matching text in suggestions
  // ---------------------------------------------------------------
  it('should wrap matching text in <strong> tags via highlightMatch', () => {
    component.searchForm.get('query')?.setValue('Damascus');

    const result = component.highlightMatch('Damascus Steel Chef Knife');
    expect(result).toContain('<strong>');
    expect(result).toContain('Damascus');
  });

  it('should return unmodified text when query is shorter than 2 chars', () => {
    component.searchForm.get('query')?.setValue('D');

    const result = component.highlightMatch('Damascus Steel');
    expect(result).not.toContain('<strong>');
  });

  // ---------------------------------------------------------------
  // 7. Emits searchSubmit on form submit with non-empty query
  // ---------------------------------------------------------------
  it('should emit searchSubmit when the form is submitted with a non-empty query', () => {
    spyOn(component.searchSubmit, 'emit');

    component.searchForm.patchValue({ query: 'Aleppo soap' });
    component.onSubmit();

    expect(component.searchSubmit.emit).toHaveBeenCalledWith('Aleppo soap');
  });

  it('should NOT emit searchSubmit when the query is empty', () => {
    spyOn(component.searchSubmit, 'emit');

    component.searchForm.patchValue({ query: '   ' });
    component.onSubmit();

    expect(component.searchSubmit.emit).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // 8. ArrowDown increments highlightedIndex
  // ---------------------------------------------------------------
  it('should increment highlightedIndex on ArrowDown when dropdown is open', () => {
    // Arrange: populate suggestions and open dropdown
    component.suggestions = [
      { text: 'Item 1', type: 'product' },
      { text: 'Item 2', type: 'product' }
    ] as SearchSuggestion[];
    component.dropdownOpen = true;
    component.showingRecent = false;
    component.highlightedIndex = -1;

    // Act: simulate ArrowDown
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    spyOn(event, 'preventDefault');
    component.onKeydown(event);

    // Assert
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.highlightedIndex).toBe(0);

    // Act again: press ArrowDown again
    const event2 = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.onKeydown(event2);
    expect(component.highlightedIndex).toBe(1);
  });

  // ---------------------------------------------------------------
  // 9. Escape closes dropdown
  // ---------------------------------------------------------------
  it('should close dropdown and reset highlightedIndex on Escape', () => {
    component.dropdownOpen = true;
    component.highlightedIndex = 2;

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(event, 'preventDefault');
    component.onKeydown(event);

    expect(component.dropdownOpen).toBeFalse();
    expect(component.highlightedIndex).toBe(-1);
  });

  // ---------------------------------------------------------------
  // 10. Shows recent searches on focus with empty query
  // ---------------------------------------------------------------
  it('should show recent searches on focus when query is empty and recent searches exist', () => {
    component.recentSearches = sampleRecentSearches;
    component.searchForm.patchValue({ query: '' });

    component.onInputFocus();

    expect(component.showingRecent).toBeTrue();
    expect(component.dropdownOpen).toBeTrue();
  });

  it('should NOT open dropdown on focus when query is empty and no recent searches exist', () => {
    component.recentSearches = [];
    component.searchForm.patchValue({ query: '' });

    component.onInputFocus();

    expect(component.showingRecent).toBeTrue();
    expect(component.dropdownOpen).toBeFalse();
  });

  // ---------------------------------------------------------------
  // 11. formatSuggestionPrice formats SYP correctly
  // ---------------------------------------------------------------
  it('should format SYP price with locale formatting and currency symbol', () => {
    const result = component.formatSuggestionPrice(500000, 'SYP');
    // The method uses toLocaleString('ar-SY') and appends SYP symbol
    expect(result).toContain('ل.س');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should format USD price with dollar sign', () => {
    const result = component.formatSuggestionPrice(1500, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('1,500');
  });

  it('should return empty string when price is null or undefined', () => {
    expect(component.formatSuggestionPrice(null)).toBe('');
    expect(component.formatSuggestionPrice(undefined)).toBe('');
  });

  // ---------------------------------------------------------------
  // 12. getSuggestionIcon returns correct icons per type
  // ---------------------------------------------------------------
  it('should return "shopping_bag" for product type', () => {
    expect(component.getSuggestionIcon('product')).toBe('shopping_bag');
  });

  it('should return "category" for category type', () => {
    expect(component.getSuggestionIcon('category')).toBe('category');
  });

  it('should return "store" for brand type', () => {
    expect(component.getSuggestionIcon('brand')).toBe('store');
  });

  it('should return "search" for query type', () => {
    expect(component.getSuggestionIcon('query')).toBe('search');
  });
});
