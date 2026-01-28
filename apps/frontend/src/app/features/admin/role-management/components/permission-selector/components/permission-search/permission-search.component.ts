/**
 * Permission Search Component
 *
 * @description
 * Provides a search input with debouncing, clear functionality, and keyboard shortcuts
 * for filtering permissions in the permission selector.
 *
 * Features:
 * - Debounced search (300ms)
 * - Clear button
 * - Results count display
 * - Keyboard shortcut (Ctrl/Cmd+F)
 * - Loading indicator
 * - Accessible ARIA labels
 *
 * @module RoleManagement/Components/PermissionSelector
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-permission-search
 *   [resultsCount]="filteredCount"
 *   [totalCount]="totalCount"
 *   [loading]="isSearching"
 *   (searchChange)="onSearchChange($event)"
 * ></app-permission-search>
 * ```
 */

import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/**
 * Permission Search Component
 *
 * @class PermissionSearchComponent
 *
 * @description
 * Reusable search bar for filtering permissions with real-time feedback
 * and keyboard shortcuts.
 */
@Component({
  selector: 'app-permission-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './permission-search.component.html',
  styleUrls: ['./permission-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionSearchComponent implements OnInit, OnDestroy {
  // ==========================================================================
  // INPUTS
  // ==========================================================================

  /**
   * Number of filtered results
   *
   * @description
   * Count of permissions matching the current search.
   * Used to display "X of Y results" message.
   */
  @Input() resultsCount = 0;

  /**
   * Total number of permissions
   *
   * @description
   * Total permission count before filtering.
   */
  @Input() totalCount = 0;

  /**
   * Loading state
   *
   * @description
   * Shows spinner when search is in progress.
   */
  @Input() loading = false;

  /**
   * Placeholder text
   *
   * @description
   * Custom placeholder for search input.
   */
  @Input() placeholder = 'Search permissions...';

  /**
   * Debounce time in milliseconds
   *
   * @description
   * Time to wait after user stops typing before emitting search event.
   */
  @Input() debounceTime = 300;

  /**
   * Show keyboard hint
   *
   * @description
   * Whether to show "Ctrl+F to focus" hint.
   */
  @Input() showKeyboardHint = true;

  // ==========================================================================
  // OUTPUTS
  // ==========================================================================

  /**
   * Search Change Event
   *
   * @description
   * Emits search term after debounce period.
   *
   * @event searchChange
   * @type {string} - Search query string
   */
  @Output() searchChange = new EventEmitter<string>();

  /**
   * Clear Event
   *
   * @description
   * Emits when clear button is clicked.
   *
   * @event clear
   */
  @Output() clear = new EventEmitter<void>();

  // ==========================================================================
  // VIEW CHILDREN
  // ==========================================================================

  /**
   * Search Input Element Reference
   *
   * @description
   * Direct reference to input element for focus management.
   */
  @ViewChild('searchInput', { static: true })
  searchInput!: ElementRef<HTMLInputElement>;

  // ==========================================================================
  // PUBLIC PROPERTIES
  // ==========================================================================

  /**
   * Search Form Control
   *
   * @description
   * Reactive form control for search input with debouncing.
   */
  searchControl = new FormControl('');

  /**
   * Has Search Term Signal
   *
   * @description
   * Reactive signal indicating if search term exists.
   */
  hasSearchTerm = signal(false);

  /**
   * Is Focused Signal
   *
   * @description
   * Tracks focus state for styling.
   */
  isFocused = signal(false);

  // ==========================================================================
  // PRIVATE PROPERTIES
  // ==========================================================================

  /**
   * Destroy Subject
   *
   * @description
   * Subject for cleanup on component destruction.
   *
   * @private
   */
  private destroy$ = new Subject<void>();

  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================

  /**
   * Component Initialization
   *
   * @description
   * Sets up search control subscription with debouncing and keyboard shortcuts.
   */
  ngOnInit(): void {
    this.setupSearchSubscription();
    this.setupKeyboardShortcuts();
  }

  /**
   * Component Cleanup
   *
   * @description
   * Unsubscribes from observables and cleans up event listeners.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================================================
  // SETUP METHODS
  // ==========================================================================

  /**
   * Setup Search Subscription
   *
   * @description
   * Subscribes to search control value changes with debouncing
   * and emits search events.
   *
   * @private
   */
  private setupSearchSubscription(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        const searchTerm = (value || '').trim();
        this.hasSearchTerm.set(searchTerm.length > 0);
        this.searchChange.emit(searchTerm);
      });
  }

  /**
   * Setup Keyboard Shortcuts
   *
   * @description
   * Registers keyboard event listeners for Ctrl/Cmd+F shortcut.
   *
   * @private
   */
  private setupKeyboardShortcuts(): void {
    // Listen for Ctrl+F or Cmd+F
    document.addEventListener('keydown', this.handleKeyboardShortcut);
  }

  /**
   * Handle Keyboard Shortcut
   *
   * @description
   * Focuses search input when Ctrl/Cmd+F is pressed.
   *
   * @param event - Keyboard event
   *
   * @private
   */
  private handleKeyboardShortcut = (event: KeyboardEvent): void => {
    // Ctrl+F (Windows/Linux) or Cmd+F (Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      this.focusSearch();
    }
  };

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /**
   * Clear Search
   *
   * @description
   * Clears search input and emits clear event.
   *
   * @public
   */
  onClear(): void {
    this.searchControl.setValue('');
    this.hasSearchTerm.set(false);
    this.clear.emit();
    this.focusSearch();
  }

  /**
   * Focus Search Input
   *
   * @description
   * Programmatically focuses the search input.
   *
   * @public
   */
  focusSearch(): void {
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  /**
   * Handle Input Focus
   *
   * @description
   * Updates focused state signal.
   *
   * @public
   */
  onFocus(): void {
    this.isFocused.set(true);
  }

  /**
   * Handle Input Blur
   *
   * @description
   * Updates focused state signal.
   *
   * @public
   */
  onBlur(): void {
    this.isFocused.set(false);
  }

  // ==========================================================================
  // COMPUTED PROPERTIES
  // ==========================================================================

  /**
   * Get Results Text
   *
   * @description
   * Generates results count text for display.
   *
   * @returns Results text (e.g., "5 of 20 results")
   *
   * @public
   */
  getResultsText(): string {
    if (!this.hasSearchTerm()) {
      return `${this.totalCount} permissions`;
    }

    if (this.resultsCount === 0) {
      return 'No results found';
    }

    if (this.resultsCount === this.totalCount) {
      return `All ${this.totalCount} permissions`;
    }

    return `${this.resultsCount} of ${this.totalCount} results`;
  }

  /**
   * Should Show Results Count
   *
   * @description
   * Determines if results count should be displayed.
   *
   * @returns True if results count should be shown
   *
   * @public
   */
  shouldShowResultsCount(): boolean {
    return this.totalCount > 0;
  }

  /**
   * Get Clear Button Aria Label
   *
   * @description
   * Generates accessible label for clear button.
   *
   * @returns ARIA label text
   *
   * @public
   */
  getClearButtonAriaLabel(): string {
    return 'Clear search';
  }

  /**
   * Get Search Input Aria Label
   *
   * @description
   * Generates accessible label for search input.
   *
   * @returns ARIA label text
   *
   * @public
   */
  getSearchInputAriaLabel(): string {
    return `Search ${this.totalCount} permissions`;
  }
}
