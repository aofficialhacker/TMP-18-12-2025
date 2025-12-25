import { Plan } from './plan.entity';
import { BrochureUpload } from './brochure-upload.entity';
export declare class Company {
    id: number;
    name: string;
    logoUrl?: string;
    companyUrl?: string;
    description?: string;
    isActive: boolean;
    plans: Plan[];
    uploads: BrochureUpload[];
    createdAt: Date;
    updatedAt: Date;
}
