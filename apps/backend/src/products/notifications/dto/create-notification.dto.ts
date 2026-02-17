import { IsEmail, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @description DTO for creating stock notification subscription
 *
 * @swagger
 * components:
 *   schemas:
 *     CreateNotificationDto:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address to receive notification
 *           example: user@example.com
 *         variantId:
 *           type: number
 *           description: Optional variant ID for variant-specific notification
 *           example: 123
 */
export class CreateNotificationDto {
  /**
   * @description Email address for notification delivery
   * Must be a valid email format
   */
  @ApiProperty({
    description:
      'Email address to receive notification when product is back in stock',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * @description Optional variant ID for variant-specific notifications
   * If provided, notification will only trigger when this specific variant is in stock
   */
  @ApiProperty({
    description: 'Optional variant ID for variant-specific notification',
    example: 123,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Variant ID must be a number' })
  variantId?: number;
}
