/**
 * Edit Role Dialog Component
 */

import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PermissionSelectorComponent } from '../../components/permission-selector/permission-selector.component';
import { Role, UpdateRoleDto, Permission } from '../../models';
import { RoleManagementQuery } from '../../state/role-management.query';

@Component({
  selector: 'app-edit-role-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatStepperModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    PermissionSelectorComponent
  ],
  templateUrl: './edit-role-dialog.component.html',
  styleUrls: ['./edit-role-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditRoleDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<EditRoleDialogComponent>);
  readonly data = inject<{ role: Role }>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly query = inject(RoleManagementQuery);

  basicInfoForm!: FormGroup;
  permissionsForm!: FormGroup;
  selectedPermissions: string[] = [];
  allPermissions: Permission[] = [];

  ngOnInit(): void {
    const role = this.data.role;
    // Load all permissions from query
    this.allPermissions = this.query.getCachedPermissions();
    // Convert number IDs to strings for the permission selector
    this.selectedPermissions = role.permissionIds.map(id => id.toString());

    this.basicInfoForm = this.fb.group({
      displayName: [role.displayName, [Validators.required, Validators.minLength(3)]],
      description: [role.description, [Validators.maxLength(500)]],
      priority: [role.priority, [Validators.required, Validators.min(1), Validators.max(100)]],
      isActive: [role.isActive]
    });

    this.permissionsForm = this.fb.group({
      permissionIds: [this.selectedPermissions, Validators.required]
    });
  }

  onPermissionsChange(permissions: string[]): void {
    this.selectedPermissions = permissions;
    // Convert string IDs to numbers for the form
    const numericIds = permissions.map(id => parseInt(id, 10));
    this.permissionsForm.patchValue({ permissionIds: numericIds });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUpdate(): void {
    if (this.basicInfoForm.valid && this.permissionsForm.valid) {
      const dto: UpdateRoleDto = {
        ...this.basicInfoForm.value,
        // Include permission IDs converted to numbers
        permissionIds: this.selectedPermissions.map(id => parseInt(id, 10))
      };
      this.dialogRef.close(dto);
    }
  }
}
