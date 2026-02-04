import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Admin login request DTO
 * @description Credentials for admin authentication
 */
export class AdminLoginDto {
  /**
   * Admin email address
   * @example admin@souqsyria.com
   */
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@souqsyria.com',
    type: 'string',
    format: 'email'
  })
  @IsEmail()
  email: string;

  /**
   * Admin password (minimum 6 characters)
   * @example Admin@123456
   */
  @ApiProperty({
    description: 'Admin password (minimum 6 characters)',
    example: 'Admin@123456',
    type: 'string',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;
}
