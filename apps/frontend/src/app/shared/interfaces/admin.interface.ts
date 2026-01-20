/**
 * Core admin panel interfaces used by both the guard and authentication
 * service. The structure matches the enterprise roadmap but keeps the
 * surface minimal for the initial scaffolding phase.
 */

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'customer_service'
  | 'vendor_manager';

export type AdminPermission =
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'orders.view'
  | 'orders.edit'
  | 'orders.cancel'
  | 'orders.refund'
  | 'vendors.view'
  | 'vendors.approve'
  | 'vendors.edit'
  | 'vendors.suspend'
  | 'customers.view'
  | 'customers.edit'
  | 'customers.suspend'
  | 'analytics.view'
  | 'settings.edit'
  | 'users.manage'
  | 'content.edit'
  | 'promotions.manage'
  | 'reports.generate';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  department?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  twoFactorEnabled?: boolean;
}
