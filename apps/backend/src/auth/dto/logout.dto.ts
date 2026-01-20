/**
 * @file logout.dto.ts
 * @description Request body for logout functionality.
 * Token is optional since it can also be extracted from Authorization header.
 */
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'JWT token to blacklist (optional - can use Authorization header)',
    required: false,
  })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiProperty({
    example: 'User initiated logout',
    description: 'Reason for logout (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
