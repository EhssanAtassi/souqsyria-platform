/**
 * @file audit.decorators.ts
 * @description Custom decorators for controlling audit logging behavior
 *
 * Features:
 * - Skip logging for specific endpoints
 * - Override default action names
 * - Mark endpoints as high-priority for logging
 * - Control audit detail level
 *
 * @author Ehssan Atassi Engineering Team
 */

import { SetMetadata } from '@nestjs/common';

// ================================
// DECORATOR KEYS (for reflection)
// ================================
export const SKIP_AUDIT_KEY = 'skipAudit';
export const AUDIT_ACTION_KEY = 'auditAction';
export const AUDIT_PRIORITY_KEY = 'auditPriority';
export const AUDIT_DETAIL_LEVEL_KEY = 'auditDetailLevel';

// ================================
// MAIN DECORATORS
// ================================

/**
 * ✅ SKIP AUDIT: Skip automatic logging for this endpoint
 *
 * Usage:
 * @SkipAudit()
 * @Get('/health')
 * healthCheck() { return 'OK'; }
 */
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);

/**
 * ✅ CUSTOM ACTION NAME: Override the auto-generated action name
 *
 * Usage:
 * @AuditAction('vendor.approve_kyc')
 * @Post('/vendors/:id/approve')
 * approveVendor() { ... }
 */
export const AuditAction = (action: string) =>
  SetMetadata(AUDIT_ACTION_KEY, action);

/**
 * ✅ AUDIT PRIORITY: Mark endpoint as high-priority for logging
 * High priority = log immediately (sync), not async
 *
 * Usage:
 * @AuditPriority('high')
 * @Post('/payments/process')
 * processPayment() { ... }
 */
export const AuditPriority = (
  priority: 'low' | 'medium' | 'high' | 'critical',
) => SetMetadata(AUDIT_PRIORITY_KEY, priority);

/**
 * ✅ AUDIT DETAIL LEVEL: Control how much detail to log
 *
 * - 'simple' = Basic info only (fast)
 * - 'detailed' = Full audit log with all fields
 * - 'minimal' = Just action + user + timestamp
 *
 * Usage:
 * @AuditDetailLevel('detailed')
 * @Post('/orders')
 * createOrder() { ... }
 */
export const AuditDetailLevel = (level: 'minimal' | 'simple' | 'detailed') =>
  SetMetadata(AUDIT_DETAIL_LEVEL_KEY, level);

// ================================
// COMBINED DECORATORS FOR COMMON SCENARIOS
// ================================

/**
 * ✅ FINANCIAL TRANSACTION: Auto-configure for financial endpoints
 * Sets high priority + detailed logging
 */
export const FinancialAudit =
  () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    AuditPriority('high')(target, propertyKey, descriptor);
    AuditDetailLevel('detailed')(target, propertyKey, descriptor);
  };

/**
 * ✅ SECURITY AUDIT: Auto-configure for security-sensitive endpoints
 * Sets critical priority + detailed logging
 */
export const SecurityAudit =
  () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    AuditPriority('critical')(target, propertyKey, descriptor);
    AuditDetailLevel('detailed')(target, propertyKey, descriptor);
  };

/**
 * ✅ ADMIN AUDIT: Auto-configure for admin operations
 * Sets high priority + detailed logging + custom action prefix
 */
export const AdminAudit =
  (action?: string) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (action) {
      AuditAction(`admin.${action}`)(target, propertyKey, descriptor);
    }
    AuditPriority('high')(target, propertyKey, descriptor);
    AuditDetailLevel('detailed')(target, propertyKey, descriptor);
  };

// ================================
// HELPER DECORATORS
// ================================

/**
 * ✅ PUBLIC ENDPOINT: Skip audit for public/health endpoints
 */
export const PublicEndpoint = () => SkipAudit();

/**
 * ✅ BULK OPERATION: Special handling for bulk operations
 */
export const BulkOperation =
  () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    AuditAction(`bulk.${propertyKey}`)(target, propertyKey, descriptor);
    AuditDetailLevel('simple')(target, propertyKey, descriptor); // Simple for performance
  };

// ================================
// USAGE EXAMPLES (for documentation)
// ================================

/*
// ✅ EXAMPLE USAGE IN CONTROLLERS:

@Controller('api/products')
export class ProductsController {
  
  // Skip logging for health check
  @SkipAudit()
  @Get('/health')
  healthCheck() {
    return { status: 'OK' };
  }
  
  // Custom action name
  @AuditAction('product.create_with_variants')
  @Post('/bulk')
  createBulkProducts() { ... }
  
  // High priority financial operation
  @FinancialAudit()
  @Post('/:id/purchase')
  purchaseProduct() { ... }
  
  // Security-sensitive operation
  @SecurityAudit()
  @Post('/:id/approve')
  approveProduct() { ... }
  
  // Admin operation with custom action
  @AdminAudit('product.force_delete')
  @Delete('/:id/force')
  forceDeleteProduct() { ... }
  
  // Bulk operation
  @BulkOperation()
  @Post('/bulk-update')
  bulkUpdateProducts() { ... }
  
  // Minimal logging for frequent operations
  @AuditDetailLevel('minimal')
  @Get('/:id/views')
  trackProductView() { ... }
}
*/
