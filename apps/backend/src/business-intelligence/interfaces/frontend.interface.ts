/**
 * @file frontend.interface.ts
 * @description Frontend integration interfaces for Business Intelligence
 * @module BusinessIntelligence/Interfaces
 * 
 * This file contains interfaces specifically designed for frontend integration,
 * including Angular Signal patterns, reactive state management, and UI components.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

import { Observable, Subject } from 'rxjs';
import {
  UserId,
  SessionId,
  ProductId,
  CategoryId,
  MonetaryValue,
  PercentageValue,
  CountValue,
  ScoreValue,
  BIDateRange,
  MetricChange,
} from '../types/core.types';

// =============================================================================
// ANGULAR SIGNAL COMPATIBLE INTERFACES
// =============================================================================

/**
 * Signal-compatible BI state interface
 */
export interface BISignalState<T> {
  /** Current data value */
  readonly data: T | null;
  /** Loading state indicator */
  readonly loading: boolean;
  /** Error state */
  readonly error: Error | null;
  /** Last update timestamp */
  readonly lastUpdated: Date | null;
  /** Data freshness indicator (minutes since last update) */
  readonly freshness: number;
}

/**
 * BI metrics signal state
 */
export interface BIMetricsSignalState extends BISignalState<BIMetricsData> {
  /** Auto-refresh configuration */
  readonly autoRefresh: {
    enabled: boolean;
    interval: number; // seconds
    nextUpdate: Date | null;
  };
  /** Comparison period settings */
  readonly comparison: {
    enabled: boolean;
    period: 'previous_period' | 'same_period_last_year';
  };
}

/**
 * BI metrics data structure for signals
 */
export interface BIMetricsData {
  /** Key performance indicators */
  readonly kpis: Record<string, BIMetricValue>;
  /** Time series data for charts */
  readonly timeSeries: Record<string, BITimeSeriesData>;
  /** Segment breakdowns */
  readonly segments: Record<string, BISegmentData>;
  /** Geographic data */
  readonly geographic: BIGeographicData[];
  /** Insights and recommendations */
  readonly insights: BIInsightData[];
}

/**
 * BI metric value with metadata
 */
export interface BIMetricValue {
  /** Current value */
  readonly value: number;
  /** Formatted display value */
  readonly displayValue: string;
  /** Value unit/currency */
  readonly unit: string;
  /** Change from previous period */
  readonly change: BIMetricChange;
  /** Confidence level (0-100) */
  readonly confidence: ScoreValue;
  /** Data quality indicator */
  readonly quality: 'high' | 'medium' | 'low';
  /** Last calculation timestamp */
  readonly calculatedAt: Date;
}

/**
 * BI metric change information
 */
export interface BIMetricChange {
  /** Absolute change */
  readonly absolute: number;
  /** Percentage change */
  readonly percentage: PercentageValue;
  /** Formatted change display */
  readonly displayText: string;
  /** Trend direction */
  readonly trend: 'up' | 'down' | 'stable';
  /** Change significance */
  readonly significance: 'high' | 'medium' | 'low' | 'none';
  /** CSS class for styling */
  readonly cssClass: string;
}

/**
 * Time series data for charts
 */
export interface BITimeSeriesData {
  /** Series name */
  readonly name: string;
  /** Data points */
  readonly points: BITimeSeriesPoint[];
  /** Chart configuration */
  readonly chartConfig: BIChartConfig;
  /** Y-axis configuration */
  readonly yAxis: BIAxisConfig;
  /** Trend line data */
  readonly trendLine?: BITimeSeriesPoint[];
}

/**
 * Time series data point
 */
export interface BITimeSeriesPoint {
  /** X-axis value (timestamp) */
  readonly x: Date;
  /** Y-axis value */
  readonly y: number;
  /** Formatted display values */
  readonly display: {
    readonly x: string;
    readonly y: string;
  };
  /** Additional data for tooltips */
  readonly metadata?: Record<string, any>;
}

/**
 * Chart configuration for BI visualizations
 */
export interface BIChartConfig {
  /** Chart type */
  readonly type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'heatmap' | 'funnel';
  /** Chart color scheme */
  readonly colors: string[];
  /** Chart dimensions */
  readonly dimensions: {
    readonly width?: number;
    readonly height?: number;
    readonly aspectRatio?: number;
  };
  /** Chart animations */
  readonly animations: {
    readonly enabled: boolean;
    readonly duration: number;
    readonly easing: string;
  };
  /** Chart responsiveness */
  readonly responsive: boolean;
}

/**
 * Chart axis configuration
 */
export interface BIAxisConfig {
  /** Axis label */
  readonly label: string;
  /** Value formatter function name */
  readonly formatter: 'currency' | 'percentage' | 'number' | 'date' | 'custom';
  /** Custom format pattern */
  readonly formatPattern?: string;
  /** Axis range */
  readonly range?: {
    readonly min: number;
    readonly max: number;
  };
  /** Tick configuration */
  readonly ticks: {
    readonly count: number;
    readonly rotation: number;
  };
}

// =============================================================================
// REACTIVE STATE INTERFACES
// =============================================================================

/**
 * BI dashboard state management interface
 */
export interface BIDashboardState {
  /** Dashboard configuration */
  readonly config: BIDashboardConfig;
  /** Widget states */
  readonly widgets: Map<string, BIWidgetState>;
  /** Global filters */
  readonly filters: BIFiltersState;
  /** Layout configuration */
  readonly layout: BILayoutState;
  /** User preferences */
  readonly preferences: BIUserPreferences;
}

/**
 * BI dashboard configuration
 */
export interface BIDashboardConfig {
  /** Dashboard identifier */
  readonly id: string;
  /** Dashboard name */
  readonly name: string;
  /** Dashboard description */
  readonly description: string;
  /** Dashboard type */
  readonly type: 'executive' | 'operational' | 'analytical' | 'custom';
  /** Auto-refresh settings */
  readonly autoRefresh: {
    readonly enabled: boolean;
    readonly interval: number;
  };
  /** Default date range */
  readonly defaultDateRange: BIDateRange;
  /** Permissions */
  readonly permissions: {
    readonly view: boolean;
    readonly edit: boolean;
    readonly share: boolean;
    readonly export: boolean;
  };
}

/**
 * BI widget state
 */
export interface BIWidgetState extends BISignalState<any> {
  /** Widget configuration */
  readonly config: BIWidgetConfig;
  /** Widget size and position */
  readonly layout: BIWidgetLayout;
  /** Widget data source */
  readonly dataSource: BIDataSource;
  /** Interactive state */
  readonly interaction: BIWidgetInteraction;
}

/**
 * BI widget configuration
 */
export interface BIWidgetConfig {
  /** Widget identifier */
  readonly id: string;
  /** Widget type */
  readonly type: 'metric' | 'chart' | 'table' | 'map' | 'funnel' | 'cohort' | 'custom';
  /** Widget title */
  readonly title: string;
  /** Widget subtitle */
  readonly subtitle?: string;
  /** Chart configuration */
  readonly chartConfig?: BIChartConfig;
  /** Display options */
  readonly displayOptions: {
    readonly showLegend: boolean;
    readonly showTooltip: boolean;
    readonly showDataLabels: boolean;
    readonly showComparison: boolean;
  };
  /** Refresh configuration */
  readonly refresh: {
    readonly auto: boolean;
    readonly interval: number;
  };
}

/**
 * BI widget layout information
 */
export interface BIWidgetLayout {
  /** Grid position */
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
  /** Widget size */
  readonly size: {
    readonly width: number;
    readonly height: number;
  };
  /** Minimum size constraints */
  readonly minSize: {
    readonly width: number;
    readonly height: number;
  };
  /** Resizable indicator */
  readonly resizable: boolean;
  /** Draggable indicator */
  readonly draggable: boolean;
  /** Z-index for layering */
  readonly zIndex: number;
}

/**
 * BI data source configuration
 */
export interface BIDataSource {
  /** Data source identifier */
  readonly id: string;
  /** Data source type */
  readonly type: 'api' | 'cached' | 'real_time' | 'calculated';
  /** API endpoint or data source URL */
  readonly endpoint: string;
  /** Query parameters */
  readonly params: Record<string, any>;
  /** Polling configuration */
  readonly polling: {
    readonly enabled: boolean;
    readonly interval: number;
  };
  /** Cache configuration */
  readonly cache: {
    readonly enabled: boolean;
    readonly ttl: number; // seconds
  };
}

/**
 * BI widget interaction state
 */
export interface BIWidgetInteraction {
  /** Selected data points */
  readonly selection: any[];
  /** Hover state */
  readonly hover: any | null;
  /** Drill-down state */
  readonly drillDown: {
    readonly enabled: boolean;
    readonly level: number;
    readonly path: string[];
  };
  /** Export state */
  readonly export: {
    readonly available: boolean;
    readonly formats: string[];
  };
}

// =============================================================================
// FILTERING AND SEARCH INTERFACES
// =============================================================================

/**
 * BI filters state management
 */
export interface BIFiltersState {
  /** Date range filter */
  readonly dateRange: BIDateRangeFilter;
  /** Dimension filters */
  readonly dimensions: Map<string, BIDimensionFilter>;
  /** Search/query filters */
  readonly search: BISearchFilter;
  /** Applied filters summary */
  readonly applied: BIAppliedFilter[];
  /** Filter presets */
  readonly presets: BIFilterPreset[];
}

/**
 * Date range filter
 */
export interface BIDateRangeFilter {
  /** Current date range */
  readonly current: BIDateRange;
  /** Quick selection options */
  readonly quickOptions: BIDateRangeOption[];
  /** Custom range picker state */
  readonly customPicker: {
    readonly open: boolean;
    readonly startDate: Date | null;
    readonly endDate: Date | null;
  };
  /** Comparison settings */
  readonly comparison: {
    readonly enabled: boolean;
    readonly period: BIDateRange;
  };
}

/**
 * Date range quick selection option
 */
export interface BIDateRangeOption {
  /** Option identifier */
  readonly id: string;
  /** Display label */
  readonly label: string;
  /** Date range value */
  readonly value: BIDateRange;
  /** Whether this option is currently selected */
  readonly selected: boolean;
}

/**
 * Dimension filter (e.g., product, category, vendor)
 */
export interface BIDimensionFilter {
  /** Dimension name */
  readonly dimension: string;
  /** Display label */
  readonly label: string;
  /** Filter type */
  readonly type: 'single_select' | 'multi_select' | 'range' | 'search';
  /** Available options */
  readonly options: BIFilterOption[];
  /** Selected values */
  readonly selected: any[];
  /** Search query for filterable options */
  readonly searchQuery: string;
  /** Loading state for dynamic options */
  readonly loading: boolean;
}

/**
 * Filter option
 */
export interface BIFilterOption {
  /** Option value */
  readonly value: any;
  /** Display label */
  readonly label: string;
  /** Option count/frequency */
  readonly count?: number;
  /** Whether option is selected */
  readonly selected: boolean;
  /** Whether option is disabled */
  readonly disabled: boolean;
}

/**
 * Search/query filter
 */
export interface BISearchFilter {
  /** Current search query */
  readonly query: string;
  /** Search suggestions */
  readonly suggestions: string[];
  /** Recent searches */
  readonly recent: string[];
  /** Search scope */
  readonly scope: 'all' | 'customers' | 'products' | 'orders';
  /** Advanced search options */
  readonly advanced: {
    readonly enabled: boolean;
    readonly fields: Record<string, any>;
  };
}

/**
 * Applied filter summary
 */
export interface BIAppliedFilter {
  /** Filter identifier */
  readonly id: string;
  /** Filter dimension */
  readonly dimension: string;
  /** Filter display label */
  readonly label: string;
  /** Filter value(s) */
  readonly value: any;
  /** Display text for filter badge */
  readonly displayText: string;
  /** Whether filter is removable */
  readonly removable: boolean;
}

/**
 * Filter preset configuration
 */
export interface BIFilterPreset {
  /** Preset identifier */
  readonly id: string;
  /** Preset name */
  readonly name: string;
  /** Preset description */
  readonly description: string;
  /** Filter values */
  readonly filters: Record<string, any>;
  /** Whether preset is default */
  readonly isDefault: boolean;
  /** Whether preset is user-created */
  readonly isCustom: boolean;
}

// =============================================================================
// LAYOUT AND UI INTERFACES
// =============================================================================

/**
 * BI dashboard layout state
 */
export interface BILayoutState {
  /** Current layout mode */
  readonly mode: 'view' | 'edit' | 'fullscreen';
  /** Grid configuration */
  readonly grid: BIGridConfig;
  /** Sidebar state */
  readonly sidebar: BISidebarState;
  /** Header state */
  readonly header: BIHeaderState;
  /** Responsive breakpoints */
  readonly breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

/**
 * Grid layout configuration
 */
export interface BIGridConfig {
  /** Grid columns */
  readonly columns: number;
  /** Grid gap/spacing */
  readonly gap: number;
  /** Grid margins */
  readonly margins: {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  };
  /** Auto-fit configuration */
  readonly autoFit: boolean;
}

/**
 * Sidebar state
 */
export interface BISidebarState {
  /** Whether sidebar is open */
  readonly open: boolean;
  /** Sidebar width */
  readonly width: number;
  /** Active sidebar tab */
  readonly activeTab: 'filters' | 'insights' | 'settings' | 'help';
  /** Whether sidebar is collapsible */
  readonly collapsible: boolean;
  /** Sidebar position */
  readonly position: 'left' | 'right';
}

/**
 * Header state
 */
export interface BIHeaderState {
  /** Whether header is visible */
  readonly visible: boolean;
  /** Header height */
  readonly height: number;
  /** Header title */
  readonly title: string;
  /** Whether breadcrumbs are shown */
  readonly showBreadcrumbs: boolean;
  /** Whether actions are shown */
  readonly showActions: boolean;
}

/**
 * BI user preferences
 */
export interface BIUserPreferences {
  /** Theme configuration */
  readonly theme: {
    readonly mode: 'light' | 'dark' | 'auto';
    readonly primaryColor: string;
    readonly accentColor: string;
  };
  /** Default settings */
  readonly defaults: {
    readonly dateRange: string;
    readonly granularity: string;
    readonly currency: string;
    readonly timezone: string;
  };
  /** Notification preferences */
  readonly notifications: {
    readonly enabled: boolean;
    readonly types: string[];
    readonly frequency: 'real_time' | 'hourly' | 'daily';
  };
  /** Display preferences */
  readonly display: {
    readonly density: 'compact' | 'comfortable' | 'spacious';
    readonly animations: boolean;
    readonly tooltips: boolean;
  };
}

// =============================================================================
// EVENT HANDLING INTERFACES
// =============================================================================

/**
 * BI event system interface
 */
export interface BIEventSystem {
  /** Event emitter */
  readonly events$: Subject<BIEvent>;
  /** Event handlers */
  readonly handlers: Map<string, BIEventHandler>;
  /** Event history */
  readonly history: BIEvent[];
}

/**
 * BI event structure
 */
export interface BIEvent {
  /** Event identifier */
  readonly id: string;
  /** Event type */
  readonly type: string;
  /** Event timestamp */
  readonly timestamp: Date;
  /** Event source */
  readonly source: 'user' | 'system' | 'api';
  /** Event payload */
  readonly payload: any;
  /** Event metadata */
  readonly metadata: {
    readonly userId?: UserId;
    readonly sessionId?: SessionId;
    readonly widgetId?: string;
    readonly action?: string;
  };
}

/**
 * BI event handler interface
 */
export interface BIEventHandler {
  /** Handler identifier */
  readonly id: string;
  /** Event types this handler responds to */
  readonly eventTypes: string[];
  /** Handler function */
  readonly handle: (event: BIEvent) => void | Promise<void>;
  /** Handler priority */
  readonly priority: number;
}

// =============================================================================
// SEGMENT AND INSIGHT INTERFACES
// =============================================================================

/**
 * BI segment data
 */
export interface BISegmentData {
  /** Segment identifier */
  readonly id: string;
  /** Segment name */
  readonly name: string;
  /** Segment size */
  readonly size: CountValue;
  /** Segment percentage */
  readonly percentage: PercentageValue;
  /** Segment metrics */
  readonly metrics: Record<string, number>;
  /** Segment color for visualization */
  readonly color: string;
  /** Drill-down capability */
  readonly drillDownEnabled: boolean;
}

/**
 * BI geographic data
 */
export interface BIGeographicData {
  /** Country/region code */
  readonly code: string;
  /** Display name */
  readonly name: string;
  /** Metric value */
  readonly value: number;
  /** Percentage of total */
  readonly percentage: PercentageValue;
  /** Geographic coordinates */
  readonly coordinates?: {
    readonly latitude: number;
    readonly longitude: number;
  };
  /** Additional metrics */
  readonly metrics: Record<string, number>;
}

/**
 * BI insight data
 */
export interface BIInsightData {
  /** Insight identifier */
  readonly id: string;
  /** Insight type */
  readonly type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  /** Insight title */
  readonly title: string;
  /** Insight description */
  readonly description: string;
  /** Insight importance */
  readonly importance: 'high' | 'medium' | 'low';
  /** Insight confidence score */
  readonly confidence: ScoreValue;
  /** Insight impact */
  readonly impact: {
    readonly metric: string;
    readonly value: number;
    readonly direction: 'positive' | 'negative';
  };
  /** Insight actions */
  readonly actions: BIInsightAction[];
  /** Insight timestamp */
  readonly generatedAt: Date;
}

/**
 * BI insight action
 */
export interface BIInsightAction {
  /** Action identifier */
  readonly id: string;
  /** Action label */
  readonly label: string;
  /** Action type */
  readonly type: 'navigate' | 'filter' | 'export' | 'external';
  /** Action configuration */
  readonly config: {
    readonly url?: string;
    readonly filters?: Record<string, any>;
    readonly external?: boolean;
  };
  /** Action availability */
  readonly available: boolean;
}

// =============================================================================
// OBSERVABLES AND REACTIVE INTERFACES
// =============================================================================

/**
 * BI service interface for Angular services
 */
export interface BIService<T> {
  /** Data observable */
  readonly data$: Observable<T>;
  /** Loading state observable */
  readonly loading$: Observable<boolean>;
  /** Error state observable */
  readonly error$: Observable<Error | null>;
  /** Refresh trigger */
  readonly refresh$: Subject<void>;
  /** Configuration */
  readonly config: any;
}

/**
 * BI store interface for state management
 */
export interface BIStore<T> extends BIService<T> {
  /** Current state selector */
  readonly state$: Observable<BISignalState<T>>;
  /** State update method */
  updateState(updater: (state: BISignalState<T>) => BISignalState<T>): void;
  /** Reset state method */
  resetState(): void;
  /** Subscribe to state changes */
  subscribe(observer: (state: BISignalState<T>) => void): () => void;
}