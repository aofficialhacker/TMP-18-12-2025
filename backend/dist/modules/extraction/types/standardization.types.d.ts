export declare enum ValueType {
    TEXT = "text",
    NUMERIC = "numeric",
    BOOLEAN = "boolean",
    PERCENTAGE = "percentage",
    CURRENCY = "currency",
    ENUM = "enum"
}
export interface StandardizationRules {
    allowedValues?: string[];
    mappings?: Record<string, string | number>;
    normalize?: {
        unit?: string;
        minValue?: number;
        maxValue?: number;
    };
    defaultValue?: string | number;
}
export interface StandardizedFeature {
    featureId: number;
    featureName: string;
    extractedValue: string;
    standardizedValue: string;
    confidence: string;
}
