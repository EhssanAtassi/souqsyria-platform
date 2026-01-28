import { Route } from './route.model';

/**
 * Confidence level for auto-mapping suggestions
 * - high: 90-100% confident (exact match)
 * - medium: 70-89% confident (strong pattern match)
 * - low: 50-69% confident (weak pattern match)
 */
export type SuggestionConfidence = 'high' | 'medium' | 'low';

/**
 * Reason why a permission was suggested
 */
export type SuggestionReason =
  | 'exact_naming_match'           // Route path exactly matches permission name
  | 'resource_action_match'        // Follows resource.action pattern
  | 'controller_pattern_match'     // Controller name suggests permission
  | 'http_method_convention'       // HTTP method implies CRUD operation
  | 'similar_route_pattern'        // Similar routes use same permission
  | 'manual_suggestion';           // Manually suggested by admin

/**
 * Suggested permission for a route
 */
export interface PermissionSuggestion {
  /**
   * Permission ID being suggested
   */
  id: string;

  /**
   * Permission name/code
   */
  name: string;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Confidence level classification
   */
  confidenceLevel: SuggestionConfidence;

  /**
   * Explanation for why this permission was suggested
   */
  reason: string;

  /**
   * Specific reason category
   */
  reasonType: SuggestionReason;

  /**
   * Additional context or metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Auto-mapping suggestion for a single route
 */
export interface AutoMappingSuggestion {
  /**
   * Route being mapped
   */
  routeId: string;

  /**
   * Full route data
   */
  route: Route;

  /**
   * Suggested permission details
   */
  suggestedPermission: PermissionSuggestion;

  /**
   * Whether admin has approved this suggestion
   */
  approved: boolean;

  /**
   * Timestamp when suggestion was generated
   */
  generatedAt: Date;

  /**
   * Timestamp when admin approved/rejected
   */
  reviewedAt?: Date;

  /**
   * Admin who reviewed the suggestion
   */
  reviewedBy?: number;
}

/**
 * Result of auto-mapping generation process
 */
export interface AutoMappingResult {
  /**
   * Total number of suggestions generated
   */
  totalSuggestions: number;

  /**
   * Number of high-confidence suggestions
   */
  highConfidenceCount: number;

  /**
   * Number of medium-confidence suggestions
   */
  mediumConfidenceCount: number;

  /**
   * Number of low-confidence suggestions
   */
  lowConfidenceCount: number;

  /**
   * Number of routes without suggestions
   */
  noSuggestionCount: number;

  /**
   * Number of approved suggestions
   */
  approvedCount: number;

  /**
   * Number of mappings actually created
   */
  createdMappings: number;

  /**
   * List of all suggestions
   */
  suggestions: AutoMappingSuggestion[];

  /**
   * Routes that couldn't be mapped
   */
  unmappableRoutes: Route[];

  /**
   * Timestamp when suggestions were generated
   */
  generatedAt: Date;
}

/**
 * Configuration for auto-mapping generation
 */
export interface AutoMappingConfig {
  /**
   * Minimum confidence threshold (0-1)
   * Suggestions below this won't be generated
   * @default 0.5
   */
  minConfidence: number;

  /**
   * Auto-approve high confidence suggestions
   * @default false
   */
  autoApproveHighConfidence: boolean;

  /**
   * Include suggestions for public routes
   * @default false
   */
  includePublicRoutes: boolean;

  /**
   * Prefer existing similar mappings
   * @default true
   */
  useSimilarRoutePatterns: boolean;

  /**
   * Use controller name in suggestion logic
   * @default true
   */
  useControllerContext: boolean;
}

/**
 * Batch operation result for applying mappings
 */
export interface ApplyMappingsResult {
  /**
   * Number of mappings successfully created
   */
  successCount: number;

  /**
   * Number of mappings that failed
   */
  failureCount: number;

  /**
   * Total attempted
   */
  totalAttempted: number;

  /**
   * Detailed results for each mapping
   */
  results: Array<{
    routeId: string;
    success: boolean;
    error?: string;
  }>;

  /**
   * Timestamp when operation completed
   */
  completedAt: Date;
}

/**
 * Default auto-mapping configuration
 */
export const DEFAULT_AUTO_MAPPING_CONFIG: AutoMappingConfig = {
  minConfidence: 0.5,
  autoApproveHighConfidence: false,
  includePublicRoutes: false,
  useSimilarRoutePatterns: true,
  useControllerContext: true
};

/**
 * Get confidence level from score
 * @param confidence Confidence score (0-1)
 * @returns Confidence level classification
 */
export function getConfidenceLevel(confidence: number): SuggestionConfidence {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
}

/**
 * Get color for confidence level
 * @param level Confidence level
 * @returns Material color name
 */
export function getConfidenceLevelColor(level: SuggestionConfidence): string {
  switch (level) {
    case 'high': return 'success';
    case 'medium': return 'accent';
    case 'low': return 'warn';
  }
}

/**
 * Sort suggestions by confidence (highest first)
 * @param suggestions Array of suggestions to sort
 * @returns Sorted array
 */
export function sortSuggestionsByConfidence(
  suggestions: AutoMappingSuggestion[]
): AutoMappingSuggestion[] {
  return [...suggestions].sort(
    (a, b) => b.suggestedPermission.confidence - a.suggestedPermission.confidence
  );
}
