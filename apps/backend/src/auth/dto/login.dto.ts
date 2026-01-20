/**
 * @file login.dto.ts
 * @description Request body validation for user login.
 */
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
