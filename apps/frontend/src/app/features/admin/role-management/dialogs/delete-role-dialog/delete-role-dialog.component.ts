/**
 * Delete Role Dialog Component
 */

import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../models';

@Component({
  selector: 'app-delete-role-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './delete-role-dialog.component.html',
  styleUrls: ['./delete-role-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteRoleDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DeleteRoleDialogComponent>);
  readonly data = inject<{ role: Role }>(MAT_DIALOG_DATA);

  confirmationControl!: FormControl;
  canDelete = false;

  ngOnInit(): void {
    const role = this.data.role;
    this.canDelete = !role.isSystem && (role.userCount === 0 || role.userCount === undefined);

    this.confirmationControl = new FormControl('', [
      Validators.required,
      Validators.pattern(new RegExp(`^${role.name}$`))
    ]);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onDelete(): void {
    if (this.canDelete && this.confirmationControl.valid) {
      this.dialogRef.close(true);
    }
  }
}
