import { ApiProperty } from '@nestjs/swagger';

export class CouponAnalyticsDto {
  @ApiProperty({ description: 'Coupon ID' })
  coupon_id: number;

  @ApiProperty({ description: 'Total number of uses' })
  total_uses: number;

  @ApiProperty({ description: 'Total discount amount provided in SYP' })
  total_discount_amount: number;

  @ApiProperty({ description: 'Total order value affected in SYP' })
  total_order_value: number;

  @ApiProperty({ description: 'Average discount per use in SYP' })
  average_discount_per_use: number;

  @ApiProperty({ description: 'Conversion rate percentage' })
  conversion_rate: number;

  @ApiProperty({ description: 'Number of unique users who used the coupon' })
  unique_users: number;

  @ApiProperty({ description: 'Most popular usage time (hour of day)' })
  popular_usage_hour: number;

  @ApiProperty({
    description: 'Usage by Syrian governorate',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  usage_by_governorate: Record<string, number>;
}
