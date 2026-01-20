import { IsString } from 'class-validator';

export class AdminRefreshDto {
  @IsString()
  refreshToken: string;
}
