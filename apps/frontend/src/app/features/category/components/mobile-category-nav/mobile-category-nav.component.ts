/**
 * Mobile Category Navigation Component
 *
 * @description Full-screen overlay with expandable category tree navigation
 * for mobile devices. Uses Material accordion for hierarchical category display.
 *
 * @pattern Dumb/Presentational Component
 * - Receives data via inputs
 * - Emits events for parent handling
 * - No service injection
 * - OnPush change detection
 *
 * @features
 * - Full-screen overlay with backdrop
 * - Material accordion for expandable categories
 * - 3-level category hierarchy support
 * - Slide-in animation (right to left, or left to right for RTL)
 * - Touch-friendly tap targets (min 48px)
 * - Bilingual support (English/Arabic)
 * - RTL layout detection
 * - Keyboard support (Escape to close)
 * - Backdrop click to close
 * - Loading skeleton state
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CategoryTreeNode } from '../../models/category-tree.interface';

/**
 * Mobile Category Navigation Component
 *
 * @description Provides full-screen mobile navigation with expandable
 * category hierarchy using Material Design accordion patterns.
 *
 * @component
 */
@Component({
  selector: 'app-mobile-category-nav',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
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
      transition('void => *', animate('200ms ease-out')),
      transition('* => void', animate('200ms ease-out')),
    ]),
    trigger('slideInRtl', [
      state('void', style({
        transform: 'translateX(-100%)',
      })),
      state('*', style({
        transform: 'translateX(0)',
      })),
      transition('void => *', animate('200ms ease-out')),
      transition('* => void', animate('200ms ease-out')),
    ]),
    trigger('fadeIn', [
      state('void', style({
        opacity: 0,
      })),
      state('*', style({
        opacity: 1,
      })),
      transition('void => *', animate('200ms ease-out')),
      transition('* => void', animate('200ms ease-out')),
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
   * RTL mode detection
   *
   * @description Computed signal that detects if the document is in RTL mode
   */
  isRtl = computed(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.dir === 'rtl';
    }
    return false;
  });

  /**
   * Skeleton items for loading state
   *
   * @description Array of placeholder items for skeleton display
   */
  skeletonItems = signal(Array.from({ length: 6 }, (_, i) => i));

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
   * @description Emits menu closed event
   */
  closeMenu(): void {
    this.menuClosed.emit();
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
    return this.isRtl() ? category.nameAr : category.name;
  }

  /**
   * Check if category has children
   *
   * @description Determines if a category node has subcategories
   * @param category - Category tree node
   * @returns True if category has children
   */
  hasChildren(category: CategoryTreeNode): boolean {
    return category.children && category.children.length > 0;
  }
}
