/**
 * @file UpdateGuestSessionsTable migration
 * @description Updates guest_sessions table to match GuestSession entity schema
 *
 * CHANGES:
 * - Add session_token column (SHA256 hash, unique, indexed)
 * - Add device_fingerprint column (JSON)
 * - Add last_activity_at column (datetime, indexed)
 * - Add converted_user_id column (int, nullable)
 * - Remove old fingerprint, user_agent columns
 * - Ensure status enum includes 'converted' option
 * - Ensure expires_at is NOT NULL with index
 *
 * BACKWARD COMPATIBILITY:
 * - Migration checks if columns exist before altering
 * - Handles both fresh installs and existing databases
 *
 * @author SouqSyria Development Team
 * @since 2026-02-15
 * @version 1.0.0
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGuestSessionsTable1740000001000
  implements MigrationInterface
{
  name = 'UpdateGuestSessionsTable1740000001000';

  /**
   * Apply migration changes
   *
   * Updates guest_sessions table schema to match current entity requirements.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if guest_sessions table exists
    const tableExists = await queryRunner.hasTable('guest_sessions');

    if (!tableExists) {
      // Create table from scratch if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE \`guest_sessions\` (
          \`id\` varchar(36) NOT NULL,
          \`session_token\` varchar(64) NOT NULL,
          \`ip_address\` varchar(45) NULL,
          \`device_fingerprint\` json NULL,
          \`last_activity_at\` datetime NOT NULL,
          \`expires_at\` datetime NOT NULL,
          \`status\` enum('active','expired','converted') NOT NULL DEFAULT 'active',
          \`converted_user_id\` int NULL,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`IDX_guest_sessions_session_token\` (\`session_token\`),
          INDEX \`IDX_guest_sessions_last_activity_at\` (\`last_activity_at\`),
          INDEX \`IDX_guest_sessions_expires_at\` (\`expires_at\`),
          INDEX \`IDX_guest_sessions_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      return;
    }

    // Table exists - update schema
    // 1. Add session_token column if it doesn't exist
    const hasSessionToken = await queryRunner.hasColumn(
      'guest_sessions',
      'session_token',
    );
    if (!hasSessionToken) {
      await queryRunner.query(`
        ALTER TABLE \`guest_sessions\`
        ADD COLUMN \`session_token\` varchar(64) NOT NULL DEFAULT ''
      `);

      // Create unique index
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`IDX_guest_sessions_session_token\`
        ON \`guest_sessions\` (\`session_token\`)
      `);
    }

    // 2. Add device_fingerprint column if it doesn't exist
    const hasDeviceFingerprint = await queryRunner.hasColumn(
      'guest_sessions',
      'device_fingerprint',
    );
    if (!hasDeviceFingerprint) {
      await queryRunner.query(`
        ALTER TABLE \`guest_sessions\`
        ADD COLUMN \`device_fingerprint\` json NULL
      `);
    }

    // 3. Add last_activity_at column if it doesn't exist
    const hasLastActivityAt = await queryRunner.hasColumn(
      'guest_sessions',
      'last_activity_at',
    );
    if (!hasLastActivityAt) {
      await queryRunner.query(`
        ALTER TABLE \`guest_sessions\`
        ADD COLUMN \`last_activity_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);

      // Create index
      await queryRunner.query(`
        CREATE INDEX \`IDX_guest_sessions_last_activity_at\`
        ON \`guest_sessions\` (\`last_activity_at\`)
      `);
    }

    // 4. Add converted_user_id column if it doesn't exist
    const hasConvertedUserId = await queryRunner.hasColumn(
      'guest_sessions',
      'converted_user_id',
    );
    if (!hasConvertedUserId) {
      await queryRunner.query(`
        ALTER TABLE \`guest_sessions\`
        ADD COLUMN \`converted_user_id\` int NULL
      `);
    }

    // 5. Remove old fingerprint column if it exists
    const hasOldFingerprint = await queryRunner.hasColumn(
      'guest_sessions',
      'fingerprint',
    );
    if (hasOldFingerprint) {
      // Migrate data to device_fingerprint before dropping
      await queryRunner.query(`
        UPDATE \`guest_sessions\`
        SET \`device_fingerprint\` = JSON_OBJECT('fingerprint', \`fingerprint\`)
        WHERE \`fingerprint\` IS NOT NULL AND \`device_fingerprint\` IS NULL
      `);

      await queryRunner.query(`
        ALTER TABLE \`guest_sessions\`
        DROP COLUMN \`fingerprint\`
      `);
    }

    // 6. Remove old user_agent column if it exists
    const hasOldUserAgent = await queryRunner.hasColumn(
      'guest_sessions',
      'user_agent',
    );
    if (hasOldUserAgent) {
      // Migrate data to device_fingerprint before dropping
      await queryRunner.query(`
        UPDATE \`guest_sessions\`
        SET \`device_fingerprint\` = JSON_SET(
          COALESCE(\`device_fingerprint\`, '{}'),
          '$.userAgent',
          \`user_agent\`
        )
        WHERE \`user_agent\` IS NOT NULL
      `);

      await queryRunner.query(`
        ALTER TABLE \`guest_sessions\`
        DROP COLUMN \`user_agent\`
      `);
    }

    // 7. Ensure expires_at is NOT NULL
    await queryRunner.query(`
      UPDATE \`guest_sessions\`
      SET \`expires_at\` = DATE_ADD(COALESCE(\`created_at\`, NOW()), INTERVAL 30 DAY)
      WHERE \`expires_at\` IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      MODIFY COLUMN \`expires_at\` datetime NOT NULL
    `);

    // 8. Ensure status enum includes 'converted'
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      MODIFY COLUMN \`status\` enum('active','expired','converted') NOT NULL DEFAULT 'active'
    `);
  }

  /**
   * Revert migration changes
   *
   * Note: Data migration for old columns is irreversible.
   * This down migration creates placeholder columns.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('guest_sessions');
    if (!tableExists) {
      return;
    }

    // Restore old schema (data loss expected)
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      ADD COLUMN \`fingerprint\` varchar(255) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      ADD COLUMN \`user_agent\` text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      DROP COLUMN IF EXISTS \`converted_user_id\`
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS \`IDX_guest_sessions_last_activity_at\` ON \`guest_sessions\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      DROP COLUMN IF EXISTS \`last_activity_at\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      DROP COLUMN IF EXISTS \`device_fingerprint\`
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS \`IDX_guest_sessions_session_token\` ON \`guest_sessions\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      DROP COLUMN IF EXISTS \`session_token\`
    `);

    // Revert status enum
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      MODIFY COLUMN \`status\` enum('active','expired') NOT NULL DEFAULT 'active'
    `);

    // Revert expires_at to nullable
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\`
      MODIFY COLUMN \`expires_at\` datetime NULL
    `);
  }
}
