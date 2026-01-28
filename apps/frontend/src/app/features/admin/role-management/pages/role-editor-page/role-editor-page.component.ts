/**
 * Role Editor Page Component
 *
 * @description
 * Full-page role editor for creating and editing roles.
 * Supports both create and edit modes with form validation.
 *
 * @features
 * - Create new role or edit existing
 * - Basic information form (name, description, priority, system flag)
 * - Permission selector integration
 * - Template support with pre-filled data
 * - Form validation with error messages
 * - Unsaved changes guard
 * - Sticky action bar
 * - Breadcrumb navigation
 * - Loading and saving states
 *
 * @architecture
 * - Smart container component
 * - Reactive forms with validation
 * - OnPush change detection
 * - Router integration
 * - Akita state management
 *
 * @routes
 * - /admin/roles/new (create mode)
 * - /admin/roles/:id/edit (edit mode)
 *
 * @swagger
 * paths:
 *   /admin/roles/new:
 *     get:
 *       summary: Create new role
 *       description: Full-page role creation form
 *   /admin/roles/:id/edit:
 *     get:
 *       summary: Edit existing role
 *       description: Full-page role editor form
 *
 * @example
 * ```html
 * <app-role-editor-page></app-role-editor-page>
 * ```
 */

import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { RoleManagementService } from '../../state/role-management.service';
import { RoleManagementQuery } from '../../state/role-management.query';
import { CreateRoleDto, UpdateRoleDto, Role, RoleTemplate } from '../../models';
import { PermissionSelectorComponent } from '../../components/permission-selector/permission-selector.component';

/**
 * Role Editor Page Component
 *
 * @class RoleEditorPageComponent
 * @implements {OnInit}
 */
@Component({
  selector: 'app-role-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatSnackBarModule,
    PermissionSelectorComponent,
  ],
  templateUrl: './role-editor-page.component.html',
  styleUrls: ['./role-editor-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleEditorPageComponent implements OnInit {
  /**
   * Injected dependencies
   *
   * @private
   * @readonly
   */
  private readonly service = inject(RoleManagementService);
  private readonly query = inject(RoleManagementQuery);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Editor mode
   *
   * @description
   * Determines if component is in create or edit mode.
   *
   * @public
   */
  mode = signal<'create' | 'edit'>('create');

  /**
   * Role ID (edit mode only)
   *
   * @description
   * ID of role being edited.
   *
   * @public
   */
  roleId = signal<number | null>(null);

  /**
   * Loading state
   *
   * @description
   * Whether data is being loaded.
   *
   * @public
   */
  loading = signal(false);

  /**
   * Saving state
   *
   * @description
   * Whether form is being submitted.
   *
   * @public
   */
  saving = signal(false);

  /**
   * Role data (edit mode)
   *
   * @description
   * Existing role data for editing.
   *
   * @public
   */
  roleData = signal<Role | null>(null);

  /**
   * Selected permissions
   *
   * @description
   * Permission IDs selected in permission selector.
   *
   * @public
   */
  selectedPermissions = signal<string[]>([]);

  /**
   * Form validity signal
   *
   * @description
   * Combined form and permissions validity.
   *
   * @public
   */
  isFormValid = computed(() => {
    return this.roleForm.valid && this.selectedPermissions().length > 0;
  });

  /**
   * Permission count signal
   *
   * @description
   * Number of selected permissions.
   *
   * @public
   */
  permissionCount = computed(() => this.selectedPermissions().length);

  /**
   * Breadcrumb title
   *
   * @description
   * Dynamic breadcrumb based on mode.
   *
   * @public
   */
  breadcrumbTitle = computed(() => {
    if (this.mode() === 'create') {
      return 'Create New Role';
    }
    const role = this.roleData();
    return role ? `Edit: ${role.displayName}` : 'Edit Role';
  });

  /**
   * Role form
   *
   * @description
   * Reactive form for role basic information.
   *
   * @public
   */
  roleForm!: FormGroup;

  /**
   * Summary expansion state
   *
   * @description
   * Whether summary card is expanded.
   *
   * @public
   */
  summaryExpanded = signal(false);

  /**
   * Observable streams
   *
   * @description
   * Reactive data from Akita store.
   *
   * @public
   * @readonly
   */
  readonly permissions$ = this.query.cachedPermissions$;

  /**
   * Initialize component
   *
   * @description
   * Sets up form, loads data based on mode.
   *
   * @public
   */
  ngOnInit(): void {
    this.initializeForm();
    this.loadRouteData();
    this.loadPermissionsIfNeeded();
  }

  /**
   * Initialize role form
   *
   * @description
   * Creates reactive form with validators.
   *
   * @private
   */
  private initializeForm(): void {
    this.roleForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-z0-9_]+$/),
        ],
      ],
      displayName: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
      ],
      description: ['', [Validators.maxLength(500)]],
      priority: [50, [Validators.required, Validators.min(1), Validators.max(100)]],
      isSystem: [{ value: false, disabled: false }],
    });
  }

  /**
   * Load route data
   *
   * @description
   * Determines mode and loads appropriate data.
   *
   * @private
   */
  private loadRouteData(): void {
    // Check route data for mode
    const routeMode = this.route.snapshot.data['mode'];
    if (routeMode) {
      this.mode.set(routeMode);
    }

    // Get role ID from route params (edit mode)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.mode.set('edit');
      this.roleId.set(Number(id));
      this.loadRoleData(Number(id));
    } else {
      // Check for template data in query params (create mode with template)
      this.loadTemplateData();
    }
  }

  /**
   * Load existing role data (edit mode)
   *
   * @description
   * Fetches role details and populates form.
   *
   * @param {number} id - Role ID
   *
   * @private
   */
  private loadRoleData(id: number): void {
    this.loading.set(true);

    this.service
      .fetchRoleById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (role) => {
          this.roleData.set(role);
          this.populateForm(role);
          // Convert number IDs to strings for the permission selector
          this.selectedPermissions.set((role.permissionIds || []).map(id => id.toString()));
          this.loading.set(false);

          // Disable system flag in edit mode if already system role
          if (role.isSystem) {
            this.roleForm.get('isSystem')?.disable();
          }
        },
        error: (error) => {
          console.error('Failed to load role:', error);
          this.snackBar.open('Failed to load role data', 'Close', { duration: 5000 });
          this.loading.set(false);
          this.goBack();
        },
      });
  }

  /**
   * Load template data (create mode with template)
   *
   * @description
   * Loads template data from query params and pre-fills form.
   *
   * @private
   */
  private loadTemplateData(): void {
    const queryParams = this.route.snapshot.queryParams;
    const templateId = queryParams['templateId'];

    if (templateId) {
      const templates = this.query.getCachedTemplates();
      const template = templates.find((t) => t.id === templateId);

      if (template) {
        this.populateFromTemplate(template, queryParams);
      }
    }
  }

  /**
   * Populate form from template
   *
   * @description
   * Pre-fills form with template data and customizations.
   *
   * @param {RoleTemplate} template - Template data
   * @param {any} queryParams - Query parameters with customizations
   *
   * @private
   */
  private populateFromTemplate(template: RoleTemplate, queryParams: any): void {
    const permissions = this.query.getCachedPermissions();
    const templatePermissionIds = permissions
      .filter((p) => template.suggestedPermissions.includes(p.name))
      .map((p) => p.id);

    this.roleForm.patchValue({
      name: queryParams['name'] || template.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: queryParams['displayName'] || template.name,
      description: queryParams['description'] || template.description,
      priority: template.priority,
      isSystem: false,
    });

    // Convert template permission IDs to strings
    this.selectedPermissions.set(templatePermissionIds.map(id => id.toString()));
  }

  /**
   * Populate form from existing role
   *
   * @description
   * Fills form with role data for editing.
   *
   * @param {Role} role - Role data
   *
   * @private
   */
  private populateForm(role: Role): void {
    this.roleForm.patchValue({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      priority: role.priority,
      isSystem: role.isSystem,
    });
  }

  /**
   * Load permissions if needed
   *
   * @description
   * Ensures permissions are available in cache.
   *
   * @private
   */
  private loadPermissionsIfNeeded(): void {
    this.service.fetchPermissions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /**
   * Handle permission selection changes
   *
   * @description
   * Updates selected permissions signal.
   *
   * @param {number[]} permissionIds - Selected permission IDs
   *
   * @public
   */
  onPermissionsChange(permissionIds: string[]): void {
    this.selectedPermissions.set(permissionIds);
  }

  /**
   * Submit form
   *
   * @description
   * Validates and submits form based on mode.
   *
   * @public
   */
  onSubmit(): void {
    if (!this.isFormValid()) {
      this.roleForm.markAllAsTouched();
      this.snackBar.open('Please fix form errors and select at least one permission', 'Close', {
        duration: 5000,
      });
      return;
    }

    if (this.mode() === 'create') {
      this.createRole();
    } else {
      this.updateRole();
    }
  }

  /**
   * Create new role
   *
   * @description
   * Submits create role request.
   *
   * @private
   */
  private createRole(): void {
    this.saving.set(true);

    const formValue = this.roleForm.getRawValue();
    const dto: CreateRoleDto = {
      name: formValue.name,
      displayName: formValue.displayName,
      description: formValue.description,
      priority: formValue.priority,
      // Convert string IDs back to numbers for the DTO
      permissionIds: this.selectedPermissions().map(id => parseInt(id, 10)),
    };

    this.service
      .createRole(dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Role created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/roles']);
        },
        error: (error) => {
          console.error('Failed to create role:', error);
          this.saving.set(false);
        },
      });
  }

  /**
   * Update existing role
   *
   * @description
   * Submits update role request.
   *
   * @private
   */
  private updateRole(): void {
    const id = this.roleId();
    if (!id) return;

    this.saving.set(true);

    const formValue = this.roleForm.getRawValue();
    const dto: UpdateRoleDto = {
      displayName: formValue.displayName,
      description: formValue.description,
      priority: formValue.priority,
      // Convert string IDs back to numbers for the DTO
      permissionIds: this.selectedPermissions().map(id => parseInt(id, 10)),
    };

    this.service
      .updateRole(id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Role updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/roles']);
        },
        error: (error) => {
          console.error('Failed to update role:', error);
          this.saving.set(false);
        },
      });
  }

  /**
   * Cancel editing
   *
   * @description
   * Navigates back without saving.
   *
   * @public
   */
  cancel(): void {
    // TODO: Add unsaved changes guard
    this.goBack();
  }

  /**
   * Navigate back to roles list
   *
   * @description
   * Returns to main role management dashboard.
   *
   * @public
   */
  goBack(): void {
    this.router.navigate(['/admin/roles']);
  }

  /**
   * Get form control error message
   *
   * @description
   * Returns validation error message for form control.
   *
   * @param {string} controlName - Form control name
   * @returns {string} Error message
   *
   * @public
   */
  getErrorMessage(controlName: string): string {
    const control = this.roleForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${controlName} is required`;
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength'])
      return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['pattern']) return 'Only lowercase letters, numbers, and underscores';
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;

    return '';
  }

  /**
   * Format priority label for slider
   *
   * @description
   * Formats priority value for display.
   *
   * @param {number} value - Priority value
   * @returns {string} Formatted label
   *
   * @public
   */
  formatPriorityLabel(value: number): string {
    return `${value}`;
  }
}
