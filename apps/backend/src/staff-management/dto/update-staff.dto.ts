/**
 * @file update-staff.dto.ts
 * @description DTO for updating staff user details.
 */
import { PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
