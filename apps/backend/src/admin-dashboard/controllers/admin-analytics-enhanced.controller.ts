/**
 * @file admin-analytics-enhanced.controller.ts
 * @description Enhanced Admin Analytics Controller - Integrates Business Intelligence capabilities
 *              with existing operational analytics for comprehensive dashboard insights.
 * 
 * ARCHITECTURE:
 * - Seamlessly integrates CLV, Funnel, Cohort, and Abandonment analytics
 * - Maintains backward compatibility with existing analytics APIs
 * - Implements proper caching with intelligent invalidation
 * - Provides aggregate endpoints combining operational + BI metrics
 * 
 * PERFORMANCE:
 * - < 500ms response time for cached queries
 * - < 2s for complex aggregations
 * - Rate limiting for expensive operations
 * - Background processing for recalculations
 * 
 * @module AdminDashboard/Controllers
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 2.0.0
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';

// Services
import { AdminAnalyticsEnhancedService } from '../services/admin-analytics-enhanced.service';

// DTOs
import {
  // CLV Analytics DTOs
  CLVSummaryResponseDto,
  CustomerSegmentsResponseDto,
  CLVPredictionsResponseDto,
  EnhancedCustomerCLVDetailDto,
  RecalculateCLVRequestDto,
  RecalculateCLVResponseDto,
  
  // Conversion Funnel DTOs
  FunnelOverviewResponseDto,
  FunnelStepsResponseDto,
  FunnelDropOffResponseDto,
  DeviceFunnelResponseDto,
  TrackFunnelEventRequestDto,
  TrackFunnelEventResponseDto,
  
  // Cart Abandonment DTOs
  AbandonmentRateResponseDto,
  AbandonmentRecoveryResponseDto,
  AbandonmentReasonsResponseDto,
  TriggerRecoveryRequestDto,
  TriggerRecoveryResponseDto,
  
  // Cohort Analysis DTOs
  CohortRetentionResponseDto,
  CohortRevenueResponseDto,
  CohortDetailResponseDto,
  CreateCohortRequestDto,
  CreateCohortResponseDto,
  
  // Enhanced Dashboard DTOs
  EnhancedDashboardSummaryDto,
  BIOverviewResponseDto,
  
  // Query DTOs
  DateRangeQueryDto,
  PaginationQueryDto,
  SegmentFilterDto,
} from '../dto/bi-analytics-enhanced.dto';

/**
 * Admin Analytics Enhanced Controller
 * 
 * @description Provides comprehensive analytics endpoints combining:
 * - Operational metrics (sales, users, commissions)
 * - Business Intelligence (CLV, funnel, cohort analysis)
 * - Real-time tracking and predictive analytics
 * - Cart abandonment recovery and optimization
 * 
 * @example
 * GET /api/admin-dashboard/analytics/enhanced-summary
 * GET /api/admin-dashboard/analytics/clv/summary?startDate=2026-01-01
 * GET /api/admin-dashboard/analytics/funnel/overview
 * POST /api/admin-dashboard/analytics/clv/recalculate
 */
@ApiTags('Admin Analytics (Enhanced)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'admin')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin-dashboard/analytics')
export class AdminAnalyticsEnhancedController {
  constructor(
    private readonly analyticsService: AdminAnalyticsEnhancedService,
  ) {}

  // ===========================================================================
  // ENHANCED DASHBOARD OVERVIEW
  // ===========================================================================

  /**
   * Get enhanced dashboard summary
   * @description Retrieves comprehensive dashboard summary combining operational
   *              metrics with business intelligence insights.
   * @returns Enhanced dashboard summary with CLV, funnel, and cohort data
   */
  @Get('enhanced-summary')
  @ApiOperation({
    summary: 'Get enhanced dashboard summary',
    description: 'Retrieves comprehensive dashboard summary including:\n' +
                 '- Operational metrics (revenue, orders, users)\n' +
                 '- CLV analytics (average, segments, predictions)\n' +
                 '- Conversion funnel overview\n' +
                 '- Cart abandonment metrics\n' +
                 '- Cohort retention highlights\n\n' +
                 'Cached for 15 minutes, invalidated on relevant business events.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for metrics (ISO 8601 format)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for metrics (ISO 8601 format)',
    example: '2026-01-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Enhanced dashboard summary retrieved successfully',
    type: EnhancedDashboardSummaryDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to access analytics',
  })
  async getEnhancedSummary(
    @Query() query: DateRangeQueryDto,
  ): Promise<EnhancedDashboardSummaryDto> {
    return this.analyticsService.getEnhancedDashboardSummary(query);
  }

  /**
   * Get business intelligence overview
   * @description Retrieves comprehensive BI metrics overview focusing on
   *              customer insights, conversion optimization, and revenue analytics.
   * @returns Business intelligence overview with key BI metrics
   */
  @Get('business-intelligence-overview')
  @ApiOperation({
    summary: 'Get business intelligence overview',
    description: 'Retrieves BI-focused overview including:\n' +
                 '- Customer Lifetime Value analytics\n' +
                 '- Conversion funnel performance\n' +
                 '- Cart abandonment insights\n' +
                 '- Cohort behavior patterns\n' +
                 '- Predictive analytics highlights\n\n' +
                 'Optimized for BI dashboards and executive reporting.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for BI metrics (ISO 8601 format)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for BI metrics (ISO 8601 format)',
    example: '2026-01-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'BI overview retrieved successfully',
    type: BIOverviewResponseDto,
  })
  async getBIOverview(
    @Query() query: DateRangeQueryDto,
  ): Promise<BIOverviewResponseDto> {
    return this.analyticsService.getBIOverview(query);
  }

  // ===========================================================================
  // CUSTOMER LIFETIME VALUE (CLV) ANALYTICS
  // ===========================================================================

  /**
   * Get CLV summary analytics
   * @description Retrieves comprehensive CLV metrics including average CLV,
   *              segment distribution, and top customer contributions.
   * @returns CLV summary with segmentation and trends
   */
  @Get('clv/summary')
  @ApiOperation({
    summary: 'Get CLV summary analytics',
    description: 'Retrieves comprehensive Customer Lifetime Value metrics:\n' +
                 '- Average CLV across all customers\n' +
                 '- Median CLV for balanced view\n' +
                 '- Total CLV representing platform value\n' +
                 '- Segment breakdown (Champions, Loyal, At-Risk, etc.)\n' +
                 '- Top 20% customer contribution analysis\n' +
                 '- Churn risk distribution\n' +
                 '- Acquisition trend analysis\n\n' +
                 'Example Syrian Market Data:\n' +
                 '- Average CLV: 2,500,000 SYP (~$50 USD)\n' +
                 '- Champions: 15% of customers, 45% of revenue\n' +
                 '- At-Risk: 20% requiring retention campaigns',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for CLV calculation period',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for CLV calculation period',
    example: '2026-01-22',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CLV summary retrieved successfully',
    type: CLVSummaryResponseDto,
  })
  async getCLVSummary(
    @Query() query: DateRangeQueryDto,
  ): Promise<CLVSummaryResponseDto> {
    return this.analyticsService.getCLVSummary(query);
  }

  /**
   * Get customer segments analysis
   * @description Retrieves detailed breakdown of customer segments based on
   *              RFM scoring (Recency, Frequency, Monetary value).
   * @returns Customer segments with counts, CLV metrics, and behavior patterns
   */
  @Get('clv/segments')
  @ApiOperation({
    summary: 'Get customer segments analysis',
    description: 'Retrieves RFM-based customer segmentation:\n\n' +
                 'Segments:\n' +
                 '- Champions: Recent, frequent, high-value customers\n' +
                 '- Loyal Customers: Regular purchasers with good value\n' +
                 '- Potential Loyalists: Recent customers with growth potential\n' +
                 '- At Risk: Previously valuable, need re-engagement\n' +
                 '- Hibernating: Inactive customers, recovery opportunity\n' +
                 '- Lost: Churned customers requiring win-back campaigns\n\n' +
                 'Each segment includes:\n' +
                 '- Customer count and percentage\n' +
                 '- Average CLV and revenue contribution\n' +
                 '- Recommended retention actions\n' +
                 '- Churn probability metrics\n\n' +
                 'Syrian Market Example:\n' +
                 '- Champions: 150 customers, Avg CLV: 8,500,000 SYP\n' +
                 '- At Risk: 200 customers, Avg CLV: 3,200,000 SYP',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'segment',
    required: false,
    enum: ['champions', 'loyal', 'potential_loyalists', 'at_risk', 'hibernating', 'lost'],
    description: 'Filter by specific segment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer segments retrieved successfully',
    type: CustomerSegmentsResponseDto,
  })
  async getCustomerSegments(
    @Query() query: DateRangeQueryDto & SegmentFilterDto,
  ): Promise<CustomerSegmentsResponseDto> {
    return this.analyticsService.getCustomerSegments(query);
  }

  /**
   * Get CLV predictions
   * @description Retrieves predictive CLV analytics for future revenue forecasting
   *              and customer value optimization.
   * @returns CLV predictions with confidence intervals and growth projections
   */
  @Get('clv/predictions')
  @ApiOperation({
    summary: 'Get CLV predictions and forecasts',
    description: 'Retrieves predictive analytics for Customer Lifetime Value:\n' +
                 '- 3-month, 6-month, and 12-month CLV predictions\n' +
                 '- Confidence intervals for forecast accuracy\n' +
                 '- Growth potential by customer segment\n' +
                 '- Revenue impact of retention improvements\n' +
                 '- Churn probability forecasts\n' +
                 '- Investment prioritization recommendations\n\n' +
                 'Prediction Model:\n' +
                 '- Based on RFM scoring and purchase patterns\n' +
                 '- Historical behavior analysis (6-12 months)\n' +
                 '- Seasonality adjustments for Syrian market\n' +
                 '- Economic factor considerations\n\n' +
                 'Use Cases:\n' +
                 '- Marketing budget allocation\n' +
                 '- Customer acquisition cost optimization\n' +
                 '- Retention campaign ROI forecasting\n' +
                 '- Executive revenue planning',
  })
  @ApiQuery({
    name: 'horizon',
    required: false,
    enum: ['3_months', '6_months', '12_months'],
    description: 'Prediction time horizon',
    example: '12_months',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CLV predictions retrieved successfully',
    type: CLVPredictionsResponseDto,
  })
  async getCLVPredictions(
    @Query() query: { horizon?: '3_months' | '6_months' | '12_months' },
  ): Promise<CLVPredictionsResponseDto> {
    return this.analyticsService.getCLVPredictions(query);
  }

  /**
   * Get individual customer CLV details
   * @description Retrieves comprehensive CLV metrics and behavior analysis
   *              for a specific customer.
   * @param id - Customer user ID
   * @returns Detailed customer CLV metrics, RFM score, and recommendations
   */
  @Get('clv/customers/:id')
  @ApiOperation({
    summary: 'Get individual customer CLV details',
    description: 'Retrieves detailed CLV analytics for a specific customer:\n' +
                 '- Historical CLV (actual lifetime value to date)\n' +
                 '- Predicted CLV (forecasted future value)\n' +
                 '- Total CLV (historical + predicted)\n' +
                 '- RFM Score breakdown (Recency, Frequency, Monetary)\n' +
                 '- Customer segment assignment\n' +
                 '- Churn probability assessment\n' +
                 '- Recommended retention actions\n' +
                 '- Purchase behavior patterns\n' +
                 '- Order history summary\n\n' +
                 'Response Example (Syrian Market):\n' +
                 '```json\n' +
                 '{\n' +
                 '  "userId": 123,\n' +
                 '  "email": "ahmad@example.sy",\n' +
                 '  "historicalCLV": 5250000,  // 5.25M SYP\n' +
                 '  "predictedCLV": 3400000,   // 3.4M SYP\n' +
                 '  "totalCLV": 8650000,       // 8.65M SYP\n' +
                 '  "segment": "loyal_customers",\n' +
                 '  "rfmScore": { "r": 4, "f": 5, "m": 5 },\n' +
                 '  "churnProbability": 0.15,\n' +
                 '  "retentionAction": "personalized_offers"\n' +
                 '}\n' +
                 '```',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Customer user ID',
    example: 123,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer CLV details retrieved successfully',
    type: EnhancedCustomerCLVDetailDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  async getCustomerCLV(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnhancedCustomerCLVDetailDto> {
    return this.analyticsService.getCustomerCLV(id);
  }

  /**
   * Trigger CLV recalculation
   * @description Initiates background recalculation of CLV metrics for all customers
   *              or specific segments. Heavy operation with rate limiting.
   * @param request - Recalculation parameters (scope, segments)
   * @returns Recalculation job status and estimated completion time
   */
  @Post('clv/recalculate')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @ApiOperation({
    summary: 'Trigger CLV recalculation (Rate Limited)',
    description: 'Initiates background recalculation of Customer Lifetime Value metrics.\n\n' +
                 '⚠️ RATE LIMITED: 3 requests per hour\n\n' +
                 'Recalculation Scope:\n' +
                 '- All customers (full recalculation)\n' +
                 '- Specific segments only\n' +
                 '- Customers modified since last calculation\n\n' +
                 'Process:\n' +
                 '1. Validates recalculation request\n' +
                 '2. Queues background job (Bull + Redis)\n' +
                 '3. Processes in batches (100 customers/batch)\n' +
                 '4. Updates cache upon completion\n' +
                 '5. Sends notification when finished\n\n' +
                 'Estimated Duration:\n' +
                 '- 1,000 customers: ~2-3 minutes\n' +
                 '- 10,000 customers: ~15-20 minutes\n' +
                 '- 100,000 customers: ~2-3 hours\n\n' +
                 'Use Cases:\n' +
                 '- After major promotions/campaigns\n' +
                 '- Monthly scheduled recalculation\n' +
                 '- When CLV model parameters change\n' +
                 '- After data imports or corrections',
  })
  @ApiBody({
    type: RecalculateCLVRequestDto,
    description: 'Recalculation parameters',
    examples: {
      all: {
        value: { scope: 'all' },
        description: 'Recalculate CLV for all customers',
      },
      segment: {
        value: { scope: 'segment', segments: ['at_risk', 'hibernating'] },
        description: 'Recalculate CLV for specific segments',
      },
      modified: {
        value: { scope: 'modified_since', since: '2026-01-01' },
        description: 'Recalculate for customers with activity since date',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'CLV recalculation job queued successfully',
    type: RecalculateCLVResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded - maximum 3 requests per hour',
  })
  async recalculateCLV(
    @Body() request: RecalculateCLVRequestDto,
  ): Promise<RecalculateCLVResponseDto> {
    return this.analyticsService.triggerCLVRecalculation(request);
  }

  // ===========================================================================
  // CONVERSION FUNNEL ANALYTICS
  // ===========================================================================

  /**
   * Get conversion funnel overview
   * @description Retrieves high-level conversion funnel metrics and performance.
   * @returns Funnel overview with conversion rates and key metrics
   */
  @Get('funnel/overview')
  @ApiOperation({
    summary: 'Get conversion funnel overview',
    description: 'Retrieves conversion funnel performance metrics:\n' +
                 '- Overall conversion rate (visitors → purchasers)\n' +
                 '- Total sessions and conversions\n' +
                 '- Average time to convert\n' +
                 '- Funnel stages completion rates\n' +
                 '- Biggest drop-off point identification\n' +
                 '- Segmentation by channel, device, UTM source\n\n' +
                 'Funnel Stages:\n' +
                 '1. Landing (100% baseline)\n' +
                 '2. Product View (typical: 45-60%)\n' +
                 '3. Add to Cart (typical: 20-30%)\n' +
                 '4. Checkout Initiation (typical: 15-25%)\n' +
                 '5. Purchase Completion (typical: 8-15%)\n\n' +
                 'Syrian Market Benchmarks:\n' +
                 '- Overall conversion: 2.5-4.5%\n' +
                 '- Mobile conversion: 1.8-3.2%\n' +
                 '- Desktop conversion: 3.5-6.0%\n' +
                 '- Average time to convert: 3-7 days',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Funnel overview retrieved successfully',
    type: FunnelOverviewResponseDto,
  })
  async getFunnelOverview(
    @Query() query: DateRangeQueryDto,
  ): Promise<FunnelOverviewResponseDto> {
    return this.analyticsService.getFunnelOverview(query);
  }

  /**
   * Get detailed funnel steps analysis
   * @description Retrieves step-by-step funnel metrics with drop-off rates
   *              and time spent at each stage.
   * @returns Detailed funnel steps with progression metrics
   */
  @Get('funnel/steps')
  @ApiOperation({
    summary: 'Get detailed funnel steps analysis',
    description: 'Retrieves granular metrics for each funnel stage:\n\n' +
                 'Per-Step Metrics:\n' +
                 '- Entered count (users reaching this step)\n' +
                 '- Completed count (users progressing to next step)\n' +
                 '- Conversion rate (% progressing forward)\n' +
                 '- Drop-off rate (% abandoning at this step)\n' +
                 '- Average time spent (engagement duration)\n' +
                 '- Median time spent (typical user behavior)\n\n' +
                 'Analysis Insights:\n' +
                 '- Identify friction points in customer journey\n' +
                 '- Optimize high drop-off stages\n' +
                 '- Understand time investment per stage\n' +
                 '- Compare performance across segments\n\n' +
                 'Example Response (Syrian Market):\n' +
                 '```json\n' +
                 '{\n' +
                 '  "steps": [\n' +
                 '    {\n' +
                 '      "stage": "product_view",\n' +
                 '      "entered": 10000,\n' +
                 '      "completed": 2500,\n' +
                 '      "conversionRate": 0.25,\n' +
                 '      "dropOffRate": 0.75,\n' +
                 '      "avgTimeSpent": "00:02:34",\n' +
                 '      "medianTimeSpent": "00:01:45"\n' +
                 '    },\n' +
                 '    ...\n' +
                 '  ]\n' +
                 '}\n' +
                 '```',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Funnel steps retrieved successfully',
    type: FunnelStepsResponseDto,
  })
  async getFunnelSteps(
    @Query() query: DateRangeQueryDto,
  ): Promise<FunnelStepsResponseDto> {
    return this.analyticsService.getFunnelSteps(query);
  }

  /**
   * Get funnel drop-off analysis
   * @description Retrieves detailed analysis of funnel abandonment points
   *              with reasons and optimization recommendations.
   * @returns Drop-off analysis with reasons and actionable insights
   */
  @Get('funnel/dropoffs')
  @ApiOperation({
    summary: 'Get funnel drop-off analysis',
    description: 'Analyzes why and where customers abandon the funnel:\n\n' +
                 'Drop-Off Metrics:\n' +
                 '- Biggest drop-off stage identification\n' +
                 '- Drop-off rate per stage\n' +
                 '- Abandoned session counts\n' +
                 '- Lost revenue potential\n' +
                 '- Common abandonment reasons\n\n' +
                 'Segmented Analysis:\n' +
                 '- By device type (mobile vs desktop abandonment patterns)\n' +
                 '- By traffic source (organic, paid, social, direct)\n' +
                 '- By user type (new vs returning)\n' +
                 '- By time of day/week\n\n' +
                 'Common Drop-Off Reasons (Syrian Market):\n' +
                 '1. Payment method limitations (35%)\n' +
                 '2. Shipping cost concerns (25%)\n' +
                 '3. Price comparison behavior (20%)\n' +
                 '4. Trust/security concerns (12%)\n' +
                 '5. Technical issues (8%)\n\n' +
                 'Optimization Recommendations:\n' +
                 '- Simplify checkout process\n' +
                 '- Offer multiple payment options\n' +
                 '- Display shipping costs earlier\n' +
                 '- Add trust signals (reviews, security badges)\n' +
                 '- Implement exit-intent offers',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'stage',
    required: false,
    enum: ['landing', 'product_view', 'add_to_cart', 'checkout', 'purchase'],
    description: 'Filter by specific funnel stage',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Drop-off analysis retrieved successfully',
    type: FunnelDropOffResponseDto,
  })
  async getDropOffAnalysis(
    @Query() query: DateRangeQueryDto & { stage?: string },
  ): Promise<FunnelDropOffResponseDto> {
    return this.analyticsService.getDropOffAnalysis(query);
  }

  /**
   * Get device-specific funnel performance
   * @description Retrieves conversion funnel metrics segmented by device type
   *              for mobile optimization insights.
   * @returns Device-segmented funnel metrics
   */
  @Get('funnel/devices')
  @ApiOperation({
    summary: 'Get device-specific funnel performance',
    description: 'Compares conversion funnel performance across device types:\n\n' +
                 'Device Segments:\n' +
                 '- Mobile (smartphones)\n' +
                 '- Tablet\n' +
                 '- Desktop\n\n' +
                 'Per-Device Metrics:\n' +
                 '- Session count and distribution\n' +
                 '- Conversion rate\n' +
                 '- Average order value\n' +
                 '- Time to convert\n' +
                 '- Stage-by-stage progression\n' +
                 '- Drop-off patterns\n\n' +
                 'Syrian Market Insights:\n' +
                 '- Mobile: 70% traffic, 40% conversions (2.5% rate)\n' +
                 '- Desktop: 25% traffic, 50% conversions (4.8% rate)\n' +
                 '- Tablet: 5% traffic, 10% conversions (3.2% rate)\n\n' +
                 'Mobile Challenges:\n' +
                 '- Slower page load times\n' +
                 '- Complex checkout on small screens\n' +
                 '- Payment method entry friction\n' +
                 '- Form filling difficulties\n\n' +
                 'Optimization Strategies:\n' +
                 '- Implement mobile-first checkout\n' +
                 '- One-click payment options\n' +
                 '- Simplified forms with autofill\n' +
                 '- Progressive web app (PWA) features',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Device funnel metrics retrieved successfully',
    type: DeviceFunnelResponseDto,
  })
  async getDeviceFunnels(
    @Query() query: DateRangeQueryDto,
  ): Promise<DeviceFunnelResponseDto> {
    return this.analyticsService.getDeviceFunnels(query);
  }

  /**
   * Track custom funnel event
   * @description Records a custom funnel event for A/B testing and variant analysis.
   * @param request - Event tracking data
   * @returns Event tracking confirmation
   */
  @Post('funnel/events')
  @ApiOperation({
    summary: 'Track custom funnel event',
    description: 'Records custom funnel events for A/B testing and experimentation:\n\n' +
                 'Event Types:\n' +
                 '- Page view events\n' +
                 '- User interaction events\n' +
                 '- Conversion milestone events\n' +
                 '- Custom business events\n\n' +
                 'A/B Testing Support:\n' +
                 '- Variant assignment (A, B, C, etc.)\n' +
                 '- Automatic statistical significance calculation\n' +
                 '- Real-time variant performance tracking\n' +
                 '- Conversion lift measurement\n\n' +
                 'Use Cases:\n' +
                 '- Test different checkout flows\n' +
                 '- Compare pricing display strategies\n' +
                 '- Evaluate shipping option presentation\n' +
                 '- Measure promotion effectiveness\n\n' +
                 'Request Example:\n' +
                 '```json\n' +
                 '{\n' +
                 '  "sessionId": "sess_abc123",\n' +
                 '  "userId": 456,\n' +
                 '  "eventType": "checkout_initiated",\n' +
                 '  "variant": "express_checkout",\n' +
                 '  "metadata": {\n' +
                 '    "cartValue": 1500000,\n' +
                 '    "itemCount": 3\n' +
                 '  }\n' +
                 '}\n' +
                 '```',
  })
  @ApiBody({
    type: TrackFunnelEventRequestDto,
    description: 'Funnel event data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Funnel event tracked successfully',
    type: TrackFunnelEventResponseDto,
  })
  async trackFunnelEvent(
    @Body() request: TrackFunnelEventRequestDto,
  ): Promise<TrackFunnelEventResponseDto> {
    return this.analyticsService.trackFunnelEvent(request);
  }

  // ===========================================================================
  // CART ABANDONMENT ANALYTICS
  // ===========================================================================

  /**
   * Get cart abandonment rate analytics
   * @description Retrieves cart abandonment metrics and trends.
   * @returns Abandonment rate with trend analysis
   */
  @Get('abandonment/rate')
  @ApiOperation({
    summary: 'Get cart abandonment rate analytics',
    description: 'Analyzes cart abandonment patterns and rates:\n\n' +
                 'Core Metrics:\n' +
                 '- Overall abandonment rate (% of carts abandoned)\n' +
                 '- Total abandoned carts count\n' +
                 '- Average abandoned cart value (SYP)\n' +
                 '- Lost revenue potential\n' +
                 '- Trend over time (daily/weekly/monthly)\n\n' +
                 'Segmentation:\n' +
                 '- By device type\n' +
                 '- By cart value range\n' +
                 '- By user type (guest vs registered)\n' +
                 '- By abandonment stage\n\n' +
                 'Syrian E-commerce Benchmarks:\n' +
                 '- Average abandonment rate: 65-75%\n' +
                 '- Mobile abandonment: 70-80%\n' +
                 '- Desktop abandonment: 55-65%\n' +
                 '- Average abandoned value: 1,200,000 SYP (~$24)\n\n' +
                 'Recovery Opportunity:\n' +
                 '- 15-30% of abandoned carts recoverable\n' +
                 '- Email campaigns: 8-15% recovery rate\n' +
                 '- SMS campaigns: 12-20% recovery rate\n' +
                 '- Retargeting ads: 5-10% recovery rate',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Time granularity for trend analysis',
    example: 'weekly',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Abandonment rate retrieved successfully',
    type: AbandonmentRateResponseDto,
  })
  async getAbandonmentRate(
    @Query() query: DateRangeQueryDto & { granularity?: string },
  ): Promise<AbandonmentRateResponseDto> {
    return this.analyticsService.getAbandonmentRate(query);
  }

  /**
   * Get cart abandonment recovery metrics
   * @description Retrieves metrics on abandonment recovery campaign effectiveness.
   * @returns Recovery campaign performance metrics
   */
  @Get('abandonment/recovery')
  @ApiOperation({
    summary: 'Get cart abandonment recovery metrics',
    description: 'Tracks effectiveness of cart recovery campaigns:\n\n' +
                 'Recovery Metrics:\n' +
                 '- Overall recovery rate (% of abandoned carts recovered)\n' +
                 '- Total recovered revenue (SYP)\n' +
                 '- Average recovery time (hours/days)\n' +
                 '- Campaign-specific performance\n\n' +
                 'Campaign Types:\n' +
                 '1. Email Reminder (1 hour delay)\n' +
                 '   - 8-12% recovery rate\n' +
                 '   - Best for high-value carts\n' +
                 '2. Email with Discount (24 hours delay)\n' +
                 '   - 15-20% recovery rate\n' +
                 '   - 5-10% discount typically used\n' +
                 '3. SMS Reminder (3 hours delay)\n' +
                 '   - 12-18% recovery rate\n' +
                 '   - Higher engagement in Syrian market\n' +
                 '4. Retargeting Ads (48 hours ongoing)\n' +
                 '   - 5-10% recovery rate\n' +
                 '   - Good for brand awareness\n\n' +
                 'Syrian Market Best Practices:\n' +
                 '- SMS more effective than email (lower email usage)\n' +
                 '- WhatsApp integration highly recommended\n' +
                 '- Free shipping offers outperform discounts\n' +
                 '- Timing: 1-3 hours after abandonment optimal\n\n' +
                 'ROI Calculation:\n' +
                 '- Campaign cost vs recovered revenue\n' +
                 '- Cost per recovery\n' +
                 '- Incremental revenue attribution',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'campaignType',
    required: false,
    enum: ['email_reminder', 'email_discount', 'sms_reminder', 'retargeting'],
    description: 'Filter by campaign type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recovery metrics retrieved successfully',
    type: AbandonmentRecoveryResponseDto,
  })
  async getRecoveryMetrics(
    @Query() query: DateRangeQueryDto & { campaignType?: string },
  ): Promise<AbandonmentRecoveryResponseDto> {
    return this.analyticsService.getRecoveryMetrics(query);
  }

  /**
   * Get top cart abandonment reasons
   * @description Retrieves analysis of why customers abandon their carts.
   * @returns Top abandonment reasons with frequency and impact
   */
  @Get('abandonment/reasons')
  @ApiOperation({
    summary: 'Get top cart abandonment reasons',
    description: 'Identifies and ranks cart abandonment reasons:\n\n' +
                 'Reason Categories:\n' +
                 '1. Payment Issues (30-40%)\n' +
                 '   - Limited payment methods\n' +
                 '   - Payment security concerns\n' +
                 '   - Transaction failures\n\n' +
                 '2. Shipping Concerns (20-30%)\n' +
                 '   - High shipping costs\n' +
                 '   - Long delivery times\n' +
                 '   - Limited delivery options\n\n' +
                 '3. Price Factors (15-25%)\n' +
                 '   - Unexpected costs at checkout\n' +
                 '   - Found better prices elsewhere\n' +
                 '   - Budget constraints\n\n' +
                 '4. Technical Issues (10-15%)\n' +
                 '   - Website errors\n' +
                 '   - Slow loading times\n' +
                 '   - Mobile usability problems\n\n' +
                 '5. Trust Issues (8-12%)\n' +
                 '   - Lack of reviews/ratings\n' +
                 '   - Security concerns\n' +
                 '   - Return policy unclear\n\n' +
                 '6. Comparison Shopping (5-10%)\n' +
                 '   - Saving cart for later\n' +
                 '   - Comparing with other sites\n' +
                 '   - Waiting for payday\n\n' +
                 'Syrian Market Specific:\n' +
                 '- Cash-on-delivery preference (major factor)\n' +
                 '- International payment barriers\n' +
                 '- Economic uncertainty impact\n' +
                 '- Limited digital payment adoption\n\n' +
                 'Data Collection Methods:\n' +
                 '- Exit surveys\n' +
                 '- Behavioral analysis\n' +
                 '- Session replay insights\n' +
                 '- Customer feedback',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top reasons to return',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Abandonment reasons retrieved successfully',
    type: AbandonmentReasonsResponseDto,
  })
  async getAbandonmentReasons(
    @Query() query: DateRangeQueryDto & PaginationQueryDto,
  ): Promise<AbandonmentReasonsResponseDto> {
    return this.analyticsService.getAbandonmentReasons(query);
  }

  /**
   * Trigger cart recovery campaign
   * @description Manually triggers recovery campaigns for abandoned carts.
   * @param request - Recovery campaign parameters
   * @returns Campaign trigger confirmation with estimated reach
   */
  @Post('abandonment/trigger-recovery')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per hour
  @ApiOperation({
    summary: 'Trigger cart recovery campaign (Rate Limited)',
    description: 'Manually initiates cart abandonment recovery campaigns.\n\n' +
                 '⚠️ RATE LIMITED: 10 requests per hour\n\n' +
                 'Campaign Configuration:\n' +
                 '- Target selection (all, segment, specific carts)\n' +
                 '- Campaign type (email, SMS, WhatsApp)\n' +
                 '- Timing strategy (immediate, delayed)\n' +
                 '- Incentive offering (discount, free shipping)\n' +
                 '- Personalization options\n\n' +
                 'Targeting Options:\n' +
                 '1. All Abandoned Carts\n' +
                 '   - Triggers for all qualifying abandoned carts\n' +
                 '   - Respects frequency caps\n' +
                 '2. High-Value Carts\n' +
                 '   - Minimum cart value threshold\n' +
                 '   - Priority delivery\n' +
                 '3. Recent Abandonment\n' +
                 '   - Abandoned within last X hours\n' +
                 '   - Higher recovery probability\n' +
                 '4. Repeat Customers\n' +
                 '   - Registered users with purchase history\n' +
                 '   - Personalized messaging\n\n' +
                 'Safety Features:\n' +
                 '- Prevents duplicate campaigns\n' +
                 '- Respects user opt-out preferences\n' +
                 '- Validates cart still exists\n' +
                 '- Checks product availability\n\n' +
                 'Expected Response:\n' +
                 '```json\n' +
                 '{\n' +
                 '  "campaignId": "camp_xyz789",\n' +
                 '  "status": "queued",\n' +
                 '  "targetedCarts": 342,\n' +
                 '  "estimatedDelivery": "2026-01-22T15:30:00Z",\n' +
                 '  "estimatedRecoveryRate": 0.15,\n' +
                 '  "estimatedRevenue": 61500000  // SYP\n' +
                 '}\n' +
                 '```',
  })
  @ApiBody({
    type: TriggerRecoveryRequestDto,
    description: 'Recovery campaign parameters',
    examples: {
      emailDiscount: {
        value: {
          campaignType: 'email_discount',
          targetSegment: 'high_value',
          minCartValue: 1000000,
          discountPercentage: 10,
          delayHours: 24,
        },
        description: 'Email campaign with 10% discount for high-value carts',
      },
      smsReminder: {
        value: {
          campaignType: 'sms_reminder',
          targetSegment: 'recent',
          abandonedWithinHours: 3,
        },
        description: 'SMS reminder for recently abandoned carts',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Recovery campaign triggered successfully',
    type: TriggerRecoveryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
  })
  async triggerRecoveryCampaign(
    @Body() request: TriggerRecoveryRequestDto,
  ): Promise<TriggerRecoveryResponseDto> {
    return this.analyticsService.triggerRecoveryCampaign(request);
  }

  // ===========================================================================
  // COHORT ANALYSIS
  // ===========================================================================

  /**
   * Get retention cohort analysis
   * @description Retrieves customer retention metrics by cohort.
   * @returns Cohort retention data with period-over-period tracking
   */
  @Get('cohorts/retention')
  @ApiOperation({
    summary: 'Get retention cohort analysis',
    description: 'Analyzes customer retention patterns across cohorts:\n\n' +
                 'Cohort Definition:\n' +
                 '- Groups customers by registration/first purchase date\n' +
                 '- Tracks behavior over subsequent periods\n' +
                 '- Compares cohort performance over time\n\n' +
                 'Retention Metrics:\n' +
                 '- Period 0: Initial cohort size (100% baseline)\n' +
                 '- Period 1: Month 1 retention rate\n' +
                 '- Period 2: Month 2 retention rate\n' +
                 '- Period N: Long-term retention\n' +
                 '- Cumulative retention curve\n' +
                 '- Churn rate per period\n\n' +
                 'Cohort Types:\n' +
                 '1. Registration Cohorts\n' +
                 '   - Based on sign-up date\n' +
                 '   - Measures activation and engagement\n' +
                 '2. First Purchase Cohorts\n' +
                 '   - Based on initial transaction\n' +
                 '   - Focuses on repeat purchase behavior\n\n' +
                 'Syrian Market Patterns:\n' +
                 '- Month 1 retention: 25-35%\n' +
                 '- Month 3 retention: 15-25%\n' +
                 '- Month 6 retention: 10-18%\n' +
                 '- Month 12 retention: 8-15%\n\n' +
                 'Insights:\n' +
                 '- Identify strongest cohorts (acquisition channels)\n' +
                 '- Detect retention drop-off points\n' +
                 '- Compare seasonal impact\n' +
                 '- Measure product-market fit improvements',
  })
  @ApiQuery({
    name: 'cohortType',
    required: false,
    enum: ['registration', 'first_purchase'],
    description: 'Type of cohort analysis',
    example: 'first_purchase',
  })
  @ApiQuery({
    name: 'periodType',
    required: false,
    enum: ['weekly', 'monthly', 'quarterly'],
    description: 'Period granularity',
    example: 'monthly',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of cohorts to return',
    example: 12,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retention cohorts retrieved successfully',
    type: CohortRetentionResponseDto,
  })
  async getRetentionCohorts(
    @Query() query: { 
      cohortType?: 'registration' | 'first_purchase';
      periodType?: 'weekly' | 'monthly' | 'quarterly';
      limit?: number;
    },
  ): Promise<CohortRetentionResponseDto> {
    return this.analyticsService.getRetentionCohorts(query);
  }

  /**
   * Get revenue cohort analysis
   * @description Retrieves revenue performance metrics by customer cohort.
   * @returns Cohort revenue data with lifetime value tracking
   */
  @Get('cohorts/revenue')
  @ApiOperation({
    summary: 'Get revenue cohort analysis',
    description: 'Analyzes revenue generation patterns across cohorts:\n\n' +
                 'Revenue Metrics per Cohort:\n' +
                 '- Period 0: Initial revenue (first purchases)\n' +
                 '- Period N: Cumulative revenue over time\n' +
                 '- Average revenue per customer (ARPC)\n' +
                 '- Revenue retention rate\n' +
                 '- Lifetime value (LTV) projection\n\n' +
                 'Analysis Dimensions:\n' +
                 '1. Cohort Revenue Comparison\n' +
                 '   - Which cohorts generate most revenue\n' +
                 '   - Revenue growth trajectory\n' +
                 '   - Peak revenue period identification\n' +
                 '2. ARPC Trends\n' +
                 '   - Average spend per customer\n' +
                 '   - Purchase frequency impact\n' +
                 '   - Order value evolution\n' +
                 '3. LTV Projections\n' +
                 '   - Predicted lifetime value\n' +
                 '   - Payback period calculation\n' +
                 '   - ROI on acquisition costs\n\n' +
                 'Syrian Market Benchmarks:\n' +
                 '- Month 0 ARPC: 800,000-1,200,000 SYP\n' +
                 '- Month 1 cumulative: 1,000,000-1,500,000 SYP\n' +
                 '- Month 6 cumulative: 2,000,000-3,500,000 SYP\n' +
                 '- Month 12 LTV: 2,500,000-5,000,000 SYP\n\n' +
                 'Strategic Applications:\n' +
                 '- Set acquisition budget limits (CAC < LTV)\n' +
                 '- Identify high-value cohort characteristics\n' +
                 '- Optimize marketing channel mix\n' +
                 '- Forecast revenue based on new cohorts',
  })
  @ApiQuery({
    name: 'cohortType',
    required: false,
    enum: ['registration', 'first_purchase'],
  })
  @ApiQuery({
    name: 'periodType',
    required: false,
    enum: ['weekly', 'monthly', 'quarterly'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue cohorts retrieved successfully',
    type: CohortRevenueResponseDto,
  })
  async getRevenueCohorts(
    @Query() query: {
      cohortType?: 'registration' | 'first_purchase';
      periodType?: 'weekly' | 'monthly' | 'quarterly';
      limit?: number;
    },
  ): Promise<CohortRevenueResponseDto> {
    return this.analyticsService.getRevenueCohorts(query);
  }

  /**
   * Get specific cohort details
   * @description Retrieves comprehensive details for a specific customer cohort.
   * @param id - Cohort identifier
   * @returns Detailed cohort analysis with customer list and metrics
   */
  @Get('cohorts/:id')
  @ApiOperation({
    summary: 'Get specific cohort details',
    description: 'Retrieves in-depth analysis for a specific cohort:\n\n' +
                 'Cohort Information:\n' +
                 '- Cohort identifier and name\n' +
                 '- Start/end dates defining cohort period\n' +
                 '- Total customer count\n' +
                 '- Cohort type and period granularity\n\n' +
                 'Detailed Metrics:\n' +
                 '- Retention curve (period-by-period)\n' +
                 '- Revenue curve (cumulative)\n' +
                 '- Customer segment distribution\n' +
                 '- Active vs churned customers\n' +
                 '- Average order frequency\n' +
                 '- Average order value trends\n\n' +
                 'Customer List:\n' +
                 '- Top customers by LTV\n' +
                 '- At-risk customers (churn probability > 0.7)\n' +
                 '- Recently churned customers\n' +
                 '- Most engaged customers\n\n' +
                 'Behavioral Patterns:\n' +
                 '- Product category preferences\n' +
                 '- Purchase timing patterns\n' +
                 '- Channel preferences\n' +
                 '- Response to promotions\n\n' +
                 'Use Cases:\n' +
                 '- Deep-dive investigation of strong/weak cohorts\n' +
                 '- Extract customer lists for targeted campaigns\n' +
                 '- Understand cohort-specific behavior\n' +
                 '- Benchmark against other cohorts',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Cohort identifier (e.g., "2026-01-monthly")',
    example: '2026-01-monthly',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cohort details retrieved successfully',
    type: CohortDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cohort not found',
  })
  async getCohortDetail(
    @Param('id') id: string,
  ): Promise<CohortDetailResponseDto> {
    return this.analyticsService.getCohortDetail(id);
  }

  /**
   * Create custom cohort
   * @description Creates a custom cohort based on specific criteria.
   * @param request - Cohort creation parameters
   * @returns Created cohort details
   */
  @Post('cohorts/create')
  @ApiOperation({
    summary: 'Create custom cohort',
    description: 'Creates custom customer cohorts for targeted analysis:\n\n' +
                 'Cohort Definition Options:\n' +
                 '1. Date Range Cohort\n' +
                 '   - Customers joining/purchasing in specific period\n' +
                 '   - E.g., "Ramadan 2026 shoppers"\n' +
                 '2. Behavior-Based Cohort\n' +
                 '   - Customers matching behavioral criteria\n' +
                 '   - E.g., "High-value mobile shoppers"\n' +
                 '3. Segment Cohort\n' +
                 '   - Based on RFM segments\n' +
                 '   - E.g., "Champions acquired Q1 2026"\n' +
                 '4. Channel Cohort\n' +
                 '   - Grouped by acquisition source\n' +
                 '   - E.g., "Instagram campaign customers"\n\n' +
                 'Cohort Criteria:\n' +
                 '- Date range (start/end)\n' +
                 '- Customer segment filters\n' +
                 '- Minimum purchase value\n' +
                 '- Purchase frequency requirements\n' +
                 '- Product category filters\n' +
                 '- Geographic filters\n' +
                 '- Device type filters\n\n' +
                 'Use Cases:\n' +
                 '- Campaign performance analysis\n' +
                 '- Seasonal behavior tracking\n' +
                 '- Product launch impact assessment\n' +
                 '- Channel ROI measurement\n' +
                 '- Geographic expansion analysis\n\n' +
                 'Example Request:\n' +
                 '```json\n' +
                 '{\n' +
                 '  "name": "Ramadan 2026 Mobile Shoppers",\n' +
                 '  "type": "custom",\n' +
                 '  "criteria": {\n' +
                 '    "startDate": "2026-03-01",\n' +
                 '    "endDate": "2026-03-31",\n' +
                 '    "deviceType": "mobile",\n' +
                 '    "minPurchases": 2\n' +
                 '  }\n' +
                 '}\n' +
                 '```',
  })
  @ApiBody({
    type: CreateCohortRequestDto,
    description: 'Custom cohort parameters',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Custom cohort created successfully',
    type: CreateCohortResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid cohort criteria',
  })
  async createCustomCohort(
    @Body() request: CreateCohortRequestDto,
  ): Promise<CreateCohortResponseDto> {
    return this.analyticsService.createCustomCohort(request);
  }
}
