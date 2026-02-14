/**
 * @file category.entity.spec.ts
 * @description Unit tests for the Category entity computed methods and business logic
 *
 * Tests cover all computed methods on the Category entity:
 * - getDisplayName: Localized name retrieval (English/Arabic)
 * - getDisplayDescription: Localized description retrieval
 * - getSlug: Language-aware slug selection
 * - isPublic: Visibility check (active + approved)
 * - canBeEdited: Edit permission based on approval status
 * - isRootCategory: Root-level detection
 * - hasChildren: Child existence check
 * - getBreadcrumbPath: Breadcrumb path generation
 * - getPopularityRank: Popularity score calculation
 * - needsAdminAttention: Admin action flag
 * - generateUrl: Frontend URL generation
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { Category } from './category.entity';

/**
 * Factory function to create a Category entity instance with sensible defaults.
 * Allows partial overrides for flexible test data creation.
 *
 * @param overrides - Partial Category fields to override defaults
 * @returns A Category entity instance populated with test data
 */
function createCategory(overrides: Partial<Category> = {}): Category {
  const category = new Category();

  // Sensible defaults for a typical approved root category
  category.id = 1;
  category.nameEn = 'Electronics';
  category.nameAr = 'إلكترونيات';
  category.slug = 'electronics';
  category.descriptionEn = 'Electronic devices and gadgets';
  category.descriptionAr = 'أجهزة إلكترونية';
  category.seoSlug = 'الكترونيات';
  category.isActive = true;
  category.approvalStatus = 'approved';
  category.depthLevel = 0;
  category.parent = null;
  category.children = [];
  category.categoryPath = 'Electronics';
  category.productCount = 150;
  category.viewCount = 1250;
  category.popularityScore = 85.5;
  category.sortOrder = 100;
  category.isFeatured = false;
  category.showInNav = true;
  category.createdAt = new Date('2025-01-01T00:00:00Z');

  // Apply overrides
  Object.assign(category, overrides);

  return category;
}

describe('Category Entity', () => {
  // ==========================================================================
  // getDisplayName
  // ==========================================================================

  /**
   * @description Tests for getDisplayName method - returns localized category name
   * based on the requested language with English as fallback.
   */
  describe('getDisplayName', () => {
    /** @test Should return English name when language is "en" */
    it('should return English name when language is "en"', () => {
      // Arrange
      const category = createCategory();

      // Act
      const displayName = category.getDisplayName('en');

      // Assert
      expect(displayName).toBe('Electronics');
    });

    /** @test Should return Arabic name when language is "ar" and nameAr exists */
    it('should return Arabic name when language is "ar" and nameAr exists', () => {
      // Arrange
      const category = createCategory();

      // Act
      const displayName = category.getDisplayName('ar');

      // Assert
      expect(displayName).toBe('إلكترونيات');
    });

    /** @test Should fall back to English name when language is "ar" but nameAr is empty */
    it('should fall back to English name when nameAr is empty', () => {
      // Arrange
      const category = createCategory({ nameAr: '' });

      // Act
      const displayName = category.getDisplayName('ar');

      // Assert
      expect(displayName).toBe('Electronics');
    });

    /** @test Should fall back to English name when nameAr is null */
    it('should fall back to English name when nameAr is null', () => {
      // Arrange
      const category = createCategory({ nameAr: null });

      // Act
      const displayName = category.getDisplayName('ar');

      // Assert
      expect(displayName).toBe('Electronics');
    });

    /** @test Should default to English when no language argument is provided */
    it('should default to English when no language argument is provided', () => {
      // Arrange
      const category = createCategory();

      // Act
      const displayName = category.getDisplayName();

      // Assert
      expect(displayName).toBe('Electronics');
    });
  });

  // ==========================================================================
  // getDisplayDescription
  // ==========================================================================

  /**
   * @description Tests for getDisplayDescription method - returns localized description
   * with fallback to English, then to empty string.
   */
  describe('getDisplayDescription', () => {
    /** @test Should return English description when language is "en" */
    it('should return English description when language is "en"', () => {
      // Arrange
      const category = createCategory();

      // Act
      const description = category.getDisplayDescription('en');

      // Assert
      expect(description).toBe('Electronic devices and gadgets');
    });

    /** @test Should return Arabic description when language is "ar" */
    it('should return Arabic description when language is "ar"', () => {
      // Arrange
      const category = createCategory();

      // Act
      const description = category.getDisplayDescription('ar');

      // Assert
      expect(description).toBe('أجهزة إلكترونية');
    });

    /** @test Should fall back to English description when descriptionAr is empty */
    it('should fall back to English description when descriptionAr is empty', () => {
      // Arrange
      const category = createCategory({ descriptionAr: '' });

      // Act
      const description = category.getDisplayDescription('ar');

      // Assert
      expect(description).toBe('Electronic devices and gadgets');
    });

    /** @test Should fall back to English description when descriptionAr is null */
    it('should fall back to English description when descriptionAr is null', () => {
      // Arrange
      const category = createCategory({ descriptionAr: null });

      // Act
      const description = category.getDisplayDescription('ar');

      // Assert
      expect(description).toBe('Electronic devices and gadgets');
    });

    /** @test Should return empty string when both descriptions are missing */
    it('should return empty string when both descriptions are missing', () => {
      // Arrange
      const category = createCategory({
        descriptionEn: null,
        descriptionAr: null,
      });

      // Act
      const description = category.getDisplayDescription('en');

      // Assert
      expect(description).toBe('');
    });

    /** @test Should default to English when no language argument is provided */
    it('should default to English when no language argument is provided', () => {
      // Arrange
      const category = createCategory();

      // Act
      const description = category.getDisplayDescription();

      // Assert
      expect(description).toBe('Electronic devices and gadgets');
    });
  });

  // ==========================================================================
  // getSlug
  // ==========================================================================

  /**
   * @description Tests for getSlug method - returns the appropriate URL slug
   * based on the requested language.
   */
  describe('getSlug', () => {
    /** @test Should return English slug when language is "en" */
    it('should return English slug when language is "en"', () => {
      // Arrange
      const category = createCategory();

      // Act
      const slug = category.getSlug('en');

      // Assert
      expect(slug).toBe('electronics');
    });

    /** @test Should return Arabic SEO slug when language is "ar" */
    it('should return Arabic SEO slug when language is "ar"', () => {
      // Arrange
      const category = createCategory();

      // Act
      const slug = category.getSlug('ar');

      // Assert
      expect(slug).toBe('الكترونيات');
    });

    /** @test Should fall back to English slug when seoSlug is null */
    it('should fall back to English slug when seoSlug is null', () => {
      // Arrange
      const category = createCategory({ seoSlug: null });

      // Act
      const slug = category.getSlug('ar');

      // Assert
      expect(slug).toBe('electronics');
    });

    /** @test Should default to English when no language argument is provided */
    it('should default to English when no language argument is provided', () => {
      // Arrange
      const category = createCategory();

      // Act
      const slug = category.getSlug();

      // Assert
      expect(slug).toBe('electronics');
    });
  });

  // ==========================================================================
  // isPublic
  // ==========================================================================

  /**
   * @description Tests for isPublic method - determines if a category should
   * be visible to public customers (requires both isActive=true AND approvalStatus=approved).
   */
  describe('isPublic', () => {
    /** @test Should return true when category is active and approved */
    it('should return true when category is active and approved', () => {
      // Arrange
      const category = createCategory({
        isActive: true,
        approvalStatus: 'approved',
      });

      // Act & Assert
      expect(category.isPublic()).toBe(true);
    });

    /** @test Should return false when category is inactive */
    it('should return false when category is inactive', () => {
      // Arrange
      const category = createCategory({ isActive: false });

      // Act & Assert
      expect(category.isPublic()).toBe(false);
    });

    /** @test Should return false when category is not approved (draft) */
    it('should return false when category is in draft status', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'draft' });

      // Act & Assert
      expect(category.isPublic()).toBe(false);
    });

    /** @test Should return false when category is pending */
    it('should return false when category is pending approval', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'pending' });

      // Act & Assert
      expect(category.isPublic()).toBe(false);
    });

    /** @test Should return false when category is rejected */
    it('should return false when category is rejected', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'rejected' });

      // Act & Assert
      expect(category.isPublic()).toBe(false);
    });

    /** @test Should return false when category is suspended */
    it('should return false when category is suspended', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'suspended' });

      // Act & Assert
      expect(category.isPublic()).toBe(false);
    });

    /** @test Should return false when category is archived */
    it('should return false when category is archived', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'archived' });

      // Act & Assert
      expect(category.isPublic()).toBe(false);
    });

    /** @test Should return false when both inactive and unapproved */
    it('should return false when both inactive and unapproved', () => {
      // Arrange
      const category = createCategory({
        isActive: false,
        approvalStatus: 'draft',
      });

      // Act & Assert
      expect(category.isPublic()).toBe(false);
    });
  });

  // ==========================================================================
  // canBeEdited
  // ==========================================================================

  /**
   * @description Tests for canBeEdited method - determines if a category is in
   * an editable state (only "draft" and "rejected" statuses are editable).
   */
  describe('canBeEdited', () => {
    /** @test Should return true when category status is draft */
    it('should return true when category status is draft', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'draft' });

      // Act & Assert
      expect(category.canBeEdited()).toBe(true);
    });

    /** @test Should return true when category status is rejected */
    it('should return true when category status is rejected', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'rejected' });

      // Act & Assert
      expect(category.canBeEdited()).toBe(true);
    });

    /** @test Should return false when category status is approved */
    it('should return false when category status is approved', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'approved' });

      // Act & Assert
      expect(category.canBeEdited()).toBe(false);
    });

    /** @test Should return false when category status is pending */
    it('should return false when category status is pending', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'pending' });

      // Act & Assert
      expect(category.canBeEdited()).toBe(false);
    });

    /** @test Should return false when category status is suspended */
    it('should return false when category status is suspended', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'suspended' });

      // Act & Assert
      expect(category.canBeEdited()).toBe(false);
    });

    /** @test Should return false when category status is archived */
    it('should return false when category status is archived', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'archived' });

      // Act & Assert
      expect(category.canBeEdited()).toBe(false);
    });
  });

  // ==========================================================================
  // isRootCategory
  // ==========================================================================

  /**
   * @description Tests for isRootCategory method - identifies top-level categories
   * that have no parent and depthLevel of 0.
   */
  describe('isRootCategory', () => {
    /** @test Should return true when parent is null and depthLevel is 0 */
    it('should return true for a root category with no parent', () => {
      // Arrange
      const category = createCategory({ parent: null, depthLevel: 0 });

      // Act & Assert
      expect(category.isRootCategory()).toBe(true);
    });

    /** @test Should return false when category has a parent */
    it('should return false when category has a parent', () => {
      // Arrange
      const parentCategory = createCategory({ id: 10 });
      const childCategory = createCategory({
        parent: parentCategory,
        depthLevel: 1,
      });

      // Act & Assert
      expect(childCategory.isRootCategory()).toBe(false);
    });

    /** @test Should return false when depthLevel is greater than 0 even with null parent */
    it('should return false when depthLevel is > 0 even if parent is null', () => {
      // Arrange - edge case: orphan category with inconsistent data
      const category = createCategory({ parent: null, depthLevel: 1 });

      // Act & Assert
      expect(category.isRootCategory()).toBe(false);
    });

    /** @test Should return false when parent exists even if depthLevel is 0 */
    it('should return false when parent exists even if depthLevel is 0', () => {
      // Arrange - edge case: inconsistent data
      const parentCategory = createCategory({ id: 10 });
      const category = createCategory({
        parent: parentCategory,
        depthLevel: 0,
      });

      // Act & Assert
      expect(category.isRootCategory()).toBe(false);
    });
  });

  // ==========================================================================
  // hasChildren
  // ==========================================================================

  /**
   * @description Tests for hasChildren method - checks whether the category
   * has child categories in its children array.
   */
  describe('hasChildren', () => {
    /** @test Should return true when children array has items */
    it('should return true when category has children', () => {
      // Arrange
      const child1 = createCategory({ id: 10, nameEn: 'Smartphones' });
      const child2 = createCategory({ id: 11, nameEn: 'Laptops' });
      const category = createCategory({ children: [child1, child2] });

      // Act & Assert
      expect(category.hasChildren()).toBe(true);
    });

    /** @test Should return false when children array is empty */
    it('should return false when children array is empty', () => {
      // Arrange
      const category = createCategory({ children: [] });

      // Act & Assert
      expect(category.hasChildren()).toBe(false);
    });

    /** @test Should return falsy when children is null */
    it('should return falsy when children is null', () => {
      // Arrange
      const category = createCategory({ children: null });

      // Act & Assert - hasChildren uses short-circuit (&&), returns null for null children
      expect(category.hasChildren()).toBeFalsy();
    });

    /** @test Should return falsy when children is undefined */
    it('should return falsy when children is undefined', () => {
      // Arrange
      const category = createCategory({ children: undefined });

      // Act & Assert - hasChildren uses short-circuit (&&), returns undefined for undefined children
      expect(category.hasChildren()).toBeFalsy();
    });
  });

  // ==========================================================================
  // getBreadcrumbPath
  // ==========================================================================

  /**
   * @description Tests for getBreadcrumbPath method - generates breadcrumb
   * navigation path as an array of category names.
   */
  describe('getBreadcrumbPath', () => {
    /** @test Should return array from categoryPath when it exists */
    it('should split categoryPath into an array', () => {
      // Arrange
      const category = createCategory({
        categoryPath: 'Electronics/Smartphones/iPhone',
      });

      // Act
      const path = category.getBreadcrumbPath('en');

      // Assert
      expect(path).toEqual(['Electronics', 'Smartphones', 'iPhone']);
    });

    /** @test Should return single-item array with display name when no categoryPath */
    it('should return display name when categoryPath is null', () => {
      // Arrange
      const category = createCategory({ categoryPath: null });

      // Act
      const path = category.getBreadcrumbPath('en');

      // Assert
      expect(path).toEqual(['Electronics']);
    });

    /** @test Should return Arabic display name when language is "ar" and no path */
    it('should return Arabic name when language is "ar" and no categoryPath', () => {
      // Arrange
      const category = createCategory({ categoryPath: null });

      // Act
      const path = category.getBreadcrumbPath('ar');

      // Assert
      expect(path).toEqual(['إلكترونيات']);
    });

    /** @test Should return single-element array when categoryPath has no separator */
    it('should return single-element array for root path', () => {
      // Arrange
      const category = createCategory({ categoryPath: 'Electronics' });

      // Act
      const path = category.getBreadcrumbPath('en');

      // Assert
      expect(path).toEqual(['Electronics']);
    });
  });

  // ==========================================================================
  // getPopularityRank
  // ==========================================================================

  /**
   * @description Tests for getPopularityRank method - calculates a weighted score
   * from viewCount (weight 0.3) and productCount (weight 0.7).
   */
  describe('getPopularityRank', () => {
    /** @test Should calculate correctly using the formula: views*0.3 + products*0.7 */
    it('should calculate rank from viewCount and productCount', () => {
      // Arrange
      const category = createCategory({
        viewCount: 1000,
        productCount: 200,
      });

      // Act
      const rank = category.getPopularityRank();

      // Assert: 1000 * 0.3 + 200 * 0.7 = 300 + 140 = 440
      expect(rank).toBe(440);
    });

    /** @test Should return 0 when both metrics are 0 */
    it('should return 0 when both viewCount and productCount are 0', () => {
      // Arrange
      const category = createCategory({ viewCount: 0, productCount: 0 });

      // Act & Assert
      expect(category.getPopularityRank()).toBe(0);
    });

    /** @test Should handle case where only views contribute */
    it('should calculate correctly when only viewCount is non-zero', () => {
      // Arrange
      const category = createCategory({
        viewCount: 500,
        productCount: 0,
      });

      // Act & Assert: 500 * 0.3 = 150
      expect(category.getPopularityRank()).toBe(150);
    });

    /** @test Should handle case where only products contribute */
    it('should calculate correctly when only productCount is non-zero', () => {
      // Arrange
      const category = createCategory({
        viewCount: 0,
        productCount: 100,
      });

      // Act & Assert: 100 * 0.7 = 70
      expect(category.getPopularityRank()).toBe(70);
    });
  });

  // ==========================================================================
  // needsAdminAttention
  // ==========================================================================

  /**
   * @description Tests for needsAdminAttention method - flags categories
   * that require admin review or action.
   */
  describe('needsAdminAttention', () => {
    /** @test Should return true when status is pending */
    it('should return true when approval status is pending', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'pending' });

      // Act & Assert
      expect(category.needsAdminAttention()).toBe(true);
    });

    /** @test Should return true when status is rejected */
    it('should return true when approval status is rejected', () => {
      // Arrange
      const category = createCategory({ approvalStatus: 'rejected' });

      // Act & Assert
      expect(category.needsAdminAttention()).toBe(true);
    });

    /** @test Should return true for active category with 0 products older than 7 days */
    it('should return true for active category with 0 products older than 7 days', () => {
      // Arrange
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const category = createCategory({
        approvalStatus: 'approved',
        isActive: true,
        productCount: 0,
        createdAt: eightDaysAgo,
      });

      // Act & Assert
      expect(category.needsAdminAttention()).toBe(true);
    });

    /** @test Should return false for approved category with products */
    it('should return false for approved category with products', () => {
      // Arrange
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const category = createCategory({
        approvalStatus: 'approved',
        isActive: true,
        productCount: 50,
        createdAt: eightDaysAgo,
      });

      // Act & Assert
      expect(category.needsAdminAttention()).toBe(false);
    });

    /** @test Should return false for new active category with 0 products (under 7 days) */
    it('should return false for new category with 0 products under 7 days old', () => {
      // Arrange
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const category = createCategory({
        approvalStatus: 'approved',
        isActive: true,
        productCount: 0,
        createdAt: twoDaysAgo,
      });

      // Act & Assert
      expect(category.needsAdminAttention()).toBe(false);
    });

    /** @test Should return false for inactive category even with 0 products */
    it('should return false for inactive category with 0 products older than 7 days', () => {
      // Arrange
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const category = createCategory({
        approvalStatus: 'approved',
        isActive: false,
        productCount: 0,
        createdAt: eightDaysAgo,
      });

      // Act & Assert
      expect(category.needsAdminAttention()).toBe(false);
    });
  });

  // ==========================================================================
  // generateUrl
  // ==========================================================================

  /**
   * @description Tests for generateUrl method - generates frontend URL paths
   * with language-specific prefixes and slugs.
   */
  describe('generateUrl', () => {
    /** @test Should generate English URL without prefix */
    it('should generate English URL without language prefix', () => {
      // Arrange
      const category = createCategory();

      // Act
      const url = category.generateUrl('en');

      // Assert
      expect(url).toBe('/categories/electronics');
    });

    /** @test Should generate Arabic URL with /ar prefix and Arabic slug */
    it('should generate Arabic URL with /ar prefix and Arabic slug', () => {
      // Arrange
      const category = createCategory();

      // Act
      const url = category.generateUrl('ar');

      // Assert
      expect(url).toBe('/ar/categories/الكترونيات');
    });

    /** @test Should fall back to English slug for Arabic URL when seoSlug is null */
    it('should use English slug for Arabic URL when seoSlug is null', () => {
      // Arrange
      const category = createCategory({ seoSlug: null });

      // Act
      const url = category.generateUrl('ar');

      // Assert
      expect(url).toBe('/ar/categories/electronics');
    });

    /** @test Should default to English when no language is provided */
    it('should default to English URL when no language argument provided', () => {
      // Arrange
      const category = createCategory();

      // Act
      const url = category.generateUrl();

      // Assert
      expect(url).toBe('/categories/electronics');
    });
  });
});
