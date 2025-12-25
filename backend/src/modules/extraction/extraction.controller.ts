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
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response, Request as ExpressRequest } from 'express';

import { ExtractionService } from './extraction.service';
import { VerifyExtractionDto } from './dto/verify.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('extraction')
@UseGuards(JwtAuthGuard)
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  /* ================= EXISTING ENDPOINTS (UNCHANGED) ================= */

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
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `brochure-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(new Error('Only PDF files are allowed'), false);
        } else {
          callback(null, true);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadBrochure(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Query('companyId') companyId?: string,
    @Query('planId') planId?: string,
  ) {
    return this.extractionService.uploadBrochure(
      file,
      req.user.id,
      companyId ? +companyId : undefined,
      planId ? +planId : undefined,
    );
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

  /* ================= STEP 4.4.x — FIXED SSE PROGRESS STREAM ================= */

  @Get(':uploadId/progress')
  async streamProgress(
    @Param('uploadId', ParseIntPipe) uploadId: number,
    @Res() res: Response,
    @Request() req: ExpressRequest,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (payload: any) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    let lastProgress = -1;

    const interval = setInterval(async () => {
      try {
        const upload = await this.extractionService.getUpload(uploadId);
        const progress = upload.extractionProgress ?? 0;

        // 🔹 Send only if progress actually changed
        if (progress !== lastProgress) {
          lastProgress = progress;
          send({
            progress,
            status: upload.extractionStatus,
          });
        }

        // 🔹 Close stream on terminal states
        if (
          upload.extractionStatus === 'completed' ||
          upload.extractionStatus === 'failed'
        ) {
          clearInterval(interval);
          res.end();
        }
      } catch {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    // 🔹 Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  }
}
