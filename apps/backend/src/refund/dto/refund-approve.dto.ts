import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { RefundStatus } from '../enums/refund-status.enum';

/**
 * DTO used by admin or finance to approve or reject a refund request.
 */
export class RefundApproveDto {
  @ApiProperty({
    example: 55,
    description: 'ID of the refund transaction to approve or reject',
  })
  @IsInt()
  refund_id: number;

  @ApiProperty({
    enum: RefundStatus,
    example: RefundStatus.APPROVED,
    description: 'New status to assign to the refund',
  })
  @IsEnum(RefundStatus)
  status: RefundStatus;

  @ApiProperty({
    example: 'Refund approved after manual verification.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
