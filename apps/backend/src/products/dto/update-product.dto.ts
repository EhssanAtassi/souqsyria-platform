import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductAttributeDto {
  @ApiProperty()
  @IsInt()
  attribute_id: number;

  @ApiProperty()
  @IsInt()
  value_id: number;
}

export class ProductImageDto {
  @ApiProperty()
  @IsString()
  image_url: string;

  @ApiProperty()
  @IsInt()
  order: number;
}
// ✅ Matches structure of CreateProductDescriptionDto
export class InlineProductDescriptionInput {
  @ApiProperty({ enum: ['en', 'ar'] })
  @IsEnum(['en', 'ar'])
  language: 'en' | 'ar';

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  metaDescription?: string;
}

export class UpdateProductDto {
  @ApiProperty() @IsOptional() @IsString() name?: string;
  @ApiProperty() @IsOptional() @IsNumber() price?: number;
  @ApiProperty() @IsOptional() @IsInt() stock?: number;
  @ApiProperty() @IsOptional() @IsInt() categoryId?: number;
  @ApiProperty() @IsOptional() @IsInt() manufacturerId?: number;

  @ApiProperty({ type: [ProductAttributeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @ApiProperty({ type: [InlineProductDescriptionInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InlineProductDescriptionInput)
  descriptions?: InlineProductDescriptionInput[];

  @ApiProperty({ type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
