/**
 * @file product-compare-page.component.ts
 * @description Product comparison page component
 * Full-page view for comparing selected products side-by-side
 *
 * @swagger
 * components:
 *   ProductComparePageComponent:
 *     description: Full-page product comparison view
 */
import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductComparisonService } from '../../../../shared/services/product-comparison.service';
import { ProductComparisonTableComponent } from '../../../../shared/components/product-comparison/product-comparison-table.component';
import { LanguageService } from '../../../../shared/services/language.service';

/**
 * @description Product comparison page component
 * Displays selected products in a comparison table
 */
@Component({
  selector: 'app-product-compare-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ProductComparisonTableComponent,
  ],
  templateUrl: './product-compare-page.component.html',
  styleUrls: ['./product-compare-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductComparePageComponent {
  private readonly comparisonService = inject(ProductComparisonService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  /** @description Current UI language */
  readonly language = this.languageService.language;

  /** @description Comparison items from service */
  readonly comparisonItems = this.comparisonService.comparisonItems;

  /** @description Whether comparison has items */
  readonly hasItems = this.comparisonService.hasItems;

  /**
   * @description Navigate back to products
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }

  /**
   * @description Computed page title based on language
   */
  get pageTitle(): string {
    return this.language() === 'ar' ? 'مقارنة المنتجات' : 'Product Comparison';
  }

  /**
   * @description Computed back button label
   */
  get backLabel(): string {
    return this.language() === 'ar' ? 'العودة إلى المنتجات' : 'Back to Products';
  }

  /**
   * @description Computed empty state message
   */
  get emptyMessage(): string {
    return this.language() === 'ar'
      ? 'لم تقم بإضافة أي منتجات للمقارنة بعد'
      : 'No products added to comparison yet';
  }

  /**
   * @description Computed browse products label
   */
  get browseLabel(): string {
    return this.language() === 'ar' ? 'تصفح المنتجات' : 'Browse Products';
  }
}
