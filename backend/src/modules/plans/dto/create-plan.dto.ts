import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanStatus } from '../../../entities/plan.entity';

export class CreatePlanDto {
  @Type(() => Number)          // ✅ FIX
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)          // ✅ FIX
  @IsNumber()
  @IsOptional()
  sumInsuredMin?: number;

  @Type(() => Number)          // ✅ FIX
  @IsNumber()
  @IsOptional()
  sumInsuredMax?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  brochureUrl?: string;

  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
