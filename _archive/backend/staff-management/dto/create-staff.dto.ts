/**
 * @file create-staff.dto.ts
 * @description DTO for creating a staff user.
 */
import { IsEmail, IsInt, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({
    example: 'staff@example.com',
    description: 'Staff email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePass123',
    description: 'Password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 3, description: 'Assigned Role ID' })
  @IsInt()
  roleId: number;

  @ApiProperty({ example: 'Ahmed Staff', description: 'Full Name of staff' })
  @IsString()
  fullName: string;
}
