import {
  Component, Input, Output, EventEmitter, OnInit, DestroyRef,
  inject, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, of, tap, map } from 'rxjs';

import { HeaderApiService } from '../../../../services/header-api.service';
import { SearchSuggestion, RecentSearch } from '../../../../interfaces/header.interfaces';
import { ProductService } from '../../../../../features/products/services/product.service';

/**
 * Search Bar Component
 *
 * @description Standalone search bar with autocomplete dropdown matching the prototype.
 * Features include:
 * - 300ms debounced input triggering API suggestions
 * - Recent searches section shown on focus with empty query
 * - Keyboard navigation (ArrowUp/Down, Enter, Escape)
 * - Focus ring and hover states matching prototype
 *
 * @swagger
 * components:
 *   schemas:
 *     SearchBarProps:
 *       type: object
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         isRtl:
 *           type: boolean
 *
 * @example
 * ```html
 * <app-search-bar
 *   [language]="'en'"
 *   (searchSubmit)="onSearch($event)">
 * </app-search-bar>
 * ```
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent implements OnInit {
  /** Current language */
  @Input() language: 'en' | 'ar' = 'en';

  /** Whether RTL layout is active */
  @Input() isRtl = false;

  /** Emitted when a search is submitted (enter or suggestion click) */
  @Output() searchSubmit = new EventEmitter<string>();

  /** Reference to the search input element */
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  /** Search form group */
  searchForm!: FormGroup;

  /** Current search suggestions from API */
  suggestions: SearchSuggestion[] = [];

  /** Recent searches shown on empty focus */
  recentSearches: RecentSearch[] = [];

  /** Whether the dropdown is visible */
  dropdownOpen = false;

  /** Currently highlighted item index for keyboard nav (-1 = none) */
  highlightedIndex = -1;

  /** Whether we're showing recent searches vs suggestions */
  showingRecent = false;

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly headerApi = inject(HeaderApiService);
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Placeholder text based on language */
  get placeholder(): string {
    return this.language === 'ar'
      ? 'ابحث عن المنتجات، الماركات، الفئات...'
      : 'Search products, brands, categories...';
  }

  /** Aria label for search button */
  get searchAriaLabel(): string {
    return this.language === 'ar' ? 'بحث' : 'Search';
  }

  ngOnInit(): void {
    this.searchForm = this.fb.group({ query: [''] });
    this.setupSearchSubscription();
    this.loadRecentSearches();
  }

  /**
   * Handle search form submission
   * @description Emits the search query and closes dropdown
   * @param event - Optional form event
   */
  onSubmit(event?: Event): void {
    event?.preventDefault();
    const query = this.searchForm.get('query')?.value?.trim();
    if (query) {
      this.searchSubmit.emit(query);
      this.headerApi.saveRecentSearch(query).subscribe();
      this.closeDropdown();
    }
  }

  /**
   * Handle input focus
   * @description Shows recent searches if query is empty
   */
  onInputFocus(): void {
    const query = this.searchForm.get('query')?.value?.trim();
    if (!query) {
      this.showingRecent = true;
      this.dropdownOpen = this.recentSearches.length > 0;
    } else if (this.suggestions.length > 0) {
      this.dropdownOpen = true;
    }
    this.cdr.markForCheck();
  }

  /**
   * Handle input blur with delay for click events
   * @description Closes dropdown after a short delay to allow click handlers
   */
  onInputBlur(): void {
    setTimeout(() => {
      this.closeDropdown();
      this.cdr.markForCheck();
    }, 200);
  }

  /**
   * Handle keyboard navigation within dropdown
   * @description Manages ArrowUp/Down, Enter, and Escape keys
   * @param event - Keyboard event
   */
  onKeydown(event: KeyboardEvent): void {
    if (!this.dropdownOpen) return;

    const itemCount = this.showingRecent ? this.recentSearches.length : this.suggestions.length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, itemCount - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0) {
          if (this.showingRecent) {
            this.selectRecent(this.recentSearches[this.highlightedIndex]);
          } else {
            this.selectSuggestion(this.suggestions[this.highlightedIndex]);
          }
        } else {
          this.onSubmit();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
    }
    this.cdr.markForCheck();
  }

  /**
   * Select a search suggestion
   * @description Sets query to suggestion text, submits search, closes dropdown
   * @param suggestion - Selected suggestion
   */
  selectSuggestion(suggestion: SearchSuggestion): void {
    this.searchForm.patchValue({ query: suggestion.text });
    this.searchSubmit.emit(suggestion.text);
    this.headerApi.saveRecentSearch(suggestion.text).subscribe();
    this.closeDropdown();
  }

  /**
   * Select a recent search
   * @description Sets query to recent search text and submits
   * @param recent - Selected recent search
   */
  selectRecent(recent: RecentSearch): void {
    this.searchForm.patchValue({ query: recent.query });
    this.searchSubmit.emit(recent.query);
    this.closeDropdown();
  }

  /**
   * Delete a recent search entry
   * @description Removes entry from history and updates list
   * @param event - Click event (stopPropagation)
   * @param recent - Recent search to delete
   */
  deleteRecent(event: Event, recent: RecentSearch): void {
    event.stopPropagation();
    this.headerApi.deleteRecentSearch(recent.id).subscribe(() => {
      this.recentSearches = this.recentSearches.filter(r => r.id !== recent.id);
      if (this.recentSearches.length === 0) {
        this.closeDropdown();
      }
      this.cdr.markForCheck();
    });
  }

  /**
   * Clear all recent searches
   * @description Removes all recent search history
   */
  clearAllRecent(): void {
    this.headerApi.clearRecentSearches().subscribe(() => {
      this.recentSearches = [];
      this.closeDropdown();
      this.cdr.markForCheck();
    });
  }

  /**
   * Get icon name for suggestion type
   * @description Returns appropriate Material icon based on suggestion type
   * @param type - Suggestion type
   * @returns Material icon name
   */
  getSuggestionIcon(type: SearchSuggestion['type']): string {
    switch (type) {
      case 'product': return 'shopping_bag';
      case 'category': return 'category';
      case 'brand': return 'store';
      case 'query': return 'search';
      default: return 'search';
    }
  }

  /** Close the dropdown and reset highlight */
  private closeDropdown(): void {
    this.dropdownOpen = false;
    this.highlightedIndex = -1;
  }

  /** Set up debounced search subscription */
  private setupSearchSubscription(): void {
    this.searchForm.get('query')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        const trimmed = query?.trim() || '';
        if (trimmed.length < 2) {
          this.suggestions = [];
          this.showingRecent = true;
          this.dropdownOpen = this.recentSearches.length > 0 && document.activeElement === this.searchInput?.nativeElement;
          return of([]);
        }
        this.showingRecent = false;
        return this.productService.getSearchSuggestions(trimmed).pipe(
          map(response => response.suggestions.map(item => ({
            text: this.language === 'ar'
              ? (item.textAr || item.text)
              : (item.text || item.textAr),
            type: item.type as SearchSuggestion['type'],
            url: item.slug
              ? (item.type === 'product' ? `/products/${item.slug}` : `/category/${item.slug}`)
              : undefined,
            imageUrl: item.imageUrl ?? undefined,
            price: item.price ?? null,
            currency: item.currency ?? 'SYP',
          } as SearchSuggestion)))
        );
      }),
      tap(suggestions => {
        if (!this.showingRecent) {
          this.suggestions = suggestions;
          this.dropdownOpen = suggestions.length > 0;
          this.highlightedIndex = -1;
        }
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  /** Load recent searches on init */
  private loadRecentSearches(): void {
    this.headerApi.getRecentSearches().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(searches => {
      this.recentSearches = searches;
      this.cdr.markForCheck();
    });
  }

  /**
   * @description Formats suggestion price for display in dropdown
   * @param price - Price value
   * @param currency - Currency code (default: SYP)
   * @returns Formatted price string
   */
  formatSuggestionPrice(price: number | null | undefined, currency?: string): string {
    if (!price) return '';
    if (currency === 'SYP' || !currency) {
      return `${price.toLocaleString('ar-SY')} ل.س`;
    }
    return `$${price.toLocaleString('en-US')}`;
  }

  /**
   * @description Highlights matching text in suggestion
   * @param text - Original suggestion text
   * @returns HTML string with matched portion wrapped in <strong>
   * Text is HTML-escaped before highlighting to prevent XSS
   */
  highlightMatch(text: string): string {
    const query = this.searchForm.get('query')?.value?.trim();
    if (!query || query.length < 2) {
      return this.escapeHtml(text);
    }
    const escapedText = this.escapeHtml(text);
    const escapedQuery = this.escapeHtml(query);
    const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapedText.replace(regex, '<strong>$1</strong>');
  }

  /**
   * @description Escapes HTML special characters to prevent XSS
   * @param text - Text to escape
   * @returns HTML-escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
