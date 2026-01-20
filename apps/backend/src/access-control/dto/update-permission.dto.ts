/**
 * @file update-permission.dto.ts
 * @description DTO for updating a permission.
 */
import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
