import { PartialType } from '@nestjs/swagger';
import { CreateProductDescriptionDto } from './create-product-description.dto';

export class UpdateProductDescriptionDto extends PartialType(
  CreateProductDescriptionDto,
) {}
