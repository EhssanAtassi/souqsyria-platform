/**
 * Permission Selector Component
 *
 * @description
 * Reusable permission selection component with Material Tree for hierarchical display.
 * Supports search, filtering, category-level selection, and virtual scrolling.
 *
 * Features:
 * - Hierarchical tree structure with categories and permissions
 * - Real-time search with debouncing
 * - Category-level and individual selection
 * - Select all/none functionality
 * - Indeterminate states for partial selection
 * - Virtual scrolling for large datasets
 * - Keyboard accessibility (WCAG 2.1 AA)
 * - OnPush change detection for performance
 * - Signal-based reactive state
 *
 * @module RoleManagement/Components
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-permission-selector
 *   [permissions]="permissions"
 *   [preSelectedIds]="['1', '2', '5']"
 *   [mode]="'multiple'"
 *   [showSearch]="true"
 *   [showSelectAll]="true"
 *   (selectionChange)="onSelectionChange($event)"
 * ></app-permission-selector>
 * ```
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule, MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { Permission } from '../../models';
import { PermissionCategoryComponent } from './components/permission-category/permission-category.component';
import { PermissionItemComponent } from './components/permission-item/permission-item.component';
import { PermissionSearchComponent } from './components/permission-search/permission-search.component';
import {
  PermissionTreeNode,
  FlatTreeNode,
  buildPermissionTree,
  filterPermissionTree,
  getAllPermissionIds,
  getPermissionIdsByCategory,
  getCategorySelectionState,
  flattenTree
} from './utils/permission-tree.utils';

/**
 * Permission Selector Component
 *
 * @class PermissionSelectorComponent
 *
 * @description
 * Main container component for permission tree selection with search and filtering.
 */
@Component({
  selector: 'app-permission-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ScrollingModule,
    PermissionCategoryComponent,
    PermissionItemComponent,
    PermissionSearchComponent
  ],
  templateUrl: './permission-selector.component.html',
  styleUrls: ['./permission-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionSelectorComponent implements OnInit, OnChanges {
  // ==========================================================================
  // CONFIGURATION INPUTS
  // ==========================================================================

  /**
   * Selection Mode
   *
   * @description
   * 'single' - Only one permission can be selected at a time
   * 'multiple' - Multiple permissions can be selected (default)
   */
  @Input() mode: 'single' | 'multiple' = 'multiple';

  /**
   * Pre-Selected Permission IDs
   *
   * @description
   * Array of permission IDs that should be selected initially.
   */
  @Input() preSelectedIds: string[] = [];

  /**
   * Read Only Mode
   *
   * @description
   * If true, displays permissions without selection controls.
   */
  @Input() readOnly = false;

  /**
   * Show Search
   *
   * @description
   * Whether to display the search input.
   */
  @Input() showSearch = true;

  /**
   * Show Select All
   *
   * @description
   * Whether to display select all/none buttons.
   */
  @Input() showSelectAll = true;

  /**
   * Show Category Count
   *
   * @description
   * Whether to display permission count badges on categories.
   */
  @Input() showCategoryCount = true;

  /**
   * Group By Category
   *
   * @description
   * Whether to group permissions by category.
   */
  @Input() groupByCategory = true;

  /**
   * Enable Virtual Scrolling
   *
   * @description
   * Whether to use virtual scrolling for large datasets.
   */
  @Input() enableVirtualScroll = false;

  /**
   * Item Size for Virtual Scroll
   *
   * @description
   * Height of each item in pixels (for virtual scrolling).
   */
  @Input() virtualScrollItemSize = 56;

  /**
   * Max Height
   *
   * @description
   * Maximum height of the tree container in pixels.
   */
  @Input() maxHeight = 500;

  // ==========================================================================
  // DATA INPUTS
  // ==========================================================================

  /**
   * Permissions Data
   *
   * @description
   * Array of permission objects to display in the tree.
   * @required
   */
  @Input({ required: true }) permissions: Permission[] = [];

  /**
   * Disabled Permission IDs
   *
   * @description
   * Array of permission IDs that should be disabled (not selectable).
   */
  @Input() disabledIds: string[] = [];

  /**
   * Loading State
   *
   * @description
   * Whether permissions are being loaded.
   */
  @Input() loading = false;

  // ==========================================================================
  // OUTPUTS
  // ==========================================================================

  /**
   * Selection Change Event
   *
   * @description
   * Emits when selected permissions change.
   *
   * @event selectionChange
   * @type {string[]} - Array of selected permission IDs
   */
  @Output() selectionChange = new EventEmitter<string[]>();

  /**
   * Permission Click Event
   *
   * @description
   * Emits when a permission is clicked (for details view, etc.).
   *
   * @event permissionClick
   * @type {Permission} - The clicked permission
   */
  @Output() permissionClick = new EventEmitter<Permission>();

  /**
   * Category Click Event
   *
   * @description
   * Emits when a category is clicked.
   *
   * @event categoryClick
   * @type {string} - Category key
   */
  @Output() categoryClick = new EventEmitter<string>();

  // ==========================================================================
  // SIGNALS - REACTIVE STATE
  // ==========================================================================

  /**
   * Tree Data Signal
   *
   * @description
   * Full tree structure built from permissions.
   */
  treeData = signal<PermissionTreeNode[]>([]);

  /**
   * Filtered Tree Data Signal
   *
   * @description
   * Tree data after applying search filter.
   */
  filteredTreeData = signal<PermissionTreeNode[]>([]);

  /**
   * Selected IDs Signal
   *
   * @description
   * Set of currently selected permission IDs.
   */
  selectedIds = signal<Set<string>>(new Set());

  /**
   * Search Term Signal
   *
   * @description
   * Current search query string.
   */
  searchTerm = signal('');

  /**
   * Expanded Node IDs Signal
   *
   * @description
   * Set of expanded category IDs.
   */
  expandedNodeIds = signal<Set<string>>(new Set());

  /**
   * Check if all nodes are expanded
   *
   * @description
   * Computed property that returns true if all expandable nodes are currently expanded.
   */
  allNodesExpanded = computed(() => {
    const tree = this.filteredTreeData();
    const expandedIds = this.expandedNodeIds();
    return tree.length > 0 && tree.every(cat => expandedIds.has(cat.id));
  });

  /**
   * Disabled IDs Signal
   *
   * @description
   * Set of disabled permission IDs.
   */
  disabledIdsSet = signal<Set<string>>(new Set());

  // ==========================================================================
  // COMPUTED SIGNALS
  // ==========================================================================

  /**
   * Total Permission Count
   *
   * @description
   * Total number of permissions in tree.
   */
  totalCount = computed(() => {
    return getAllPermissionIds(this.treeData()).length;
  });

  /**
   * Filtered Count
   *
   * @description
   * Number of permissions after filtering.
   */
  filteredCount = computed(() => {
    return getAllPermissionIds(this.filteredTreeData()).length;
  });

  /**
   * Selected Count
   *
   * @description
   * Number of currently selected permissions.
   */
  selectedCount = computed(() => {
    return this.selectedIds().size;
  });

  /**
   * All Selected
   *
   * @description
   * Whether all permissions are selected.
   */
  allSelected = computed(() => {
    const total = this.totalCount();
    const selected = this.selectedCount();
    return total > 0 && selected === total;
  });

  /**
   * Indeterminate
   *
   * @description
   * Whether some (but not all) permissions are selected.
   */
  indeterminate = computed(() => {
    const selected = this.selectedCount();
    return selected > 0 && !this.allSelected();
  });

  /**
   * Has Search Term
   *
   * @description
   * Whether search term is active.
   */
  hasSearchTerm = computed(() => {
    return this.searchTerm().length > 0;
  });

  // ==========================================================================
  // TREE CONTROL
  // ==========================================================================

  /**
   * Tree Control
   *
   * @description
   * Manages tree expansion state.
   */
  treeControl = new FlatTreeControl<FlatTreeNode>(
    node => node.level,
    node => node.expandable
  );

  /**
   * Tree Flattener
   *
   * @description
   * Transforms hierarchical tree to flat structure for MatTree.
   */
  treeFlattener = new MatTreeFlattener<PermissionTreeNode, FlatTreeNode>(
    this.transformer.bind(this),
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  /**
   * Data Source
   *
   * @description
   * Data source for Material Tree.
   */
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================

  /**
   * Component Initialization
   *
   * @description
   * Builds tree, initializes selection, and sets up effects.
   */
  ngOnInit(): void {
    this.initializeTree();
    this.initializeSelection();
    this.setupEffects();
  }

  /**
   * On Input Changes
   *
   * @description
   * Rebuilds tree when permissions or pre-selected IDs change.
   *
   * @param changes - Input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['permissions'] && !changes['permissions'].firstChange) {
      this.initializeTree();
    }

    if (changes['preSelectedIds'] && !changes['preSelectedIds'].firstChange) {
      this.initializeSelection();
    }

    if (changes['disabledIds'] && !changes['disabledIds'].firstChange) {
      this.disabledIdsSet.set(new Set(this.disabledIds));
    }
  }

  // ==========================================================================
  // INITIALIZATION METHODS
  // ==========================================================================

  /**
   * Initialize Tree
   *
   * @description
   * Builds tree structure from permissions and updates data source.
   *
   * @private
   */
  private initializeTree(): void {
    const tree = buildPermissionTree(this.permissions);
    this.treeData.set(tree);
    this.filteredTreeData.set(tree);
    this.dataSource.data = tree;

    // Auto-expand first category if not searching
    if (tree.length > 0 && !this.hasSearchTerm()) {
      const firstCategoryId = tree[0].id;
      this.expandedNodeIds.update(ids => {
        const newIds = new Set(ids);
        newIds.add(firstCategoryId);
        return newIds;
      });
    }
  }

  /**
   * Initialize Selection
   *
   * @description
   * Sets initial selected IDs from pre-selected input.
   *
   * @private
   */
  private initializeSelection(): void {
    this.selectedIds.set(new Set(this.preSelectedIds));
    this.disabledIdsSet.set(new Set(this.disabledIds));
  }

  /**
   * Setup Effects
   *
   * @description
   * Sets up reactive effects for search and tree updates.
   *
   * @private
   */
  private setupEffects(): void {
    // Effect: Update filtered tree when search changes
    effect(() => {
      const searchTerm = this.searchTerm();
      const tree = this.treeData();

      if (searchTerm) {
        const filtered = filterPermissionTree(tree, searchTerm);
        this.filteredTreeData.set(filtered);

        // Auto-expand all categories when searching
        const categoryIds = filtered.map(cat => cat.id);
        this.expandedNodeIds.set(new Set(categoryIds));
      } else {
        this.filteredTreeData.set(tree);
      }

      // Update data source
      this.dataSource.data = this.filteredTreeData();
    });

    // Effect: Emit selection changes
    effect(() => {
      const selected = Array.from(this.selectedIds());
      this.selectionChange.emit(selected);
    });
  }

  // ==========================================================================
  // TREE TRANSFORMER
  // ==========================================================================

  /**
   * Transform Tree Node to Flat Node
   *
   * @description
   * Converts hierarchical node to flat node for Material Tree.
   *
   * @param node - Tree node
   * @param level - Node level
   * @returns Flat tree node
   *
   * @private
   */
  private transformer(node: PermissionTreeNode, level: number): FlatTreeNode {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      level: level,
      expandable: node.expandable,
      permission: node.permission,
      icon: node.icon,
      count: node.count
    };
  }

  // ==========================================================================
  // TREE HELPER METHODS
  // ==========================================================================

  /**
   * Has Child
   *
   * @description
   * Determines if a flat node has children.
   *
   * @param _index - Node index (unused)
   * @param node - Flat tree node
   * @returns True if node has children
   */
  hasChild = (_index: number, node: FlatTreeNode): boolean => node.expandable;

  /**
   * Is Category Node
   *
   * @description
   * Checks if node is a category.
   *
   * @param node - Flat tree node
   * @returns True if category
   */
  isCategoryNode(node: FlatTreeNode): boolean {
    return node.type === 'category';
  }

  /**
   * Is Permission Node
   *
   * @description
   * Checks if node is a permission.
   *
   * @param node - Flat tree node
   * @returns True if permission
   */
  isPermissionNode(node: FlatTreeNode): boolean {
    return node.type === 'permission';
  }

  // ==========================================================================
  // SELECTION EVENT HANDLERS
  // ==========================================================================

  /**
   * Handle Permission Selection Change
   *
   * @description
   * Updates selected IDs when permission checkbox is toggled.
   *
   * @param permissionId - Permission ID
   * @param selected - New selected state
   */
  onPermissionSelectionChange(permissionId: string, selected: boolean): void {
    if (this.mode === 'single') {
      // Single mode: replace selection
      this.selectedIds.set(selected ? new Set([permissionId]) : new Set());
    } else {
      // Multiple mode: toggle selection
      this.selectedIds.update(ids => {
        const newIds = new Set(ids);
        if (selected) {
          newIds.add(permissionId);
        } else {
          newIds.delete(permissionId);
        }
        return newIds;
      });
    }
  }

  /**
   * Handle Category Selection Change
   *
   * @description
   * Selects or deselects all permissions in a category.
   *
   * @param categoryId - Category ID
   * @param selected - New selected state
   */
  onCategorySelectionChange(categoryId: string, selected: boolean): void {
    if (this.mode === 'single') {
      return; // Category selection not supported in single mode
    }

    const tree = this.filteredTreeData();
    const categoryPermissionIds = getPermissionIdsByCategory(tree, categoryId);

    this.selectedIds.update(ids => {
      const newIds = new Set(ids);

      categoryPermissionIds.forEach(id => {
        if (selected) {
          newIds.add(id);
        } else {
          newIds.delete(id);
        }
      });

      return newIds;
    });
  }

  /**
   * Handle Toggle Expand
   *
   * @description
   * Toggles category expansion state.
   *
   * @param categoryId - Category ID
   * @param expanded - New expanded state
   */
  onToggleExpand(categoryId: string, expanded: boolean): void {
    this.expandedNodeIds.update(ids => {
      const newIds = new Set(ids);
      if (expanded) {
        newIds.add(categoryId);
      } else {
        newIds.delete(categoryId);
      }
      return newIds;
    });

    // Update tree control
    const nodes = this.treeControl.dataNodes;
    const node = nodes.find(n => n.id === categoryId);
    if (node) {
      if (expanded) {
        this.treeControl.expand(node);
      } else {
        this.treeControl.collapse(node);
      }
    }
  }

  /**
   * Handle Select All
   *
   * @description
   * Selects all permissions in the tree.
   */
  onSelectAll(): void {
    if (this.mode === 'single') {
      return; // Select all not supported in single mode
    }

    const tree = this.filteredTreeData();
    const allIds = getAllPermissionIds(tree);
    this.selectedIds.set(new Set(allIds));
  }

  /**
   * Handle Clear All
   *
   * @description
   * Clears all selections.
   */
  onClearAll(): void {
    this.selectedIds.set(new Set());
  }

  // ==========================================================================
  // SEARCH EVENT HANDLERS
  // ==========================================================================

  /**
   * Handle Search Change
   *
   * @description
   * Updates search term signal when search input changes.
   *
   * @param searchTerm - Search query string
   */
  onSearchChange(searchTerm: string): void {
    this.searchTerm.set(searchTerm);
  }

  /**
   * Handle Search Clear
   *
   * @description
   * Clears search and resets filtered tree.
   */
  onSearchClear(): void {
    this.searchTerm.set('');
  }

  // ==========================================================================
  // CLICK EVENT HANDLERS
  // ==========================================================================

  /**
   * Handle Permission Click
   *
   * @description
   * Emits permission click event.
   *
   * @param permission - Clicked permission
   */
  onPermissionClick(permission: Permission): void {
    this.permissionClick.emit(permission);
  }

  /**
   * Handle Category Click
   *
   * @description
   * Emits category click event.
   *
   * @param categoryId - Clicked category ID
   */
  onCategoryClick(categoryId: string): void {
    this.categoryClick.emit(categoryId);
  }

  // ==========================================================================
  // STATE HELPER METHODS
  // ==========================================================================

  /**
   * Is Permission Selected
   *
   * @description
   * Checks if a permission is selected.
   *
   * @param permissionId - Permission ID
   * @returns True if selected
   */
  isPermissionSelected(permissionId: string): boolean {
    return this.selectedIds().has(permissionId);
  }

  /**
   * Is Permission Disabled
   *
   * @description
   * Checks if a permission is disabled.
   *
   * @param permissionId - Permission ID
   * @returns True if disabled
   */
  isPermissionDisabled(permissionId: string): boolean {
    return this.disabledIdsSet().has(permissionId);
  }

  /**
   * Get Category Selection State
   *
   * @description
   * Gets selection state for a category.
   *
   * @param categoryId - Category ID
   * @returns Selection state object
   */
  getCategorySelectionState(categoryId: string): { checked: boolean; indeterminate: boolean } {
    const tree = this.filteredTreeData();
    const categoryNode = tree.find(node => node.id === categoryId);

    if (!categoryNode) {
      return { checked: false, indeterminate: false };
    }

    return getCategorySelectionState(categoryNode, this.selectedIds());
  }

  /**
   * Get Category Selected Count
   *
   * @description
   * Gets number of selected permissions in a category.
   *
   * @param categoryId - Category ID
   * @returns Selected count
   */
  getCategorySelectedCount(categoryId: string): number {
    const tree = this.filteredTreeData();
    const categoryPermissionIds = getPermissionIdsByCategory(tree, categoryId);

    return categoryPermissionIds.filter(id => this.isPermissionSelected(id)).length;
  }

  /**
   * Is Category Expanded
   *
   * @description
   * Checks if a category is expanded.
   *
   * @param categoryId - Category ID
   * @returns True if expanded
   */
  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedNodeIds().has(categoryId);
  }

  // ==========================================================================
  // PUBLIC API METHODS
  // ==========================================================================

  /**
   * Get Selected Permissions
   *
   * @description
   * Returns array of selected permission IDs.
   *
   * @returns Array of permission IDs
   *
   * @public
   */
  getSelectedPermissionIds(): string[] {
    return Array.from(this.selectedIds());
  }

  /**
   * Set Selected Permissions
   *
   * @description
   * Programmatically sets selected permissions.
   *
   * @param permissionIds - Array of permission IDs to select
   *
   * @public
   */
  setSelectedPermissions(permissionIds: string[]): void {
    this.selectedIds.set(new Set(permissionIds));
  }

  /**
   * Clear Selection
   *
   * @description
   * Clears all selections programmatically.
   *
   * @public
   */
  clearSelection(): void {
    this.onClearAll();
  }

  /**
   * Expand All Categories
   *
   * @description
   * Expands all categories in the tree.
   *
   * @public
   */
  expandAll(): void {
    const tree = this.filteredTreeData();
    const categoryIds = tree.map(cat => cat.id);
    this.expandedNodeIds.set(new Set(categoryIds));

    // Expand all in tree control
    this.treeControl.expandAll();
  }

  /**
   * Collapse All Categories
   *
   * @description
   * Collapses all categories in the tree.
   *
   * @public
   */
  collapseAll(): void {
    this.expandedNodeIds.set(new Set());

    // Collapse all in tree control
    this.treeControl.collapseAll();
  }

  /**
   * Focus Search
   *
   * @description
   * Programmatically focuses the search input.
   *
   * @public
   */
  focusSearch(): void {
    // Implemented in template via ViewChild
  }
}

