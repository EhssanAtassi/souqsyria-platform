import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { User } from '../../models/user.interface';
import { SuspendUserDto } from '../../models/user-action.dto';

/**
 * Duration option interface for suspend duration dropdown
 */
interface DurationOption {
  value: number;
  label: string;
}

/**
 * Suspend User Dialog Component
 *
 * Displays a dialog for temporarily suspending a user from the system.
 * Allows administrators to set a suspension period and provide a reason.
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(SuspendUserDialogComponent, {
 *   data: { user: selectedUser },
 *   width: '550px',
 *   disableClose: true
 * });
 *
 * dialogRef.afterClosed().subscribe((result: SuspendUserDto | undefined) => {
 *   if (result) {
 *     this.userService.suspendUser(selectedUser.id, result).subscribe({
 *       next: () => console.log('User suspended successfully'),
 *       error: (error) => console.error('Suspension failed', error)
 *     });
 *   }
 * });
 * ```
 *
 * @remarks
 * This dialog provides two suspension modes:
 * - Preset duration: Quick selection (1, 3, 7, 14, 30 days)
 * - Custom date: Manual date picker for specific end date
 *
 * Features:
 * - Auto-unsuspend option for automatic reactivation
 * - Internal notes for administrative record keeping
 * - Real-time date calculation preview
 *
 * @accessibility
 * - Implements WCAG 2.1 AA standards
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support
 * - Screen reader compatible
 */
@Component({
  selector: 'app-suspend-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    UserAvatarComponent
  ],
  templateUrl: './suspend-user-dialog.component.html',
  styleUrls: ['./suspend-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuspendUserDialogComponent implements OnInit {
  /**
   * Reactive form group for suspend user form
   */
  suspendForm!: FormGroup;

  /**
   * Preset duration options for quick selection
   */
  readonly durationOptions: DurationOption[] = [
    { value: 1, label: '1 day' },
    { value: 3, label: '3 days' },
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 30, label: '30 days' }
  ];

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
    private dialogRef: MatDialogRef<SuspendUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {}

  /**
   * Initializes the component and creates the suspend form with validation
   *
   * @remarks
   * Sets up the reactive form with dynamic validation based on durationType:
   * - When 'preset': durationDays is required
   * - When 'custom': customDate is required
   */
  ngOnInit(): void {
    this.suspendForm = this.fb.group({
      reason: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.REASON_MAX_LENGTH)
        ]
      ],
      durationType: ['preset', Validators.required],
      durationDays: [7, Validators.required],
      customDate: [null],
      autoUnsuspend: [true],
      internalNotes: [
        '',
        [Validators.maxLength(this.NOTES_MAX_LENGTH)]
      ]
    });

    // Set up dynamic validation based on duration type
    this.setupDurationTypeWatcher();
  }

  /**
   * Sets up watcher for durationType changes to update validation
   *
   * @remarks
   * When durationType changes:
   * - 'custom': Adds required validator to customDate
   * - 'preset': Removes validator from customDate
   */
  private setupDurationTypeWatcher(): void {
    this.suspendForm.get('durationType')?.valueChanges.subscribe(type => {
      const customDateControl = this.suspendForm.get('customDate');
      const durationDaysControl = this.suspendForm.get('durationDays');

      if (type === 'custom') {
        customDateControl?.setValidators([Validators.required]);
        durationDaysControl?.clearValidators();
      } else {
        customDateControl?.clearValidators();
        durationDaysControl?.setValidators([Validators.required]);
      }

      customDateControl?.updateValueAndValidity();
      durationDaysControl?.updateValueAndValidity();
    });
  }

  /**
   * Handles form submission
   *
   * @remarks
   * Validates the form and calculates the suspension end date
   * based on the selected duration type (preset or custom)
   */
  onSubmit(): void {
    if (this.suspendForm.valid) {
      const formValue = this.suspendForm.value;
      const result: SuspendUserDto = {
        reason: formValue.reason.trim(),
        suspendedUntil: this.calculateSuspendUntil(formValue),
        autoUnsuspend: formValue.autoUnsuspend,
        internalNotes: formValue.internalNotes?.trim() || ''
      };
      this.dialogRef.close(result);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.suspendForm.controls).forEach(key => {
        this.suspendForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Calculates the suspension end date based on form values
   *
   * @param formValue - The form values containing duration information
   * @returns The calculated suspension end date
   *
   * @remarks
   * For preset duration: Adds days to current date
   * For custom duration: Uses the selected date from date picker
   */
  private calculateSuspendUntil(formValue: any): Date {
    if (formValue.durationType === 'custom') {
      return new Date(formValue.customDate);
    } else {
      const date = new Date();
      date.setDate(date.getDate() + formValue.durationDays);
      return date;
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
   * Gets the minimum allowed date for date picker (today)
   *
   * @returns Today's date
   */
  get minDate(): Date {
    return new Date();
  }

  /**
   * Gets the maximum allowed date for date picker (1 year from now)
   *
   * @returns Date one year in the future
   */
  get maxDate(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }

  /**
   * Gets the calculated suspension end date for preview
   *
   * @returns The suspension end date or null
   */
  get suspendUntilDate(): Date | null {
    const durationType = this.suspendForm.get('durationType')?.value;
    const durationDays = this.suspendForm.get('durationDays')?.value;
    const customDate = this.suspendForm.get('customDate')?.value;

    if (durationType === 'custom' && customDate) {
      return new Date(customDate);
    } else if (durationType === 'preset' && durationDays) {
      const date = new Date();
      date.setDate(date.getDate() + durationDays);
      return date;
    }

    return null;
  }

  /**
   * Gets the reason form control for template access
   */
  get reason() {
    return this.suspendForm.get('reason');
  }

  /**
   * Gets the internal notes form control for template access
   */
  get internalNotes() {
    return this.suspendForm.get('internalNotes');
  }

  /**
   * Gets the custom date form control for template access
   */
  get customDate() {
    return this.suspendForm.get('customDate');
  }

  /**
   * Calculates remaining characters for reason field
   */
  get reasonRemainingChars(): number {
    const currentLength = this.reason?.value?.length || 0;
    return this.REASON_MAX_LENGTH - currentLength;
  }

  /**
   * Calculates remaining characters for internal notes field
   */
  get notesRemainingChars(): number {
    const currentLength = this.internalNotes?.value?.length || 0;
    return this.NOTES_MAX_LENGTH - currentLength;
  }

  /**
   * Gets error message for reason field
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
   * Gets error message for custom date field
   */
  getCustomDateErrorMessage(): string {
    if (this.customDate?.hasError('required')) {
      return 'Please select a suspension end date';
    }
    if (this.customDate?.hasError('matDatepickerMin')) {
      return 'Date cannot be in the past';
    }
    if (this.customDate?.hasError('matDatepickerMax')) {
      return 'Date cannot be more than 1 year in the future';
    }
    return '';
  }

  /**
   * Gets error message for internal notes field
   */
  getNotesErrorMessage(): string {
    if (this.internalNotes?.hasError('maxlength')) {
      return `Internal notes cannot exceed ${this.NOTES_MAX_LENGTH} characters`;
    }
    return '';
  }
}
