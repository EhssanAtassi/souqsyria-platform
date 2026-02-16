/**
 * SouqSyria Header Navigation Component
 *
 * @description Orchestrates the 4-row header structure:
 * Row 1: TopBar | Row 2: Main Header | Row 3: Category Nav | Row 4: Quick Access
 *
 * Integrates the unified S1 Sprint MegaMenuComponent in two modes:
 * - Overlay: triggered by "All Categories" click
 * - Dropdown: triggered by category hover in Row 3
 */
import { Component, Input, Output, EventEmitter, OnInit, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

import {
  Category,
  UserInfo,
  CartInfo,
  Location,
  NavigationConfig,
  SearchFilters
} from '../../interfaces/navigation.interface';
import { CartItem } from '../../interfaces/cart.interface';

// Category Navigation (Row 3 nav bar only — legacy mega menus removed)
import { CategoryNavigationComponent } from '../category-navigation/index';

// Header Sub-Components
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { QuickAccessRowComponent } from './components/quick-access-row/quick-access-row.component';
import { LogoComponent } from './components/logo/logo.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { LocationSelectorComponent } from './components/location-selector/location-selector.component';
import { AccountMenuComponent } from './components/account-menu/account-menu.component';
import { CartButtonComponent } from './components/cart-button/cart-button.component';
import { FavoritesButtonComponent } from './components/favorites-button/favorites-button.component';

// Static category data for featured nav
import { HEADER_NAV_CATEGORIES } from '../../data/syrian-categories.data';

// S1 Sprint Category Integration (unified mega menu)
import { MegaMenuComponent } from '../../../features/category/components/mega-menu/mega-menu.component';
import { MobileCategoryNavComponent } from '../../../features/category/components/mobile-category-nav/mobile-category-nav.component';
import { CategoryApiService } from '../../../features/category/services/category-api.service';
import { CategoryTreeNode } from '../../../features/category/models/category-tree.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    CategoryNavigationComponent,
    MegaMenuComponent,
    MobileCategoryNavComponent,
    TopBarComponent,
    QuickAccessRowComponent,
    LogoComponent,
    SearchBarComponent,
    LocationSelectorComponent,
    AccountMenuComponent,
    CartButtonComponent,
    FavoritesButtonComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {

  constructor() {}

  //#region Input Properties

  @Input() config: NavigationConfig = {
    showArabic: true,
    language: 'en',
    rtl: false,
    locations: [],
    featuredCategories: []
  };

  @Input() user: UserInfo = { isLoggedIn: false };

  @Input() cart: CartInfo = {
    itemCount: 0,
    totalAmount: 0,
    currency: 'SYP'
  };

  @Input() categories: Category[] = [];

  @Input() locations: Location[] = [];

  @Input() wishlistCount: number = 5;

  //#endregion

  //#region Output Events

  @Output() searchSubmit = new EventEmitter<SearchFilters>();
  @Output() loginClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();
  @Output() cartClick = new EventEmitter<void>();
  @Output() locationChange = new EventEmitter<Location>();
  @Output() categoryClick = new EventEmitter<Category>();
  @Output() mobileMenuToggle = new EventEmitter<boolean>();
  @Output() languageChange = new EventEmitter<string>();
  @Output() wishlistClick = new EventEmitter<void>();
  @Output() topBarLinkClick = new EventEmitter<string>();
  @Output() quickAccessClick = new EventEmitter<string>();

  /** Emitted when user removes an item via mini-cart dropdown (SS-CART-010) */
  @Output() cartRemoveItem = new EventEmitter<CartItem>();

  //#endregion

  //#region Public State

  selectedLocation: Location | null = null;
  mobileMenuOpen = false;
  filteredLocations: Location[] = [];

  /**
   * Active mega menu category ID for hover highlight in Row 3
   * Set when hovering featured categories, cleared on hide
   */
  activeMegaMenu: string | null = null;

  //#endregion

  //#region S1 Sprint Mega Menu State

  /** Category tree from API (loaded once, cached) */
  categoryTree = signal<CategoryTreeNode[]>([]);

  /** Overlay mega menu open state (click "All Categories") */
  megaMenuOpen = signal<boolean>(false);

  /** Dropdown mega menu open state (hover over featured categories) */
  megaMenuDropdownOpen = signal<boolean>(false);

  /** Loading state for category tree */
  categoryTreeLoading = signal<boolean>(false);

  /** Whether category tree has been loaded */
  private categoryTreeLoaded = false;

  //#endregion

  //#region Private Properties

  private destroyRef = inject(DestroyRef);
  private categoryApiService = inject(CategoryApiService);
  private router = inject(Router);

  private readonly defaultLocations: Location[] = [
    { id: 'damascus', name: 'Damascus', nameAr: 'دمشق', type: 'city', deliveryAvailable: true },
    { id: 'aleppo', name: 'Aleppo', nameAr: 'حلب', type: 'city', deliveryAvailable: true },
    { id: 'homs', name: 'Homs', nameAr: 'حمص', type: 'city', deliveryAvailable: true },
    { id: 'lattakia', name: 'Lattakia', nameAr: 'اللاذقية', type: 'city', deliveryAvailable: true }
  ];

  //#endregion

  //#region Lifecycle

  ngOnInit(): void {
    this.initializeDefaultLocation();
    this.initializeCategoryData();
  }

  //#endregion

  //#region Category Tree Loading

  /** Lazy-load category tree from API on first interaction */
  private loadCategoryTree(): void {
    if (this.categoryTreeLoaded || this.categoryTreeLoading()) return;

    this.categoryTreeLoading.set(true);
    this.categoryApiService.getTree()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categoryTree.set(response.data);
          this.categoryTreeLoaded = true;
          this.categoryTreeLoading.set(false);
        },
        error: () => {
          this.categoryTreeLoading.set(false);
        }
      });
  }

  //#endregion

  //#region Mega Menu — Overlay Mode (All Categories click)

  /** "All Categories" button click — opens overlay mega menu */
  onCategoriesClick(): void {
    if (!this.categoryTreeLoaded) this.loadCategoryTree();
    this.megaMenuDropdownOpen.set(false);
    this.activeMegaMenu = null;
    this.megaMenuOpen.set(!this.megaMenuOpen());
  }

  onMegaMenuCategorySelected(slug: string): void {
    this.megaMenuOpen.set(false);
    this.megaMenuDropdownOpen.set(false);
    this.activeMegaMenu = null;
  }

  onMegaMenuClosed(): void {
    this.megaMenuOpen.set(false);
    this.megaMenuDropdownOpen.set(false);
    this.activeMegaMenu = null;
  }

  //#endregion

  //#region Mega Menu — Dropdown Mode (hover on featured categories)

  /**
   * CategoryNavigationComponent emits megaMenuShow after 150ms hover intent
   * @param categoryId - Hovered category ID
   */
  showMegaMenu(categoryId: string): void {
    if (!this.categoryTreeLoaded) this.loadCategoryTree();
    this.megaMenuOpen.set(false); // Close overlay if open
    this.activeMegaMenu = categoryId;
    this.megaMenuDropdownOpen.set(true);
  }

  /** CategoryNavigationComponent emits megaMenuHide after 300ms leave */
  hideMegaMenu(): void {
    this.activeMegaMenu = null;
    this.megaMenuDropdownOpen.set(false);
  }

  /** Mega menu container mouseenter — cancel pending hide */
  onDropdownMenuMouseEnter(): void {
    // Mouse entered mega menu dropdown: keep it open
    // The CategoryNavigationComponent's cancelHiding() is called via template
  }

  /** Mega menu container mouseleave — trigger hide */
  onDropdownMenuMouseLeave(): void {
    this.activeMegaMenu = null;
    this.megaMenuDropdownOpen.set(false);
  }

  //#endregion

  //#region Mobile Category Navigation

  onMobileCategorySelected(slug: string): void {
    this.router.navigate(['/category', slug]);
    this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.mobileMenuToggle.emit(this.mobileMenuOpen);
    if (this.mobileMenuOpen && !this.categoryTreeLoaded) {
      this.loadCategoryTree();
    }
  }

  closeMobileMenu(): void {
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      this.mobileMenuToggle.emit(false);
    }
  }

  //#endregion

  //#region Event Handlers

  onSearchSubmit(query: string): void {
    const searchFilters: SearchFilters = {
      query: query?.trim(),
      category: 'all',
      location: this.selectedLocation?.id
    };
    if (searchFilters.query) this.searchSubmit.emit(searchFilters);
  }

  onLoginClick(): void { this.loginClick.emit(); }
  onLogoutClick(): void { this.logoutClick.emit(); }
  onCartClick(): void { this.cartClick.emit(); }
  onCartRemoveItem(item: CartItem): void { this.cartRemoveItem.emit(item); }
  onWishlistClick(): void { this.wishlistClick.emit(); }
  onTopBarLinkClick(linkId: string): void { this.topBarLinkClick.emit(linkId); }
  onQuickAccessItemClick(itemId: string): void { this.quickAccessClick.emit(itemId); }

  onLocationSelect(location: Location): void {
    this.selectedLocation = location;
    this.locationChange.emit(location);
  }

  onCategoryClick(category: Category): void {
    this.categoryClick.emit(category);
    this.closeMobileMenu();
  }

  onLanguageChange(language: string): void {
    if (this.config.language === language) return;
    this.config = { ...this.config, language: language as 'en' | 'ar', rtl: language === 'ar' };
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
    this.languageChange.emit(language);
  }

  getCategoryText(category: Category): string {
    return this.config.language === 'ar' ? category.nameAr : category.name;
  }

  trackByCategory(_index: number, category: Category): string {
    return category.id;
  }

  trackByLocation(_index: number, location: Location): string {
    return location.id;
  }

  //#endregion

  //#region Private Methods

  private initializeDefaultLocation(): void {
    const availableLocations = this.locations.length > 0 ? this.locations : this.defaultLocations;
    this.filteredLocations = availableLocations;
    const defaultLocation = availableLocations.find(loc => loc.id === 'damascus');
    if (defaultLocation) this.selectedLocation = defaultLocation;
  }

  private initializeCategoryData(): void {
    if (this.categories.length === 0) {
      this.categories = [...HEADER_NAV_CATEGORIES];
    }
    if (this.config.featuredCategories.length === 0) {
      this.config.featuredCategories = HEADER_NAV_CATEGORIES;
    }
  }

  //#endregion
}
