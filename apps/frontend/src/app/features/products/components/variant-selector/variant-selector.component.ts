/**
 * @file variant-selector.component.ts
 * @description Enhanced variant selector with color swatches, availability filtering,
 * Arabic labels, and option groups enriched from the variant-options API.
 *
 * @swagger
 * tags:
 *   - name: VariantSelector
 *     description: Product variant selection with color swatches and availability
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
import {
  ProductDetailVariant,
  ProductDetailAttribute,
  VariantOptionGroup,
} from '../../models/product-detail.interface';

/**
 * @description Enhanced variant selector component
 * Renders option groups as chip buttons or color swatches,
 * with disabled state for unavailable combinations
 */
@Component({
  selector: 'app-variant-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './variant-selector.component.html',
  styleUrls: ['./variant-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariantSelectorComponent {
  /** Available product variants */
  variants = input.required<ProductDetailVariant[]>();

  /** Display language for labels */
  language = input<'en' | 'ar'>('en');

  /** Product attributes for colorHex/Arabic fallback */
  attributes = input<ProductDetailAttribute[]>([]);

  /** Option groups from the variant-options API endpoint */
  optionGroups = input<VariantOptionGroup[]>([]);

  /** Emits when a variant is selected */
  variantSelect = output<ProductDetailVariant>();

  /** Currently selected options (e.g., { Color: 'Red', Size: 'M' }) */
  selectedOptions = signal<Record<string, string>>({});

  /**
   * @description Enriched option groups: uses API optionGroups if available,
   * otherwise falls back to deriving from variantData keys + attributes
   */
  enrichedOptionGroups = computed((): VariantOptionGroup[] => {
    const apiGroups = this.optionGroups();
    if (apiGroups && apiGroups.length > 0) {
      return apiGroups;
    }

    // Fallback: derive option groups from variant data
    return this.deriveOptionGroups();
  });

  /**
   * @description For each option key, returns the set of values that have at least
   * one matching active variant given the current selections in other keys.
   * Used to disable unavailable combinations.
   */
  availableValues = computed((): Record<string, Set<string>> => {
    const variants = this.variants();
    const selected = this.selectedOptions();
    const result: Record<string, Set<string>> = {};

    for (const group of this.enrichedOptionGroups()) {
      const key = group.optionName;
      const available = new Set<string>();

      for (const variant of variants) {
        if (!variant.isActive) continue;

        // Check if this variant matches all other selected options (except the current key)
        const matchesOther = Object.entries(selected).every(([k, v]) => {
          if (k === key) return true;
          return variant.variantData[k] === v;
        });

        if (matchesOther && variant.variantData[key]) {
          available.add(variant.variantData[key]);
        }
      }

      result[key] = available;
    }

    return result;
  });

  /**
   * @description Checks if an option value is available given current selections
   * @param key - Attribute key (e.g., 'Color')
   * @param value - Option value (e.g., 'Red')
   * @returns True if there is at least one active variant matching this combination
   */
  isAvailable(key: string, value: string): boolean {
    const available = this.availableValues()[key];
    return available ? available.has(value) : false;
  }

  /**
   * @description Handles option selection for an attribute
   * Finds matching variant and emits selection
   * @param key - Attribute key (e.g., 'Color')
   * @param value - Selected value (e.g., 'Red')
   */
  selectOption(key: string, value: string): void {
    if (!this.isAvailable(key, value)) return;

    this.selectedOptions.update(options => ({
      ...options,
      [key]: value,
    }));

    const matchingVariant = this.findMatchingVariant();
    if (matchingVariant) {
      this.variantSelect.emit(matchingVariant);
    }
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
   * @description Derives option groups from variant data when the API
   * optionGroups input is not provided. Uses attributes for colorHex/Arabic enrichment.
   * @returns Array of VariantOptionGroup derived from variant data
   */
  private deriveOptionGroups(): VariantOptionGroup[] {
    const variants = this.variants();
    const attrs = this.attributes();
    const keyValuesMap = new Map<string, Set<string>>();

    variants.forEach(variant => {
      Object.entries(variant.variantData).forEach(([key, value]) => {
        if (!keyValuesMap.has(key)) {
          keyValuesMap.set(key, new Set());
        }
        keyValuesMap.get(key)!.add(value);
      });
    });

    return Array.from(keyValuesMap.entries()).map(([key, values]) => {
      // Look up attribute metadata for this key
      const matchingAttrs = attrs.filter(a => a.attributeNameEn === key);

      return {
        optionName: key,
        optionNameAr: matchingAttrs.length > 0 ? matchingAttrs[0].attributeNameAr : null,
        type: matchingAttrs.some(a => a.colorHex) ? 'color' : 'select',
        values: Array.from(values).map(val => {
          const attrMatch = matchingAttrs.find(a => a.valueEn === val);
          return {
            value: val,
            valueAr: attrMatch?.valueAr || null,
            colorHex: attrMatch?.colorHex || null,
            displayOrder: 0,
          };
        }),
      };
    });
  }
}
