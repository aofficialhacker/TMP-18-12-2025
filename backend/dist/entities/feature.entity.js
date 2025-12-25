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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const plan_feature_value_entity_1 = require("./plan-feature-value.entity");
const standardization_types_1 = require("../modules/extraction/types/standardization.types");
let Feature = class Feature {
};
exports.Feature = Feature;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Feature.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id' }),
    __metadata("design:type", Number)
], Feature.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, (category) => category.features, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], Feature.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Feature.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Feature.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Feature.prototype, "weightage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extraction_keywords', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Feature.prototype, "extractionKeywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extraction_prompt', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Feature.prototype, "extractionPrompt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'value_type',
        type: 'enum',
        enum: standardization_types_1.ValueType,
        default: standardization_types_1.ValueType.TEXT,
    }),
    __metadata("design:type", String)
], Feature.prototype, "valueType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'standardization_rules', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Feature.prototype, "standardizationRules", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Feature.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Feature.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => plan_feature_value_entity_1.PlanFeatureValue, (pfv) => pfv.feature),
    __metadata("design:type", Array)
], Feature.prototype, "planFeatureValues", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Feature.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Feature.prototype, "updatedAt", void 0);
exports.Feature = Feature = __decorate([
    (0, typeorm_1.Entity)('features'),
    (0, typeorm_1.Unique)(['displayOrder'])
], Feature);
//# sourceMappingURL=feature.entity.js.map