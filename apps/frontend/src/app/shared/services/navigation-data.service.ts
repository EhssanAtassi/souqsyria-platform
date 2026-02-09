import { Injectable, inject, DestroyRef } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { CartQuery } from '../../store/cart/cart.query';
import {
  Category,
  UserInfo,
  CartInfo,
  Location,
  NavigationConfig,
  SearchFilters
} from '../interfaces/navigation.interface';
import { SYRIAN_CATEGORIES } from '../data/syrian-categories.data';
import { selectIsAuthenticated, selectUser } from '../../features/auth/store/auth.selectors';
import { AuthActions } from '../../features/auth/store/auth.actions';

/**
 * Navigation Data Service
 * 
 * @description
 * Provides sample data and state management for the navigation header component.
 * In a real application, this would integrate with your API services and state management solution.
 * 
 * @swagger
 * components:
 *   schemas:
 *     NavigationDataService:
 *       type: object
 *       properties:
 *         config$:
 *           description: Observable of navigation configuration
 *         user$:
 *           description: Observable of current user information
 *         cart$:
 *           description: Observable of shopping cart information
 *         categories$:
 *           description: Observable of product categories
 *         locations$:
 *           description: Observable of available locations
 * 
 * @example
 * ```typescript
 * constructor(private navDataService: NavigationDataService) {}
 * 
 * ngOnInit() {
 *   this.navDataService.categories$.subscribe(categories => {
 *     this.categories = categories;
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationDataService {

  //#region Injected Dependencies

  /** NgRx Store for auth state */
  private readonly store = inject(Store);

  /** DestroyRef for automatic subscription cleanup */
  private readonly destroyRef = inject(DestroyRef);

  /** Akita CartQuery for reactive cart state */
  private readonly cartQuery = inject(CartQuery);

  //#endregion

  //#region Private Properties

  /** Navigation configuration subject */
  private configSubject = new BehaviorSubject<NavigationConfig>(this.getDefaultConfig());

  /** User information subject */
  private userSubject = new BehaviorSubject<UserInfo>({ isLoggedIn: false });

  /** Cart information subject — initially empty, updated reactively from Akita CartQuery */
  private cartSubject = new BehaviorSubject<CartInfo>({
    itemCount: 0,
    totalAmount: 0,
    currency: 'SYP'
  });

  /** Categories subject */
  private categoriesSubject = new BehaviorSubject<Category[]>(this.getSampleCategories());

  /** Locations subject */
  private locationsSubject = new BehaviorSubject<Location[]>(this.getSyrianLocations());

  //#endregion

  /**
   * @constructor
   * @description Initializes auth state bridge from NgRx to navigation service
   */
  constructor() {
    this.initAuthStateBridge();
    this.initCartStateBridge();
  }

  /**
   * Bridges NgRx auth state to navigation user state
   * @description Subscribes to NgRx auth selectors and updates userSubject
   * so header component displays correct login state
   * @private
   */
  private initAuthStateBridge(): void {
    // Subscribe to auth state changes from NgRx store
    this.store.select(selectIsAuthenticated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          // Get user data from store when authenticated
          this.store.select(selectUser)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(authUser => {
              if (authUser) {
                const userInfo: UserInfo = {
                  id: String(authUser.id),
                  name: authUser.fullName || authUser.email.split('@')[0],
                  email: authUser.email,
                  isLoggedIn: true
                };
                this.userSubject.next(userInfo);
              }
            });
        } else {
          this.userSubject.next({ isLoggedIn: false });
        }
      });
  }
  
  /**
   * Bridges Akita cart state to navigation cart info
   * @description Subscribes to CartQuery observables and updates cartSubject
   * so the header badge displays the real cart item count and total
   * @private
   */
  private initCartStateBridge(): void {
    combineLatest([
      this.cartQuery.itemCount$,
      this.cartQuery.total$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([itemCount, totalAmount]) => {
        this.cartSubject.next({
          itemCount,
          totalAmount,
          currency: 'SYP',
        });
      });
  }

  //#region Public Observables
  
  /** Observable for navigation configuration */
  public readonly config$: Observable<NavigationConfig> = this.configSubject.asObservable();
  
  /** Observable for user information */
  public readonly user$: Observable<UserInfo> = this.userSubject.asObservable();
  
  /** Observable for cart information */
  public readonly cart$: Observable<CartInfo> = this.cartSubject.asObservable();
  
  /** Observable for categories */
  public readonly categories$: Observable<Category[]> = this.categoriesSubject.asObservable();
  
  /** Observable for locations */
  public readonly locations$: Observable<Location[]> = this.locationsSubject.asObservable();
  
  //#endregion
  
  //#region Public Methods
  
  /**
   * Updates navigation configuration
   * @description Merges new config with existing configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<NavigationConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);
  }
  
  /**
   * Updates user information
   * @description Sets current user state
   * @param user - User information to set
   */
  updateUser(user: UserInfo): void {
    this.userSubject.next(user);
  }
  
  /**
   * Updates cart information
   * @description Sets current cart state
   * @param cart - Cart information to set
   */
  updateCart(cart: CartInfo): void {
    this.cartSubject.next(cart);
  }
  
  /**
   * Simulates user login
   * @description Sets user as logged in with sample data
   */
  simulateLogin(): void {
    const loggedInUser: UserInfo = {
      id: 'user-123',
      name: 'Ahmad Al-Syrian',
      email: 'ahmad@example.com',
      avatar: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=AS',
      isLoggedIn: true
    };
    this.updateUser(loggedInUser);
  }
  
  /**
   * Logs out the current user
   * @description Dispatches NgRx logout action and resets local user state.
   * Resets userSubject directly in case login was done outside NgRx.
   */
  simulateLogout(): void {
    this.userSubject.next({ isLoggedIn: false });
    this.store.dispatch(AuthActions.logout());
  }
  
  /**
   * Toggles language between English and Arabic
   * @description Switches the current language setting
   */
  toggleLanguage(): void {
    const currentConfig = this.configSubject.value;
    const newLanguage = currentConfig.language === 'en' ? 'ar' : 'en';
    this.updateConfig({ 
      language: newLanguage,
      rtl: newLanguage === 'ar'
    });
  }
  
  /**
   * Handles search submission
   * @description Processes search filters (for demo purposes, logs to console)
   * @param filters - Search filters from the header component
   */
  handleSearch(filters: SearchFilters): void {
    console.log('Search submitted:', filters);
    // In a real application, this would trigger navigation or API calls
  }
  
  /**
   * Handles location change
   * @description Updates the selected delivery location
   * @param location - Selected location
   */
  handleLocationChange(location: Location): void {
    console.log('Location changed:', location);
    // In a real application, this would update user preferences or API calls
  }
  
  //#endregion
  
  //#region Private Methods
  
  /**
   * Gets default navigation configuration
   * @description Returns initial configuration settings
   * @returns Default navigation configuration
   * @private
   */
  private getDefaultConfig(): NavigationConfig {
    return {
      showArabic: true,
      language: 'en',
      rtl: false,
      locations: this.getSyrianLocations(),
      featuredCategories: this.getFeaturedCategories()
    };
  }
  
  /**
   * Gets authentic Syrian marketplace categories
   * @description Returns Syrian heritage categories imported from data file
   * @returns Array of authentic Syrian categories
   * @private
   */
  private getSampleCategories(): Category[] {
    return SYRIAN_CATEGORIES;
  }
  
  /**
   * Gets featured categories for main navigation
   * @description Returns categories marked as featured
   * @returns Array of featured categories
   * @private
   */
  private getFeaturedCategories(): Category[] {
    return this.getSampleCategories().filter(category => category.featured);
  }
  
  /**
   * Gets Syrian locations for delivery
   * @description Returns list of Syrian cities and governorates
   * @returns Array of Syrian locations
   * @private
   */
  private getSyrianLocations(): Location[] {
    return [
      {
        id: 'damascus',
        name: 'Damascus',
        nameAr: 'دمشق',
        type: 'city',
        deliveryAvailable: true
      },
      {
        id: 'aleppo',
        name: 'Aleppo',
        nameAr: 'حلب',
        type: 'city',
        deliveryAvailable: true
      },
      {
        id: 'homs',
        name: 'Homs',
        nameAr: 'حمص',
        type: 'city',
        deliveryAvailable: true
      },
      {
        id: 'lattakia',
        name: 'Lattakia',
        nameAr: 'اللاذقية',
        type: 'city',
        deliveryAvailable: true
      },
      {
        id: 'tartus',
        name: 'Tartus',
        nameAr: 'طرطوس',
        type: 'city',
        deliveryAvailable: true
      },
      {
        id: 'daraa',
        name: 'Daraa',
        nameAr: 'درعا',
        type: 'city',
        deliveryAvailable: true
      },
      {
        id: 'deir-ez-zor',
        name: 'Deir ez-Zor',
        nameAr: 'دير الزور',
        type: 'city',
        deliveryAvailable: false
      },
      {
        id: 'hasaka',
        name: 'Al-Hasakah',
        nameAr: 'الحسكة',
        type: 'city',
        deliveryAvailable: false
      },
      {
        id: 'idlib',
        name: 'Idlib',
        nameAr: 'إدلب',
        type: 'city',
        deliveryAvailable: false
      },
      {
        id: 'raqqa',
        name: 'Raqqa',
        nameAr: 'الرقة',
        type: 'city',
        deliveryAvailable: false
      },
      {
        id: 'sweida',
        name: 'As-Suwayda',
        nameAr: 'السويداء',
        type: 'city',
        deliveryAvailable: true
      },
      {
        id: 'quneitra',
        name: 'Quneitra',
        nameAr: 'القنيطرة',
        type: 'city',
        deliveryAvailable: false
      }
    ];
  }
  
  //#endregion
}