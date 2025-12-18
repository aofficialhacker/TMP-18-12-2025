import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { Plan } from '../../entities/plan.entity';
import { PlanFeatureValue } from '../../entities/plan-feature-value.entity';
import { Company } from '../../entities/company.entity';
import { Feature } from '../../entities/feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanFeatureValue, Company, Feature])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
