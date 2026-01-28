/**
 * @file roles.seed.ts
 * @description Comprehensive Role Seeds for SouqSyria Access Control System
 * Defines both business roles and admin roles for the dual role system
 */

export interface RoleSeedData {
  name: string;
  description: string;
  isDefault: boolean;
  type: 'business' | 'admin';
  permissions: string[];
  priority?: number;
  isSystem?: boolean;
}

/**
 * Business Roles - Primary user functions in the e-commerce platform
 * These represent what the user does as their main activity on the platform
 */
export const BUSINESS_ROLES: RoleSeedData[] = [
  {
    name: 'buyer',
    description: 'Regular customer who browses and purchases products',
    isDefault: true,
    type: 'business',
    permissions: [
      // Basic shopping permissions
      'view_products',
      'view_product_details',
      'search_products',
      'create_orders',
      'view_own_orders',
      'cancel_own_orders',
      'track_shipments',
      'access_mobile_api',
    ],
  },
  {
    name: 'premium_buyer',
    description: 'Premium customer with enhanced features',
    isDefault: false,
    type: 'business',
    permissions: [
      // All buyer permissions plus premium features
      'view_products',
      'view_product_details',
      'search_products',
      'create_orders',
      'view_own_orders',
      'cancel_own_orders',
      'track_shipments',
      'access_mobile_api',
      // Premium-specific
      'view_analytics', // Can see their own purchase analytics
      'export_analytics',
    ],
  },
  {
    name: 'vendor',
    description: 'Established business selling products on the platform',
    isDefault: false,
    type: 'business',
    permissions: [
      // Basic viewing permissions
      'view_products',
      'view_product_details',
      'search_products',

      // Product management
      'create_products',
      'edit_own_products',
      'delete_own_products',
      'bulk_edit_products',
      'import_products',
      'export_products',
      'manage_product_attributes',

      // Order processing
      'view_own_orders',
      'process_orders',
      'update_order_status',
      'ship_orders',
      'process_returns',
      'process_refunds',

      // Inventory management
      'view_inventory',
      'manage_inventory',
      'adjust_inventory',
      'view_inventory_reports',
      'transfer_inventory',

      // Shipping
      'view_shipments',
      'manage_shipments',
      'track_shipments',

      // Analytics
      'view_sales_analytics',
      'view_inventory_analytics',
      'export_analytics',

      // API access
      'access_mobile_api',
      'access_vendor_api',

      // Financial
      'view_payments',
      'view_financial_reports',

      // Marketing
      'create_promotions',
      'manage_coupons',
      'view_marketing_analytics',
    ],
  },
  {
    name: 'seller',
    description: 'Individual seller with limited product management',
    isDefault: false,
    type: 'business',
    permissions: [
      // Basic viewing
      'view_products',
      'view_product_details',
      'search_products',

      // Limited product management
      'create_products',
      'edit_own_products',
      'delete_own_products',

      // Basic order handling
      'view_own_orders',
      'process_orders',
      'update_order_status',
      'ship_orders',

      // Basic inventory
      'view_inventory',
      'manage_inventory',

      // Basic analytics
      'view_sales_analytics',

      // API access
      'access_mobile_api',
    ],
  },
  {
    name: 'supplier',
    description: 'Wholesale supplier providing products to vendors',
    isDefault: false,
    type: 'business',
    permissions: [
      // Product management for wholesale
      'view_products',
      'create_products',
      'edit_own_products',
      'bulk_edit_products',
      'import_products',
      'export_products',

      // Wholesale order management
      'view_own_orders',
      'process_orders',
      'update_order_status',
      'ship_orders',

      // Inventory for wholesale
      'view_inventory',
      'manage_inventory',
      'adjust_inventory',
      'transfer_inventory',
      'manage_warehouses',

      // Financial
      'view_payments',
      'view_financial_reports',

      // Analytics
      'view_sales_analytics',
      'view_inventory_analytics',

      // API
      'access_vendor_api',
    ],
  },
];

/**
 * Admin Roles - Administrative functions that can be assigned on top of business roles
 * These represent additional administrative capabilities
 */
export const ADMIN_ROLES: RoleSeedData[] = [
  {
    name: 'owner',
    description: 'System owner with ultimate authority over all platform operations and data',
    isDefault: false,
    type: 'admin',
    priority: 100,
    isSystem: true,
    permissions: [
      // ==========================================
      // ALL PERMISSIONS - SYSTEM OWNER
      // ==========================================

      // User management - Complete control
      'view_users',
      'view_user_details',
      'edit_users',
      'create_users',
      'delete_users',
      'ban_users',
      'unban_users',
      'suspend_users',
      'verify_users',
      'reset_user_passwords',
      'view_user_analytics',
      'export_users',

      // Role and permission management - Full system control
      'manage_permissions',
      'manage_roles',
      'assign_roles',
      'manage_system_roles',

      // Product management - Complete oversight
      'view_products',
      'view_product_details',
      'search_products',
      'create_products',
      'edit_own_products',
      'edit_all_products',
      'delete_own_products',
      'delete_all_products',
      'approve_products',
      'reject_products',
      'manage_product_categories',
      'manage_product_attributes',
      'bulk_edit_products',
      'import_products',
      'export_products',

      // Order management - Complete control
      'view_own_orders',
      'view_all_orders',
      'create_orders',
      'cancel_own_orders',
      'cancel_all_orders',
      'update_order_status',
      'process_orders',
      'ship_orders',
      'process_returns',
      'process_refunds',
      'view_order_analytics',
      'export_orders',

      // Vendor management - Full oversight
      'view_vendors',
      'approve_vendors',
      'reject_vendors',
      'manage_vendor_verification',
      'view_vendor_analytics',
      'manage_vendor_commissions',
      'process_vendor_payouts',
      'view_vendor_dashboard',
      'manage_vendor_profile',
      'view_vendor_orders',
      'manage_vendor_products',
      'view_vendor_financial_reports',
      'view_vendor_reviews',
      'manage_vendor_shipping',
      'view_vendor_performance_insights',

      // Financial management - Complete control
      'view_payments',
      'process_payments',
      'refund_payments',
      'view_financial_reports',
      'manage_payment_methods',
      'configure_payment_gateways',

      // Shipping & logistics - Full control
      'view_shipments',
      'manage_shipments',
      'track_shipments',
      'manage_shipping_methods',
      'configure_shipping_zones',

      // Inventory management - Complete oversight
      'view_inventory',
      'manage_inventory',
      'adjust_inventory',
      'view_inventory_reports',
      'transfer_inventory',
      'manage_warehouses',

      // Analytics & reporting - Full access
      'view_analytics',
      'view_sales_analytics',
      'view_customer_analytics',
      'view_inventory_analytics',
      'export_analytics',
      'create_custom_reports',

      // Moderation - Complete control
      'moderate_content',
      'approve_reviews',
      'remove_reviews',
      'handle_disputes',
      'manage_complaints',
      'moderate_listings',

      // System administration - FULL SYSTEM CONTROL
      'system_configuration',
      'manage_currencies',
      'manage_taxes',
      'view_system_logs',
      'view_audit_logs',
      'export_audit_logs',
      'backup_system',
      'restore_system',
      'manage_routes',
      'access_admin_panel',
      'delete_system_data',

      // Communication - Full control
      'send_notifications',
      'manage_email_templates',
      'send_marketing_emails',
      'manage_announcements',

      // API management - Complete control
      'access_mobile_api',
      'access_vendor_api',
      'access_admin_api',
      'manage_api_keys',

      // Marketing - Full control
      'create_promotions',
      'manage_coupons',
      'manage_loyalty_programs',
      'view_marketing_analytics',

      // Syrian platform features - Complete control
      'manage_syrian_features',
      'manage_governorates',
      'manage_syrian_payments',
      'manage_syrian_shipping',
      'view_syrian_analytics',
      'manage_syrian_kyc',
      'approve_syrian_kyc',
      'reject_syrian_kyc',
      'view_syrian_kyc_analytics',
      'manage_syrian_manufacturers',
      'approve_syrian_manufacturers',
      'view_syrian_manufacturer_analytics',
      'manage_syrian_refunds',
      'process_syrian_bank_transfers',
      'view_syrian_refund_analytics',
      'manage_syrian_currencies',
      'configure_syrian_tax_settings',
      'manage_arabic_localization',
      'view_diaspora_analytics',
    ],
  },
  {
    name: 'super_admin',
    description: 'Full system administrator with comprehensive permissions',
    isDefault: false,
    type: 'admin',
    priority: 90,
    isSystem: true,
    permissions: [
      // User management
      'view_users',
      'view_user_details',
      'edit_users',
      'create_users',
      'delete_users',
      'ban_users',
      'unban_users',
      'suspend_users',
      'verify_users',
      'reset_user_passwords',
      'view_user_analytics',
      'export_users',

      // Role and permission management
      'manage_permissions',
      'manage_roles',
      'assign_roles',

      // Product oversight
      'view_products',
      'edit_all_products',
      'delete_all_products',
      'approve_products',
      'reject_products',
      'manage_product_categories',
      'bulk_edit_products',

      // Order oversight
      'view_all_orders',
      'cancel_all_orders',
      'update_order_status',
      'process_refunds',
      'view_order_analytics',
      'export_orders',

      // Vendor management
      'view_vendors',
      'approve_vendors',
      'reject_vendors',
      'manage_vendor_verification',
      'view_vendor_analytics',
      'manage_vendor_commissions',
      'process_vendor_payouts',

      // Financial oversight
      'view_payments',
      'process_payments',
      'refund_payments',
      'view_financial_reports',
      'manage_payment_methods',
      'configure_payment_gateways',

      // System administration
      'system_configuration',
      'manage_currencies',
      'manage_taxes',
      'view_system_logs',
      'view_audit_logs',
      'export_audit_logs',
      'backup_system',
      'restore_system',
      'manage_routes',
      'access_admin_panel',

      // Analytics and reporting
      'view_analytics',
      'view_sales_analytics',
      'view_customer_analytics',
      'view_inventory_analytics',
      'export_analytics',
      'create_custom_reports',

      // Moderation
      'moderate_content',
      'approve_reviews',
      'remove_reviews',
      'handle_disputes',
      'manage_complaints',
      'moderate_listings',

      // Communication
      'send_notifications',
      'manage_email_templates',
      'send_marketing_emails',
      'manage_announcements',

      // API management
      'access_admin_api',
      'manage_api_keys',

      // Shipping management
      'manage_shipping_methods',
      'configure_shipping_zones',

      // Syrian features
      'manage_syrian_features',
      'manage_governorates',
      'manage_syrian_payments',
      'manage_syrian_shipping',
      'view_syrian_analytics',
      'manage_syrian_kyc',
      'approve_syrian_kyc',
      'reject_syrian_kyc',
      'view_syrian_kyc_analytics',
      'manage_syrian_manufacturers',
      'approve_syrian_manufacturers',
      'view_syrian_manufacturer_analytics',
      'manage_syrian_refunds',
      'process_syrian_bank_transfers',
      'view_syrian_refund_analytics',
      'manage_syrian_currencies',
      'configure_syrian_tax_settings',
      'manage_arabic_localization',
      'view_diaspora_analytics',
    ],
  },
  {
    name: 'admin',
    description: 'System administrator with most administrative permissions',
    isDefault: false,
    type: 'admin',
    permissions: [
      // User management (limited)
      'view_users',
      'view_user_details',
      'edit_users',
      'ban_users',
      'unban_users',
      'suspend_users',
      'verify_users',
      'view_user_analytics',

      // Role management
      'manage_roles',
      'assign_roles',

      // Product oversight
      'view_products',
      'edit_all_products',
      'approve_products',
      'reject_products',
      'manage_product_categories',

      // Order oversight
      'view_all_orders',
      'cancel_all_orders',
      'update_order_status',
      'process_refunds',
      'view_order_analytics',

      // Vendor management
      'view_vendors',
      'approve_vendors',
      'reject_vendors',
      'manage_vendor_verification',
      'view_vendor_analytics',

      // Analytics
      'view_analytics',
      'view_sales_analytics',
      'view_customer_analytics',
      'export_analytics',

      // Moderation
      'moderate_content',
      'approve_reviews',
      'remove_reviews',
      'handle_disputes',
      'manage_complaints',

      // API access
      'access_admin_api',

      // Syrian features (limited for admin)
      'view_syrian_analytics',
      'manage_syrian_kyc',
      'approve_syrian_kyc',
      'reject_syrian_kyc',
      'view_syrian_kyc_analytics',
      'view_syrian_manufacturer_analytics',
    ],
  },
  {
    name: 'moderator',
    description: 'Content moderator focusing on user-generated content',
    isDefault: false,
    type: 'admin',
    permissions: [
      // Content moderation
      'moderate_content',
      'approve_reviews',
      'remove_reviews',
      'moderate_listings',

      // User management (limited)
      'view_users',
      'view_user_details',
      'ban_users',
      'suspend_users',

      // Product moderation
      'view_products',
      'approve_products',
      'reject_products',

      // Dispute handling
      'handle_disputes',
      'manage_complaints',

      // Order oversight (for dispute resolution)
      'view_all_orders',
      'view_order_analytics',

      // Communication
      'send_notifications',
      'manage_announcements',
    ],
  },
  {
    name: 'staff',
    description: 'Customer support staff with limited administrative access',
    isDefault: false,
    type: 'admin',
    permissions: [
      // Customer support
      'view_users',
      'view_user_details',
      'verify_users',
      'reset_user_passwords',

      // Order support
      'view_all_orders',
      'update_order_status',
      'process_returns',
      'process_refunds',

      // Dispute handling
      'handle_disputes',
      'manage_complaints',

      // Communication
      'send_notifications',

      // Basic analytics
      'view_analytics',
      'view_order_analytics',
      'view_customer_analytics',

      // Product support
      'view_products',
      'view_product_details',
    ],
  },
  {
    name: 'analyst',
    description: 'Data analyst with read-only access to analytics and reports',
    isDefault: false,
    type: 'admin',
    permissions: [
      // Analytics access
      'view_analytics',
      'view_sales_analytics',
      'view_customer_analytics',
      'view_inventory_analytics',
      'view_order_analytics',
      'view_user_analytics',
      'view_vendor_analytics',
      'view_marketing_analytics',
      'view_syrian_analytics',

      // Export capabilities
      'export_analytics',
      'create_custom_reports',

      // Financial reporting
      'view_financial_reports',

      // Read-only access to data
      'view_products',
      'view_users',
      'view_all_orders',
      'view_vendors',
      'view_payments',
      'view_shipments',
      'view_inventory_reports',
    ],
  },
  {
    name: 'marketing_manager',
    description:
      'Marketing manager with promotional and communication permissions',
    isDefault: false,
    type: 'admin',
    permissions: [
      // Marketing and promotions
      'create_promotions',
      'manage_coupons',
      'manage_loyalty_programs',
      'view_marketing_analytics',

      // Communication
      'send_notifications',
      'manage_email_templates',
      'send_marketing_emails',
      'manage_announcements',

      // Analytics for marketing
      'view_analytics',
      'view_customer_analytics',
      'view_sales_analytics',
      'export_analytics',

      // Product insights
      'view_products',
      'view_product_details',

      // User insights
      'view_users',
      'view_user_analytics',
    ],
  },
  {
    name: 'inventory_manager',
    description:
      'Inventory manager with stock and warehouse management permissions',
    isDefault: false,
    type: 'admin',
    permissions: [
      // Inventory management
      'view_inventory',
      'manage_inventory',
      'adjust_inventory',
      'view_inventory_reports',
      'transfer_inventory',
      'manage_warehouses',

      // Product management (inventory perspective)
      'view_products',
      'edit_all_products',
      'bulk_edit_products',
      'import_products',
      'export_products',

      // Shipping coordination
      'view_shipments',
      'manage_shipments',
      'manage_shipping_methods',

      // Analytics
      'view_inventory_analytics',
      'view_sales_analytics',
      'export_analytics',

      // Vendor coordination
      'view_vendors',
      'view_vendor_analytics',
    ],
  },
  {
    name: 'financial_manager',
    description: 'Financial manager with payment and financial oversight',
    isDefault: false,
    type: 'admin',
    permissions: [
      // Payment management
      'view_payments',
      'process_payments',
      'refund_payments',
      'manage_payment_methods',
      'configure_payment_gateways',

      // Financial reporting
      'view_financial_reports',
      'view_sales_analytics',
      'export_analytics',
      'create_custom_reports',

      // Vendor financials
      'view_vendors',
      'view_vendor_analytics',
      'manage_vendor_commissions',
      'process_vendor_payouts',

      // Order financial oversight
      'view_all_orders',
      'view_order_analytics',
      'process_refunds',

      // System financial settings
      'manage_currencies',
      'manage_taxes',

      // Syrian payment features
      'manage_syrian_payments',
      'manage_syrian_refunds',
      'process_syrian_bank_transfers',
      'view_syrian_refund_analytics',
      'manage_syrian_currencies',
      'configure_syrian_tax_settings',
      'view_diaspora_analytics',
    ],
  },
];

/**
 * All roles combined
 */
export const ALL_ROLES: RoleSeedData[] = [...BUSINESS_ROLES, ...ADMIN_ROLES];

/**
 * Helper functions
 */
export function getBusinessRoles(): RoleSeedData[] {
  return BUSINESS_ROLES;
}

export function getAdminRoles(): RoleSeedData[] {
  return ADMIN_ROLES;
}

export function getRoleByName(name: string): RoleSeedData | undefined {
  return ALL_ROLES.find((role) => role.name === name);
}

export function getRolesByType(type: 'business' | 'admin'): RoleSeedData[] {
  return ALL_ROLES.filter((role) => role.type === type);
}

export function getDefaultRoles(): RoleSeedData[] {
  return ALL_ROLES.filter((role) => role.isDefault);
}
