import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, IsOptional } from 'class-validator';

export class RequestReturnDto {
  @ApiProperty({ example: 1001 })
  @IsInt()
  order_id: number;

  @ApiProperty({ type: [Number], example: [201, 202] })
  @IsArray()
  @IsInt({ each: true })
  item_ids: number[];

  @ApiProperty({ example: 'Item arrived damaged' })
  @IsString()
  reason: string;

  @ApiProperty({
    type: [String],
    required: false,
    example: ['https://cdn.souqsy.com/evidence/1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence_images?: string[];
}
