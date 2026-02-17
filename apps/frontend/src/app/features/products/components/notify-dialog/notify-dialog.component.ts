/**
 * @file notify-dialog.component.ts
 * @description Stock notification dialog component
 * Allows users to subscribe to email notifications when out-of-stock products become available
 *
 * @swagger
 * components:
 *   NotifyDialogComponent:
 *     description: Dialog for subscribing to stock notifications
 *     properties:
 *       productId:
 *         type: number
 *         description: Product ID to subscribe to
 *       productName:
 *         type: string
 *         description: Product display name
 *       variantId:
 *         type: number
 *         description: Optional variant ID
 *       variantName:
 *         type: string
 *         description: Optional variant name
 *       userEmail:
 *         type: string
 *         description: Pre-filled email for authenticated users
 */
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../../shared/services/language.service';
import { environment } from '../../../../../environments/environment';

/**
 * @description Dialog data interface
 */
export interface NotifyDialogData {
  productId: number;
  productName: string;
  variantId?: number;
  variantName?: string;
  userEmail?: string;
}

/**
 * @description Stock notification dialog component
 * Provides UI for users to subscribe to back-in-stock notifications
 */
@Component({
  selector: 'app-notify-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './notify-dialog.component.html',
  styleUrls: ['./notify-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifyDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly dialogRef = inject(MatDialogRef<NotifyDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly languageService = inject(LanguageService);

  /** @description Current UI language */
  readonly language = this.languageService.language;

  /** @description Loading state during API request */
  loading = signal(false);

  /** @description Notification form */
  notifyForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NotifyDialogData,
  ) {
    // Initialize form with pre-filled email if available
    this.notifyForm = this.fb.group({
      email: [
        this.data.userEmail || '',
        [Validators.required, Validators.email],
      ],
    });
  }

  /**
   * @description Submits notification subscription
   * Calls backend API to register email for stock notifications
   */
  onSubmit(): void {
    if (this.notifyForm.invalid) {
      this.notifyForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const email = this.notifyForm.value.email;

    const payload: { email: string; variantId?: number } = {
      email,
    };

    if (this.data.variantId) {
      payload.variantId = this.data.variantId;
    }

    const url = `${environment.productApiUrl}/${this.data.productId}/notify`;

    this.http.post(url, payload).subscribe({
      next: () => {
        this.loading.set(false);
        const message =
          this.language() === 'ar'
            ? 'سنبلغك عندما يتوفر هذا المنتج'
            : "We'll notify you when this product is back in stock";

        this.snackBar.open(message, '✓', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });

        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading.set(false);
        const message =
          err?.error?.message ||
          (this.language() === 'ar'
            ? 'فشل الاشتراك في الإشعارات'
            : 'Failed to subscribe to notifications');

        this.snackBar.open(message, '✕', {
          duration: 4000,
          panelClass: 'error-snackbar',
        });
      },
    });
  }

  /**
   * @description Closes dialog without subscribing
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * @description Computed dialog title based on language
   */
  get dialogTitle(): string {
    return this.language() === 'ar'
      ? 'أبلغني عند التوفر'
      : 'Notify Me When Available';
  }

  /**
   * @description Computed product description text
   */
  get productDescription(): string {
    const productName = this.data.productName;
    const variantName = this.data.variantName;

    if (this.language() === 'ar') {
      return variantName
        ? `${productName} - ${variantName}`
        : productName;
    }

    return variantName
      ? `${productName} - ${variantName}`
      : productName;
  }

  /**
   * @description Computed helper text based on language
   */
  get helperText(): string {
    return this.language() === 'ar'
      ? 'سنرسل لك بريداً إلكترونياً عندما يعود هذا المنتج متاحاً'
      : "We'll send you an email when this product is back in stock";
  }

  /**
   * @description Computed email label
   */
  get emailLabel(): string {
    return this.language() === 'ar' ? 'البريد الإلكتروني' : 'Email Address';
  }

  /**
   * @description Computed submit button label
   */
  get submitLabel(): string {
    return this.language() === 'ar' ? 'اشترك' : 'Subscribe';
  }

  /**
   * @description Computed cancel button label
   */
  get cancelLabel(): string {
    return this.language() === 'ar' ? 'إلغاء' : 'Cancel';
  }

  /**
   * @description Computed email error message
   */
  get emailError(): string {
    const emailControl = this.notifyForm.get('email');
    if (!emailControl || !emailControl.touched) return '';

    if (emailControl.hasError('required')) {
      return this.language() === 'ar'
        ? 'البريد الإلكتروني مطلوب'
        : 'Email is required';
    }

    if (emailControl.hasError('email')) {
      return this.language() === 'ar'
        ? 'يرجى إدخال بريد إلكتروني صالح'
        : 'Please enter a valid email';
    }

    return '';
  }
}
