import { Injectable, inject } from '@angular/core';
import { UserStore } from './user.store';
import { UserQuery } from './user.query';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

/**
 * User Service
 *
 * Business logic for user authentication and preferences.
 *
 * Features:
 * - User login/logout
 * - Language switching
 * - Currency selection
 * - Theme toggling
 * - Wishlist management
 *
 * @example
 * // In component
 * constructor(private userService: UserService) {}
 *
 * login(email: string, password: string) {
 *   this.userService.login(email, password).subscribe(success => {
 *     if (success) {
 *       console.log('Login successful');
 *     }
 *   });
 * }
 *
 * switchLanguage(lang: 'en' | 'ar') {
 *   this.userService.setLanguage(lang);
 * }
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private store = inject(UserStore);
  private query = inject(UserQuery);

  /** Expose user observables */
  user$ = this.query.user$;
  isAuthenticated$ = this.query.isAuthenticated$;
  language$ = this.query.language$;
  currency$ = this.query.currency$;
  theme$ = this.query.theme$;
  wishlist$ = this.query.wishlist$;

  /**
   * User Login
   *
   * Authenticates user with email and password.
   * Mock implementation - replace with real API call.
   *
   * @param email - User email
   * @param password - User password
   * @returns Observable<boolean> - True if login successful
   */
  login(email: string, password: string): Observable<boolean> {
    // Mock login (replace with real API call)
    return of(true).pipe(
      delay(500),
      tap(() => {
        this.store.update({
          id: 'user_' + Date.now(),
          name: 'Ahmad Al-Sayed',
          email: email,
          isAuthenticated: true,
          role: 'customer'
        });
      })
    );
  }

  /**
   * User Logout
   *
   * Clears user session and resets to guest state
   */
  logout() {
    this.store.update({
      id: null,
      name: null,
      email: null,
      isAuthenticated: false,
      role: 'guest',
      wishlist: [] // Clear wishlist on logout
    });
  }

  /**
   * Set Language Preference
   *
   * Updates user's language preference and persists to storage.
   *
   * @param language - Language code ('en' or 'ar')
   */
  setLanguage(language: 'en' | 'ar') {
    this.store.update(state => ({
      preferences: {
        ...state.preferences,
        language
      }
    }));
    // Persist to localStorage
    localStorage.setItem('syrian_marketplace_language', language);
  }

  /**
   * Set Currency Preference
   *
   * Updates user's currency preference.
   *
   * @param currency - Currency code (USD, EUR, SYP)
   */
  setCurrency(currency: 'USD' | 'EUR' | 'SYP') {
    this.store.update(state => ({
      preferences: {
        ...state.preferences,
        currency
      }
    }));
    // Persist to localStorage
    localStorage.setItem('syrian_marketplace_currency', currency);
  }

  /**
   * Set Theme Preference
   *
   * Updates user's theme preference.
   *
   * @param theme - Theme mode ('light' or 'dark')
   */
  setTheme(theme: 'light' | 'dark') {
    this.store.update(state => ({
      preferences: {
        ...state.preferences,
        theme
      }
    }));
    // Persist to localStorage
    localStorage.setItem('syrian_marketplace_theme', theme);
  }

  /**
   * Toggle Theme
   *
   * Switches between light and dark themes
   */
  toggleTheme() {
    const currentTheme = this.query.getValue().preferences.theme;
    this.setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  /**
   * Add to Wishlist
   *
   * Adds a product to user's wishlist.
   * Only works for authenticated users.
   *
   * @param productId - Product ID to add
   */
  addToWishlist(productId: string) {
    if (!this.query.getValue().isAuthenticated) {
      console.warn('User must be authenticated to use wishlist');
      return;
    }

    const wishlist = this.query.getValue().wishlist;
    if (!wishlist.includes(productId)) {
      this.store.update({
        wishlist: [...wishlist, productId]
      });
      // Persist to localStorage
      this.saveWishlist();
    }
  }

  /**
   * Remove from Wishlist
   *
   * Removes a product from user's wishlist.
   *
   * @param productId - Product ID to remove
   */
  removeFromWishlist(productId: string) {
    const wishlist = this.query.getValue().wishlist;
    this.store.update({
      wishlist: wishlist.filter(id => id !== productId)
    });
    // Persist to localStorage
    this.saveWishlist();
  }

  /**
   * Toggle Wishlist Item
   *
   * Adds or removes product from wishlist based on current state.
   *
   * @param productId - Product ID to toggle
   */
  toggleWishlist(productId: string) {
    if (this.query.isInWishlist(productId)) {
      this.removeFromWishlist(productId);
    } else {
      this.addToWishlist(productId);
    }
  }

  /**
   * Clear Wishlist
   *
   * Removes all items from wishlist
   */
  clearWishlist() {
    this.store.update({ wishlist: [] });
    this.saveWishlist();
  }

  /**
   * Save Wishlist to localStorage
   */
  private saveWishlist() {
    const wishlist = this.query.getValue().wishlist;
    localStorage.setItem('syrian_marketplace_wishlist', JSON.stringify(wishlist));
  }

  /**
   * Load User Preferences from localStorage
   *
   * Call this on app initialization to restore saved preferences
   */
  loadPreferences() {
    const language = localStorage.getItem('syrian_marketplace_language') as 'en' | 'ar' | null;
    const currency = localStorage.getItem('syrian_marketplace_currency') as 'USD' | 'EUR' | 'SYP' | null;
    const theme = localStorage.getItem('syrian_marketplace_theme') as 'light' | 'dark' | null;
    const wishlist = localStorage.getItem('syrian_marketplace_wishlist');

    if (language || currency || theme) {
      this.store.update(state => ({
        preferences: {
          language: language || state.preferences.language,
          currency: currency || state.preferences.currency,
          theme: theme || state.preferences.theme
        }
      }));
    }

    if (wishlist) {
      try {
        const parsedWishlist = JSON.parse(wishlist);
        this.store.update({ wishlist: parsedWishlist });
      } catch (e) {
        console.error('Failed to load wishlist from storage', e);
      }
    }
  }
}
