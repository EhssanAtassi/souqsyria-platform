/**
 * @file refresh-token.dto.ts
 * @description Request body validation for refreshing JWT tokens.
 * Users provide their current token to get a new one without re-login.
 */
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token used to obtain a new access token',
  })
  @IsString({ message: 'Token must be a valid string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}
