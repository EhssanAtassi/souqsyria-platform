/**
 * @file create-brand.dto.ts
 * @description Enhanced DTO for creating brands with Syrian market support
 */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  Length,
  IsUrl,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({
    example: 'Samsung',
    description: 'Brand name in English',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'سامسونغ',
    description: 'Brand name in Arabic',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  nameAr?: string;

  @ApiProperty({
    example: 'samsung',
    description: 'SEO-friendly URL slug',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  slug: string;

  @ApiProperty({
    example: 'Leading technology company known for smartphones and electronics',
    description: 'Brand description in English',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descriptionEn?: string;

  @ApiProperty({
    example: 'شركة تقنية رائدة معروفة بالهواتف الذكية والإلكترونيات',
    description: 'Brand description in Arabic',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descriptionAr?: string;

  @ApiProperty({
    example: 'https://cdn.souqsyria.com/brands/samsung-logo.png',
    description: 'Brand logo URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({
    example: 'South Korea',
    description: 'Country where brand originates',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  countryOfOrigin?: string;

  @ApiProperty({
    example: 'TM123456789',
    description: 'Trademark registration number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  trademarkNumber?: string;

  @ApiProperty({
    example: 'official',
    description: 'Type of brand verification',
    enum: ['official', 'authorized', 'unverified'],
    default: 'unverified',
  })
  @IsOptional()
  @IsEnum(['official', 'authorized', 'unverified'])
  verificationType?: 'official' | 'authorized' | 'unverified';
}
