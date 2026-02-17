import { Component, ChangeDetectionStrategy, OnInit, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { FlexLayoutModule } from '@angular/flex-layout';

// Local imports
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ProductComparisonBarComponent } from './shared/components/product-comparison/product-comparison-bar.component';
import { NavigationDataService } from './shared/services/navigation-data.service';
import { CartService } from './store/cart/cart.service';
import {
  Category,
  UserInfo,
  CartInfo,
  Location,
  NavigationConfig,
  SearchFilters
} from './shared/interfaces/navigation.interface';
import { CartItem } from './shared/interfaces/cart.interface';

/**
 * Root application component that demonstrates the integration of:
 * - Angular Material components with custom SouqSyria theme
 * - Tailwind CSS utility classes for styling
 * - Angular Flex Layout for responsive design
 * - Modern Angular standalone components architecture
 *
 * @swagger
 * components:
 *   schemas:
 *     AppComponent:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Application title displayed in the header
 *           example: "SouqSyria Enterprise Storefront"
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatRippleModule,
    FlexLayoutModule,
    HeaderComponent,
    FooterComponent,
    ProductComparisonBarComponent,
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  /**
   * Application title used throughout the component
   * @description Main title displayed in the application header
   */
  title = 'SouqSyria Enterprise Storefront';

  //#region Navigation Properties

  /** Navigation configuration */
  navigationConfig: NavigationConfig = {
    showArabic: true,
    language: 'en',
    rtl: false,
    locations: [],
    featuredCategories: []
  };

  /** Current user information */
  currentUser: UserInfo = { isLoggedIn: false };

  /** Shopping cart information */
  cartData: CartInfo = { itemCount: 0, totalAmount: 0, currency: 'SYP' };

  /** Product categories */
  categories: Category[] = [];

  /** Available locations */
  locations: Location[] = [];

  /** DestroyRef for automatic subscription cleanup */
  private destroyRef = inject(DestroyRef);

  /** @description Angular router for route detection and navigation */
  private readonly router = inject(Router);

  /** Cart service for mini-cart dropdown item removal (SS-CART-010) */
  private readonly cartService = inject(CartService);

  /**
   * Whether the current route is an auth route (/auth/*)
   * @description Hides the main commerce header on auth pages
   */
  readonly isAuthRoute = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects.startsWith('/auth')),
    ),
    { initialValue: this.router.url.startsWith('/auth') },
  );

  //#endregion

  /**
   * Sample features array to demonstrate dynamic rendering
   * @description List of key features to showcase in the demo
   */
  features = [
    {
      title: 'Tailwind CSS',
      description: 'Utility-first CSS framework for rapid UI development',
      icon: 'palette',
      color: 'primary'
    },
    {
      title: 'Angular Material',
      description: 'Material Design components for Angular applications',
      icon: 'design_services',
      color: 'accent'
    },
    {
      title: 'Responsive Design',
      description: 'Mobile-first approach with Angular Flex Layout',
      icon: 'devices',
      color: 'primary'
    }
  ];

  /**
   * Handles feature card click events
   * @description Processes user interactions with feature cards
   * @param feature - The clicked feature object
   */
  onFeatureClick(feature: any): void {
    console.log('Feature clicked:', feature.title);
    // In a real application, this would navigate to feature details or perform an action
  }

  /**
   * TrackBy function for ngFor optimization
   * @description Improves performance by tracking items by their title
   * @param index - Array index
   * @param feature - Feature object
   * @returns Unique identifier for tracking
   */
  trackByTitle(index: number, feature: any): string {
    return feature.title;
  }

  //#endregion

  //#region Constructor and Lifecycle

  /**
   * Component constructor
   * @description Injects required services
   * @param navigationDataService - Service for navigation data and state management
   */
  constructor(
    private navigationDataService: NavigationDataService,
  ) {}

  /**
   * Component initialization
   * @description Sets up navigation data subscriptions
   */
  ngOnInit(): void {
    this.setupNavigationSubscriptions();
  }


  //#endregion

  //#region Navigation Event Handlers

  /**
   * Handles search submission from header
   * @description Processes search filters and performs search operation
   * @param filters - Search filters from the header component
   */
  onSearchSubmit(filters: SearchFilters): void {
    console.log('Search submitted:', filters);
    this.navigationDataService.handleSearch(filters);
    // In a real application, this would trigger navigation to search results
  }

  /**
   * Handles login button click
   * @description Navigates to the login page for real authentication
   */
  onLoginClick(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Handles logout button click
   * @description Triggers user logout process
   */
  onLogoutClick(): void {
    console.log('Logout clicked');
    this.navigationDataService.simulateLogout();
  }

  /**
   * Handles shopping cart click
   * @description Opens cart sidebar or navigates to cart page
   */
  onCartClick(): void {
    console.log('Cart clicked');
  }

  /**
   * Handles cart item removal from mini-cart dropdown (SS-CART-010)
   * @param item - Cart item to remove
   */
  onCartRemoveItem(item: CartItem): void {
    this.cartService.removeFromCart(item.id);
  }

  /**
   * Handles location change
   * @description Updates selected delivery location
   * @param location - Selected location
   */
  onLocationChange(location: Location): void {
    console.log('Location changed:', location);
    this.navigationDataService.handleLocationChange(location);
  }

  /**
   * Handles category click in navigation
   * @description Navigates to category page
   * @param category - Clicked category
   */
  onCategoryClick(category: Category): void {
    console.log('Category clicked:', category);
    // In a real application, this would navigate to category page
  }

  /**
   * Handles mobile menu toggle
   * @description Responds to mobile menu state changes
   * @param isOpen - Whether mobile menu is open
   */
  onMobileMenuToggle(isOpen: boolean): void {
    console.log('Mobile menu toggled:', isOpen);
    // Handle body scroll lock/unlock for mobile menu
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  //#endregion

  //#region Private Methods

  /**
   * Sets up navigation data subscriptions
   * @description Subscribes to navigation service observables
   * @private
   */
  private setupNavigationSubscriptions(): void {
    // Subscribe to navigation configuration
    this.navigationDataService.config$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(config => {
        this.navigationConfig = config;
      });

    // Subscribe to user information
    this.navigationDataService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });

    // Subscribe to cart information
    this.navigationDataService.cart$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cart => {
        this.cartData = cart;
      });

    // Subscribe to categories
    this.navigationDataService.categories$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(categories => {
        this.categories = categories;
      });

    // Subscribe to locations
    this.navigationDataService.locations$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(locations => {
        this.locations = locations;
      });
  }

  //#endregion

}
