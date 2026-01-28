/**
 * Create Role Dialog Component
 *
 * @description
 * Multi-step wizard for creating new roles with permissions.
 *
 * @swagger
 * components:
 *   CreateRoleDialog:
 *     type: object
 *     description: Multi-step role creation wizard
 */

import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PermissionSelectorComponent } from '../../components/permission-selector/permission-selector.component';
import { CreateRoleDto, Permission } from '../../models';
import { RoleManagementQuery } from '../../state/role-management.query';

@Component({
  selector: 'app-create-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PermissionSelectorComponent
  ],
  templateUrl: './create-role-dialog.component.html',
  styleUrls: ['./create-role-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateRoleDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CreateRoleDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly query = inject(RoleManagementQuery);

  basicInfoForm!: FormGroup;
  permissionsForm!: FormGroup;
  selectedPermissions: string[] = [];
  allPermissions: Permission[] = [];

  ngOnInit(): void {
    // Load all permissions from query
    this.allPermissions = this.query.getCachedPermissions();

    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      displayName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      priority: [50, [Validators.required, Validators.min(1), Validators.max(100)]],
      isActive: [true]
    });

    this.permissionsForm = this.fb.group({
      permissionIds: [[], Validators.required]
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

  onCreate(): void {
    if (this.basicInfoForm.valid && this.permissionsForm.valid) {
      // Convert string IDs to numbers for DTO
      const numericPermissionIds = this.selectedPermissions.map(id => parseInt(id, 10));
      const dto: CreateRoleDto = {
        ...this.basicInfoForm.value,
        permissionIds: numericPermissionIds
      };
      this.dialogRef.close(dto);
    }
  }
}
