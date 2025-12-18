import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, PlanStatus } from '../../entities/plan.entity';
import { PlanFeatureValue } from '../../entities/plan-feature-value.entity';
import { Company } from '../../entities/company.entity';
import { Feature } from '../../entities/feature.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateFeatureValuesDto } from './dto/update-feature-values.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(PlanFeatureValue)
    private readonly planFeatureValueRepository: Repository<PlanFeatureValue>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Feature)
    private readonly featureRepository: Repository<Feature>,
  ) {}

  async findAll(companyId?: number, includeInactive = false): Promise<Plan[]> {
    const where: any = includeInactive ? {} : { isActive: true };
    if (companyId) {
      where.companyId = companyId;
    }
    return this.planRepository.find({
      where,
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['company', 'featureValues', 'featureValues.feature', 'featureValues.feature.category'],
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    // Verify company exists
    const company = await this.companyRepository.findOne({
      where: { id: createPlanDto.companyId, isActive: true },
    });

    if (!company) {
      throw new NotFoundException(
        `Company with ID ${createPlanDto.companyId} not found or inactive`,
      );
    }

    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  async update(id: number, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);

    if (updatePlanDto.companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: updatePlanDto.companyId, isActive: true },
      });
      if (!company) {
        throw new NotFoundException(
          `Company with ID ${updatePlanDto.companyId} not found or inactive`,
        );
      }
    }

    Object.assign(plan, updatePlanDto);
    return this.planRepository.save(plan);
  }

  async remove(id: number): Promise<{ message: string }> {
    const plan = await this.findOne(id);
    plan.isActive = false;
    await this.planRepository.save(plan);
    return { message: `Plan ${plan.name} has been deactivated` };
  }

  async updateFeatureValues(
    planId: number,
    updateDto: UpdateFeatureValuesDto,
  ): Promise<Plan> {
    const plan = await this.findOne(planId);

    for (const fv of updateDto.featureValues) {
      // Verify feature exists
      const feature = await this.featureRepository.findOne({
        where: { id: fv.featureId, isActive: true },
      });

      if (!feature) {
        throw new NotFoundException(
          `Feature with ID ${fv.featureId} not found or inactive`,
        );
      }

      // Check if plan feature value already exists
      let planFeatureValue = await this.planFeatureValueRepository.findOne({
        where: { planId, featureId: fv.featureId },
      });

      if (planFeatureValue) {
        // Update existing
        if (fv.extractedValue !== undefined) {
          planFeatureValue.extractedValue = fv.extractedValue;
        }
        if (fv.verifiedValue !== undefined) {
          planFeatureValue.verifiedValue = fv.verifiedValue;
        }
        if (fv.isVerified !== undefined) {
          planFeatureValue.isVerified = fv.isVerified;
        }
        await this.planFeatureValueRepository.save(planFeatureValue);
      } else {
        // Create new
        planFeatureValue = this.planFeatureValueRepository.create({
          planId,
          featureId: fv.featureId,
          extractedValue: fv.extractedValue,
          verifiedValue: fv.verifiedValue,
          isVerified: fv.isVerified ?? false,
        });
        await this.planFeatureValueRepository.save(planFeatureValue);
      }
    }

    return this.findOne(planId);
  }

  async getFeatureValues(planId: number): Promise<PlanFeatureValue[]> {
    await this.findOne(planId); // Verify plan exists
    return this.planFeatureValueRepository.find({
      where: { planId },
      relations: ['feature', 'feature.category'],
      order: { feature: { category: { displayOrder: 'ASC' }, displayOrder: 'ASC' } },
    });
  }

  async publish(id: number): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.status = PlanStatus.PUBLISHED;
    return this.planRepository.save(plan);
  }

  async setStatus(id: number, status: PlanStatus): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.status = status;
    return this.planRepository.save(plan);
  }
}
