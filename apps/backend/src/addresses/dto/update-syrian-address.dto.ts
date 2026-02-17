/**
 * @file update-syrian-address.dto.ts
 * @description DTO for updating Syrian addresses
 *
 * PURPOSE:
 * Provides partial update capability for Syrian addresses.
 * All fields from CreateSyrianAddressDto are optional for updates.
 *
 * FEATURES:
 * - Inherits all validation from CreateSyrianAddressDto
 * - All fields are optional (partial update pattern)
 * - Maintains same validation rules when fields are provided
 *
 * USAGE:
 * Use for PATCH /addresses/:id endpoint
 * Only provided fields will be updated
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 Syrian Address Support
 */

import { PartialType } from '@nestjs/swagger';
import { CreateSyrianAddressDto } from './create-syrian-address.dto';

/**
 * Update Syrian Address DTO
 * Makes all fields from CreateSyrianAddressDto optional
 * Used for PATCH /addresses/:id
 */
export class UpdateSyrianAddressDto extends PartialType(
  CreateSyrianAddressDto,
) {}
