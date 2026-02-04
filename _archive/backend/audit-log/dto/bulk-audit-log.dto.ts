// Add to your existing imports:
import {
  IsArray,
  IsOptional,
  IsString,
  IsBoolean,
  Length,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
  Matches,
  IsIn,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAuditLogDto } from './create-audit-log.dto';
// Add these imports for class validation:
import {
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

// Add this custom validator above your class:
@ValidatorConstraint({ name: 'bulkOperationValidator', async: false })
export class BulkOperationValidator implements ValidatorConstraintInterface {
  validate(logs: CreateAuditLogDto[], args: ValidationArguments) {
    if (!logs || logs.length === 0) return false;

    // Check if batch has mixed business models (could be problematic)
    const businessModels = logs
      .map((log) => log.businessModel)
      .filter((model) => model !== undefined);

    const uniqueModels = new Set(businessModels);
    if (uniqueModels.size > 2) {
      return false; // Too many different business models in one batch
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Bulk operation contains too many different business models. Consider splitting into separate batches.';
  }
}
/**
 * DTO for bulk audit log operations (enterprise feature)
 * Supports creating up to 10,000 audit log entries in a single operation
 */
export class BulkAuditLogDto {
  // Update your logs field:
  @ApiProperty({
    description: 'Array of audit log entries to create (max 10,000 entries)',
    type: [CreateAuditLogDto],
    example: [
      {
        action: 'order.create',
        module: 'orders',
        actorId: 123,
        actorType: 'user',
        entityType: 'order',
        entityId: 456,
        monetaryAmount: 1500.0,
        currency: 'SYP',
      },
      {
        action: 'payment.process',
        module: 'payments',
        actorId: 123,
        actorType: 'user',
        entityType: 'payment',
        entityId: 789,
        monetaryAmount: 1500.0,
        currency: 'SYP',
        isFinancialEvent: true,
      },
    ],
    minItems: 1,
    maxItems: 10000,
  })
  @IsArray()
  @Validate(BulkOperationValidator)
  @ArrayMinSize(1, { message: 'At least 1 audit log entry is required' })
  @ArrayMaxSize(10000, {
    message: 'Maximum 10,000 audit log entries allowed per batch',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAuditLogDto)
  logs: CreateAuditLogDto[];

  // Update your batchId field:
  @ApiPropertyOptional({
    description:
      'Batch identifier for tracking bulk operations (format: batch_YYYYMMDD_XXX)',
    example: 'batch_20240604_001',
    maxLength: 100,
    pattern: '^batch_\\d{8}_\\d{3}$',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^batch_\d{8}_\d{3}$/, {
    message:
      'Batch ID must be in format: batch_YYYYMMDD_XXX (e.g., batch_20240604_001)',
  })
  batchId?: string;
  @ApiPropertyOptional({
    description: 'Processing priority for the bulk operation',
    example: 'normal',
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  })
  @IsOptional()
  @IsString()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string;
  @ApiPropertyOptional({
    description: 'Source of the bulk operation for tracking',
    example: 'data_migration',
    enum: ['api', 'data_migration', 'batch_job', 'admin_import', 'system_sync'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['api', 'data_migration', 'batch_job', 'admin_import', 'system_sync'])
  source?: string;
  @ApiPropertyOptional({
    description: 'Whether to fail entire batch on single error',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  failOnError?: boolean;
  @ApiPropertyOptional({
    description: 'Maximum number of retries for failed entries',
    example: 3,
    minimum: 0,
    maximum: 5,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  maxRetries?: number;
  @ApiPropertyOptional({
    description: 'Email to notify when bulk operation completes',
    example: 'admin@souqsyria.com',
    pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Must be a valid email address',
  })
  notificationEmail?: string;
}
