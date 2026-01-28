import {
  Route,
  AutoMappingSuggestion,
  PermissionSuggestion,
  SuggestionReason,
  getConfidenceLevel
} from '../models';
import { Permission } from '../../role-management/models';

/**
 * Configuration for auto-mapping generation
 */
export interface AutoMappingGeneratorConfig {
  /**
   * Minimum confidence threshold (0-1)
   */
  minConfidence: number;

  /**
   * Use controller name in matching logic
   */
  useControllerContext: boolean;

  /**
   * Prefer exact naming matches
   */
  preferExactMatches: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AutoMappingGeneratorConfig = {
  minConfidence: 0.5,
  useControllerContext: true,
  preferExactMatches: true
};

/**
 * Generate permission suggestion for a route
 * Uses naming conventions and pattern matching
 *
 * @param route Route to analyze
 * @param availablePermissions List of available permissions
 * @param config Optional configuration
 * @returns Permission suggestion or null if no match found
 */
export function generatePermissionSuggestion(
  route: Route,
  availablePermissions: Permission[],
  config: Partial<AutoMappingGeneratorConfig> = {}
): PermissionSuggestion | null {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Try exact naming match first
  const exactMatch = findExactMatch(route, availablePermissions);
  if (exactMatch && cfg.preferExactMatches) {
    return createSuggestion(
      exactMatch,
      0.95,
      'Exact match between route pattern and permission name',
      'exact_naming_match'
    );
  }

  // Try resource.action pattern match
  const resourceActionMatch = findResourceActionMatch(route, availablePermissions);
  if (resourceActionMatch) {
    return createSuggestion(
      resourceActionMatch.permission,
      resourceActionMatch.confidence,
      resourceActionMatch.reason,
      'resource_action_match'
    );
  }

  // Try controller-based match
  if (cfg.useControllerContext) {
    const controllerMatch = findControllerMatch(route, availablePermissions);
    if (controllerMatch) {
      return createSuggestion(
        controllerMatch.permission,
        controllerMatch.confidence,
        controllerMatch.reason,
        'controller_pattern_match'
      );
    }
  }

  // Try HTTP method convention
  const methodMatch = findMethodConventionMatch(route, availablePermissions);
  if (methodMatch) {
    return createSuggestion(
      methodMatch.permission,
      methodMatch.confidence,
      methodMatch.reason,
      'http_method_convention'
    );
  }

  // No match found
  return null;
}

/**
 * Find exact permission name match
 * @param route Route to match
 * @param permissions Available permissions
 * @returns Matching permission or null
 */
function findExactMatch(
  route: Route,
  permissions: Permission[]
): Permission | null {
  // Extract resource from path (e.g., /api/users/:id -> users)
  const resource = extractResourceFromPath(route.path);
  if (!resource) return null;

  // Build expected permission name: resource.action
  const action = getActionFromMethod(route.method);
  const expectedName = `${resource}.${action}`;

  return permissions.find(p => p.name.toLowerCase() === expectedName.toLowerCase()) || null;
}

/**
 * Find resource.action pattern match
 * @param route Route to match
 * @param permissions Available permissions
 * @returns Match result or null
 */
function findResourceActionMatch(
  route: Route,
  permissions: Permission[]
): { permission: Permission; confidence: number; reason: string } | null {
  const resource = extractResourceFromPath(route.path);
  if (!resource) return null;

  const action = getActionFromMethod(route.method);

  // Look for permissions that follow resource.action pattern
  const matches = permissions.filter(p => {
    const parts = p.name.split('.');
    if (parts.length !== 2) return false;

    const [permResource, permAction] = parts;
    return (
      permResource.toLowerCase().includes(resource.toLowerCase()) &&
      permAction.toLowerCase() === action.toLowerCase()
    );
  });

  if (matches.length === 0) return null;

  // Prefer exact match, then closest match
  const exactMatch = matches.find(m => m.name.split('.')[0].toLowerCase() === resource.toLowerCase());
  const selectedMatch = exactMatch || matches[0];

  return {
    permission: selectedMatch,
    confidence: exactMatch ? 0.85 : 0.7,
    reason: `Route path '${route.path}' matches resource.action pattern '${selectedMatch.name}'`
  };
}

/**
 * Find match based on controller name
 * @param route Route to match
 * @param permissions Available permissions
 * @returns Match result or null
 */
function findControllerMatch(
  route: Route,
  permissions: Permission[]
): { permission: Permission; confidence: number; reason: string } | null {
  const controllerResource = route.controller
    .replace('Controller', '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  const action = getActionFromMethod(route.method);

  const matches = permissions.filter(p => {
    const parts = p.name.split('.');
    if (parts.length !== 2) return false;

    const [permResource, permAction] = parts;
    return (
      permResource.toLowerCase().includes(controllerResource) &&
      permAction.toLowerCase() === action.toLowerCase()
    );
  });

  if (matches.length === 0) return null;

  return {
    permission: matches[0],
    confidence: 0.65,
    reason: `Controller '${route.controller}' suggests permission '${matches[0].name}'`
  };
}

/**
 * Find match based on HTTP method convention
 * @param route Route to match
 * @param permissions Available permissions
 * @returns Match result or null
 */
function findMethodConventionMatch(
  route: Route,
  permissions: Permission[]
): { permission: Permission; confidence: number; reason: string } | null {
  const resource = extractResourceFromPath(route.path);
  if (!resource) return null;

  const action = getActionFromMethod(route.method);

  // Look for any permission with matching action
  const matches = permissions.filter(p => {
    const parts = p.name.split('.');
    if (parts.length !== 2) return false;
    return parts[1].toLowerCase() === action.toLowerCase();
  });

  if (matches.length === 0) return null;

  // Prefer matches that also have resource similarity
  const bestMatch = matches.find(m =>
    m.name.toLowerCase().includes(resource.toLowerCase())
  ) || matches[0];

  return {
    permission: bestMatch,
    confidence: 0.5,
    reason: `HTTP method '${route.method}' suggests '${action}' action in '${bestMatch.name}'`
  };
}

/**
 * Extract resource name from API path
 * @param path API path (e.g., /api/users/:id)
 * @returns Resource name (e.g., users) or null
 */
function extractResourceFromPath(path: string): string | null {
  // Remove /api prefix if present
  const normalized = path.replace(/^\/api\//i, '');

  // Split by / and take first segment
  const segments = normalized.split('/').filter(s => s && !s.startsWith(':'));

  if (segments.length === 0) return null;

  // Return first non-param segment
  return segments[0].toLowerCase();
}

/**
 * Get CRUD action from HTTP method
 * @param method HTTP method
 * @returns Action name
 */
function getActionFromMethod(method: string): string {
  const actionMap: Record<string, string> = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete'
  };
  return actionMap[method] || 'read';
}

/**
 * Create permission suggestion object
 * @param permission Suggested permission
 * @param confidence Confidence score
 * @param reason Explanation
 * @param reasonType Reason category
 * @returns Permission suggestion
 */
function createSuggestion(
  permission: Permission,
  confidence: number,
  reason: string,
  reasonType: SuggestionReason
): PermissionSuggestion {
  return {
    id: permission.id,
    name: permission.name,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    reason,
    reasonType,
    metadata: {
      permissionDescription: permission.description,
      permissionCategory: permission.module
    }
  };
}

/**
 * Generate suggestions for multiple routes
 * @param routes Routes to analyze
 * @param permissions Available permissions
 * @param config Optional configuration
 * @returns Array of auto-mapping suggestions
 */
export function generateBulkSuggestions(
  routes: Route[],
  permissions: Permission[],
  config: Partial<AutoMappingGeneratorConfig> = {}
): AutoMappingSuggestion[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return routes
    .map(route => {
      // Skip routes that are already mapped or public
      if (route.permissionId || route.isPublic) {
        return null;
      }

      const suggestion = generatePermissionSuggestion(route, permissions, cfg);
      if (!suggestion) return null;

      // Filter by confidence threshold
      if (suggestion.confidence < cfg.minConfidence) {
        return null;
      }

      return {
        routeId: route.id,
        route,
        suggestedPermission: suggestion,
        approved: false,
        generatedAt: new Date()
      };
    })
    .filter((s): s is AutoMappingSuggestion => s !== null);
}

/**
 * Calculate suggestion statistics
 * @param suggestions Array of suggestions
 * @returns Statistics object
 */
export function calculateSuggestionStats(suggestions: AutoMappingSuggestion[]): {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  approved: number;
} {
  return {
    total: suggestions.length,
    highConfidence: suggestions.filter(
      s => s.suggestedPermission.confidenceLevel === 'high'
    ).length,
    mediumConfidence: suggestions.filter(
      s => s.suggestedPermission.confidenceLevel === 'medium'
    ).length,
    lowConfidence: suggestions.filter(
      s => s.suggestedPermission.confidenceLevel === 'low'
    ).length,
    approved: suggestions.filter(s => s.approved).length
  };
}

/**
 * Sort suggestions by confidence (highest first)
 * @param suggestions Suggestions to sort
 * @returns Sorted array
 */
export function sortByConfidence(
  suggestions: AutoMappingSuggestion[]
): AutoMappingSuggestion[] {
  return [...suggestions].sort(
    (a, b) => b.suggestedPermission.confidence - a.suggestedPermission.confidence
  );
}

/**
 * Group suggestions by confidence level
 * @param suggestions Suggestions to group
 * @returns Grouped suggestions
 */
export function groupByConfidenceLevel(
  suggestions: AutoMappingSuggestion[]
): {
  high: AutoMappingSuggestion[];
  medium: AutoMappingSuggestion[];
  low: AutoMappingSuggestion[];
} {
  return {
    high: suggestions.filter(s => s.suggestedPermission.confidenceLevel === 'high'),
    medium: suggestions.filter(s => s.suggestedPermission.confidenceLevel === 'medium'),
    low: suggestions.filter(s => s.suggestedPermission.confidenceLevel === 'low')
  };
}
