import { ApiProperty } from '@nestjs/swagger';
import { RefundStatus } from '../enums/refund-status.enum';

/**
 * Returned to client to display refund status details.
 * Can be used in buyer portal or admin tracking.
 */
export class RefundStatusResponseDto {
  @ApiProperty({ example: 44, description: 'ID of the refund transaction' })
  refund_id: number;

  @ApiProperty({
    enum: RefundStatus,
    example: RefundStatus.PROCESSED,
    description: 'Current status of the refund',
  })
  status: RefundStatus;

  @ApiProperty({
    example: '2024-06-15T12:34:56Z',
    required: false,
    description: 'Date/time when refund was finalized',
  })
  refunded_at?: Date;
}
