import { Pipe, PipeTransform } from '@angular/core';
import { SyrianFormattersService } from '../services/syrian-formatters.service';

/**
 * Syrian Date Pipe
 *
 * Formats dates according to Syrian cultural preferences
 * Supports Arabic/English locales, Arabic numerals, and relative time
 *
 * Usage examples:
 * {{ date | syrianDate }}                                 // "15 مارس 2024" or "March 15, 2024"
 * {{ date | syrianDate:'full' }}                          // "الجمعة، 15 مارس 2024"
 * {{ date | syrianDate:'time' }}                          // "14:30" or "٢٠:٣٠"
 * {{ date | syrianDate:'relative' }}                      // "منذ ساعتين" or "2 hours ago"
 * {{ date | syrianDate:'datetime' }}                      // "15 مارس 2024، 14:30"
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianDatePipe:
 *       type: object
 *       description: Angular pipe for Syrian date and time formatting
 *       properties:
 *         format:
 *           type: string
 *           enum: [short, medium, long, full, time, datetime, relative]
 *           description: Date format type
 *         useArabicNumerals:
 *           type: boolean
 *           description: Whether to use Arabic numerals
 *         timezone:
 *           type: string
 *           description: Timezone for formatting
 */
@Pipe({
  name: 'syrianDate',
  standalone: true
})
export class SyrianDatePipe implements PipeTransform {

  constructor(private formattersService: SyrianFormattersService) {}

  /**
   * Transform date to formatted Syrian date string
   * Applies Syrian cultural date formatting preferences
   *
   * @param value - Date to format (Date object, string, or timestamp)
   * @param format - Format type (short, medium, long, full, time, datetime, relative)
   * @param useArabicNumerals - Whether to use Arabic numerals (optional)
   * @param timezone - Timezone for formatting (optional)
   * @returns Formatted date string
   */
  transform(
    value: Date | string | number,
    format: 'short' | 'medium' | 'long' | 'full' | 'time' | 'datetime' | 'relative' = 'medium',
    useArabicNumerals?: boolean,
    timezone?: string
  ): string {

    if (value == null) {
      return '';
    }

    let date: Date;

    // Convert input to Date object
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else {
      return '';
    }

    // Validate date
    if (isNaN(date.getTime())) {
      return '';
    }

    // Handle different format types
    switch (format) {
      case 'relative':
        return this.formattersService.getRelativeTime(date);

      case 'time':
        return this.formattersService.formatSyrianTime(date, true);

      case 'datetime':
        return this.formatDateTime(date, useArabicNumerals);

      case 'short':
        return this.formatShortDate(date, useArabicNumerals);

      case 'medium':
        return this.formattersService.formatArabicDate(date, false);

      case 'long':
        return this.formatLongDate(date, useArabicNumerals);

      case 'full':
        return this.formatFullDate(date, useArabicNumerals);

      default:
        return this.formattersService.formatArabicDate(date, false);
    }
  }

  /**
   * Format date and time together
   * Combines date and time formatting
   */
  private formatDateTime(date: Date, useArabicNumerals?: boolean): string {
    const dateFormatted = this.formattersService.formatArabicDate(date, false);
    const timeFormatted = this.formattersService.formatSyrianTime(date, true);

    // Get current language to determine separator
    this.formattersService.getCurrentLanguage().subscribe(lang => {
      if (lang === 'ar') {
        return `${dateFormatted}، ${timeFormatted}`;
      } else {
        return `${dateFormatted}, ${timeFormatted}`;
      }
    });

    return `${dateFormatted}, ${timeFormatted}`;
  }

  /**
   * Format short date (dd/MM/yyyy or MM/dd/yyyy)
   * Uses compact date format
   */
  private formatShortDate(date: Date, useArabicNumerals?: boolean): string {
    let formatted: string;

    this.formattersService.getCurrentLanguage().subscribe(lang => {
      if (lang === 'ar') {
        // Arabic format: dd/MM/yyyy
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        formatted = `${day}/${month}/${year}`;
      } else {
        // English format: MM/dd/yyyy
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        formatted = `${month}/${day}/${year}`;
      }
    });

    formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    if (useArabicNumerals) {
      return this.formattersService.toArabicNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Format long date with day name
   * Includes day of week in formatting
   */
  private formatLongDate(date: Date, useArabicNumerals?: boolean): string {
    let formatted: string;

    this.formattersService.getCurrentLanguage().subscribe(lang => {
      const locale = lang === 'ar' ? 'ar-SY' : 'en-US';

      formatted = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    });

    formatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);

    if (useArabicNumerals) {
      return this.formattersService.toArabicNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Format full date with complete information
   * Most comprehensive date format
   */
  private formatFullDate(date: Date, useArabicNumerals?: boolean): string {
    let formatted: string;

    this.formattersService.getCurrentLanguage().subscribe(lang => {
      const locale = lang === 'ar' ? 'ar-SY' : 'en-US';

      formatted = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Damascus'
      }).format(date);
    });

    formatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);

    if (useArabicNumerals) {
      return this.formattersService.toArabicNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Format Islamic/Hijri date
   * Converts Gregorian date to Islamic calendar
   */
  formatIslamicDate(date: Date): string {
    // Note: This is a simplified implementation
    // For production, consider using a proper Hijri calendar library

    this.formattersService.getCurrentLanguage().subscribe(lang => {
      if (lang === 'ar') {
        try {
          const islamicFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          return islamicFormatter.format(date);
        } catch (error) {
          // Fallback to Gregorian if Islamic calendar not supported
          return this.formattersService.formatArabicDate(date, false);
        }
      }
    });

    return this.formattersService.formatArabicDate(date, false);
  }

  /**
   * Get day name in Arabic or English
   * Returns localized day name
   */
  getDayName(date: Date): string {
    let dayName: string;

    this.formattersService.getCurrentLanguage().subscribe(lang => {
      const locale = lang === 'ar' ? 'ar-SY' : 'en-US';

      dayName = new Intl.DateTimeFormat(locale, {
        weekday: 'long'
      }).format(date);
    });

    dayName = new Intl.DateTimeFormat('en-US', {
      weekday: 'long'
    }).format(date);

    return dayName;
  }

  /**
   * Get month name in Arabic or English
   * Returns localized month name
   */
  getMonthName(date: Date): string {
    let monthName: string;

    this.formattersService.getCurrentLanguage().subscribe(lang => {
      const locale = lang === 'ar' ? 'ar-SY' : 'en-US';

      monthName = new Intl.DateTimeFormat(locale, {
        month: 'long'
      }).format(date);
    });

    monthName = new Intl.DateTimeFormat('en-US', {
      month: 'long'
    }).format(date);

    return monthName;
  }
}