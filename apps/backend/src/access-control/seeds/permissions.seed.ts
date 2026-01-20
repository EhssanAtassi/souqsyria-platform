/**
 * @file permissions.seed.ts
 * @description Comprehensive Permission Seeds for SouqSyria Access Control System
 * Defines all permissions needed for the e-commerce platform
 */

export interface PermissionSeedData {
  name: string;
  description: string;
  category: string;
}

/**
 * Comprehensive permission definitions for SouqSyria platform
 * Organized by functional categories for better management
 */
export const PERMISSION_SEEDS: PermissionSeedData[] = [
  // ===========================================
  // 🛍️ PRODUCT MANAGEMENT PERMISSIONS
  // ===========================================
  {
    name: 'view_products',
    description: 'View product catalog and listings',
    category: 'products',
  },
  {
    name: 'view_product_details',
    description: 'View detailed product information',
    category: 'products',
  },
  {
    name: 'search_products',
    description: 'Search and filter products',
    category: 'products',
  },
  {
    name: 'create_products',
    description: 'Create new products',
    category: 'products',
  },
  {
    name: 'edit_own_products',
    description: 'Edit own products',
    category: 'products',
  },
  {
    name: 'edit_all_products',
    description: 'Edit any product in the system',
    category: 'products',
  },
  {
    name: 'delete_own_products',
    description: 'Delete own products',
    category: 'products',
  },
  {
    name: 'delete_all_products',
    description: 'Delete any product in the system',
    category: 'products',
  },
  {
    name: 'approve_products',
    description: 'Approve products for listing',
    category: 'products',
  },
  {
    name: 'reject_products',
    description: 'Reject product submissions',
    category: 'products',
  },
  {
    name: 'manage_product_categories',
    description: 'Manage product categories',
    category: 'products',
  },
  {
    name: 'manage_product_attributes',
    description: 'Manage product attributes and specifications',
    category: 'products',
  },
  {
    name: 'bulk_edit_products',
    description: 'Bulk edit multiple products',
    category: 'products',
  },
  {
    name: 'import_products',
    description: 'Import products from external sources',
    category: 'products',
  },
  {
    name: 'export_products',
    description: 'Export product data',
    category: 'products',
  },

  // ===========================================
  // 📦 ORDER MANAGEMENT PERMISSIONS
  // ===========================================
  {
    name: 'view_own_orders',
    description: 'View own order history',
    category: 'orders',
  },
  {
    name: 'view_all_orders',
    description: 'View all orders in the system',
    category: 'orders',
  },
  {
    name: 'create_orders',
    description: 'Place new orders',
    category: 'orders',
  },
  {
    name: 'cancel_own_orders',
    description: 'Cancel own orders',
    category: 'orders',
  },
  {
    name: 'cancel_all_orders',
    description: 'Cancel any order in the system',
    category: 'orders',
  },
  {
    name: 'update_order_status',
    description: 'Update order fulfillment status',
    category: 'orders',
  },
  {
    name: 'process_orders',
    description: 'Process and fulfill orders',
    category: 'orders',
  },
  {
    name: 'ship_orders',
    description: 'Mark orders as shipped',
    category: 'orders',
  },
  {
    name: 'process_returns',
    description: 'Process order returns',
    category: 'orders',
  },
  {
    name: 'process_refunds',
    description: 'Process order refunds',
    category: 'orders',
  },
  {
    name: 'view_order_analytics',
    description: 'View order analytics and reports',
    category: 'orders',
  },
  {
    name: 'export_orders',
    description: 'Export order data',
    category: 'orders',
  },

  // ===========================================
  // 👥 USER MANAGEMENT PERMISSIONS
  // ===========================================
  {
    name: 'view_users',
    description: 'View user accounts and profiles',
    category: 'users',
  },
  {
    name: 'view_user_details',
    description: 'View detailed user information',
    category: 'users',
  },
  {
    name: 'edit_users',
    description: 'Edit user profiles and information',
    category: 'users',
  },
  {
    name: 'create_users',
    description: 'Create new user accounts',
    category: 'users',
  },
  {
    name: 'delete_users',
    description: 'Delete user accounts',
    category: 'users',
  },
  {
    name: 'ban_users',
    description: 'Ban user accounts',
    category: 'users',
  },
  {
    name: 'unban_users',
    description: 'Unban user accounts',
    category: 'users',
  },
  {
    name: 'suspend_users',
    description: 'Temporarily suspend user accounts',
    category: 'users',
  },
  {
    name: 'verify_users',
    description: 'Verify user account authenticity',
    category: 'users',
  },
  {
    name: 'reset_user_passwords',
    description: 'Reset user passwords',
    category: 'users',
  },
  {
    name: 'view_user_analytics',
    description: 'View user behavior analytics',
    category: 'users',
  },
  {
    name: 'export_users',
    description: 'Export user data',
    category: 'users',
  },

  // ===========================================
  // 🏪 VENDOR MANAGEMENT PERMISSIONS
  // ===========================================
  {
    name: 'view_vendors',
    description: 'View vendor accounts and profiles',
    category: 'vendors',
  },
  {
    name: 'approve_vendors',
    description: 'Approve vendor applications',
    category: 'vendors',
  },
  {
    name: 'reject_vendors',
    description: 'Reject vendor applications',
    category: 'vendors',
  },
  {
    name: 'manage_vendor_verification',
    description: 'Manage vendor KYC and verification',
    category: 'vendors',
  },
  {
    name: 'view_vendor_analytics',
    description: 'View vendor performance analytics',
    category: 'vendors',
  },
  {
    name: 'manage_vendor_commissions',
    description: 'Manage vendor commission rates',
    category: 'vendors',
  },
  {
    name: 'process_vendor_payouts',
    description: 'Process vendor payments',
    category: 'vendors',
  },

  // ===========================================
  // 🏪 VENDOR DASHBOARD PERMISSIONS
  // ===========================================
  {
    name: 'view_vendor_dashboard',
    description: 'Access vendor dashboard overview with key metrics',
    category: 'vendor_dashboard',
  },
  {
    name: 'view_vendor_analytics',
    description: 'View vendor performance analytics and business insights',
    category: 'vendor_dashboard',
  },
  {
    name: 'manage_vendor_profile',
    description: 'Manage vendor profile and business information',
    category: 'vendor_dashboard',
  },
  {
    name: 'view_vendor_orders',
    description: 'View vendor-specific orders and order history',
    category: 'vendor_dashboard',
  },
  {
    name: 'manage_vendor_products',
    description: 'Manage vendor products (CRUD operations)',
    category: 'vendor_dashboard',
  },
  {
    name: 'view_vendor_financial_reports',
    description: 'View vendor financial reports, commissions, and payouts',
    category: 'vendor_dashboard',
  },
  {
    name: 'view_vendor_reviews',
    description: 'View customer reviews and ratings for vendor',
    category: 'vendor_dashboard',
  },
  {
    name: 'manage_vendor_shipping',
    description: 'Manage shipping methods and delivery settings',
    category: 'vendor_dashboard',
  },
  {
    name: 'view_vendor_performance_insights',
    description: 'View AI-powered performance insights and recommendations',
    category: 'vendor_dashboard',
  },

  // ===========================================
  // 💰 PAYMENT & FINANCIAL PERMISSIONS
  // ===========================================
  {
    name: 'view_payments',
    description: 'View payment transactions',
    category: 'payments',
  },
  {
    name: 'process_payments',
    description: 'Process payment transactions',
    category: 'payments',
  },
  {
    name: 'refund_payments',
    description: 'Issue payment refunds',
    category: 'payments',
  },
  {
    name: 'view_financial_reports',
    description: 'View financial reports and analytics',
    category: 'payments',
  },
  {
    name: 'manage_payment_methods',
    description: 'Manage available payment methods',
    category: 'payments',
  },
  {
    name: 'configure_payment_gateways',
    description: 'Configure payment gateway settings',
    category: 'payments',
  },

  // ===========================================
  // 🚚 SHIPPING & LOGISTICS PERMISSIONS
  // ===========================================
  {
    name: 'view_shipments',
    description: 'View shipment information',
    category: 'shipping',
  },
  {
    name: 'manage_shipments',
    description: 'Manage shipment processing',
    category: 'shipping',
  },
  {
    name: 'track_shipments',
    description: 'Track shipment status',
    category: 'shipping',
  },
  {
    name: 'manage_shipping_methods',
    description: 'Manage available shipping methods',
    category: 'shipping',
  },
  {
    name: 'configure_shipping_zones',
    description: 'Configure shipping zones and rates',
    category: 'shipping',
  },

  // ===========================================
  // 📊 ANALYTICS & REPORTING PERMISSIONS
  // ===========================================
  {
    name: 'view_analytics',
    description: 'View system analytics and metrics',
    category: 'analytics',
  },
  {
    name: 'view_sales_analytics',
    description: 'View sales performance analytics',
    category: 'analytics',
  },
  {
    name: 'view_customer_analytics',
    description: 'View customer behavior analytics',
    category: 'analytics',
  },
  {
    name: 'view_inventory_analytics',
    description: 'View inventory and stock analytics',
    category: 'analytics',
  },
  {
    name: 'export_analytics',
    description: 'Export analytics data',
    category: 'analytics',
  },
  {
    name: 'create_custom_reports',
    description: 'Create custom analytical reports',
    category: 'analytics',
  },

  // ===========================================
  // 🛡️ MODERATION & CONTENT PERMISSIONS
  // ===========================================
  {
    name: 'moderate_content',
    description: 'Moderate user-generated content',
    category: 'moderation',
  },
  {
    name: 'approve_reviews',
    description: 'Approve product reviews',
    category: 'moderation',
  },
  {
    name: 'remove_reviews',
    description: 'Remove inappropriate reviews',
    category: 'moderation',
  },
  {
    name: 'handle_disputes',
    description: 'Handle customer-vendor disputes',
    category: 'moderation',
  },
  {
    name: 'manage_complaints',
    description: 'Manage customer complaints',
    category: 'moderation',
  },
  {
    name: 'moderate_listings',
    description: 'Moderate product listings',
    category: 'moderation',
  },

  // ===========================================
  // ⚙️ SYSTEM ADMINISTRATION PERMISSIONS
  // ===========================================
  {
    name: 'manage_permissions',
    description: 'Manage system permissions',
    category: 'admin',
  },
  {
    name: 'manage_roles',
    description: 'Manage user roles',
    category: 'admin',
  },
  {
    name: 'assign_roles',
    description: 'Assign roles to users',
    category: 'admin',
  },
  {
    name: 'system_configuration',
    description: 'Configure system settings',
    category: 'admin',
  },
  {
    name: 'manage_currencies',
    description: 'Manage currency settings',
    category: 'admin',
  },
  {
    name: 'manage_taxes',
    description: 'Manage tax configurations',
    category: 'admin',
  },
  {
    name: 'view_system_logs',
    description: 'View system logs and audit trails',
    category: 'admin',
  },
  {
    name: 'backup_system',
    description: 'Create system backups',
    category: 'admin',
  },
  {
    name: 'restore_system',
    description: 'Restore system from backups',
    category: 'admin',
  },

  // ===========================================
  // 📧 COMMUNICATION PERMISSIONS
  // ===========================================
  {
    name: 'send_notifications',
    description: 'Send system notifications',
    category: 'communication',
  },
  {
    name: 'manage_email_templates',
    description: 'Manage email templates',
    category: 'communication',
  },
  {
    name: 'send_marketing_emails',
    description: 'Send marketing communications',
    category: 'communication',
  },
  {
    name: 'manage_announcements',
    description: 'Manage system announcements',
    category: 'communication',
  },

  // ===========================================
  // 📱 MOBILE & API PERMISSIONS
  // ===========================================
  {
    name: 'access_mobile_api',
    description: 'Access mobile application API',
    category: 'api',
  },
  {
    name: 'access_vendor_api',
    description: 'Access vendor-specific API endpoints',
    category: 'api',
  },
  {
    name: 'access_admin_api',
    description: 'Access administrative API endpoints',
    category: 'api',
  },
  {
    name: 'manage_api_keys',
    description: 'Manage API keys and access tokens',
    category: 'api',
  },

  // ===========================================
  // 🏷️ INVENTORY & STOCK PERMISSIONS
  // ===========================================
  {
    name: 'view_inventory',
    description: 'View inventory levels and stock',
    category: 'inventory',
  },
  {
    name: 'manage_inventory',
    description: 'Manage inventory and stock levels',
    category: 'inventory',
  },
  {
    name: 'adjust_inventory',
    description: 'Make inventory adjustments',
    category: 'inventory',
  },
  {
    name: 'view_inventory_reports',
    description: 'View inventory reports and analytics',
    category: 'inventory',
  },
  {
    name: 'manage_warehouses',
    description: 'Manage warehouse locations',
    category: 'inventory',
  },
  {
    name: 'transfer_inventory',
    description: 'Transfer inventory between locations',
    category: 'inventory',
  },

  // ===========================================
  // 💝 PROMOTIONS & MARKETING PERMISSIONS
  // ===========================================
  {
    name: 'create_promotions',
    description: 'Create promotional campaigns',
    category: 'marketing',
  },
  {
    name: 'manage_coupons',
    description: 'Manage discount coupons',
    category: 'marketing',
  },
  {
    name: 'manage_loyalty_programs',
    description: 'Manage customer loyalty programs',
    category: 'marketing',
  },
  {
    name: 'view_marketing_analytics',
    description: 'View marketing campaign analytics',
    category: 'marketing',
  },

  // ===========================================
  // 🇸🇾 SYRIAN LOCALIZATION PERMISSIONS
  // ===========================================
  {
    name: 'manage_syrian_features',
    description: 'Manage Syrian-specific features',
    category: 'syrian',
  },
  {
    name: 'manage_governorates',
    description: 'Manage Syrian governorates and regions',
    category: 'syrian',
  },
  {
    name: 'manage_syrian_payments',
    description: 'Manage Syrian payment methods',
    category: 'syrian',
  },
  {
    name: 'manage_syrian_shipping',
    description: 'Manage Syrian shipping companies',
    category: 'syrian',
  },
  {
    name: 'view_syrian_analytics',
    description: 'View Syria-specific analytics',
    category: 'syrian',
  },
  {
    name: 'manage_syrian_kyc',
    description: 'Manage Syrian KYC documents and verification',
    category: 'syrian',
  },
  {
    name: 'approve_syrian_kyc',
    description: 'Approve Syrian KYC submissions',
    category: 'syrian',
  },
  {
    name: 'reject_syrian_kyc',
    description: 'Reject Syrian KYC submissions',
    category: 'syrian',
  },
  {
    name: 'view_syrian_kyc_analytics',
    description: 'View Syrian KYC verification analytics',
    category: 'syrian',
  },
  {
    name: 'manage_syrian_manufacturers',
    description: 'Manage Syrian manufacturer verification',
    category: 'syrian',
  },
  {
    name: 'approve_syrian_manufacturers',
    description: 'Approve Syrian manufacturer applications',
    category: 'syrian',
  },
  {
    name: 'view_syrian_manufacturer_analytics',
    description: 'View Syrian manufacturer performance analytics',
    category: 'syrian',
  },
  {
    name: 'manage_syrian_refunds',
    description: 'Manage Syrian refund processing with banking integration',
    category: 'syrian',
  },
  {
    name: 'process_syrian_bank_transfers',
    description: 'Process Syrian bank transfer refunds',
    category: 'syrian',
  },
  {
    name: 'view_syrian_refund_analytics',
    description: 'View Syrian refund processing analytics',
    category: 'syrian',
  },
  {
    name: 'manage_syrian_currencies',
    description: 'Manage SYP currency and exchange rates',
    category: 'syrian',
  },
  {
    name: 'configure_syrian_tax_settings',
    description: 'Configure Syrian VAT and tax calculations',
    category: 'syrian',
  },
  {
    name: 'manage_arabic_localization',
    description: 'Manage Arabic language and RTL support',
    category: 'syrian',
  },
  {
    name: 'view_diaspora_analytics',
    description: 'View diaspora customer analytics',
    category: 'syrian',
  },
];

/**
 * Get permissions by category
 */
export function getPermissionsByCategory(
  category: string,
): PermissionSeedData[] {
  return PERMISSION_SEEDS.filter(
    (permission) => permission.category === category,
  );
}

/**
 * Get all permission categories
 */
export function getPermissionCategories(): string[] {
  return [
    ...new Set(PERMISSION_SEEDS.map((permission) => permission.category)),
  ];
}

/**
 * Get permission by name
 */
export function getPermissionByName(
  name: string,
): PermissionSeedData | undefined {
  return PERMISSION_SEEDS.find((permission) => permission.name === name);
}
