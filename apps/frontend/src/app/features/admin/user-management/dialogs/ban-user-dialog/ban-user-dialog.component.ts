import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { User } from '../../models/user.interface';
import { BanUserDto } from '../../models/user-action.dto';

/**
 * Ban User Dialog Component
 *
 * Displays a dialog for permanently banning a user from the system.
 * Allows administrators to provide a reason and internal notes for the ban action.
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(BanUserDialogComponent, {
 *   data: { user: selectedUser },
 *   width: '500px',
 *   disableClose: true
 * });
 *
 * dialogRef.afterClosed().subscribe((result: BanUserDto | undefined) => {
 *   if (result) {
 *     this.userService.banUser(selectedUser.id, result).subscribe({
 *       next: () => console.log('User banned successfully'),
 *       error: (error) => console.error('Ban failed', error)
 *     });
 *   }
 * });
 * ```
 *
 * @remarks
 * This dialog enforces strict validation:
 * - Reason is required (max 500 characters)
 * - Internal notes are optional (max 1000 characters)
 * - Ban is permanent by default
 *
 * @accessibility
 * - Implements WCAG 2.1 AA standards
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support
 * - Screen reader compatible
 */
@Component({
  selector: 'app-ban-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    UserAvatarComponent
  ],
  templateUrl: './ban-user-dialog.component.html',
  styleUrls: ['./ban-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BanUserDialogComponent implements OnInit {
  /**
   * Reactive form group for ban user form
   */
  banForm!: FormGroup;

  /**
   * Maximum character length for reason field
   */
  readonly REASON_MAX_LENGTH = 500;

  /**
   * Maximum character length for internal notes field
   */
  readonly NOTES_MAX_LENGTH = 1000;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BanUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {}

  /**
   * Initializes the component and creates the ban form with validation
   *
   * @remarks
   * Sets up the reactive form with the following controls:
   * - reason: Required field with max length validation
   * - isPermanent: Boolean flag (default: true)
   * - internalNotes: Optional field with max length validation
   */
  ngOnInit(): void {
    this.banForm = this.fb.group({
      reason: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.REASON_MAX_LENGTH)
        ]
      ],
      isPermanent: [true],
      internalNotes: [
        '',
        [Validators.maxLength(this.NOTES_MAX_LENGTH)]
      ]
    });
  }

  /**
   * Handles form submission
   *
   * @remarks
   * Validates the form and closes the dialog with the ban data
   * if validation passes. The parent component receives the DTO
   * and can proceed with the ban action.
   */
  onSubmit(): void {
    if (this.banForm.valid) {
      const result: BanUserDto = {
        reason: this.banForm.value.reason.trim(),
        isPermanent: this.banForm.value.isPermanent,
        internalNotes: this.banForm.value.internalNotes?.trim() || ''
      };
      this.dialogRef.close(result);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.banForm.controls).forEach(key => {
        this.banForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Handles dialog cancellation
   *
   * @remarks
   * Closes the dialog without returning any data
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Gets the reason form control for template access
   *
   * @returns The reason AbstractControl or null
   */
  get reason() {
    return this.banForm.get('reason');
  }

  /**
   * Gets the internal notes form control for template access
   *
   * @returns The internalNotes AbstractControl or null
   */
  get internalNotes() {
    return this.banForm.get('internalNotes');
  }

  /**
   * Calculates remaining characters for reason field
   *
   * @returns Number of remaining characters
   */
  get reasonRemainingChars(): number {
    const currentLength = this.reason?.value?.length || 0;
    return this.REASON_MAX_LENGTH - currentLength;
  }

  /**
   * Calculates remaining characters for internal notes field
   *
   * @returns Number of remaining characters
   */
  get notesRemainingChars(): number {
    const currentLength = this.internalNotes?.value?.length || 0;
    return this.NOTES_MAX_LENGTH - currentLength;
  }

  /**
   * Gets error message for reason field
   *
   * @returns Human-readable error message
   */
  getReasonErrorMessage(): string {
    if (this.reason?.hasError('required')) {
      return 'Reason is required';
    }
    if (this.reason?.hasError('maxlength')) {
      return `Reason cannot exceed ${this.REASON_MAX_LENGTH} characters`;
    }
    return '';
  }

  /**
   * Gets error message for internal notes field
   *
   * @returns Human-readable error message
   */
  getNotesErrorMessage(): string {
    if (this.internalNotes?.hasError('maxlength')) {
      return `Internal notes cannot exceed ${this.NOTES_MAX_LENGTH} characters`;
    }
    return '';
  }
}
