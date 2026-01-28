/**
 * Audit Filters Component
 * 
 * @description Filter form for audit log queries.
 * Provides controls for filtering by action, status, date range, and search.
 * 
 * @example
 * ```html
 * <app-audit-filters />
 * ```
 */

import { Component, inject, ChangeDetectionStrategy, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { SecurityAuditService } from '../../state/security-audit.service';
import { SecurityAuditAction } from '../../models';

@Component({
  selector: 'app-audit-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './audit-filters.component.html',
  styleUrls: ['./audit-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SecurityAuditService);
  private readonly destroyRef = inject(DestroyRef);

  /** Filter form */
  filterForm!: FormGroup;

  /** Available actions */
  actions = ['ALL', ...Object.values(SecurityAuditAction)];

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToFormChanges();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      action: ['ALL'],
      success: ['ALL'],
      startDate: [null],
      endDate: [null],
      searchTerm: [''],
    });
  }

  private subscribeToFormChanges(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.service.applyFilters({
          action: value.action,
          success: value.success,
          userId: null,
          dateRange: {
            start: value.startDate,
            end: value.endDate,
          },
          resourceType: null,
          searchTerm: value.searchTerm,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      });
  }

  clearFilters(): void {
    this.filterForm.reset({
      action: 'ALL',
      success: 'ALL',
      startDate: null,
      endDate: null,
      searchTerm: '',
    });
  }
}
