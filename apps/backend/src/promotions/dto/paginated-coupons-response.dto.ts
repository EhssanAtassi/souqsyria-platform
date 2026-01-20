import { ApiProperty } from '@nestjs/swagger';
import { CouponResponseDto } from './coupon-response.dto';

export class PaginatedCouponsResponseDto {
  @ApiProperty({ type: [CouponResponseDto], description: 'Array of coupons' })
  data: CouponResponseDto[];

  @ApiProperty({ description: 'Total number of coupons' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  total_pages: number;
}
