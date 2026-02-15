/**
 * @fileoverview Category Navigation Component for SouqSyria
 * @description Row 3 navigation bar with featured categories and hover intent
 * for triggering the S1 Sprint MegaMenuComponent via parent events.
 */

import { Component, Input, Output, EventEmitter, OnInit, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Category, NavigationConfig } from '../../interfaces/navigation.interface';

/**
 * Category Navigation Bar Component (Row 3)
 *
 * @description Displays the horizontal category nav bar for desktop.
 * Emits hover intent events so the parent (HeaderComponent) can
 * open/close the unified S1 Sprint MegaMenuComponent in dropdown mode.
 *
 * @example
 * ```html
 * <app-category-navigation
 *   [config]="config"
 *   [categories]="categories"
 *   [featuredCategories]="config.featuredCategories"
 *   [activeMegaMenu]="activeMegaMenu"
 *   (categoryClick)="onCategoryClick($event)"
 *   (megaMenuShow)="onMegaMenuShow($event)"
 *   (megaMenuHide)="onMegaMenuHide()"
 *   (allCategoriesClick)="onCategoriesClick()"
 * ></app-category-navigation>
 * ```
 */
@Component({
  selector: 'app-category-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './category-navigation.component.html',
  styleUrl: './category-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryNavigationComponent implements OnInit {

  /** Navigation configuration options */
  @Input() config: NavigationConfig = {
    showArabic: true,
    language: 'en',
    rtl: false,
    locations: [],
    featuredCategories: []
  };

  /** All available product categories */
  @Input() categories: Category[] = [];

  /** Featured categories for main navigation */
  @Input() featuredCategories: Category[] = [];

  /** Currently active mega menu category (set by parent) */
  @Input() activeMegaMenu: string | null = null;

  /** Emitted when a category link is clicked */
  @Output() categoryClick = new EventEmitter<Category>();

  /** Emitted after hover intent delay to request mega menu show */
  @Output() megaMenuShow = new EventEmitter<string>();

  /** Emitted to request mega menu hide */
  @Output() megaMenuHide = new EventEmitter<void>();

  /** Emitted when "All Categories" button is clicked */
  @Output() allCategoriesClick = new EventEmitter<void>();

  /** Emitted when special offers link is clicked */
  @Output() specialOffersClick = new EventEmitter<void>();

  /** Emitted when flash sale link is clicked */
  @Output() flashSaleClick = new EventEmitter<void>();

  /** Syrian e-commerce promotional links */
  readonly promotionalLinks = [
    { id: 'special-offers', nameEn: 'Special Offers', nameAr: 'عروض خاصة', icon: 'local_offer', url: '/offers' },
    { id: 'flash-sale', nameEn: 'Flash Sale', nameAr: 'تخفيضات', icon: 'flash_on', url: '/flash-sale' }
  ];

  private destroyRef = inject(DestroyRef);
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hoverIntentCategoryId: string | null = null;

  ngOnInit(): void {
    this.initializeFeaturedCategories();

    this.destroyRef.onDestroy(() => {
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
      if (this.showTimeout) clearTimeout(this.showTimeout);
    });
  }

  /**
   * Hover intent: show mega menu after 150ms delay
   * @param categoryId - Category being hovered
   */
  onShowMegaMenu(categoryId: string): void {
    this.hoverIntentCategoryId = categoryId;
    this.cancelHiding();
    this.cancelShowing();

    if (this.activeMegaMenu === categoryId) return;

    this.showTimeout = setTimeout(() => {
      if (this.hoverIntentCategoryId === categoryId) {
        this.megaMenuShow.emit(categoryId);
      }
      this.showTimeout = null;
    }, 150);
  }

  /** Hover leave: hide mega menu after 300ms delay */
  onHideMegaMenu(): void {
    this.hoverIntentCategoryId = null;
    this.cancelShowing();

    if (this.hideTimeout) clearTimeout(this.hideTimeout);

    this.hideTimeout = setTimeout(() => {
      this.megaMenuHide.emit();
      this.hideTimeout = null;
    }, 300);
  }

  /** Cancel pending hide (called when mouse enters mega menu) */
  cancelHiding(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /** Cancel pending show */
  cancelShowing(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  onCategoryClick(category: Category): void {
    this.categoryClick.emit(category);
    this.megaMenuHide.emit();
  }

  onAllCategoriesClick(): void {
    this.allCategoriesClick.emit();
    this.megaMenuHide.emit();
  }

  onPromotionalLinkClick(linkId: string): void {
    if (linkId === 'special-offers') this.specialOffersClick.emit();
    if (linkId === 'flash-sale') this.flashSaleClick.emit();
  }

  getCategoryText(category: Category): string {
    return this.config.language === 'ar' ? category.nameAr : category.name;
  }

  getPromotionalText(link: { nameEn: string; nameAr: string }): string {
    return this.config.language === 'ar' ? link.nameAr : link.nameEn;
  }

  trackByCategory(_index: number, category: Category): string {
    return category.id;
  }

  isMegaMenuActive(categoryId: string): boolean {
    return this.activeMegaMenu === categoryId;
  }

  private initializeFeaturedCategories(): void {
    if (this.featuredCategories.length === 0 && this.categories.length > 0) {
      this.featuredCategories = this.categories
        .filter(category => category.featured)
        .slice(0, 8);
    }
  }
}
