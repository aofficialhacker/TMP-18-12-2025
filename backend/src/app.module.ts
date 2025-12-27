import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FeaturesModule } from './modules/features/features.module';
import { PlansModule } from './modules/plans/plans.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { ImageProxyController } from './image-proxy.controller';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot(databaseConfig()),
    AuthModule,
    CompaniesModule,
    CategoriesModule,
    FeaturesModule,
    PlansModule,
    ExtractionModule,
  ],
  controllers: [
    ImageProxyController
  ],
})
export class AppModule {}
