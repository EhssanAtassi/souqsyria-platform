import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDecimal,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ example: { Color: 'Red', Size: 'L' } })
  @IsObject()
  variantData: Record<string, string>;

  @ApiProperty()
  @IsDecimal()
  price: number;
  @ApiProperty({
    example: 'RED-XL-001',
    description: 'Must be unique across all variants',
  })
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  volume?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
  @ApiProperty({
    example: 'tshirt-red-xl',
    description: 'SEO-friendly unique slug',
  })
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
  @IsOptional()
  @IsInt()
  @ApiProperty({
    required: false,
    description: 'Warehouse ID to initialize stock in',
  })
  warehouseId?: number;
}
