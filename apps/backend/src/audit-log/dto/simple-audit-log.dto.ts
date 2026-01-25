import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Add to your existing imports:
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsIn,
} from 'class-validator';
/**
 * Simplified DTO for basic audit logging (90% of use cases)
 * Use this for most common audit log scenarios in SouqSyria
 */
export class SimpleAuditLogDto {
  @ApiProperty({
    description: 'Action performed (e.g., order.create, payment.process)',
    example: 'order.create',
  })
  @IsString()
  action: string;

  @ApiProperty({
    description: 'Module name where action occurred',
    example: 'orders',
  })
  @IsString()
  module: string;

  @ApiPropertyOptional({
    description: 'ID of the user performing the action (null for anonymous users)',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  actorId?: number;

  // Replace your current actorType with this enhanced version:
  @ApiProperty({
    description: 'Type of actor performing the action',
    enum: ['admin', 'vendor', 'user', 'system', 'api_client', 'support_agent', 'anonymous'],
    example: 'user',
  })
  @IsEnum(['admin', 'vendor', 'user', 'system', 'api_client', 'support_agent', 'anonymous'])
  actorType:
    | 'admin'
    | 'vendor'
    | 'user'
    | 'system'
    | 'api_client'
    | 'support_agent'
    | 'anonymous';
  @ApiPropertyOptional({
    description: 'Type of entity being modified',
    example: 'order',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'ID of the entity being modified',
    example: 456,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  entityId?: number;

  @ApiPropertyOptional({
    description: 'Monetary amount involved in the action',
    example: 1500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monetaryAmount?: number;

  @ApiPropertyOptional({
    description: 'Currency code for monetary transactions',
    example: 'SYP',
  })
  @IsOptional()
  @IsString()
  @IsIn(['SYP', 'USD', 'EUR', 'TRY'])
  currency?: string;

  @ApiPropertyOptional({
    description: 'Human-readable description of the action',
    example: 'User created new order for electronics',
  })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiPropertyOptional({
    description: 'Business model context for better categorization',
    example: 'B2C',
    enum: ['B2B', 'B2C', 'B2B2C'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['B2B', 'B2C', 'B2B2C'])
  businessModel?: string;
}
