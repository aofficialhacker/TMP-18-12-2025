import { Category } from './category.entity';
import { PlanFeatureValue } from './plan-feature-value.entity';
import { ValueType, StandardizationRules } from '../modules/extraction/types/standardization.types';
export declare class Feature {
    id: number;
    categoryId: number;
    category: Category;
    name: string;
    description: string;
    weightage: number;
    extractionKeywords: string;
    extractionPrompt: string;
    valueType: ValueType;
    standardizationRules: StandardizationRules;
    displayOrder: number;
    isActive: boolean;
    planFeatureValues: PlanFeatureValue[];
    createdAt: Date;
    updatedAt: Date;
}
