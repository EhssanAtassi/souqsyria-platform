import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  DestroyRef,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';

/**
 * User Search Component
 * 
 * @description Debounced search input for filtering users by name, email, or phone.
 * 
 * Features:
 * - Real-time search with configurable debounce
 * - Clear button
 * - Loading indicator
 * - Accessible with ARIA labels
 * - Keyboard shortcuts (ESC to clear)
 * 
 * @example
 * ```html
 * <app-user-search
 *   placeholder="Search by name, email, or phone..."
 *   [debounceTime]="400"
 *   (searchChange)="onSearchChange($event)">
 * </app-user-search>
 * ```
 */
@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-search.component.html',
  styleUrls: ['./user-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSearchComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Placeholder text for search input
   */
  @Input() placeholder = 'Search by name, email, or phone...';

  /**
   * Debounce time in milliseconds
   */
  @Input() debounceTime = 300;

  /**
   * Initial search value
   */
  @Input() set initialValue(value: string | null) {
    if (value) {
      this.searchControl.setValue(value, { emitEvent: false });
    }
  }

  /**
   * Loading state from parent
   */
  @Input() loading = false;

  /**
   * Emits search query changes
   */
  @Output() searchChange = new EventEmitter<string>();

  /**
   * Search form control
   */
  searchControl = new FormControl('');

  /**
   * Internal loading state for debounce
   */
  isSearching = false;

  /**
   * Initialize component
   * 
   * @description Sets up debounced search subscription.
   */
  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        tap(() => {
          this.isSearching = true;
        }),
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        tap(query => {
          this.isSearching = false;
          this.searchChange.emit(query?.trim() || '');
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Clear search input
   * 
   * @description Clears the search field and emits empty string.
   */
  clearSearch(): void {
    this.searchControl.setValue('');
    this.isSearching = false;
  }

  /**
   * Check if search has value
   * 
   * @returns True if search field is not empty
   */
  hasValue(): boolean {
    return !!this.searchControl.value?.trim();
  }

  /**
   * Handle keyboard shortcuts
   * 
   * @param event - Keyboard event
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.clearSearch();
    }
  }
}
