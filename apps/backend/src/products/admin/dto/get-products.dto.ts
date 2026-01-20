import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumberString,
  IsBooleanString,
  IsString,
} from 'class-validator';

export class GetProductsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  isPublished?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
