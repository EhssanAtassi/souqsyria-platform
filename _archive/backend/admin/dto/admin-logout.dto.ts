import { IsOptional, IsString } from 'class-validator';

export class AdminLogoutDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}
