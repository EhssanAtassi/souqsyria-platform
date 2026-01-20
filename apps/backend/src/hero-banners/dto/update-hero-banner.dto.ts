/**
 * @file update-hero-banner.dto.ts
 * @description DTO for updating existing hero banners
 *
 * All fields are optional for partial updates
 *
 * @swagger
 * components:
 *   schemas:
 *     UpdateHeroBannerDto:
 *       type: object
 *       description: Partial update DTO (all fields optional)
 *
 * @author SouqSyria Development Team
 * @since 2025-10-07
 */

import { PartialType } from '@nestjs/swagger';
import { CreateHeroBannerDto } from './create-hero-banner.dto';

/**
 * Update Hero Banner DTO
 *
 * Extends CreateHeroBannerDto with all fields made optional
 * Supports partial updates of hero banners
 */
export class UpdateHeroBannerDto extends PartialType(CreateHeroBannerDto) {}
