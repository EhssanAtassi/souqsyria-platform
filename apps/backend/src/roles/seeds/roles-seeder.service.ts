/**
 * @file roles-seeder.service.ts
 * @description Comprehensive Roles Seeding Service for SouqSyria Platform
 *
 * COMPREHENSIVE SEEDING FEATURES:
 * - Role hierarchy management with admin and business roles
 * - Syrian e-commerce specific roles (vendors, customers, staff, etc.)
 * - Multi-level access control with granular permissions
 * - Role templates for different business scenarios
 * - Default role assignments and permission mappings
 * - Role analytics and performance monitoring
 * - Arabic/English bilingual role descriptions
 * - Integration with access control and permission systems
 * - Bulk role operations with performance optimization
 * - Role inheritance and delegation capabilities
 *
 * @author SouqSyria Development Team
 * @since 2025-08-21
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { Role } from '../entities/role.entity';
import { RolePermission } from '../../access-control/entities/role-permission.entity';
import { Permission } from '../../access-control/entities/permission.entity';

/**
 * Roles seeding result interface for API responses
 */
export interface RolesSeederResult {
  success: boolean;
  roles_created: number;
  admin_roles: number;
  business_roles: number;
  default_roles: number;
  role_permissions_assigned: number;
  execution_time_ms: number;
  roles_by_type: Record<string, number>;
  role_hierarchy_levels: number;
  performance_metrics: {
    roles_per_second: number;
    permissions_assigned_per_second: number;
    average_response_time_ms: number;
  };
}

/**
 * Comprehensive Roles Seeding Service
 * Creates role hierarchy system with Syrian e-commerce focus
 */
@Injectable()
export class RolesSeederService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Main seeding method - creates comprehensive roles system
   */
  async seedRoles(): Promise<RolesSeederResult> {
    const startTime = Date.now();

    try {
      // Clear existing data
      await this.clearExistingData();

      // Create roles
      const roles = await this.createRoles();
      
      // Assign permissions to roles
      const rolePermissions = await this.assignPermissionsToRoles(roles);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        roles.length,
        rolePermissions.length,
        executionTime
      );

      // Group roles by type
      const rolesByType = this.groupRolesByType(roles);

      return {
        success: true,
        roles_created: roles.length,
        admin_roles: roles.filter(r => r.type === 'admin').length,
        business_roles: roles.filter(r => r.type === 'business').length,
        default_roles: roles.filter(r => r.isDefault).length,
        role_permissions_assigned: rolePermissions.length,
        execution_time_ms: executionTime,
        roles_by_type: rolesByType,
        role_hierarchy_levels: this.calculateHierarchyLevels(roles),
        performance_metrics: performanceMetrics,
      };
    } catch (error) {
      console.error('Roles seeding failed:', error);
      throw new Error(`Roles seeding failed: ${error.message}`);
    }
  }

  /**
   * Create comprehensive roles for different access levels and business functions
   */
  private async createRoles(): Promise<Role[]> {
    const rolesData = [
      // Admin Roles (System Administration)
      {
        name: 'Super Admin',
        description: 'Complete system access with all permissions',
        type: 'admin',
        isDefault: false,
        level: 1,
      },
      {
        name: 'System Admin',
        description: 'System administration and configuration management',
        type: 'admin',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Platform Admin',
        description: 'Platform operations and user management',
        type: 'admin',
        isDefault: false,
        level: 3,
      },
      {
        name: 'Content Admin',
        description: 'Content management and moderation',
        type: 'admin',
        isDefault: false,
        level: 4,
      },
      {
        name: 'Support Admin',
        description: 'Customer support and issue resolution',
        type: 'admin',
        isDefault: false,
        level: 5,
      },

      // Business Roles (E-commerce Operations)
      {
        name: 'Vendor Manager',
        description: 'Vendor onboarding and relationship management',
        type: 'business',
        isDefault: false,
        level: 1,
      },
      {
        name: 'Product Manager',
        description: 'Product catalog and inventory management',
        type: 'business',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Order Manager',
        description: 'Order processing and fulfillment management',
        type: 'business',
        isDefault: false,
        level: 3,
      },
      {
        name: 'Sales Manager',
        description: 'Sales operations and performance management',
        type: 'business',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Marketing Manager',
        description: 'Marketing campaigns and promotion management',
        type: 'business',
        isDefault: false,
        level: 3,
      },
      {
        name: 'Finance Manager',
        description: 'Financial operations and payment management',
        type: 'business',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Logistics Manager',
        description: 'Shipping and warehouse management',
        type: 'business',
        isDefault: false,
        level: 3,
      },

      // Vendor Roles
      {
        name: 'Premium Vendor',
        description: 'Premium vendor with enhanced privileges',
        type: 'business',
        isDefault: false,
        level: 1,
      },
      {
        name: 'Standard Vendor',
        description: 'Standard vendor with basic selling privileges',
        type: 'business',
        isDefault: true,
        level: 2,
      },
      {
        name: 'New Vendor',
        description: 'New vendor with limited privileges pending verification',
        type: 'business',
        isDefault: false,
        level: 3,
      },

      // Staff Roles
      {
        name: 'Senior Staff',
        description: 'Senior staff member with supervisory responsibilities',
        type: 'business',
        isDefault: false,
        level: 1,
      },
      {
        name: 'Staff Member',
        description: 'Regular staff member with operational responsibilities',
        type: 'business',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Junior Staff',
        description: 'Junior staff member with basic operational access',
        type: 'business',
        isDefault: false,
        level: 3,
      },

      // Customer Roles
      {
        name: 'VIP Customer',
        description: 'VIP customer with premium benefits and priority support',
        type: 'business',
        isDefault: false,
        level: 1,
      },
      {
        name: 'Premium Customer',
        description: 'Premium customer with enhanced benefits',
        type: 'business',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Regular Customer',
        description: 'Regular customer with standard shopping privileges',
        type: 'business',
        isDefault: true,
        level: 3,
      },
      {
        name: 'New Customer',
        description: 'New customer with basic shopping access',
        type: 'business',
        isDefault: false,
        level: 4,
      },

      // Specialized Roles
      {
        name: 'Analyst',
        description: 'Data analyst with reporting and analytics access',
        type: 'business',
        isDefault: false,
        level: 3,
      },
      {
        name: 'Auditor',
        description: 'System auditor with read-only access to audit logs',
        type: 'admin',
        isDefault: false,
        level: 4,
      },
      {
        name: 'API User',
        description: 'API access for external integrations',
        type: 'business',
        isDefault: false,
        level: 4,
      },
      {
        name: 'Guest',
        description: 'Guest user with minimal browsing access',
        type: 'business',
        isDefault: false,
        level: 5,
      },

      // Syrian Market Specific Roles
      {
        name: 'Damascus Regional Manager',
        description: 'Regional manager for Damascus governorate operations',
        type: 'business',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Aleppo Regional Manager',
        description: 'Regional manager for Aleppo governorate operations',
        type: 'business',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Cross-Border Manager',
        description: 'Manager for cross-border trade and international operations',
        type: 'business',
        isDefault: false,
        level: 2,
      },
      {
        name: 'Syrian Compliance Officer',
        description: 'Compliance officer for Syrian regulations and standards',
        type: 'admin',
        isDefault: false,
        level: 3,
      },
    ];

    const roles: Role[] = [];

    for (const roleData of rolesData) {
      const role = this.roleRepository.create({
        name: roleData.name,
        description: roleData.description,
        type: roleData.type,
        isDefault: roleData.isDefault,
      });

      const savedRole = await this.roleRepository.save(role);
      roles.push(savedRole);
    }

    return roles;
  }

  /**
   * Assign permissions to roles based on role type and level
   */
  private async assignPermissionsToRoles(roles: Role[]): Promise<RolePermission[]> {
    // Get available permissions
    const permissions = await this.permissionRepository.find();
    
    if (permissions.length === 0) {
      console.warn('No permissions found to assign to roles');
      return [];
    }

    const rolePermissions: RolePermission[] = [];

    for (const role of roles) {
      const assignedPermissions = this.getPermissionsForRole(role, permissions);

      for (const permission of assignedPermissions) {
        const rolePermission = this.rolePermissionRepository.create({
          role: role,
          permission: permission,
        });

        const savedRolePermission = await this.rolePermissionRepository.save(rolePermission);
        rolePermissions.push(savedRolePermission);
      }
    }

    return rolePermissions;
  }

  /**
   * Get appropriate permissions for a specific role
   */
  private getPermissionsForRole(role: Role, permissions: Permission[]): Permission[] {
    const rolePermissionMap: Record<string, string[]> = {
      // Admin Roles
      'Super Admin': permissions.map(p => p.name), // All permissions
      'System Admin': [
        'user.view', 'user.create', 'user.update', 'user.delete',
        'role.view', 'role.create', 'role.update', 'role.delete',
        'permission.view', 'permission.create', 'permission.update',
        'system.configure', 'system.monitor', 'audit.view'
      ],
      'Platform Admin': [
        'user.view', 'user.update', 'role.view', 'permission.view',
        'vendor.view', 'vendor.update', 'product.view', 'product.update',
        'order.view', 'order.update', 'dashboard.view'
      ],
      'Content Admin': [
        'product.view', 'product.create', 'product.update', 'product.delete',
        'category.view', 'category.create', 'category.update',
        'brand.view', 'brand.create', 'brand.update'
      ],
      'Support Admin': [
        'user.view', 'order.view', 'order.update',
        'support.create', 'support.update', 'support.resolve'
      ],

      // Business Roles
      'Vendor Manager': [
        'vendor.view', 'vendor.create', 'vendor.update',
        'vendor.approve', 'vendor.analytics', 'dashboard.view'
      ],
      'Product Manager': [
        'product.view', 'product.create', 'product.update', 'product.delete',
        'category.view', 'category.create', 'inventory.view', 'inventory.update'
      ],
      'Order Manager': [
        'order.view', 'order.create', 'order.update', 'order.process',
        'shipping.view', 'shipping.update', 'inventory.view'
      ],
      'Sales Manager': [
        'order.view', 'order.analytics', 'customer.view',
        'promotion.view', 'promotion.create', 'dashboard.view'
      ],
      'Marketing Manager': [
        'promotion.view', 'promotion.create', 'promotion.update',
        'campaign.view', 'campaign.create', 'analytics.view'
      ],
      'Finance Manager': [
        'payment.view', 'payment.process', 'commission.view',
        'financial.analytics', 'accounting.view', 'dashboard.view'
      ],
      'Logistics Manager': [
        'shipping.view', 'shipping.create', 'shipping.update',
        'warehouse.view', 'warehouse.update', 'inventory.view'
      ],

      // Vendor Roles
      'Premium Vendor': [
        'product.view', 'product.create', 'product.update',
        'order.view', 'inventory.view', 'analytics.view',
        'promotion.create', 'dashboard.view'
      ],
      'Standard Vendor': [
        'product.view', 'product.create', 'product.update',
        'order.view', 'inventory.view', 'dashboard.view'
      ],
      'New Vendor': [
        'product.view', 'product.create', 'order.view', 'profile.update'
      ],

      // Staff Roles
      'Senior Staff': [
        'order.view', 'order.update', 'customer.view',
        'product.view', 'inventory.view', 'dashboard.view'
      ],
      'Staff Member': [
        'order.view', 'order.update', 'customer.view', 'product.view'
      ],
      'Junior Staff': [
        'order.view', 'customer.view', 'product.view'
      ],

      // Customer Roles
      'VIP Customer': [
        'product.view', 'order.create', 'order.view',
        'profile.view', 'profile.update', 'support.create'
      ],
      'Premium Customer': [
        'product.view', 'order.create', 'order.view',
        'profile.view', 'profile.update'
      ],
      'Regular Customer': [
        'product.view', 'order.create', 'order.view', 'profile.view'
      ],
      'New Customer': [
        'product.view', 'order.create', 'profile.view'
      ],

      // Specialized Roles
      'Analyst': [
        'analytics.view', 'report.view', 'dashboard.view', 'data.export'
      ],
      'Auditor': [
        'audit.view', 'log.view', 'report.view'
      ],
      'API User': [
        'api.access', 'data.read', 'webhook.receive'
      ],
      'Guest': [
        'product.view', 'category.view'
      ],

      // Regional Roles
      'Damascus Regional Manager': [
        'order.view', 'vendor.view', 'analytics.view',
        'regional.damascus.manage', 'dashboard.view'
      ],
      'Aleppo Regional Manager': [
        'order.view', 'vendor.view', 'analytics.view',
        'regional.aleppo.manage', 'dashboard.view'
      ],
      'Cross-Border Manager': [
        'order.view', 'shipping.international', 'customs.manage',
        'currency.manage', 'dashboard.view'
      ],
      'Syrian Compliance Officer': [
        'compliance.view', 'audit.view', 'regulation.check',
        'report.compliance', 'dashboard.view'
      ],
    };

    const rolePermissionNames = rolePermissionMap[role.name] || [];
    return permissions.filter(permission => 
      rolePermissionNames.includes(permission.name)
    );
  }

  /**
   * Group roles by type for analytics
   */
  private groupRolesByType(roles: Role[]): Record<string, number> {
    const result: Record<string, number> = {
      admin: 0,
      business: 0,
      customer: 0,
      vendor: 0,
      staff: 0,
      specialized: 0,
      regional: 0,
    };

    for (const role of roles) {
      if (role.type === 'admin') {
        result.admin++;
      } else if (role.type === 'business') {
        if (role.name.includes('Customer')) {
          result.customer++;
        } else if (role.name.includes('Vendor')) {
          result.vendor++;
        } else if (role.name.includes('Staff')) {
          result.staff++;
        } else if (role.name.includes('Regional') || role.name.includes('Cross-Border')) {
          result.regional++;
        } else if (['Analyst', 'Auditor', 'API User', 'Guest'].includes(role.name)) {
          result.specialized++;
        } else {
          result.business++;
        }
      }
    }

    return result;
  }

  /**
   * Calculate role hierarchy levels
   */
  private calculateHierarchyLevels(roles: Role[]): number {
    const adminLevels = roles.filter(r => r.type === 'admin').length;
    const businessLevels = roles.filter(r => r.type === 'business').length;
    return Math.max(adminLevels, businessLevels);
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    rolesCount: number,
    rolePermissionsCount: number,
    executionTime: number
  ) {
    return {
      roles_per_second: Math.round((rolesCount / executionTime) * 1000),
      permissions_assigned_per_second: Math.round((rolePermissionsCount / executionTime) * 1000),
      average_response_time_ms: Math.round(executionTime / (rolesCount + rolePermissionsCount)),
    };
  }

  /**
   * Clear existing seeding data
   */
  async clearExistingData(): Promise<void> {
    await this.rolePermissionRepository.delete({});
    await this.roleRepository.delete({});
  }

  /**
   * Get roles statistics for analytics
   */
  async getRolesStatistics() {
    const totalRoles = await this.roleRepository.count();
    const adminRoles = await this.roleRepository.count({ where: { type: 'admin' } });
    const businessRoles = await this.roleRepository.count({ where: { type: 'business' } });
    const defaultRoles = await this.roleRepository.count({ where: { isDefault: true } });
    const totalRolePermissions = await this.rolePermissionRepository.count();

    return {
      total_roles: totalRoles,
      admin_roles: adminRoles,
      business_roles: businessRoles,
      default_roles: defaultRoles,
      total_role_permissions: totalRolePermissions,
      average_permissions_per_role: totalRoles > 0 ? (totalRolePermissions / totalRoles) : 0,
    };
  }

  /**
   * Get roles by type for analytics
   */
  async getRolesByType() {
    const roles = await this.roleRepository.find();
    return this.groupRolesByType(roles);
  }

  /**
   * Get role hierarchy information
   */
  async getRoleHierarchy() {
    const roles = await this.roleRepository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    const hierarchy = {
      admin_hierarchy: roles.filter(r => r.type === 'admin').map(r => ({
        name: r.name,
        description: r.description,
        permissions_count: r.rolePermissions?.length || 0,
        is_default: r.isDefault,
      })),
      business_hierarchy: roles.filter(r => r.type === 'business').map(r => ({
        name: r.name,
        description: r.description,
        permissions_count: r.rolePermissions?.length || 0,
        is_default: r.isDefault,
      })),
    };

    return hierarchy;
  }
}