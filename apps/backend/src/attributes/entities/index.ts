/**
 * @file entities/index.ts
 * @description Barrel export file for all attribute entities
 *
 * This file provides a single import point for all entities,
 * making imports cleaner and more maintainable.
 *
 * Usage:
 * import { Attribute, AttributeValue, AttributeType } from './entities';
 */

// Entity exports

// Enum exports
import { Attribute } from './attribute.entity';
import { AttributeValue } from './attribute-value.entity';

export { AttributeType } from './attribute-types.enum';

// Type definitions for convenience
export type AttributeEntity = Attribute;
export type AttributeValueEntity = AttributeValue;
