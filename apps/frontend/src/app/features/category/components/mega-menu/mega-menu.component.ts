/**
 * Mega Menu Component
 *
 * @description Responsive mega menu for category navigation with desktop hover
 * and mobile accordion behaviors. Supports both category-specific dropdown
 * (from HEADER_NAV_CATEGORIES) and full tree overlay (from API).
 *
 * @pattern Smart Component
 * - Dropdown: category-specific subcategories with sidebar/fullwidth layout
 * - Overlay: full category tree with hover-activated subcategory grid
 * - Mobile: full-screen accordion with back button navigation
 * - Keyboard navigation with arrow keys and Escape
 * - RTL-aware layout mirroring
 * - Golden wheat SouqSyria theme with glassmorphism
 *
 * @swagger
 * components:
 *   schemas:
 *     MegaMenuComponent:
 *       type: object
 *       description: Category mega menu navigation component
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryTreeNode'
 *           description: Hierarchical category tree data
 *         hoveredCategory:
 *           $ref: '#/components/schemas/Category'
 *           description: Currently hovered category from HEADER_NAV_CATEGORIES
 *         isOpen:
 *           type: boolean
 *           description: Menu open state
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CategoryTreeNode } from '../../models/category-tree.interface';
import { Category, Subcategory, MenuColumn, FeaturedTile, MegaMenuFeaturedProduct } from '../../../../shared/interfaces/navigation.interface';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Mega Menu Component for category navigation
 *
 * @description Provides responsive mega menu with hover (desktop) and
 * accordion (mobile) behaviors. Dropdown mode shows category-specific
 * content from HEADER_NAV_CATEGORIES. Overlay mode shows full API tree.
 *
 * @example
 * ```html
 * <app-mega-menu
 *   [categories]="categories"
 *   [hoveredCategory]="hoveredCategoryData"
 *   [isOpen]="menuOpen"
 *   [displayMode]="'dropdown'"
 *   (categorySelected)="onCategorySelect($event)"
 *   (menuClosed)="onMenuClose()">
 * </app-mega-menu>
 * ```
 *
 * @component
 */
@Component({
  selector: 'app-mega-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './mega-menu.component.html',
  styleUrls: ['./mega-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: '{{ enterFrom }}' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: '{{ leaveTo }}' }))
      ])
    ])
  ]
})
export class MegaMenuComponent implements OnInit, OnDestroy {

  //#region Input Properties

  /**
   * Category tree data for overlay mode (full API tree)
   * @input
   */
  @Input() categories: CategoryTreeNode[] = [];

  /**
   * Currently hovered category from HEADER_NAV_CATEGORIES
   * @description Used in dropdown mode to show category-specific subcategories,
   * featured products, menu columns, and featured tiles
   * @input
   */
  @Input() hoveredCategory: Category | null = null;

  /**
   * Menu open/closed state
   * @input
   */
  @Input() isOpen = false;

  /**
   * Display mode: 'overlay' (full screen click) or 'dropdown' (positioned below nav bar on hover)
   * @input
   * @default 'overlay'
   */
  @Input() displayMode: 'overlay' | 'dropdown' = 'overlay';

  //#endregion

  //#region Output Events

  /**
   * Event emitted when user selects a category
   * @output
   * @emits {string} categorySlug - Selected category slug
   */
  @Output() categorySelected = new EventEmitter<string>();

  /** Event emitted when menu is closed */
  @Output() menuClosed = new EventEmitter<void>();

  /** Event emitted when mouse enters the mega menu container (for hover intent) */
  @Output() menuMouseEnter = new EventEmitter<void>();

  /** Event emitted when mouse leaves the mega menu container (for hover intent) */
  @Output() menuMouseLeave = new EventEmitter<void>();

  //#endregion

  //#region Signals

  /** Currently active/hovered category in overlay mode */
  activeCategory = signal<CategoryTreeNode | null>(null);

  /** Mobile view state (screen < 1024px) */
  isMobile = signal<boolean>(false);

  /** RTL layout state */
  isRtl = signal<boolean>(false);

  /** Category navigation history for mobile back button */
  categoryStack = signal<CategoryTreeNode[]>([]);

  /** Currently visible category level in mobile view */
  currentMobileCategory = signal<CategoryTreeNode | null>(null);

  /** Focused category index for keyboard navigation */
  focusedCategoryIndex = signal<number>(0);

  //#endregion

  //#region Computed Properties

  /** Computed: slide animation params based on RTL direction */
  slideAnimationParams = computed(() => {
    const direction = this.isRtl() ? 'translateX(-100%)' : 'translateX(100%)';
    return { enterFrom: direction, leaveTo: direction };
  });

  /** Computed: categories to display in current overlay view */
  displayCategories = computed(() => {
    if (this.isMobile() && this.currentMobileCategory()) {
      return this.currentMobileCategory()?.children || [];
    }
    return this.categories;
  });

  //#endregion

  /** Bound resize handler for proper cleanup */
  private resizeHandler = () => this.checkMobileView();

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  //#region Lifecycle

  /**
   * Initialize component — detect viewport and RTL, attach resize listener
   * @lifecycle
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobileView();
      this.detectRTL();
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Cleanup resize listener on destroy
   * @lifecycle
   */
  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  //#endregion

  //#region Dropdown Mode Helpers (Category-Specific Content)

  /**
   * Check if hovered category uses sidebar layout
   * @description Sidebar layout: left subcategory list + right featured products
   * @returns True if megaMenuType is 'sidebar' or has subcategories without menuColumns
   */
  get isSidebarLayout(): boolean {
    if (!this.hoveredCategory) return true;
    return this.hoveredCategory.megaMenuType === 'sidebar' ||
           (!this.hoveredCategory.menuColumns && !!this.hoveredCategory.subcategories?.length);
  }

  /**
   * Check if hovered category uses fullwidth layout
   * @description Fullwidth layout: multi-column grid with featured tiles
   * @returns True if megaMenuType is 'fullwidth'
   */
  get isFullwidthLayout(): boolean {
    return this.hoveredCategory?.megaMenuType === 'fullwidth';
  }

  /**
   * Get subcategories for the hovered category
   * @returns Array of subcategories
   */
  get subcategories(): Subcategory[] {
    return this.hoveredCategory?.subcategories || [];
  }

  /**
   * Get menu columns for fullwidth layout
   * @returns Array of menu columns
   */
  get menuColumns(): MenuColumn[] {
    return this.hoveredCategory?.menuColumns || [];
  }

  /**
   * Get featured tiles for fullwidth layout
   * @returns Array of featured tiles
   */
  get featuredTiles(): FeaturedTile[] {
    return this.hoveredCategory?.featuredTiles || [];
  }

  /**
   * Get featured products for sidebar layout
   * @returns Array of featured products
   */
  get featuredProducts(): MegaMenuFeaturedProduct[] {
    return this.hoveredCategory?.megaMenuFeaturedProducts || [];
  }

  /**
   * Get hovered category display name based on locale
   * @returns Localized category name
   */
  getHoveredCategoryName(): string {
    if (!this.hoveredCategory) return '';
    return this.isRtl() ? this.hoveredCategory.nameAr : this.hoveredCategory.name;
  }

  /**
   * Get localized name for subcategory
   * @param sub - Subcategory object
   * @returns Localized subcategory name
   */
  getSubcategoryName(sub: Subcategory): string {
    return this.isRtl() ? sub.nameAr : sub.name;
  }

  /**
   * Get localized text from bilingual object
   * @param en - English text
   * @param ar - Arabic text
   * @returns Text in current language
   */
  getLocalizedText(en: string, ar: string): string {
    return this.isRtl() ? ar : en;
  }

  /**
   * Navigate to a URL and close the menu
   * @param url - URL to navigate to
   */
  navigateToUrl(url: string): void {
    this.router.navigateByUrl(url);
    this.close();
  }

  /**
   * Handle image load error with gradient fallback
   * @param event - Error event
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.classList.add('sq-img-fallback');
    }
  }

  //#endregion

  //#region Overlay Mode Handlers (API Tree)

  /**
   * Handle category hover in overlay mode (desktop only)
   * @param category - Category being hovered
   */
  onCategoryHover(category: CategoryTreeNode): void {
    if (!this.isMobile()) {
      this.activeCategory.set(category);
    }
  }

  /**
   * Handle category click for mobile accordion
   * @param category - Category being clicked
   */
  onCategoryClick(category: CategoryTreeNode): void {
    if (this.isMobile()) {
      if (category.children && category.children.length > 0) {
        this.categoryStack.update(stack => [...stack, category]);
        this.currentMobileCategory.set(category);
      } else {
        this.navigateToCategory(category.slug);
      }
    } else {
      this.navigateToCategory(category.slug);
    }
  }

  /**
   * Navigate to category page
   * @param slug - Category slug for routing
   */
  navigateToCategory(slug: string): void {
    this.categorySelected.emit(slug);
    this.router.navigate(['/category', slug]);
    this.close();
  }

  /**
   * Go back to parent category (mobile only)
   */
  goBack(): void {
    this.categoryStack.update(stack => {
      const newStack = [...stack];
      newStack.pop();
      const parent = newStack[newStack.length - 1] || null;
      this.currentMobileCategory.set(parent);
      return newStack;
    });
  }

  /**
   * Close menu and reset state
   */
  close(): void {
    this.activeCategory.set(null);
    this.currentMobileCategory.set(null);
    this.categoryStack.set([]);
    this.focusedCategoryIndex.set(0);
    this.menuClosed.emit();
  }

  //#endregion

  //#region Keyboard Navigation

  /**
   * Listen for Escape key to close menu
   * @param event - Keyboard event
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      event.preventDefault();
      this.close();
    }
  }

  /**
   * Handle keyboard navigation
   * @param event - Keyboard event
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardNav(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    const categories = this.displayCategories();
    const currentIndex = this.focusedCategoryIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedCategoryIndex.set(
          Math.min(currentIndex + 1, categories.length - 1)
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedCategoryIndex.set(Math.max(currentIndex - 1, 0));
        break;
      case 'ArrowRight':
        event.preventDefault();
        break;
      case 'Enter':
        event.preventDefault();
        const selectedCategory = categories[currentIndex];
        if (selectedCategory) {
          this.onCategoryClick(selectedCategory);
        }
        break;
    }
  }

  //#endregion

  //#region Utility Helpers

  /**
   * Get category display name based on locale (for overlay tree nodes)
   * @param category - Category object
   * @returns Localized category name
   */
  getCategoryName(category: CategoryTreeNode): string {
    return this.isRtl() ? category.nameAr : category.name;
  }

  private checkMobileView(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 1024);
    }
  }

  private detectRTL(): void {
    if (isPlatformBrowser(this.platformId)) {
      const dir = document.documentElement.getAttribute('dir');
      this.isRtl.set(dir === 'rtl');
    }
  }

  //#endregion
}
