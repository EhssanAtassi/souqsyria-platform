import { Component, ChangeDetectionStrategy, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { ThemeProductComponent } from '../theme-product/theme-product.component';
import { ThemeTitleComponent } from '../theme-title/theme-title.component';
import { CategoryService } from '../../../services/category.service';

/**
 * Category Tab Interface
 */
export interface CategoryTab {
  id: string;
  label: string;
  labelAr?: string;
  categorySlug: string;
  icon?: string;
}

/**
 * Theme Product Tab Section Component
 *
 * Displays products organized by category tabs
 * Combines Material tabs with theme-product component
 *
 * Features:
 * - Category-based tabbed navigation
 * - Dynamic product loading per tab
 * - Bilingual tab labels (English/Arabic)
 * - Configurable product display options
 * - Golden Wheat design system
 * - Integration with CategoryService
 *
 * @swagger
 * components:
 *   schemas:
 *     ThemeProductTabSectionComponent:
 *       type: object
 *       description: Tabbed product section with category filtering
 *       properties:
 *         title:
 *           type: string
 *           description: Section title
 *         titleAr:
 *           type: string
 *           description: Section title in Arabic
 *         tabs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryTab'
 *           description: Category tab configuration
 *         productsPerTab:
 *           type: number
 *           description: Number of products to show per tab
 *         columns:
 *           type: number
 *           description: Grid column count
 *
 * @example
 * ```html
 * <app-theme-product-tab-section
 *   [title]="'Shop by Category'"
 *   [titleAr]="'تسوق حسب الفئة'"
 *   [tabs]="categoryTabs"
 *   [productsPerTab]="8"
 *   [columns]="4">
 * </app-theme-product-tab-section>
 * ```
 */
@Component({
  selector: 'app-theme-product-tab-section',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    ThemeProductComponent,
    ThemeTitleComponent
  ],
  templateUrl: './theme-product-tab-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./theme-product-tab-section.component.scss']
})
export class ThemeProductTabSectionComponent implements OnInit {
  /**
   * Section title
   */
  @Input() title: string = 'Featured Products';

  /**
   * Section title in Arabic
   */
  @Input() titleAr?: string;

  /**
   * Section subtitle
   */
  @Input() subtitle?: string;

  /**
   * Section subtitle in Arabic
   */
  @Input() subtitleAr?: string;

  /**
   * Category tabs configuration
   * If not provided, will auto-generate from CategoryService
   */
  @Input() tabs: CategoryTab[] = [];

  /**
   * Number of products to display per tab
   */
  @Input() productsPerTab: number = 8;

  /**
   * Grid column count for product display
   */
  @Input() columns: 2 | 3 | 4 | 5 = 4;

  /**
   * Current display language
   */
  @Input() language: 'en' | 'ar' = 'en';

  /**
   * Show add to cart button on products
   */
  @Input() showAddToCart: boolean = true;

  /**
   * Show wishlist button on products
   */
  @Input() showWishlist: boolean = true;

  /**
   * Signal for tabs (can be auto-loaded)
   */
  categoryTabs = signal<CategoryTab[]>([]);

  /**
   * Signal for loading state
   */
  isLoading = signal<boolean>(false);

  /**
   * Currently selected tab index
   */
  selectedTabIndex = signal<number>(0);

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.initializeTabs();
  }

  /**
   * Initializes tabs from input or auto-generates from CategoryService
   */
  private initializeTabs(): void {
    if (this.tabs.length > 0) {
      this.categoryTabs.set(this.tabs);
      return;
    }

    // Auto-generate tabs from CategoryService
    this.isLoading.set(true);
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        const autoTabs: CategoryTab[] = categories.slice(0, 6).map(cat => ({
          id: cat.id,
          label: cat.name,
          labelAr: cat.nameArabic,
          categorySlug: cat.slug
        }));
        this.categoryTabs.set(autoTabs);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Gets tab label based on current language
   */
  getTabLabel(tab: CategoryTab): string {
    return this.language === 'ar' && tab.labelAr ? tab.labelAr : tab.label;
  }

  /**
   * Handles tab change event
   */
  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }
}
