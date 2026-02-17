/**
 * @file register.dto.ts
 * @description Request body validation for user registration.
 * Collects email, password, and optional full name.
 */
import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPass1',
    description: 'User password (min 8 chars, 1 uppercase, 1 number)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  password: string;

  @ApiProperty({
    example: 'Ahmad Al-Hassan',
    description: 'User full name (required per SS-AUTH-001)',
  })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a valid string' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName: string;
}
