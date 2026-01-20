/**
 * @file update-coupon.dto.ts
 * @description Data Transfer Object for updating existing coupons
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  // All fields from CreateCouponDto are now optional for updates
}
