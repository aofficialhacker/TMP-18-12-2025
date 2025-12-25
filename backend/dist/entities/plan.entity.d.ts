import { Company } from './company.entity';
import { PlanFeatureValue } from './plan-feature-value.entity';
import { BrochureUpload } from './brochure-upload.entity';
export declare enum PlanStatus {
    UPLOAD_PENDING = "upload_pending",
    UPLOAD_COMPLETE = "upload_complete",
    DRAFT = "draft",
    PENDING_REVIEW = "pending_review",
    PUBLISHED = "published"
}
export declare class Plan {
    id: number;
    companyId: number;
    company: Company;
    name: string;
    sumInsuredMin: number;
    sumInsuredMax: number;
    description: string;
    brochureUrl: string;
    status: PlanStatus;
    isActive: boolean;
    featureValues: PlanFeatureValue[];
    uploads: BrochureUpload[];
    createdAt: Date;
    updatedAt: Date;
}
