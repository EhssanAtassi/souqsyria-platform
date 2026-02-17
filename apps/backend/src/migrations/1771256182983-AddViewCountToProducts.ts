import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * @description Migration to add view_count column to products table
 *
 * This migration adds product view tracking functionality to enable:
 * - Analytics on product page views
 * - Popularity scoring based on views
 * - Trending product identification
 * - A/B testing metrics
 *
 * The view_count is incremented via POST /products/:slug/view endpoint.
 *
 * @author SouqSyria Development Team
 * @since 2026-02-16
 */
export class AddViewCountToProducts1771256182983 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add view_count column with default value 0
    await queryRunner.query(`
            ALTER TABLE \`products\`
            ADD COLUMN \`view_count\` INT NOT NULL DEFAULT 0
            COMMENT 'Number of times product detail page has been viewed'
        `);

    // Add index for performance when sorting by view count
    await queryRunner.query(`
            CREATE INDEX \`IDX_PRODUCTS_VIEW_COUNT\` ON \`products\` (\`view_count\` DESC)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`
            DROP INDEX \`IDX_PRODUCTS_VIEW_COUNT\` ON \`products\`
        `);

    // Drop column
    await queryRunner.query(`
            ALTER TABLE \`products\`
            DROP COLUMN \`view_count\`
        `);
  }
}
