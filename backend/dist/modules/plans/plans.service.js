"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plan_entity_1 = require("../../entities/plan.entity");
const plan_feature_value_entity_1 = require("../../entities/plan-feature-value.entity");
const company_entity_1 = require("../../entities/company.entity");
const feature_entity_1 = require("../../entities/feature.entity");
let PlansService = class PlansService {
    constructor(planRepository, planFeatureValueRepository, companyRepository, featureRepository) {
        this.planRepository = planRepository;
        this.planFeatureValueRepository = planFeatureValueRepository;
        this.companyRepository = companyRepository;
        this.featureRepository = featureRepository;
    }
    async findAll(companyId, includeInactive = false) {
        const qb = this.planRepository
            .createQueryBuilder('plan')
            .leftJoinAndSelect('plan.company', 'company')
            .orderBy(`CASE 
          WHEN plan.status = :uploadComplete THEN 0 
          ELSE 1 
        END`, 'ASC')
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Plan with ID ${id} not found`);
        }
        return plan;
    }
    async create(createPlanDto) {
        const company = await this.companyRepository.findOne({
            where: { id: createPlanDto.companyId, isActive: true },
        });
        if (!company) {
            throw new common_1.NotFoundException(`Company with ID ${createPlanDto.companyId} not found or inactive`);
        }
        const plan = this.planRepository.create(createPlanDto);
        return this.planRepository.save(plan);
    }
    async update(id, updatePlanDto) {
        const plan = await this.findOne(id);
        Object.assign(plan, updatePlanDto);
        return this.planRepository.save(plan);
    }
    async remove(id) {
        const plan = await this.findOne(id);
        plan.isActive = false;
        await this.planRepository.save(plan);
        return { message: `Plan ${plan.name} has been deactivated` };
    }
    async setActive(id, isActive) {
        const plan = await this.findOne(id);
        plan.isActive = isActive;
        return this.planRepository.save(plan);
    }
    async updateFeatureValues(planId, updateDto) {
        const plan = await this.findOne(planId);
        for (const fv of updateDto.featureValues) {
            const feature = await this.featureRepository.findOne({
                where: { id: fv.featureId, isActive: true },
            });
            if (!feature) {
                throw new common_1.NotFoundException(`Feature with ID ${fv.featureId} not found or inactive`);
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
            }
            else {
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
    async getFeatureValues(planId) {
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
    async publish(id) {
        const plan = await this.findOne(id);
        plan.status = plan_entity_1.PlanStatus.PUBLISHED;
        return this.planRepository.save(plan);
    }
    async setStatus(id, status) {
        const plan = await this.findOne(id);
        plan.status = status;
        return this.planRepository.save(plan);
    }
    async comparePlans(body) {
        const { client, selectedPlanIds, selectedPlans } = body;
        const planInputMap = {};
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
        const plans = await this.planRepository
            .createQueryBuilder('plan')
            .leftJoinAndSelect('plan.company', 'company')
            .where('plan.id IN (:...planIds)', { planIds: selectedPlanIds })
            .andWhere('plan.isActive = true')
            .getMany();
        if (!plans.length) {
            throw new common_1.NotFoundException('No active plans found for comparison');
        }
        const features = await this.featureRepository
            .createQueryBuilder('feature')
            .select(['feature.id', 'feature.name', 'feature.description'])
            .where('feature.isActive = true')
            .orderBy('feature.displayOrder', 'ASC')
            .getMany();
        const rawFeatureValues = await this.planFeatureValueRepository
            .createQueryBuilder('pfv')
            .select(['pfv.planId', 'pfv.featureId', 'pfv.verifiedValue'])
            .where('pfv.planId IN (:...planIds)', { planIds: selectedPlanIds })
            .getMany();
        const featureValues = {};
        for (const fv of rawFeatureValues) {
            if (!featureValues[fv.featureId]) {
                featureValues[fv.featureId] = {};
            }
            featureValues[fv.featureId][fv.planId] = fv.verifiedValue;
        }
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
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(1, (0, typeorm_1.InjectRepository)(plan_feature_value_entity_1.PlanFeatureValue)),
    __param(2, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(3, (0, typeorm_1.InjectRepository)(feature_entity_1.Feature)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PlansService);
//# sourceMappingURL=plans.service.js.map