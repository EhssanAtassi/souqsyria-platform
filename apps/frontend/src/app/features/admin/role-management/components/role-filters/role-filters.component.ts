/**
 * Role Filters Component
 *
 * @description
 * Filter panel with reactive form for filtering roles.
 *
 * @features
 * - System/custom role filter
 * - Active status filter
 * - Priority range filter
 * - Sort options
 * - Apply/Reset buttons
 */

import { Component, output, signal, DestroyRef, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-role-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatRadioModule
  ],
  templateUrl: './role-filters.component.html',
  styleUrls: ['./role-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  filterChange = output<any>();

  filterForm: FormGroup;
  minPriority = signal(1);
  maxPriority = signal(100);

  constructor() {
    this.filterForm = this.fb.group({
      isActive: [null],
      isSystem: [null],
      minPriority: [1],
      maxPriority: [100],
      sortBy: ['priority'],
      sortOrder: ['DESC']
    });
  }

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  applyFilters(): void {
    const values = this.filterForm.value;
    this.filterChange.emit({
      isActive: values.isActive,
      isSystem: values.isSystem,
      minPriority: values.minPriority,
      maxPriority: values.maxPriority,
      sortBy: values.sortBy,
      sortOrder: values.sortOrder
    });
  }

  resetFilters(): void {
    this.filterForm.reset({
      isActive: null,
      isSystem: null,
      minPriority: 1,
      maxPriority: 100,
      sortBy: 'priority',
      sortOrder: 'DESC'
    });
    this.minPriority.set(1);
    this.maxPriority.set(100);
  }

  onMinPriorityChange(value: number): void {
    this.minPriority.set(value);
    this.filterForm.patchValue({ minPriority: value });
  }

  onMaxPriorityChange(value: number): void {
    this.maxPriority.set(value);
    this.filterForm.patchValue({ maxPriority: value });
  }
}
