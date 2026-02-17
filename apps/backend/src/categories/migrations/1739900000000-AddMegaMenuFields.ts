/**
 * @file AddMegaMenuFields migration
 * @description Adds mega menu configuration columns to categories table:
 *   - mega_menu_type: enum layout type (sidebar/fullwidth/deep-browse/none)
 *   - is_pinned_in_nav: boolean for pinned nav categories
 *   - mega_menu_config: JSON for promo banners, brand chips, etc.
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMegaMenuFields1739900000000 implements MigrationInterface {
  name = 'AddMegaMenuFields1739900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = async (col: string): Promise<boolean> => {
      const result = await queryRunner.query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'categories'
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [col],
      );
      return result && result.length > 0;
    };

    // @audit-fix W-9: Removed AFTER clauses — column order is not guaranteed
    // across MySQL versions and makes migrations fragile if upstream columns change
    if (!(await hasColumn('mega_menu_type'))) {
      await queryRunner.query(`
        ALTER TABLE \`categories\`
        ADD COLUMN \`mega_menu_type\`
          ENUM('sidebar','fullwidth','deep-browse','none')
          DEFAULT 'none'
      `);
    }

    if (!(await hasColumn('is_pinned_in_nav'))) {
      await queryRunner.query(`
        ALTER TABLE \`categories\`
        ADD COLUMN \`is_pinned_in_nav\` TINYINT(1) DEFAULT 0
      `);
    }

    if (!(await hasColumn('mega_menu_config'))) {
      await queryRunner.query(`
        ALTER TABLE \`categories\`
        ADD COLUMN \`mega_menu_config\` JSON DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`categories\` DROP COLUMN IF EXISTS \`mega_menu_config\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` DROP COLUMN IF EXISTS \`is_pinned_in_nav\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` DROP COLUMN IF EXISTS \`mega_menu_type\``,
    );
  }
}
