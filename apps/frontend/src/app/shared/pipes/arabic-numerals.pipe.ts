import { Pipe, PipeTransform } from '@angular/core';
import { SyrianFormattersService } from '../services/syrian-formatters.service';

/**
 * Arabic Numerals Pipe
 *
 * Converts Western numerals (0-9) to Arabic-Indic numerals (٠-٩)
 * Supports conditional conversion based on user preferences
 *
 * Usage examples:
 * {{ '12345' | arabicNumerals }}                          // "١٢٣٤٥"
 * {{ 12345 | arabicNumerals }}                            // "١٢٣٤٥"
 * {{ '2024-03-15' | arabicNumerals }}                     // "٢٠٢٤-٠٣-١٥"
 * {{ phoneNumber | arabicNumerals:false }}                // "12345" (bypass conversion)
 *
 * @swagger
 * components:
 *   schemas:
 *     ArabicNumeralsPipe:
 *       type: object
 *       description: Angular pipe for converting to Arabic-Indic numerals
 *       properties:
 *         forceConversion:
 *           type: boolean
 *           description: Force conversion regardless of user preference
 *         preserveFormatting:
 *           type: boolean
 *           description: Preserve original text formatting
 */
@Pipe({
  name: 'arabicNumerals',
  standalone: true
})
export class ArabicNumeralsPipe implements PipeTransform {

  constructor(private formattersService: SyrianFormattersService) {}

  /**
   * Transform Western numerals to Arabic-Indic numerals
   * Converts digits while preserving text formatting
   *
   * @param value - String or number containing Western numerals
   * @param forceConversion - Force conversion regardless of user preference
   * @param preserveFormatting - Preserve special formatting characters
   * @returns String with Arabic-Indic numerals
   */
  transform(
    value: string | number,
    forceConversion?: boolean,
    preserveFormatting: boolean = true
  ): string {

    if (value == null) {
      return '';
    }

    const inputStr = value.toString();

    // Check if conversion should be applied
    if (forceConversion === false) {
      return inputStr;
    }

    // Use service method for conversion
    return this.formattersService.toArabicNumerals(inputStr);
  }
}