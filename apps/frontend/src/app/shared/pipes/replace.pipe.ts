import { Pipe, PipeTransform } from '@angular/core';

/**
 * Replace Pipe for Syrian Marketplace
 *
 * A utility pipe that replaces occurrences of a search string with a replacement string.
 * Commonly used for formatting text values in templates, such as replacing underscores
 * with spaces in status names and enum values.
 *
 * @swagger
 * components:
 *   schemas:
 *     ReplacePipe:
 *       type: object
 *       description: String replacement pipe for text formatting
 *       properties:
 *         transform:
 *           type: function
 *           description: Transform function that replaces search string with replacement
 *           parameters:
 *             - value: string to transform
 *             - search: string to search for
 *             - replacement: string to replace with
 *           returns:
 *             type: string
 *             description: Transformed string with replacements applied
 *
 * @example
 * ```html
 * <!-- Replace underscores with spaces -->
 * {{ 'order_status' | replace:'_':' ' }}
 * <!-- Output: "order status" -->
 *
 * <!-- Replace multiple characters -->
 * {{ 'some-text-here' | replace:'-':' ' }}
 * <!-- Output: "some text here" -->
 *
 * <!-- Used with other pipes -->
 * {{ order.status | titlecase | replace:'_':' ' }}
 * <!-- Output: "Order Status" -->
 * ```
 */
@Pipe({
  name: 'replace',
  standalone: true
})
export class ReplacePipe implements PipeTransform {

  /**
   * Transform a string by replacing all occurrences of a search string with a replacement string
   *
   * @param value - The string to transform
   * @param search - The string to search for
   * @param replacement - The string to replace with
   * @returns The transformed string with all occurrences replaced
   */
  transform(value: string | null | undefined, search: string, replacement: string): string {
    // Handle null/undefined values
    if (value == null) {
      return '';
    }

    // Convert to string if not already
    const stringValue = String(value);

    // Handle empty search string
    if (!search) {
      return stringValue;
    }

    // Perform global replacement using split and join for better performance
    return stringValue.split(search).join(replacement);
  }
}