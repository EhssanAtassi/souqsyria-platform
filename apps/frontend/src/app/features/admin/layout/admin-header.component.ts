import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface AdminQuickAction {
  label: string;
  icon: string;
  route: string;
}

import { AdminAuthService } from '../../../shared/services/admin-auth.service';

/**
 * Minimal top bar for the admin layout. Provides a placeholder for
 * environment status and quick actions until the full template is
 * integrated.
 */
@Component({
  standalone: true,
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, RouterLink]
})
export class AdminHeaderComponent {
  readonly quickActions: AdminQuickAction[] = [
    { label: 'Create Product', icon: 'add_circle', route: '/admin/products/create' },
    { label: 'Review Orders', icon: 'receipt_long', route: '/admin/orders' },
    { label: 'Vendor Requests', icon: 'store', route: '/admin/vendors/applications' }
  ];

  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly currentAdmin = computed(() => this.adminAuth.currentAdmin());
  readonly displayName = computed(() => {
    const admin = this.currentAdmin();
    if (!admin) {
      return 'Guest';
    }
    return `${admin.firstName} ${admin.lastName}`;
  });

  readonly avatarInitials = computed(() => {
    const admin = this.currentAdmin();
    if (!admin) {
      return 'SS';
    }
    return `${admin.firstName.charAt(0)}${admin.lastName.charAt(0)}`.toUpperCase();
  });

  readonly logoutPending = signal(false);

  logout(): void {
    if (this.logoutPending()) {
      return;
    }

    this.logoutPending.set(true);
    this.adminAuth.logout().subscribe({
      next: () => {
        this.logoutPending.set(false);
        void this.router.navigate(['/admin/login']);
      },
      error: () => {
        this.logoutPending.set(false);
      }
    });
  }
}
