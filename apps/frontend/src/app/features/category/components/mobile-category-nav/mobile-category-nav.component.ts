/**
 * Mobile Category Navigation Component
 *
 * @description Full-screen overlay with expandable category tree navigation
 * for mobile devices. Uses Material Design components and patterns.
 *
 * @pattern Dumb/Presentational Component
 * - Receives data via inputs
 * - Emits events for parent handling
 * - No service injection
 * - OnPush change detection
 *
 * @features
 * - Full-screen overlay with Material backdrop
 * - Material navigation list (mat-nav-list) for semantic hierarchy
 * - Material icon buttons for controls
 * - Material ripple effect on category items
 * - 3-level category hierarchy support with drill-down
 * - Slide-in animation (right to left, or left to right for RTL)
 * - Touch-friendly tap targets (min 48px)
 * - Bilingual support (English/Arabic)
 * - RTL layout support
 * - Keyboard support (Escape to close, Enter/Space for selection)
 * - Backdrop click to close
 * - Loading skeleton state
 * - WCAG 2.1 AA accessibility compliance
 *
 * @swagger
 * components:
 *   schemas:
 *     MobileCategoryNavComponent:
 *       type: object
 *       description: Mobile category navigation overlay
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryTreeNode'
 *           description: Category tree data
 *         isOpen:
 *           type: boolean
 *           description: Overlay visibility state
 *         isLoading:
 *           type: boolean
 *           description: Loading state for skeleton display
 *         isRtl:
 *           type: boolean
 *           description: RTL mode flag
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CategoryTreeNode } from '../../models/category-tree.interface';

/**
 * Mobile Category Navigation Component
 *
 * @description Provides full-screen mobile navigation with expandable
 * category hierarchy using Material Design patterns.
 *
 * @component
 */
@Component({
  selector: 'app-mobile-category-nav',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatRippleModule,
  ],
  templateUrl: './mobile-category-nav.component.html',
  styleUrls: ['./mobile-category-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      state('void', style({
        transform: 'translateX(100%)',
      })),
      state('*', style({
        transform: 'translateX(0)',
      })),
      transition('void => *', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')),
      transition('* => void', animate('200ms cubic-bezier(0.4, 0, 1, 1)')),
    ]),
    trigger('slideInRtl', [
      state('void', style({
        transform: 'translateX(-100%)',
      })),
      state('*', style({
        transform: 'translateX(0)',
      })),
      transition('void => *', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')),
      transition('* => void', animate('200ms cubic-bezier(0.4, 0, 1, 1)')),
    ]),
    trigger('fadeIn', [
      state('void', style({
        opacity: 0,
      })),
      state('*', style({
        opacity: 1,
      })),
      transition('void => *', animate('200ms ease-out')),
      transition('* => void', animate('150ms ease-in')),
    ]),
  ],
})
export class MobileCategoryNavComponent {
  /**
   * Category tree data
   *
   * @description Hierarchical category structure with up to 3 levels
   */
  @Input() categories: CategoryTreeNode[] = [];

  /**
   * Overlay visibility state
   *
   * @description Controls whether the mobile menu overlay is displayed
   */
  @Input() isOpen = false;

  /**
   * Loading state
   *
   * @description Shows skeleton loader when true
   */
  @Input() isLoading = false;

  /**
   * RTL mode provided by parent component
   *
   * @description Input for RTL mode. A computed() with no signal deps
   * would evaluate only once and become stale if direction changes at runtime.
   * Instead, accept this as an input from the parent which tracks language state.
   */
  @Input() isRtl = false;

  /**
   * Category selected event
   *
   * @description Emits category slug when user selects a category
   */
  @Output() categorySelected = new EventEmitter<string>();

  /**
   * Menu closed event
   *
   * @description Emits when user closes the menu (backdrop click, X button, or Escape key)
   */
  @Output() menuClosed = new EventEmitter<void>();

  /**
   * Skeleton items for loading state
   *
   * @description Array of placeholder items for skeleton display
   */
  skeletonItems = signal(Array.from({ length: 6 }, (_, i) => i));

  /**
   * Navigation stack for drill-down tracking
   *
   * @description Tracks the hierarchy of categories the user has drilled into.
   * Each entry contains the parent category being viewed.
   */
  navigationStack = signal<CategoryTreeNode[]>([]);

  /**
   * Current view categories
   *
   * @description Computed signal that returns the categories to display based on
   * the navigation stack. If stack is empty, shows top-level categories.
   * If stack has items, shows children of the last item in the stack.
   */
  currentCategories = computed(() => {
    const stack = this.navigationStack();
    if (stack.length === 0) {
      return this.categories;
    }
    const currentParent = stack[stack.length - 1];
    return currentParent.children || [];
  });

  /**
   * Is in drill-down mode
   *
   * @description Computed signal that indicates whether the user has drilled
   * into a subcategory view. True when navigation stack is not empty.
   */
  isInDrillDown = computed(() => this.navigationStack().length > 0);

  /**
   * Current parent category
   *
   * @description Computed signal that returns the current parent category
   * when in drill-down mode, or null when viewing top-level categories.
   */
  currentParent = computed(() => {
    const stack = this.navigationStack();
    return stack.length > 0 ? stack[stack.length - 1] : null;
  });

  /**
   * Handle Escape key press
   *
   * @description Closes the menu when Escape key is pressed
   * @param event - Keyboard event
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.isOpen) {
      event.preventDefault();
      this.closeMenu();
    }
  }

  /**
   * Handle category selection
   *
   * @description Emits the category slug and closes the menu
   * @param slug - Category slug for navigation
   */
  onCategoryClick(slug: string): void {
    this.categorySelected.emit(slug);
    this.closeMenu();
  }

  /**
   * Close the mobile menu
   *
   * @description Emits menu closed event and resets navigation stack
   */
  closeMenu(): void {
    this.navigationStack.set([]);
    this.menuClosed.emit();
  }

  /**
   * Navigate into a parent category to view its children
   *
   * @description Pushes a category onto the navigation stack to drill down
   * into its subcategories. Only works for categories that have children.
   * @param category - Parent category to drill into
   */
  drillInto(category: CategoryTreeNode): void {
    if (this.hasChildren(category)) {
      this.navigationStack.update(stack => [...stack, category]);
    }
  }

  /**
   * Navigate back to the previous level
   *
   * @description Pops the last category from the navigation stack,
   * returning the user to the parent level view.
   */
  goBack(): void {
    this.navigationStack.update(stack => {
      const newStack = [...stack];
      newStack.pop();
      return newStack;
    });
  }

  /**
   * Handle backdrop click
   *
   * @description Closes the menu when user clicks outside the menu area
   * @param event - Mouse event
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('mobile-nav-backdrop')) {
      this.closeMenu();
    }
  }

  /**
   * Get category display name
   *
   * @description Returns the appropriate category name based on RTL mode
   * @param category - Category tree node
   * @returns Category name in current language
   */
  getCategoryName(category: CategoryTreeNode): string {
    return this.isRtl ? category.nameAr : category.name;
  }

  /**
   * Check if category has children
   *
   * @description Determines if a category node has subcategories
   * @param category - Category tree node
   * @returns True if category has children
   */
  hasChildren(category: CategoryTreeNode): boolean {
    return !!category.children && category.children.length > 0;
  }

  /**
   * TrackBy function for ngFor performance optimization
   *
   * @description Tracks category items by their unique ID for efficient DOM updates
   * @param index - Item index in the array
   * @param item - Category tree node or skeleton item
   * @returns Unique identifier
   */
  trackById(index: number, item: CategoryTreeNode | number): number {
    return typeof item === 'number' ? item : item.id;
  }
}
