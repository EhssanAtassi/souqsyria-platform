/**
 * @fileoverview User profile view component
 * @description Displays user profile information with avatar, stats, and actions (SS-USER-001)
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AccountApiService } from '../../services/account-api.service';
import { UserProfile } from '../../models/user-profile.interface';

/**
 * @description Component for displaying user profile information
 * @class ProfileComponent
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  /** Account API service for profile operations */
  private accountApi = inject(AccountApiService);

  /** Router for navigation */
  private router = inject(Router);

  /** Destroy reference for automatic subscription cleanup */
  private destroyRef = inject(DestroyRef);

  /** User profile data signal */
  profile = signal<UserProfile | null>(null);

  /** Loading state signal */
  loading = signal<boolean>(true);

  /** Error state signal */
  error = signal<string | null>(null);

  /**
   * @description Lifecycle hook - loads profile on component initialization
   * @returns {void}
   */
  ngOnInit(): void {
    this.loadProfile();
  }

  /**
   * @description Fetches user profile data from API
   * @returns {void}
   */
  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountApi.getProfile().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load profile');
        this.loading.set(false);
      },
    });
  }

  /**
   * @description Generates initials from user's full name
   * @param {string | undefined} fullName - User's full name
   * @returns {string} Initials (e.g., "JD" for "John Doe")
   */
  getInitials(fullName: string | undefined): string {
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
   * @description Formats date string to locale date
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * @description Navigates to profile edit page
   * @returns {void}
   */
  navigateToEdit(): void {
    this.router.navigate(['/account/profile/edit']);
  }

  /**
   * @description Navigates to change password page
   * @returns {void}
   */
  navigateToSecurity(): void {
    this.router.navigate(['/account/security']);
  }

  /**
   * @description Retries loading profile after error
   * @returns {void}
   */
  retry(): void {
    this.loadProfile();
  }
}
