import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdvancedSearchService } from '../../services/advanced-search.service';
import { SearchSuggestion } from '../../interfaces/search.interface';

/**
 * Advanced Search Component
 *
 * Full-featured search component with:
 * - Real-time autocomplete suggestions
 * - Search history (localStorage)
 * - Popular searches
 * - Voice search integration
 * - Category-specific search
 * - Bilingual support (English/Arabic)
 * - Keyboard navigation
 *
 * UX Features:
 * - Debounced search (300ms) for performance
 * - Visual suggestion types (product, category, recent, popular)
 * - Clear search button
 * - Keyboard shortcuts (Escape to clear)
 * - Loading states
 * - Empty states with helpful suggestions
 *
 * @example
 * ```html
 * <app-advanced-search
 *   (search)="handleSearch($event)"
 *   (suggestionSelected)="handleSuggestion($event)">
 * </app-advanced-search>
 * ```
 */
@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatAutocompleteModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss']
})
export class AdvancedSearchComponent implements OnInit {
  private searchService = inject(AdvancedSearchService);
  private destroyRef = inject(DestroyRef);

  // Outputs
  readonly search = output<string>();
  readonly suggestionSelected = output<SearchSuggestion>();

  // Component state signals
  readonly searchQuery = this.searchService.searchQuery;
  readonly isSearching = this.searchService.isSearching;
  readonly suggestions = signal<SearchSuggestion[]>([]);
  readonly showSuggestions = signal<boolean>(false);
  readonly isVoiceSearching = signal<boolean>(false);
  readonly voiceSearchSupported = signal<boolean>(this.checkVoiceSearchSupport());

  // Recent and popular searches
  readonly recentSearches = this.searchService.recentSearches;
  readonly popularSearches = this.searchService.popularSearches;

  // Computed
  readonly hasSearchQuery = computed(() => this.searchQuery().length > 0);
  readonly displaySuggestions = computed(() =>
    this.showSuggestions() && (this.suggestions().length > 0 || this.hasDefaultSuggestions())
  );

  ngOnInit(): void {
    this.setupSearchSubscription();
  }

  /**
   * Setup search query subscription with debouncing
   */
  private setupSearchSubscription(): void {
    this.searchService.searchQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(query => {
        this.updateSuggestions(query);
      });
  }

  /**
   * Handle search input change
   */
  onSearchInput(value: string): void {
    this.searchService.updateSearchQuery(value);
    this.showSuggestions.set(true);
  }

  /**
   * Handle search submission
   */
  onSearch(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      this.search.emit(query);
      this.showSuggestions.set(false);
    }
  }

  /**
   * Handle suggestion selection
   */
  onSuggestionClick(suggestion: SearchSuggestion): void {
    this.searchService.updateSearchQuery(suggestion.text);
    this.suggestionSelected.emit(suggestion);
    this.showSuggestions.set(false);
  }

  /**
   * Handle recent search selection
   */
  onRecentSearchClick(query: string): void {
    this.searchService.updateSearchQuery(query);
    this.onSearch();
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchService.clearSearchQuery();
    this.suggestions.set([]);
    this.showSuggestions.set(false);
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.searchService.clearHistory();
  }

  /**
   * Remove item from history
   */
  removeFromHistory(query: string, event: Event): void {
    event.stopPropagation();
    this.searchService.removeFromHistory(query);
  }

  /**
   * Start voice search
   */
  startVoiceSearch(): void {
    if (!this.voiceSearchSupported()) return;

    this.isVoiceSearching.set(true);

    this.searchService.startVoiceSearch('en')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.searchService.updateSearchQuery(result.transcript);
          this.onSearch();
          this.isVoiceSearching.set(false);
        },
        error: (error) => {
          console.error('Voice search error:', error);
          this.isVoiceSearching.set(false);
        }
      });
  }

  /**
   * Handle input focus
   */
  onFocus(): void {
    this.showSuggestions.set(true);
    if (!this.hasSearchQuery()) {
      this.suggestions.set(this.searchService.getSuggestions(''));
    }
  }

  /**
   * Handle input blur
   */
  onBlur(): void {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  /**
   * Handle keyboard events
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.clearSearch();
    } else if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  /**
   * Update suggestions based on query
   */
  private updateSuggestions(query: string): void {
    const newSuggestions = this.searchService.getSuggestions(query);
    this.suggestions.set(newSuggestions);
  }

  /**
   * Check if has default suggestions
   */
  private hasDefaultSuggestions(): boolean {
    return this.recentSearches().length > 0 || this.popularSearches().length > 0;
  }

  /**
   * Check voice search support
   */
  private checkVoiceSearchSupport(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Get suggestion type icon
   */
  getSuggestionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      product: 'shopping_bag',
      category: 'category',
      brand: 'store',
      recent: 'history',
      popular: 'trending_up'
    };
    return icons[type] || 'search';
  }

  /**
   * Get suggestion type label
   */
  getSuggestionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      product: 'Product',
      category: 'Category',
      brand: 'Brand',
      recent: 'Recent',
      popular: 'Popular'
    };
    return labels[type] || '';
  }
}
