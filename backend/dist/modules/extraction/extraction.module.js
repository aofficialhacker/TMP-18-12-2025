"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const extraction_controller_1 = require("./extraction.controller");
const extraction_service_1 = require("./extraction.service");
const gemini_service_1 = require("./gemini.service");
const standardization_service_1 = require("./standardization.service");
const brochure_upload_entity_1 = require("../../entities/brochure-upload.entity");
const plan_entity_1 = require("../../entities/plan.entity");
const plan_feature_value_entity_1 = require("../../entities/plan-feature-value.entity");
const feature_entity_1 = require("../../entities/feature.entity");
const company_entity_1 = require("../../entities/company.entity");
let ExtractionModule = class ExtractionModule {
};
exports.ExtractionModule = ExtractionModule;
exports.ExtractionModule = ExtractionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                brochure_upload_entity_1.BrochureUpload,
                plan_entity_1.Plan,
                plan_feature_value_entity_1.PlanFeatureValue,
                feature_entity_1.Feature,
                company_entity_1.Company,
            ]),
            platform_express_1.MulterModule.register({
                dest: './uploads',
            }),
        ],
        controllers: [extraction_controller_1.ExtractionController],
        providers: [extraction_service_1.ExtractionService, gemini_service_1.GeminiService, standardization_service_1.StandardizationService],
        exports: [extraction_service_1.ExtractionService, gemini_service_1.GeminiService, standardization_service_1.StandardizationService],
    })
], ExtractionModule);
//# sourceMappingURL=extraction.module.js.map