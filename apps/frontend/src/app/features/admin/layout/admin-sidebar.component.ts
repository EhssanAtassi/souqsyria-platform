import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

/**
 * Navigation item interface for admin sidebar
 * @description Defines structure for navigation menu items
 */
interface AdminNavItem {
  /** Material icon name */
  icon: string;
  /** Display label */
  label: string;
  /** Navigation route */
  route: string;
  /** Section grouping */
  section: 'operations' | 'catalog' | 'vendors' | 'insights' | 'system';
  /** Optional child items for expandable menus */
  children?: AdminNavChildItem[];
  /** Whether the item is expandable */
  expandable?: boolean;
}

/**
 * Child navigation item for expandable menus
 * @description Defines structure for submenu items
 */
interface AdminNavChildItem {
  /** Material icon name */
  icon: string;
  /** Display label */
  label: string;
  /** Navigation route */
  route: string;
  /** Optional badge text or count */
  badge?: string;
  /** Badge color theme */
  badgeColor?: 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * Sidebar navigation inspired by the template layout. This version keeps
 * navigation data local; future phases will hydrate it from the admin
 * navigation service and permission model.
 *
 * @description Features:
 *              - Grouped navigation sections
 *              - Expandable submenu support for BI Analytics
 *              - Active route highlighting
 *              - Role-based visibility (future)
 */
@Component({
  standalone: true,
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive]
})
export class AdminSidebarComponent {
  /**
   * Track expanded menu items
   */
  readonly expandedItems = signal<Set<string>>(new Set());

  /**
   * Main navigation items configuration
   * @description Organized by section with optional expandable children
   */
  private readonly navItems = signal<AdminNavItem[]>([
    // Operations Section
    { icon: 'dashboard', label: 'Overview', route: '/admin/dashboard', section: 'operations' },
    { icon: 'shopping_cart', label: 'Orders', route: '/admin/orders', section: 'operations' },
    { icon: 'local_shipping', label: 'Shipments', route: '/admin/shipments', section: 'operations' },

    // Catalog Section
    { icon: 'inventory_2', label: 'Products', route: '/admin/products', section: 'catalog' },
    { icon: 'category', label: 'Categories', route: '/admin/categories', section: 'catalog' },

    // Vendors Section
    { icon: 'storefront', label: 'Vendors', route: '/admin/vendors', section: 'vendors' },
    { icon: 'campaign', label: 'Marketing', route: '/admin/marketing', section: 'vendors' },

    // Insights Section - Analytics with BI submenu
    {
      icon: 'insights',
      label: 'Analytics',
      route: '/admin/analytics',
      section: 'insights',
      expandable: true,
      children: [
        { icon: 'show_chart', label: 'Sales Dashboard', route: '/admin/analytics', badge: '' },
        { icon: 'people', label: 'User Analytics', route: '/admin/analytics/users' },
        { icon: 'receipt_long', label: 'Commissions', route: '/admin/analytics/commissions' },
        { icon: 'download', label: 'Export Manager', route: '/admin/analytics/exports' },
        { icon: 'analytics', label: 'BI Dashboard', route: '/admin/analytics/bi', badge: 'NEW', badgeColor: 'primary' },
        { icon: 'loyalty', label: 'CLV Analytics', route: '/admin/analytics/bi/clv' },
        { icon: 'filter_alt', label: 'Conversion Funnel', route: '/admin/analytics/bi/funnel' },
        { icon: 'remove_shopping_cart', label: 'Cart Abandonment', route: '/admin/analytics/bi/abandonment' },
        { icon: 'groups', label: 'Cohort Analysis', route: '/admin/analytics/bi/cohort' }
      ]
    },
    { icon: 'palette', label: 'CMS & Branding', route: '/admin/cms', section: 'insights' },

    // System Section
    { icon: 'admin_panel_settings', label: 'Staff & Roles', route: '/admin/staff', section: 'system' },
    { icon: 'settings', label: 'System Settings', route: '/admin/settings', section: 'system' }
  ]);

  /**
   * Section metadata for grouping navigation items
   */
  private readonly sectionMeta: Array<{ id: AdminNavItem['section']; label: string }> = [
    { id: 'operations', label: 'Operations' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'vendors', label: 'Vendors & Marketing' },
    { id: 'insights', label: 'Insights' },
    { id: 'system', label: 'System' }
  ];

  /**
   * Computed sections with filtered navigation items
   */
  readonly sections = computed(() =>
    this.sectionMeta
      .map(section => ({
        ...section,
        items: this.navItems().filter(item => item.section === section.id)
      }))
      .filter(section => section.items.length > 0)
  );

  /**
   * Toggle expanded state for an item
   * @param itemLabel - The label of the item to toggle
   */
  toggleExpanded(itemLabel: string): void {
    const current = this.expandedItems();
    const updated = new Set(current);

    if (updated.has(itemLabel)) {
      updated.delete(itemLabel);
    } else {
      updated.add(itemLabel);
    }

    this.expandedItems.set(updated);
  }

  /**
   * Check if an item is expanded
   * @param itemLabel - The label to check
   * @returns Whether the item is expanded
   */
  isExpanded(itemLabel: string): boolean {
    return this.expandedItems().has(itemLabel);
  }
}
