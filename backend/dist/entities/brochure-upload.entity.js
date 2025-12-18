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
exports.BrochureUpload = exports.ExtractionStatus = void 0;
const typeorm_1 = require("typeorm");
const plan_entity_1 = require("./plan.entity");
const company_entity_1 = require("./company.entity");
const admin_user_entity_1 = require("./admin-user.entity");
var ExtractionStatus;
(function (ExtractionStatus) {
    ExtractionStatus["PENDING"] = "pending";
    ExtractionStatus["PROCESSING"] = "processing";
    ExtractionStatus["COMPLETED"] = "completed";
    ExtractionStatus["FAILED"] = "failed";
})(ExtractionStatus || (exports.ExtractionStatus = ExtractionStatus = {}));
let BrochureUpload = class BrochureUpload {
};
exports.BrochureUpload = BrochureUpload;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BrochureUpload.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_id', nullable: true }),
    __metadata("design:type", Number)
], BrochureUpload.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, (plan) => plan.uploads, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", plan_entity_1.Plan)
], BrochureUpload.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_id', nullable: true }),
    __metadata("design:type", Number)
], BrochureUpload.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, (company) => company.uploads, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", company_entity_1.Company)
], BrochureUpload.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'original_filename', length: 255 }),
    __metadata("design:type", String)
], BrochureUpload.prototype, "originalFilename", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stored_filename', length: 255 }),
    __metadata("design:type", String)
], BrochureUpload.prototype, "storedFilename", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path', length: 500 }),
    __metadata("design:type", String)
], BrochureUpload.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'extraction_status',
        type: 'enum',
        enum: ExtractionStatus,
        default: ExtractionStatus.PENDING,
    }),
    __metadata("design:type", String)
], BrochureUpload.prototype, "extractionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extraction_result', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BrochureUpload.prototype, "extractionResult", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by' }),
    __metadata("design:type", Number)
], BrochureUpload.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => admin_user_entity_1.AdminUser, (user) => user.uploads, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", admin_user_entity_1.AdminUser)
], BrochureUpload.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BrochureUpload.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BrochureUpload.prototype, "updatedAt", void 0);
exports.BrochureUpload = BrochureUpload = __decorate([
    (0, typeorm_1.Entity)('brochure_uploads')
], BrochureUpload);
//# sourceMappingURL=brochure-upload.entity.js.map