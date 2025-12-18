import { IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FeatureWeightDto {
  @IsInt()
  id: number;

  @IsInt()
  @Min(0)
  @Max(100)
  weightage: number;
}

export class UpdateFeatureWeightsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureWeightDto)
  features: FeatureWeightDto[];
}
