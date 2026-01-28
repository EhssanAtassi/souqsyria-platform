/**
 * Permission Tree Building Utilities
 *
 * @description
 * Utility functions for transforming flat permission lists into hierarchical tree structures,
 * filtering trees by search criteria, and managing tree node operations.
 *
 * @module RoleManagement/Components/PermissionSelector/Utils
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { buildPermissionTree, filterPermissionTree } from './permission-tree.utils';
 *
 * const permissions: Permission[] = [...];
 * const tree = buildPermissionTree(permissions);
 * const filtered = filterPermissionTree(tree, 'user');
 * ```
 */

import { Permission } from '../../../models';

// ============================================================================
// TREE NODE INTERFACES
// ============================================================================

/**
 * Permission Tree Node Type
 *
 * @description
 * Discriminated union type for tree nodes.
 */
export type PermissionTreeNodeType = 'category' | 'permission';

/**
 * Permission Tree Node
 *
 * @description
 * Represents a node in the permission tree structure.
 * Can be either a category (expandable) or a permission (leaf).
 */
export interface PermissionTreeNode {
  /** Unique node identifier (category name or permission ID) */
  id: string;

  /** Display name for the node */
  name: string;

  /** Node type discriminator */
  type: PermissionTreeNodeType;

  /** Tree depth level (0 for categories, 1 for permissions) */
  level: number;

  /** Whether node can be expanded (categories only) */
  expandable: boolean;

  /** Child nodes (permissions for categories) */
  children?: PermissionTreeNode[];

  /** Associated permission data (permission nodes only) */
  permission?: Permission;

  /** Category display icon */
  icon?: string;

  /** Number of permissions in category (categories only) */
  count?: number;

  /** Whether node is currently expanded in UI */
  expanded?: boolean;

  /** Whether node is hidden by filter */
  hidden?: boolean;
}

/**
 * Flat Tree Node (for MatTree)
 *
 * @description
 * Flattened version of tree node for Material Tree component.
 */
export interface FlatTreeNode {
  /** Node ID */
  id: string;

  /** Display name */
  name: string;

  /** Node type */
  type: PermissionTreeNodeType;

  /** Tree level */
  level: number;

  /** Is expandable */
  expandable: boolean;

  /** Associated permission */
  permission?: Permission;

  /** Category icon */
  icon?: string;

  /** Permission count */
  count?: number;
}

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

/**
 * Category Display Configuration
 *
 * @description
 * Mapping of category keys to display names and icons.
 */
export interface CategoryConfig {
  displayName: string;
  icon: string;
  color: string;
  description?: string;
}

/**
 * Default Category Configurations
 *
 * @description
 * Pre-defined display settings for common permission categories.
 */
export const DEFAULT_CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  user_management: {
    displayName: 'User Management',
    icon: 'people',
    color: '#2196f3',
    description: 'Permissions related to user operations'
  },
  product_management: {
    displayName: 'Product Management',
    icon: 'inventory',
    color: '#4caf50',
    description: 'Permissions for managing products and inventory'
  },
  order_management: {
    displayName: 'Order Management',
    icon: 'shopping_cart',
    color: '#ff9800',
    description: 'Permissions for processing and managing orders'
  },
  content_management: {
    displayName: 'Content Management',
    icon: 'article',
    color: '#9c27b0',
    description: 'Permissions for managing website content'
  },
  settings_management: {
    displayName: 'Settings Management',
    icon: 'settings',
    color: '#f44336',
    description: 'Permissions for system configuration'
  },
  reports_analytics: {
    displayName: 'Reports & Analytics',
    icon: 'assessment',
    color: '#00bcd4',
    description: 'Permissions for viewing reports and analytics'
  },
  role_management: {
    displayName: 'Role Management',
    icon: 'admin_panel_settings',
    color: '#ff5722',
    description: 'Permissions for managing roles and permissions'
  },
  default: {
    displayName: 'Other Permissions',
    icon: 'lock',
    color: '#757575',
    description: 'Uncategorized permissions'
  }
};

// ============================================================================
// TREE BUILDING FUNCTIONS
// ============================================================================

/**
 * Build Permission Tree from Flat List
 *
 * @description
 * Transforms a flat array of permissions into a hierarchical tree structure
 * grouped by category. Each category becomes a parent node with permissions as children.
 *
 * @param permissions - Flat array of permission objects
 * @param categoryConfig - Optional custom category configurations
 * @returns Hierarchical tree structure with category and permission nodes
 *
 * @example
 * ```typescript
 * const permissions: Permission[] = [
 *   { id: 1, name: 'view_users', category: 'user_management', ... },
 *   { id: 2, name: 'edit_users', category: 'user_management', ... },
 *   { id: 3, name: 'view_products', category: 'product_management', ... }
 * ];
 *
 * const tree = buildPermissionTree(permissions);
 * // Result:
 * // [
 * //   {
 * //     id: 'user_management',
 * //     name: 'User Management',
 * //     type: 'category',
 * //     children: [
 * //       { id: '1', name: 'view_users', type: 'permission', ... },
 * //       { id: '2', name: 'edit_users', type: 'permission', ... }
 * //     ]
 * //   },
 * //   { id: 'product_management', name: 'Product Management', ... }
 * // ]
 * ```
 */
export function buildPermissionTree(
  permissions: Permission[],
  categoryConfig: Record<string, CategoryConfig> = DEFAULT_CATEGORY_CONFIG
): PermissionTreeNode[] {
  // Group permissions by category
  const grouped = groupPermissionsByCategory(permissions);

  // Build category nodes
  const categoryNodes: PermissionTreeNode[] = Object.entries(grouped).map(
    ([categoryKey, categoryPermissions]) => {
      const config = categoryConfig[categoryKey] || categoryConfig['default'];

      return {
        id: categoryKey,
        name: config.displayName,
        type: 'category' as const,
        level: 0,
        expandable: true,
        icon: config.icon,
        count: categoryPermissions.length,
        expanded: false,
        children: categoryPermissions.map(permission =>
          createPermissionNode(permission)
        )
      };
    }
  );

  // Sort categories by display name
  return categoryNodes.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Group Permissions by Category
 *
 * @description
 * Groups permissions into a map where keys are category names
 * and values are arrays of permissions in that category.
 *
 * @param permissions - Array of permissions to group
 * @returns Map of category to permissions
 *
 * @private
 */
function groupPermissionsByCategory(
  permissions: Permission[]
): Record<string, Permission[]> {
  return permissions.reduce((acc, permission) => {
    const category = permission.category || 'default';

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(permission);

    return acc;
  }, {} as Record<string, Permission[]>);
}

/**
 * Create Permission Node
 *
 * @description
 * Creates a tree node for a single permission (leaf node).
 *
 * @param permission - Permission entity
 * @returns Permission tree node
 *
 * @private
 */
function createPermissionNode(permission: Permission): PermissionTreeNode {
  return {
    id: permission.id.toString(),
    name: permission.displayName,
    type: 'permission' as const,
    level: 1,
    expandable: false,
    permission,
    hidden: false
  };
}

// ============================================================================
// TREE FILTERING FUNCTIONS
// ============================================================================

/**
 * Filter Permission Tree by Search Term
 *
 * @description
 * Filters tree nodes based on search term. Searches permission names,
 * display names, descriptions, and categories. Parent categories are shown
 * if any child permissions match.
 *
 * @param tree - Original tree structure
 * @param searchTerm - Search query string
 * @returns Filtered tree with matching nodes
 *
 * @example
 * ```typescript
 * const tree = buildPermissionTree(permissions);
 * const filtered = filterPermissionTree(tree, 'user');
 * // Returns tree with only categories/permissions containing 'user'
 * ```
 */
export function filterPermissionTree(
  tree: PermissionTreeNode[],
  searchTerm: string
): PermissionTreeNode[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return tree;
  }

  const lowerSearch = searchTerm.toLowerCase().trim();

  return tree
    .map(categoryNode => {
      // Filter child permissions
      const filteredChildren =
        categoryNode.children?.filter(permNode =>
          matchesSearchTerm(permNode, lowerSearch)
        ) || [];

      // Include category if it has matching children
      if (filteredChildren.length > 0) {
        return {
          ...categoryNode,
          children: filteredChildren,
          count: filteredChildren.length,
          expanded: true // Auto-expand categories with results
        } as PermissionTreeNode;
      }

      // Check if category itself matches
      if (categoryNode.name.toLowerCase().includes(lowerSearch)) {
        return {
          ...categoryNode,
          expanded: true
        } as PermissionTreeNode;
      }

      return null;
    })
    .filter((node): node is NonNullable<typeof node> => node !== null) as PermissionTreeNode[];
}

/**
 * Check if Node Matches Search Term
 *
 * @description
 * Checks if a tree node matches the search criteria.
 * Searches name, display name, description, and associated permission data.
 *
 * @param node - Tree node to check
 * @param searchTerm - Lowercase search term
 * @returns True if node matches search
 *
 * @private
 */
function matchesSearchTerm(
  node: PermissionTreeNode,
  searchTerm: string
): boolean {
  // Check node name
  if (node.name.toLowerCase().includes(searchTerm)) {
    return true;
  }

  // Check permission data
  if (node.permission) {
    const perm = node.permission;

    return (
      perm.name.toLowerCase().includes(searchTerm) ||
      perm.displayName.toLowerCase().includes(searchTerm) ||
      perm.description.toLowerCase().includes(searchTerm) ||
      perm.resource.toLowerCase().includes(searchTerm) ||
      perm.action.toLowerCase().includes(searchTerm)
    );
  }

  return false;
}

// ============================================================================
// TREE TRAVERSAL FUNCTIONS
// ============================================================================

/**
 * Get All Permission IDs from Tree
 *
 * @description
 * Extracts all permission IDs from the tree structure.
 * Useful for "select all" functionality.
 *
 * @param tree - Permission tree
 * @returns Array of all permission IDs
 *
 * @example
 * ```typescript
 * const tree = buildPermissionTree(permissions);
 * const allIds = getAllPermissionIds(tree);
 * // ['1', '2', '3', '4', ...]
 * ```
 */
export function getAllPermissionIds(tree: PermissionTreeNode[]): string[] {
  const ids: string[] = [];

  tree.forEach(categoryNode => {
    if (categoryNode.children) {
      categoryNode.children.forEach(permNode => {
        if (permNode.type === 'permission' && permNode.id) {
          ids.push(permNode.id);
        }
      });
    }
  });

  return ids;
}

/**
 * Get Permission IDs by Category
 *
 * @description
 * Gets all permission IDs within a specific category.
 * Useful for category-level selection.
 *
 * @param tree - Permission tree
 * @param categoryId - Category identifier
 * @returns Array of permission IDs in category
 *
 * @example
 * ```typescript
 * const ids = getPermissionIdsByCategory(tree, 'user_management');
 * // ['1', '2', '5', '8']
 * ```
 */
export function getPermissionIdsByCategory(
  tree: PermissionTreeNode[],
  categoryId: string
): string[] {
  const category = tree.find(node => node.id === categoryId);

  if (!category || !category.children) {
    return [];
  }

  return category.children
    .filter(node => node.type === 'permission')
    .map(node => node.id);
}

/**
 * Find Node by ID
 *
 * @description
 * Searches tree for a node with the specified ID.
 *
 * @param tree - Permission tree
 * @param nodeId - Node ID to find
 * @returns Found node or undefined
 *
 * @example
 * ```typescript
 * const node = findNodeById(tree, '5');
 * if (node) {
 *   console.log(node.name);
 * }
 * ```
 */
export function findNodeById(
  tree: PermissionTreeNode[],
  nodeId: string
): PermissionTreeNode | undefined {
  for (const categoryNode of tree) {
    if (categoryNode.id === nodeId) {
      return categoryNode;
    }

    if (categoryNode.children) {
      const found = categoryNode.children.find(child => child.id === nodeId);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

// ============================================================================
// SELECTION STATE FUNCTIONS
// ============================================================================

/**
 * Get Category Selection State
 *
 * @description
 * Determines if a category is fully selected, partially selected, or not selected.
 *
 * @param categoryNode - Category tree node
 * @param selectedIds - Set of selected permission IDs
 * @returns Selection state object
 *
 * @example
 * ```typescript
 * const state = getCategorySelectionState(categoryNode, selectedIds);
 * // { checked: false, indeterminate: true }
 * ```
 */
export function getCategorySelectionState(
  categoryNode: PermissionTreeNode,
  selectedIds: Set<string>
): { checked: boolean; indeterminate: boolean } {
  if (!categoryNode.children || categoryNode.children.length === 0) {
    return { checked: false, indeterminate: false };
  }

  const permissionIds = categoryNode.children
    .filter(child => child.type === 'permission')
    .map(child => child.id);

  const selectedCount = permissionIds.filter(id =>
    selectedIds.has(id)
  ).length;

  if (selectedCount === 0) {
    return { checked: false, indeterminate: false };
  }

  if (selectedCount === permissionIds.length) {
    return { checked: true, indeterminate: false };
  }

  return { checked: false, indeterminate: true };
}

/**
 * Get Selected Permissions
 *
 * @description
 * Retrieves full permission objects for selected IDs.
 *
 * @param tree - Permission tree
 * @param selectedIds - Set of selected permission IDs
 * @returns Array of selected permission objects
 *
 * @example
 * ```typescript
 * const selected = getSelectedPermissions(tree, selectedIds);
 * console.log(selected.map(p => p.name));
 * ```
 */
export function getSelectedPermissions(
  tree: PermissionTreeNode[],
  selectedIds: Set<string>
): Permission[] {
  const permissions: Permission[] = [];

  tree.forEach(categoryNode => {
    if (categoryNode.children) {
      categoryNode.children.forEach(permNode => {
        if (
          permNode.type === 'permission' &&
          permNode.permission &&
          selectedIds.has(permNode.id)
        ) {
          permissions.push(permNode.permission);
        }
      });
    }
  });

  return permissions;
}

// ============================================================================
// FLATTEN FUNCTIONS (FOR MATTREE)
// ============================================================================

/**
 * Flatten Tree for MatTree
 *
 * @description
 * Converts hierarchical tree into flat array for Material Tree component.
 * Respects expanded state to only include visible nodes.
 *
 * @param tree - Hierarchical permission tree
 * @param expandedIds - Set of expanded category IDs
 * @returns Flat array of tree nodes
 *
 * @example
 * ```typescript
 * const flatNodes = flattenTree(tree, expandedIds);
 * dataSource.data = flatNodes;
 * ```
 */
export function flattenTree(
  tree: PermissionTreeNode[],
  expandedIds: Set<string>
): FlatTreeNode[] {
  const flatNodes: FlatTreeNode[] = [];

  tree.forEach(categoryNode => {
    // Add category node
    flatNodes.push({
      id: categoryNode.id,
      name: categoryNode.name,
      type: categoryNode.type,
      level: categoryNode.level,
      expandable: categoryNode.expandable,
      icon: categoryNode.icon,
      count: categoryNode.count
    });

    // Add children if expanded
    if (expandedIds.has(categoryNode.id) && categoryNode.children) {
      categoryNode.children.forEach(permNode => {
        flatNodes.push({
          id: permNode.id,
          name: permNode.name,
          type: permNode.type,
          level: permNode.level,
          expandable: permNode.expandable,
          permission: permNode.permission
        });
      });
    }
  });

  return flatNodes;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Permission IDs
 *
 * @description
 * Checks if all provided permission IDs exist in the tree.
 *
 * @param tree - Permission tree
 * @param permissionIds - IDs to validate
 * @returns True if all IDs are valid
 *
 * @example
 * ```typescript
 * const isValid = validatePermissionIds(tree, ['1', '2', '999']);
 * // false (if 999 doesn't exist)
 * ```
 */
export function validatePermissionIds(
  tree: PermissionTreeNode[],
  permissionIds: string[]
): boolean {
  const allIds = new Set(getAllPermissionIds(tree));

  return permissionIds.every(id => allIds.has(id));
}

/**
 * Get Category Display Name
 *
 * @description
 * Gets the display name for a category key.
 *
 * @param categoryKey - Category identifier
 * @param config - Optional custom category config
 * @returns Display name
 */
export function getCategoryDisplayName(
  categoryKey: string,
  config: Record<string, CategoryConfig> = DEFAULT_CATEGORY_CONFIG
): string {
  return config[categoryKey]?.displayName || categoryKey;
}

/**
 * Get Category Icon
 *
 * @description
 * Gets the Material icon name for a category.
 *
 * @param categoryKey - Category identifier
 * @param config - Optional custom category config
 * @returns Material icon name
 */
export function getCategoryIcon(
  categoryKey: string,
  config: Record<string, CategoryConfig> = DEFAULT_CATEGORY_CONFIG
): string {
  return config[categoryKey]?.icon || 'lock';
}

/**
 * Get Category Color
 *
 * @description
 * Gets the color for a category.
 *
 * @param categoryKey - Category identifier
 * @param config - Optional custom category config
 * @returns Hex color code
 */
export function getCategoryColor(
  categoryKey: string,
  config: Record<string, CategoryConfig> = DEFAULT_CATEGORY_CONFIG
): string {
  return config[categoryKey]?.color || '#757575';
}
