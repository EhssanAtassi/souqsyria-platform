import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserInfo } from '../../../../interfaces/navigation.interface';

/**
 * Account Menu Component
 *
 * @description Standalone account dropdown matching the prototype.
 * Shows "My Account / Ahmad" when logged in with dropdown menu,
 * or "Account / Sign In" when logged out.
 *
 * @swagger
 * components:
 *   schemas:
 *     AccountMenuProps:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/UserInfo'
 *         language:
 *           type: string
 *           enum: [en, ar]
 *
 * @example
 * ```html
 * <app-account-menu
 *   [user]="currentUser"
 *   [language]="'en'"
 *   (loginClick)="onLogin()"
 *   (logoutClick)="onLogout()">
 * </app-account-menu>
 * ```
 */
@Component({
  selector: 'app-account-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountMenuComponent {
  /** Current user information */
  @Input() user: UserInfo = { isLoggedIn: false };

  /** Current language */
  @Input() language: 'en' | 'ar' = 'en';

  /** Emitted when login button is clicked (for unauthenticated users) */
  @Output() loginClick = new EventEmitter<void>();

  /** Emitted when logout is clicked */
  @Output() logoutClick = new EventEmitter<void>();

  /** Whether the dropdown menu is open */
  dropdownOpen = false;

  private readonly cdr = inject(ChangeDetectorRef);

  /** Get account label text */
  get accountLabel(): string {
    if (this.user.isLoggedIn) {
      return this.language === 'ar' ? 'حسابي' : 'My Account';
    }
    return this.language === 'ar' ? 'الحساب' : 'Account';
  }

  /** Get user name or sign in text */
  get displayName(): string {
    if (this.user.isLoggedIn && this.user.name) {
      return this.user.name;
    }
    return this.language === 'ar' ? 'دخول' : 'Sign In';
  }

  /** Menu items for logged-in users */
  get menuItems(): { icon: string; label: string; route: string }[] {
    return [
      { icon: 'person', label: this.language === 'ar' ? 'الملف الشخصي' : 'My Profile', route: '/account/profile' },
      { icon: 'shopping_bag', label: this.language === 'ar' ? 'طلباتي' : 'My Orders', route: '/account/orders' },
      { icon: 'favorite', label: this.language === 'ar' ? 'المفضلة' : 'Wishlist', route: '/account/wishlist' },
      { icon: 'location_on', label: this.language === 'ar' ? 'العناوين' : 'Addresses', route: '/account/addresses' }
    ];
  }

  /**
   * Handle account button click
   * @description Opens dropdown for logged-in users, emits loginClick for guests
   */
  onButtonClick(): void {
    if (this.user.isLoggedIn) {
      this.dropdownOpen = !this.dropdownOpen;
    } else {
      this.loginClick.emit();
    }
    this.cdr.markForCheck();
  }

  /**
   * Close dropdown
   * @description Closes the dropdown (called on blur with delay)
   */
  closeDropdown(): void {
    setTimeout(() => {
      this.dropdownOpen = false;
      this.cdr.markForCheck();
    }, 200);
  }

  /**
   * Handle logout
   * @description Closes dropdown and emits logout event
   */
  onLogout(): void {
    this.dropdownOpen = false;
    this.logoutClick.emit();
    this.cdr.markForCheck();
  }
}
