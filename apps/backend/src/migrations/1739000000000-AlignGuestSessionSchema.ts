/**
 * @file AlignGuestSessionSchema migration
 * @description Aligns guest_sessions table with the GuestSession entity:
 * - Adds session_token (unique SHA256 hash)
 * - Adds device_fingerprint (JSON)
 * - Adds last_activity_at (datetime with index)
 * - Adds converted_user_id (int, nullable)
 * - Removes old fingerprint, user_agent columns
 *
 * This migration ensures the DB matches the entity for SS-AUTH-009.
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignGuestSessionSchema1739000000000 implements MigrationInterface {
  name = 'AlignGuestSessionSchema1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      ADD COLUMN \`session_token\` VARCHAR(64) NULL UNIQUE,
      ADD COLUMN \`device_fingerprint\` JSON NULL,
      ADD COLUMN \`last_activity_at\` DATETIME NULL,
      ADD COLUMN \`converted_user_id\` INT NULL
    `);

    // Create index on session_token (unique already creates an index)
    // Create index on last_activity_at
    await queryRunner.query(`
      CREATE INDEX \`IDX_guest_sessions_last_activity_at\` ON \`guest_sessions\` (\`last_activity_at\`)
    `);

    // Migrate existing data: generate session_token for existing rows
    await queryRunner.query(`
      UPDATE \`guest_sessions\`
      SET
        \`session_token\` = SHA2(UUID(), 256),
        \`last_activity_at\` = COALESCE(\`created_at\`, NOW()),
        \`device_fingerprint\` = JSON_OBJECT(
          'userAgent', COALESCE(\`user_agent\`, ''),
          'platform', NULL,
          'language', NULL
        )
      WHERE \`session_token\` IS NULL
    `);

    // Make session_token NOT NULL after backfill
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      MODIFY COLUMN \`session_token\` VARCHAR(64) NOT NULL
    `);

    // Drop old columns
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      DROP COLUMN \`fingerprint\`,
      DROP COLUMN \`user_agent\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore old columns
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      ADD COLUMN \`fingerprint\` VARCHAR(255) NULL,
      ADD COLUMN \`user_agent\` TEXT NULL
    `);

    // Drop new columns
    await queryRunner.query(`
      DROP INDEX \`IDX_guest_sessions_last_activity_at\` ON \`guest_sessions\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      DROP COLUMN \`session_token\`,
      DROP COLUMN \`device_fingerprint\`,
      DROP COLUMN \`last_activity_at\`,
      DROP COLUMN \`converted_user_id\`
    `);
  }
}
