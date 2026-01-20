/**
 * @file update-route.dto.ts
 * @description DTO for updating route entries.
 */
import { PartialType } from '@nestjs/swagger';
import { CreateRouteDto } from './create-route.dto';

export class UpdateRouteDto extends PartialType(CreateRouteDto) {}
