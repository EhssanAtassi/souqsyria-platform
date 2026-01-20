/**
 * @file permissions.decorator.spec.ts
 * @description Unit Tests for Permissions Decorator
 * Tests custom decorator functionality for permission-based access control
 */

import { SetMetadata } from '@nestjs/common';
import { Permissions, PERMISSIONS_KEY } from './permissions.decorator';

// Mock SetMetadata function
jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

describe('Permissions Decorator', () => {
  const mockSetMetadata = SetMetadata as jest.MockedFunction<
    typeof SetMetadata
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PERMISSIONS_KEY constant', () => {
    it('should have the correct key value', () => {
      expect(PERMISSIONS_KEY).toBe('permissions');
    });
  });

  describe('Permissions decorator', () => {
    it('should call SetMetadata with single permission', () => {
      // Arrange
      const permission = 'manage_products';
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions(permission);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        permission,
      ]);
      expect(result).toBe(mockDecorator);
    });

    it('should call SetMetadata with multiple permissions', () => {
      // Arrange
      const permissions = [
        'manage_products',
        'view_products',
        'delete_products',
      ];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions(...permissions);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        permissions,
      );
      expect(result).toBe(mockDecorator);
    });

    it('should handle empty permissions array', () => {
      // Arrange
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions();

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, []);
      expect(result).toBe(mockDecorator);
    });

    it('should handle duplicate permissions', () => {
      // Arrange
      const permissions = [
        'manage_products',
        'manage_products',
        'view_products',
      ];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions(...permissions);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        permissions,
      );
      expect(result).toBe(mockDecorator);
    });

    it('should handle special characters in permission names', () => {
      // Arrange
      const permissions = [
        'manage:products',
        'view_products-admin',
        'delete.products',
      ];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions(...permissions);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        permissions,
      );
      expect(result).toBe(mockDecorator);
    });
  });

  describe('decorator usage scenarios', () => {
    it('should work with class decorators', () => {
      // Arrange
      const permission = 'admin_access';
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const decorator = Permissions(permission);

      @decorator
      class TestController {}

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        permission,
      ]);
    });

    it('should work with method decorators', () => {
      // Arrange
      const permissions = ['create_product', 'manage_inventory'];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const decorator = Permissions(...permissions);

      class TestController {
        @decorator
        createProduct() {
          // Method implementation
        }
      }

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        permissions,
      );
    });
  });

  describe('integration with real NestJS metadata', () => {
    // Note: These tests would require actual NestJS infrastructure
    // For now, we're testing the decorator factory behavior

    it('should maintain consistent metadata key across multiple uses', () => {
      // Arrange
      const mockDecorator1 = jest.fn() as any;
      const mockDecorator2 = jest.fn() as any;
      mockSetMetadata
        .mockReturnValueOnce(mockDecorator1)
        .mockReturnValueOnce(mockDecorator2);

      // Act
      Permissions('permission1');
      Permissions('permission2');

      // Assert
      expect(mockSetMetadata).toHaveBeenNthCalledWith(1, PERMISSIONS_KEY, [
        'permission1',
      ]);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(2, PERMISSIONS_KEY, [
        'permission2',
      ]);
    });

    it('should pass through all permissions without modification', () => {
      // Arrange
      const originalPermissions = ['read', 'write', 'execute'];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      Permissions(...originalPermissions);

      // Assert
      const calledPermissions = mockSetMetadata.mock.calls[0][1];
      expect(calledPermissions).toEqual(originalPermissions);
      expect(calledPermissions).not.toBe(originalPermissions); // Should be a new array
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined permission names gracefully', () => {
      // Arrange
      const permissions = [
        'valid_permission',
        null,
        undefined,
        'another_valid',
      ] as any[];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions(...permissions);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        permissions,
      );
      expect(result).toBe(mockDecorator);
    });

    it('should handle empty string permission names', () => {
      // Arrange
      const permissions = ['', 'valid_permission', '   '];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions(...permissions);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        permissions,
      );
      expect(result).toBe(mockDecorator);
    });

    it('should handle very long permission names', () => {
      // Arrange
      const longPermission = 'a'.repeat(1000);
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions(longPermission);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        longPermission,
      ]);
      expect(result).toBe(mockDecorator);
    });

    it('should handle non-string permission types', () => {
      // Arrange
      const permissions = [123, true, {}, []] as any[];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Permissions(...permissions);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        permissions,
      );
      expect(result).toBe(mockDecorator);
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of permissions efficiently', () => {
      // Arrange
      const manyPermissions = Array.from(
        { length: 1000 },
        (_, i) => `permission_${i}`,
      );
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const startTime = performance.now();
      const result = Permissions(...manyPermissions);
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      expect(mockSetMetadata).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        manyPermissions,
      );
      expect(result).toBe(mockDecorator);
    });

    it('should not mutate input permissions array', () => {
      // Arrange
      const originalPermissions = ['read', 'write'];
      const permissionsCopy = [...originalPermissions];
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      Permissions(...originalPermissions);

      // Assert
      expect(originalPermissions).toEqual(permissionsCopy);
    });
  });

  describe('type safety', () => {
    it('should accept string parameters', () => {
      // This is more of a TypeScript compilation test
      // but we can verify the runtime behavior
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act - These should all compile and work
      expect(() => Permissions('string_permission')).not.toThrow();
      expect(() => Permissions('perm1', 'perm2')).not.toThrow();
      expect(() => Permissions(...['array', 'spread'])).not.toThrow();
    });
  });

  describe('compatibility', () => {
    it('should work with existing NestJS decorator patterns', () => {
      // Arrange
      const mockDecorator = jest.fn() as any;
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const permissionsDecorator = Permissions('test_permission');

      // Assert
      expect(typeof permissionsDecorator).toBe('function');
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should be composable with other decorators', () => {
      // Arrange
      const mockDecorator1 = jest.fn() as any;
      const mockDecorator2 = jest.fn() as any;
      mockSetMetadata
        .mockReturnValueOnce(mockDecorator1)
        .mockReturnValueOnce(mockDecorator2);

      // Act
      const permissions1 = Permissions('permission1');
      const permissions2 = Permissions('permission2');

      // Simulate decorator composition (conceptually)
      class TestClass {
        @permissions1
        @permissions2
        testMethod() {}
      }

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledTimes(2);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(1, PERMISSIONS_KEY, [
        'permission1',
      ]);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(2, PERMISSIONS_KEY, [
        'permission2',
      ]);
    });
  });
});
