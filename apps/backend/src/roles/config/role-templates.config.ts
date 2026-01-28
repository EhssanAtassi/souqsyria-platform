/**
 * @file role-templates.config.ts
 * @description Pre-configured role templates for common use cases in SouqSyria e-commerce platform.
 * Templates provide quick role creation with sensible permission defaults.
 *
 * Usage:
 * - Administrators can browse available templates
 * - Select a template and create a role with one click
 * - Templates are blueprints - created roles can be customized afterward
 * - Templates cannot be modified (to ensure consistency)
 *
 * Design principles:
 * - Least privilege: Start with minimal permissions, add as needed
 * - Separation of duties: No template has all permissions
 * - Role clarity: Each template has a specific purpose
 * - Real-world alignment: Based on common organizational structures
 *
 * @author SouqSyria Backend Team
 * @version 1.0.0
 */

/**
 * Interface defining the structure of a role template
 */
export interface RoleTemplate {
  /** Unique identifier for the template */
  id: string;

  /** Display name of the role template */
  name: string;

  /** Detailed description of the role's purpose and responsibilities */
  description: string;

  /** Permission names to assign (not IDs, as they may vary between environments) */
  permissionNames: string[];

  /** Whether this is a default system template (cannot be deleted) */
  isDefault: boolean;

  /** Priority level for the role (used in conflict resolution) */
  priority: number;

  /** Recommended use cases and scenarios */
  useCases?: string[];

  /** Category for organizing templates in UI */
  category: 'support' | 'content' | 'marketing' | 'finance' | 'operations' | 'admin';
}

/**
 * Pre-configured role templates for SouqSyria platform
 *
 * Categories:
 * - Support: Customer service and support staff
 * - Content: Product and content management
 * - Marketing: Campaigns, promotions, and analytics
 * - Finance: Financial operations and reporting
 * - Operations: Warehouse, shipping, and logistics
 * - Admin: Administrative and system management
 */
export const ROLE_TEMPLATES: RoleTemplate[] = [
  /**
   * Customer Support Template
   * Purpose: Handle customer inquiries, orders, and basic user management
   */
  {
    id: 'customer-support',
    name: 'Customer Support',
    description:
      'Customer service representatives who handle inquiries, view orders, and manage basic customer issues. Cannot access financial data or modify products.',
    permissionNames: [
      'view_users', // View customer profiles
      'view_orders', // View order details for support
      'manage_tickets', // Handle support tickets
      'view_products', // Look up product information
      'view_reviews', // View product reviews
    ],
    isDefault: false,
    priority: 30,
    category: 'support',
    useCases: [
      'Responding to customer inquiries',
      'Tracking order status for customers',
      'Managing support tickets',
      'Providing product information',
    ],
  },

  /**
   * Content Manager Template
   * Purpose: Manage product catalog, categories, and content
   */
  {
    id: 'content-manager',
    name: 'Content Manager',
    description:
      'Content team members who manage product listings, categories, brands, and product descriptions. Full control over product catalog without financial access.',
    permissionNames: [
      'manage_products', // Create, edit, delete products
      'manage_categories', // Organize product categories
      'manage_brands', // Manage brand listings
      'view_products', // View product details
      'manage_media', // Upload and manage product images
      'manage_attributes', // Manage product attributes
    ],
    isDefault: false,
    priority: 40,
    category: 'content',
    useCases: [
      'Adding new products to catalog',
      'Updating product descriptions and images',
      'Organizing product categories',
      'Managing brand partnerships',
    ],
  },

  /**
   * Marketing Manager Template
   * Purpose: Campaigns, promotions, analytics, and customer engagement
   */
  {
    id: 'marketing-manager',
    name: 'Marketing Manager',
    description:
      'Marketing team members who create promotions, analyze sales data, and manage email campaigns. Access to analytics and promotional tools.',
    permissionNames: [
      'view_analytics', // Access sales and traffic analytics
      'manage_promotions', // Create discount codes and sales
      'manage_emails', // Send marketing emails
      'view_orders', // View order trends
      'view_users', // Access customer demographics
      'manage_banners', // Manage homepage banners
      'view_reports', // View marketing reports
    ],
    isDefault: false,
    priority: 35,
    category: 'marketing',
    useCases: [
      'Creating promotional campaigns',
      'Analyzing sales performance',
      'Managing email marketing',
      'Tracking customer behavior',
    ],
  },

  /**
   * Finance Manager Template
   * Purpose: Financial operations, refunds, and reporting
   */
  {
    id: 'finance-manager',
    name: 'Finance Manager',
    description:
      'Finance team members who handle refunds, view financial reports, and manage payment-related issues. Full access to financial data.',
    permissionNames: [
      'view_orders', // View all orders and payment details
      'manage_refunds', // Process customer refunds
      'view_reports', // Access financial reports
      'view_payments', // View payment transactions
      'export_financial_data', // Export financial records
      'view_commissions', // View vendor commissions
    ],
    isDefault: false,
    priority: 60,
    category: 'finance',
    useCases: [
      'Processing refunds and returns',
      'Generating financial reports',
      'Reconciling payments',
      'Managing vendor payouts',
    ],
  },

  /**
   * Warehouse Manager Template
   * Purpose: Inventory and logistics management
   */
  {
    id: 'warehouse-manager',
    name: 'Warehouse Manager',
    description:
      'Warehouse and logistics staff who manage inventory, stock levels, and shipments. Focus on operational efficiency.',
    permissionNames: [
      'manage_stock', // Update inventory levels
      'manage_warehouses', // Manage warehouse locations
      'view_shipments', // Track outgoing shipments
      'view_orders', // View orders for fulfillment
      'manage_suppliers', // Manage supplier relationships
      'view_products', // View product details
    ],
    isDefault: false,
    priority: 45,
    category: 'operations',
    useCases: [
      'Managing inventory levels',
      'Processing shipments',
      'Coordinating with suppliers',
      'Optimizing warehouse operations',
    ],
  },

  /**
   * Super Admin Template
   * Purpose: Full system access for platform administrators
   */
  {
    id: 'super-admin',
    name: 'Super Admin',
    description:
      'System administrators with full access to all features and settings. Use with extreme caution and only for trusted personnel.',
    permissionNames: [
      'all_permissions', // Special: Grants all permissions (handled dynamically)
    ],
    isDefault: true,
    priority: 1000,
    category: 'admin',
    useCases: [
      'Full system administration',
      'Emergency access to all features',
      'System configuration',
      'Security management',
    ],
  },

  /**
   * Vendor Manager Template
   * Purpose: Manage vendor accounts and relationships
   */
  {
    id: 'vendor-manager',
    name: 'Vendor Manager',
    description:
      'Vendor relations team who onboard and manage vendor accounts, review vendor products, and handle vendor support.',
    permissionNames: [
      'manage_vendors', // Approve/suspend vendor accounts
      'view_vendors', // View vendor details
      'view_products', // Review vendor products
      'view_commissions', // View vendor commission structure
      'manage_vendor_payouts', // Process vendor payments
    ],
    isDefault: false,
    priority: 50,
    category: 'operations',
    useCases: [
      'Onboarding new vendors',
      'Managing vendor relationships',
      'Processing vendor payments',
      'Reviewing vendor product quality',
    ],
  },

  /**
   * Quality Assurance Template
   * Purpose: Product review and quality control
   */
  {
    id: 'quality-assurance',
    name: 'Quality Assurance',
    description:
      'QA team members who review products, moderate reviews, and ensure content quality standards.',
    permissionNames: [
      'view_products', // Review product listings
      'manage_reviews', // Moderate customer reviews
      'view_vendors', // View vendor information
      'flag_content', // Flag inappropriate content
      'view_reports', // Access quality reports
    ],
    isDefault: false,
    priority: 35,
    category: 'content',
    useCases: [
      'Reviewing product quality',
      'Moderating customer reviews',
      'Ensuring content standards',
      'Flagging policy violations',
    ],
  },

  /**
   * Analytics Specialist Template
   * Purpose: Data analysis and reporting
   */
  {
    id: 'analytics-specialist',
    name: 'Analytics Specialist',
    description:
      'Data analysts who need read-only access to all data for reporting and analysis purposes. No modification permissions.',
    permissionNames: [
      'view_analytics', // Access all analytics dashboards
      'view_reports', // View all reports
      'view_orders', // View order data
      'view_users', // View user demographics
      'view_products', // View product performance
      'export_data', // Export data for analysis
    ],
    isDefault: false,
    priority: 30,
    category: 'marketing',
    useCases: [
      'Generating business intelligence reports',
      'Analyzing sales trends',
      'Customer behavior analysis',
      'Performance metrics tracking',
    ],
  },
];

/**
 * Get all available role templates
 * @returns Array of all role templates
 */
export function getRoleTemplates(): RoleTemplate[] {
  return ROLE_TEMPLATES;
}

/**
 * Get a specific role template by ID
 * @param templateId - Unique template identifier
 * @returns Role template or undefined if not found
 */
export function getRoleTemplateById(templateId: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((template) => template.id === templateId);
}

/**
 * Get role templates by category
 * @param category - Template category to filter by
 * @returns Array of templates in the specified category
 */
export function getRoleTemplatesByCategory(
  category: RoleTemplate['category'],
): RoleTemplate[] {
  return ROLE_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Validate if a template ID exists
 * @param templateId - Template ID to validate
 * @returns True if template exists, false otherwise
 */
export function isValidTemplateId(templateId: string): boolean {
  return ROLE_TEMPLATES.some((template) => template.id === templateId);
}
