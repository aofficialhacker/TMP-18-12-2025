import { BrochureUpload } from './brochure-upload.entity';
export declare class AdminUser {
    id: number;
    email: string;
    password: string;
    name: string;
    uploads: BrochureUpload[];
    createdAt: Date;
    updatedAt: Date;
}
