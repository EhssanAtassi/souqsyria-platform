/**
 * @file submit-kyc.dto.ts
 * @description Defines the request body for KYC document submission with validation rules.
 */
import { IsString, IsUrl, IsIn } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @IsIn(['national_id', 'business_license'], {
    message: 'docType must be either national_id or business_license',
  })
  docType: string;

  @IsUrl({}, { message: 'fileUrl must be a valid URL' })
  fileUrl: string;
}
