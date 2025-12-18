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
exports.FeaturesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const feature_entity_1 = require("../../entities/feature.entity");
const category_entity_1 = require("../../entities/category.entity");
let FeaturesService = class FeaturesService {
    constructor(featureRepository, categoryRepository) {
        this.featureRepository = featureRepository;
        this.categoryRepository = categoryRepository;
    }
    async findAll(categoryId, includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };
        if (categoryId) {
            where.categoryId = categoryId;
        }
        return this.featureRepository.find({
            where,
            relations: ['category'],
            order: { displayOrder: 'ASC', name: 'ASC' },
        });
    }
    async findOne(id) {
        const feature = await this.featureRepository.findOne({
            where: { id },
            relations: ['category'],
        });
        if (!feature) {
            throw new common_1.NotFoundException(`Feature with ID ${id} not found`);
        }
        return feature;
    }
    async create(createFeatureDto) {
        const category = await this.categoryRepository.findOne({
            where: { id: createFeatureDto.categoryId, isActive: true },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${createFeatureDto.categoryId} not found or inactive`);
        }
        const feature = this.featureRepository.create({
            ...createFeatureDto,
            extractionKeywords: createFeatureDto.extractionKeywords
                ? JSON.stringify(createFeatureDto.extractionKeywords)
                : null,
        });
        return this.featureRepository.save(feature);
    }
    async update(id, updateFeatureDto) {
        const feature = await this.findOne(id);
        if (updateFeatureDto.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: updateFeatureDto.categoryId, isActive: true },
            });
            if (!category) {
                throw new common_1.NotFoundException(`Category with ID ${updateFeatureDto.categoryId} not found or inactive`);
            }
        }
        const updateData = { ...updateFeatureDto };
        if (updateFeatureDto.extractionKeywords) {
            updateData.extractionKeywords = JSON.stringify(updateFeatureDto.extractionKeywords);
        }
        Object.assign(feature, updateData);
        return this.featureRepository.save(feature);
    }
    async remove(id) {
        const feature = await this.findOne(id);
        feature.isActive = false;
        await this.featureRepository.save(feature);
        return { message: `Feature ${feature.name} has been deactivated` };
    }
    async updateWeights(categoryId, updateWeightsDto) {
        const { features } = updateWeightsDto;
        const totalWeight = features.reduce((sum, feat) => sum + feat.weightage, 0);
        if (totalWeight !== 100) {
            throw new common_1.BadRequestException(`Feature weights within category must sum to 100. Current total: ${totalWeight}`);
        }
        const featureIds = features.map((f) => f.id);
        const existingFeatures = await this.featureRepository.find({
            where: featureIds.map((id) => ({ id, categoryId, isActive: true })),
        });
        if (existingFeatures.length !== featureIds.length) {
            throw new common_1.BadRequestException('One or more features not found, inactive, or do not belong to this category');
        }
        for (const featWeight of features) {
            await this.featureRepository.update(featWeight.id, {
                weightage: featWeight.weightage,
            });
        }
        return this.findAll(categoryId);
    }
    async getWeightsByCategoryId(categoryId) {
        const features = await this.featureRepository.find({
            where: { categoryId, isActive: true },
        });
        const total = features.reduce((sum, f) => sum + f.weightage, 0);
        return {
            categoryId,
            features: features.map((f) => ({
                id: f.id,
                name: f.name,
                weightage: f.weightage,
            })),
            total,
            valid: total === 100,
        };
    }
    async validateWeightsForCategory(categoryId) {
        const result = await this.getWeightsByCategoryId(categoryId);
        return {
            valid: result.valid,
            total: result.total,
            message: result.valid
                ? 'Feature weights are valid (sum = 100)'
                : `Feature weights for category must sum to 100. Current total: ${result.total}`,
        };
    }
};
exports.FeaturesService = FeaturesService;
exports.FeaturesService = FeaturesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(feature_entity_1.Feature)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FeaturesService);
//# sourceMappingURL=features.service.js.map