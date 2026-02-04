/**
 * @file update-quick-access.dto.ts
 * @description DTO for updating promotional cards in Quick Access
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { PartialType } from '@nestjs/swagger';
import { CreateQuickAccessDto } from './create-quick-access.dto';

/**
 * UpdateQuickAccessDto
 *
 * @description Data Transfer Object for updating an existing promotional card.
 * All fields are optional - only provided fields will be updated.
 *
 * @swagger
 * components:
 *   schemas:
 *     UpdateQuickAccessDto:
 *       type: object
 *       properties:
 *         categoryEn:
 *           type: string
 *           description: Category label in English
 *         categoryAr:
 *           type: string
 *           description: Category label in Arabic
 *         titleEn:
 *           type: string
 *           description: Main promotional title in English
 *         titleAr:
 *           type: string
 *           description: Main promotional title in Arabic
 *         subtitleEn:
 *           type: string
 *           description: Secondary subtitle in English
 *         subtitleAr:
 *           type: string
 *           description: Secondary subtitle in Arabic
 *         badgeClass:
 *           type: string
 *           enum: [badge-gold, badge-blue, badge-green, badge-purple, badge-orange, badge-red, badge-teal, badge-pink]
 *         image:
 *           type: string
 *           format: url
 *         url:
 *           type: string
 *         displayOrder:
 *           type: integer
 *         isActive:
 *           type: boolean
 */
export class UpdateQuickAccessDto extends PartialType(CreateQuickAccessDto) {}