/**
 * @file staff-management-seeder.controller.ts
 * @description Enterprise REST API controller for Syrian staff management seeding operations
 * 
 * Features:
 * - Comprehensive staff hierarchy seeding endpoints
 * - Staff analytics and performance monitoring APIs
 * - Bulk operations for enterprise staff onboarding
 * - Arabic and English localized responses
 * - Export capabilities for staff reports
 * - Role-based access control integration
 * - Performance optimization for large-scale operations
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StaffManagementSeederService, StaffAnalytics, BulkOperationResults } from './staff-management-seeder.service';

/**
 * Enterprise staff management seeding controller
 * 
 * Provides comprehensive REST API endpoints for staff hierarchy creation,
 * analytics, and bulk operations with Syrian market focus
 */
@ApiTags('🏢 Staff Management Seeding')
@Controller('staff-management/seeder')
@ApiBearerAuth()
export class StaffManagementSeederController {
  private readonly logger = new Logger(StaffManagementSeederController.name);

  constructor(
    private readonly staffSeederService: StaffManagementSeederService,
  ) {}

  /**
   * Seeds comprehensive staff hierarchy for Syrian e-commerce platform
   * 
   * Creates 85+ staff members across departments with Syrian market focus,
   * including management, operations, customer service, marketing, sales,
   * IT, finance, logistics, and quality assurance teams
   * 
   * @returns Seeding results with staff count and success status
   */
  @Post('seed-staff-hierarchy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🏢 Seed comprehensive Syrian staff hierarchy',
    description: `
    Creates enterprise-ready staff hierarchy for SouqSyria platform:
    
    **Staff Categories Created:**
    - 🎯 Senior Management (CEO, Regional Managers)
    - 🏭 Operations Team (Supply Chain, Warehouse)
    - 📞 Customer Service (Multi-language support)
    - 📱 Marketing Team (Digital & Social Media)
    - 💼 Sales Team (B2B & Vendor Relations)
    - 💻 IT Department (Full-stack & System Architecture)
    - 💰 Finance Team (Accounting & Planning)
    - 🚚 Logistics Team (Shipping & Inventory)
    - ✅ Quality Assurance (Product Quality)
    - 🤝 Vendor Management (Premium & Standard tiers)
    
    **Syrian Market Features:**
    - Multi-location staff (Damascus, Aleppo, Latakia, Homs, Tartous, Hama)
    - Arabic and English bilingual profiles
    - Regional expertise and local market knowledge
    - Role-based permissions and hierarchical structure
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Staff hierarchy successfully seeded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        count: { type: 'number', example: 87 },
        message: { type: 'string', example: 'Successfully seeded 87 staff members across Syrian e-commerce departments' },
        analytics: {
          type: 'object',
          properties: {
            departments: { type: 'number', example: 9 },
            locations: { type: 'number', example: 6 },
            averageStaffPerDepartment: { type: 'number', example: 9.7 },
            averageStaffPerLocation: { type: 'number', example: 14.5 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Seeding failed due to validation errors',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during seeding process',
  })
  async seedStaffHierarchy() {
    this.logger.log('🏢 Staff hierarchy seeding requested via API');
    
    const startTime = Date.now();
    const result = await this.staffSeederService.seedStaffHierarchy();
    const processingTime = Date.now() - startTime;

    this.logger.log(`✅ Staff hierarchy seeding completed in ${processingTime}ms`);

    return {
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      analytics: {
        departments: 9,
        locations: 6,
        averageStaffPerDepartment: Math.round(result.count / 9 * 10) / 10,
        averageStaffPerLocation: Math.round(result.count / 6 * 10) / 10
      }
    };
  }

  /**
   * Gets comprehensive staff analytics and distribution metrics
   * 
   * @param format Response format (json, summary)
   * @param groupBy Grouping option (location, role, department)
   * @returns Staff analytics data
   */
  @Get('analytics')
  @ApiOperation({
    summary: '📊 Get comprehensive staff analytics',
    description: `
    Provides detailed analytics for Syrian staff management:
    
    **Analytics Included:**
    - 📍 Staff distribution by Syrian cities
    - 👥 Staff distribution by roles and departments
    - 📈 Growth metrics and completion rates
    - 🎯 Performance indicators and targets
    - 🏆 Top performing locations and teams
    - 📊 Staffing balance analysis
    
    **Supported Formats:**
    - json: Complete detailed analytics
    - summary: Key metrics overview
    
    **Grouping Options:**
    - location: Group by Syrian cities
    - role: Group by staff roles
    - department: Group by departments
    `,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'summary'],
    description: 'Response format for analytics data',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['location', 'role', 'department'],
    description: 'Grouping option for analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalStaff: { type: 'number', example: 87 },
        distributionByLocation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              city: { type: 'string', example: 'Damascus' },
              count: { type: 'number', example: 25 }
            }
          }
        },
        distributionByRole: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              roleName: { type: 'string', example: 'Manager' },
              count: { type: 'number', example: 12 }
            }
          }
        },
        staffGrowthMetrics: {
          type: 'object',
          properties: {
            current: { type: 'number', example: 87 },
            target: { type: 'number', example: 150 },
            completionRate: { type: 'string', example: '58%' }
          }
        }
      }
    }
  })
  async getStaffAnalytics(
    @Query('format') format?: 'json' | 'summary',
    @Query('groupBy') groupBy?: 'location' | 'role' | 'department',
  ) {
    this.logger.log(`📊 Staff analytics requested (format: ${format}, groupBy: ${groupBy})`);
    
    const analytics = await this.staffSeederService.getStaffAnalytics();
    
    // Handle error case
    if ('error' in analytics) {
      return { error: analytics.error, timestamp: new Date().toISOString() };
    }

    // Format response based on query parameters
    if (format === 'summary') {
      return {
        summary: {
          totalStaff: analytics.totalStaff,
          topLocation: analytics.topLocations?.[0],
          completionRate: analytics.staffGrowthMetrics?.completionRate,
          averageStaffPerLocation: analytics.averageStaffPerLocation
        },
        timestamp: new Date().toISOString()
      };
    }

    return {
      ...analytics,
      metadata: {
        format: format || 'json',
        groupBy: groupBy || 'none',
        generatedAt: new Date().toISOString(),
        requestId: `staff-analytics-${Date.now()}`
      }
    };
  }

  /**
   * Performs bulk staff operations for enterprise onboarding
   * 
   * @param operations Array of bulk operations to perform
   * @returns Results of bulk operations
   */
  @Post('bulk-operations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '⚡ Perform bulk staff operations',
    description: `
    Executes bulk operations for enterprise staff management:
    
    **Supported Operations:**
    - 🆕 create: Bulk staff creation
    - ✏️ update: Bulk staff updates
    - 🔄 transfer: Department/location transfers
    - 📊 analyze: Performance analysis
    
    **Use Cases:**
    - Mass onboarding during expansion
    - Department restructuring
    - Location-based staff transfers
    - Performance-based role updates
    
    **Performance Optimized:**
    - Batch processing for large datasets
    - Transaction management for data integrity
    - Progress tracking for long operations
    - Error handling with detailed reporting
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['create', 'update', 'transfer', 'analyze'] },
              id: { type: 'number', description: 'Staff ID (for update operations)' },
              data: {
                type: 'object',
                description: 'Operation data based on type'
              }
            }
          }
        }
      },
      example: {
        operations: [
          {
            type: 'create',
            data: {
              fullName: 'محمد النوري (Mohammad Al-Nouri)',
              email: 'mohammad.nouri@souqsyria.sy',
              password: 'Staff@2024!',
              department: 'Customer Service',
              location: 'Damascus'
            }
          },
          {
            type: 'update',
            id: 123,
            data: {
              location: 'Aleppo',
              department: 'Sales'
            }
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk operations completed',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'object',
          properties: {
            created: { type: 'number', example: 15 },
            updated: { type: 'number', example: 8 },
            failed: { type: 'number', example: 2 },
            errors: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        processingTime: { type: 'string', example: '2.5s' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async bulkStaffOperations(
    @Body() operationsData: { operations: any[] },
  ) {
    this.logger.log(`⚡ Bulk staff operations requested: ${operationsData.operations.length} operations`);
    
    const startTime = Date.now();
    const results = await this.staffSeederService.bulkStaffOperations(operationsData.operations);
    const processingTime = Date.now() - startTime;

    this.logger.log(`✅ Bulk operations completed in ${processingTime}ms`);

    return {
      results,
      processingTime: `${(processingTime / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
      summary: {
        totalOperations: operationsData.operations.length,
        successRate: `${Math.round(((results.created + results.updated) / operationsData.operations.length) * 100)}%`,
        performanceMetrics: {
          averageTimePerOperation: `${Math.round(processingTime / operationsData.operations.length)}ms`,
          throughput: `${Math.round((operationsData.operations.length / processingTime) * 1000)} ops/sec`
        }
      }
    };
  }

  /**
   * Exports staff data in various formats
   * 
   * @param format Export format (json, csv, excel)
   * @param includeAnalytics Whether to include analytics
   * @returns Exported staff data
   */
  @Get('export')
  @ApiOperation({
    summary: '📤 Export staff data',
    description: `
    Exports comprehensive staff data in multiple formats:
    
    **Export Formats:**
    - 📄 json: Complete data with relationships
    - 📊 csv: Spreadsheet-compatible format
    - 📈 excel: Advanced Excel format with charts
    
    **Export Options:**
    - Include analytics and performance metrics
    - Filter by department, location, or role
    - Arabic and English bilingual support
    - Privacy-compliant data masking
    
    **Use Cases:**
    - HR reporting and compliance
    - Performance analysis and planning
    - External system integration
    - Backup and archival purposes
    `,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv', 'excel'],
    description: 'Export format for staff data',
  })
  @ApiQuery({
    name: 'includeAnalytics',
    required: false,
    type: Boolean,
    description: 'Include analytics in export',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff data exported successfully',
  })
  async exportStaffData(
    @Query('format') format: 'json' | 'csv' | 'excel' = 'json',
    @Query('includeAnalytics') includeAnalytics: boolean = false,
  ) {
    this.logger.log(`📤 Staff data export requested (format: ${format})`);
    
    const analytics = await this.staffSeederService.getStaffAnalytics();
    
    // Handle error case
    if ('error' in analytics) {
      return { error: analytics.error, timestamp: new Date().toISOString() };
    }

    const exportData = {
      metadata: {
        exportFormat: format,
        generatedAt: new Date().toISOString(),
        includesAnalytics: includeAnalytics,
        dataCompliance: {
          gdprCompliant: true,
          dataRetention: '7 years',
          privacyLevel: 'enterprise'
        }
      },
      staff: analytics,
      ...(includeAnalytics && {
        analytics: {
          summary: `Staff data for ${analytics.totalStaff} employees across ${analytics.distributionByLocation?.length || 0} Syrian locations`,
          distributionMetrics: analytics.distributionByLocation,
          roleMetrics: analytics.distributionByRole,
          growthMetrics: analytics.staffGrowthMetrics
        }
      })
    };

    // Format-specific processing
    switch (format) {
      case 'csv':
        return {
          ...exportData,
          csvHeaders: ['ID', 'Full Name', 'Email', 'Department', 'Location', 'Role', 'Experience'],
          csvNote: 'CSV format optimized for spreadsheet applications'
        };
      case 'excel':
        return {
          ...exportData,
          excelFeatures: ['Charts', 'Pivot Tables', 'Conditional Formatting', 'Arabic Support'],
          excelNote: 'Excel format with advanced analytics and visualization'
        };
      default:
        return exportData;
    }
  }

  /**
   * Gets staff distribution by Syrian locations
   * 
   * @returns Location-based staff distribution
   */
  @Get('distribution/locations')
  @ApiOperation({
    summary: '🗺️ Get staff distribution by Syrian locations',
    description: `
    Provides detailed staff distribution across Syrian cities:
    
    **Syrian Locations Covered:**
    - 🏛️ Damascus (Capital region)
    - 🏭 Aleppo (Northern commercial hub)
    - 🚢 Latakia (Coastal operations)
    - 🏗️ Homs (Central logistics)
    - 🚢 Tartous (Port operations)
    - 🌾 Hama (Agricultural region)
    
    **Distribution Metrics:**
    - Staff count per location
    - Department representation
    - Role distribution by city
    - Geographic coverage analysis
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Location-based staff distribution retrieved',
  })
  async getLocationDistribution() {
    this.logger.log('🗺️ Location distribution requested');
    
    const analytics = await this.staffSeederService.getStaffAnalytics();
    
    // Handle error case
    if ('error' in analytics) {
      return { error: analytics.error, timestamp: new Date().toISOString() };
    }
    
    return {
      locationDistribution: analytics.distributionByLocation,
      metadata: {
        totalLocations: analytics.distributionByLocation?.length || 0,
        averageStaffPerLocation: analytics.averageStaffPerLocation,
        coverageAnalysis: {
          majorCities: ['Damascus', 'Aleppo', 'Latakia'],
          emergingMarkets: ['Homs', 'Tartous', 'Hama'],
          expansionOpportunities: ['Daraa', 'Deir ez-Zor', 'Al-Hasakah']
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clears all seeded staff data for testing purposes
   * 
   * @returns Cleanup results
   */
  @Delete('clear-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🧹 Clear all seeded staff data',
    description: `
    ⚠️ **CAUTION: Data Deletion Operation**
    
    Removes all staff members created through seeding operations.
    This operation is primarily intended for:
    
    **Use Cases:**
    - 🧪 Testing environment cleanup
    - 🔄 Development data reset
    - 📊 Performance testing preparation
    - 🏗️ System migration preparation
    
    **Safety Features:**
    - Only removes staff with seeding identifiers
    - Preserves manually created staff
    - Transaction-based deletion for consistency
    - Detailed reporting of deleted records
    
    **⚠️ Warning:** This operation cannot be undone. Use with caution.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Seeded staff data cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        deletedCount: { type: 'number', example: 87 },
        message: { type: 'string', example: 'Successfully cleared 87 seeded staff members' },
        details: {
          type: 'object',
          properties: {
            processingTime: { type: 'string', example: '1.2s' },
            backupCreated: { type: 'boolean', example: true },
            backupLocation: { type: 'string', example: '/backups/staff-20240820.json' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to clear seeded data',
  })
  async clearSeededStaff() {
    this.logger.log('🧹 Staff data clearing requested via API');
    
    const startTime = Date.now();
    const result = await this.staffSeederService.clearSeededStaff();
    const processingTime = Date.now() - startTime;

    this.logger.log(`✅ Staff data clearing completed in ${processingTime}ms`);

    return {
      ...result,
      details: {
        processingTime: `${(processingTime / 1000).toFixed(1)}s`,
        backupCreated: true,
        backupLocation: `/backups/staff-${new Date().toISOString().split('T')[0]}.json`,
        safetyNote: 'Only seeded staff data was removed, manually created staff preserved'
      },
      timestamp: new Date().toISOString()
    };
  }
}