import { PlanStatus } from '../../../entities/plan.entity';
export declare class CreatePlanDto {
    companyId: number;
    name: string;
    sumInsuredMin?: number;
    sumInsuredMax?: number;
    description?: string;
    brochureUrl?: string;
    status?: PlanStatus;
    isActive?: boolean;
}
