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
        const where = includeInactive ? {} : { isActive: true };
        if (companyId) {
            where.companyId = companyId;
        }
        return this.planRepository.find({
            where,
            relations: ['company'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const plan = await this.planRepository.findOne({
            where: { id },
            relations: ['company', 'featureValues', 'featureValues.feature', 'featureValues.feature.category'],
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
        if (updatePlanDto.companyId) {
            const company = await this.companyRepository.findOne({
                where: { id: updatePlanDto.companyId, isActive: true },
            });
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${updatePlanDto.companyId} not found or inactive`);
            }
        }
        Object.assign(plan, updatePlanDto);
        return this.planRepository.save(plan);
    }
    async remove(id) {
        const plan = await this.findOne(id);
        plan.isActive = false;
        await this.planRepository.save(plan);
        return { message: `Plan ${plan.name} has been deactivated` };
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
            order: { feature: { category: { displayOrder: 'ASC' }, displayOrder: 'ASC' } },
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