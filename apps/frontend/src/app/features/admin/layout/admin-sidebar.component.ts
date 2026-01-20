import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

interface AdminNavItem {
  icon: string;
  label: string;
  route: string;
  section: 'operations' | 'catalog' | 'vendors' | 'insights' | 'system';
}

/**
 * Sidebar navigation inspired by the template layout. This version keeps
 * navigation data local; future phases will hydrate it from the admin
 * navigation service and permission model.
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
  private readonly navItems = signal<AdminNavItem[]>([
    { icon: 'dashboard', label: 'Overview', route: '/admin/dashboard', section: 'operations' },
    { icon: 'inventory_2', label: 'Products', route: '/admin/products', section: 'catalog' },
    { icon: 'category', label: 'Categories', route: '/admin/categories', section: 'catalog' },
    { icon: 'shopping_cart', label: 'Orders', route: '/admin/orders', section: 'operations' },
    { icon: 'local_shipping', label: 'Shipments', route: '/admin/shipments', section: 'operations' },
    { icon: 'storefront', label: 'Vendors', route: '/admin/vendors', section: 'vendors' },
    { icon: 'campaign', label: 'Marketing', route: '/admin/marketing', section: 'vendors' },
    { icon: 'insights', label: 'Analytics', route: '/admin/analytics', section: 'insights' },
    { icon: 'palette', label: 'CMS & Branding', route: '/admin/cms', section: 'insights' },
    { icon: 'admin_panel_settings', label: 'Staff & Roles', route: '/admin/staff', section: 'system' },
    { icon: 'settings', label: 'System Settings', route: '/admin/settings', section: 'system' }
  ]);

  private readonly sectionMeta: Array<{ id: AdminNavItem['section']; label: string }> = [
    { id: 'operations', label: 'Operations' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'vendors', label: 'Vendors & Marketing' },
    { id: 'insights', label: 'Insights' },
    { id: 'system', label: 'System' }
  ];

  readonly sections = computed(() =>
    this.sectionMeta
      .map(section => ({
        ...section,
        items: this.navItems().filter(item => item.section === section.id)
      }))
      .filter(section => section.items.length > 0)
  );
}
