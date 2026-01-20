import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProductFeatureService } from '../services/product-feature.service';
import { SetProductFeaturesDto } from '../dto/set-product-features.dto';

@ApiTags('Product Features')
@ApiBearerAuth()
@Controller('products/:id/features')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductFeatureController {
  private readonly logger = new Logger(ProductFeatureController.name);

  constructor(private readonly featureService: ProductFeatureService) {}

  @Post()
  @ApiOperation({ summary: 'Set features for a product (replace all)' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiBody({ type: SetProductFeaturesDto })
  async setFeatures(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: SetProductFeaturesDto,
  ) {
    this.logger.log(`POST /products/${productId}/features`);
    return this.featureService.setFeatures(productId, dto);
  }
}
