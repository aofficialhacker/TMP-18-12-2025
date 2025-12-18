import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsArray, IsEnum, IsObject } from 'class-validator';
import { ValueType, StandardizationRules } from '../../extraction/types/standardization.types';

export class CreateFeatureDto {
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  weightage: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  extractionKeywords?: string[];

  @IsString()
  @IsOptional()
  extractionPrompt?: string;

  @IsEnum(ValueType)
  @IsOptional()
  valueType?: ValueType;

  @IsObject()
  @IsOptional()
  standardizationRules?: StandardizationRules;

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
