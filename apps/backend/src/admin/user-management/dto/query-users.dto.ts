/**
 * @file query-users.dto.ts
 * @description DTO for querying users with pagination, search, and filtering capabilities.
 *
 * This DTO supports:
 * - Pagination with configurable page size
 * - Full-text search across email and username
 * - Role-based filtering
 * - Status filtering (active, banned, suspended)
 *
 * Example Usage:
 * ```typescript
 * // Get first page of active users
 * GET /api/admin/users?page=1&limit=20&status=active
 *
 * // Search for users by email
 * GET /api/admin/users?search=john@example.com
 *
 * // Filter by role
 * GET /api/admin/users?role=vendor&page=1&limit=50
 * ```
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * QueryUsersDto
 *
 * Data transfer object for paginated user queries with filtering.
 * All fields are optional to allow flexible querying.
 *
 * Validation Rules:
 * - page: Must be >= 1
 * - limit: Must be between 1 and 100 (prevents excessive data loading)
 * - status: Must be one of 'active', 'banned', or 'suspended'
 * - search: Free text (searches email and username)
 * - role: Free text (matches role name)
 */
export class QueryUsersDto {
  /**
   * Page number for pagination (1-based indexing).
   *
   * Defaults to 1 if not provided.
   * Used to calculate offset: offset = (page - 1) * limit
   *
   * @example 1
   * @default 1
   */
  @ApiPropertyOptional({
    description: 'Page number for pagination (1-based)',
    example: 1,
    default: 1,
    minimum: 1,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  /**
   * Number of records per page.
   *
   * Defaults to 20 if not provided.
   * Maximum of 100 to prevent performance issues and excessive data transfer.
   *
   * Performance Consideration:
   * - Smaller limits (10-20) provide faster response times
   * - Larger limits (50-100) reduce number of requests needed
   *
   * @example 20
   * @default 20
   */
  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  /**
   * Search query for filtering users.
   *
   * Searches across:
   * - Email address (case-insensitive partial match)
   * - Full name (case-insensitive partial match)
   *
   * Uses SQL LIKE operator with wildcards for flexible matching.
   *
   * Example searches:
   * - "john" - Matches "John Doe", "johnny@example.com"
   * - "@example.com" - Finds all users with example.com email
   * - "vendor" - Could match usernames or email containing "vendor"
   *
   * @example "john@example.com"
   */
  @ApiPropertyOptional({
    description: 'Search query to filter users by email or username (case-insensitive partial match)',
    example: 'john@example.com',
    type: 'string',
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  /**
   * Filter users by role name.
   *
   * Matches against the role.name field (exact match).
   * Common role names: 'buyer', 'vendor', 'admin', 'support', 'marketing'
   *
   * This filters by the user's primary business role (user.role).
   * To filter by assigned staff roles (user.assignedRole), a separate filter could be added.
   *
   * @example "vendor"
   */
  @ApiPropertyOptional({
    description: 'Filter users by role name (exact match)',
    example: 'vendor',
    type: 'string',
  })
  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  role?: string;

  /**
   * Filter users by account status.
   *
   * Status values:
   * - 'active': Users who are not banned and not suspended (normal operation)
   * - 'banned': Users with isBanned=true (cannot login)
   * - 'suspended': Users with isSuspended=true (restricted access)
   *
   * Implementation note:
   * - active: WHERE isBanned = false AND isSuspended = false
   * - banned: WHERE isBanned = true
   * - suspended: WHERE isSuspended = true
   *
   * A user can be both banned and suspended, but banned takes precedence.
   *
   * @example "active"
   */
  @ApiPropertyOptional({
    description: 'Filter users by status',
    example: 'active',
    enum: ['active', 'banned', 'suspended'],
    type: 'string',
  })
  @IsOptional()
  @IsIn(['active', 'banned', 'suspended'], {
    message: 'Status must be one of: active, banned, suspended',
  })
  status?: 'active' | 'banned' | 'suspended';
}
