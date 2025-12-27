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
        if (categoryId)
            where.categoryId = categoryId;
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
    async create(dto) {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.categoryId, isActive: true },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${dto.categoryId} not found or inactive`);
        }
        let displayOrder = dto.displayOrder && dto.displayOrder >= 1 ? dto.displayOrder : undefined;
        if (!displayOrder) {
            const max = await this.getMaxDisplayOrder();
            displayOrder = max + 1;
        }
        else {
            const existing = await this.getFeatureAtDisplayOrder(displayOrder);
            if (existing) {
                await this.shiftDisplayOrdersUp(displayOrder);
            }
        }
        const feature = this.featureRepository.create({
            ...dto,
            displayOrder,
            extractionKeywords: dto.extractionKeywords
                ? JSON.stringify(dto.extractionKeywords)
                : null,
        });
        return this.featureRepository.save(feature);
    }
    async update(id, dto) {
        const feature = await this.findOne(id);
        if (dto.displayOrder !== undefined && dto.displayOrder < 1) {
            throw new common_1.BadRequestException('Display order must start from 1');
        }
        if (dto.displayOrder !== undefined &&
            dto.displayOrder !== feature.displayOrder) {
            const oldOrder = feature.displayOrder;
            const newOrder = dto.displayOrder;
            const allFeatures = await this.featureRepository.find({
                order: { displayOrder: 'ASC' },
            });
            const otherFeatures = allFeatures.filter(f => f.id !== id);
            otherFeatures.sort((a, b) => a.displayOrder - b.displayOrder);
            const reorderedFeatures = [
                ...otherFeatures.slice(0, newOrder - 1),
                feature,
                ...otherFeatures.slice(newOrder - 1),
            ];
            for (let i = 0; i < reorderedFeatures.length; i++) {
                reorderedFeatures[i].displayOrder = -(i + 1);
            }
            await this.featureRepository.save(reorderedFeatures);
            for (let i = 0; i < reorderedFeatures.length; i++) {
                reorderedFeatures[i].displayOrder = i + 1;
            }
            await this.featureRepository.save(reorderedFeatures);
            feature.displayOrder = newOrder;
        }
        const updateData = { ...dto };
        if (dto.extractionKeywords) {
            updateData.extractionKeywords = JSON.stringify(dto.extractionKeywords);
        }
        Object.assign(feature, updateData);
        return this.featureRepository.save(feature);
    }
    async remove(id) {
        const feature = await this.findOne(id);
        feature.isActive = false;
        await this.featureRepository.save(feature);
        return { message: `Feature "${feature.name}" has been deactivated` };
    }
    async updateWeights(categoryId, dto) {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId, isActive: true },
        });
        if (!category) {
            throw new common_1.BadRequestException('Category not found or inactive');
        }
        const total = dto.features.reduce((s, f) => s + f.weightage, 0);
        if (total !== 100) {
            throw new common_1.BadRequestException(`Feature weights must sum to 100. Current total: ${total}`);
        }
        for (const f of dto.features) {
            await this.featureRepository.update(f.id, {
                weightage: f.weightage,
            });
        }
        return this.findAll(categoryId);
    }
    async validateWeightsForCategory(categoryId) {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId, isActive: true },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found or inactive');
        }
        const features = await this.featureRepository.find({
            where: { categoryId, isActive: true },
        });
        const totalWeight = features.reduce((sum, f) => sum + f.weightage, 0);
        return {
            categoryId,
            totalWeight,
            isValid: totalWeight === 100,
        };
    }
    async getWeightsByCategoryId(categoryId) {
        const features = await this.featureRepository.find({
            where: { categoryId, isActive: true },
            order: { displayOrder: 'ASC' },
        });
        return {
            categoryId,
            features: features.map(f => ({
                id: f.id,
                name: f.name,
                weightage: f.weightage,
            })),
        };
    }
    async getMaxDisplayOrder() {
        const r = await this.featureRepository
            .createQueryBuilder('f')
            .select('MAX(f.displayOrder)', 'max')
            .getRawOne();
        return r?.max || 0;
    }
    async shiftDisplayOrdersUp(fromOrder, excludeId) {
        const qb = this.featureRepository
            .createQueryBuilder('f')
            .where('f.displayOrder >= :fromOrder', { fromOrder })
            .orderBy('f.displayOrder', 'DESC');
        if (excludeId) {
            qb.andWhere('f.id != :excludeId', { excludeId });
        }
        const rows = await qb.getMany();
        for (const r of rows) {
            await this.featureRepository.update(r.id, {
                displayOrder: r.displayOrder + 1,
            });
        }
    }
    async shiftDisplayOrdersDown(fromOrder) {
        const rows = await this.featureRepository
            .createQueryBuilder('f')
            .where('f.displayOrder > :fromOrder', { fromOrder })
            .orderBy('f.displayOrder', 'ASC')
            .getMany();
        for (const r of rows) {
            await this.featureRepository.update(r.id, {
                displayOrder: r.displayOrder - 1,
            });
        }
    }
    async getFeatureAtDisplayOrder(order, excludeId) {
        const qb = this.featureRepository
            .createQueryBuilder('f')
            .where('f.displayOrder = :order', { order });
        if (excludeId) {
            qb.andWhere('f.id != :excludeId', { excludeId });
        }
        return qb.getOne();
    }
    async shiftDisplayOrdersBetween(fromOrder, toOrder, excludeId) {
        const qb = this.featureRepository
            .createQueryBuilder('f')
            .where('f.displayOrder >= :fromOrder', { fromOrder })
            .andWhere('f.displayOrder <= :toOrder', { toOrder })
            .orderBy('f.displayOrder', 'ASC');
        if (excludeId) {
            qb.andWhere('f.id != :excludeId', { excludeId });
        }
        const rows = await qb.getMany();
        for (const r of rows) {
            await this.featureRepository.update(r.id, {
                displayOrder: r.displayOrder - 1,
            });
        }
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