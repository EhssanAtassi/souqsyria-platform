/**
 * @file attributes-service.interface.ts
 * @description Interface definition for AttributesService
 *
 * Why needed: Defines the contract for the attributes service,
 * enabling easier testing, dependency injection, and future
 * implementations (e.g., cached service, readonly service).
 *
 * This interface ensures consistency and enables better
 * architecture patterns like dependency inversion.
 */

import {
  CreateAttributeDto,
  UpdateAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
  AttributeQueryDto,
  AttributeResponseDto,
  AttributeValueResponseDto,
  PaginatedAttributesResponseDto,
} from '../dto/index-dto';

export interface IAttributesService {
  // ============================================================================
  // ATTRIBUTE OPERATIONS
  // ============================================================================

  /**
   * Create a new product attribute
   * @param createAttributeDto - Attribute data
   * @param adminUserId - Admin creating the attribute
   * @returns Created attribute with ID
   */
  createAttribute(
    createAttributeDto: CreateAttributeDto,
    adminUserId?: number,
  ): Promise<AttributeResponseDto>;

  /**
   * Get all attributes with filtering and pagination
   * @param query - Filter and pagination parameters
   * @returns Paginated list of attributes
   */
  findAllAttributes(
    query: AttributeQueryDto,
  ): Promise<PaginatedAttributesResponseDto>;

  /**
   * Get single attribute by ID
   * @param id - Attribute ID
   * @param language - Response language
   * @param includeValues - Include attribute values
   * @returns Single attribute data
   */
  findAttributeById(
    id: number,
    language?: 'en' | 'ar',
    includeValues?: boolean,
  ): Promise<AttributeResponseDto>;

  /**
   * Update existing attribute
   * @param id - Attribute ID
   * @param updateAttributeDto - Update data
   * @param adminUserId - Admin performing update
   * @returns Updated attribute data
   */
  updateAttribute(
    id: number,
    updateAttributeDto: UpdateAttributeDto,
    adminUserId?: number,
  ): Promise<AttributeResponseDto>;

  /**
   * Soft delete attribute
   * @param id - Attribute ID
   * @param adminUserId - Admin performing deletion
   * @returns Success confirmation
   */
  deleteAttribute(
    id: number,
    adminUserId?: number,
  ): Promise<{ success: boolean; message: string }>;

  // ============================================================================
  // ATTRIBUTE VALUE OPERATIONS
  // ============================================================================

  /**
   * Create new attribute value
   * @param attributeId - Parent attribute ID
   * @param createValueDto - Value data
   * @param adminUserId - Admin creating the value
   * @returns Created attribute value
   */
  createAttributeValue(
    attributeId: number,
    createValueDto: CreateAttributeValueDto,
    adminUserId?: number,
  ): Promise<AttributeValueResponseDto>;

  /**
   * Get values for specific attribute
   * @param attributeId - Parent attribute ID
   * @param language - Response language
   * @param includeInactive - Include inactive values
   * @returns List of attribute values
   */
  findAttributeValues(
    attributeId: number,
    language?: 'en' | 'ar',
    includeInactive?: boolean,
  ): Promise<AttributeValueResponseDto[]>;

  /**
   * Update existing attribute value
   * @param valueId - Value ID
   * @param updateValueDto - Update data
   * @param adminUserId - Admin performing update
   * @returns Updated value data
   */
  updateAttributeValue(
    valueId: number,
    updateValueDto: UpdateAttributeValueDto,
    adminUserId?: number,
  ): Promise<AttributeValueResponseDto>;

  /**
   * Soft delete attribute value
   * @param valueId - Value ID
   * @param adminUserId - Admin performing deletion
   * @returns Success confirmation
   */
  deleteAttributeValue(
    valueId: number,
    adminUserId?: number,
  ): Promise<{ success: boolean; message: string }>;

  /**
   * Bulk create multiple attribute values
   * @param attributeId - Parent attribute ID
   * @param values - Array of value data
   * @param adminUserId - Admin performing bulk creation
   * @returns Array of created values
   */
  bulkCreateAttributeValues(
    attributeId: number,
    values: CreateAttributeValueDto[],
    adminUserId?: number,
  ): Promise<AttributeValueResponseDto[]>;

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Get attributes suitable for product filtering
   * @param language - Response language
   * @returns Filterable attributes with values
   */
  getFilterableAttributes(
    language?: 'en' | 'ar',
  ): Promise<AttributeResponseDto[]>;

  /**
   * Get attributes required for product creation
   * @param language - Response language
   * @returns Required attributes with validation rules
   */
  getRequiredAttributes(
    language?: 'en' | 'ar',
  ): Promise<AttributeResponseDto[]>;

  /**
   * Search attributes by name or description
   * @param searchTerm - Search query
   * @param language - Response language
   * @param limit - Maximum results
   * @returns Matching attributes
   */
  searchAttributes(
    searchTerm: string,
    language?: 'en' | 'ar',
    limit?: number,
  ): Promise<AttributeResponseDto[]>;

  /**
   * Get attribute statistics for admin dashboard
   * @returns Attribute usage statistics
   */
  getAttributeStatistics(): Promise<{
    totalAttributes: number;
    activeAttributes: number;
    attributesByType: Record<string, number>;
    totalValues: number;
    averageValuesPerAttribute: number;
  }>;
}
