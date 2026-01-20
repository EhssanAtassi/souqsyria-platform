import {
  Controller,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';
import { CouponSeederService, CouponSeedResult } from './coupon.seeder.service';

@ApiTags('Coupon Seeding')
@ApiBearerAuth()
@Controller('coupons/seeding')
@UseGuards(PermissionsGuard)
export class CouponSeederController {
  constructor(
    private readonly couponSeederService: CouponSeederService,
    private readonly configService: ConfigService,
  ) {}

  @Post('seed')
  @Permissions('manage_coupons')
  async seedCoupons(): Promise<CouponSeedResult> {
    const env = this.configService.get<string>('NODE_ENV');
    if (env !== 'development' && env !== 'test') {
      throw new ForbiddenException(
        'Coupon seeding is disabled in this environment',
      );
    }
    return this.couponSeederService.seedCoupons();
  }
}
