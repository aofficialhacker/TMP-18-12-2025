import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🔴 MUST COME FIRST
  app.setGlobalPrefix('api');

  // Ensure uploads directory exists
  const uploadPath = join(process.cwd(), 'uploads/companies');
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  // ✅ Static assets under /api/uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads',
  });

  app.enableCors({
    origin: ['http://localhost:4200'],
    credentials: true,
  });

  // ✅ FINAL & CORRECT ValidationPipe setup
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // 🔥 THIS FIXES companyId issue
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running at http://localhost:${port}/api`);
}

bootstrap();
