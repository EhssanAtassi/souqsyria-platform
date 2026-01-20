import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectCategoryDto {
  @ApiProperty({
    description: 'Reason for rejecting the category',
    example: 'Category name does not comply with Syrian market guidelines',
    maxLength: 1000,
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  @MaxLength(1000, {
    message: 'Rejection reason cannot exceed 1000 characters',
  })
  rejectionReason: string;
}
