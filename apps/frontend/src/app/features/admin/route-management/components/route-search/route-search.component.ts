import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RouteManagementService } from '../../state/route-management.service';

/**
 * RouteSearchComponent
 *
 * Debounced search input for filtering routes by:
 * - Path pattern (e.g., "/api/users", "/auth/*")
 * - Controller name (e.g., "UserController")
 * - Handler method (e.g., "findAll", "create")
 *
 * @features
 * - 300ms debounce to reduce API calls
 * - Clear button when input has value
 * - Material Design styling
 * - Automatic cleanup with takeUntilDestroyed
 *
 * @example
 * ```html
 * <app-route-search />
 * ```
 *
 * @remarks
 * Search is case-insensitive and performs substring matching.
 * Empty search clears the filter.
 */
@Component({
  selector: 'app-route-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './route-search.component.html',
  styleUrls: ['./route-search.component.scss']
})
export class RouteSearchComponent {
  /**
   * Dependency injection
   */
  private readonly service = inject(RouteManagementService);

  /**
   * Search input form control
   *
   * Bound to input field with two-way binding
   */
  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  constructor() {
    // Subscribe to search input changes with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit when value actually changes
        takeUntilDestroyed() // Auto-cleanup on component destroy
      )
      .subscribe(searchTerm => {
        this.onSearchChange(searchTerm);
      });
  }

  /**
   * Handle search term change
   *
   * Updates the filter in the service, which triggers
   * automatic data refresh via the state layer.
   *
   * @param searchTerm - User input search text
   *
   * @private
   */
  private onSearchChange(searchTerm: string): void {
    this.service.updateFilters({ searchTerm: searchTerm.trim() });
  }

  /**
   * Clear search input
   *
   * Resets the search control to empty string,
   * which triggers filter update via valueChanges subscription.
   *
   * @public
   */
  clear(): void {
    this.searchControl.setValue('');
  }

  /**
   * Check if search has value
   *
   * Used to conditionally show/hide clear button
   *
   * @returns True if search input is not empty
   *
   * @public
   */
  hasValue(): boolean {
    return this.searchControl.value.trim().length > 0;
  }
}
