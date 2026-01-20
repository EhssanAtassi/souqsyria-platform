import { ForbiddenException } from '@nestjs/common';
import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../access-control/decorators/permissions.decorator';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CouponSeederController } from './coupon.seeder.controller';
import { CouponSeederService } from './coupon.seeder.service';

describe('CouponSeederController', () => {
  const mockService: CouponSeederService = {
    seedCoupons: jest.fn().mockResolvedValue({ success: true }),
  } as any;

  const buildController = (env: string) => {
    const configService = { get: () => env } as any;
    return new CouponSeederController(mockService, configService);
  };

  it('should apply PermissionsGuard', () => {
    const guards =
      Reflect.getMetadata('__guards__', CouponSeederController) || [];
    expect(guards).toContain(PermissionsGuard);
  });

  it('should require manage_coupons permission', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CouponSeederController.prototype.seedCoupons,
    );
    expect(permissions).toContain('manage_coupons');
  });

  it('should forbid seeding outside dev or test', async () => {
    const controller = buildController('production');
    await expect(controller.seedCoupons()).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should allow seeding in development', async () => {
    const controller = buildController('development');
    await expect(controller.seedCoupons()).resolves.toEqual({ success: true });
  });
});
