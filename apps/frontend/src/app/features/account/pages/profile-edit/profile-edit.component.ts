/**
 * @fileoverview Profile edit component
 * @description Allows users to edit their profile information including avatar, name, and phone (SS-USER-002)
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountApiService } from '../../services/account-api.service';
import { UserProfile, UpdateProfileRequest } from '../../models/user-profile.interface';

/**
 * @description Component for editing user profile information
 * @class ProfileEditComponent
 */
@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditComponent implements OnInit {
  /** Account API service for profile operations */
  private accountApi = inject(AccountApiService);

  /** Router for navigation */
  private router = inject(Router);

  /** Form builder for reactive forms */
  private fb = inject(FormBuilder);

  /** Snackbar for displaying notifications */
  private snackBar = inject(MatSnackBar);

  /** Translation service */
  private translate = inject(TranslateService);

  /** Loading state signal */
  loading = signal<boolean>(true);

  /** Saving state signal */
  saving = signal<boolean>(false);

  /** Avatar preview URL signal */
  avatarPreview = signal<string | null>(null);

  /** Avatar file data (base64) signal */
  avatarData = signal<string | null>(null);

  /** Profile form group */
  profileForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      phone: ['', [Validators.pattern(/^\+963\d{9,10}$/)]],
    });
  }

  /**
   * @description Lifecycle hook - loads current profile on initialization
   * @returns {void}
   */
  ngOnInit(): void {
    this.loadProfile();
  }

  /**
   * @description Fetches current user profile and pre-fills form
   * @returns {void}
   */
  loadProfile(): void {
    this.loading.set(true);

    this.accountApi.getProfile().subscribe({
      next: (profile) => {
        this.populateForm(profile);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.loading.set(false);
        this.showError('account.editProfile.error');
      },
    });
  }

  /**
   * @description Populates form with existing profile data
   * @param {UserProfile} profile - User profile data
   * @returns {void}
   */
  populateForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
    });

    if (profile.avatar) {
      this.avatarPreview.set(profile.avatar);
    }
  }

  /**
   * @description Handles avatar file selection
   * @param {Event} event - File input change event
   * @returns {void}
   */
  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.showError('account.editProfile.validation.invalidAvatarType');
      return;
    }

    // Validate file size (2MB limit)
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeInBytes) {
      this.showError('account.editProfile.validation.avatarTooLarge');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.avatarPreview.set(base64);
      this.avatarData.set(base64);
    };
    reader.readAsDataURL(file);
  }

  /**
   * @description Triggers file input click
   * @returns {void}
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById(
      'avatar-input'
    ) as HTMLInputElement;
    fileInput?.click();
  }

  /**
   * @description Removes avatar preview and data
   * @returns {void}
   */
  removeAvatar(): void {
    this.avatarPreview.set(null);
    this.avatarData.set(null);
  }

  /**
   * @description Generates initials from full name
   * @param {string} fullName - User's full name
   * @returns {string} Initials
   */
  getInitials(fullName: string): string {
    if (!fullName) return '?';

    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (
      names[0].charAt(0).toUpperCase() +
      names[names.length - 1].charAt(0).toUpperCase()
    );
  }

  /**
   * @description Submits profile update form
   * @returns {void}
   */
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const formValue = this.profileForm.value;
    const updateData: UpdateProfileRequest = {
      fullName: formValue.fullName,
      phone: formValue.phone || undefined,
    };

    // Include avatar if it has been modified (including removal)
    const avatarValue = this.avatarData();
    if (avatarValue !== undefined) {
      updateData.avatar = avatarValue;
    }

    this.accountApi.updateProfile(updateData).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess('account.editProfile.success');
        setTimeout(() => {
          this.router.navigate(['/account/profile']);
        }, 1000);
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        this.saving.set(false);
        this.showError('account.editProfile.error');
      },
    });
  }

  /**
   * @description Cancels editing and navigates back to profile
   * @returns {void}
   */
  cancel(): void {
    this.router.navigate(['/account/profile']);
  }

  /**
   * @description Shows success snackbar message
   * @param {string} messageKey - Translation key for message
   * @returns {void}
   */
  private showSuccess(messageKey: string): void {
    this.translate.get(messageKey).subscribe((message) => {
      this.snackBar.open(message, '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
      });
    });
  }

  /**
   * @description Shows error snackbar message
   * @param {string} messageKey - Translation key for message
   * @returns {void}
   */
  private showError(messageKey: string): void {
    this.translate.get(messageKey).subscribe((message) => {
      this.snackBar.open(message, '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
    });
  }

  /**
   * @description Gets error message for form field
   * @param {string} fieldName - Form field name
   * @returns {string} Error message translation key
   */
  getErrorMessage(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return `account.editProfile.validation.${fieldName}Required`;
    }
    if (control.errors['minlength']) {
      return `account.editProfile.validation.${fieldName}MinLength`;
    }
    if (control.errors['maxlength']) {
      return `account.editProfile.validation.${fieldName}MaxLength`;
    }
    if (control.errors['pattern']) {
      return `account.editProfile.validation.${fieldName}Invalid`;
    }

    return '';
  }
}
