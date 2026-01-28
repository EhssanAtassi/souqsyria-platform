/**
 * Clone Role Dialog Component
 */

import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Role, CloneRoleDto } from '../../models';

@Component({
  selector: 'app-clone-role-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatCheckboxModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './clone-role-dialog.component.html',
  styleUrls: ['./clone-role-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CloneRoleDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CloneRoleDialogComponent>);
  readonly data = inject<{ role: Role }>(MAT_DIALOG_DATA);

  nameControl!: FormControl;
  displayNameControl!: FormControl;
  copyPermissionsControl!: FormControl;

  ngOnInit(): void {
    const role = this.data.role;
    this.nameControl = new FormControl(
      `${role.name}_copy`,
      [Validators.required, Validators.minLength(3)]
    );
    this.displayNameControl = new FormControl(
      `${role.displayName} (Copy)`,
      [Validators.required]
    );
    this.copyPermissionsControl = new FormControl(true);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onClone(): void {
    if (this.nameControl.valid && this.displayNameControl.valid) {
      const dto: CloneRoleDto = {
        newName: this.nameControl.value,
        newDisplayName: this.displayNameControl.value
      };
      this.dialogRef.close(dto);
    }
  }
}
