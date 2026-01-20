import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Breadcrumb Navigation Item Interface
 *
 * @swagger
 * components:
 *   schemas:
 *     BreadcrumbItem:
 *       type: object
 *       description: Single breadcrumb navigation item with bilingual support
 *       properties:
 *         label:
 *           type: string
 *           description: English label text
 *         labelArabic:
 *           type: string
 *           description: Arabic label text (optional)
 *         url:
 *           type: string
 *           description: Route path (optional, omit for last item)
 *         icon:
 *           type: string
 *           description: Optional icon identifier
 */
export interface BreadcrumbItem {
  /** English label */
  label: string;
  /** Arabic label (optional) */
  labelArabic?: string;
  /** Route path (optional, omit for current page) */
  url?: string;
  /** Optional icon identifier */
  icon?: string;
}

/**
 * Breadcrumb Navigation Component
 *
 * Displays hierarchical navigation path with home icon and separators.
 * Supports bilingual labels (English/Arabic) and RTL layout.
 *
 * @swagger
 * components:
 *   schemas:
 *     BreadcrumbComponent:
 *       type: object
 *       description: Hierarchical navigation breadcrumb trail
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BreadcrumbItem'
 *           description: Array of breadcrumb items
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Current display language
 *
 * @example
 * ```typescript
 * breadcrumbs: BreadcrumbItem[] = [
 *   { label: 'Products', labelArabic: 'المنتجات', url: '/products' },
 *   { label: 'Damascus Steel', labelArabic: 'الفولاذ الدمشقي', url: '/category/damascus-steel' },
 *   { label: 'Chef Knife', labelArabic: 'سكين الطاهي' }
 * ];
 * ```
 *
 * ```html
 * <app-breadcrumb [items]="breadcrumbs" language="ar"></app-breadcrumb>
 * ```
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  /**
   * Array of breadcrumb items representing navigation hierarchy
   */
  @Input() items: BreadcrumbItem[] = [];

  /**
   * Current language for label display
   * - 'en': Display English labels
   * - 'ar': Display Arabic labels (if available)
   */
  @Input() language: 'en' | 'ar' = 'en';
}
