import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsInt, IsNumber, IsEnum } from 'class-validator';
import { PlanStatus } from '../../../entities/plan.entity';

export class CreatePlanDto {
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  sumInsuredMin?: number;

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
