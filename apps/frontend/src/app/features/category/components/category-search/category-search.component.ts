/**
 * Category Search Component
 *
 * @description Search input component for filtering products within a specific
 * category. Provides debounced search with loading states and results display.
 *
 * @pattern Dumb/Presentational Component
 * - Receives category context via inputs
 * - Emits search events for parent handling
 * - Manages internal search state with signals
 * - OnPush change detection
 *
 * @features
 * - Debounced search input (300ms)
 * - Minimum 2 characters to trigger search
 * - Loading state indicator
 * - Clear search button
 * - Empty state message
 * - Bilingual placeholder (English/Arabic)
 * - RTL layout support
 * - Keyboard support (Enter to search, Escape to clear)
 *
 * @swagger
 * components:
 *   schemas:
 *     CategorySearchComponent:
 *       type: object
 *       description: Category product search component
 *       properties:
 *         categoryId:
 *           type: number
 *           description: Category ID to search within
 *         categoryName:
 *           type: string
 *           description: Category name in English for placeholder
 *         categoryNameAr:
 *           type: string
 *           description: Category name in Arabic for RTL placeholder
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { CategoryApiService } from '../../services/category-api.service';
import { ProductSearchResult } from '../../models/category-tree.interface';

/**
 * Category Search Component
 *
 * @description Provides search functionality within a category with
 * debounced input and loading states.
 *
 * @component
 */
@Component({
  selector: 'app-category-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-search.component.html',
  styleUrls: ['./category-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySearchComponent implements OnInit {
  /**
   * Category ID to search within
   *
   * @description The category context for product search
   */
  @Input({ required: true }) categoryId!: number;

  /**
   * Category name in English
   *
   * @description Used for search placeholder text
   */
  @Input() categoryName = '';

  /**
   * Category name in Arabic
   *
   * @description Used for RTL search placeholder text
   */
  @Input() categoryNameAr = '';

  /**
   * Search results event
   *
   * @description Emits product search results when search completes
   */
  @Output() searchResults = new EventEmitter<ProductSearchResult[]>();

  /**
   * Search cleared event
   *
   * @description Emits when user clears the search
   */
  @Output() searchCleared = new EventEmitter<void>();

  /**
   * Loading state event
   *
   * @description Emits loading state changes
   */
  @Output() loading = new EventEmitter<boolean>();

  /** Category API service for search requests */
  private readonly categoryApi = inject(CategoryApiService);

  /** Destroy reference for subscription cleanup */
  private readonly destroyRef = inject(DestroyRef);

  /** Search query subject for debouncing */
  private readonly searchQuery$ = new Subject<string>();

  /**
   * Current search query
   *
   * @description Bound to search input field
   */
  searchQuery = signal('');

  /**
   * Search results
   *
   * @description Current product search results
   */
  results = signal<ProductSearchResult[]>([]);

  /**
   * Searching state
   *
   * @description True while API request is in progress
   */
  isSearching = signal(false);

  /**
   * Has searched flag
   *
   * @description True after first search attempt (for empty state)
   */
  hasSearched = signal(false);

  /**
   * RTL mode detection
   *
   * @description Computed signal that detects if the document is in RTL mode
   */
  isRtl = computed(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.dir === 'rtl';
    }
    return false;
  });

  /**
   * Search placeholder text
   *
   * @description Computed placeholder based on language and category name
   */
  placeholder = computed(() => {
    const isRtl = this.isRtl();
    const categoryName = isRtl ? this.categoryNameAr : this.categoryName;

    if (categoryName) {
      return isRtl
        ? `بحث في ${categoryName}`
        : `Search in ${categoryName}`;
    }

    return isRtl ? 'بحث عن منتجات' : 'Search for products';
  });

  /**
   * Show clear button
   *
   * @description Computed flag for displaying clear button
   */
  showClearButton = computed(() => {
    return this.searchQuery().trim().length > 0;
  });

  /**
   * Show empty state
   *
   * @description Computed flag for displaying empty state message
   */
  showEmptyState = computed(() => {
    return this.hasSearched() && !this.isSearching() && this.results().length === 0;
  });

  /**
   * Initialize component
   *
   * @description Sets up debounced search observable
   */
  ngOnInit(): void {
    this.setupSearchStream();
  }

  /**
   * Setup search stream with debounce
   *
   * @description Configures RxJS pipeline for debounced search with API calls
   */
  private setupSearchStream(): void {
    this.searchQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((query) => query.trim().length >= 2),
        switchMap((query) => {
          this.isSearching.set(true);
          this.hasSearched.set(true);
          this.loading.emit(true);

          return this.categoryApi.searchInCategory(
            this.categoryId,
            query.trim(),
            1,
            20
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.results.set(response.data);
          this.searchResults.emit(response.data);
          this.isSearching.set(false);
          this.loading.emit(false);
        },
        error: (error) => {
          console.error('Search error:', error);
          this.results.set([]);
          this.searchResults.emit([]);
          this.isSearching.set(false);
          this.loading.emit(false);
        },
      });
  }

  /**
   * Handle search input change
   *
   * @description Triggered on input change, updates signal and pushes to search stream
   * @param query - Search query string
   */
  onSearchInput(query: string): void {
    this.searchQuery.set(query);

    if (query.trim().length === 0) {
      this.clearSearch();
      return;
    }

    if (query.trim().length >= 2) {
      this.searchQuery$.next(query);
    } else {
      // Reset if below minimum length
      this.results.set([]);
      this.hasSearched.set(false);
      this.isSearching.set(false);
      this.loading.emit(false);
    }
  }

  /**
   * Clear search
   *
   * @description Resets search state and emits clear event
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.results.set([]);
    this.hasSearched.set(false);
    this.isSearching.set(false);
    this.loading.emit(false);
    this.searchCleared.emit();
  }

  /**
   * Handle Enter key press
   *
   * @description Triggers immediate search on Enter key
   * @param event - Keyboard event
   */
  onEnterPress(event: KeyboardEvent): void {
    event.preventDefault();
    const query = this.searchQuery().trim();

    if (query.length >= 2) {
      this.searchQuery$.next(query);
    }
  }

  /**
   * Handle Escape key press
   *
   * @description Clears search on Escape key
   * @param event - Keyboard event
   */
  onEscapePress(event: KeyboardEvent): void {
    event.preventDefault();
    this.clearSearch();
  }
}
