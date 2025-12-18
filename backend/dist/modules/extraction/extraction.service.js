"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ExtractionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = __importStar(require("fs"));
const brochure_upload_entity_1 = require("../../entities/brochure-upload.entity");
const plan_entity_1 = require("../../entities/plan.entity");
const plan_feature_value_entity_1 = require("../../entities/plan-feature-value.entity");
const feature_entity_1 = require("../../entities/feature.entity");
const company_entity_1 = require("../../entities/company.entity");
const gemini_service_1 = require("./gemini.service");
const standardization_service_1 = require("./standardization.service");
let ExtractionService = ExtractionService_1 = class ExtractionService {
    constructor(brochureUploadRepository, planRepository, planFeatureValueRepository, featureRepository, companyRepository, geminiService, standardizationService) {
        this.brochureUploadRepository = brochureUploadRepository;
        this.planRepository = planRepository;
        this.planFeatureValueRepository = planFeatureValueRepository;
        this.featureRepository = featureRepository;
        this.companyRepository = companyRepository;
        this.geminiService = geminiService;
        this.standardizationService = standardizationService;
        this.logger = new common_1.Logger(ExtractionService_1.name);
    }
    async uploadBrochure(file, uploadedById, companyId, planId) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        if (companyId) {
            const company = await this.companyRepository.findOne({
                where: { id: companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${companyId} not found`);
            }
        }
        if (planId) {
            const plan = await this.planRepository.findOne({
                where: { id: planId },
            });
            if (!plan) {
                throw new common_1.NotFoundException(`Plan with ID ${planId} not found`);
            }
        }
        const upload = this.brochureUploadRepository.create({
            originalFilename: file.originalname,
            storedFilename: file.filename,
            filePath: file.path,
            companyId,
            planId,
            uploadedById,
            extractionStatus: brochure_upload_entity_1.ExtractionStatus.PENDING,
        });
        return this.brochureUploadRepository.save(upload);
    }
    async getUpload(uploadId) {
        const upload = await this.brochureUploadRepository.findOne({
            where: { id: uploadId },
            relations: ['company', 'plan', 'uploadedBy'],
        });
        if (!upload) {
            throw new common_1.NotFoundException(`Upload with ID ${uploadId} not found`);
        }
        return upload;
    }
    async processExtraction(uploadId) {
        const upload = await this.getUpload(uploadId);
        if (upload.extractionStatus === brochure_upload_entity_1.ExtractionStatus.PROCESSING) {
            throw new common_1.BadRequestException('Extraction is already in progress');
        }
        upload.extractionStatus = brochure_upload_entity_1.ExtractionStatus.PROCESSING;
        await this.brochureUploadRepository.save(upload);
        try {
            const features = await this.featureRepository.find({
                where: { isActive: true },
                relations: ['category'],
                order: { category: { displayOrder: 'ASC' }, displayOrder: 'ASC' },
            });
            if (features.length === 0) {
                throw new common_1.BadRequestException('No features defined. Please create features first.');
            }
            const extractedFeatures = await this.geminiService.extractFeaturesFromPdf(upload.filePath, features.map((f) => ({
                id: f.id,
                name: f.name,
                extractionKeywords: f.extractionKeywords,
                extractionPrompt: f.extractionPrompt,
            })));
            this.logger.log('Starting standardization of extracted features...');
            const standardizedFeatures = await this.standardizationService.standardizeBatch(extractedFeatures, features);
            this.logger.log(`Standardized ${standardizedFeatures.length} features`);
            upload.extractionStatus = brochure_upload_entity_1.ExtractionStatus.COMPLETED;
            upload.extractionResult = {
                extractedAt: new Date().toISOString(),
                featuresCount: standardizedFeatures.length,
                features: standardizedFeatures,
            };
            return this.brochureUploadRepository.save(upload);
        }
        catch (error) {
            upload.extractionStatus = brochure_upload_entity_1.ExtractionStatus.FAILED;
            upload.extractionResult = {
                error: error.message,
                failedAt: new Date().toISOString(),
            };
            await this.brochureUploadRepository.save(upload);
            throw error;
        }
    }
    async getExtractionStatus(uploadId) {
        const upload = await this.getUpload(uploadId);
        const messages = {
            [brochure_upload_entity_1.ExtractionStatus.PENDING]: 'Extraction has not started yet',
            [brochure_upload_entity_1.ExtractionStatus.PROCESSING]: 'Extraction is in progress',
            [brochure_upload_entity_1.ExtractionStatus.COMPLETED]: 'Extraction completed successfully',
            [brochure_upload_entity_1.ExtractionStatus.FAILED]: 'Extraction failed',
        };
        return {
            status: upload.extractionStatus,
            message: messages[upload.extractionStatus],
        };
    }
    async getExtractionResults(uploadId) {
        const upload = await this.getUpload(uploadId);
        if (upload.extractionStatus !== brochure_upload_entity_1.ExtractionStatus.COMPLETED) {
            throw new common_1.BadRequestException(`Extraction not completed. Current status: ${upload.extractionStatus}`);
        }
        const features = await this.featureRepository.find({
            where: { isActive: true },
            relations: ['category'],
        });
        const featureMap = new Map(features.map((f) => [f.id, f]));
        const enrichedResults = upload.extractionResult.features.map((ef) => {
            const feature = featureMap.get(ef.featureId);
            return {
                ...ef,
                standardizedValue: ef.standardizedValue || null,
                categoryId: feature?.categoryId,
                categoryName: feature?.category?.name,
                featureDescription: feature?.description,
                valueType: feature?.valueType,
            };
        });
        return {
            uploadId: upload.id,
            originalFilename: upload.originalFilename,
            extractedAt: upload.extractionResult.extractedAt,
            companyId: upload.companyId,
            planId: upload.planId,
            features: enrichedResults,
        };
    }
    async verifyAndSave(uploadId, verifyDto) {
        const upload = await this.getUpload(uploadId);
        if (upload.extractionStatus !== brochure_upload_entity_1.ExtractionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Extraction must be completed before verification');
        }
        let plan;
        if (verifyDto.planId) {
            plan = await this.planRepository.findOne({
                where: { id: verifyDto.planId },
            });
            if (!plan) {
                throw new common_1.NotFoundException(`Plan with ID ${verifyDto.planId} not found`);
            }
        }
        else {
            const companyId = verifyDto.companyId || upload.companyId;
            if (!companyId) {
                throw new common_1.BadRequestException('Company ID is required to create a new plan');
            }
            plan = this.planRepository.create({
                companyId,
                name: verifyDto.planName || `Plan from ${upload.originalFilename}`,
                brochureUrl: upload.filePath,
                status: plan_entity_1.PlanStatus.PENDING_REVIEW,
            });
            plan = await this.planRepository.save(plan);
            upload.planId = plan.id;
            await this.brochureUploadRepository.save(upload);
        }
        const features = await this.featureRepository.find({
            where: { isActive: true },
        });
        const featureMap = new Map(features.map((f) => [f.id, f]));
        for (const fv of verifyDto.featureValues) {
            const feature = featureMap.get(fv.featureId);
            const valueToStandardize = fv.verifiedValue || fv.extractedValue;
            let standardizedValue = null;
            if (feature && valueToStandardize) {
                try {
                    standardizedValue = await this.standardizationService.standardizeValue(valueToStandardize, feature);
                    this.logger.debug(`Standardized ${feature.name}: "${valueToStandardize}" -> "${standardizedValue}"`);
                }
                catch (error) {
                    this.logger.warn(`Failed to standardize value for ${feature.name}: ${error.message}`);
                }
            }
            let planFeatureValue = await this.planFeatureValueRepository.findOne({
                where: { planId: plan.id, featureId: fv.featureId },
            });
            if (planFeatureValue) {
                planFeatureValue.extractedValue = fv.extractedValue;
                planFeatureValue.verifiedValue = fv.verifiedValue;
                planFeatureValue.standardizedValue = standardizedValue;
                planFeatureValue.isVerified = fv.isVerified ?? true;
            }
            else {
                planFeatureValue = this.planFeatureValueRepository.create({
                    planId: plan.id,
                    featureId: fv.featureId,
                    extractedValue: fv.extractedValue,
                    verifiedValue: fv.verifiedValue,
                    standardizedValue: standardizedValue,
                    isVerified: fv.isVerified ?? true,
                });
            }
            await this.planFeatureValueRepository.save(planFeatureValue);
        }
        return this.planRepository.findOne({
            where: { id: plan.id },
            relations: ['company', 'featureValues', 'featureValues.feature'],
        });
    }
    async getAllUploads() {
        return this.brochureUploadRepository.find({
            relations: ['company', 'plan', 'uploadedBy'],
            order: { createdAt: 'DESC' },
        });
    }
    async deleteUpload(uploadId) {
        const upload = await this.getUpload(uploadId);
        if (fs.existsSync(upload.filePath)) {
            fs.unlinkSync(upload.filePath);
        }
        await this.brochureUploadRepository.remove(upload);
        return { message: 'Upload deleted successfully' };
    }
};
exports.ExtractionService = ExtractionService;
exports.ExtractionService = ExtractionService = ExtractionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(brochure_upload_entity_1.BrochureUpload)),
    __param(1, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(2, (0, typeorm_1.InjectRepository)(plan_feature_value_entity_1.PlanFeatureValue)),
    __param(3, (0, typeorm_1.InjectRepository)(feature_entity_1.Feature)),
    __param(4, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        gemini_service_1.GeminiService,
        standardization_service_1.StandardizationService])
], ExtractionService);
//# sourceMappingURL=extraction.service.js.map