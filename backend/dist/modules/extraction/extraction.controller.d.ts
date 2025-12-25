import { Response, Request as ExpressRequest } from 'express';
import { ExtractionService } from './extraction.service';
import { VerifyExtractionDto } from './dto/verify.dto';
export declare class ExtractionController {
    private readonly extractionService;
    constructor(extractionService: ExtractionService);
    getAllUploads(): Promise<import("../../entities").BrochureUpload[]>;
    getUpload(uploadId: number): Promise<import("../../entities").BrochureUpload>;
    getStatus(uploadId: number): Promise<{
        uploadId: number;
        status: import("../../entities").ExtractionStatus;
        progress: number;
    }>;
    getResults(uploadId: number): Promise<{
        uploadId: number;
        originalFilename: string;
        extractedAt: any;
        company: import("../../entities").Company;
        plan: import("../../entities").Plan;
        features: any;
    }>;
    uploadBrochure(file: Express.Multer.File, req: any, companyId?: string, planId?: string): Promise<import("../../entities").BrochureUpload>;
    processExtraction(uploadId: number): Promise<import("../../entities").BrochureUpload>;
    verifyAndSave(uploadId: number, verifyDto: VerifyExtractionDto): Promise<import("../../entities").Plan>;
    deleteUpload(uploadId: number): Promise<{
        message: string;
    }>;
    streamProgress(uploadId: number, res: Response, req: ExpressRequest): Promise<void>;
}
