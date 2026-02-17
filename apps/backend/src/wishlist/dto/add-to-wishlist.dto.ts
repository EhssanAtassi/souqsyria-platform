import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @description DTO for adding product to wishlist
 *
 * @swagger
 * components:
 *   schemas:
 *     AddToWishlistDto:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: number
 *           description: Product ID to add to wishlist
 *           example: 42
 */
export class AddToWishlistDto {
  /**
   * @description Product ID to add to wishlist
   */
  @ApiProperty({
    description: 'Product ID to add to wishlist',
    example: 42,
  })
  @IsNumber({}, { message: 'Product ID must be a number' })
  productId: number;
}
