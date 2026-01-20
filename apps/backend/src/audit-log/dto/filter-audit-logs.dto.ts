import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  Length,
  IsIP,
  Matches,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for filtering audit logs with enterprise-grade search capabilities
 * Supports 20+ filter criteria for advanced audit log searching
 */
export class FilterAuditLogsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 50,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  // Update your action field:
  @ApiPropertyOptional({
    description: 'Filter by specific action (module.operation format)',
    example: 'order.create',
    pattern: '^[a-z]+\\.[a-z_]+$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]+\.[a-z_]+$/, {
    message: 'Action must be in format: module.action (e.g., order.create)',
  })
  action?: string;

  // Update your module field:
  @ApiPropertyOptional({
    description: 'Filter by module',
    example: 'orders',
    enum: [
      'orders',
      'products',
      'payments',
      'users',
      'vendors',
      'auth',
      'admin',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'orders',
    'products',
    'payments',
    'users',
    'vendors',
    'auth',
    'admin',
    'reports',
    'dashboard',
  ])
  module?: string;

  @ApiPropertyOptional({
    description: 'Filter by actor ID',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actorId?: number;

  // Update your actorType field:
  @ApiPropertyOptional({
    description: 'Filter by actor type',
    enum: ['admin', 'vendor', 'user', 'system', 'api_client', 'support_agent'],
    example: 'user',
  })
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'vendor', 'user', 'system', 'api_client', 'support_agent'])
  actorType?: string;

  // Update your entityType field:
  @ApiPropertyOptional({
    description: 'Filter by entity type',
    example: 'product',
    enum: ['product', 'order', 'user', 'vendor', 'payment', 'shipment'],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'product',
    'order',
    'user',
    'vendor',
    'payment',
    'shipment',
    'review',
    'category',
  ])
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
    example: 456,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  entityId?: number;

  @ApiPropertyOptional({
    description: 'Filter by severity level',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'high',
  })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({
    description: 'Filter compliance events only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isComplianceEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Filter security events only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSecurityEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Filter financial events only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFinancialEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by business model',
    example: 'B2B',
  })
  @IsOptional()
  @IsString()
  businessModel?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenant ID for multi-tenant scenarios',
    example: 789,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tenantId?: number;
  @ApiPropertyOptional({
    description: 'Filter by organization ID for B2B customers',
    example: 'org_enterprise_damascus_123',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  organizationId?: string;
  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO string)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by IP address',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;
  @ApiPropertyOptional({
    description: 'Filter by country',
    example: 'Syria',
    enum: ['Syria', 'Turkey', 'Lebanon', 'Jordan', 'Germany', 'UAE'],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'Syria',
    'Turkey',
    'Lebanon',
    'Jordan',
    'Germany',
    'UAE',
    'Saudi Arabia',
  ])
  country?: string;
  @ApiPropertyOptional({
    description: 'Search in description field',
    example: 'bulk order',
  })
  @IsOptional()
  @IsString()
  searchText?: string;

  @ApiPropertyOptional({
    description: 'Minimum monetary amount filter',
    example: 100.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum monetary amount filter',
    example: 10000.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  // Update your currency field:
  @ApiPropertyOptional({
    description: 'Filter by currency code (SouqSyria supported)',
    example: 'SYP',
    enum: ['SYP', 'USD', 'EUR', 'TRY'],
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @IsIn(['SYP', 'USD', 'EUR', 'TRY'])
  currency?: string;
  @ApiPropertyOptional({
    description: 'Filter by error code',
    example: 'INSUFFICIENT_FUNDS',
    pattern: '^[A-Z_]+$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z_]+$/, {
    message: 'Error code must be uppercase letters and underscores',
  })
  errorCode?: string;
  // Update your sortBy field:
  @ApiPropertyOptional({
    description: 'Sort field for ordering results',
    example: 'createdAt',
    enum: [
      'createdAt',
      'severity',
      'monetaryAmount',
      'riskScore',
      'actorId',
      'action',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'createdAt',
    'severity',
    'monetaryAmount',
    'riskScore',
    'actorId',
    'action',
  ])
  sortBy?: string = 'createdAt';
  @ApiPropertyOptional({
    description: 'Sort direction for ordering results',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
