/**
 * @file auto-mapping-options.dto.ts
 * @description DTO for configuring auto-generation of route-permission mappings.
 *
 * Provides fine-grained control over the auto-discovery and auto-mapping process.
 * Supports dry-run mode for safe preview before executing actual database changes.
 *
 * @example
 * {
 *   "dryRun": true,
 *   "skipExisting": true,
 *   "createMissingPermissions": false
 * }
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for configuring the auto-mapping generation process
 *
 * This DTO controls how the system automatically generates route-to-permission
 * mappings based on discovered routes and naming conventions.
 *
 * The auto-mapping algorithm:
 * 1. Scans all registered NestJS controllers and methods
 * 2. Generates suggested permission names based on naming conventions
 * 3. Matches suggested names with existing permissions in database
 * 4. Creates route mappings for matched pairs (respecting options)
 * 5. Reports results including successes, skips, and failures
 *
 * Options allow administrators to:
 * - Preview changes before applying (dryRun)
 * - Avoid overwriting manual mappings (skipExisting)
 * - Automatically create missing permissions (createMissingPermissions)
 */
export class AutoMappingOptionsDto {
  /**
   * Dry run mode - preview without making changes
   *
   * When true:
   * - Performs full discovery and analysis
   * - Validates permission matches
   * - Generates mapping preview
   * - Does NOT create any database records
   * - Returns detailed report of what WOULD be created
   *
   * When false:
   * - Executes actual mapping creation
   * - Writes route mappings to database
   * - Returns report of created mappings
   *
   * Best Practice:
   * - Always run with dryRun=true first
   * - Review the preview output carefully
   * - Verify no unexpected mappings
   * - Then execute with dryRun=false
   *
   * @default false
   * @example true
   */
  @ApiPropertyOptional({
    description:
      'Preview mode - analyze and report without creating mappings (default: false)',
    example: false,
    default: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;

  /**
   * Skip routes that already have mappings
   *
   * When true:
   * - Existing route mappings are preserved
   * - Only unmapped routes are processed
   * - Manual mappings remain untouched
   * - Prevents overwriting custom permission assignments
   *
   * When false:
   * - ALL routes are processed
   * - Existing mappings may be updated
   * - Can re-map routes to different permissions
   * - Use cautiously to avoid unintended security changes
   *
   * Recommendation:
   * - Use true (default) to preserve manual work
   * - Use false only when intentionally resetting all mappings
   *
   * @default true
   * @example true
   */
  @ApiPropertyOptional({
    description:
      'Skip routes that already have permission mappings (default: true)',
    example: true,
    default: true,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  skipExisting?: boolean = true;

  /**
   * Automatically create missing permissions during auto-mapping
   *
   * When true:
   * - If suggested permission doesn't exist, create it
   * - New permissions use auto-generated names and descriptions
   * - Resource and action fields are populated automatically
   * - Simplifies initial system setup
   *
   * When false:
   * - Only map routes to existing permissions
   * - Skip routes where permission doesn't exist
   * - Requires manual permission creation first
   * - More controlled approach (recommended)
   *
   * Security Consideration:
   * - Auto-created permissions have generic descriptions
   * - May lack proper resource/action categorization
   * - Review and refine auto-created permissions afterward
   *
   * Recommendation:
   * - Use false (default) for production systems
   * - Use true only for development/testing or initial setup
   * - Always review auto-created permissions
   *
   * @default false
   * @example false
   */
  @ApiPropertyOptional({
    description:
      'Create missing permissions automatically (default: false, recommended for safety)',
    example: false,
    default: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  createMissingPermissions?: boolean = false;
}
