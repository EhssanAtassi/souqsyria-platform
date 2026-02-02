/**
 * @file 1738515600000-CreatePromoCardsTable.ts
 * @description Migration to create promo_cards table for hero banner 70/30 layout
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create Promo Cards Table
 *
 * Creates the promo_cards table with:
 * - UUID primary key
 * - Bilingual content (English/Arabic)
 * - Position-based placement (1 or 2)
 * - Campaign scheduling
 * - Analytics tracking
 * - Approval workflow
 * - Soft delete support
 * - Audit fields
 */
export class CreatePromoCardsTable1738515600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create promo_cards table
    await queryRunner.createTable(
      new Table({
        name: 'promo_cards',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          // Multilingual content
          {
            name: 'title_en',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'title_ar',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'description_en',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'description_ar',
            type: 'text',
            isNullable: true,
          },
          // Visual assets
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'link_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          // Positioning
          {
            name: 'position',
            type: 'smallint',
            isNullable: false,
            comment: '1 = left 70%, 2 = right 30%',
          },
          // Badge system
          {
            name: 'badge_text_en',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'badge_text_ar',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'badge_class',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          // Status & visibility
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
          },
          {
            name: 'approval_status',
            type: 'varchar',
            length: '20',
            default: "'draft'",
            comment: 'draft, pending, approved, rejected',
          },
          // Scheduling
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: true,
          },
          // Analytics
          {
            name: 'impressions',
            type: 'int',
            default: 0,
          },
          {
            name: 'clicks',
            type: 'int',
            default: 0,
          },
          // Audit fields
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          // Timestamps
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'promo_cards',
      new TableIndex({
        name: 'IDX_promo_cards_active_approval_position',
        columnNames: ['is_active', 'approval_status', 'position'],
      }),
    );

    await queryRunner.createIndex(
      'promo_cards',
      new TableIndex({
        name: 'IDX_promo_cards_schedule',
        columnNames: ['start_date', 'end_date'],
      }),
    );

    // Add position check constraint
    await queryRunner.query(`
      ALTER TABLE promo_cards
      ADD CONSTRAINT CHK_promo_cards_position
      CHECK (position IN (1, 2))
    `);

    // Add foreign key for created_by (optional, if users table exists)
    // Uncomment if you want to enforce referential integrity
    /*
    await queryRunner.createForeignKey(
      'promo_cards',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'promo_cards',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
    */
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys if they exist
    /*
    const table = await queryRunner.getTable('promo_cards');
    const createdByForeignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('created_by') !== -1,
    );
    const updatedByForeignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('updated_by') !== -1,
    );

    if (createdByForeignKey) {
      await queryRunner.dropForeignKey('promo_cards', createdByForeignKey);
    }
    if (updatedByForeignKey) {
      await queryRunner.dropForeignKey('promo_cards', updatedByForeignKey);
    }
    */

    // Drop indexes
    await queryRunner.dropIndex('promo_cards', 'IDX_promo_cards_active_approval_position');
    await queryRunner.dropIndex('promo_cards', 'IDX_promo_cards_schedule');

    // Drop table
    await queryRunner.dropTable('promo_cards');
  }
}
