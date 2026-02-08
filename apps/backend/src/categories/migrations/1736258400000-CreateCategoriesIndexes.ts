/**
 * @file 1736258400000-CreateCategoriesIndexes.ts
 * @description Categories table indexes for optimal query performance (MySQL 8)
 *
 * PURPOSE:
 * - Ensures critical indexes exist on categories table
 * - Optimizes mega menu queries (tree structure)
 * - Optimizes featured category queries
 * - Supports Arabic SEO slug lookups
 * - Improves hierarchy navigation performance
 *
 * INDEXES CREATED:
 * 1. IDX_categories_active_approved_sort - For public category listings
 * 2. IDX_categories_seo_slug - For Arabic URL lookups
 * 3. IDX_categories_parent_sort - For hierarchy queries
 * 4. IDX_categories_slug_unique - Ensures unique slugs
 * 5. IDX_categories_featured - For homepage featured categories
 *
 * NOTE:
 * This migration assumes the categories table already exists (created by TypeORM synchronize or previous migration).
 * It only creates indexes, not the table structure.
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Helper to check if an index exists on a MySQL table
 *
 * @param queryRunner - TypeORM query runner
 * @param tableName - Table to check
 * @param indexName - Index name to look for
 * @returns true if the index exists
 */
async function indexExists(
  queryRunner: QueryRunner,
  tableName: string,
  indexName: string,
): Promise<boolean> {
  const result = await queryRunner.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?
     LIMIT 1`,
    [tableName, indexName],
  );
  return result && result.length > 0;
}

export class CreateCategoriesIndexes1736258400000 implements MigrationInterface {
  name = 'CreateCategoriesIndexes1736258400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🏗️  Creating categories table indexes...');

    // Check if categories table exists
    const tableExists = await queryRunner.hasTable('categories');
    if (!tableExists) {
      console.log('⚠️  Categories table does not exist. Skipping index creation.');
      console.log('💡 The table will be auto-created by TypeORM based on the entity.');
      return;
    }

    /**
     * Index #1: Public Category Listings Index
     * Purpose: Optimize queries for active, approved categories sorted by sortOrder
     * Query Pattern: WHERE is_active = true AND approval_status = 'approved' ORDER BY sort_order
     * Impact: Main category listings, mega menu queries
     */
    if (!(await indexExists(queryRunner, 'categories', 'IDX_categories_active_approved_sort'))) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_categories_active_approved_sort\`
        ON \`categories\` (\`is_active\`, \`approval_status\`, \`sort_order\`)
      `);
      console.log('  ✅ Created: IDX_categories_active_approved_sort');
    } else {
      console.log('  ⏭️  Skipped: IDX_categories_active_approved_sort (already exists)');
    }

    /**
     * Index #2: Arabic SEO Slug Lookup
     * Purpose: Fast lookups for Arabic URL slugs
     * Query Pattern: WHERE seo_slug = ?
     * Impact: Arabic language routing and SEO
     * Note: MySQL does not support partial indexes; NULL values are simply excluded from lookups
     */
    if (!(await indexExists(queryRunner, 'categories', 'IDX_categories_seo_slug'))) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_categories_seo_slug\`
        ON \`categories\` (\`seo_slug\`)
      `);
      console.log('  ✅ Created: IDX_categories_seo_slug');
    } else {
      console.log('  ⏭️  Skipped: IDX_categories_seo_slug (already exists)');
    }

    /**
     * Index #3: Hierarchy Navigation Index
     * Purpose: Optimize parent-child queries
     * Query Pattern: WHERE parent_id = ? ORDER BY sort_order
     * Impact: Tree structure queries, mega menu building
     */
    if (!(await indexExists(queryRunner, 'categories', 'IDX_categories_parent_sort'))) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_categories_parent_sort\`
        ON \`categories\` (\`parent_id\`, \`sort_order\`)
      `);
      console.log('  ✅ Created: IDX_categories_parent_sort');
    } else {
      console.log('  ⏭️  Skipped: IDX_categories_parent_sort (already exists)');
    }

    /**
     * Index #4: Unique Slug Index
     * Purpose: Ensure slug uniqueness across all categories
     * Query Pattern: WHERE slug = ?
     * Impact: Category routing, URL generation
     * Note: This is likely already created by TypeORM @Column({ unique: true })
     */
    if (!(await indexExists(queryRunner, 'categories', 'IDX_categories_slug_unique'))) {
      // Check if TypeORM already created a unique constraint on slug
      const slugIndexResult = await queryRunner.query(
        `SELECT 1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'categories'
           AND COLUMN_NAME = 'slug'
           AND NON_UNIQUE = 0
         LIMIT 1`,
      );
      if (!slugIndexResult || slugIndexResult.length === 0) {
        await queryRunner.query(`
          CREATE UNIQUE INDEX \`IDX_categories_slug_unique\`
          ON \`categories\` (\`slug\`)
        `);
        console.log('  ✅ Created: IDX_categories_slug_unique');
      } else {
        console.log('  ⏭️  Skipped: IDX_categories_slug_unique (TypeORM unique constraint exists)');
      }
    } else {
      console.log('  ⏭️  Skipped: IDX_categories_slug_unique (already exists)');
    }

    /**
     * Index #5: Featured Categories Index
     * Purpose: Optimize featured category queries for homepage
     * Query Pattern: WHERE is_featured = true AND is_active = true ORDER BY featured_priority DESC
     * Impact: Homepage featured sections, promotional displays
     */
    if (!(await indexExists(queryRunner, 'categories', 'IDX_categories_featured'))) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_categories_featured\`
        ON \`categories\` (\`is_featured\`, \`is_active\`, \`featured_priority\`)
      `);
      console.log('  ✅ Created: IDX_categories_featured');
    } else {
      console.log('  ⏭️  Skipped: IDX_categories_featured (already exists)');
    }

    console.log('✅ Categories indexes created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🗑️  Dropping categories table indexes...');

    // MySQL DROP INDEX requires ON table_name
    const indexes = [
      'IDX_categories_featured',
      'IDX_categories_slug_unique',
      'IDX_categories_parent_sort',
      'IDX_categories_seo_slug',
      'IDX_categories_active_approved_sort',
    ];

    for (const idx of indexes) {
      if (await indexExists(queryRunner, 'categories', idx)) {
        await queryRunner.query(`DROP INDEX \`${idx}\` ON \`categories\``);
        console.log(`  ✅ Dropped: ${idx}`);
      }
    }

    console.log('✅ Categories indexes dropped successfully');
  }
}
