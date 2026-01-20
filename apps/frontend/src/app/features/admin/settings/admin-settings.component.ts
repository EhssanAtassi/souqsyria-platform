import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-settings',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSettingsComponent {
  readonly sections = [
    {
      title: 'Marketplace configuration',
      description: 'Currencies, payment channels, and Syrian VAT settings.',
      route: '/admin/settings/general'
    },
    {
      title: 'Security & access',
      description: 'Role policies, audit logging, and session controls.',
      route: '/admin/settings/security'
    },
    {
      title: 'Integrations',
      description: 'Shipping partners, SMS gateways, and analytics tracking.',
      route: '/admin/settings/integrations'
    }
  ];
}
