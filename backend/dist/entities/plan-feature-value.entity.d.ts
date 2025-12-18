import { Plan } from './plan.entity';
import { Feature } from './feature.entity';
export declare class PlanFeatureValue {
    id: number;
    planId: number;
    plan: Plan;
    featureId: number;
    feature: Feature;
    extractedValue: string;
    verifiedValue: string;
    standardizedValue: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
