import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditLogService } from '../service/audit-log.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';

/**
 * Admin-only controller for viewing audit logs.
 * Protected using dynamic ACL PermissionsGuard.
 */
@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('admin/audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Retrieve all audit logs in the system.
   * Requires permission: `audit-log.view-all`
   */
  @Get()
  @Permissions('audit-log.view-all')
  @ApiOperation({ summary: 'Get all audit logs (admin only)' })
  findAll() {
    return this.auditLogService.findAll();
  }

  /**
   * Retrieve all logs by a specific actor (user/vendor/admin).
   * Requires permission: `audit-log.read`
   */
  @Get('actor/:id')
  @Permissions('audit-log.read')
  @ApiOperation({ summary: 'Get logs for specific actor ID' })
  findByActor(@Param('id') id: number) {
    return this.auditLogService.findByActor(Number(id));
  }
}
