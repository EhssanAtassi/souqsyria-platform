/**
 * @fileoverview Account preferences component
 * @description Manages user preferences: language, currency, notification toggles (SS-USER-006)
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountApiService } from '../../services/account-api.service';
import { UserPreferences } from '../../models/user-profile.interface';

/**
 * @description Component for managing user account preferences
 * @class PreferencesComponent
 */
@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    TranslateModule,
  ],
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesComponent implements OnInit {
  /** Account API service */
  private accountApi = inject(AccountApiService);
  /** Form builder */
  private fb = inject(FormBuilder);
  /** Snackbar for feedback */
  private snackBar = inject(MatSnackBar);
  /** Translation service for immediate language switching */
  private translate = inject(TranslateService);

  /** Loading state signal */
  loading = signal<boolean>(true);
  /** Saving state signal */
  saving = signal<boolean>(false);
  /** Error state signal */
  error = signal<string | null>(null);

  /** Preferences form group */
  form!: FormGroup;

  /** Available language options */
  readonly languages = [
    { value: 'ar', label: 'العربية', icon: '🇸🇾' },
    { value: 'en', label: 'English', icon: '🇬🇧' },
  ];

  /** Available currency options */
  readonly currencies = [
    { value: 'SYP', label: 'account.preferences.currencies.syp' },
    { value: 'USD', label: 'account.preferences.currencies.usd' },
    { value: 'EUR', label: 'account.preferences.currencies.eur' },
    { value: 'TRY', label: 'account.preferences.currencies.try' },
  ];

  /**
   * @description Lifecycle hook - loads current preferences
   */
  ngOnInit(): void {
    this.form = this.fb.group({
      language: ['ar'],
      currency: ['SYP'],
      emailNotifications: [true],
      smsNotifications: [false],
      marketingEmails: [false],
    });

    this.loadPreferences();
  }

  /**
   * @description Loads current preferences from user profile
   */
  loadPreferences(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountApi.getProfile().subscribe({
      next: (profile) => {
        const prefs = profile.preferences || {};
        this.form.patchValue({
          language: prefs.language || 'ar',
          currency: prefs.currency || 'SYP',
          emailNotifications: prefs.emailNotifications ?? true,
          smsNotifications: prefs.smsNotifications ?? false,
          marketingEmails: prefs.marketingEmails ?? false,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('account.preferences.loadError');
        this.loading.set(false);
      },
    });
  }

  /**
   * @description Handles language change — applies immediately for UX
   * @param {string} lang - New language code
   */
  onLanguageChange(lang: string): void {
    this.translate.use(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  /**
   * @description Saves preferences to backend
   */
  savePreferences(): void {
    if (this.saving()) return;

    this.saving.set(true);
    const prefs: UserPreferences = this.form.value;

    this.accountApi.updatePreferences(prefs).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          this.translate.instant('account.preferences.success'),
          this.translate.instant('close'),
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open(
          this.translate.instant('account.preferences.error'),
          this.translate.instant('close'),
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      },
    });
  }
}
