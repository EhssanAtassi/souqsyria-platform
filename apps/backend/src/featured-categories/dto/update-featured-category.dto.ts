/**
 * @file update-featured-category.dto.ts
 * @description DTO for updating an existing featured category
 *
 * VALIDATION RULES:
 * - All fields are optional (partial update)
 * - Same validation rules as create DTO
 * - Inherits from PartialType of CreateFeaturedCategoryDto
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { PartialType } from '@nestjs/swagger';
import { CreateFeaturedCategoryDto } from './create-featured-category.dto';

/**
 * DTO for updating a featured category
 *
 * Extends CreateFeaturedCategoryDto with all fields optional
 * for partial updates.
 */
export class UpdateFeaturedCategoryDto extends PartialType(CreateFeaturedCategoryDto) {}
