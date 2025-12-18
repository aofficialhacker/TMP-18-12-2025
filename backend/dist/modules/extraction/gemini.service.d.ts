import { ValueType, StandardizationRules } from './types/standardization.types';
export interface ExtractedFeature {
    featureId: number;
    featureName: string;
    extractedValue: string;
    confidence: string;
}
export declare class GeminiService {
    private readonly logger;
    private genAI;
    private model;
    constructor();
    extractFeaturesFromPdf(filePath: string, features: {
        id: number;
        name: string;
        extractionKeywords: string;
        extractionPrompt?: string;
    }[]): Promise<ExtractedFeature[]>;
    private mockExtraction;
    standardizeFeatureValue(extractedValue: string, featureName: string, valueType: ValueType, rules: StandardizationRules | null): Promise<string>;
    private buildStandardizationPrompt;
    private mockStandardization;
}
