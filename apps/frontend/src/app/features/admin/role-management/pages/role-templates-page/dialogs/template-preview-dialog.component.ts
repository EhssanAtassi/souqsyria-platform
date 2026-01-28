/**
 * Template Preview Dialog Component
 *
 * @description
 * Dialog for previewing role template details and customizing before creation.
 * Shows all permissions included and allows modification.
 *
 * @features
 * - Template information display
 * - Permission list with categories
 * - Optional customization before use
 * - Role name and description override
 * - Create role from template action
 *
 * @architecture
 * - Dialog component with Material CDK
 * - Reactive forms for customization
 * - Permission selector integration
 * - OnPush change detection
 *
 * @swagger
 * components:
 *   TemplatePreviewDialog:
 *     type: object
 *     description: Dialog for previewing and using role templates
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(TemplatePreviewDialogComponent, {
 *   width: '800px',
 *   data: { template, permissions }
 * });
 * ```
 */

import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';

import { RoleTemplate, Permission } from '../../../models';

/**
 * Template Preview Dialog Data Interface
 *
 * @interface TemplatePreviewDialogData
 */
interface TemplatePreviewDialogData {
  /** Template to preview */
  template: RoleTemplate;
  /** Available permissions */
  permissions: Permission[];
}

/**
 * Template Preview Result Interface
 *
 * @interface TemplatePreviewResult
 */
export interface TemplatePreviewResult {
  /** Template ID */
  templateId: string;
  /** Custom role name (optional) */
  customName?: string;
  /** Custom display name (optional) */
  customDisplayName?: string;
  /** Custom description (optional) */
  customDescription?: string;
  /** Custom permission IDs (optional) */
  customPermissionIds?: number[];
}

/**
 * Template Preview Dialog Component
 *
 * @class TemplatePreviewDialogComponent
 * @implements {OnInit}
 */
@Component({
  selector: 'app-template-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule,
  ],
  templateUrl: './template-preview-dialog.component.html',
  styleUrls: ['./template-preview-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePreviewDialogComponent implements OnInit {
  /**
   * Injected dependencies
   *
   * @private
   * @readonly
   */
  private readonly dialogRef = inject(MatDialogRef<TemplatePreviewDialogComponent>);
  private readonly data = inject<TemplatePreviewDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  /**
   * Template data from dialog input
   *
   * @public
   * @readonly
   */
  readonly template = this.data.template;

  /**
   * Customization form
   *
   * @description
   * Form for customizing template before creation.
   *
   * @public
   */
  customizeForm!: FormGroup;

  /**
   * Customize mode flag
   *
   * @description
   * Whether user wants to customize the template.
   *
   * @public
   */
  customizeMode = signal(false);

  /**
   * Template permissions
   *
   * @description
   * Permissions included in this template.
   *
   * @public
   */
  templatePermissions = computed(() => {
    return this.data.permissions.filter((p) =>
      this.template.suggestedPermissions.includes(p.name)
    );
  });

  /**
   * Grouped permissions
   *
   * @description
   * Permissions grouped by category for display.
   *
   * @public
   */
  groupedPermissions = computed(() => {
    const permissions = this.templatePermissions();
    const grouped = new Map<string, Permission[]>();

    permissions.forEach((permission) => {
      const category = permission.category || 'General';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(permission);
    });

    return Array.from(grouped.entries()).map(([category, perms]) => ({
      category,
      permissions: perms,
    }));
  });

  /**
   * Initialize component
   *
   * @description
   * Sets up customization form with template defaults.
   *
   * @public
   */
  ngOnInit(): void {
    this.customizeForm = this.fb.group({
      name: [
        this.template.name.toLowerCase().replace(/\s+/g, '_'),
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
      ],
      displayName: [
        this.template.name,
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
      ],
      description: [this.template.description, [Validators.maxLength(500)]],
    });
  }

  /**
   * Toggle customize mode
   *
   * @description
   * Enables/disables customization form.
   *
   * @public
   */
  toggleCustomize(): void {
    this.customizeMode.update((v) => !v);
  }

  /**
   * Use template without customization
   *
   * @description
   * Creates role directly from template without modifications.
   *
   * @public
   */
  useTemplate(): void {
    const result: TemplatePreviewResult = {
      templateId: this.template.id,
    };
    this.dialogRef.close(result);
  }

  /**
   * Use template with customization
   *
   * @description
   * Creates role from template with user modifications.
   *
   * @public
   */
  useWithCustomization(): void {
    if (this.customizeForm.invalid) {
      this.customizeForm.markAllAsTouched();
      return;
    }

    const formValue = this.customizeForm.value;
    const result: TemplatePreviewResult = {
      templateId: this.template.id,
      customName: formValue.name,
      customDisplayName: formValue.displayName,
      customDescription: formValue.description,
    };

    this.dialogRef.close(result);
  }

  /**
   * Cancel dialog
   *
   * @description
   * Closes dialog without action.
   *
   * @public
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get category display name
   *
   * @description
   * Formats category name for display.
   *
   * @param {string} category - Category slug
   * @returns {string} Formatted category name
   *
   * @public
   */
  getCategoryDisplay(category: string): string {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
    const control = this.customizeForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${controlName} is required`;
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength'])
      return `Maximum ${control.errors['maxlength'].requiredLength} characters`;

    return '';
  }
}
