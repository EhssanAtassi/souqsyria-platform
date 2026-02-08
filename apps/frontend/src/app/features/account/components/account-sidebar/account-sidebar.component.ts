/**
 * @fileoverview Account sidebar navigation component
 * @description Vertical navigation menu for account section with active route highlighting
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * @description Navigation item interface
 * @interface NavItem
 */
interface NavItem {
  /** Route path */
  route: string;
  /** Material icon name */
  icon: string;
  /** Translation key for label */
  label: string;
  /** Whether the item is disabled */
  disabled: boolean;
}

/**
 * @description Component for account section sidebar navigation
 * @class AccountSidebarComponent
 */
@Component({
  selector: 'app-account-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './account-sidebar.component.html',
  styleUrls: ['./account-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSidebarComponent {
  /**
   * @description Navigation menu items
   * @type {NavItem[]}
   */
  navItems: NavItem[] = [
    {
      route: '/account/profile',
      icon: 'person',
      label: 'account.sidebar.profile',
      disabled: false,
    },
    {
      route: '/account/security',
      icon: 'lock',
      label: 'account.sidebar.security',
      disabled: false,
    },
    {
      route: '/account/orders',
      icon: 'shopping_bag',
      label: 'account.sidebar.orders',
      disabled: true,
    },
    {
      route: '/account/addresses',
      icon: 'location_on',
      label: 'account.sidebar.addresses',
      disabled: true,
    },
  ];
}
