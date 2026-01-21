import { Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartMonitoringService } from '../services/cart-monitoring.service';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';

/**
 * Cart Monitoring Controller
 *
 * Provides admin-only endpoints for real-time cart monitoring dashboard
 * Includes statistics, security alerts, performance metrics, and abandoned cart analytics
 *
 * @swagger
 * tags:
 *   - name: Cart Monitoring
 *     description: Admin cart monitoring and analytics endpoints
 */
@ApiTags('Cart Monitoring')
@Controller('admin/cart-monitor')
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class CartMonitoringController {
  constructor(
    private readonly cartMonitoringService: CartMonitoringService,
  ) {}

  /**
   * Get comprehensive monitoring dashboard data
   *
   * Returns aggregated cart statistics, security alerts, performance metrics,
   * recent operations, and abandoned cart analytics for admin monitoring dashboard
   *
   * **Required Permission:** cart:monitoring:read
   *
   * **Response includes:**
   * - **Statistics**: Active/abandoned cart counts, average cart value, conversion rate
   * - **Security**: Security alerts, rate limiting activations, fraud detection metrics
   * - **Performance**: Response times, error rates, throughput metrics over time
   * - **Operations**: Last 10 cart operations with status and timing
   * - **Abandoned Items**: Top products left in abandoned carts with value analysis
   *
   * **Performance:** Cached for 30 seconds to reduce database load
   *
   * @returns Complete monitoring dashboard data
   *
   * @swagger
   * /admin/cart-monitor/dashboard:
   *   get:
   *     summary: Get monitoring dashboard data
   *     description: Comprehensive cart monitoring data for admin dashboard (requires cart:monitoring:read permission)
   *     tags:
   *       - Cart Monitoring
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Monitoring data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CartMonitoringData'
   *             example:
   *               statistics:
   *                 activeCartsCount: 42
   *                 abandonedCartsCount: 15
   *                 avgCartValue: 125000
   *                 totalCartValue: 5250000
   *                 conversionRate: 68.5
   *                 guestCartPercentage: 35.2
   *               security:
   *                 alertsCount: 3
   *                 rateLimitActivations: 12
   *                 fraudAlertsCount: 1
   *                 alerts: []
   *               performance:
   *                 avgResponseTime: 145
   *                 errorRate: 0.8
   *                 metricsOverTime: []
   *               operations: []
   *               abandonedItems: []
   *       401:
   *         description: Unauthorized - Invalid or missing authentication token
   *       403:
   *         description: Forbidden - Insufficient permissions (requires cart:monitoring:read)
   *       500:
   *         description: Internal server error
   */
  @Get('dashboard')
  @RequirePermissions('cart:monitoring:read')
  @ApiOperation({
    summary: 'Get monitoring dashboard data',
    description:
      'Retrieves comprehensive cart monitoring data including statistics, security alerts, performance metrics, recent operations, and abandoned cart analytics. **Admin only** - requires cart:monitoring:read permission.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monitoring dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statistics: {
          type: 'object',
          properties: {
            activeCartsCount: {
              type: 'number',
              example: 42,
              description: 'Number of active carts (modified in last 30 min)',
            },
            abandonedCartsCount: {
              type: 'number',
              example: 15,
              description:
                'Number of abandoned carts (inactive 24+ hours with items)',
            },
            avgCartValue: {
              type: 'number',
              example: 125000,
              description: 'Average cart value in SYP',
            },
            totalCartValue: {
              type: 'number',
              example: 5250000,
              description: 'Total value across all carts in SYP',
            },
            conversionRate: {
              type: 'number',
              example: 68.5,
              description: 'Percentage of carts that completed checkout',
            },
            guestCartPercentage: {
              type: 'number',
              example: 35.2,
              description: 'Percentage of guest vs authenticated carts',
            },
          },
        },
        security: {
          type: 'object',
          properties: {
            alertsCount: {
              type: 'number',
              example: 3,
              description: 'Total security alerts in last 24h',
            },
            rateLimitActivations: {
              type: 'number',
              example: 12,
              description: 'Rate limiting activations in last hour',
            },
            fraudAlertsCount: {
              type: 'number',
              example: 1,
              description: 'Fraud detection alerts in last 24h',
            },
            alerts: {
              type: 'array',
              description: 'Recent security alerts (last 10)',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  type: { type: 'string', example: 'VELOCITY' },
                  severity: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                  },
                  userId: { type: 'string', nullable: true },
                  ipAddress: { type: 'string' },
                  action: { type: 'string' },
                  details: { type: 'string' },
                },
              },
            },
          },
        },
        performance: {
          type: 'object',
          properties: {
            avgResponseTime: {
              type: 'number',
              example: 145,
              description: 'Average response time in milliseconds',
            },
            errorRate: {
              type: 'number',
              example: 0.8,
              description: 'Error rate percentage',
            },
            metricsOverTime: {
              type: 'array',
              description: 'Hourly performance metrics (last 24h)',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  avgResponseTime: { type: 'number' },
                  errorRate: { type: 'number' },
                  throughput: {
                    type: 'number',
                    description: 'Requests per hour',
                  },
                },
              },
            },
          },
        },
        operations: {
          type: 'array',
          description: 'Recent cart operations (last 10)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              userId: { type: 'string', nullable: true },
              operation: { type: 'string', example: 'ITEM ADDED' },
              status: {
                type: 'string',
                enum: ['success', 'error', 'blocked'],
              },
              responseTime: {
                type: 'number',
                description: 'Response time in ms',
              },
              details: { type: 'string' },
            },
          },
        },
        abandonedItems: {
          type: 'array',
          description: 'Top products in abandoned carts',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              productName: { type: 'string' },
              count: {
                type: 'number',
                description: 'Number of times abandoned',
              },
              totalValue: {
                type: 'number',
                description: 'Total value in SYP',
              },
              avgTimeInCart: {
                type: 'number',
                description: 'Average time in cart (minutes)',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden - Insufficient permissions (requires cart:monitoring:read)',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getDashboardData() {
    return this.cartMonitoringService.getDashboardData();
  }
}
