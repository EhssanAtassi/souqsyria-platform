import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Unauthorized Component
 *
 * @description
 * Displays a user-friendly error page when access to a route is denied due to
 * insufficient permissions. Shows contextual information about the attempted
 * access and provides navigation options.
 *
 * @features
 * - Displays reason for access denial
 * - Shows attempted return URL
 * - Lists required permissions that were missing
 * - Provides navigation options (back, home)
 * - Material Design styling with responsive layout
 *
 * @usage
 * Configured as redirect target in permission guard:
 * ```typescript
 * {
 *   path: 'unauthorized',
 *   component: UnauthorizedComponent
 * }
 * ```
 *
 * @queryParams
 * - returnUrl: The URL the user attempted to access
 * - reason: Why access was denied (e.g., 'insufficient_permissions')
 * - required: Comma-separated list of required permissions
 *
 * @example URL with query params
 * ```
 * /unauthorized?returnUrl=admin/users&reason=insufficient_permissions&required=manage_users,view_users
 * ```
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent implements OnInit {
  /**
   * The URL the user attempted to access before being denied
   */
  returnUrl = signal<string | null>(null);

  /**
   * The reason for access denial
   */
  reason = signal<string | null>(null);

  /**
   * Required permissions that the user lacked
   */
  requiredPermissions = signal<string[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  /**
   * Lifecycle hook to extract query parameters
   */
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.returnUrl.set(params['returnUrl'] || null);
      this.reason.set(params['reason'] || null);

      // Parse comma-separated permissions
      if (params['required']) {
        const permissions = params['required'].split(',').filter((p: string) => p.trim());
        this.requiredPermissions.set(permissions);
      }
    });
  }

  /**
   * Navigate back to the previous page in browser history
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Navigate to the home page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Get user-friendly reason message
   */
  getReasonMessage(): string {
    const reasonValue = this.reason();
    switch (reasonValue) {
      case 'insufficient_permissions':
        return 'You do not have the required permissions to access this page.';
      case 'authentication_required':
        return 'You must be authenticated to access this page.';
      case 'role_required':
        return 'Your current role does not have access to this page.';
      default:
        return 'Access to this page is restricted.';
    }
  }
}
