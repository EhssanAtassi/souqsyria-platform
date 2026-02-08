/**
 * @file variant-selector.component.ts
 * @description Component for selecting product variants based on attributes
 * Extracts unique attribute keys and allows user to select options
 *
 * @swagger
 * tags:
 *   - name: VariantSelector
 *     description: Product variant selection with attribute chips
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ProductDetailVariant } from '../../models/product-detail.interface';

/**
 * @description Variant selector component
 * Displays variant options as chips and emits selected variant
 */
@Component({
  selector: 'app-variant-selector',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './variant-selector.component.html',
  styleUrls: ['./variant-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariantSelectorComponent {
  /** Available product variants */
  variants = input.required<ProductDetailVariant[]>();

  /** Display language for labels */
  language = input<'en' | 'ar'>('en');

  /** Emits when a variant is selected */
  variantSelect = output<ProductDetailVariant>();

  /** Currently selected options (e.g., { Color: 'Red', Size: 'M' }) */
  selectedOptions = signal<Record<string, string>>({});

  /**
   * @description Extracts unique attribute keys from all variants
   * Returns array of unique keys like ['Color', 'Size']
   */
  attributeKeys = computed(() => {
    const variants = this.variants();
    const allKeys = new Set<string>();

    variants.forEach(variant => {
      Object.keys(variant.variantData).forEach(key => allKeys.add(key));
    });

    return Array.from(allKeys);
  });

  /**
   * @description Gets unique values for a given attribute key
   * @param key - Attribute key (e.g., 'Color')
   * @returns Array of unique values for that key
   */
  getOptionsForKey = computed(() => (key: string): string[] => {
    const variants = this.variants();
    const values = new Set<string>();

    variants.forEach(variant => {
      const value = variant.variantData[key];
      if (value) {
        values.add(value);
      }
    });

    return Array.from(values);
  });

  /**
   * @description Handles option selection for an attribute
   * Finds matching variant and emits selection
   * @param key - Attribute key (e.g., 'Color')
   * @param value - Selected value (e.g., 'Red')
   */
  selectOption(key: string, value: string): void {
    // Update selected options
    this.selectedOptions.update(options => ({
      ...options,
      [key]: value,
    }));

    // Find matching variant
    const matchingVariant = this.findMatchingVariant();
    if (matchingVariant) {
      this.variantSelect.emit(matchingVariant);
    }
  }

  /**
   * @description Finds variant that matches all selected options
   * @returns Matching variant or null
   */
  private findMatchingVariant(): ProductDetailVariant | null {
    const selected = this.selectedOptions();
    const variants = this.variants();

    return variants.find(variant => {
      return Object.entries(selected).every(([key, value]) => {
        return variant.variantData[key] === value;
      });
    }) || null;
  }

  /**
   * @description Checks if an option is currently selected
   * @param key - Attribute key
   * @param value - Option value
   * @returns True if this option is selected
   */
  isSelected(key: string, value: string): boolean {
    return this.selectedOptions()[key] === value;
  }
}
