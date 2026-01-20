import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AdminHeaderComponent } from './admin-header.component';
import { AdminSidebarComponent } from './admin-sidebar.component';

/**
 * Temporary admin layout wrapper.
 *
 * This will be replaced with the enterprise layout migrated from the
 * design template. For now it provides a minimal shell so routing can be
 * wired and iterated on safely.
 */
@Component({
  standalone: true,
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AdminHeaderComponent, AdminSidebarComponent]
})
export class AdminLayoutComponent {}
