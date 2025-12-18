import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { BrochureUpload, ExtractionStatus } from '../../entities/brochure-upload.entity';
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

  async uploadBrochure(
    file: Express.Multer.File,
    uploadedById: number,
    companyId?: number,
    planId?: number,
  ): Promise<BrochureUpload> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Verify company exists if provided
    if (companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }
    }

    // Verify plan exists if provided
    if (planId) {
      const plan = await this.planRepository.findOne({
        where: { id: planId },
      });
      if (!plan) {
        throw new NotFoundException(`Plan with ID ${planId} not found`);
      }
    }

    const upload = this.brochureUploadRepository.create({
      originalFilename: file.originalname,
      storedFilename: file.filename,
      filePath: file.path,
      companyId,
      planId,
      uploadedById,
      extractionStatus: ExtractionStatus.PENDING,
    });

    return this.brochureUploadRepository.save(upload);
  }

  async getUpload(uploadId: number): Promise<BrochureUpload> {
    const upload = await this.brochureUploadRepository.findOne({
      where: { id: uploadId },
      relations: ['company', 'plan', 'uploadedBy'],
    });

    if (!upload) {
      throw new NotFoundException(`Upload with ID ${uploadId} not found`);
    }

    return upload;
  }

  async processExtraction(uploadId: number): Promise<BrochureUpload> {
    const upload = await this.getUpload(uploadId);

    if (upload.extractionStatus === ExtractionStatus.PROCESSING) {
      throw new BadRequestException('Extraction is already in progress');
    }

    // Update status to processing
    upload.extractionStatus = ExtractionStatus.PROCESSING;
    await this.brochureUploadRepository.save(upload);

    try {
      // Get all active features with their extraction keywords
      const features = await this.featureRepository.find({
        where: { isActive: true },
        relations: ['category'],
        order: { category: { displayOrder: 'ASC' }, displayOrder: 'ASC' },
      });

      if (features.length === 0) {
        throw new BadRequestException('No features defined. Please create features first.');
      }

      // Extract features using Gemini
      const extractedFeatures = await this.geminiService.extractFeaturesFromPdf(
        upload.filePath,
        features.map((f) => ({
          id: f.id,
          name: f.name,
          extractionKeywords: f.extractionKeywords,
          extractionPrompt: f.extractionPrompt,
        })),
      );

      // Standardize all extracted features
      this.logger.log('Starting standardization of extracted features...');
      const standardizedFeatures = await this.standardizationService.standardizeBatch(
        extractedFeatures,
        features,
      );
      this.logger.log(`Standardized ${standardizedFeatures.length} features`);

      // Update upload with extraction and standardization results
      upload.extractionStatus = ExtractionStatus.COMPLETED;
      upload.extractionResult = {
        extractedAt: new Date().toISOString(),
        featuresCount: standardizedFeatures.length,
        features: standardizedFeatures,
      };

      return this.brochureUploadRepository.save(upload);
    } catch (error) {
      upload.extractionStatus = ExtractionStatus.FAILED;
      upload.extractionResult = {
        error: error.message,
        failedAt: new Date().toISOString(),
      };
      await this.brochureUploadRepository.save(upload);
      throw error;
    }
  }

  async getExtractionStatus(uploadId: number): Promise<{
    status: ExtractionStatus;
    message: string;
  }> {
    const upload = await this.getUpload(uploadId);

    const messages = {
      [ExtractionStatus.PENDING]: 'Extraction has not started yet',
      [ExtractionStatus.PROCESSING]: 'Extraction is in progress',
      [ExtractionStatus.COMPLETED]: 'Extraction completed successfully',
      [ExtractionStatus.FAILED]: 'Extraction failed',
    };

    return {
      status: upload.extractionStatus,
      message: messages[upload.extractionStatus],
    };
  }

  async getExtractionResults(uploadId: number): Promise<any> {
    const upload = await this.getUpload(uploadId);

    if (upload.extractionStatus !== ExtractionStatus.COMPLETED) {
      throw new BadRequestException(
        `Extraction not completed. Current status: ${upload.extractionStatus}`,
      );
    }

    // Get all features to enrich the results
    const features = await this.featureRepository.find({
      where: { isActive: true },
      relations: ['category'],
    });

    const featureMap = new Map(features.map((f) => [f.id, f]));

    // Enrich extraction results with feature and category info
    const enrichedResults = upload.extractionResult.features.map((ef: any) => {
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

  async verifyAndSave(
    uploadId: number,
    verifyDto: VerifyExtractionDto,
  ): Promise<Plan> {
    const upload = await this.getUpload(uploadId);

    if (upload.extractionStatus !== ExtractionStatus.COMPLETED) {
      throw new BadRequestException('Extraction must be completed before verification');
    }

    let plan: Plan;

    // Create new plan or use existing
    if (verifyDto.planId) {
      plan = await this.planRepository.findOne({
        where: { id: verifyDto.planId },
      });
      if (!plan) {
        throw new NotFoundException(`Plan with ID ${verifyDto.planId} not found`);
      }
    } else {
      // Create new plan
      const companyId = verifyDto.companyId || upload.companyId;
      if (!companyId) {
        throw new BadRequestException('Company ID is required to create a new plan');
      }

      plan = this.planRepository.create({
        companyId,
        name: verifyDto.planName || `Plan from ${upload.originalFilename}`,
        brochureUrl: upload.filePath,
        status: PlanStatus.PENDING_REVIEW,
      });
      plan = await this.planRepository.save(plan);

      // Update upload with plan reference
      upload.planId = plan.id;
      await this.brochureUploadRepository.save(upload);
    }

    // Get all features for standardization
    const features = await this.featureRepository.find({
      where: { isActive: true },
    });
    const featureMap = new Map(features.map((f) => [f.id, f]));

    // Save verified feature values with standardization
    for (const fv of verifyDto.featureValues) {
      const feature = featureMap.get(fv.featureId);

      // Standardize the verified value (or extracted value if not verified)
      const valueToStandardize = fv.verifiedValue || fv.extractedValue;
      let standardizedValue: string = null;

      if (feature && valueToStandardize) {
        try {
          standardizedValue = await this.standardizationService.standardizeValue(
            valueToStandardize,
            feature,
          );
          this.logger.debug(`Standardized ${feature.name}: "${valueToStandardize}" -> "${standardizedValue}"`);
        } catch (error) {
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
      } else {
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

    // Return plan with feature values
    return this.planRepository.findOne({
      where: { id: plan.id },
      relations: ['company', 'featureValues', 'featureValues.feature'],
    });
  }

  async getAllUploads(): Promise<BrochureUpload[]> {
    return this.brochureUploadRepository.find({
      relations: ['company', 'plan', 'uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteUpload(uploadId: number): Promise<{ message: string }> {
    const upload = await this.getUpload(uploadId);

    // Delete file from filesystem
    if (fs.existsSync(upload.filePath)) {
      fs.unlinkSync(upload.filePath);
    }

    await this.brochureUploadRepository.remove(upload);
    return { message: 'Upload deleted successfully' };
  }
}
