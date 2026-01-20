import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Logger,
  Get,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { ProductImageResponseDto } from './product-image-response.dto';
import { UpdateProductImageDto } from './update-product-image.dto';

class ImageDto {
  image_url: string;
  order: number;
}

@ApiTags('Product Images')
@ApiBearerAuth()
@Controller('products/:id/images')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Replace all images for a product' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiBody({ type: [ImageDto] })
  async replaceImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() images: ImageDto[],
  ) {
    this.logger.log(`POST /products/${id}/images`);
    return this.imagesService.replaceImages(id, images);
  }
  @ApiOperation({ summary: 'Get all images for a product (sorted)' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiOkResponse({ type: [ProductImageResponseDto] })
  @Get()
  async getProductImages(@Param('id', ParseIntPipe) productId: number) {
    this.logger.log(`GET /products/${productId}/images`);
    return this.imagesService.getImagesByProduct(productId);
  }

  @Delete(':imageId')
  @ApiOperation({ summary: 'Delete a specific image by ID for a product' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiParam({ name: 'imageId', type: Number, description: 'Image ID' })
  @ApiOkResponse({ description: 'Image deleted' })
  @ApiNotFoundResponse({ description: 'Image not found' })
  async deleteProductImage(
    @Param('id', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    this.logger.log(`DELETE /products/${productId}/images/${imageId}`);
    return this.imagesService.deleteImageById(imageId, productId);
  }

  @Patch(':imageId')
  @ApiOperation({ summary: 'Update image sortOrder (reorder image)' })
  @ApiOperation({ summary: 'Replace product images (max 8, each ≤ 1MB)' })
  @ApiParam({ name: 'id', description: 'Product ID', type: Number })
  @ApiParam({ name: 'imageId', description: 'Image ID', type: Number })
  @ApiBody({ type: UpdateProductImageDto })
  async updateImageOrder(
    @Param('id', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() dto: UpdateProductImageDto,
  ) {
    this.logger.log(`PATCH /products/${productId}/images/${imageId}`);
    return this.imagesService.updateImageSortOrder(
      imageId,
      productId,
      dto.sortOrder,
    );
  }
}
