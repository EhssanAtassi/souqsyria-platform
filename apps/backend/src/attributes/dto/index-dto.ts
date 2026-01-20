/**
 * @file dto/index-dto.ts
 * @description Barrel export file for all attribute DTOs
 *
 * This file provides a single import point for all DTOs,
 * making imports cleaner and more maintainable.
 *
 * Imports from individual DTO files based on your project structure.
 */
import { CreateAttributeDto } from './create-attribute.dto';
import { UpdateAttributeDto } from './update-attribute.dto';
import { CreateAttributeValueDto } from './create-attribute-value.dto';
import { UpdateAttributeValueDto } from './update-attribute-value.dto';
import { AttributeQueryDto } from './attribute-query.dto';
import { AttributeResponseDto } from './attribute-response.dto';
import { AttributeValueResponseDto } from './attribute-value-response.dto';
import { PaginatedAttributesResponseDto } from './paginated-attributes-response.dto';

// // Create DTOs
export { CreateAttributeDto } from './create-attribute.dto';
export { CreateAttributeValueDto } from './create-attribute-value.dto';

// Update DTOs
export { UpdateAttributeDto } from './update-attribute.dto';
export { UpdateAttributeValueDto } from './update-attribute-value.dto';

// Query DTOs
export { AttributeQueryDto } from './attribute-query.dto';

// Response DTOs
export { AttributeResponseDto } from './attribute-response.dto';
export { AttributeValueResponseDto } from './attribute-value-response.dto';
export { PaginatedAttributesResponseDto } from './paginated-attributes-response.dto';

// Type definitions for convenience
export type AttributeCreateInput = CreateAttributeDto;
export type AttributeUpdateInput = UpdateAttributeDto;
export type AttributeValueCreateInput = CreateAttributeValueDto;
export type AttributeValueUpdateInput = UpdateAttributeValueDto;
export type AttributeQuery = AttributeQueryDto;
export type AttributeResponse = AttributeResponseDto;
export type AttributeValueResponse = AttributeValueResponseDto;
export type PaginatedAttributesResponse = PaginatedAttributesResponseDto;
