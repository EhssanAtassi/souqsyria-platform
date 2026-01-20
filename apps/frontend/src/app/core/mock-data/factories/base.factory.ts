/**
 * Base Factory
 *
 * Provides utility methods for all mock data factories including:
 * - Slug generation
 * - ID generation
 * - Theme application
 * - Badge generation
 * - Date utilities
 *
 * @fileoverview Base factory class with shared utility methods
 * @description Common utilities for generating consistent mock data
 *
 * @swagger
 * components:
 *   schemas:
 *     BaseFactory:
 *       type: object
 *       description: Base factory providing utility methods for mock data generation
 */

import { CategoryTheme, categoryThemes } from '../config/category-themes.config';
import { syrianColors, badgeColors } from '../config/syrian-colors.config';

/**
 * Base factory class providing utility methods
 */
export class BaseFactory {
  /**
   * Generates a URL-friendly slug from a string
   *
   * @param text - Text to convert to slug
   * @returns URL-friendly slug
   *
   * @example
   * slugify('Damascus Steel Chef Knife') // 'damascus-steel-chef-knife'
   * slugify('Traditional Syrian Oud') // 'traditional-syrian-oud'
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/[^\w\-]+/g, '') // Remove non-word chars except hyphens
      .replace(/\-\-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '') // Trim hyphens from start
      .replace(/-+$/, ''); // Trim hyphens from end
  }

  /**
   * Generates a unique identifier
   *
   * @param prefix - Optional prefix for the ID
   * @returns Unique identifier string
   *
   * @example
   * generateId() // '1a2b3c4d5e6f'
   * generateId('prod') // 'prod-1a2b3c4d5e6f'
   */
  static generateId(prefix?: string): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 11);
    const id = `${timestamp}${randomStr}`;
    return prefix ? `${prefix}-${id}` : id;
  }

  /**
   * Generates a UUID v4
   *
   * @returns UUID v4 string
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Gets category theme by slug
   *
   * @param categorySlug - Category slug
   * @returns Category theme or undefined
   *
   * @example
   * getCategoryTheme('damascus-steel') // DamascusSteelTheme object
   */
  static getCategoryTheme(categorySlug: string): CategoryTheme | undefined {
    return categoryThemes[categorySlug];
  }

  /**
   * Generates badges based on product attributes
   *
   * @param options - Badge generation options
   * @returns Array of badge identifiers
   *
   * @example
   * generateBadges({ heritage: true, sale: true }) // ['heritage', 'sale']
   */
  static generateBadges(options: {
    heritage?: boolean;
    sale?: boolean;
    new?: boolean;
    artisan?: boolean;
    unesco?: boolean;
    verified?: boolean;
    bestseller?: boolean;
    limited?: boolean;
    organic?: boolean;
    handmade?: boolean;
  }): string[] {
    const badges: string[] = [];

    if (options.heritage) badges.push('heritage');
    if (options.sale) badges.push('sale');
    if (options.new) badges.push('new');
    if (options.artisan) badges.push('artisan');
    if (options.unesco) badges.push('unesco');
    if (options.verified) badges.push('verified');
    if (options.bestseller) badges.push('bestseller');
    if (options.limited) badges.push('limited');
    if (options.organic) badges.push('organic');
    if (options.handmade) badges.push('handmade');

    return badges;
  }

  /**
   * Gets badge styling colors
   *
   * @param badgeType - Type of badge
   * @returns Badge color configuration
   */
  static getBadgeColors(badgeType: string): {
    background: string;
    text: string;
    border: string;
  } {
    return (
      badgeColors[badgeType as keyof typeof badgeColors] || {
        background: syrianColors.palettes.neutral[200],
        text: syrianColors.palettes.neutral[700],
        border: syrianColors.palettes.neutral[300]
      }
    );
  }

  /**
   * Generates random integer between min and max (inclusive)
   *
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer
   *
   * @example
   * randomInt(1, 10) // Random number between 1 and 10
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generates random float between min and max
   *
   * @param min - Minimum value
   * @param max - Maximum value
   * @param decimals - Number of decimal places (default: 2)
   * @returns Random float
   *
   * @example
   * randomFloat(1.5, 5.0, 2) // Random number like 3.47
   */
  static randomFloat(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  /**
   * Selects random item from array
   *
   * @param array - Array to select from
   * @returns Random item from array
   *
   * @example
   * randomItem(['red', 'blue', 'green']) // 'blue'
   */
  static randomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Selects multiple random items from array
   *
   * @param array - Array to select from
   * @param count - Number of items to select
   * @returns Array of random items
   *
   * @example
   * randomItems(['a', 'b', 'c', 'd'], 2) // ['b', 'd']
   */
  static randomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Generates random boolean with optional probability
   *
   * @param probability - Probability of true (0-1, default: 0.5)
   * @returns Random boolean
   *
   * @example
   * randomBoolean() // true or false (50/50)
   * randomBoolean(0.7) // true 70% of the time
   */
  static randomBoolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  /**
   * Generates date in the past
   *
   * @param daysAgo - Maximum days in the past
   * @returns Random past date
   *
   * @example
   * pastDate(30) // Date within last 30 days
   */
  static pastDate(daysAgo: number): Date {
    const now = new Date();
    const past = new Date(now.getTime() - this.randomInt(0, daysAgo) * 24 * 60 * 60 * 1000);
    return past;
  }

  /**
   * Generates date in the future
   *
   * @param daysAhead - Maximum days in the future
   * @returns Random future date
   *
   * @example
   * futureDate(30) // Date within next 30 days
   */
  static futureDate(daysAhead: number): Date {
    const now = new Date();
    const future = new Date(now.getTime() + this.randomInt(0, daysAhead) * 24 * 60 * 60 * 1000);
    return future;
  }

  /**
   * Formats number as currency
   *
   * @param amount - Amount to format
   * @param currency - Currency code (default: 'USD')
   * @param locale - Locale for formatting (default: 'en-US')
   * @returns Formatted currency string
   *
   * @example
   * formatCurrency(99.99) // '$99.99'
   * formatCurrency(1234.56, 'EUR', 'de-DE') // '1.234,56 €'
   */
  static formatCurrency(
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Calculates discount percentage
   *
   * @param original - Original price
   * @param current - Current price
   * @returns Discount percentage rounded to integer
   *
   * @example
   * calculateDiscount(100, 75) // 25
   */
  static calculateDiscount(original: number, current: number): number {
    if (original <= 0) return 0;
    return Math.round(((original - current) / original) * 100);
  }

  /**
   * Generates rating distribution
   *
   * @param totalReviews - Total number of reviews
   * @param averageRating - Average rating (1-5)
   * @returns Rating distribution object
   *
   * @example
   * generateRatingDistribution(100, 4.5)
   * // { 1: 2, 2: 3, 3: 8, 4: 30, 5: 57 }
   */
  static generateRatingDistribution(
    totalReviews: number,
    averageRating: number
  ): { 1: number; 2: number; 3: number; 4: number; 5: number } {
    // Simple algorithm to distribute reviews based on average rating
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Calculate weights based on average rating
    const weights = [
      Math.max(0, 5 - averageRating), // 1-star weight
      Math.max(0, 4.5 - averageRating), // 2-star weight
      Math.max(0, 4 - averageRating), // 3-star weight
      Math.max(0, averageRating - 2.5), // 4-star weight
      Math.max(0, averageRating - 1) // 5-star weight
    ];

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Distribute reviews based on weights
    let remaining = totalReviews;
    for (let i = 0; i < 5; i++) {
      const star = (5 - i) as 1 | 2 | 3 | 4 | 5;
      if (i === 4) {
        // Last iteration, assign remaining
        distribution[star] = remaining;
      } else {
        const count = Math.round((weights[4 - i] / totalWeight) * totalReviews);
        distribution[star] = count;
        remaining -= count;
      }
    }

    return distribution;
  }

  /**
   * Truncates text to specified length with ellipsis
   *
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @param suffix - Suffix to add (default: '...')
   * @returns Truncated text
   *
   * @example
   * truncate('This is a long text', 10) // 'This is a...'
   */
  static truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Capitalizes first letter of each word
   *
   * @param text - Text to capitalize
   * @returns Capitalized text
   *
   * @example
   * capitalize('damascus steel knife') // 'Damascus Steel Knife'
   */
  static capitalize(text: string): string {
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generates Syrian phone number
   *
   * @returns Random Syrian phone number
   *
   * @example
   * generateSyrianPhone() // '+963-11-234-5678'
   */
  static generateSyrianPhone(): string {
    const areaCode = this.randomItem(['11', '21', '23', '31', '33', '41', '43', '51', '52']);
    const number = `${this.randomInt(100, 999)}-${this.randomInt(1000, 9999)}`;
    return `+963-${areaCode}-${number}`;
  }

  /**
   * Generates image placeholder URL
   *
   * @param width - Image width
   * @param height - Image height
   * @param seed - Optional seed for consistent random images
   * @returns Placeholder image URL
   *
   * @example
   * generateImageUrl(400, 400, 'damascus-knife')
   * // 'https://picsum.photos/seed/damascus-knife/400/400'
   */
  static generateImageUrl(width: number, height: number, seed?: string): string {
    const baseSeed = seed || this.generateId();
    return `https://picsum.photos/seed/${baseSeed}/${width}/${height}`;
  }

  /**
   * Validates email format
   *
   * @param email - Email to validate
   * @returns True if valid email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generates mock image path for Syrian products
   *
   * @param category - Product category
   * @param productName - Product name
   * @param index - Image index (for multiple images)
   * @returns Mock image path
   *
   * @example
   * generateProductImagePath('damascus-steel', 'chef-knife', 0)
   * // '/assets/images/products/damascus-steel/chef-knife-0.jpg'
   */
  static generateProductImagePath(
    category: string,
    productName: string,
    index: number = 0
  ): string {
    const slug = this.slugify(productName);
    return `/assets/images/products/${category}/${slug}-${index}.jpg`;
  }

  /**
   * Shuffles array using Fisher-Yates algorithm
   *
   * @param array - Array to shuffle
   * @returns Shuffled array (new array, original unchanged)
   */
  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Generates weighted random selection
   *
   * @param items - Array of items with weights
   * @returns Randomly selected item based on weights
   *
   * @example
   * weightedRandom([
   *   { value: 'common', weight: 70 },
   *   { value: 'rare', weight: 25 },
   *   { value: 'epic', weight: 5 }
   * ]) // 'common' (70% probability)
   */
  static weightedRandom<T>(items: Array<{ value: T; weight: number }>): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      if (random < item.weight) {
        return item.value;
      }
      random -= item.weight;
    }

    return items[items.length - 1].value;
  }
}

/**
 * Export default base factory
 */
export default BaseFactory;
