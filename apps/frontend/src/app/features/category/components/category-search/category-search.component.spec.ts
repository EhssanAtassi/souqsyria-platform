/**
 * @file category-search.component.spec.ts
 * @description Unit tests for the CategorySearchComponent
 *
 * TEST COVERAGE:
 * - Component initialization
 * - Search input handling and debouncing
 * - Event emissions (searchResults, searchCleared, loading)
 * - Loading states and skeletons
 * - Empty state messages
 * - Minimum character validation (2 chars)
 * - RTL layout detection
 * - Keyboard interactions
 * - Clear button functionality
 *
 * @author SouqSyria Development Team
 * @since 2026-02-09
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CategorySearchComponent } from './category-search.component';
import { CategoryApiService } from '../../services/category-api.service';
import { SearchInCategoryResponse } from '../../models/category-tree.interface';
import { of, throwError, Subject } from 'rxjs';

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Mock search response data
 */
const MOCK_SEARCH_RESPONSE: SearchInCategoryResponse = {
  success: true,
  data: [
    {
      id: 1,
      nameEn: 'Damascus Steel Knife',
      nameAr: 'سكين من الفولاذ الدمشقي',
      slug: 'damascus-knife',
      mainImage: 'knife.jpg',
      basePrice: 15000,
      discountPrice: 12000,
      currency: 'SYP',
      approvalStatus: 'approved',
      isActive: true,
      isPublished: true,
    },
    {
      id: 2,
      nameEn: 'Steel Fork',
      nameAr: 'شوكة من الفولاذ',
      slug: 'steel-fork',
      mainImage: 'fork.jpg',
      basePrice: 5000,
      discountPrice: 4000,
      currency: 'SYP',
      approvalStatus: 'approved',
      isActive: true,
      isPublished: true,
    },
  ],
  meta: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  },
};

// =============================================================================
// TEST SUITE
// =============================================================================

/**
 * @description Unit tests for CategorySearchComponent
 */
describe('CategorySearchComponent', () => {
  let component: CategorySearchComponent;
  let fixture: ComponentFixture<CategorySearchComponent>;
  let categoryApiService: jasmine.SpyObj<CategoryApiService>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('CategoryApiService', ['searchInCategory']);

    await TestBed.configureTestingModule({
      imports: [CategorySearchComponent, NoopAnimationsModule],
      providers: [
        { provide: CategoryApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    categoryApiService = TestBed.inject(CategoryApiService) as jasmine.SpyObj<CategoryApiService>;
    fixture = TestBed.createComponent(CategorySearchComponent);
    component = fixture.componentInstance;
    component.categoryId = 1;
    fixture.detectChanges();
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

    it('should have required categoryId input', () => {
      expect(component.categoryId).toBe(1);
    });

    it('should initialize with empty search query', () => {
      expect(component.searchQuery()).toBe('');
    });

    it('should initialize with empty results', () => {
      expect(component.results()).toEqual([]);
    });

    it('should initialize with isSearching as false', () => {
      expect(component.isSearching()).toBe(false);
    });

    it('should initialize with hasSearched as false', () => {
      expect(component.hasSearched()).toBe(false);
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
     * Should emit searchCleared when clear button clicked
     * Validates: clearSearch method emits correct event
     */
    it('should emit searchCleared when clear button clicked', () => {
      const searchClearedSpy = spyOn(component.searchCleared, 'emit');
      component.searchQuery.set('test');

      component.clearSearch();

      expect(searchClearedSpy).toHaveBeenCalledWith();
      expect(component.searchQuery()).toBe('');
    });

    /**
     * Should emit searchResults when search completes
     * Validates: Search results emitted with data
     */
    it('should emit searchResults when search completes', fakeAsync(() => {
      const searchResultsSpy = spyOn(component.searchResults, 'emit');
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      component.onSearchInput('damascus');
      tick(300); // Debounce delay

      expect(searchResultsSpy).toHaveBeenCalledWith(MOCK_SEARCH_RESPONSE.data);
    }));

    /**
     * Should emit loading state changes
     * Validates: Loading event emitted during search
     */
    it('should emit loading state changes', fakeAsync(() => {
      const loadingSpy = spyOn(component.loading, 'emit');
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      component.onSearchInput('damascus');
      tick(300);

      expect(loadingSpy).toHaveBeenCalledWith(true);
      expect(loadingSpy).toHaveBeenCalledWith(false);
    }));
  });

  // ===========================================================================
  // SEARCH VALIDATION
  // ===========================================================================

  /**
   * @description Tests for search input validation
   */
  describe('Search Validation', () => {
    /**
     * Should not search with less than 2 characters
     * Validates: Minimum character requirement enforced
     */
    it('should not search with less than 2 characters', fakeAsync(() => {
      component.onSearchInput('a');
      tick(300);

      expect(categoryApiService.searchInCategory).not.toHaveBeenCalled();
      expect(component.results()).toEqual([]);
    }));

    /**
     * Should search with exactly 2 characters
     * Validates: Minimum length boundary condition
     */
    it('should search with exactly 2 characters', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      component.onSearchInput('da');
      tick(300);

      expect(categoryApiService.searchInCategory).toHaveBeenCalled();
    }));

    /**
     * Should handle empty search input
     * Validates: Empty string treated as clear
     */
    it('should handle empty search input', () => {
      const searchClearedSpy = spyOn(component.searchCleared, 'emit');
      component.searchQuery.set('test');

      component.onSearchInput('');

      expect(searchClearedSpy).toHaveBeenCalled();
      expect(component.searchQuery()).toBe('');
    });

    /**
     * Should trim whitespace from search queries
     * Validates: Whitespace-only input rejected
     */
    it('should not search with whitespace-only input', fakeAsync(() => {
      component.onSearchInput('   ');
      tick(300);

      expect(categoryApiService.searchInCategory).not.toHaveBeenCalled();
    }));
  });

  // ===========================================================================
  // PLACEHOLDER TEXT
  // ===========================================================================

  /**
   * @description Tests for dynamic placeholder generation
   */
  describe('Placeholder Text', () => {
    /**
     * Should show placeholder with category name
     * Validates: Placeholder includes category name
     * Note: Uses fresh component so getter evaluates with inputs set
     */
    it('should show placeholder with category name', () => {
      const freshFixture = TestBed.createComponent(CategorySearchComponent);
      const freshComponent = freshFixture.componentInstance;
      freshComponent.categoryId = 1;
      freshComponent.categoryName = 'Electronics';
      freshComponent.categoryNameAr = 'إلكترونيات';
      freshFixture.detectChanges();

      expect(freshComponent.placeholder).toContain('Electronics');
      freshFixture.destroy();
    });

    /**
     * Should show Arabic placeholder in RTL mode
     * Validates: RTL mode uses Arabic name
     * Note: Sets isRtl input to true for RTL mode
     */
    it('should show Arabic placeholder in RTL mode', () => {
      const freshFixture = TestBed.createComponent(CategorySearchComponent);
      const freshComponent = freshFixture.componentInstance;
      freshComponent.categoryId = 1;
      freshComponent.categoryName = 'Electronics';
      freshComponent.categoryNameAr = 'إلكترونيات';
      freshComponent.isRtl = true;
      freshFixture.detectChanges();

      expect(freshComponent.placeholder).toContain('إلكترونيات');

      freshFixture.destroy();
    });

    /**
     * Should show default placeholder when no category name
     * Validates: Fallback placeholder displayed
     */
    it('should show default placeholder when no category name', () => {
      component.categoryName = '';
      component.categoryNameAr = '';

      fixture.detectChanges();
      const placeholder = component.placeholder;

      expect(placeholder).toBe('Search for products');
    });
  });

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  /**
   * @description Tests for loading state management
   */
  describe('Loading State', () => {
    /**
     * Should set isSearching to true during search
     * Validates: Loading indicator shown during API call
     */
    it('should set isSearching to true during search', fakeAsync(() => {
      const response$ = new Subject<SearchInCategoryResponse>();
      categoryApiService.searchInCategory.and.returnValue(response$.asObservable());

      component.onSearchInput('damascus');
      tick(300); // Debounce fires, switchMap enters, isSearching=true

      expect(component.isSearching()).toBe(true);

      response$.next(MOCK_SEARCH_RESPONSE);
      response$.complete();
      tick(0);
    }));

    /**
     * Should set isSearching to false after search completes
     * Validates: Loading indicator hidden after response
     */
    it('should set isSearching to false after search completes', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      component.onSearchInput('damascus');
      tick(300);
      tick(0);

      expect(component.isSearching()).toBe(false);
    }));

    /**
     * Should set hasSearched to true after first search
     * Validates: Empty state flag set correctly
     */
    it('should set hasSearched to true after first search', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      expect(component.hasSearched()).toBe(false);

      component.onSearchInput('damascus');
      tick(300);

      expect(component.hasSearched()).toBe(true);
    }));
  });

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  /**
   * @description Tests for empty state handling
   */
  describe('Empty State', () => {
    /**
     * Should show empty state message when no results
     * Validates: showEmptyState computed signal works
     */
    it('should show empty state message when no results', fakeAsync(() => {
      const emptyResponse: SearchInCategoryResponse = {
        success: true,
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      categoryApiService.searchInCategory.and.returnValue(of(emptyResponse));

      component.onSearchInput('nonexistent');
      tick(300);

      expect(component.showEmptyState()).toBe(true);
      expect(component.results()).toEqual([]);
    }));

    /**
     * Should not show empty state before search
     * Validates: Empty state only shown after search
     */
    it('should not show empty state before search', () => {
      expect(component.hasSearched()).toBe(false);
      expect(component.showEmptyState()).toBe(false);
    });
  });

  // ===========================================================================
  // CLEAR BUTTON
  // ===========================================================================

  /**
   * @description Tests for clear button visibility
   */
  describe('Clear Button', () => {
    /**
     * Should show clear button when text entered
     * Validates: showClearButton computed signal
     */
    it('should show clear button when text entered', () => {
      component.searchQuery.set('test');
      fixture.detectChanges();

      expect(component.showClearButton()).toBe(true);
    });

    /**
     * Should hide clear button when empty
     * Validates: Clear button hidden for empty input
     */
    it('should hide clear button when empty', () => {
      component.searchQuery.set('');
      fixture.detectChanges();

      expect(component.showClearButton()).toBe(false);
    });

    /**
     * Should hide clear button when whitespace only
     * Validates: Whitespace-only treated as empty
     */
    it('should hide clear button when whitespace only', () => {
      component.searchQuery.set('   ');
      fixture.detectChanges();

      expect(component.showClearButton()).toBe(false);
    });
  });

  // ===========================================================================
  // KEYBOARD INTERACTIONS
  // ===========================================================================

  /**
   * @description Tests for keyboard event handling
   */
  describe('Keyboard Interactions', () => {
    /**
     * Should trigger search on Enter key
     * Validates: Enter key executes search immediately
     */
    it('should trigger search on Enter key', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));
      component.searchQuery.set('damascus');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onEnterPress(event);
      tick(300); // Debounce delay

      expect(categoryApiService.searchInCategory).toHaveBeenCalled();
    }));

    /**
     * Should clear search on Escape key
     * Validates: Escape key clears input
     */
    it('should clear search on Escape key', () => {
      const searchClearedSpy = spyOn(component.searchCleared, 'emit');
      component.searchQuery.set('damascus');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onEscapePress(event);

      expect(searchClearedSpy).toHaveBeenCalled();
      expect(component.searchQuery()).toBe('');
    });

    /**
     * Should not search on Enter with less than 2 characters
     * Validates: Minimum length still enforced on Enter
     */
    it('should not search on Enter with less than 2 characters', fakeAsync(() => {
      component.searchQuery.set('a');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onEnterPress(event);
      tick(0);

      expect(categoryApiService.searchInCategory).not.toHaveBeenCalled();
    }));
  });

  // ===========================================================================
  // API INTEGRATION
  // ===========================================================================

  /**
   * @description Tests for API service integration
   */
  describe('API Integration', () => {
    /**
     * Should call searchInCategory with correct parameters
     * Validates: Service called with categoryId and search params
     */
    it('should call searchInCategory with correct parameters', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      component.onSearchInput('damascus');
      tick(300);

      expect(categoryApiService.searchInCategory).toHaveBeenCalledWith(1, 'damascus', 1, 20);
    }));

    /**
     * Should handle search errors gracefully
     * Validates: Error doesn't crash component
     */
    it('should handle search errors gracefully', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.onSearchInput('damascus');
      tick(300);

      expect(component.results()).toEqual([]);
      expect(component.isSearching()).toBe(false);
    }));

    /**
     * Should update results when search succeeds
     * Validates: Results state updated with API response
     */
    it('should update results when search succeeds', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      component.onSearchInput('damascus');
      tick(300);

      expect(component.results()).toEqual(MOCK_SEARCH_RESPONSE.data);
    }));
  });

  // ===========================================================================
  // DEBOUNCING
  // ===========================================================================

  /**
   * @description Tests for search debouncing
   */
  describe('Debouncing', () => {
    /**
     * Should debounce search requests
     * Validates: Multiple rapid inputs only trigger one search
     */
    it('should debounce search requests', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      component.onSearchInput('d');
      component.onSearchInput('da');
      component.onSearchInput('dam');
      tick(300);

      expect(categoryApiService.searchInCategory).toHaveBeenCalledTimes(1);
    }));

    /**
     * Should use 300ms debounce delay
     * Validates: Correct debounce timing
     */
    it('should use 300ms debounce delay', fakeAsync(() => {
      categoryApiService.searchInCategory.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      component.onSearchInput('damascus');
      tick(299);

      expect(categoryApiService.searchInCategory).not.toHaveBeenCalled();

      tick(1); // Complete the 300ms delay

      expect(categoryApiService.searchInCategory).toHaveBeenCalled();
    }));
  });

  // ===========================================================================
  // RTL LAYOUT
  // ===========================================================================

  /**
   * @description Tests for RTL layout detection
   */
  describe('RTL Layout', () => {
    /**
     * Should detect RTL mode
     * Validates: isRtl input property
     */
    it('should detect RTL mode', () => {
      component.isRtl = true;
      fixture.detectChanges();

      expect(component.isRtl).toBe(true);
    });

    /**
     * Should detect LTR mode
     * Validates: isRtl returns false for LTR
     */
    it('should detect LTR mode', () => {
      component.isRtl = false;
      fixture.detectChanges();

      expect(component.isRtl).toBe(false);
    });
  });
});
