/**
 * @fileoverview TopBar Component for SouqSyria Header
 * @description Utility navigation row with quick links, premium badge, and language toggle
 * @author SouqSyria Development Team
 * @version 1.0.0
 *
 * @swagger
 * components:
 *   schemas:
 *     TopBarComponent:
 *       type: object
 *       description: Top utility bar with quick navigation links and language toggle
 *       properties:
 *         config:
 *           $ref: '#/components/schemas/NavigationConfig'
 *           description: Navigation configuration for language and RTL support
 *         user:
 *           $ref: '#/components/schemas/UserInfo'
 *           description: Current user information for conditional links
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { NavigationConfig, UserInfo } from '../../../../interfaces/navigation.interface';

/**
 * Interface for top bar navigation links
 * @description Defines structure for utility navigation links
 */
export interface TopBarLink {
  /** Unique identifier for the link */
  id: string;
  /** Display text in English */
  labelEn: string;
  /** Display text in Arabic */
  labelAr: string;
  /** Navigation URL */
  url: string;
  /** Material icon name (optional) */
  icon?: string;
  /** Whether link requires authentication */
  requiresAuth?: boolean;
  /** Whether link is highlighted/special */
  isHighlighted?: boolean;
  /** Whether link is premium badge */
  isPremium?: boolean;
}

/**
 * TopBarComponent
 *
 * @description
 * Displays the top utility navigation bar (Row 1) in the header.
 * Features include:
 * - Quick navigation links (My Orders, Super Deals, Become a Seller, Help)
 * - SouqSyria Premium badge
 * - Language toggle (English/Arabic)
 * - RTL layout support
 * - Responsive design (hidden on mobile)
 *
 * @example
 * ```html
 * <app-top-bar
 *   [config]="navigationConfig"
 *   [user]="currentUser"
 *   (languageChange)="onLanguageChange($event)"
 *   (linkClick)="onTopBarLinkClick($event)">
 * </app-top-bar>
 * ```
 */
@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent {

  //#region Input Properties

  /**
   * Navigation configuration options
   * @description Controls language, RTL layout, and feature toggles
   */
  @Input() config: NavigationConfig = {
    showArabic: true,
    language: 'en',
    rtl: false,
    locations: [],
    featuredCategories: []
  };

  /**
   * Current user information
   * @description Used to show/hide authenticated links
   */
  @Input() user: UserInfo = { isLoggedIn: false };

  //#endregion

  //#region Output Events

  /**
   * Event emitted when language is changed
   * @description Provides selected language code
   */
  @Output() languageChange = new EventEmitter<string>();

  /**
   * Event emitted when a top bar link is clicked
   * @description Provides link ID for analytics/routing
   */
  @Output() linkClick = new EventEmitter<string>();

  //#endregion

  //#region Public Properties

  /**
   * Top bar navigation links
   * @description Array of utility links displayed in the top bar
   */
  readonly topBarLinks: TopBarLink[] = [
    {
      id: 'my-orders',
      labelEn: 'My Orders',
      labelAr: 'طلباتي',
      url: '/account/orders',
      icon: 'receipt_long'
    },
    {
      id: 'super-deals',
      labelEn: 'Super Deals',
      labelAr: 'عروض خارقة',
      url: '/deals',
      icon: 'percent'
    },
    {
      id: 'become-seller',
      labelEn: 'Become a Seller',
      labelAr: 'كن بائعاً',
      url: '/seller/register',
      icon: 'storefront',
      isHighlighted: true
    },
    {
      id: 'help',
      labelEn: 'Help',
      labelAr: 'المساعدة',
      url: '/help',
      icon: 'help_outline'
    }
  ];

  /**
   * Premium membership link
   * @description Special premium membership badge/link
   */
  readonly premiumLink: TopBarLink = {
    id: 'premium',
    labelEn: 'SouqSyria Premium',
    labelAr: 'سوق سوريا بريميوم',
    url: '/premium',
    icon: 'workspace_premium',
    isPremium: true
  };

  //#endregion

  //#region Public Methods

  /**
   * Gets display text for a link based on current language
   * @description Returns localized link label
   * @param link - TopBarLink object
   * @returns Localized link text
   */
  getLinkText(link: TopBarLink): string {
    return this.config.language === 'ar' ? link.labelAr : link.labelEn;
  }

  /**
   * Handles link click events
   * @description Emits link click event for analytics/tracking
   * @param linkId - ID of clicked link
   */
  onLinkClick(linkId: string): void {
    this.linkClick.emit(linkId);
  }

  /**
   * Handles language change
   * @description Updates language and emits change event
   * @param language - Selected language code ('en' | 'ar')
   */
  onLanguageChange(language: string): void {
    if (this.config.language !== language) {
      this.languageChange.emit(language);
    }
  }

  /**
   * Checks if a link should be displayed
   * @description Determines visibility based on auth requirements
   * @param link - TopBarLink to check
   * @returns True if link should be shown
   */
  shouldShowLink(link: TopBarLink): boolean {
    if (link.requiresAuth && !this.user.isLoggedIn) {
      return false;
    }
    return true;
  }

  /**
   * TrackBy function for links
   * @description Optimizes ngFor performance
   * @param index - Array index
   * @param link - TopBarLink object
   * @returns Unique identifier
   */
  trackByLink(index: number, link: TopBarLink): string {
    return link.id;
  }

  //#endregion
}
