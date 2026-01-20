import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ProductDescriptionsService } from './product-descriptions.service';
import { CreateProductDescriptionDto } from '../descriptions/dto/create-product-description.dto';
import { UpdateProductDescriptionDto } from '../descriptions/dto/update-product-description.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Product Descriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products/:productId/descriptions')
export class ProductDescriptionsController {
  constructor(private readonly service: ProductDescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a product description (ar/en)' })
  create(
    @Param('productId') productId: number,
    @Body() dto: CreateProductDescriptionDto,
  ) {
    return this.service.create(+productId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product description' })
  update(@Param('id') id: number, @Body() dto: UpdateProductDescriptionDto) {
    return this.service.update(+id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all descriptions for a product' })
  list(@Param('productId') productId: number) {
    return this.service.findByProduct(+productId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product description' })
  delete(@Param('id') id: number) {
    return this.service.delete(+id);
  }
}
