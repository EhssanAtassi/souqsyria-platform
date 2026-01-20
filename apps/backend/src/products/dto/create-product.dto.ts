import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsJSON,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  nameEn: string;

  @ApiProperty()
  @IsString()
  nameAr: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({ enum: ['SYP', 'TRY', 'USD'] })
  @IsEnum(['SYP', 'TRY', 'USD'])
  currency: string;

  @ApiProperty({ enum: ['draft', 'published', 'archived'], required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsJSON()
  dimensions?: { width: number; height: number; length: number };

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty()
  @IsNumber()
  categoryId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  manufacturerId?: number;
}
