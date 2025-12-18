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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("../../entities/category.entity");
let CategoriesService = class CategoriesService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async findAll(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };
        return this.categoryRepository.find({
            where,
            relations: ['features'],
            order: { displayOrder: 'ASC', name: 'ASC' },
        });
    }
    async findOne(id) {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['features'],
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }
    async create(createCategoryDto) {
        const category = this.categoryRepository.create(createCategoryDto);
        return this.categoryRepository.save(category);
    }
    async update(id, updateCategoryDto) {
        const category = await this.findOne(id);
        Object.assign(category, updateCategoryDto);
        return this.categoryRepository.save(category);
    }
    async remove(id) {
        const category = await this.findOne(id);
        category.isActive = false;
        await this.categoryRepository.save(category);
        return { message: `Category ${category.name} has been deactivated` };
    }
    async updateWeights(updateWeightsDto) {
        const { categories } = updateWeightsDto;
        const totalWeight = categories.reduce((sum, cat) => sum + cat.weightage, 0);
        if (totalWeight !== 100) {
            throw new common_1.BadRequestException(`Category weights must sum to 100. Current total: ${totalWeight}`);
        }
        const categoryIds = categories.map((c) => c.id);
        const existingCategories = await this.categoryRepository.find({
            where: categoryIds.map((id) => ({ id, isActive: true })),
        });
        if (existingCategories.length !== categoryIds.length) {
            throw new common_1.BadRequestException('One or more categories not found or inactive');
        }
        for (const catWeight of categories) {
            await this.categoryRepository.update(catWeight.id, {
                weightage: catWeight.weightage,
            });
        }
        return this.findAll();
    }
    async getTotalWeight() {
        const categories = await this.categoryRepository.find({
            where: { isActive: true },
        });
        return categories.reduce((sum, cat) => sum + cat.weightage, 0);
    }
    async validateWeightsSum() {
        const total = await this.getTotalWeight();
        const valid = total === 100;
        return {
            valid,
            total,
            message: valid
                ? 'Category weights are valid (sum = 100)'
                : `Category weights must sum to 100. Current total: ${total}`,
        };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map