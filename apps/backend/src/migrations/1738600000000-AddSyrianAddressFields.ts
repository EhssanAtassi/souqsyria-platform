/**
 * @file 1738600000000-AddSyrianAddressFields.ts
 * @description Add Syrian-specific address fields to addresses table
 *
 * PURPOSE:
 * Extends the addresses table to support Syrian administrative divisions
 * and delivery-specific fields for enhanced address management.
 *
 * FEATURES ADDED:
 * - Syrian administrative hierarchy (governorate, city, district)
 * - Recipient full name field
 * - Building and floor details
 * - Additional delivery instructions
 * - Performance indexes for lookups
 *
 * BACKWARD COMPATIBILITY:
 * - All new fields are nullable to maintain existing address records
 * - Existing country/region/city fields remain functional
 * - No data loss or breaking changes to existing addresses
 *
 * INDEXES ADDED:
 * 1. addresses: Composite index for user default address lookup
 * 2. addresses: Index for governorate-based queries
 * 3. addresses: Index for Syrian city queries
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 Syrian Address Support
 */

import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddSyrianAddressFields1738600000000 implements MigrationInterface {
  name = 'AddSyrianAddressFields1738600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ═══════════════════════════════════════════════════════════════════════
    // 🏠 SYRIAN ADDRESS FIELDS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Column: full_name
     * Purpose: Store recipient's full name for delivery (supports Arabic names)
     * Example: "أحمد محمد الخطيب" or "Ahmad Mohammad Al-Khatib"
     * Validation: Required for Syrian addresses, 128 char max
     */
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'full_name',
        type: 'varchar',
        length: '128',
        isNullable: true,
        comment: 'Full name of the recipient for delivery',
      }),
    );

    /**
     * Column: governorate_id
     * Purpose: Link to Syrian governorate (محافظة)
     * Foreign Key: References syrian_governorates table
     * Example: 1 = Damascus, 2 = Aleppo, etc.
     */
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'governorate_id',
        type: 'int',
        isNullable: true,
        comment: 'Syrian governorate ID (محافظة)',
      }),
    );

    /**
     * Column: city_id_syrian
     * Purpose: Link to Syrian city/town (مدينة/بلدة)
     * Foreign Key: References syrian_cities table
     * Note: Separate from generic city_id for Syrian-specific structure
     */
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'city_id_syrian',
        type: 'int',
        isNullable: true,
        comment: 'Syrian city ID from syrian_cities table',
      }),
    );

    /**
     * Column: district_id
     * Purpose: Link to Syrian district/neighborhood (حي/منطقة)
     * Foreign Key: References syrian_districts table
     * Example: "Old Damascus", "Al-Hamidiyah", etc.
     */
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'district_id',
        type: 'int',
        isNullable: true,
        comment: 'Syrian district ID (حي)',
      }),
    );

    /**
     * Column: building
     * Purpose: Building name or number
     * Example: "بناء السلام", "Building 42", "مجمع الفردوس"
     * Usage: Helps delivery drivers locate the exact building
     */
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'building',
        type: 'varchar',
        length: '64',
        isNullable: true,
        comment: 'Building name or number',
      }),
    );

    /**
     * Column: floor
     * Purpose: Floor number or description
     * Example: "3", "الطابق الثالث", "Ground Floor"
     * Usage: Precise delivery location within building
     */
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'floor',
        type: 'varchar',
        length: '16',
        isNullable: true,
        comment: 'Floor number or description',
      }),
    );

    /**
     * Column: additional_details
     * Purpose: Extra delivery instructions
     * Example: "بجانب الصيدلية", "Near the pharmacy", "Last building on the left"
     * Usage: Additional context for delivery drivers
     */
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'additional_details',
        type: 'varchar',
        length: '256',
        isNullable: true,
        comment: 'Additional delivery details and instructions',
      }),
    );

    // ═══════════════════════════════════════════════════════════════════════
    // 🔗 FOREIGN KEY CONSTRAINTS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * FK: addresses -> syrian_governorates
     * Purpose: Ensure governorate_id references valid governorate
     * On Delete: SET NULL (preserve address if governorate deleted)
     */
    await queryRunner.createForeignKey(
      'addresses',
      new TableForeignKey({
        name: 'FK_addresses_governorate',
        columnNames: ['governorate_id'],
        referencedTableName: 'syrian_governorates',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    /**
     * FK: addresses -> syrian_cities
     * Purpose: Ensure city_id_syrian references valid Syrian city
     * On Delete: SET NULL (preserve address if city deleted)
     */
    await queryRunner.createForeignKey(
      'addresses',
      new TableForeignKey({
        name: 'FK_addresses_syrian_city',
        columnNames: ['city_id_syrian'],
        referencedTableName: 'syrian_cities',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    /**
     * FK: addresses -> syrian_districts
     * Purpose: Ensure district_id references valid Syrian district
     * On Delete: SET NULL (preserve address if district deleted)
     */
    await queryRunner.createForeignKey(
      'addresses',
      new TableForeignKey({
        name: 'FK_addresses_district',
        columnNames: ['district_id'],
        referencedTableName: 'syrian_districts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // ═══════════════════════════════════════════════════════════════════════
    // 📊 PERFORMANCE INDEXES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Index #1: User Default Address Lookup
     * Purpose: Fast retrieval of user's default shipping/billing address
     * Query Pattern: WHERE user_id = ? AND is_default = true
     * Impact: Critical for checkout and order placement performance
     */
    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_user_default',
        columnNames: ['user_id', 'is_default'],
      }),
    );

    /**
     * Index #2: Governorate-based Address Queries
     * Purpose: Support filtering and searching addresses by governorate
     * Query Pattern: WHERE governorate_id = ?
     * Impact: Delivery zone calculations, address validation
     */
    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_governorate',
        columnNames: ['governorate_id'],
      }),
    );

    /**
     * Index #3: Syrian City-based Queries
     * Purpose: Fast lookup of addresses within a specific Syrian city
     * Query Pattern: WHERE city_id_syrian = ?
     * Impact: Delivery planning, city-specific address operations
     */
    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_city_syrian',
        columnNames: ['city_id_syrian'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ═══════════════════════════════════════════════════════════════════════
    // 🔄 ROLLBACK: Remove indexes, foreign keys, and columns in reverse order
    // ═══════════════════════════════════════════════════════════════════════

    // Drop indexes
    await queryRunner.dropIndex('addresses', 'IDX_addresses_city_syrian');
    await queryRunner.dropIndex('addresses', 'IDX_addresses_governorate');
    await queryRunner.dropIndex('addresses', 'IDX_addresses_user_default');

    // Drop foreign keys
    await queryRunner.dropForeignKey('addresses', 'FK_addresses_district');
    await queryRunner.dropForeignKey('addresses', 'FK_addresses_syrian_city');
    await queryRunner.dropForeignKey('addresses', 'FK_addresses_governorate');

    // Drop columns
    await queryRunner.dropColumn('addresses', 'additional_details');
    await queryRunner.dropColumn('addresses', 'floor');
    await queryRunner.dropColumn('addresses', 'building');
    await queryRunner.dropColumn('addresses', 'district_id');
    await queryRunner.dropColumn('addresses', 'city_id_syrian');
    await queryRunner.dropColumn('addresses', 'governorate_id');
    await queryRunner.dropColumn('addresses', 'full_name');
  }
}
