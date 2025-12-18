import { Repository } from 'typeorm';
import { Plan, PlanStatus } from '../../entities/plan.entity';
import { PlanFeatureValue } from '../../entities/plan-feature-value.entity';
import { Company } from '../../entities/company.entity';
import { Feature } from '../../entities/feature.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateFeatureValuesDto } from './dto/update-feature-values.dto';
export declare class PlansService {
    private readonly planRepository;
    private readonly planFeatureValueRepository;
    private readonly companyRepository;
    private readonly featureRepository;
    constructor(planRepository: Repository<Plan>, planFeatureValueRepository: Repository<PlanFeatureValue>, companyRepository: Repository<Company>, featureRepository: Repository<Feature>);
    findAll(companyId?: number, includeInactive?: boolean): Promise<Plan[]>;
    findOne(id: number): Promise<Plan>;
    create(createPlanDto: CreatePlanDto): Promise<Plan>;
    update(id: number, updatePlanDto: UpdatePlanDto): Promise<Plan>;
    remove(id: number): Promise<{
        message: string;
    }>;
    updateFeatureValues(planId: number, updateDto: UpdateFeatureValuesDto): Promise<Plan>;
    getFeatureValues(planId: number): Promise<PlanFeatureValue[]>;
    publish(id: number): Promise<Plan>;
    setStatus(id: number, status: PlanStatus): Promise<Plan>;
}
