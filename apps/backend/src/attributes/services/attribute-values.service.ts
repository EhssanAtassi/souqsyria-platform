/**
 * @file attribute-values.service.ts
 * @description Complete standalone service for managing attribute values in SouqSyria
 *
 * This service handles all operations related to attribute values (the options within attributes).
 * For example, managing "Red", "Blue", "Green" values within a "Color" attribute.
 *
 * ✅ FIXED to match our enhanced entities and DTOs from artifacts above
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Attribute } from '../entities/attribute.entity';
import { AttributeValue } from '../entities/attribute-value.entity';
import { AttributeType } from '../entities/attribute-types.enum';
import {
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
  AttributeValueResponseDto,
} from '../dto/index-dto';

@Injectable()
export class AttributeValuesService {
  private readonly logger = new Logger(AttributeValuesService.name);

  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepository: Repository<AttributeValue>,
  ) {
    this.logger.log('AttributeValuesService initialized successfully');
  }

  // ============================================================================
  // ATTRIBUTE VALUE CRUD OPERATIONS
  // ============================================================================

  /**
   * CREATE ATTRIBUTE VALUE
   *
   * Why needed: Vendors and admins need to add new values to existing attributes.
   * For example, adding a new color option to the "Color" attribute or
   * adding a new size to the "Size" attribute.
   *
   * @param attributeId - Parent attribute ID
   * @param createValueDto - Value data with validation
   * @param adminUserId - ID of admin creating this value (for audit)
   * @returns Created attribute value with generated ID
   */
  async createAttributeValue(
    attributeId: number,
    createValueDto: CreateAttributeValueDto,
    adminUserId?: number,
  ): Promise<AttributeValueResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `Creating new value for attribute ${attributeId}: ${createValueDto.valueEn} (${createValueDto.valueAr})`,
    );

    try {
      // 1. Validate parent attribute exists and is active
      const parentAttribute = await this.validateParentAttribute(attributeId);

      // 2. Validate unique value names within attribute
      await this.validateUniqueValueNames(
        attributeId,
        createValueDto.valueEn,
        createValueDto.valueAr,
      );

      // 3. Validate display order uniqueness within attribute
      if (createValueDto.displayOrder !== undefined) {
        await this.validateUniqueValueDisplayOrder(
          attributeId,
          createValueDto.displayOrder,
        );
      }

      // 4. Validate type-specific rules
      await this.validateValueTypeRules(parentAttribute, createValueDto);

      // 5. Create value entity matching our enhanced entity structure
      const attributeValue = this.attributeValueRepository.create({
        valueEn: createValueDto.valueEn,
        valueAr: createValueDto.valueAr,
        displayOrder: createValueDto.displayOrder || 0,
        colorHex: createValueDto.colorHex,
        iconUrl: createValueDto.iconUrl,
        cssClass: createValueDto.cssClass,
        metadata: createValueDto.metadata,
        attributeId: attributeId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
      });

      // 6. Save value to database
      const savedValue =
        await this.attributeValueRepository.save(attributeValue);
      this.logger.log(
        `Attribute value created successfully with ID: ${savedValue.id}`,
      );

      // 7. Return formatted response
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `Attribute value creation completed in ${executionTime}ms`,
      );

      return this.transformValueToResponseDto(savedValue, 'en');
    } catch (error) {
      this.logger.error(
        `Failed to create attribute value: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create attribute value due to internal error',
      );
    }
  }

  /**
   * GET ATTRIBUTE VALUES BY ATTRIBUTE ID
   *
   * Why needed: Frontend needs to fetch values for specific attributes to:
   * - Populate dropdown options in product forms
   * - Display filter options in product search
   * - Show variant options in product detail pages
   * - Build dynamic forms for product creation
   *
   * @param attributeId - Parent attribute ID
   * @param language - Response language (en/ar)
   * @param includeInactive - Whether to include inactive values
   * @returns List of attribute values sorted by display order
   */
  async findAttributeValues(
    attributeId: number,
    language: 'en' | 'ar' = 'en',
    includeInactive: boolean = false,
  ): Promise<AttributeValueResponseDto[]> {
    this.logger.log(
      `Fetching values for attribute ${attributeId} (language: ${language}, includeInactive: ${includeInactive})`,
    );

    try {
      // 1. Verify attribute exists
      const attribute = await this.attributeRepository.findOne({
        where: { id: attributeId },
      });

      if (!attribute) {
        throw new NotFoundException(
          `Attribute with ID ${attributeId} not found`,
        );
      }

      // 2. Build optimized query
      const queryBuilder = this.buildValuesQuery(attributeId, includeInactive);

      // 3. Execute query
      const values = await queryBuilder.getMany();

      this.logger.log(
        `Found ${values.length} values for attribute ${attributeId}`,
      );

      // 4. Transform to response DTOs with localization
      return values.map((value) =>
        this.transformValueToResponseDto(value, language),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to fetch attribute values: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to fetch values for attribute ${attributeId}`,
      );
    }
  }

  /**
   * GET SINGLE ATTRIBUTE VALUE BY ID
   *
   * Why needed: Frontend needs to fetch specific value details for:
   * - Editing forms in admin panel
   * - Value detail displays
   * - API integrations
   * - Validation and checks
   *
   * @param valueId - Attribute value ID
   * @param language - Response language (en/ar)
   * @returns Single attribute value data
   */
  async findAttributeValueById(
    valueId: number,
    language: 'en' | 'ar' = 'en',
  ): Promise<AttributeValueResponseDto> {
    this.logger.log(
      `Fetching attribute value by ID: ${valueId} (language: ${language})`,
    );

    try {
      const value = await this.attributeValueRepository.findOne({
        where: { id: valueId },
        relations: ['attribute'],
      });

      if (!value) {
        this.logger.warn(`Attribute value not found with ID: ${valueId}`);
        throw new NotFoundException(
          `Attribute value with ID ${valueId} not found`,
        );
      }

      this.logger.log(`Attribute value ${valueId} retrieved successfully`);
      return this.transformValueToResponseDto(value, language);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to fetch attribute value ${valueId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to fetch attribute value ${valueId}`,
      );
    }
  }

  /**
   * UPDATE ATTRIBUTE VALUE
   *
   * Why needed: Admins need to modify existing attribute values to:
   * - Fix typos in value names
   * - Update color codes or icons
   * - Change display order for better UX
   * - Update price modifiers for variants
   * - Activate/deactivate specific values
   *
   * @param valueId - Attribute value ID to update
   * @param updateValueDto - Partial update data
   * @param adminUserId - Admin performing the update (for audit)
   * @returns Updated attribute value data
   */
  async updateAttributeValue(
    valueId: number,
    updateValueDto: UpdateAttributeValueDto,
    adminUserId?: number,
  ): Promise<AttributeValueResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `Updating attribute value ${valueId} with data: ${JSON.stringify(updateValueDto)}`,
    );

    try {
      // 1. Check if value exists and get current data
      const existingValue = await this.attributeValueRepository.findOne({
        where: { id: valueId },
        relations: ['attribute'],
      });

      if (!existingValue) {
        throw new NotFoundException(
          `Attribute value with ID ${valueId} not found`,
        );
      }

      // 2. Validate business rules for update
      await this.validateValueUpdate(valueId, updateValueDto, existingValue);

      // 3. Prepare update data with audit information
      const updateData = {
        valueEn: updateValueDto.valueEn,
        valueAr: updateValueDto.valueAr,
        displayOrder: updateValueDto.displayOrder,
        isActive: updateValueDto.isActive,
        colorHex: updateValueDto.colorHex,
        iconUrl: updateValueDto.iconUrl,
        cssClass: updateValueDto.cssClass,
        metadata: updateValueDto.metadata,
        updatedBy: adminUserId,
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // 4. Perform database update
      await this.attributeValueRepository.update(valueId, updateData);
      this.logger.log(`Attribute value ${valueId} updated successfully`);

      // 5. Fetch and return updated data
      const updatedValue = await this.attributeValueRepository.findOne({
        where: { id: valueId },
        relations: ['attribute'],
      });

      const executionTime = Date.now() - startTime;
      this.logger.log(`Attribute value update completed in ${executionTime}ms`);

      return this.transformValueToResponseDto(updatedValue, 'en');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update attribute value ${valueId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to update attribute value ${valueId}`,
      );
    }
  }

  /**
   * SOFT DELETE ATTRIBUTE VALUE
   *
   * Why needed: Remove outdated or incorrect attribute values while maintaining
   * data integrity. Soft delete prevents breaking existing product variants
   * that might reference these values.
   *
   * @param valueId - Attribute value ID to delete
   * @param adminUserId - Admin performing the deletion (for audit)
   * @returns Success confirmation with message
   */
  async deleteAttributeValue(
    valueId: number,
    adminUserId?: number,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Soft deleting attribute value ${valueId} by admin ${adminUserId}`,
    );

    try {
      // 1. Check if value exists and get related data
      const value = await this.attributeValueRepository.findOne({
        where: { id: valueId },
        relations: ['attribute'],
      });

      if (!value) {
        throw new NotFoundException(
          `Attribute value with ID ${valueId} not found`,
        );
      }

      // 2. Check if this is the last active value for the attribute
      const activeValuesCount = await this.countActiveValues(value.attributeId);

      if (activeValuesCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last active value for an attribute. Deactivate the attribute instead.',
        );
      }

      // 3. Check if value is used in products (business rule)
      const isUsedInProducts = await this.checkValueUsage(valueId);
      if (isUsedInProducts) {
        throw new BadRequestException(
          'Cannot delete attribute value that is currently used in products',
        );
      }

      // 4. Perform soft delete
      await this.attributeValueRepository.softDelete(valueId);

      this.logger.log(`Attribute value ${valueId} soft deleted successfully`);

      return {
        success: true,
        message: `Attribute value "${value.valueEn}" deleted successfully`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to delete attribute value ${valueId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to delete attribute value ${valueId}`,
      );
    }
  }

  /**
   * BULK CREATE ATTRIBUTE VALUES
   *
   * Why needed: Efficiently create multiple values at once for new attributes
   * or when importing data. This is much faster than individual API calls
   * and ensures atomicity (all succeed or all fail).
   *
   * @param attributeId - Parent attribute ID
   * @param values - Array of value DTOs to create
   * @param adminUserId - Admin performing the bulk creation
   * @returns Array of created values
   */
  async bulkCreateAttributeValues(
    attributeId: number,
    values: CreateAttributeValueDto[],
    adminUserId?: number,
  ): Promise<AttributeValueResponseDto[]> {
    const startTime = Date.now();
    this.logger.log(
      `Bulk creating ${values.length} values for attribute ${attributeId}`,
    );

    try {
      // 1. Validate parent attribute exists and is active
      const parentAttribute = await this.validateParentAttribute(attributeId);

      // 2. Validate all values before creating any
      for (let i = 0; i < values.length; i++) {
        const valueDto = values[i];

        // Check unique names
        await this.validateUniqueValueNames(
          attributeId,
          valueDto.valueEn,
          valueDto.valueAr,
        );

        // Validate type-specific rules
        await this.validateValueTypeRules(parentAttribute, valueDto);
      }

      // 3. Check for duplicate values within the batch
      this.validateNoDuplicatesInBatch(values);

      // 4. Create entities with proper ordering
      const valueEntities = values.map((valueDto, index) =>
        this.attributeValueRepository.create({
          valueEn: valueDto.valueEn,
          valueAr: valueDto.valueAr,
          displayOrder: valueDto.displayOrder ?? index,
          colorHex: valueDto.colorHex,
          iconUrl: valueDto.iconUrl,
          cssClass: valueDto.cssClass,
          metadata: valueDto.metadata,
          attributeId: attributeId,
          createdBy: adminUserId,
          updatedBy: adminUserId,
        }),
      );

      // 5. Bulk save to database (atomic operation)
      const savedValues =
        await this.attributeValueRepository.save(valueEntities);

      this.logger.log(
        `Successfully created ${savedValues.length} attribute values`,
      );

      const executionTime = Date.now() - startTime;
      this.logger.log(`Bulk value creation completed in ${executionTime}ms`);

      // 6. Return transformed responses
      return savedValues.map((value) =>
        this.transformValueToResponseDto(value, 'en'),
      );
    } catch (error) {
      this.logger.error(
        `Failed to bulk create attribute values: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to bulk create attribute values',
      );
    }
  }

  // ============================================================================
  // VALIDATION HELPER METHODS
  // ============================================================================

  /**
   * Validate that parent attribute exists and is active
   */
  private async validateParentAttribute(
    attributeId: number,
  ): Promise<Attribute> {
    const attribute = await this.attributeRepository.findOne({
      where: { id: attributeId, isActive: true },
    });

    if (!attribute) {
      throw new NotFoundException(
        `Active attribute with ID ${attributeId} not found`,
      );
    }

    return attribute;
  }

  /**
   * Validate unique value names within attribute
   */
  private async validateUniqueValueNames(
    attributeId: number,
    valueEn: string,
    valueAr: string,
    excludeId?: number,
  ): Promise<void> {
    this.logger.debug(
      `Validating unique value names in attribute ${attributeId}: ${valueEn} / ${valueAr}`,
    );

    const queryBuilder = this.attributeValueRepository
      .createQueryBuilder('value')
      .where('value.attributeId = :attributeId', { attributeId })
      .andWhere('value.deletedAt IS NULL')
      .andWhere(
        '(LOWER(value.valueEn) = LOWER(:valueEn) OR LOWER(value.valueAr) = LOWER(:valueAr))',
        { valueEn, valueAr },
      );

    if (excludeId) {
      queryBuilder.andWhere('value.id != :excludeId', { excludeId });
    }

    const existingValue = await queryBuilder.getOne();

    if (existingValue) {
      const conflictField =
        existingValue.valueEn.toLowerCase() === valueEn.toLowerCase()
          ? 'English value'
          : 'Arabic value';

      throw new ConflictException(
        `Value with this ${conflictField} already exists in this attribute`,
      );
    }
  }

  /**
   * Validate unique display order within attribute
   */
  private async validateUniqueValueDisplayOrder(
    attributeId: number,
    displayOrder: number,
    excludeId?: number,
  ): Promise<void> {
    const queryBuilder = this.attributeValueRepository
      .createQueryBuilder('value')
      .where('value.attributeId = :attributeId', { attributeId })
      .andWhere('value.deletedAt IS NULL')
      .andWhere('value.displayOrder = :displayOrder', { displayOrder })
      .andWhere('value.isActive = true');

    if (excludeId) {
      queryBuilder.andWhere('value.id != :excludeId', { excludeId });
    }

    const existingValue = await queryBuilder.getOne();

    if (existingValue) {
      throw new ConflictException(
        `Another value already uses display order ${displayOrder} in this attribute`,
      );
    }
  }

  /**
   * Validate type-specific rules for attribute values
   */
  private async validateValueTypeRules(
    attribute: Attribute,
    valueDto: CreateAttributeValueDto | UpdateAttributeValueDto,
  ): Promise<void> {
    switch (attribute.type) {
      case AttributeType.COLOR:
        if (!valueDto.colorHex) {
          this.logger.warn(
            `Color attribute value missing colorHex: ${valueDto.valueEn}`,
          );
        } else if (!/^#[0-9A-Fa-f]{6}$/.test(valueDto.colorHex)) {
          throw new BadRequestException(
            'Invalid hex color format. Must be #RRGGBB',
          );
        }
        break;

      case AttributeType.NUMBER:
        if (
          valueDto.metadata?.weight !== undefined &&
          typeof valueDto.metadata.weight !== 'number'
        ) {
          throw new BadRequestException(
            'Weight metadata must be a number for number attributes',
          );
        }
        if (
          valueDto.metadata?.price_modifier !== undefined &&
          typeof valueDto.metadata.price_modifier !== 'number'
        ) {
          throw new BadRequestException('Price modifier must be a number');
        }
        break;

      case AttributeType.BOOLEAN:
        const booleanValues = ['yes', 'no', 'true', 'false', 'نعم', 'لا'];
        if (!booleanValues.includes(valueDto.valueEn.toLowerCase())) {
          this.logger.warn(
            `Boolean attribute value might be invalid: ${valueDto.valueEn}`,
          );
        }
        break;

      default:
        break;
    }

    // Validate against custom validation rules if present
    if (attribute.validationRules) {
      await this.validateAgainstRules(valueDto, attribute.validationRules);
    }
  }

  /**
   * Validate value against attribute validation rules
   */
  private async validateAgainstRules(
    valueDto: CreateAttributeValueDto | UpdateAttributeValueDto,
    rules: any,
  ): Promise<void> {
    if (
      rules.minLength &&
      valueDto.valueEn &&
      valueDto.valueEn.length < rules.minLength
    ) {
      throw new BadRequestException(
        `English value must be at least ${rules.minLength} characters`,
      );
    }

    if (
      rules.maxLength &&
      valueDto.valueEn &&
      valueDto.valueEn.length > rules.maxLength
    ) {
      throw new BadRequestException(
        `English value must be no more than ${rules.maxLength} characters`,
      );
    }

    if (
      rules.pattern &&
      valueDto.valueEn &&
      !new RegExp(rules.pattern).test(valueDto.valueEn)
    ) {
      throw new BadRequestException(
        'English value does not match required pattern',
      );
    }
  }

  /**
   * Validate update business rules
   */
  private async validateValueUpdate(
    valueId: number,
    updateDto: UpdateAttributeValueDto,
    existingValue: AttributeValue,
  ): Promise<void> {
    // 1. Validate unique names if changing
    if (updateDto.valueEn || updateDto.valueAr) {
      await this.validateUniqueValueNames(
        existingValue.attributeId,
        updateDto.valueEn || existingValue.valueEn,
        updateDto.valueAr || existingValue.valueAr,
        valueId,
      );
    }

    // 2. Validate display order if changing
    if (updateDto.displayOrder !== undefined) {
      await this.validateUniqueValueDisplayOrder(
        existingValue.attributeId,
        updateDto.displayOrder,
        valueId,
      );
    }

    // 3. Validate type-specific rules if attribute is loaded
    if (existingValue.attribute) {
      await this.validateValueTypeRules(existingValue.attribute, updateDto);
    }
  }

  /**
   * Validate no duplicates within batch creation
   */
  private validateNoDuplicatesInBatch(values: CreateAttributeValueDto[]): void {
    const seenValuesEn = new Set<string>();
    const seenValuesAr = new Set<string>();
    const seenDisplayOrders = new Set<number>();

    for (const value of values) {
      // Check English duplicates
      const valueEnLower = value.valueEn.toLowerCase();
      if (seenValuesEn.has(valueEnLower)) {
        throw new BadRequestException(
          `Duplicate English value in batch: ${value.valueEn}`,
        );
      }
      seenValuesEn.add(valueEnLower);

      // Check Arabic duplicates
      const valueArLower = value.valueAr.toLowerCase();
      if (seenValuesAr.has(valueArLower)) {
        throw new BadRequestException(
          `Duplicate Arabic value in batch: ${value.valueAr}`,
        );
      }
      seenValuesAr.add(valueArLower);

      // Check display order duplicates
      if (value.displayOrder !== undefined) {
        if (seenDisplayOrders.has(value.displayOrder)) {
          throw new BadRequestException(
            `Duplicate display order in batch: ${value.displayOrder}`,
          );
        }
        seenDisplayOrders.add(value.displayOrder);
      }
    }
  }

  // ============================================================================
  // QUERY HELPER METHODS
  // ============================================================================

  /**
   * Build optimized query for fetching attribute values
   */
  private buildValuesQuery(
    attributeId: number,
    includeInactive: boolean,
  ): SelectQueryBuilder<AttributeValue> {
    const queryBuilder = this.attributeValueRepository
      .createQueryBuilder('value')
      .where('value.attributeId = :attributeId', { attributeId })
      .andWhere('value.deletedAt IS NULL');

    if (!includeInactive) {
      queryBuilder.andWhere('value.isActive = true');
    }

    queryBuilder.orderBy('value.displayOrder', 'ASC');

    return queryBuilder;
  }

  /**
   * Count active values for an attribute
   */
  private async countActiveValues(attributeId: number): Promise<number> {
    return this.attributeValueRepository.count({
      where: {
        attributeId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * Check if attribute value is used in products
   */
  private async checkValueUsage(valueId: number): Promise<boolean> {
    // TODO: Implement when product-attribute-value relationships are created
    this.logger.debug(
      `Checking if attribute value ${valueId} is used in products`,
    );
    return false; // Placeholder
  }

  // ============================================================================
  // TRANSFORMATION HELPER METHODS
  // ============================================================================

  /**
   * Transform value entity to response DTO with localization
   */
  private transformValueToResponseDto(
    value: AttributeValue,
    language: 'en' | 'ar' = 'en',
  ): AttributeValueResponseDto {
    return {
      id: value.id,
      attributeId: value.attributeId,
      valueEn: value.valueEn,
      valueAr: value.valueAr,
      value: language === 'ar' ? value.valueAr : value.valueEn,
      displayOrder: value.displayOrder,
      isActive: value.isActive,
      colorHex: value.colorHex,
      iconUrl: value.iconUrl,
      cssClass: value.cssClass,
      metadata: value.metadata,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      createdBy: value.createdBy,
      updatedBy: value.updatedBy,
      // Computed helper properties
      isColor: !!value.colorHex,
      hasIcon: !!value.iconUrl,
      priceModifier: value.metadata?.price_modifier || 0,
    };
  }
}
