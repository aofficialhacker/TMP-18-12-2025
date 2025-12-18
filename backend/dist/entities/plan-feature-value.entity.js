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
exports.PlanFeatureValue = void 0;
const typeorm_1 = require("typeorm");
const plan_entity_1 = require("./plan.entity");
const feature_entity_1 = require("./feature.entity");
let PlanFeatureValue = class PlanFeatureValue {
};
exports.PlanFeatureValue = PlanFeatureValue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PlanFeatureValue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_id' }),
    __metadata("design:type", Number)
], PlanFeatureValue.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, (plan) => plan.featureValues, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", plan_entity_1.Plan)
], PlanFeatureValue.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'feature_id' }),
    __metadata("design:type", Number)
], PlanFeatureValue.prototype, "featureId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => feature_entity_1.Feature, (feature) => feature.planFeatureValues, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'feature_id' }),
    __metadata("design:type", feature_entity_1.Feature)
], PlanFeatureValue.prototype, "feature", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extracted_value', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PlanFeatureValue.prototype, "extractedValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_value', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PlanFeatureValue.prototype, "verifiedValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'standardized_value', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], PlanFeatureValue.prototype, "standardizedValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_verified', default: false }),
    __metadata("design:type", Boolean)
], PlanFeatureValue.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PlanFeatureValue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PlanFeatureValue.prototype, "updatedAt", void 0);
exports.PlanFeatureValue = PlanFeatureValue = __decorate([
    (0, typeorm_1.Entity)('plan_feature_values'),
    (0, typeorm_1.Unique)(['planId', 'featureId'])
], PlanFeatureValue);
//# sourceMappingURL=plan-feature-value.entity.js.map