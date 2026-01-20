import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * 404 Not Found Component for SouqSyria Marketplace
 *
 * @description
 * Enhanced 404 error page with Syrian cultural elements and Golden Wheat theme.
 * Features Damascus patterns, bilingual content, and helpful navigation options
 * to guide lost users back to discovering authentic Syrian products.
 *
 * Features:
 * - Syrian cultural visual elements (Damascus patterns, traditional motifs)
 * - Golden Wheat color scheme with gradient backgrounds
 * - Bilingual error messaging (English/Arabic with RTL support)
 * - Quick navigation to popular Syrian product categories
 * - Search functionality integration
 * - Animated Damascus pattern background
 * - Mobile-responsive layout
 * - Accessibility-compliant (WCAG 2.1 AA)
 *
 * Cultural Elements:
 * - Damascus rose pattern decoration
 * - Arabic calligraphy-inspired typography
 * - Traditional Syrian color palette
 * - Merchant marketplace metaphor in messaging
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: '404',
 *   component: NotFoundComponent
 * },
 * {
 *   path: '**',
 *   redirectTo: '/404'
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     NotFoundComponent:
 *       type: object
 *       description: 404 error page with Syrian cultural elements
 *       properties:
 *         errorCode:
 *           type: string
 *           example: "404"
 *         titleEn:
 *           type: string
 *           example: "Lost in the Marketplace"
 *         titleAr:
 *           type: string
 *           example: "ضللت الطريق في السوق"
 *         messageEn:
 *           type: string
 *           example: "The treasure you seek is not in this section of our Syrian bazaar"
 *         messageAr:
 *           type: string
 *           example: "الكنز الذي تبحث عنه ليس في هذا القسم من سوقنا السوري"
 *         suggestedCategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nameEn:
 *                 type: string
 *               nameAr:
 *                 type: string
 *               slug:
 *                 type: string
 *               icon:
 *                 type: string
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {
  /**
   * Popular Syrian marketplace categories for quick navigation
   */
  readonly popularCategories = [
    {
      nameEn: 'Damascus Steel',
      nameAr: 'الفولاذ الدمشقي',
      slug: '/category/damascus-steel',
      icon: 'hardware'
    },
    {
      nameEn: 'Aleppo Soap',
      nameAr: 'صابون حلب',
      slug: '/category/beauty-wellness',
      icon: 'spa'
    },
    {
      nameEn: 'Syrian Textiles',
      nameAr: 'المنسوجات السورية',
      slug: '/category/textiles-fabrics',
      icon: 'checkroom'
    },
    {
      nameEn: 'Spices & Herbs',
      nameAr: 'التوابل والأعشاب',
      slug: '/category/food-spices',
      icon: 'restaurant'
    },
    {
      nameEn: 'Traditional Crafts',
      nameAr: 'الحرف التقليدية',
      slug: '/category/traditional-crafts',
      icon: 'handyman'
    },
    {
      nameEn: 'Nuts & Sweets',
      nameAr: 'المكسرات والحلويات',
      slug: '/category/sweets-desserts',
      icon: 'cake'
    }
  ];
}