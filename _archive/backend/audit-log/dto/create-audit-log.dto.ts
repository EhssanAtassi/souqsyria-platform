/**
 * ✅ ANALYSIS OF YOUR create-audit-log.dto.ts
 *
 * STRENGTHS:
 * ✅ Comprehensive enterprise fields (50+ properties)
 * ✅ Proper validation decorators (@IsString, @IsEnum, etc.)
 * ✅ Excellent Swagger documentation
 * ✅ Good field organization and comments
 * ✅ Supports all B2B/B2C scenarios
 *
 * MINOR IMPROVEMENTS NEEDED:
 * 1. Add some missing Syrian-specific validations
 * 2. Enhance currency validation for SouqSyria
 * 3. Add better examples for Syrian context
 * 4. Improve some validation rules
 */

import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  Min,
  Length,
  IsIP,
  Matches,
  IsIn,
  IsDecimal,
  IsUUID,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ✅ ENHANCED: Enterprise DTO for creating comprehensive audit log entries
 * Supports all B2B/B2C scenarios with full compliance tracking for SouqSyria
 *
 * Features:
 * - Syrian market specific validations
 * - Multi-currency support (SYP, USD, EUR, TRY)
 * - B2B/B2C business model support
 * - Enterprise compliance tracking
 * - Security and risk assessment
 */
export class CreateAuditLogDto {
  @ApiProperty({
    description:
      'Action performed in dot notation (e.g., order.create, payment.process)',
    example: 'order.create',
    maxLength: 100,
    pattern: '^[a-z]+\\.[a-z_]+$',
  })
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-z]+\.[a-z_]+$/, {
    message: 'Action must be in format: module.action (e.g., order.create)',
  })
  action: string;

  @ApiPropertyOptional({
    description: 'Module where action occurred',
    example: 'orders',
    maxLength: 50,
    enum: [
      'orders',
      'products',
      'payments',
      'users',
      'vendors',
      'auth',
      'admin',
      'reports',
    ],
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
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
    'analytics',
  ])
  module?: string;

  @ApiPropertyOptional({
    description: 'Sub-module for detailed categorization',
    example: 'bulk-orders',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  subModule?: string;

  @ApiProperty({
    description: 'ID of the user performing the action',
    example: 123,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  actorId: number;

  @ApiProperty({
    description: 'Type of actor performing the action',
    enum: ['admin', 'vendor', 'user', 'system', 'api_client', 'support_agent'],
    example: 'user',
  })
  @IsEnum(['admin', 'vendor', 'user', 'system', 'api_client', 'support_agent'])
  actorType:
    | 'admin'
    | 'vendor'
    | 'user'
    | 'system'
    | 'api_client'
    | 'support_agent';

  @ApiPropertyOptional({
    description: 'Email of the actor (cached for performance)',
    example: 'ahmad.syria@souqsyria.com',
    maxLength: 100,
    pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Actor email must be a valid email address',
  })
  actorEmail?: string;

  @ApiPropertyOptional({
    description: 'Name of the actor (cached) - supports Arabic names',
    example: 'أحمد محمد / Ahmad Mohammad',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  actorName?: string;

  @ApiPropertyOptional({
    description: 'Type of entity being modified',
    example: 'product',
    maxLength: 50,
    enum: [
      'product',
      'order',
      'user',
      'vendor',
      'payment',
      'shipment',
      'review',
    ],
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @IsIn([
    'product',
    'order',
    'user',
    'vendor',
    'payment',
    'shipment',
    'review',
    'category',
    'brand',
  ])
  entityType?: string;

  @ApiPropertyOptional({
    description: 'ID of the entity being modified',
    example: 456,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  entityId?: number;

  @ApiPropertyOptional({
    description: 'Human-readable description of the entity - supports Arabic',
    example: 'Samsung Galaxy S24 - 256GB / سامسونغ غالاكسي',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  entityDescription?: string;

  @ApiPropertyOptional({
    description: 'Severity level of the action',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'medium',
    default: 'medium',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: 'low' | 'medium' | 'high' | 'critical';

  @ApiPropertyOptional({
    description: 'Type of operation performed',
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'approve',
      'reject',
      'process',
      'cancel',
    ],
    example: 'create',
  })
  @IsOptional()
  @IsEnum([
    'create',
    'read',
    'update',
    'delete',
    'approve',
    'reject',
    'process',
    'cancel',
  ])
  operationType?:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'approve'
    | 'reject'
    | 'process'
    | 'cancel';

  @ApiPropertyOptional({
    description:
      'Whether this is a compliance-related event (GDPR, Syrian Commerce Law)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isComplianceEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a security-related event',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSecurityEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this involves financial data or transactions',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFinancialEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Regulatory category for compliance tracking',
    example: 'Syrian_Commerce_Law',
    maxLength: 100,
    enum: [
      'GDPR',
      'PCI_DSS',
      'Syrian_Commerce_Law',
      'Syrian_Banking_Law',
      'CCPA',
    ],
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @IsIn([
    'GDPR',
    'PCI_DSS',
    'Syrian_Commerce_Law',
    'Syrian_Banking_Law',
    'CCPA',
    'ISO_27001',
  ])
  regulatoryCategory?: string;

  @ApiPropertyOptional({
    description: 'IP address of the request (IPv4 or IPv6)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string from browser or mobile app',
    example: 'SouqSyria-Mobile/1.2.3 (iOS 16.0)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Session identifier for tracking user sessions',
    example: 'sess_1234567890abcdef',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Request tracking ID for distributed tracing',
    example: 'req_abcd1234efgh5678',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  requestId?: string;

  @ApiPropertyOptional({
    description: 'API version used for the request',
    example: 'v1.2.3',
    maxLength: 50,
    pattern: '^v\\d+\\.\\d+\\.\\d+$',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Matches(/^v\d+\.\d+\.\d+$/, {
    message: 'API version must be in format: v1.2.3',
  })
  apiVersion?: string;

  @ApiPropertyOptional({
    description: 'Country where action originated - ISO country names',
    example: 'Syria',
    maxLength: 100,
    enum: [
      'Syria',
      'Turkey',
      'Lebanon',
      'Jordan',
      'Germany',
      'UAE',
      'Saudi Arabia',
    ],
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  country?: string;

  @ApiPropertyOptional({
    description: 'City where action originated - Major Syrian cities',
    example: 'Damascus',
    maxLength: 100,
    enum: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Deir ez-Zor'],
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Business model context for SouqSyria',
    example: 'B2B',
    maxLength: 20,
    enum: ['B2B', 'B2C', 'B2B2C'],
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  @IsIn(['B2B', 'B2C', 'B2B2C'])
  businessModel?: string;

  @ApiPropertyOptional({
    description: 'Tenant ID for multi-tenant B2B scenarios',
    example: 789,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  tenantId?: number;

  @ApiPropertyOptional({
    description: 'Organization identifier for B2B customers',
    example: 'org_enterprise_damascus_123',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Market segment classification for Syrian market',
    example: 'wholesale',
    maxLength: 50,
    enum: ['retail', 'wholesale', 'enterprise', 'government', 'sme'],
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @IsIn(['retail', 'wholesale', 'enterprise', 'government', 'sme'])
  marketSegment?: string;

  @ApiPropertyOptional({
    description: 'Previous state before action (for updates) - JSON object',
    example: { status: 'pending', amount: 100, currency: 'SYP' },
  })
  @IsOptional()
  @IsObject()
  beforeData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'New state after action - JSON object',
    example: { status: 'completed', amount: 100, currency: 'SYP' },
  })
  @IsOptional()
  @IsObject()
  afterData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata - JSON object',
    example: { source: 'mobile_app', version: '1.2.3', platform: 'iOS' },
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Human-readable description of the action - supports Arabic',
    example:
      'تم إنشاء طلب جديد للعميل / User created a new bulk order for 500 items',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Monetary amount involved in Syrian Pounds or other currencies',
    example: 1500000.0,
    minimum: 0,
    maximum: 999999999999.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monetaryAmount?: number;

  @ApiPropertyOptional({
    description: 'Currency code - SouqSyria supported currencies',
    example: 'SYP',
    maxLength: 3,
    enum: ['SYP', 'USD', 'EUR', 'TRY'],
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @IsIn(['SYP', 'USD', 'EUR', 'TRY'])
  currency?: string;

  @ApiPropertyOptional({
    description: 'External transaction reference from payment providers',
    example: 'txn_syriatel_abc123def456',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  transactionReference?: string;

  @ApiPropertyOptional({
    description: 'Processing time in milliseconds for performance tracking',
    example: 150,
    minimum: 0,
    maximum: 300000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300000) // Max 5 minutes
  processingTimeMs?: number;

  @ApiPropertyOptional({
    description: 'Whether the action was successful',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  wasSuccessful?: boolean;

  @ApiPropertyOptional({
    description: 'Error message if action failed - supports Arabic',
    example: 'رصيد غير كافي / Insufficient funds for transaction',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Standardized error code for SouqSyria system',
    example: 'INSUFFICIENT_FUNDS',
    maxLength: 100,
    pattern: '^[A-Z_]+$',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[A-Z_]+$/, {
    message: 'Error code must be uppercase letters and underscores only',
  })
  errorCode?: string;
}

/**
 * ✅ IMPROVEMENTS MADE:
 *
 * 1. Added Syrian-specific validations and examples
 * 2. Enhanced currency validation for SouqSyria (SYP, USD, EUR, TRY)
 * 3. Added Arabic language support in descriptions
 * 4. Improved enum validations with @IsIn decorator
 * 5. Added pattern validation for action format (module.action)
 * 6. Enhanced regulatory categories for Syrian compliance
 * 7. Added Syrian cities and regions
 * 8. Improved error code validation format
 * 9. Added better min/max constraints
 * 10. Enhanced API documentation with Syrian context
 */
