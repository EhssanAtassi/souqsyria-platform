import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProductAttributeService } from '../services/product-attribute.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { SetProductAttributesDto } from '../dto/set-product-attributes.dto';

/**
 * ✅ Controller for managing attribute-value assignments to products.
 * Secured with JWT + PermissionsGuard for dynamic ACL enforcement.
 */
@ApiTags('Product Attributes') // ✅ Swagger group
@ApiBearerAuth() // ✅ Swagger Auth Header support
@Controller('products/:id/attributes')
@UseGuards(JwtAuthGuard, PermissionsGuard) // ✅ Secured controller
export class ProductAttributeController {
  private readonly logger = new Logger(ProductAttributeController.name);

  constructor(
    private readonly productAttributeService: ProductAttributeService,
  ) {}

  /**
   * 🔁 Replace all existing attributes of a product with a new list.
   */
  @Post()
  @ApiOperation({ summary: 'Assign attributes to a product' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiBody({ type: SetProductAttributesDto })
  async setAttributes(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: SetProductAttributesDto,
  ) {
    this.logger.log(`POST /products/${productId}/attributes`);
    return this.productAttributeService.setAttributes(productId, dto);
  }

  /**
   * 📦 Retrieve all assigned attributes for a given product.
   */
  @Get()
  @ApiOperation({ summary: 'Get all attributes assigned to a product' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  async getAttributes(@Param('id', ParseIntPipe) productId: number) {
    this.logger.log(`GET /products/${productId}/attributes`);
    return this.productAttributeService.getAttributes(productId);
  }
}
