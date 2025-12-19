import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValueType, StandardizationRules } from '../../extraction/types/standardization.types';

export class CreateFeatureDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
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

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
