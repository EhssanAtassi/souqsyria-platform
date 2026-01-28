/**
 * @file get-users-query.dto.ts
 * @description DTO for paginated querying of users with a specific role.
 * Supports pagination parameters for efficient data retrieval.
 *
 * @example
 * GET /api/admin/roles/5/users?page=1&limit=20
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GetUsersQueryDto
 *
 * Query parameters for retrieving a paginated list of users assigned to a role.
 * Supports both roleId (business role) and assignedRoleId (staff role) queries.
 *
 * Pagination defaults:
 * - page: 1 (first page)
 * - limit: 20 (20 users per page, max 100)
 *
 * Performance:
 * - Uses indexed queries on role_id and assigned_role_id
 * - Target: <200ms for typical queries
 * - Supports up to 100 users per page
 */
export class GetUsersQueryDto {
  /**
   * Page number for pagination (1-based).
   * First page is 1, not 0.
   *
   * @minimum 1
   * @default 1
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Page number for pagination (1-based)',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Page must be an integer',
  })
  @Min(1, {
    message: 'Page must be at least 1',
  })
  page?: number = 1;

  /**
   * Number of users per page.
   * Maximum allowed: 100 users per page.
   *
   * @minimum 1
   * @maximum 100
   * @default 20
   * @example 20
   */
  @ApiPropertyOptional({
    description: 'Number of users per page (max: 100)',
    example: 20,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Limit must be an integer',
  })
  @Min(1, {
    message: 'Limit must be at least 1',
  })
  @Max(100, {
    message: 'Limit cannot exceed 100 users per page',
  })
  limit?: number = 20;
}
