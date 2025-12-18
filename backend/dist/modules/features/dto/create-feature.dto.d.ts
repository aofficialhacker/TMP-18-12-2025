import { ValueType, StandardizationRules } from '../../extraction/types/standardization.types';
export declare class CreateFeatureDto {
    categoryId: number;
    name: string;
    description?: string;
    weightage: number;
    extractionKeywords?: string[];
    extractionPrompt?: string;
    valueType?: ValueType;
    standardizationRules?: StandardizationRules;
    displayOrder?: number;
    isActive?: boolean;
}
