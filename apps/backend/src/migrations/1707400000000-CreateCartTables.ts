/**
 * @file CreateCartTables migration
 * @description Creates cart, cart_items, and guest_sessions tables
 * with all indexes. Includes the `removed_at` soft-delete column
 * for the undo-remove feature.
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartTables1707400000000 implements MigrationInterface {
  name = 'CreateCartTables1707400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Guest sessions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`guest_sessions\` (
        \`id\` varchar(36) NOT NULL,
        \`fingerprint\` varchar(255) NULL,
        \`ip_address\` varchar(45) NULL,
        \`user_agent\` text NULL,
        \`status\` enum('active','expired','converted') NOT NULL DEFAULT 'active',
        \`expires_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_guest_sessions_status\` (\`status\`),
        INDEX \`IDX_guest_sessions_expires_at\` (\`expires_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Carts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`carts\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NULL,
        \`session_id\` varchar(36) NULL,
        \`version\` int NOT NULL DEFAULT 1,
        \`status\` enum('active','abandoned','converting','expired') NOT NULL DEFAULT 'active',
        \`currency\` varchar(3) NOT NULL DEFAULT 'SYP',
        \`total_items\` int NOT NULL DEFAULT 0,
        \`total_amount\` decimal(12,2) NOT NULL DEFAULT 0,
        \`last_activity_at\` datetime NULL,
        \`expires_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_carts_user_id\` (\`user_id\`),
        INDEX \`IDX_carts_session_id\` (\`session_id\`),
        INDEX \`IDX_carts_status\` (\`status\`),
        INDEX \`IDX_carts_currency\` (\`currency\`),
        INDEX \`IDX_carts_last_activity_at\` (\`last_activity_at\`),
        INDEX \`IDX_carts_expires_at\` (\`expires_at\`),
        UNIQUE INDEX \`IDX_carts_session_id_unique\` (\`session_id\`),
        CONSTRAINT \`FK_carts_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_carts_guest_session\` FOREIGN KEY (\`session_id\`) REFERENCES \`guest_sessions\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Cart items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`cart_items\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`cart_id\` int NOT NULL,
        \`variant_id\` int NOT NULL,
        \`quantity\` int NOT NULL,
        \`price_at_add\` decimal(10,2) NOT NULL,
        \`price_discounted\` decimal(10,2) NULL,
        \`added_at\` datetime NULL,
        \`locked_until\` datetime NULL,
        \`selected_attributes\` json NULL,
        \`valid\` tinyint NOT NULL DEFAULT 1,
        \`expires_at\` datetime NULL,
        \`added_from_campaign\` varchar(100) NULL,
        \`removed_at\` datetime NULL,
        \`reservationId\` varchar(100) NULL,
        \`reservedUntil\` datetime NULL,
        \`reservationStatus\` enum('PENDING','CONFIRMED','ALLOCATED','RELEASED','EXPIRED','CANCELLED') NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_cart_items_cart_id\` (\`cart_id\`),
        INDEX \`IDX_cart_items_variant_id\` (\`variant_id\`),
        INDEX \`IDX_cart_items_removed_at\` (\`removed_at\`),
        CONSTRAINT \`FK_cart_items_cart\` FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_cart_items_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`cart_items\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`carts\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`guest_sessions\``);
  }
}
