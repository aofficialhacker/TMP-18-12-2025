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
exports.Plan = exports.PlanStatus = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("./company.entity");
const plan_feature_value_entity_1 = require("./plan-feature-value.entity");
const brochure_upload_entity_1 = require("./brochure-upload.entity");
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["DRAFT"] = "draft";
    PlanStatus["PENDING_REVIEW"] = "pending_review";
    PlanStatus["PUBLISHED"] = "published";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
let Plan = class Plan {
};
exports.Plan = Plan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Plan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_id' }),
    __metadata("design:type", Number)
], Plan.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, (company) => company.plans, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", company_entity_1.Company)
], Plan.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Plan.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sum_insured_min', type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Plan.prototype, "sumInsuredMin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sum_insured_max', type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Plan.prototype, "sumInsuredMax", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Plan.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brochure_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], Plan.prototype, "brochureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PlanStatus,
        default: PlanStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Plan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Plan.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => plan_feature_value_entity_1.PlanFeatureValue, (pfv) => pfv.plan),
    __metadata("design:type", Array)
], Plan.prototype, "featureValues", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => brochure_upload_entity_1.BrochureUpload, (upload) => upload.plan),
    __metadata("design:type", Array)
], Plan.prototype, "uploads", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Plan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Plan.prototype, "updatedAt", void 0);
exports.Plan = Plan = __decorate([
    (0, typeorm_1.Entity)('plans')
], Plan);
//# sourceMappingURL=plan.entity.js.map