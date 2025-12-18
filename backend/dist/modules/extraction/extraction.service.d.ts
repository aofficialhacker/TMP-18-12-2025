import { Repository } from 'typeorm';
import { BrochureUpload, ExtractionStatus } from '../../entities/brochure-upload.entity';
import { Plan } from '../../entities/plan.entity';
import { PlanFeatureValue } from '../../entities/plan-feature-value.entity';
import { Feature } from '../../entities/feature.entity';
import { Company } from '../../entities/company.entity';
import { GeminiService } from './gemini.service';
import { StandardizationService } from './standardization.service';
import { VerifyExtractionDto } from './dto/verify.dto';
export declare class ExtractionService {
    private readonly brochureUploadRepository;
    private readonly planRepository;
    private readonly planFeatureValueRepository;
    private readonly featureRepository;
    private readonly companyRepository;
    private readonly geminiService;
    private readonly standardizationService;
    private readonly logger;
    constructor(brochureUploadRepository: Repository<BrochureUpload>, planRepository: Repository<Plan>, planFeatureValueRepository: Repository<PlanFeatureValue>, featureRepository: Repository<Feature>, companyRepository: Repository<Company>, geminiService: GeminiService, standardizationService: StandardizationService);
    uploadBrochure(file: Express.Multer.File, uploadedById: number, companyId?: number, planId?: number): Promise<BrochureUpload>;
    getUpload(uploadId: number): Promise<BrochureUpload>;
    processExtraction(uploadId: number): Promise<BrochureUpload>;
    getExtractionStatus(uploadId: number): Promise<{
        status: ExtractionStatus;
        message: string;
    }>;
    getExtractionResults(uploadId: number): Promise<any>;
    verifyAndSave(uploadId: number, verifyDto: VerifyExtractionDto): Promise<Plan>;
    getAllUploads(): Promise<BrochureUpload[]>;
    deleteUpload(uploadId: number): Promise<{
        message: string;
    }>;
}
