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
const events_1 = require("events");
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
        this.progressEmitter = new events_1.EventEmitter();
    }
    onProgress(uploadId, listener) {
        this.progressEmitter.on(`progress:${uploadId}`, listener);
    }
    offProgress(uploadId, listener) {
        this.progressEmitter.off(`progress:${uploadId}`, listener);
    }
    async updateProgress(upload, progress, status) {
        upload.extractionProgress = progress;
        if (status)
            upload.extractionStatus = status;
        await this.brochureUploadRepository.save(upload);
        await new Promise(res => setTimeout(res, 300));
        this.progressEmitter.emit(`progress:${upload.id}`, {
            uploadId: upload.id,
            status: upload.extractionStatus,
            progress: upload.extractionProgress,
        });
    }
    async uploadBrochure(file, uploadedById, companyId, planId) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        if (companyId) {
            const company = await this.companyRepository.findOne({ where: { id: companyId } });
            if (!company)
                throw new common_1.NotFoundException(`Company ${companyId} not found`);
        }
        if (planId) {
            const plan = await this.planRepository.findOne({ where: { id: planId } });
            if (!plan)
                throw new common_1.NotFoundException(`Plan ${planId} not found`);
        }
        const upload = this.brochureUploadRepository.create({
            originalFilename: file.originalname,
            storedFilename: file.filename,
            filePath: file.path,
            companyId,
            planId,
            uploadedById,
            extractionStatus: brochure_upload_entity_1.ExtractionStatus.PENDING,
            extractionProgress: 0,
        });
        return this.brochureUploadRepository.save(upload);
    }
    async getUpload(uploadId) {
        const upload = await this.brochureUploadRepository.findOne({
            where: { id: uploadId },
            relations: ['company', 'plan', 'uploadedBy'],
        });
        if (!upload)
            throw new common_1.NotFoundException(`Upload ${uploadId} not found`);
        return upload;
    }
    async getAllUploads() {
        return this.brochureUploadRepository.find({
            relations: ['company', 'plan', 'uploadedBy'],
            order: { createdAt: 'DESC' },
        });
    }
    async processExtraction(uploadId) {
        const upload = await this.getUpload(uploadId);
        if (upload.extractionStatus === brochure_upload_entity_1.ExtractionStatus.PROCESSING ||
            upload.extractionStatus === brochure_upload_entity_1.ExtractionStatus.COMPLETED) {
            throw new common_1.BadRequestException(`Extraction already ${upload.extractionStatus}`);
        }
        try {
            await this.updateProgress(upload, 10, brochure_upload_entity_1.ExtractionStatus.PROCESSING);
            const features = await this.featureRepository.find({
                where: { isActive: true },
                relations: ['category'],
            });
            await this.updateProgress(upload, 25);
            const extracted = await this.geminiService.extractFeaturesFromPdf(upload.filePath, features.map(f => ({
                id: f.id,
                name: f.name,
                extractionKeywords: f.extractionKeywords,
                extractionPrompt: f.extractionPrompt,
            })));
            await this.updateProgress(upload, 55);
            const standardized = await this.standardizationService.standardizeBatch(extracted, features);
            upload.extractionResult = {
                extractedAt: new Date().toISOString(),
                features: standardized,
            };
            await this.updateProgress(upload, 100, brochure_upload_entity_1.ExtractionStatus.COMPLETED);
            return upload;
        }
        catch (error) {
            this.logger.error(error.message);
            await this.updateProgress(upload, 0, brochure_upload_entity_1.ExtractionStatus.FAILED);
            throw error;
        }
    }
    async getExtractionStatus(uploadId) {
        const upload = await this.getUpload(uploadId);
        return {
            uploadId,
            status: upload.extractionStatus,
            progress: upload.extractionProgress,
        };
    }
    async getExtractionResults(uploadId) {
        const upload = await this.getUpload(uploadId);
        if (upload.extractionStatus !== brochure_upload_entity_1.ExtractionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Extraction not completed');
        }
        const extractedFeatures = upload.extractionResult?.features || [];
        const featureIds = extractedFeatures.map(f => f.featureId);
        const dbFeatures = await this.featureRepository.find({
            where: { id: (0, typeorm_2.In)(featureIds) },
            relations: ['category'],
        });
        const categoryMap = new Map();
        dbFeatures.forEach(f => categoryMap.set(f.id, f.category?.name || '-'));
        return {
            uploadId: upload.id,
            originalFilename: upload.originalFilename,
            extractedAt: upload.extractionResult.extractedAt,
            company: upload.company,
            plan: upload.plan,
            features: extractedFeatures.map(f => ({
                ...f,
                categoryName: categoryMap.get(f.featureId) || '-',
            })),
        };
    }
    async verifyAndSave(uploadId, verifyDto) {
        const upload = await this.getUpload(uploadId);
        if (!upload.planId)
            throw new common_1.BadRequestException('Upload not linked to plan');
        const plan = await this.planRepository.findOne({ where: { id: upload.planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        for (const fv of verifyDto.featureValues) {
            let pfv = await this.planFeatureValueRepository.findOne({
                where: { planId: plan.id, featureId: fv.featureId },
            });
            if (!pfv) {
                pfv = this.planFeatureValueRepository.create({
                    planId: plan.id,
                    featureId: fv.featureId,
                });
            }
            pfv.extractedValue = fv.extractedValue;
            pfv.verifiedValue = fv.verifiedValue;
            pfv.isVerified = true;
            await this.planFeatureValueRepository.save(pfv);
        }
        plan.status = plan_entity_1.PlanStatus.UPLOAD_COMPLETE;
        return this.planRepository.save(plan);
    }
    async deleteUpload(uploadId) {
        const upload = await this.getUpload(uploadId);
        if (fs.existsSync(upload.filePath))
            fs.unlinkSync(upload.filePath);
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