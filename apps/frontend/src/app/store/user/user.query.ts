import { Query } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { UserStore, UserState } from './user.store';
import { map } from 'rxjs/operators';

/**
 * User Query Service
 *
 * Provides reactive queries for user state.
 * All user data access should go through this query service.
 *
 * Features:
 * - Reactive user observables
 * - Authentication status
 * - User preferences
 * - Wishlist management
 * - Derived computed values
 *
 * @example
 * // In component
 * constructor(private userQuery: UserQuery) {}
 *
 * ngOnInit() {
 *   // Check authentication
 *   this.userQuery.isAuthenticated$.subscribe(isAuth => {
 *     console.log('User authenticated:', isAuth);
 *   });
 *
 *   // Get current language
 *   this.userQuery.language$.subscribe(lang => {
 *     console.log('Current language:', lang);
 *   });
 * }
 */
@Injectable({ providedIn: 'root' })
export class UserQuery extends Query<UserState> {

  /** Observable of complete user state */
  user$ = this.select();

  /** Observable of authentication status */
  isAuthenticated$ = this.select('isAuthenticated');

  /** Observable of user role */
  role$ = this.select('role');

  /** Observable of user email */
  email$ = this.select('email');

  /** Observable of user name */
  name$ = this.select('name');

  /** Observable of complete preferences */
  preferences$ = this.select('preferences');

  /** Observable of selected language */
  language$ = this.select(state => state.preferences.language);

  /** Observable of selected currency */
  currency$ = this.select(state => state.preferences.currency);

  /** Observable of selected theme */
  theme$ = this.select(state => state.preferences.theme);

  /** Observable of wishlist product IDs */
  wishlist$ = this.select('wishlist');

  /** Observable of wishlist item count */
  wishlistCount$ = this.wishlist$.pipe(
    map(wishlist => wishlist.length)
  );

  /** Observable indicating if user is guest */
  isGuest$ = this.role$.pipe(
    map(role => role === 'guest')
  );

  /** Observable indicating if user is admin */
  isAdmin$ = this.role$.pipe(
    map(role => role === 'admin')
  );

  /** Observable indicating if user is seller */
  isSeller$ = this.role$.pipe(
    map(role => role === 'seller')
  );

  constructor(protected override store: UserStore) {
    super(store);
  }

  /**
   * Check if Product is in Wishlist
   *
   * @param productId - Product ID to check
   * @returns True if product is in wishlist
   */
  isInWishlist(productId: string): boolean {
    return this.getValue().wishlist.includes(productId);
  }

  /**
   * Get Current Language
   *
   * @returns Current language setting ('en' or 'ar')
   */
  getCurrentLanguage(): 'en' | 'ar' {
    return this.getValue().preferences.language;
  }

  /**
   * Get Current Currency
   *
   * @returns Current currency setting
   */
  getCurrentCurrency(): 'USD' | 'EUR' | 'SYP' {
    return this.getValue().preferences.currency;
  }
}
