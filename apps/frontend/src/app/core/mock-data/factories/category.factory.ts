/**
 * Category Factory
 *
 * Factory for generating ProductCategory objects from category themes
 *
 * @fileoverview Category factory for generating mock category data
 * @description Creates type-safe ProductCategory objects
 */

import { ProductCategory } from '../../../shared/interfaces/product.interface';
import { BaseFactory } from './base.factory';
import { CategoryTheme, getAllCategoryThemes } from '../config/category-themes.config';

/**
 * Category Factory Options
 */
export interface CategoryFactoryOptions {
  /** Category theme */
  theme: CategoryTheme;

  /** Parent category ID (for subcategories) */
  parentId?: string;

  /** Parent category name (for breadcrumb) */
  parentName?: string;
}

/**
 * Category Factory Class
 */
export class CategoryFactory {
  /**
   * Creates a ProductCategory from a theme
   *
   * @param options - Category generation options
   * @returns ProductCategory object
   */
  static create(options: CategoryFactoryOptions): ProductCategory {
    const { theme, parentId, parentName } = options;

    const breadcrumb: string[] = ['Home'];
    if (parentName) {
      breadcrumb.push(parentName);
    }
    breadcrumb.push(theme.nameEn);

    return {
      id: theme.id,
      name: theme.nameEn,
      nameArabic: theme.nameAr,
      slug: theme.slug,
      parent: parentId,
      breadcrumb
    };
  }

  /**
   * Creates all main categories
   *
   * @returns Array of all main ProductCategory objects
   */
  static createAll(): ProductCategory[] {
    const themes = getAllCategoryThemes();
    return themes.map((theme) => this.create({ theme }));
  }

  /**
   * Gets category by slug
   *
   * @param slug - Category slug
   * @returns ProductCategory or undefined
   */
  static getBySlug(slug: string): ProductCategory | undefined {
    const themes = getAllCategoryThemes();
    const theme = themes.find((t) => t.slug === slug);
    return theme ? this.create({ theme }) : undefined;
  }
}

export default CategoryFactory;
