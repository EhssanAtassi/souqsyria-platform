import { ApiProperty } from '@nestjs/swagger';

export class CreateWishlistDto {
  @ApiProperty({ example: 1, description: 'Product ID to add to wishlist' })
  productId: number;

  @ApiProperty({
    example: 7,
    description: 'Product variant ID',
    required: false,
  })
  productVariantId?: number;
}
