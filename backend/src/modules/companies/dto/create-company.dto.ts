import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCompanyDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  // 🔥 CRITICAL FIX: allow multipart/form-data URL logo input
  @Transform(({ value }) => value?.toString())
  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUrl()
  companyUrl?: string;

  @Transform(({ value }) => value === 'true' || value === true )
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
