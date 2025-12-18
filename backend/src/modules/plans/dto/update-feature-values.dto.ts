import { IsArray, ValidateNested, IsInt, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FeatureValueDto {
  @IsInt()
  featureId: number;

  @IsString()
  @IsOptional()
  extractedValue?: string;

  @IsString()
  @IsOptional()
  verifiedValue?: string;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

export class UpdateFeatureValuesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureValueDto)
  featureValues: FeatureValueDto[];
}
