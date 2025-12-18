import { ExtractionService } from './extraction.service';
import { VerifyExtractionDto } from './dto/verify.dto';
export declare class ExtractionController {
    private readonly extractionService;
    constructor(extractionService: ExtractionService);
    getAllUploads(): Promise<import("../../entities").BrochureUpload[]>;
    getUpload(uploadId: number): Promise<import("../../entities").BrochureUpload>;
    getStatus(uploadId: number): Promise<{
        status: import("../../entities").ExtractionStatus;
        message: string;
    }>;
    getResults(uploadId: number): Promise<any>;
    uploadBrochure(file: Express.Multer.File, req: any, companyId?: string, planId?: string): Promise<import("../../entities").BrochureUpload>;
    processExtraction(uploadId: number): Promise<import("../../entities").BrochureUpload>;
    verifyAndSave(uploadId: number, verifyDto: VerifyExtractionDto): Promise<import("../../entities").Plan>;
    deleteUpload(uploadId: number): Promise<{
        message: string;
    }>;
}
