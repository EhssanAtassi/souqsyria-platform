/**
 * @file specifications-table.component.ts
 * @description Component for displaying product attributes in a zebra-striped table
 *
 * @swagger
 * tags:
 *   - name: SpecificationsTable
 *     description: Product attribute table with localized labels
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductDetailAttribute } from '../../models/product-detail.interface';

/**
 * @description Specifications table component
 * Displays product attributes in a localized table format
 */
@Component({
  selector: 'app-specifications-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './specifications-table.component.html',
  styleUrls: ['./specifications-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecificationsTableComponent {
  /** Product attributes to display */
  attributes = input.required<ProductDetailAttribute[]>();

  /** Display language for labels */
  language = input<'en' | 'ar'>('en');

  /**
   * @description Localized attribute rows for table
   * Maps attributes to { name, value } based on current language
   */
  localizedRows = computed(() => {
    const attrs = this.attributes();
    const lang = this.language();

    return attrs.map(attr => ({
      name: lang === 'ar' ? attr.attributeNameAr : attr.attributeNameEn,
      value: lang === 'ar' ? attr.valueAr : attr.valueEn,
      colorHex: attr.colorHex,
    }));
  });

  /**
   * @description Empty state message
   */
  emptyMessage = computed(() => {
    return this.language() === 'ar'
      ? 'لا توجد مواصفات متاحة'
      : 'No specifications available';
  });
}
