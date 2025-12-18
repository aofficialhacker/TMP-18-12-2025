import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExtractionService } from './extraction.service';
import { VerifyExtractionDto } from './dto/verify.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('extraction')
@UseGuards(JwtAuthGuard)
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Get('uploads')
  getAllUploads() {
    return this.extractionService.getAllUploads();
  }

  @Get(':uploadId')
  getUpload(@Param('uploadId', ParseIntPipe) uploadId: number) {
    return this.extractionService.getUpload(uploadId);
  }

  @Get(':uploadId/status')
  getStatus(@Param('uploadId', ParseIntPipe) uploadId: number) {
    return this.extractionService.getExtractionStatus(uploadId);
  }

  @Get(':uploadId/results')
  getResults(@Param('uploadId', ParseIntPipe) uploadId: number) {
    return this.extractionService.getExtractionResults(uploadId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `brochure-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(new Error('Only PDF files are allowed'), false);
        } else {
          callback(null, true);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadBrochure(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Query('companyId') companyId?: string,
    @Query('planId') planId?: string,
  ) {
    const cId = companyId ? parseInt(companyId, 10) : undefined;
    const pId = planId ? parseInt(planId, 10) : undefined;
    return this.extractionService.uploadBrochure(file, req.user.id, cId, pId);
  }

  @Post(':uploadId/process')
  processExtraction(@Param('uploadId', ParseIntPipe) uploadId: number) {
    return this.extractionService.processExtraction(uploadId);
  }

  @Post(':uploadId/verify')
  verifyAndSave(
    @Param('uploadId', ParseIntPipe) uploadId: number,
    @Body() verifyDto: VerifyExtractionDto,
  ) {
    return this.extractionService.verifyAndSave(uploadId, verifyDto);
  }

  @Delete(':uploadId')
  deleteUpload(@Param('uploadId', ParseIntPipe) uploadId: number) {
    return this.extractionService.deleteUpload(uploadId);
  }
}
