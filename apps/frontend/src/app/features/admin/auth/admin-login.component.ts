import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminAuthService } from '../../../shared/services/admin-auth.service';

/**
 * Simple login screen for the admin console powered by the mock
 * authentication service. Replaced with the real backend flow once the
 * NestJS endpoints are ready.
 */
@Component({
  standalone: true,
  selector: 'app-admin-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  readonly canSubmit = computed(() => this.form.valid && !this.isSubmitting());

  submit(): void {
    if (!this.form.valid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const { email, password } = this.form.getRawValue();
    this.adminAuth.login(email, password).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const returnUrl = sessionStorage.getItem('admin_return_url') ?? '/admin/dashboard';
        sessionStorage.removeItem('admin_return_url');
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: Error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.message || 'Login failed. Check your credentials.');
      }
    });
  }
}
