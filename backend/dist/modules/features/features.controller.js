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
exports.FeaturesController = void 0;
const common_1 = require("@nestjs/common");
const features_service_1 = require("./features.service");
const create_feature_dto_1 = require("./dto/create-feature.dto");
const update_feature_dto_1 = require("./dto/update-feature.dto");
const update_weights_dto_1 = require("./dto/update-weights.dto");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
let FeaturesController = class FeaturesController {
    constructor(featuresService) {
        this.featuresService = featuresService;
    }
    findAll(categoryId, includeInactive) {
        const catId = categoryId ? parseInt(categoryId, 10) : undefined;
        return this.featuresService.findAll(catId, includeInactive === 'true');
    }
    validateWeights(categoryId) {
        return this.featuresService.validateWeightsForCategory(categoryId);
    }
    getWeightsByCategory(categoryId) {
        return this.featuresService.getWeightsByCategoryId(categoryId);
    }
    findOne(id) {
        return this.featuresService.findOne(id);
    }
    create(createFeatureDto) {
        return this.featuresService.create(createFeatureDto);
    }
    updateWeights(categoryId, updateWeightsDto) {
        return this.featuresService.updateWeights(categoryId, updateWeightsDto);
    }
    update(id, updateFeatureDto) {
        return this.featuresService.update(id, updateFeatureDto);
    }
    remove(id) {
        return this.featuresService.remove(id);
    }
};
exports.FeaturesController = FeaturesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('categoryId')),
    __param(1, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('validate-weights/:categoryId'),
    __param(0, (0, common_1.Param)('categoryId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "validateWeights", null);
__decorate([
    (0, common_1.Get)('weights/:categoryId'),
    __param(0, (0, common_1.Param)('categoryId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "getWeightsByCategory", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_feature_dto_1.CreateFeatureDto]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('weights/:categoryId'),
    __param(0, (0, common_1.Param)('categoryId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_weights_dto_1.UpdateFeatureWeightsDto]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "updateWeights", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_feature_dto_1.UpdateFeatureDto]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "remove", null);
exports.FeaturesController = FeaturesController = __decorate([
    (0, common_1.Controller)('features'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [features_service_1.FeaturesService])
], FeaturesController);
//# sourceMappingURL=features.controller.js.map