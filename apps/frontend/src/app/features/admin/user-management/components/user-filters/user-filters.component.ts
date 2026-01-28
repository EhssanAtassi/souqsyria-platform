import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

import { UserFilter, UserStatus, BusinessRole } from '../../models';
import { USER_STATUS_OPTIONS, BUSINESS_ROLE_OPTIONS } from '../../constants';

/**
 * User Filters Component
 * 
 * @description Filter form for users with multiple criteria.
 * 
 * Features:
 * - Status multi-select (Active, Banned, Suspended, Inactive)
 * - Business role multi-select
 * - Admin role filter (has/doesn't have)
 * - Date range picker (created after/before)
 * - Clear all button
 * - Collapsible sections
 * - Applied filters display
 * 
 * @example
 * ```html
 * <app-user-filters
 *   [initialFilter]="currentFilter"
 *   (filterChange)="onFilterChange($event)">
 * </app-user-filters>
 * ```
 */
@Component({
  selector: 'app-user-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatExpansionModule,
    MatChipsModule
  ],
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFiltersComponent implements OnInit {
  /**
   * Initial filter values
   */
  @Input() set initialFilter(value: UserFilter | null) {
    if (value && this.filterForm) {
      this.filterForm.patchValue({
        status: value.status || [],
        roles: value.roles || [],
        hasAdminRole: value.hasAdminRole,
        createdAfter: value.createdAfter,
        createdBefore: value.createdBefore
      }, { emitEvent: false });
    }
  }

  /**
   * Emits filter changes
   */
  @Output() filterChange = new EventEmitter<UserFilter>();

  /**
   * Filter form
   */
  filterForm!: FormGroup;

  /**
   * Status options from constants
   */
  statusOptions = USER_STATUS_OPTIONS;

  /**
   * Business role options from constants
   */
  businessRoleOptions = BUSINESS_ROLE_OPTIONS;

  /**
   * Admin role options
   */
  adminRoleOptions = [
    { value: true, label: 'Has Admin Role', icon: 'check_circle' },
    { value: false, label: 'No Admin Role', icon: 'cancel' },
    { value: undefined, label: 'Any', icon: 'remove_circle' }
  ];

  /**
   * Expansion panel states
   */
  statusExpanded = true;
  rolesExpanded = false;
  datesExpanded = false;

  constructor(private fb: FormBuilder) {}

  /**
   * Initialize component
   * 
   * @description Creates filter form and subscribes to changes.
   */
  ngOnInit(): void {
    this.createForm();
    this.subscribeToChanges();
  }

  /**
   * Create filter form
   * 
   * @description Initializes FormGroup with all filter controls.
   * 
   * @private
   */
  private createForm(): void {
    this.filterForm = this.fb.group({
      status: [[]],
      roles: [[]],
      hasAdminRole: [undefined],
      createdAfter: [null],
      createdBefore: [null]
    });
  }

  /**
   * Subscribe to form changes
   * 
   * @description Emits filter changes with debounce.
   * 
   * @private
   */
  private subscribeToChanges(): void {
    // Auto-apply filters on change (no manual apply button needed)
    this.filterForm.valueChanges.subscribe(values => {
      this.emitFilter();
    });
  }

  /**
   * Emit current filter
   * 
   * @description Builds UserFilter object and emits it.
   * 
   * @private
   */
  private emitFilter(): void {
    const values = this.filterForm.value;
    
    const filter: UserFilter = {
      status: values.status?.length > 0 ? values.status : undefined,
      roles: values.roles?.length > 0 ? values.roles : undefined,
      hasAdminRole: values.hasAdminRole,
      createdAfter: values.createdAfter || undefined,
      createdBefore: values.createdBefore || undefined
    };

    this.filterChange.emit(filter);
  }

  /**
   * Clear all filters
   * 
   * @description Resets form to default values.
   */
  clearAll(): void {
    this.filterForm.reset({
      status: [],
      roles: [],
      hasAdminRole: undefined,
      createdAfter: null,
      createdBefore: null
    });
  }

  /**
   * Check if any filter is applied
   * 
   * @returns True if at least one filter has value
   */
  hasActiveFilters(): boolean {
    const values = this.filterForm.value;
    
    return (
      (values.status?.length > 0) ||
      (values.roles?.length > 0) ||
      (values.hasAdminRole !== undefined) ||
      !!values.createdAfter ||
      !!values.createdBefore
    );
  }

  /**
   * Get count of active filters
   * 
   * @returns Number of active filters
   */
  getActiveFilterCount(): number {
    let count = 0;
    const values = this.filterForm.value;
    
    if (values.status?.length > 0) count++;
    if (values.roles?.length > 0) count++;
    if (values.hasAdminRole !== undefined) count++;
    if (values.createdAfter) count++;
    if (values.createdBefore) count++;
    
    return count;
  }

  /**
   * Remove specific filter
   * 
   * @description Clears a single filter criterion.
   * 
   * @param filterKey - Filter key to clear
   */
  removeFilter(filterKey: string): void {
    switch (filterKey) {
      case 'status':
      case 'roles':
        this.filterForm.patchValue({ [filterKey]: [] });
        break;
      case 'hasAdminRole':
        this.filterForm.patchValue({ hasAdminRole: undefined });
        break;
      case 'createdAfter':
      case 'createdBefore':
        this.filterForm.patchValue({ [filterKey]: null });
        break;
    }
  }

  /**
   * Get display text for filter value
   * 
   * @param filterKey - Filter key
   * @returns Display text
   */
  getFilterDisplayText(filterKey: string): string {
    const values = this.filterForm.value;
    
    switch (filterKey) {
      case 'status':
        return values.status?.length > 0 
          ? `${values.status.length} status${values.status.length > 1 ? 'es' : ''}`
          : '';
      case 'roles':
        return values.roles?.length > 0 
          ? `${values.roles.length} role${values.roles.length > 1 ? 's' : ''}`
          : '';
      case 'hasAdminRole':
        return values.hasAdminRole === true 
          ? 'Has Admin Role' 
          : values.hasAdminRole === false 
            ? 'No Admin Role'
            : '';
      case 'createdAfter':
        return values.createdAfter 
          ? `After ${new Date(values.createdAfter).toLocaleDateString()}`
          : '';
      case 'createdBefore':
        return values.createdBefore 
          ? `Before ${new Date(values.createdBefore).toLocaleDateString()}`
          : '';
      default:
        return '';
    }
  }

  /**
   * Get status option label
   * 
   * @param status - Status value
   * @returns Display label
   */
  getStatusLabel(status: UserStatus): string {
    return this.statusOptions.find(opt => opt.value === status)?.label || status;
  }

  /**
   * Get role option label
   * 
   * @param role - Role value
   * @returns Display label
   */
  getRoleLabel(role: BusinessRole): string {
    return this.businessRoleOptions.find(opt => opt.value === role)?.label || role;
  }

  /**
   * Format date for display
   * 
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
