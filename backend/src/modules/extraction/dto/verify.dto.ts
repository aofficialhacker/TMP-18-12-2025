import { IsInt, IsArray, ValidateNested, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class VerifiedFeatureDto {
  @IsInt()
  featureId: number;

  @IsString()
  extractedValue: string;

  @IsString()
  verifiedValue: string;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

export class VerifyExtractionDto {
  @IsInt()
  @IsOptional()
  companyId?: number;

  @IsInt()
  @IsOptional()
  planId?: number;

  @IsString()
  @IsOptional()
  planName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerifiedFeatureDto)
  featureValues: VerifiedFeatureDto[];
}
