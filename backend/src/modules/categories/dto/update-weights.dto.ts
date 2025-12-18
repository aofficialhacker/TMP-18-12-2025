import { IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryWeightDto {
  @IsInt()
  id: number;

  @IsInt()
  @Min(0)
  @Max(100)
  weightage: number;
}

export class UpdateCategoryWeightsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryWeightDto)
  categories: CategoryWeightDto[];
}
