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
        if (categoryId !== undefined) {
            where.categoryId = categoryId;
        }
        return this.featureRepository.find({
            where,
            relations: ['category'],
            order: { displayOrder: 'ASC' },
        });
    }
    async findOne(id) {
        const feature = await this.featureRepository.findOne({ where: { id } });
        if (!feature) {
            throw new common_1.NotFoundException(`Feature ${id} not found`);
        }
        return feature;
    }
    async previewOrderShift(categoryId, displayOrder, newFeatureName) {
        const features = await this.featureRepository.find({
            where: { categoryId, isActive: true },
            order: { displayOrder: 'ASC' },
        });
        const current = features.map((f, index) => ({
            displayOrder: index + 1,
            name: f.name,
        }));
        const insertAt = Math.min(displayOrder, current.length + 1);
        const conflict = insertAt <= current.length;
        const proposed = [];
        let order = 1;
        for (let i = 0; i < current.length; i++) {
            if (order === insertAt) {
                proposed.push({
                    displayOrder: order++,
                    name: newFeatureName,
                });
            }
            proposed.push({
                displayOrder: order++,
                name: current[i].name,
            });
        }
        if (insertAt > current.length) {
            proposed.push({
                displayOrder: order,
                name: newFeatureName,
            });
        }
        return {
            conflict,
            current,
            proposed,
        };
    }
    async create(createFeatureDto) {
        const category = await this.categoryRepository.findOne({
            where: { id: createFeatureDto.categoryId, isActive: true },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (createFeatureDto.displayOrder != null) {
            await this.featureRepository
                .createQueryBuilder()
                .update(feature_entity_1.Feature)
                .set({
                displayOrder: () => 'display_order + 1',
            })
                .where('category_id = :categoryId', {
                categoryId: createFeatureDto.categoryId,
            })
                .andWhere('display_order >= :displayOrder', {
                displayOrder: createFeatureDto.displayOrder,
            })
                .execute();
        }
        else {
            const result = await this.featureRepository
                .createQueryBuilder('f')
                .select('MAX(f.displayOrder)', 'max')
                .where('f.categoryId = :categoryId', {
                categoryId: createFeatureDto.categoryId,
            })
                .getRawOne();
            createFeatureDto.displayOrder = (result?.max || 0) + 1;
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
        Object.assign(feature, updateFeatureDto);
        return this.featureRepository.save(feature);
    }
    async remove(id) {
        const feature = await this.findOne(id);
        feature.isActive = false;
        await this.featureRepository.save(feature);
        return { message: 'Feature deactivated' };
    }
    async updateWeights(categoryId, dto) {
        const total = dto.features.reduce((sum, f) => sum + f.weightage, 0);
        if (total !== 100) {
            throw new common_1.BadRequestException('Weights must sum to 100');
        }
        for (const f of dto.features) {
            await this.featureRepository.update(f.id, {
                weightage: f.weightage,
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
            total,
            valid: total === 100,
            features,
        };
    }
    async validateWeightsForCategory(categoryId) {
        const res = await this.getWeightsByCategoryId(categoryId);
        return {
            valid: res.valid,
            total: res.total,
            message: res.valid ? 'Valid' : 'Invalid',
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