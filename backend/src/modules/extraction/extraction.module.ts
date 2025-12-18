import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { GeminiService } from './gemini.service';
import { StandardizationService } from './standardization.service';
import { BrochureUpload } from '../../entities/brochure-upload.entity';
import { Plan } from '../../entities/plan.entity';
import { PlanFeatureValue } from '../../entities/plan-feature-value.entity';
import { Feature } from '../../entities/feature.entity';
import { Company } from '../../entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrochureUpload,
      Plan,
      PlanFeatureValue,
      Feature,
      Company,
    ]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [ExtractionController],
  providers: [ExtractionService, GeminiService, StandardizationService],
  exports: [ExtractionService, GeminiService, StandardizationService],
})
export class ExtractionModule {}
