import { Component, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

import { UserService } from '../../shared/services/user.service';
import { 
  User, 
  UserPreferences, 
  NotificationPreferences, 
  PrivacySettings,
  SYRIAN_CITIES,
  SyrianCity
} from '../../shared/interfaces/user.interface';

/**
 * Profile Settings Component for Syrian Marketplace
 * 
 * Comprehensive user profile management component with bilingual support,
 * Syrian cultural elements, and modern enterprise-ready architecture.
 * Handles personal information, preferences, security, and profile picture management.
 * 
 * @swagger
 * components:
 *   schemas:
 *     ProfileSettingsComponent:
 *       type: object
 *       description: User profile settings management component
 *       properties:
 *         currentUser:
 *           $ref: '#/components/schemas/User'
 *           description: Current authenticated user
 *         currentLanguage:
 *           type: string
 *           enum: [en, ar]
 *           description: Current display language
 *         isLoading:
 *           type: boolean
 *           description: Loading state indicator
 *         isSaving:
 *           type: boolean
 *           description: Saving state indicator for form submissions
 */
@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './profile-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './profile-settings.component.scss'
})
export class ProfileSettingsComponent implements OnInit {
  // Component state using signals
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal<boolean>(true);
  private readonly isSavingSignal = signal<boolean>(false);
  private readonly currentLanguageSignal = signal<'en' | 'ar'>('ar');

  // Public readonly signals for template
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isSaving = this.isSavingSignal.asReadonly();
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  // Syrian cities constant for template
  readonly syrianCities = SYRIAN_CITIES;

  // Reactive forms for different sections
  personalInfoForm!: FormGroup;
  preferencesForm!: FormGroup;
  notificationsForm!: FormGroup;
  passwordForm!: FormGroup;
  privacyForm!: FormGroup;

  // Computed properties
  readonly getDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    
    const lang = this.currentLanguage();
    if (lang === 'ar' && user.firstNameAr && user.lastNameAr) {
      return `${user.firstNameAr} ${user.lastNameAr}`;
    } else if (lang === 'en' && user.firstNameEn && user.lastNameEn) {
      return `${user.firstNameEn} ${user.lastNameEn}`;
    }
    
    return `${user.firstName} ${user.lastName}`;
  });

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  /**
   * Component initialization
   * Loads current user data and initializes reactive forms
   */
  ngOnInit(): void {
    this.loadCurrentUser();
    this.initializeLanguage();
  }

  /**
   * Initialize all reactive forms with validators
   */
  private initializeForms(): void {
    // Personal Information Form
    this.personalInfoForm = this.fb.group({
      firstNameAr: [''],
      lastNameAr: [''],
      firstNameEn: [''],
      lastNameEn: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      syrianOriginCity: [''],
      diasporaLocation: ['']
    });

    // Preferences Form
    this.preferencesForm = this.fb.group({
      preferredLanguage: ['ar', Validators.required],
      preferredCurrency: ['SYP', Validators.required],
      theme: ['light']
    });

    // Notifications Form
    this.notificationsForm = this.fb.group({
      orderUpdates: [true],
      promotions: [true],
      newsletter: [true],
      sms: [false],
      push: [true]
    });

    // Password Form with custom validator
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Privacy Form
    this.privacyForm = this.fb.group({
      profileVisibility: ['public'],
      showReviews: [true],
      showPurchaseHistory: [false]
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(group: FormGroup): {[key: string]: any} | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  /**
   * Load current user data from service
   */
  private loadCurrentUser(): void {
    this.isLoadingSignal.set(true);
    
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserSignal.set(user);
        this.populateForms(user);
        this.isLoadingSignal.set(false);
      },
      error: (error) => {
        console.error('Failed to load user data:', error);
        this.showErrorMessage('Failed to load user data');
        this.isLoadingSignal.set(false);
      }
    });
  }

  /**
   * Initialize language based on user preference
   */
  private initializeLanguage(): void {
    const userLang = this.userService.preferredLanguage();
    this.currentLanguageSignal.set(userLang);
  }

  /**
   * Populate forms with user data
   */
  private populateForms(user: User): void {
    // Personal Information
    this.personalInfoForm.patchValue({
      firstNameAr: user.firstNameAr || '',
      lastNameAr: user.lastNameAr || '',
      firstNameEn: user.firstNameEn || '',
      lastNameEn: user.lastNameEn || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      syrianOriginCity: user.syrianOriginCity || '',
      diasporaLocation: user.diasporaLocation || ''
    });

    // Preferences
    this.preferencesForm.patchValue({
      preferredLanguage: user.preferredLanguage,
      preferredCurrency: user.preferredCurrency || 'SYP',
      theme: user.preferences?.theme || 'light'
    });

    // Notifications
    if (user.preferences?.notifications) {
      this.notificationsForm.patchValue(user.preferences.notifications);
    }

    // Privacy
    if (user.preferences?.privacy) {
      this.privacyForm.patchValue(user.preferences.privacy);
    }
  }

  /**
   * Toggle between Arabic and English languages
   */
  toggleLanguage(): void {
    const currentLang = this.currentLanguageSignal();
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    
    this.currentLanguageSignal.set(newLang);
    this.userService.updatePreferredLanguage(newLang).subscribe();
  }

  /**
   * Save personal information
   */
  savePersonalInfo(): void {
    if (this.personalInfoForm.valid) {
      this.isSavingSignal.set(true);
      
      const formData = this.personalInfoForm.value;
      this.userService.updatePersonalInfo(formData).subscribe({
        next: (updatedUser) => {
          this.currentUserSignal.set(updatedUser);
          this.showSuccessMessage('Personal information updated successfully');
          this.isSavingSignal.set(false);
        },
        error: (error) => {
          console.error('Failed to update personal info:', error);
          this.showErrorMessage('Failed to update personal information');
          this.isSavingSignal.set(false);
        }
      });
    }
  }

  /**
   * Save user preferences
   */
  savePreferences(): void {
    if (this.preferencesForm.valid) {
      this.isSavingSignal.set(true);
      
      const formData = this.preferencesForm.value;
      this.userService.updatePreferences(formData).subscribe({
        next: (updatedUser) => {
          this.currentUserSignal.set(updatedUser);
          this.showSuccessMessage('Preferences updated successfully');
          
          // Update language if changed
          if (formData.preferredLanguage !== this.currentLanguageSignal()) {
            this.currentLanguageSignal.set(formData.preferredLanguage);
          }
          
          this.isSavingSignal.set(false);
        },
        error: (error) => {
          console.error('Failed to update preferences:', error);
          this.showErrorMessage('Failed to update preferences');
          this.isSavingSignal.set(false);
        }
      });
    }
  }

  /**
   * Save notification preferences
   */
  saveNotifications(): void {
    this.isSavingSignal.set(true);
    
    const notificationData = this.notificationsForm.value;
    this.userService.updateNotificationPreferences(notificationData).subscribe({
      next: (updatedUser) => {
        this.currentUserSignal.set(updatedUser);
        this.showSuccessMessage('Notification settings updated successfully');
        this.isSavingSignal.set(false);
      },
      error: (error) => {
        console.error('Failed to update notifications:', error);
        this.showErrorMessage('Failed to update notification settings');
        this.isSavingSignal.set(false);
      }
    });
  }

  /**
   * Change user password
   */
  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isSavingSignal.set(true);
      
      const passwordData = {
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword
      };

      this.userService.changePassword(passwordData).subscribe({
        next: () => {
          this.showSuccessMessage('Password updated successfully');
          this.passwordForm.reset();
          this.isSavingSignal.set(false);
        },
        error: (error) => {
          console.error('Failed to change password:', error);
          this.showErrorMessage('Failed to change password. Please check your current password.');
          this.isSavingSignal.set(false);
        }
      });
    }
  }

  /**
   * Toggle two-factor authentication
   */
  toggleTwoFactorAuth(enabled: boolean): void {
    this.isSavingSignal.set(true);
    
    this.userService.updateTwoFactorAuth(enabled).subscribe({
      next: (updatedUser) => {
        this.currentUserSignal.set(updatedUser);
        const message = enabled ? 
          'Two-factor authentication enabled' : 
          'Two-factor authentication disabled';
        this.showSuccessMessage(message);
        this.isSavingSignal.set(false);
      },
      error: (error) => {
        console.error('Failed to update 2FA:', error);
        this.showErrorMessage('Failed to update two-factor authentication');
        this.isSavingSignal.set(false);
      }
    });
  }

  /**
   * Save privacy settings
   */
  savePrivacySettings(): void {
    this.isSavingSignal.set(true);
    
    const privacyData = this.privacyForm.value;
    this.userService.updatePrivacySettings(privacyData).subscribe({
      next: (updatedUser) => {
        this.currentUserSignal.set(updatedUser);
        this.showSuccessMessage('Privacy settings updated successfully');
        this.isSavingSignal.set(false);
      },
      error: (error) => {
        console.error('Failed to update privacy settings:', error);
        this.showErrorMessage('Failed to update privacy settings');
        this.isSavingSignal.set(false);
      }
    });
  }

  /**
   * Trigger file input for profile picture upload
   */
  triggerFileUpload(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle profile picture file selection
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.isSavingSignal.set(true);
      
      this.userService.uploadProfilePicture(file).subscribe({
        next: (updatedUser) => {
          this.currentUserSignal.set(updatedUser);
          this.showSuccessMessage('Profile picture updated successfully');
          this.isSavingSignal.set(false);
        },
        error: (error) => {
          console.error('Failed to upload profile picture:', error);
          this.showErrorMessage('Failed to upload profile picture');
          this.isSavingSignal.set(false);
        }
      });
    }
  }

  /**
   * Show success message using snackbar
   */
  private showSuccessMessage(message: string): void {
    const lang = this.currentLanguageSignal();
    const translatedMessage = lang === 'ar' ? this.translateToArabic(message) : message;
    
    this.snackBar.open(translatedMessage, '', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: lang === 'ar' ? 'start' : 'end',
      verticalPosition: 'top'
    });
  }

  /**
   * Show error message using snackbar
   */
  private showErrorMessage(message: string): void {
    const lang = this.currentLanguageSignal();
    const translatedMessage = lang === 'ar' ? this.translateToArabic(message) : message;
    
    this.snackBar.open(translatedMessage, '', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: lang === 'ar' ? 'start' : 'end',
      verticalPosition: 'top'
    });
  }

  /**
   * Basic translation helper for common messages
   */
  private translateToArabic(message: string): string {
    const translations: {[key: string]: string} = {
      'Personal information updated successfully': 'تم تحديث المعلومات الشخصية بنجاح',
      'Preferences updated successfully': 'تم تحديث التفضيلات بنجاح',
      'Notification settings updated successfully': 'تم تحديث إعدادات الإشعارات بنجاح',
      'Password updated successfully': 'تم تحديث كلمة المرور بنجاح',
      'Two-factor authentication enabled': 'تم تفعيل المصادقة الثنائية',
      'Two-factor authentication disabled': 'تم إلغاء تفعيل المصادقة الثنائية',
      'Privacy settings updated successfully': 'تم تحديث إعدادات الخصوصية بنجاح',
      'Profile picture updated successfully': 'تم تحديث صورة الملف الشخصي بنجاح',
      'Failed to load user data': 'فشل في تحميل بيانات المستخدم',
      'Failed to update personal information': 'فشل في تحديث المعلومات الشخصية',
      'Failed to update preferences': 'فشل في تحديث التفضيلات',
      'Failed to update notification settings': 'فشل في تحديث إعدادات الإشعارات',
      'Failed to change password. Please check your current password.': 'فشل في تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية.',
      'Failed to update two-factor authentication': 'فشل في تحديث المصادقة الثنائية',
      'Failed to update privacy settings': 'فشل في تحديث إعدادات الخصوصية',
      'Failed to upload profile picture': 'فشل في رفع صورة الملف الشخصي'
    };
    
    return translations[message] || message;
  }
}