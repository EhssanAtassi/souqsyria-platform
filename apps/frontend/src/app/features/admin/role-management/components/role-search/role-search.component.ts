/**
 * Role Search Component
 *
 * @description
 * Debounced search input for filtering roles by name or description.
 *
 * @features
 * - 300ms debounce
 * - Search icon
 * - Clear button
 * - Loading indicator (optional)
 */

import { Component, output, signal, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-role-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './role-search.component.html',
  styleUrls: ['./role-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleSearchComponent {
  private readonly destroyRef = inject(DestroyRef);

  searchControl = new FormControl('');
  search = output<string>();

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        this.search.emit(value || '');
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}
