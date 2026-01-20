import { Store, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';

/**
 * User State Interface
 *
 * Defines the structure of user authentication and preferences state
 */
export interface UserState {
  /** User unique identifier (null if not authenticated) */
  id: string | null;

  /** User full name */
  name: string | null;

  /** User email address */
  email: string | null;

  /** Authentication status */
  isAuthenticated: boolean;

  /** User role (determines permissions) */
  role: 'guest' | 'customer' | 'seller' | 'admin';

  /** User preferences and settings */
  preferences: {
    /** Selected language (en: English, ar: Arabic) */
    language: 'en' | 'ar';

    /** Selected currency */
    currency: 'USD' | 'EUR' | 'SYP';

    /** UI theme preference */
    theme: 'light' | 'dark';
  };

  /** User's wishlist product IDs */
  wishlist: string[];
}

/**
 * User Store
 *
 * Manages user authentication state, preferences, and wishlist.
 *
 * Features:
 * - User authentication status
 * - User profile information
 * - Language and currency preferences
 * - Theme selection
 * - Wishlist management
 * - Resettable state
 *
 * Initial State:
 * - Guest user (not authenticated)
 * - English language
 * - USD currency
 * - Light theme
 * - Empty wishlist
 *
 * @example
 * // Inject in component
 * constructor(private userStore: UserStore) {}
 *
 * // Update user preferences
 * this.userStore.update({
 *   preferences: { language: 'ar', currency: 'SYP', theme: 'light' }
 * });
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'user', resettable: true })
export class UserStore extends Store<UserState> {
  constructor() {
    super({
      id: null,
      name: null,
      email: null,
      isAuthenticated: false,
      role: 'guest',
      preferences: {
        language: 'en',
        currency: 'USD',
        theme: 'light'
      },
      wishlist: []
    });
  }
}
