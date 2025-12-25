import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateFeatureValuesDto } from './dto/update-feature-values.dto';
import { PlanStatus } from '../../entities/plan.entity';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findAll(companyId?: string, includeInactive?: string): Promise<import("../../entities/plan.entity").Plan[]>;
    findOne(id: number): Promise<import("../../entities/plan.entity").Plan>;
    getFeatureValues(id: number): Promise<import("../../entities").PlanFeatureValue[]>;
    comparePlans(body: any): Promise<{
        clientDetails: {
            name: any;
            dob: any;
            age: any;
            preExistingDisease: string;
            planType: any;
            policyType: any;
        };
        plans: {
            planId: number;
            companyName: string;
            companyLogo: string;
            planName: string;
            sumInsured: number;
            premium: number;
        }[];
        features: import("../../entities").Feature[];
        featureValues: Record<number, Record<number, string>>;
        terms: {
            text: string[];
            irDAI: string;
            validity: string;
            ibaiMembershipNo: string;
        };
    }>;
    create(createPlanDto: CreatePlanDto): Promise<import("../../entities/plan.entity").Plan>;
    update(id: number, updatePlanDto: UpdatePlanDto): Promise<import("../../entities/plan.entity").Plan>;
    updateFeatureValues(id: number, updateDto: UpdateFeatureValuesDto): Promise<import("../../entities/plan.entity").Plan>;
    publish(id: number): Promise<import("../../entities/plan.entity").Plan>;
    setStatus(id: number, status: PlanStatus): Promise<import("../../entities/plan.entity").Plan>;
    setActive(id: number, isActive: boolean): Promise<import("../../entities/plan.entity").Plan>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
