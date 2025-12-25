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

  /* ================= EXISTING METHODS (UNCHANGED) ================= */

  async findAll(companyId?: number, includeInactive = false): Promise<Plan[]> {
    const qb = this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.company', 'company')
      .orderBy(
        `CASE 
          WHEN plan.status = :uploadComplete THEN 0 
          ELSE 1 
        END`,
        'ASC',
      )
      .addOrderBy('plan.updatedAt', 'DESC')
      .addOrderBy('plan.createdAt', 'DESC')
      .setParameter('uploadComplete', 'upload_complete');

    if (!includeInactive) {
      qb.where('plan.isActive = :active', { active: true });
    }

    if (companyId) {
      qb.andWhere('plan.companyId = :companyId', { companyId });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: [
        'company',
        'featureValues',
        'featureValues.feature',
        'featureValues.feature.category',
      ],
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
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
    Object.assign(plan, updatePlanDto);
    return this.planRepository.save(plan);
  }

  async remove(id: number): Promise<{ message: string }> {
    const plan = await this.findOne(id);
    plan.isActive = false;
    await this.planRepository.save(plan);
    return { message: `Plan ${plan.name} has been deactivated` };
  }

  async setActive(id: number, isActive: boolean): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.isActive = isActive;
    return this.planRepository.save(plan);
  }

  async updateFeatureValues(
    planId: number,
    updateDto: UpdateFeatureValuesDto,
  ): Promise<Plan> {
    const plan = await this.findOne(planId);

    for (const fv of updateDto.featureValues) {
      const feature = await this.featureRepository.findOne({
        where: { id: fv.featureId, isActive: true },
      });

      if (!feature) {
        throw new NotFoundException(
          `Feature with ID ${fv.featureId} not found or inactive`,
        );
      }

      let planFeatureValue = await this.planFeatureValueRepository.findOne({
        where: { planId, featureId: fv.featureId },
      });

      if (planFeatureValue) {
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
    await this.findOne(planId);
    return this.planFeatureValueRepository.find({
      where: { planId },
      relations: ['feature', 'feature.category'],
      order: {
        feature: {
          category: { displayOrder: 'ASC' },
          displayOrder: 'ASC',
        },
      },
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

  /* ================= NEW: COMPARE LOGIC (NO plan.premium) ================= */

  async comparePlans(body: any) {
    const { client, selectedPlanIds, selectedPlans } = body;

    // 🔑 Build planId → { premium, sumInsured } map from UI input
    const planInputMap: Record<number, { premium: number; sumInsured: number }> = {};

    if (Array.isArray(selectedPlans)) {
      for (const p of selectedPlans) {
        if (p.planId) {
          planInputMap[Number(p.planId)] = {
            premium: Number(p.premium),
            sumInsured: Number(p.sumInsured),
          };
        }
      }
    }

    // 1️⃣ Fetch selected plans with company
    const plans = await this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.company', 'company')
      .where('plan.id IN (:...planIds)', { planIds: selectedPlanIds })
      .andWhere('plan.isActive = true')
      .getMany();

    if (!plans.length) {
      throw new NotFoundException('No active plans found for comparison');
    }

    // 2️⃣ Fetch active features
    const features = await this.featureRepository
      .createQueryBuilder('feature')
      .select(['feature.id', 'feature.name', 'feature.description'])
      .where('feature.isActive = true')
      .orderBy('feature.displayOrder', 'ASC')
      .getMany();

    // 3️⃣ Fetch verified feature values
    const rawFeatureValues = await this.planFeatureValueRepository
      .createQueryBuilder('pfv')
      .select(['pfv.planId', 'pfv.featureId', 'pfv.verifiedValue'])
      .where('pfv.planId IN (:...planIds)', { planIds: selectedPlanIds })
      .getMany();

    // 4️⃣ Build feature-value matrix
    const featureValues: Record<number, Record<number, string>> = {};
    for (const fv of rawFeatureValues) {
      if (!featureValues[fv.featureId]) {
        featureValues[fv.featureId] = {};
      }
      featureValues[fv.featureId][fv.planId] = fv.verifiedValue;
    }

    // 5️⃣ Build plan summary (✅ NO plan.premium ANYWHERE)
    const planSummaries = plans.map(plan => ({
      planId: plan.id,
      companyName: plan.company.name,
      companyLogo: plan.company.logoUrl,
      planName: plan.name,
      sumInsured: planInputMap[plan.id]?.sumInsured ?? null,
      premium: planInputMap[plan.id]?.premium ?? null,
    }));

    return {
      clientDetails: {
        name: client?.name,
        dob: client?.dob,
        age: client?.age,
        preExistingDisease: client?.preExistingDisease ? 'Yes' : 'No',
        planType: client?.planType,
        policyType: client?.policyType,
      },
      plans: planSummaries,
      features,
      featureValues,
      terms: {
        text: [
          'Quote valid for 24 hours.',
          'Subject to final approval and documentation.',
          'Actual terms may vary based on eligibility.',
        ],
        irDAI: 'Direct (Life & General)',
        validity: '07.08.2024 – 06.08.2027',
        ibaiMembershipNo: '33985',
      },
    };
  }
}
