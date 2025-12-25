import { Plan } from './plan.entity';
import { Company } from './company.entity';
import { AdminUser } from './admin-user.entity';
export declare enum ExtractionStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class BrochureUpload {
    id: number;
    planId: number;
    plan: Plan;
    companyId: number;
    company: Company;
    originalFilename: string;
    storedFilename: string;
    filePath: string;
    extractionStatus: ExtractionStatus;
    extractionProgress: number;
    extractionResult: any;
    uploadedById: number;
    uploadedBy: AdminUser;
    createdAt: Date;
    updatedAt: Date;
}
