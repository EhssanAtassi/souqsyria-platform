import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, UpperCasePipe, DatePipe } from '@angular/common';

import { AdminAuthService } from '../../../shared/services/admin-auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-profile',
  imports: [CommonModule, UpperCasePipe, DatePipe],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProfileComponent {
  private readonly adminAuth = inject(AdminAuthService);

  readonly admin = this.adminAuth.currentAdmin;
}
