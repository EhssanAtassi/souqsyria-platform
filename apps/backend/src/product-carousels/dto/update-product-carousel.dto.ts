/**
 * @file update-product-carousel.dto.ts
 * @description DTO for updating an existing product carousel
 *
 * FEATURES:
 * - All fields are optional (partial update support)
 * - Inherits validation rules from CreateProductCarouselDto
 * - Supports selective field updates
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { PartialType } from '@nestjs/swagger';
import { CreateProductCarouselDto } from './create-product-carousel.dto';

/**
 * Update Product Carousel DTO
 *
 * Extends CreateProductCarouselDto with all fields optional.
 * Allows partial updates - only specified fields will be changed.
 *
 * Example:
 * ```json
 * {
 *   "isActive": false,
 *   "displayOrder": 5
 * }
 * ```
 */
export class UpdateProductCarouselDto extends PartialType(CreateProductCarouselDto) {}
