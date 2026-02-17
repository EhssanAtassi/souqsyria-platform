/**
 * @file create-review.dto.ts
 * @description DTO for creating a new product review
 *
 * Validation Rules:
 * - Rating is required and must be 1-5
 * - Titles are optional but limited to 200 characters
 * - Body text is optional
 * - Pros and cons are optional string arrays
 *
 * @author SouqSyria Development Team
 * @since 2026-02-16
 */

import {
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Create Review DTO
 *
 * Request body for submitting a new product review.
 * Only rating is required - all text fields are optional.
 */
export class CreateReviewDto {
  /**
   * Star rating from 1 to 5
   * Required field - minimum 1, maximum 5
   */
  @ApiProperty({
    description: 'Star rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: true,
  })
  @IsNotEmpty({ message: 'Rating is required' })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  @Type(() => Number)
  rating: number;

  /**
   * Optional review title in English
   */
  @ApiProperty({
    description: 'Review title in English (optional)',
    example: 'Excellent product quality!',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'English title must be a string' })
  @MaxLength(200, { message: 'English title cannot exceed 200 characters' })
  titleEn?: string;

  /**
   * Optional review title in Arabic
   */
  @ApiProperty({
    description: 'Review title in Arabic (optional)',
    example: 'جودة منتج ممتازة!',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Arabic title must be a string' })
  @MaxLength(200, { message: 'Arabic title cannot exceed 200 characters' })
  titleAr?: string;

  /**
   * Optional review body text in English
   */
  @ApiProperty({
    description: 'Detailed review content in English (optional)',
    example:
      'I purchased this product two weeks ago and I am very satisfied. The build quality is exceptional and it works exactly as advertised.',
    maxLength: 5000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'English body must be a string' })
  @MaxLength(5000, { message: 'English body cannot exceed 5000 characters' })
  bodyEn?: string;

  /**
   * Optional review body text in Arabic
   */
  @ApiProperty({
    description: 'Detailed review content in Arabic (optional)',
    example:
      'اشتريت هذا المنتج قبل أسبوعين وأنا راضٍ جدًا. جودة البناء استثنائية ويعمل تمامًا كما هو معلن.',
    maxLength: 5000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Arabic body must be a string' })
  @MaxLength(5000, { message: 'Arabic body cannot exceed 5000 characters' })
  bodyAr?: string;

  /**
   * Optional pros list
   * Array of positive aspects about the product
   */
  @ApiProperty({
    description: 'List of product pros/advantages (optional)',
    example: ['Great quality', 'Fast shipping', 'Good value for money'],
    type: [String],
    required: false,
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Pros must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 pros allowed' })
  @IsString({ each: true, message: 'Each pro must be a string' })
  pros?: string[];

  /**
   * Optional cons list
   * Array of negative aspects about the product
   */
  @ApiProperty({
    description: 'List of product cons/disadvantages (optional)',
    example: ['Limited color options', 'No warranty included'],
    type: [String],
    required: false,
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Cons must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 cons allowed' })
  @IsString({ each: true, message: 'Each con must be a string' })
  cons?: string[];
}
