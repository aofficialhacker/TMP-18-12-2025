import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter } from 'events';
import * as fs from 'fs';

import {
  BrochureUpload,
  ExtractionStatus,
} from '../../entities/brochure-upload.entity';
import { Plan, PlanStatus } from '../../entities/plan.entity';
import { PlanFeatureValue } from '../../entities/plan-feature-value.entity';
import { Feature } from '../../entities/feature.entity';
import { Company } from '../../entities/company.entity';

import { GeminiService } from './gemini.service';
import { StandardizationService } from './standardization.service';
import { VerifyExtractionDto } from './dto/verify.dto';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  // ✅ in-memory progress emitter (safe)
  private readonly progressEmitter = new EventEmitter();

  constructor(
    @InjectRepository(BrochureUpload)
    private readonly brochureUploadRepository: Repository<BrochureUpload>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(PlanFeatureValue)
    private readonly planFeatureValueRepository: Repository<PlanFeatureValue>,

    @InjectRepository(Feature)
    private readonly featureRepository: Repository<Feature>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    private readonly geminiService: GeminiService,
    private readonly standardizationService: StandardizationService,
  ) {}

  /* ================= PROGRESS EVENTS ================= */

  onProgress(uploadId: number, listener: any) {
    this.progressEmitter.on(`progress:${uploadId}`, listener);
  }

  offProgress(uploadId: number, listener: any) {
    this.progressEmitter.off(`progress:${uploadId}`, listener);
  }

  private async updateProgress(
    upload: BrochureUpload,
    progress: number,
    status?: ExtractionStatus,
  ) {
    upload.extractionProgress = progress;
    if (status) upload.extractionStatus = status;

    await this.brochureUploadRepository.save(upload);

    // 🔹 FORCE ASYNC FLUSH (CRITICAL FIX)
    await new Promise(res => setTimeout(res, 300));

    this.progressEmitter.emit(`progress:${upload.id}`, {
      uploadId: upload.id,
      status: upload.extractionStatus,
      progress: upload.extractionProgress,
    });
  }

  // ------------------- UPLOAD -------------------

  async uploadBrochure(
    file: Express.Multer.File,
    uploadedById: number,
    companyId?: number,
    planId?: number,
  ): Promise<BrochureUpload> {
    if (!file) throw new BadRequestException('No file uploaded');

    if (companyId) {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      if (!company) throw new NotFoundException(`Company ${companyId} not found`);
    }

    if (planId) {
      const plan = await this.planRepository.findOne({ where: { id: planId } });
      if (!plan) throw new NotFoundException(`Plan ${planId} not found`);
    }

    const upload = this.brochureUploadRepository.create({
      originalFilename: file.originalname,
      storedFilename: file.filename,
      filePath: file.path,
      companyId,
      planId,
      uploadedById,
      extractionStatus: ExtractionStatus.PENDING,
      extractionProgress: 0,
    });

    return this.brochureUploadRepository.save(upload);
  }

  async getUpload(uploadId: number): Promise<BrochureUpload> {
    const upload = await this.brochureUploadRepository.findOne({
      where: { id: uploadId },
      relations: ['company', 'plan', 'uploadedBy'],
    });
    if (!upload) throw new NotFoundException(`Upload ${uploadId} not found`);
    return upload;
  }

  async getAllUploads(): Promise<BrochureUpload[]> {
    return this.brochureUploadRepository.find({
      relations: ['company', 'plan', 'uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  // ------------------- EXTRACTION -------------------

  async processExtraction(uploadId: number): Promise<BrochureUpload> {
    const upload = await this.getUpload(uploadId);

    if (
      upload.extractionStatus === ExtractionStatus.PROCESSING ||
      upload.extractionStatus === ExtractionStatus.COMPLETED
    ) {
      throw new BadRequestException(`Extraction already ${upload.extractionStatus}`);
    }

    try {
      await this.updateProgress(upload, 10, ExtractionStatus.PROCESSING);

      const features = await this.featureRepository.find({
        where: { isActive: true },
        relations: ['category'],
      });

      await this.updateProgress(upload, 25);

      const extracted = await this.geminiService.extractFeaturesFromPdf(
        upload.filePath,
        features.map(f => ({
          id: f.id,
          name: f.name,
          extractionKeywords: f.extractionKeywords,
          extractionPrompt: f.extractionPrompt,
        })),
      );

      await this.updateProgress(upload, 55);

      const standardized = await this.standardizationService.standardizeBatch(
        extracted,
        features,
      );

      upload.extractionResult = {
        extractedAt: new Date().toISOString(),
        features: standardized,
      };

      await this.updateProgress(upload, 100, ExtractionStatus.COMPLETED);

      return upload;
    } catch (error) {
      this.logger.error(error.message);
      await this.updateProgress(upload, 0, ExtractionStatus.FAILED);
      throw error;
    }
  }

  async getExtractionStatus(uploadId: number) {
    const upload = await this.getUpload(uploadId);
    return {
      uploadId,
      status: upload.extractionStatus,
      progress: upload.extractionProgress,
    };
  }

  // ------------------- RESULTS -------------------

  async getExtractionResults(uploadId: number) {
    const upload = await this.getUpload(uploadId);
    if (upload.extractionStatus !== ExtractionStatus.COMPLETED) {
      throw new BadRequestException('Extraction not completed');
    }

    const extractedFeatures = upload.extractionResult?.features || [];
    const featureIds = extractedFeatures.map(f => f.featureId);

    const dbFeatures = await this.featureRepository.find({
      where: { id: In(featureIds) },
      relations: ['category'],
    });

    const categoryMap = new Map<number, string>();
    dbFeatures.forEach(f =>
      categoryMap.set(f.id, f.category?.name || '-'),
    );

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

  // ------------------- VERIFY -------------------

  async verifyAndSave(uploadId: number, verifyDto: VerifyExtractionDto): Promise<Plan> {
    const upload = await this.getUpload(uploadId);
    if (!upload.planId) throw new BadRequestException('Upload not linked to plan');

    const plan = await this.planRepository.findOne({ where: { id: upload.planId } });
    if (!plan) throw new NotFoundException('Plan not found');

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

    plan.status = PlanStatus.UPLOAD_COMPLETE;
    return this.planRepository.save(plan);
  }

  // ------------------- DELETE -------------------

  async deleteUpload(uploadId: number) {
    const upload = await this.getUpload(uploadId);
    if (fs.existsSync(upload.filePath)) fs.unlinkSync(upload.filePath);
    await this.brochureUploadRepository.remove(upload);
    return { message: 'Upload deleted successfully' };
  }
}
