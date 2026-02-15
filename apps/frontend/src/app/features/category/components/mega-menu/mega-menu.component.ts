/**
 * Mega Menu Component
 *
 * @description Responsive mega menu for category navigation with desktop hover
 * and mobile accordion behaviors. Supports RTL layout and keyboard accessibility.
 *
 * @pattern Smart Component
 * - Desktop: hover-activated mega menu with subcategory grid
 * - Mobile: full-screen accordion overlay with slide animation
 * - Keyboard navigation with arrow keys and Escape
 * - RTL-aware layout mirroring
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
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Mega Menu Component for category navigation
 *
 * @description Provides responsive mega menu with hover (desktop) and
 * accordion (mobile) behaviors. Includes keyboard navigation and RTL support.
 *
 * @example
 * ```html
 * <app-mega-menu
 *   [categories]="categories"
 *   [isOpen]="menuOpen"
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
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
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
  /**
   * Category tree data for menu structure
   *
   * @input
   */
  @Input() categories: CategoryTreeNode[] = [];

  /**
   * Menu open/closed state
   *
   * @input
   */
  @Input() isOpen = false;

  /**
   * Display mode: 'overlay' (full screen click) or 'dropdown' (positioned below nav bar on hover)
   *
   * @input
   * @default 'overlay'
   */
  @Input() displayMode: 'overlay' | 'dropdown' = 'overlay';

  /**
   * Event emitted when user selects a category
   *
   * @output
   * @emits {string} categorySlug - Selected category slug
   */
  @Output() categorySelected = new EventEmitter<string>();

  /**
   * Event emitted when menu is closed
   *
   * @output
   */
  @Output() menuClosed = new EventEmitter<void>();

  /**
   * Event emitted when mouse enters the mega menu container (for hover intent)
   *
   * @output
   */
  @Output() menuMouseEnter = new EventEmitter<void>();

  /**
   * Event emitted when mouse leaves the mega menu container (for hover intent)
   *
   * @output
   */
  @Output() menuMouseLeave = new EventEmitter<void>();

  /** Currently active/hovered category */
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

  /** Computed: slide animation params based on RTL direction */
  slideAnimationParams = computed(() => {
    const direction = this.isRtl() ? 'translateX(-100%)' : 'translateX(100%)';
    return { enterFrom: direction, leaveTo: direction };
  });

  /** Computed: categories to display in current view */
  displayCategories = computed(() => {
    if (this.isMobile() && this.currentMobileCategory()) {
      return this.currentMobileCategory()?.children || [];
    }
    return this.categories;
  });

  /** Bound resize handler for proper cleanup (avoids .bind() identity mismatch) */
  private resizeHandler = () => this.checkMobileView();

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  /**
   * Initialize component — detect viewport and RTL, attach resize listener
   *
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
   *
   * @lifecycle
   */
  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Handle category hover (desktop only)
   *
   * @param category - Category being hovered
   */
  onCategoryHover(category: CategoryTreeNode): void {
    if (!this.isMobile()) {
      this.activeCategory.set(category);
    }
  }

  /**
   * Handle category click for mobile accordion
   *
   * @param category - Category being clicked
   */
  onCategoryClick(category: CategoryTreeNode): void {
    if (this.isMobile()) {
      if (category.children && category.children.length > 0) {
        // Push to stack and show children
        this.categoryStack.update(stack => [...stack, category]);
        this.currentMobileCategory.set(category);
      } else {
        // Navigate to category page
        this.navigateToCategory(category.slug);
      }
    } else {
      this.navigateToCategory(category.slug);
    }
  }

  /**
   * Navigate to category page
   *
   * @param slug - Category slug for routing
   */
  navigateToCategory(slug: string): void {
    this.categorySelected.emit(slug);
    this.router.navigate(['/categories', slug]);
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

  /**
   * Listen for Escape key to close menu
   *
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
   *
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
        if (!this.isMobile() && this.activeCategory()) {
          // Focus on subcategories
          const active = this.activeCategory();
          if (active && active.children && active.children.length > 0) {
            // Could implement subcategory navigation
          }
        }
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

  /**
   * Check if viewport is mobile size
   *
   * @private
   */
  private checkMobileView(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 1024);
    }
  }

  /**
   * Detect RTL layout from document
   *
   * @private
   */
  private detectRTL(): void {
    if (isPlatformBrowser(this.platformId)) {
      const dir = document.documentElement.getAttribute('dir');
      this.isRtl.set(dir === 'rtl');
    }
  }

  /**
   * Get category display name based on locale
   *
   * @param category - Category object
   * @returns Localized category name
   */
  getCategoryName(category: CategoryTreeNode): string {
    return this.isRtl() ? category.nameAr : category.name;
  }

  /**
   * Handle image load error with fallback
   *
   * @param event - Error event
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/placeholder-category.png';
  }
}
