import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUrl()
  companyUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
