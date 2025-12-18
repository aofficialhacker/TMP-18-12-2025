import { Feature } from './feature.entity';
export declare class Category {
    id: number;
    name: string;
    description: string;
    weightage: number;
    displayOrder: number;
    isActive: boolean;
    features: Feature[];
    createdAt: Date;
    updatedAt: Date;
}
