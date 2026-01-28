import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, startWith, map } from 'rxjs';

import { Route } from '../../models';

/**
 * Permission for autocomplete (minimal interface)
 */
interface PermissionOption {
  id: string;
  name: string;
  icon?: string;
}

/**
 * PermissionLinkEditorComponent
 *
 * Inline permission selector with link/unlink actions.
 * Supports two states:
 * - Linked: Shows permission chip with remove button
 * - Unlinked: Shows autocomplete input with suggestions
 *
 * @features
 * - Permission autocomplete with search
 * - Linked state with removable chip
 * - AI suggested permission display
 * - Loading state during operations
 * - Quick apply for suggestions
 * - Material Design components
 *
 * @example
 * ```html
 * <app-permission-link-editor
 *   [route]="route"
 *   (linked)="onPermissionLinked($event)"
 *   (unlinked)="onPermissionUnlinked()"
 * />
 * ```
 *
 * @remarks
 * Component is typically used in table cells or list items
 * for inline permission management.
 */
@Component({
  selector: 'app-permission-link-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './permission-link-editor.component.html',
  styleUrls: ['./permission-link-editor.component.scss']
})
export class PermissionLinkEditorComponent implements OnInit {
  /**
   * Route to edit permission for
   */
  @Input({ required: true }) route!: Route;

  /**
   * Emitted when permission is linked
   */
  @Output() linked = new EventEmitter<string>();

  /**
   * Emitted when permission is unlinked
   */
  @Output() unlinked = new EventEmitter<void>();

  /**
   * Loading state signal
   */
  readonly loading = signal(false);

  /**
   * Search form control for autocomplete
   */
  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  /**
   * Mock permissions for autocomplete
   * TODO: Replace with actual permission service integration
   */
  private readonly mockPermissions: PermissionOption[] = [
    { id: '1', name: 'users:read', icon: 'visibility' },
    { id: '2', name: 'users:write', icon: 'edit' },
    { id: '3', name: 'users:delete', icon: 'delete' },
    { id: '4', name: 'roles:read', icon: 'visibility' },
    { id: '5', name: 'roles:write', icon: 'edit' },
    { id: '6', name: 'permissions:read', icon: 'visibility' }
  ];

  /**
   * Filtered permissions for autocomplete
   */
  filteredPermissions$!: Observable<PermissionOption[]>;

  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.setupPermissionAutocomplete();
  }

  /**
   * Setup permission autocomplete filtering
   *
   * @private
   */
  private setupPermissionAutocomplete(): void {
    this.filteredPermissions$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPermissions(value || ''))
    );
  }

  /**
   * Filter permissions based on search input
   *
   * @param value - Search term
   * @returns Filtered permission list
   *
   * @private
   */
  private _filterPermissions(value: string): PermissionOption[] {
    const filterValue = value.toLowerCase();
    return this.mockPermissions.filter(permission =>
      permission.name.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Handle permission linking
   *
   * @param permissionId - Permission ID to link
   *
   * @public
   */
  link(permissionId: string): void {
    this.loading.set(true);
    this.linked.emit(permissionId);

    // Clear search after linking
    this.searchControl.setValue('');

    // Reset loading after operation
    // Note: Parent should handle actual loading state
    setTimeout(() => this.loading.set(false), 100);
  }

  /**
   * Handle permission unlinking
   *
   * @public
   */
  unlink(): void {
    this.loading.set(true);
    this.unlinked.emit();

    // Reset loading after operation
    // Note: Parent should handle actual loading state
    setTimeout(() => this.loading.set(false), 100);
  }

  /**
   * Get permission name from ID
   *
   * @param permissionId - Permission ID
   * @returns Permission display name
   *
   * @public
   */
  getPermissionName(permissionId: string | null): string {
    if (!permissionId) {
      return '';
    }

    const permission = this.mockPermissions.find(p => p.id === permissionId);
    return permission ? permission.name : 'Unknown Permission';
  }

  /**
   * Get suggested permission name
   *
   * @returns Suggested permission display name
   *
   * @public
   */
  getSuggestedName(): string {
    if (!this.route.suggestedPermission) {
      return '';
    }

    return this.route.suggestedPermission;
  }

  /**
   * Apply AI-suggested permission
   *
   * @public
   */
  applySuggestion(): void {
    if (this.route.suggestedPermission) {
      // Find permission by name (mock implementation)
      const permission = this.mockPermissions.find(
        p => p.name === this.route.suggestedPermission
      );

      if (permission) {
        this.link(permission.id);
      }
    }
  }
}
