import { IsInt, IsOptional, IsString } from 'class-validator';

export class UploadBrochureDto {
  @IsInt()
  @IsOptional()
  companyId?: number;

  @IsInt()
  @IsOptional()
  planId?: number;

  @IsString()
  @IsOptional()
  planName?: string;
}
