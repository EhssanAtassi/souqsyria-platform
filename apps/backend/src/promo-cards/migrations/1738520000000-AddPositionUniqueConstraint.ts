/**
 * @file 1738520000000-AddPositionUniqueConstraint.ts
 * @description Migration to add unique partial index for position race condition prevention
 *
 * SECURITY FIX: P1-3 - Position Race Condition
 * Adds unique partial index on (position, is_active, approval_status) WHERE deleted_at IS NULL
 * This prevents multiple active approved cards from occupying the same position
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Position Unique Constraint
 *
 * Prevents race conditions when multiple cards try to occupy the same position
 * by enforcing a unique constraint at the database level.
 *
 * CONSTRAINT RULES:
 * - Only ONE card can be active + approved at position 1
 * - Only ONE card can be active + approved at position 2
 * - Deleted cards (deleted_at IS NOT NULL) are excluded from constraint
 * - Non-active or non-approved cards can coexist at same position
 *
 * IMPLEMENTATION:
 * Uses PostgreSQL partial unique index with WHERE clause for optimal performance
 * and conditional uniqueness enforcement.
 */
export class AddPositionUniqueConstraint1738520000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create unique partial index to prevent position race conditions
    // This ensures only ONE active + approved card can exist per position at any time
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UNQ_promo_cards_position_active_approved"
      ON "promo_cards" ("position", "is_active", "approval_status")
      WHERE "deleted_at" IS NULL
        AND "is_active" = true
        AND "approval_status" = 'approved'
    `);

    // Add explanatory comment for database documentation
    await queryRunner.query(`
      COMMENT ON INDEX "UNQ_promo_cards_position_active_approved" IS
      'Prevents multiple active approved cards at same position. Security fix for position race condition (P1-3).'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique partial index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UNQ_promo_cards_position_active_approved"
    `);
  }
}
