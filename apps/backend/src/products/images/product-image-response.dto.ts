// src/products/images/product-image-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ProductImageResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;
}
